
export enum AppMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  SHOP = 'SHOP',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS'
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
