
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, PaymentRecord, ActivityLog, Project, SupportMessage } from '../types';

const SUPABASE_URL = 'https://qptiryvtzbqhaeexxeij.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGlyeXZ0emJxaGFlZXh4ZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTM2OTMsImV4cCI6MjA4NTYyOTY5M30.0TYs_0BU_5-EYCRKNGJkm5LzLm54Kcm82Gwil32VmDE';

export class DatabaseService {
  private static instance: DatabaseService;
  public supabase: SupabaseClient;
  
  private constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async getCurrentSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) console.error("Session fetch error:", error);
    return session;
  }

  // Fix: Standardized return type to include session to match App.tsx requirements
  async signUp(email: string, password: string): Promise<{ user: any; session: any; error: any }> {
    const { data, error } = await this.supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    
    if (data?.user && !error) {
      try {
        await this.syncUserProfile(data.user.id, email.trim().toLowerCase());
      } catch (e) {
        console.error("Profile sync failed:", e);
      }
    }
    
    return { user: data?.user, session: data?.session, error };
  }

  // Fix: Standardized return type to include user and session for consistent destructuring
  async signIn(email: string, password: string): Promise<{ user: any; session: any; error: any }> {
    const cleanEmail = email.trim().toLowerCase();
    
    // Force login bypass for the requested user
    if (cleanEmail === 'rajshahi.shojib@gmail.com' && password === '786400') {
      console.log("Force Authorizing specific user...");
      
      // Attempt real login first
      let { data, error } = await this.supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // If real login fails (rate limit or invalid creds), we bypass it
      if (error) {
        // Try to see if user exists in our 'users' table
        const userObj = await this.getUser(cleanEmail);
        if (userObj) {
          // If user exists in table, we return a mock session to let them in
          localStorage.setItem('df_force_login', cleanEmail);
          return { 
            user: { email: cleanEmail, id: userObj.id }, 
            session: { user: { email: cleanEmail, id: userObj.id } }, 
            error: null 
          };
        } else {
          // If user doesn't even exist in 'users' table, try to create them
          const signUpResult = await this.signUp(cleanEmail, password);
          if (!signUpResult.error) {
             const retry = await this.supabase.auth.signInWithPassword({ email: cleanEmail, password });
             return { user: retry.data?.user, session: retry.data?.session, error: retry.error };
          }
          return { user: null, session: null, error: signUpResult.error };
        }
      }
      return { user: data?.user, session: data?.session, error };
    }
    
    // Normal login for others
    // Fix: Explicitly return data.session and data.user to satisfy interface and fix assignability error
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    return { user: data?.user, session: data?.session, error };
  }

  async loginWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    return { data, error };
  }

  private async syncUserProfile(id: string, email: string, name?: string) {
    const { data: existing } = await this.supabase.from('users').select('id').eq('id', id).maybeSingle();
    
    if (!existing) {
      const { error } = await this.supabase.from('users').insert([{ 
        id,
        email: email.toLowerCase(), 
        tokens: 10,
        name: name || email.split('@')[0]
      }]);
      
      if (error) console.error("DB User Profile insert error:", error);
    }
  }

  async getUser(email: string): Promise<User | null> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      // Only select columns that exist in the schema to avoid 'avatar_url' error
      const { data: user, error } = await this.supabase
        .from('users')
        .select('id, email, name, tokens, created_at')
        .eq('email', cleanEmail)
        .maybeSingle();
      
      if (error || !user) {
        return null;
      }
      
      const { data: payments } = await this.supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      const { data: activity } = await this.supabase.from('activity_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

      return {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        tokens: user.tokens || 0,
        isLoggedIn: true,
        payments: payments?.map((p: any) => ({ ...p, timestamp: new Date(p.created_at).getTime() })) || [],
        activity: activity?.map((a: any) => ({ ...a, timestamp: new Date(a.created_at).getTime() })) || [],
        joinedAt: new Date(user.created_at).getTime(),
        isAdmin: cleanEmail === 'rajshahi.jibon@gmail.com'
      };
    } catch (e) {
      console.error("Error fetching user object:", e);
      return null;
    }
  }

  async signOut() {
    await this.supabase.auth.signOut();
    localStorage.removeItem('df_force_login');
    localStorage.clear();
  }

  async useToken(userId: string, email: string, actionName: string): Promise<User | null> {
    if (!userId) return null;
    const { data: user } = await this.supabase.from('users').select('tokens').eq('id', userId).single();
    if (user && user.tokens > 0) {
      const newTotal = user.tokens - 1;
      await this.supabase.from('users').update({ tokens: newTotal }).eq('id', userId);
      await this.supabase.from('activity_logs').insert([{ user_id: userId, action: actionName, token_change: -1 }]);
    }
    return this.getUser(email);
  }
}
