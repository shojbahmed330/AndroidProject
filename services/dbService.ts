
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { User } from '../types';

const SUPABASE_URL = 'https://qptiryvtzbqhaeexxeij.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGlyeXZ0emJxaGFlZXh4ZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTM2OTMsImV4cCI6MjA4NTYyOTY5M30.0TYs_0BU_5-EYCRKNGJkm5LzLm54Kcm82Gwil32VmDE';

export class DatabaseService {
  private static instance: DatabaseService;
  public supabase: SupabaseClient;
  
  private constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  async getCurrentSession() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session;
    } catch (e) {
      return null;
    }
  }

  async signUp(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    
    // Master Bypass
    if (cleanEmail === 'rajshahi.shojib@gmail.com' && password === '786400') {
      localStorage.setItem('df_force_login', cleanEmail);
      return { user: { email: cleanEmail }, session: { user: { email: cleanEmail } }, error: null };
    }

    return await this.supabase.auth.signUp({ email: cleanEmail, password });
  }

  async signIn(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    
    if (cleanEmail === 'rajshahi.shojib@gmail.com' && password === '786400') {
      localStorage.setItem('df_force_login', cleanEmail);
      return { user: { email: cleanEmail }, session: { user: { email: cleanEmail } }, error: null };
    }
    
    return await this.supabase.auth.signInWithPassword({ email: cleanEmail, password });
  }

  async loginWithGoogle() {
    return await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  }

  async getUser(email: string, id?: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      // ১. প্রথমে ডেটাবেস থেকে ইউজার খোঁজা
      let { data: user } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();
      
      // ২. যদি ইউজার অথেনটিকেটেড থাকে কিন্তু টেবিলে না থাকে (যেমন নতুন Google User), তবে নতুন প্রোফাইল তৈরি করা
      if (!user && id) {
        const { data: newUser, error: createError } = await this.supabase
          .from('users')
          .insert([{ 
            id,
            email: cleanEmail, 
            tokens: 10,
            name: cleanEmail.split('@')[0]
          }])
          .select()
          .single();
        
        if (!createError) user = newUser;
      }
      
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
          joinedAt: new Date(user.created_at || Date.now()).getTime(),
          isAdmin: cleanEmail === 'rajshahi.jibon@gmail.com' || cleanEmail === 'rajshahi.shojib@gmail.com'
        };
      }
    } catch (e) {
      console.error("Database getUser Error:", e);
    }

    // Master Bypass Fallback
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
    localStorage.removeItem('df_force_login');
    try { await this.supabase.auth.signOut(); } catch (e) {}
    window.location.href = window.location.origin;
  }

  async useToken(userId: string, email: string, actionName: string): Promise<User | null> {
    if (email === 'rajshahi.shojib@gmail.com') return this.getUser(email);
    try {
      const { data: user } = await this.supabase.from('users').select('tokens').eq('id', userId).single();
      if (user && user.tokens > 0) {
        await this.supabase.from('users').update({ tokens: user.tokens - 1 }).eq('id', userId);
      }
    } catch (e) {}
    return this.getUser(email, userId);
  }
}
