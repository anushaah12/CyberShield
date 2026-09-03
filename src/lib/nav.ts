import { Shield, Link2, KeyRound, BookOpen, Siren, Target, Settings, UserRound } from 'lucide-react';

export type ViewId =
  | 'dashboard'
  | 'url-checker'
  | 'password'
  | 'awareness'
  | 'report'
  | 'threat-map'
  | 'settings'
  | 'about';

export const NAV_ITEMS: { id: ViewId; label: string; icon: typeof Shield }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Shield },
  { id: 'url-checker', label: 'URL Threat Checker', icon: Link2 },
  { id: 'password', label: 'Password Strength', icon: KeyRound },
  { id: 'awareness', label: 'Cyber Awareness', icon: BookOpen },
  { id: 'report', label: 'Report a Threat', icon: Siren },
  { id: 'threat-map', label: 'Threat Map', icon: Target },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About', icon: UserRound },
];
