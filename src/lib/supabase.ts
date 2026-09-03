import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UrlScan = {
  id: string;
  url: string;
  domain: string | null;
  verdict: 'safe' | 'suspicious' | 'dangerous';
  risk_score: number;
  reasons: string[];
  created_at: string;
};

export type ThreatReport = {
  id: string;
  reporter_name: string | null;
  report_type:
    | 'phishing'
    | 'malware'
    | 'data_breach'
    | 'social_engineering'
    | 'identity_theft'
    | 'other';
  threat_url: string | null;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'reviewing' | 'resolved';
  created_at: string;
};

export type AwarenessArticle = {
  id: string;
  slug: string;
  title: string;
  category:
    | 'phishing'
    | 'passwords'
    | 'privacy'
    | 'malware'
    | 'social'
    | 'data';
  summary: string;
  content: string;
  read_time: number;
  created_at: string;
};
