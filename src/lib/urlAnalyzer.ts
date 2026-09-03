export type UrlVerdict = 'safe' | 'suspicious' | 'dangerous';

export type UrlAnalysisResult = {
  url: string;
  domain: string | null;
  verdict: UrlVerdict;
  riskScore: number;
  reasons: string[];
};

const SUSPICIOUS_TLDS = [
  '.zip',
  '.mov',
  '.xyz',
  '.top',
  '.click',
  '.country',
  '.kim',
  '.cricket',
  '.science',
  '.work',
  '.party',
  '.gq',
  '.tk',
  '.ml',
  '.cf',
  '.ga',
  '.ru',
  '.cn',
  '.biz',
  '.info',
];

const SHORTENER_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'rebrand.ly',
  'cutt.ly',
  'shorturl.at',
  'tiny.cc',
  'soo.gd',
  'rb.gy',
  'shorte.st',
  'adf.ly',
];

const HIGH_RISK_KEYWORDS = [
  'login',
  'signin',
  'verify',
  'account',
  'update',
  'confirm',
  'secure',
  'bank',
  'paypal',
  'wallet',
  'password',
  'reset',
  'unlock',
  'suspended',
  'validate',
  'billing',
  'invoice',
  'payment',
  'free',
  'gift',
  'prize',
  'winner',
  'claim',
  'crypto',
  'airdrop',
];

const BRAND_IMPERSONATION = [
  'paypal',
  'apple',
  'microsoft',
  'google',
  'amazon',
  'netflix',
  'facebook',
  'instagram',
  'bank',
  'chase',
  'wellsfargo',
  'citibank',
  'amex',
  'visa',
  'mastercard',
];

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function countSubdomains(domain: string): number {
  const parts = domain.split('.');
  // e.g. login.secure.account.bank.com => 4 subdomain parts before the registrable domain
  return Math.max(0, parts.length - 2);
}

function hasIpAddress(url: string): boolean {
  const domain = extractDomain(url);
  if (!domain) return false;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(domain);
}

function hasAtSignOrRedirect(url: string): boolean {
  // an @ in the URL before the path can hide the real destination
  try {
    const u = new URL(url);
    return u.username.length > 0;
  } catch {
    return false;
  }
}

export function analyzeUrl(rawUrl: string): UrlAnalysisResult {
  const reasons: string[] = [];
  let score = 0;

  let url = rawUrl.trim();
  if (!url) {
    return {
      url: '',
      domain: null,
      verdict: 'safe',
      riskScore: 0,
      reasons: [],
    };
  }

  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  if (!isValidUrl(url)) {
    return {
      url: rawUrl,
      domain: null,
      verdict: 'dangerous',
      riskScore: 100,
      reasons: ['Not a valid web address. It cannot be checked or visited safely.'],
    };
  }

  const domain = extractDomain(url);
  const lowerUrl = url.toLowerCase();

  // No HTTPS
  if (!url.toLowerCase().startsWith('https://')) {
    reasons.push('Uses an unencrypted http:// connection — data sent to this site is not protected.');
    score += 15;
  }

  // Suspicious TLD
  if (domain) {
    for (const tld of SUSPICIOUS_TLDS) {
      if (domain.endsWith(tld)) {
        reasons.push(`Uses a high-abuse top-level domain (${tld}) frequently associated with malicious sites.`);
        score += 25;
        break;
      }
    }
  }

  // IP address instead of domain
  if (hasIpAddress(url)) {
    reasons.push('Links directly to a numeric IP address instead of a named domain — a common malware distribution pattern.');
    score += 30;
  }

  // Many subdomains (brand impersonation pattern: login.paypal.com.evil.tk)
  if (domain) {
    const subCount = countSubdomains(domain);
    if (subCount >= 3) {
      reasons.push(`Has an unusually deep subdomain structure (${subCount} levels) — often used to disguise the real domain.`);
      score += 20;
    }
  }

  // Brand impersonation in domain
  if (domain) {
    for (const brand of BRAND_IMPERSONATION) {
      // brand name present but not the real registrable domain
      if (domain.includes(brand) && !domain.endsWith(brand + '.com') && !domain.endsWith(brand + '.net')) {
        reasons.push(`Contains the brand name "${brand}" in a domain that does not belong to the real ${brand}.com — a likely impersonation.`);
        score += 30;
        break;
      }
    }
  }

  // High-risk keywords in path/query
  const pathQuery = lowerUrl.replace(/^https?:\/\/[^/]+/i, '');
  const matchedKeywords = HIGH_RISK_KEYWORDS.filter((k) => pathQuery.includes(k));
  if (matchedKeywords.length >= 2) {
    reasons.push(`Contains multiple sensitive keywords (${matchedKeywords.slice(0, 3).join(', ')}) — typical of credential-harvesting pages.`);
    score += 15;
  } else if (matchedKeywords.length === 1) {
    score += 5;
  }

  // URL shortener
  if (domain && SHORTENER_DOMAINS.some((s) => domain === s || domain.endsWith('.' + s))) {
    reasons.push('Uses a URL shortener that hides the real destination — expand it before trusting.');
    score += 20;
  }

  // Embedded @ or user info
  if (hasAtSignOrRedirect(url)) {
    reasons.push('Contains embedded credentials (@user:pass) that can hide the true destination.');
    score += 25;
  }

  // Excessive length
  if (url.length > 150) {
    reasons.push('Unusually long URL — sometimes used to bury the real destination in noise.');
    score += 10;
  }

  // Lots of query params
  try {
    const u = new URL(url);
    if (u.searchParams.toString().length > 100) {
      reasons.push('Carries a large amount of tracking/redirect data in the query string.');
      score += 10;
    }
  } catch {
    // ignore
  }

  // Hyphen-heavy domain (e.g. paypal-secure-login.com)
  if (domain && (domain.match(/-/g) || []).length >= 3) {
    reasons.push('Domain is heavily hyphenated — a common trick to mimic a trusted brand name.');
    score += 15;
  }

  score = Math.min(100, score);

  let verdict: UrlVerdict = 'safe';
  if (score >= 60) verdict = 'dangerous';
  else if (score >= 25) verdict = 'suspicious';

  if (reasons.length === 0 && verdict === 'safe') {
    reasons.push('No high-risk signals detected. The URL structure looks normal.');
  }

  return { url, domain, verdict, riskScore: score, reasons };
}
