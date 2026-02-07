
export enum AppMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  DEPLOYED = 'DEPLOYED',
  LOGS = 'LOGS',
  SHOP = 'SHOP',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT'
}

export interface SupportMessage {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  timestamp: number;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  user_email?: string;
  amount: string;
  tokens: number;
  method: string; // bKash, Nagad, Card, etc.
  status: string;
  timestamp: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  tokenChange: number;
  timestamp: number;
  user_email?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  tokens: number;
  isLoggedIn: boolean;
  joinedAt: number;
  payments: PaymentRecord[];
  activity: ActivityLog[];
  isAdmin?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  thought?: string;
  plan?: string[];
  choices?: any[];
  errorContext?: string;
}

export interface Project {
  id: string;
  name: string;
  files: Record<string, string>;
  mainFile: string;
  messages: ChatMessage[];
  lastUpdated: number;
  version: number;
  user_email?: string;
}
