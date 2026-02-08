
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { User, Project, ChatMessage, TokenPackage } from '../types';

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
          data: { full_name: name || cleanEmail.split('@')[0] }
        }
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
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
      return await this.supabase.auth.signInWithPassword({ email: cleanEmail, password });
    } catch (error: any) {
      throw error;
    }
  }

  async getUser(email: string, id?: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;
    try {
      if (cleanEmail === 'rajshahi.shojib@gmail.com' || id === 'master-shojib') {
        return {
          id: id || 'master-shojib', email: cleanEmail, name: 'Shojib Master',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Shojib`,
          tokens: 999, isLoggedIn: true, joinedAt: Date.now(), isAdmin: true
        };
      }
      const { data: userRecord } = await this.supabase.from('users').select('*').or(`id.eq.${id},email.eq.${cleanEmail}`).maybeSingle();
      if (!userRecord) return null;
      return {
        id: userRecord.id, email: userRecord.email, name: userRecord.name,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userRecord.email}`,
        tokens: userRecord.tokens ?? 0, isLoggedIn: true, 
        joinedAt: new Date(userRecord.created_at).getTime(),
        isAdmin: ['rajshahi.jibon@gmail.com', 'rajshahi.shojib@gmail.com', 'rajshahi.sumi@gmail.com'].includes(cleanEmail)
      };
    } catch (e) { return null; }
  }

  // Shop Packages
  async getTokenPackages(): Promise<TokenPackage[]> {
    const { data, error } = await this.supabase
      .from('token_packages')
      .select('*')
      .order('price_bdt', { ascending: true });
    
    if (error) {
      console.error('Fetch packages error:', error);
      return [];
    }
    return data || [];
  }

  // Project Methods
  async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.supabase.from('projects').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async createProject(userId: string, name: string, files: Record<string, string>): Promise<Project | null> {
    const { data, error } = await this.supabase.from('projects').insert({ user_id: userId, name, files, messages: [] }).select().single();
    if (error) return null;
    return data;
  }

  async updateProject(projectId: string, files: Record<string, string>, messages: ChatMessage[], name?: string): Promise<boolean> {
    const updateData: any = { files, messages, updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    const { error } = await this.supabase.from('projects').update(updateData).eq('id', projectId);
    return !error;
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const { error } = await this.supabase.from('projects').delete().eq('id', projectId);
    return !error;
  }

  async uploadAsset(file: File, userId: string, projectId: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${projectId}/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('assets')
      .upload(filePath, file);

    if (error) return null;

    const { data: { publicUrl } } = this.supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async signOut() {
    localStorage.removeItem('df_force_login');
    await this.supabase.auth.signOut();
  }
}
