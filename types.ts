
export enum AppMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  SHOP = 'SHOP',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  PROJECTS = 'PROJECTS'
}

export interface GithubConfig {
  token: string;
  repo: string;
  owner: string;
}

export interface ChoiceOption {
  label: string;
  value: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  inputType?: 'single' | 'multiple' | 'text';
  options?: ChoiceOption[];
  choices?: { label: string; prompt: string }[];
  files?: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  tokens: number;
  isLoggedIn: boolean;
  joinedAt: number;
  isAdmin?: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  files: Record<string, string>;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface TokenPackage {
  id: string;
  name: string;
  token_count: number;
  price_bdt: number;
  is_popular: boolean;
}
