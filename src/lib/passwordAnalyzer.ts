export type PasswordVerdict = 'weak' | 'fair' | 'strong' | 'very-strong';

export type PasswordAnalysis = {
  score: number; // 0-100
  verdict: PasswordVerdict;
  entropy: number; // bits
  crackTime: string;
  length: number;
  checks: { label: string; passed: boolean }[];
  suggestions: string[];
};

const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '12345678',
  '123456789',
  'qwerty',
  'abc123',
  '111111',
  '1234567',
  'password1',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'sunshine',
  'iloveyou',
  'princess',
  'football',
  'baseball',
  'superman',
  'batman',
  'trustno1',
  '000000',
  '654321',
  '123123',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  '1q2w3e4r',
  'passw0rd',
  'p@ssw0rd',
  'changeme',
]);

function charsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 33;
  return size;
}

function formatCrackTime(seconds: number): string {
  if (seconds < 1) return 'instantly';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)} thousand years`;
  if (years < 1e9) return `${Math.round(years / 1e6)} million years`;
  if (years < 1e12) return `${Math.round(years / 1e9)} billion years`;
  return 'centuries';
}

export function analyzePassword(password: string): PasswordAnalysis {
  const length = password.length;
  const charset = charsetSize(password);
  const entropy = length > 0 ? Math.round(length * Math.log2(charset || 1)) : 0;

  // Assume 10 billion guesses/sec (offline fast attack)
  const guesses = Math.pow(2, entropy);
  const seconds = guesses / 1e10;
  const crackTime = formatCrackTime(seconds);

  const checks = [
    { label: 'At least 12 characters', passed: length >= 12 },
    { label: 'Lowercase letters', passed: /[a-z]/.test(password) },
    { label: 'Uppercase letters', passed: /[A-Z]/.test(password) },
    { label: 'Numbers', passed: /[0-9]/.test(password) },
    { label: 'Symbols', passed: /[^a-zA-Z0-9]/.test(password) },
    { label: 'No common patterns', passed: !COMMON_PASSWORDS.has(password.toLowerCase()) },
    { label: 'No repeating characters', passed: !/(.)\1{2,}/.test(password) },
    { label: 'No sequential characters', passed: !hasSequence(password) },
  ];

  const suggestions: string[] = [];
  if (length < 12) suggestions.push('Make it longer — at least 12 characters, ideally a passphrase of 4 random words.');
  if (!/[A-Z]/.test(password)) suggestions.push('Add some uppercase letters.');
  if (!/[0-9]/.test(password)) suggestions.push('Add numbers.');
  if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Add symbols like !, @, # to widen the character set.');
  if (COMMON_PASSWORDS.has(password.toLowerCase())) suggestions.push('This is one of the most commonly cracked passwords — change it entirely.');
  if (/(.)\1{2,}/.test(password)) suggestions.push('Avoid repeating the same character (e.g. aaa, 111).');
  if (hasSequence(password)) suggestions.push('Avoid keyboard or number sequences (abc, 123, qwerty).');
  if (suggestions.length === 0) suggestions.push('Excellent password. Use a password manager so you never have to reuse it.');

  // Score: blend of entropy and checks
  const passedCount = checks.filter((c) => c.passed).length;
  const checkScore = (passedCount / checks.length) * 40;
  const entropyScore = Math.min(60, (entropy / 80) * 60);
  let score = Math.round(checkScore + entropyScore);

  // Penalize common passwords hard
  if (COMMON_PASSWORDS.has(password.toLowerCase())) score = Math.min(score, 15);
  if (length === 0) score = 0;

  score = Math.max(0, Math.min(100, score));

  let verdict: PasswordVerdict = 'weak';
  if (score >= 80) verdict = 'very-strong';
  else if (score >= 60) verdict = 'strong';
  else if (score >= 35) verdict = 'fair';

  return { score, verdict, entropy, crackTime, length, checks, suggestions };
}

function hasSequence(password: string): boolean {
  const lower = password.toLowerCase();
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
  ];
  for (const seq of sequences) {
    for (let i = 0; i + 3 <= seq.length; i++) {
      const fwd = seq.slice(i, i + 3);
      const rev = fwd.split('').reverse().join('');
      if (lower.includes(fwd) || lower.includes(rev)) return true;
    }
  }
  return false;
}
