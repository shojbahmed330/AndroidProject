
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { User } from '../types';

/**
 * গুরুত্বপূর্ণ নির্দেশাবলী:
 * ১. আপনার সুপাবেস ড্যাশবোর্ডে যান (Project Settings > API)।
 * ২. 'Project URL' কপি করে নিচের SUPABASE_URL এ বসান।
 * ৩. 'anon public key' কপি করে নিচের SUPABASE_ANON_KEY তে বসান।
 * এই দুটি তথ্য ভুল থাকলে বা খালি থাকলে "Failed to fetch" এরর আসবে।
 */
const SUPABASE_URL = 'https://ajgrlnqzwwdliaelvgoq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZ3JsbnF6d3dkbGlhZWx2Z29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NzQ5NjAsImV4cCI6MjA4NjA1MDk2MH0.Y39Ly94CXedvrheLKYZB8DYKwZjr6rJlaDOq_8crVkU';

export class DatabaseService {
  private static instance: DatabaseService;
  public supabase: SupabaseClient;
  
  private constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
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

  async signUp(email: string, password: string, name?: string) {
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      const response = await this.supabase.auth.signUp({ 
        email: cleanEmail, 
        password,
        options: { 
          emailRedirectTo: window.location.origin,
          data: {
            full_name: name || cleanEmail.split('@')[0]
          }
        }
      });
      return response;
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error("সুপাবেস কানেকশন এরর: আপনার SUPABASE_URL এবং ANON_KEY সঠিক কিনা তা নিশ্চিত করুন।");
      }
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    
    // মাস্টার এডমিন হ্যান্ডলিং
    if (cleanEmail === 'rajshahi.shojib@gmail.com' && password === '786400') {
      localStorage.setItem('df_force_login', cleanEmail);
      return { 
        data: { 
          user: { email: cleanEmail, id: 'master-shojib' } as any, 
          session: { user: { email: cleanEmail, id: 'master-shojib' } } as any 
        }, 
        error: null 
      };
    }

    try {
      const response = await this.supabase.auth.signInWithPassword({ email: cleanEmail, password });
      return response;
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error("সুপাবেস কানেকশন এরর: সার্ভারের সাথে যোগাযোগ করা সম্ভব হচ্ছে না।");
      }
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      return await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: window.location.origin
        }
      });
    } catch (error: any) {
      throw new Error("গুগল লগইন এরর: " + error.message);
    }
  }

  async resetPassword(email: string) {
    return await this.supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/update-password`,
    });
  }

  async updatePassword(newPassword: string) {
    return await this.supabase.auth.updateUser({ password: newPassword });
  }

  async getUser(email: string, id?: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;
    
    try {
      if (cleanEmail === 'rajshahi.shojib@gmail.com' || id === 'master-shojib') {
        return {
          id: id || 'master-shojib',
          email: cleanEmail,
          name: 'Shojib Master',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Shojib`,
          tokens: 999,
          isLoggedIn: true,
          joinedAt: Date.now(),
          isAdmin: true
        };
      }

      const { data: userRecord, error } = await this.supabase
        .from('users')
        .select('*')
        .or(`id.eq.${id || '00000000-0000-0000-0000-000000000000'},email.eq.${cleanEmail}`)
        .maybeSingle();

      if (error || !userRecord) return null;

      const isAdminEmail = cleanEmail === 'rajshahi.jibon@gmail.com' || 
                          cleanEmail === 'rajshahi.shojib@gmail.com' || 
                          cleanEmail === 'rajshahi.sumi@gmail.com';

      return {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name || userRecord.email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userRecord.email}`,
        tokens: userRecord.tokens ?? 0,
        isLoggedIn: true,
        joinedAt: new Date(userRecord.created_at || Date.now()).getTime(),
        isAdmin: isAdminEmail
      };

    } catch (e) {
      return null;
    }
  }

  async signOut() {
    localStorage.removeItem('df_force_login');
    try { 
      await this.supabase.auth.signOut(); 
    } catch (e) {
      console.error("SignOut error", e);
    }
  }

  async useToken(userId: string, email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'rajshahi.shojib@gmail.com') return this.getUser(email);
    try {
      const { data: user } = await this.supabase.from('users').select('tokens').eq('id', userId).single();
      if (user && user.tokens > 0) {
        await this.supabase.from('users').update({ tokens: user.tokens - 1 }).eq('id', userId);
      }
    } catch (e) {}
    return this.getUser(email, userId);
  }
}
