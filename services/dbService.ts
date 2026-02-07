
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
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      return session;
    } catch (e) {
      return null;
    }
  }

  async signUp(email: string, password: string): Promise<{ user: any; session: any; error: any }> {
    const cleanEmail = email.trim().toLowerCase();
    
    // Bypass for specific credentials to prevent rate limits
    if (cleanEmail === 'rajshahi.shojib@gmail.com' && password === '786400') {
      localStorage.setItem('df_force_login', cleanEmail);
      return { user: { email: cleanEmail }, session: { user: { email: cleanEmail } }, error: null };
    }

    const { data, error } = await this.supabase.auth.signUp({
      email: cleanEmail,
      password,
    });
    
    if (data?.user && !error) {
      await this.syncUserProfile(data.user.id, cleanEmail);
    }
    
    return { user: data?.user, session: data?.session, error };
  }

  async signIn(email: string, password: string): Promise<{ user: any; session: any; error: any }> {
    const cleanEmail = email.trim().toLowerCase();
    
    // ABSOLUTE BYPASS: No Supabase call for these credentials
    if (cleanEmail === 'rajshahi.shojib@gmail.com' && password === '786400') {
      console.log("System: Master Bypass Active.");
      localStorage.setItem('df_force_login', cleanEmail);
      return { 
        user: { email: cleanEmail, id: 'master-shojib' }, 
        session: { user: { email: cleanEmail, id: 'master-shojib' } }, 
        error: null 
      };
    }
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    return { user: data?.user, session: data?.session, error };
  }

  async loginWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    return { data, error };
  }

  private async syncUserProfile(id: string, email: string, name?: string) {
    try {
      const { data: existing } = await this.supabase.from('users').select('id').eq('id', id).maybeSingle();
      if (!existing) {
        await this.supabase.from('users').insert([{ 
          id,
          email: email.toLowerCase(), 
          tokens: 100, // Giving 100 tokens as bonus
          name: name || email.split('@')[0]
        }]);
      }
    } catch (e) {}
  }

  async getUser(email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('id, email, name, tokens, created_at')
        .eq('email', cleanEmail)
        .maybeSingle();
      
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
          tokens: user.tokens || 0,
          isLoggedIn: true,
          payments: [],
          activity: [],
          joinedAt: new Date(user.created_at).getTime(),
          isAdmin: true // Giving admin access to Shojib
        };
      }
    } catch (e) {}

    // Fallback for Master Account if DB sync fails
    if (cleanEmail === 'rajshahi.shojib@gmail.com') {
      return {
        id: 'master-shojib',
        email: cleanEmail,
        name: 'Shojib Master',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Shojib`,
        tokens: 999,
        isLoggedIn: true,
        payments: [],
        activity: [],
        joinedAt: Date.now(),
        isAdmin: true
      };
    }

    return null;
  }

  async signOut() {
    try { await this.supabase.auth.signOut(); } catch (e) {}
    localStorage.removeItem('df_force_login');
    localStorage.clear();
  }

  async useToken(userId: string, email: string, actionName: string): Promise<User | null> {
    if (email === 'rajshahi.shojib@gmail.com') return this.getUser(email);
    
    try {
      const { data: user } = await this.supabase.from('users').select('tokens').eq('id', userId).single();
      if (user && user.tokens > 0) {
        await this.supabase.from('users').update({ tokens: user.tokens - 1 }).eq('id', userId);
      }
    } catch (e) {}
    return this.getUser(email);
  }
}
