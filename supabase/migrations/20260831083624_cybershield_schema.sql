/*
# CYBERSHIELD — Cybersecurity Toolkit Schema

## Overview
Creates the backend for a cybersecurity awareness toolkit with four features:
URL Threat Checker, Password Strength Analyzer, Cyber Awareness library,
and a Report-a-Threat form. This is a single-tenant app (no sign-in), so all
policies are scoped to `anon, authenticated` and the data is intentionally
public/shared.

## New Tables
- `url_scans` — records every URL a visitor checks, with the verdict and
  detailed reasons. Lets us show a "recent community scans" feed.
  - `id` uuid PK
  - `url` text NOT NULL — the URL that was checked
  - `domain` text — extracted hostname, for quick display
  - `verdict` text NOT NULL — 'safe' | 'suspicious' | 'dangerous'
  - `risk_score` int — 0-100 computed risk
  - `reasons` jsonb — array of signal strings explaining the verdict
  - `created_at` timestamptz DEFAULT now()
- `threat_reports` — visitor-submitted reports of suspicious activity.
  - `id` uuid PK
  - `reporter_name` text — optional, nullable
  - `report_type` text NOT NULL — 'phishing' | 'malware' | 'data_breach' |
    'social_engineering' | 'identity_theft' | 'other'
  - `threat_url` text — optional URL the report is about
  - `description` text NOT NULL — what happened
  - `severity` text NOT NULL DEFAULT 'medium' — 'low' | 'medium' | 'high' | 'critical'
  - `status` text NOT NULL DEFAULT 'submitted' — 'submitted' | 'reviewing' | 'resolved'
  - `created_at` timestamptz DEFAULT now()
- `awareness_articles` — educational content for the Cyber Awareness section.
  - `id` uuid PK
  - `slug` text UNIQUE NOT NULL
  - `title` text NOT NULL
  - `category` text NOT NULL — 'phishing' | 'passwords' | 'privacy' | 'malware' | 'social' | 'data' | 'others'
  - `summary` text NOT NULL
  - `content` text NOT NULL — markdown-ish body text
  - `read_time` int — estimated minutes
  - `created_at` timestamptz DEFAULT now()

## Security
- RLS enabled on all three tables.
- All policies use `TO anon, authenticated` because this is a no-auth,
  intentionally public/shared app. `USING (true)` / `WITH CHECK (true)` is
  documented here as the intended behavior, not a fallback.
- `url_scans`: anon can SELECT + INSERT (no update/delete).
- `threat_reports`: anon can SELECT + INSERT (no update/delete — status changes
  are an admin concern, not exposed to the anon client).
- `awareness_articles`: anon can SELECT only (content is curated).

## Notes
1. The frontend computes URL risk scores client-side from URL heuristics; the
   table stores the result so the community feed persists across reloads.
2. Password analysis is fully client-side — no password text is ever stored.
3. Awareness articles are seeded so the Cyber Awareness tab has content on
   first load.
*/

CREATE TABLE IF NOT EXISTS url_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  domain text,
  verdict text NOT NULL CHECK (verdict IN ('safe','suspicious','dangerous')),
  risk_score int NOT NULL DEFAULT 0,
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE url_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_url_scans" ON url_scans;
CREATE POLICY "anon_select_url_scans" ON url_scans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_url_scans" ON url_scans;
CREATE POLICY "anon_insert_url_scans" ON url_scans FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_url_scans_created_at ON url_scans (created_at DESC);

CREATE TABLE IF NOT EXISTS threat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text,
  report_type text NOT NULL CHECK (report_type IN ('phishing','malware','data_breach','social_engineering','identity_theft','other')),
  threat_url text,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewing','resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE threat_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_threat_reports" ON threat_reports;
CREATE POLICY "anon_select_threat_reports" ON threat_reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_threat_reports" ON threat_reports;
CREATE POLICY "anon_insert_threat_reports" ON threat_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_threat_reports_created_at ON threat_reports (created_at DESC);

CREATE TABLE IF NOT EXISTS awareness_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('phishing','passwords','privacy','malware','social','data','others')),
  summary text NOT NULL,
  content text NOT NULL,
  read_time int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE awareness_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_awareness_articles" ON awareness_articles;
CREATE POLICY "anon_select_awareness_articles" ON awareness_articles FOR SELECT
  TO anon, authenticated USING (true);

-- Seed awareness articles
INSERT INTO awareness_articles (slug, title, category, summary, content, read_time) VALUES
('spotting-phishing-emails', 'Spotting Phishing Emails', 'phishing', 'How to recognize phishing emails before they trick you.', 'Phishing emails are fraudulent messages designed to steal your credentials or install malware. Look for these red flags:

1. Urgency and threats — "Your account will be closed in 24 hours" is designed to make you panic and act before thinking.
2. Mismatched sender addresses — the display name says "PayPal" but the actual email address is paypal@secure-account-verify.com.
3. Generic greetings — "Dear Customer" instead of your real name. Real institutions usually personalize.
4. Suspicious links — hover over any link before clicking. The visible text and the actual URL are often different.
5. Unexpected attachments — especially .exe, .zip, or macro-enabled Office documents.
6. Spelling and grammar errors — professional organizations proofread. Frequent errors are a warning sign.

The golden rule: when in doubt, do not click. Go directly to the organization''s website by typing the address yourself, or call them using a number from their official site — never the number in the email.', 6),
('phishing-smishing-vishing', 'Phishing Beyond Email: Smishing & Vishing', 'phishing', 'Learn how attackers use SMS and phone calls to steal credentials.', 'Phishing is not just email. Attackers use multiple channels to reach you:

Smishing (SMS Phishing):
Fraudulent text messages often contain shortened URLs or request urgent action. "Your bank account is locked. Confirm identity here: [link]" is a classic smishing attack. Never click links in unexpected texts from companies. Instead, call the company directly using a number from their official website.

Vishing (Voice Phishing):
Attackers call you impersonating banks, governments, or IT departments. They create urgency: "We detected fraud on your account. Verify your Social Security number now." Real institutions do not ask for sensitive data over the phone. Hang up, verify the caller independently by looking up the official number, and call back.

Wishing (WhatsApp/Messaging Apps):
Phishing through WhatsApp, Telegram, or Facebook Messenger. These are harder to detect because the interface looks legitimate. Never click links from unknown senders.

Protection:
1. Be skeptical of unsolicited contact requesting personal or financial information.
2. Legitimate organizations will not ask you to "confirm" information via text or phone call.
3. When in doubt, hang up and call the organization directly using a number you find independently.
4. Register your phone for a spam/robocall filter service.', 7),
('spear-phishing-targeted-attacks', 'Spear Phishing: Highly Targeted Attacks', 'phishing', 'How attackers use personal information to make phishing convincing.', 'Spear phishing is phishing with preparation. Instead of sending millions of generic emails, attackers research you first and craft a message tailored to you.

How it works:
1. Reconnaissance — the attacker gathers information about you from LinkedIn, company websites, social media, and data breaches. They learn your boss''s name, recent projects, conferences you attended.
2. Personalization — the email comes from a trusted-looking sender ("Hi [Your Name], Your boss asked me to...") with details that make it seem legitimate.
3. Urgency — "Need this spreadsheet by 3 PM" or "Urgent payroll update required."

Red flags:
- Email from a trusted colleague but something feels off
- Requests for sensitive files or login credentials
- Unusual requests from executives (like sudden wire transfers)
- Sender email looks right but not exactly right (support@companyname.co instead of support@company.com)

Defense:
1. Verify by a second channel — call the person using a number you know is correct.
2. Check the sender''s email address carefully. Attackers often register similar-looking domains.
3. Be suspicious of emotional language or urgency.
4. Report suspicious emails to your IT department. They can check if the sender''s account was compromised.
5. Use email authentication standards (SPF, DKIM, DMARC) which some providers use to verify legitimate senders.', 8),
('phishing-whaling-executives', 'Whaling: Phishing Attacks Targeting Executives', 'phishing', 'How C-level executives and high-value targets are specifically targeted.', 'Whaling is spear phishing aimed at high-value targets like executives, managers, and people with access to critical systems or money.

Why executives are targets:
- Authority to approve large transactions or grant access
- Access to sensitive data
- High-value contact lists for secondary attacks

Common whaling scenarios:
1. CEO impersonation — email appears to come from the CEO or CFO with an urgent request: "Transfer $500k to this account immediately. Do not discuss with anyone."
2. Fake board meeting — "Review these quarterly results before the board meeting" with a link to a fake login page.
3. Tax or legal urgency — "IRS audit notice" or "Legal document requires your signature."

Protections for executives:
1. Implement transaction approval workflows — large wire transfers require multi-person authorization.
2. Verify requests through a second channel, especially urgent ones.
3. Use dedicated email for sensitive approvals.
4. Do not click links in emails requesting credentials or approvals. Navigate to the system directly.
5. Brief the organization on whaling tactics. Attackers often target assistants too — they know the executive''s schedule and preferences.
6. Use hardware security keys for email and sensitive systems. These cannot be phished.', 8),
('creating-strong-passwords', 'Creating Strong Passwords', 'passwords', 'The fundamentals of passwords that resist guessing and cracking.', 'A strong password is your first line of defense. Here is what makes one:

Length beats complexity. A 16-character passphrase of random words (e.g. "purple-elephant-window-rocket") is harder to crack than an 8-character mix of symbols. Aim for at least 14 characters.

Avoid the obvious. "Password123", "Qwerty", your pet''s name, your birthday, and the word "letmein" are all in the first things attackers try.

Use a different password for every account. If one site is breached, attackers try that password everywhere. A password manager makes this practical.

Turn on multi-factor authentication wherever it is offered. Even a stolen password is useless without the second factor.

Never reuse your email password for anything else. Your email is the master key — it lets attackers reset every other account.', 5),
('malware-prevention-basics', 'Malware Prevention Basics', 'malware', 'How malware gets in and how to keep it out.', 'Malware is any software written to harm or exploit a device. Common types include viruses, ransomware, spyware, and trojans.

How it gets in:
- Infected email attachments and downloads
- Compromised websites (drive-by downloads)
- Pirated software and "free" cracks
- Malicious browser extensions

How to stay safe:
1. Keep your operating system and browser updated. Most malware exploits known, already-patched vulnerabilities.
2. Install reputable antivirus and keep its definitions current.
3. Download software only from the official source or a verified store.
4. Do not disable browser security warnings.
5. Back up important files regularly — ransomware is far less devastating when you have clean copies.', 6),
('protecting-personal-privacy', 'Protecting Personal Privacy Online', 'privacy', 'Practical steps to control what data you share and with whom.', 'Your personal data is valuable. Here is how to keep more of it under your control:

Review app permissions. Many apps ask for contacts, location, and microphone access they do not need. Deny by default, allow only what the app genuinely requires.

Check social media privacy settings. Default settings are usually wide open. Limit who can see your posts, your friend list, and your contact information.

Use a VPN on public Wi-Fi. Public networks are easy to eavesdrop on. A VPN encrypts your traffic so others on the same network cannot read it.

Be careful what you share. Photos, vacation plans, and "check-ins" tell strangers where you are and when your home is empty. Share after the fact, not before.

Read before you agree. Privacy policies are long, but the key question is simple: what data does this service collect, and what does it do with it?', 5),
('social-engineering-defense', 'Defending Against Social Engineering', 'social', 'Why the human mind is the hardest system to secure.', 'Social engineering is the art of manipulating people into breaking security rules. It works because trust, helpfulness, and authority are powerful levers.

Common attacks:
- Pretending to be IT support and asking for your password
- Following someone through a secure door ("tailgating")
- A "recruiter" offering a job but needing you to run a script
- An "executive" demanding an urgent wire transfer

Defenses:
1. Verify identity through a second channel. If "IT" calls, hang up and call the official number.
2. Slow down. Urgency is the attacker''s tool. A legitimate request can wait five minutes.
3. Never share passwords, MFA codes, or remote-access approval with someone who contacted you.
4. It is okay to say no. A real colleague will understand; a social engineer will pressure you.
5. Report suspicious contacts. Telling security about an attempt helps everyone.', 6),
('data-breach-response', 'What to Do After a Data Breach', 'data', 'A short action plan for when a service you use announces a breach.', 'When a service announces a breach, act quickly but calmly:

1. Find out what was exposed. Was it email + password, payment data, or identity documents? The response depends on the data.
2. Change the password on the breached service immediately. Then change it on every other account that reused it.
3. Enable MFA if it was not already on.
4. Watch for phishing. Breached data is used to craft convincing follow-up emails. Be extra skeptical of any "account" email in the following weeks.
5. Check haveibeenpwned.com to see which of your email addresses appear in known breaches.
6. Consider a credit freeze if identity data was exposed. It prevents new accounts being opened in your name.

Keep records of what happened and what you did. If there is fraud later, the timeline helps.', 5),
('secure-device-setup', 'Setting Up Your Device Securely', 'others', 'Initial security steps to take when setting up a new computer or phone.', 'A secure device starts with proper setup. Here is what to do from day one:

Before you use your new device, take these precautions:
1. Update the operating system and all software immediately. Device makers release security patches for problems found before release.
2. Enable the firewall. Windows Defender and macOS have built-in firewalls that block malicious incoming connections.
3. Install antivirus software and enable real-time scanning.
4. Use a strong passphrase to encrypt your device. Without encryption, anyone with physical access can read your files.
5. Enable automatic updates. Never ignore prompts to update.
6. Configure a VPN for mobile devices to protect traffic on public Wi-Fi.
7. Set up a password manager and generate unique, strong passwords for all online accounts.
8. Turn off unnecessary features (Bluetooth, location services) when not in use. They are convenience + attack surface. Turn them back on only when needed.

These early steps are far easier than recovering from an infection later.', 6),
('two-factor-authentication-guide', 'Understanding Two-Factor Authentication', 'others', 'Why MFA is essential and which types are best for your needs.', 'Two-factor authentication (MFA/2FA) is one of the best defenses available. It means proving you are you in two ways, not just a password.

Why it matters: Even if an attacker has your password, they cannot log in without the second factor.

Types of MFA:
1. SMS or email codes — a one-time code sent to your phone or email. Convenient but slower. Vulnerable to SIM hijacking in rare cases.
2. Authenticator apps (Google Authenticator, Authy, Microsoft Authenticator) — apps that generate time-based codes. Fast and not vulnerable to SIM hijacking. Lose your phone, lose access unless you saved backup codes.
3. Hardware security keys (YubiKey, Google Titan) — physical devices you tap or plug in. The most secure. You cannot lose them online. Downside: you must carry the key.
4. Biometrics (fingerprint, face recognition) — using your body as the second factor. Very convenient. Only as secure as the device storing the biometric data.

Best practice: Use an authenticator app for most accounts, and hardware keys for sensitive accounts (email, bank, work accounts). Always save backup codes in a secure location.', 7),
('online-safety-for-seniors', 'Online Safety for Older Adults', 'others', 'Cybersecurity guidance tailored to common threats targeting seniors.', 'Scammers often target older adults with tailored tricks. Here is how to protect yourself:

Common threats:
1. Tech support scams — pop-ups claiming your computer is infected. Call the number and they take control of your device. Ignore pop-ups. Real warnings come only from actions you take, not random pop-ups.
2. Grandparent scams — someone posing as a grandchild claiming to need urgent money. Real relatives do not ask for money via wire transfer.
3. Romance scams — attractive strangers building relationships to ask for money. Someone who asks for money has been looking for money, not you.
4. Lottery/prize scams — "You have won!" emails. You did not. Real lotteries do not ask you to claim online.

Protection:
1. Never call a number from a pop-up. Go to the vendor''s official website directly.
2. Ask questions only a real grandchild would know before sending money.
3. Tell family about promises and requests from strangers. Ask someone you trust before clicking or sending anything.
4. Be skeptical of emails with poor grammar or urgent language. Legitimate companies proofread.
5. Use strong, unique passwords with a password manager.
6. Use antivirus software and keep it updated.', 7),
('password-manager-guide', 'How to Use a Password Manager Safely', 'passwords', 'Why password managers are essential and how to choose one securely.', 'A password manager stores and encrypts all your passwords so you remember only one strong master password. This is the most practical way to use unique passwords everywhere.

Why use one:
- You cannot remember 100+ unique strong passwords.
- A password manager lets you use 20+ character random passwords without memorizing them.
- If one service is breached, only that password is compromised, not all your accounts.

Recommended password managers:
1. Bitwarden — open-source, affordable, works on all devices.
2. 1Password — easy to use, strong zero-knowledge architecture, pricier.
3. LastPass — widely used, but has had security issues; use with caution.
4. Dashlane — user-friendly, premium features available.

Security best practices:
1. Use a strong, unique master password (20+ characters, random passphrase).
2. Enable multi-factor authentication on your password manager account.
3. Do not share your master password with anyone, ever.
4. Use your password manager to generate new passwords rather than creating them yourself.
5. Keep the app updated on all devices.
6. Be suspicious of browser extensions claiming to "improve" your password manager.

Never store:
- Passwords for your password manager itself
- Social security numbers or bank account details (use your bank''s secure vault instead)', 6),
('password-recovery-after-breach', 'Recovering After a Password Breach', 'passwords', 'Step-by-step actions to take when a service you use is hacked.', 'If you use the same password across multiple accounts, a breach at one service puts all accounts at risk.

Immediate steps:
1. Change the password on the breached service immediately, using a new strong password.
2. Check if you reused that password. If you did, change it on every account where it appears.
3. Enable MFA on all important accounts (email, bank, social media) if not already enabled.
4. Monitor your email for suspicious account recovery attempts.

Longer-term actions:
1. Check haveibeenpwned.com with your email addresses to see which other breaches you may be in.
2. Set up breach monitoring services (Google One, Firefox Monitor) to get alerts if your email appears in future breaches.
3. Consider a credit freeze if identity information was exposed.
4. Review payment methods and financial accounts for fraudulent activity.
5. Update your password manager with new unique passwords for all accounts.

Prevention going forward:
- Use a password manager with unique passwords for each account.
- Enable MFA on all important accounts.
- Do not reuse passwords.', 7),
('malware-signs-removal', 'Signs You Have Malware & How to Remove It', 'malware', 'How to detect and safely remove malware from your device.', 'If your device is slow, crashes frequently, or shows unexpected behavior, malware may be responsible. Here is how to check and respond.

Warning signs:
1. Sudden slowness or high resource usage in Task Manager/Activity Monitor
2. Unexpected pop-ups or notifications
3. New browser extensions you did not install
4. Automatic browser redirects to suspicious sites
5. Files or programs you did not install
6. Disabled antivirus or security software
7. New browser homepage or search engine
8. Increased data usage or disk activity

Removal steps:
1. Disconnect from the internet (pull the cable or disable Wi-Fi) to prevent the malware spreading.
2. Boot into Safe Mode (Windows: F8 or Shift+F8 during startup; Mac: hold Shift during startup).
3. Run a full scan with your antivirus, or use Malwarebytes (free version available).
4. Delete detected threats. Do not quarantine and keep them.
5. Remove suspicious browser extensions.
6. Reset browser settings to defaults.
7. Change all passwords from a clean device (not the infected one).
8. Consider a full OS reinstall if the infection was severe.

Prevention:
- Keep antivirus definitions updated.
- Do not disable security warnings.
- Do not run cracked software.
- Be cautious with email attachments and downloads.', 7),
('ransomware-protection', 'Protecting Against Ransomware Attacks', 'malware', 'How ransomware works and what to do if you become a victim.', 'Ransomware encrypts your files and demands payment for the decryption key. It is one of the most damaging malware threats.

How it spreads:
1. Email attachments (especially Office documents with macros)
2. Compromised websites with drive-by downloads
3. Unpatched software vulnerabilities
4. Weak remote access credentials
5. Malicious ads on popular websites

What happens:
1. Your files are encrypted and become unusable.
2. A demand appears on your screen: "Pay X bitcoins in 48 hours or your files are deleted forever."
3. If you pay, there is no guarantee you get the key. Many victims pay and lose data anyway.

Defense:
1. Regular backups (offline or cloud) are your best defense. If you have a backup, ransomware is merely an inconvenience.
2. Keep OS and software updated. Many ransomware exploits known vulnerabilities.
3. Use antivirus and enable real-time scanning.
4. Disable macros in Office documents (trust only internal documents).
5. Use application whitelisting if available.
6. Isolate devices on a segmented network to prevent lateral spread.

If infected:
1. Disconnect from the network immediately.
2. Do NOT pay the ransom. Paying does not guarantee recovery and funds cybercriminals.
3. Report to law enforcement and your organization''s security team.
4. Restore from a clean backup if you have one.
5. Do not restore from a backup without confirming it was not infected.', 8),
('privacy-phone-tracking', 'Mobile Device Privacy & Location Tracking', 'privacy', 'Control what apps know about your location and activity on mobile devices.', 'Your smartphone tracks your location, collects your contacts, and monitors your activity. Here is how to protect your privacy.

Location tracking:
1. Review location permissions: Settings > Privacy > Location. Disable location for apps that do not need it.
2. Use "Precise location" only when necessary. Many apps work with "Approximate location."
3. Disable location when you are not using it.
4. Turn off location history in Google Maps and Apple Maps.
5. Disable "Find My" or "Family Sharing" features unless you actually use them.

App permissions:
1. Contacts — only messaging and calling apps need this.
2. Microphone — only voice calling and recording apps need this.
3. Camera — only apps that intentionally use the camera need this.
4. Calendar — most apps do not need calendar access.
5. Photos — only photo editing and sharing apps need this.

Privacy settings:
1. Disable ad personalization. Google: myaccount.google.com > Data & Privacy. Apple: Settings > Privacy > Apple Advertising.
2. Limit ad tracking: Settings > Privacy > Tracking. Enable "Ask Apps Not to Track."
3. Turn off analytics and crash reporting unless you are comfortable sharing data.
4. Disable Bluetooth when not in use — it can be used for tracking.
5. Use a VPN on public Wi-Fi to encrypt your traffic.

Backup and sync:
1. Review what data syncs to the cloud (photos, contacts, messages).
2. Disable cloud sync for sensitive data if you do not trust the provider.
3. Use local-only backup instead of cloud backup when possible.', 7),
('digital-footprint-reduction', 'Reducing Your Digital Footprint', 'privacy', 'Steps to minimize the personal data you leave online.', 'Every website you visit, app you use, and search you make creates a digital footprint that marketers, brokers, and attackers can exploit.

Search engines and your data:
1. Use privacy-focused search engines: DuckDuckGo, Searx, Startpage.
2. Delete your Google and Bing search history regularly.
3. Opt out of personalized search results.

Online accounts:
1. Delete old accounts you no longer use (social media, forums, old email accounts).
2. Remove personal information from social media profiles (birthday, phone, email).
3. Limit who can see your posts and profile.
4. Regularly review connected apps and revoke access to apps you no longer use.
5. Set your social media profiles to private, not public.

Data brokers:
1. Use peoplesearch.com or databrokers.com to find where your data is sold.
2. Opt out of data brokers. Some like Experian and Equifax offer opt-out tools (though they may share it anyway).
3. Send opt-out requests to brokers you find. This is tedious but worthwhile.

Browsing privacy:
1. Use a privacy-focused browser: Firefox or Brave.
2. Install privacy extensions: uBlock Origin (ad blocker), Privacy Badger (tracker blocker).
3. Use incognito/private mode for shopping and searches.
4. Clear browser cookies and cache regularly.
5. Disable third-party cookies in browser settings.', 7),
('social-engineering-workplace', 'Social Engineering in the Workplace', 'social', 'How attackers manipulate employees and how to stay vigilant at work.', 'Workplaces are prime targets for social engineering because employees have access to customer data, financial systems, and intellectual property.

Common workplace tactics:
1. Phishing as executives — "The CEO needs this report urgently. Use this link."
2. Help desk impersonation — "I''m from IT support. I need to verify your password to fix your account."
3. Tailgating — following someone through a secure door to gain physical access.
4. Dumpster diving — searching trash for documents containing confidential information or passwords.
5. Pretexting — calling claiming to be a vendor or partner to extract information.

Red flags:
1. Requests for passwords or MFA codes. Legitimate IT never asks for these.
2. Urgent requests that demand immediate action without verification.
3. Emails from executives with unusual requests or typos in the email address.
4. Requests to install software or open suspicious attachments.
5. Offers that sound too good to be true (surprise bonuses, lottery winnings).

Protection strategies:
1. Verify identity through a second channel. If "IT" emails, call IT using the main company number.
2. Follow your organization''s security policies. If it feels wrong, it probably is.
3. Never share passwords or MFA codes with anyone, including IT support.
4. Report suspicious contacts to your security or HR team.
5. Lock your screen when you leave your desk.
6. Shred documents containing confidential information.
7. Be cautious about what you share on social media and LinkedIn (job title, company name, project details help attackers).', 8),
('manipulating-authority-fear', 'How Attackers Use Authority and Fear', 'social', 'Understanding psychological manipulation tactics and how to resist them.', 'Social engineers use psychology, not technology. Their favorite tools are authority, urgency, and fear.

Authority manipulation:
Attackers impersonate people with power (executives, law enforcement, tech support) because most people obey authority without question. Tactics:
1. "I am from the FBI and you are under investigation."
2. "Your boss sent me to collect the project files."
3. "This is the IRS. You owe back taxes due immediately."

Defense: Verify identity independently. Do not trust caller ID or email displays — they can be spoofed. Call using a number you find yourself.

Urgency and fear:
Attackers create artificial urgency to prevent you from thinking clearly:
1. "Your account will be closed in 24 hours unless you act now."
2. "Unauthorized access detected. Verify your password immediately."
3. "A breach exposed your data. Click here to secure your account."

Defense: Urgency is a red flag. Legitimate requests can wait 5 minutes for you to verify. Step back, breathe, and verify before acting.

Likability and trust:
Attackers build rapport by being friendly, sympathetic, or relatable:
1. "I understand this is frustrating. I''ve been through this too."
2. "Can you help me? I''m new and do not know how things work here."
3. Extended personal conversation to build false trust before the "ask."

Defense: Be wary of unexpected friendliness from strangers. Professional relationships do not require personal connection.

Reciprocity:
Attackers do something small for you, expecting you to return the favor:
1. "I helped you last time, now I need your help."
2. Free gifts or services before asking for information.

Defense: You do not owe a favor to a stranger. Help legitimate colleagues, but verify first.', 8),
('data-breach-notification-laws', 'Understanding Data Breach Notification Laws', 'data', 'What companies are required to tell you after a breach and your rights.', 'When a company suffers a breach, laws in many jurisdictions require notification. Here is what you need to know.

Notification requirements (varies by jurisdiction):
- United States: Most states require notification if personally identifiable information is exposed.
- GDPR (Europe): Strict rules; companies must notify within 72 hours and may face heavy fines.
- CCPA (California): Companies must notify and include specific information.
- Other countries have their own rules.

What should the notification include:
1. Description of the breach and what data was exposed.
2. When the breach occurred and when it was discovered.
3. Steps the company is taking to address it.
4. Free credit monitoring or identity theft protection (often required by law).
5. Your rights and what to do.

Red flags in breach notifications:
1. Vague descriptions of what was exposed ("personal information").
2. No timeline provided for how long the breach went undetected.
3. No offer of credit monitoring or remediation.
4. Breach notification arrives months after it occurred.
5. Notification is a one-liner with no details.

Your rights:
1. Demand clarity on what information was exposed and how.
2. Take free credit monitoring for at least 2-3 years.
3. Request your data deletion if possible.
4. File a complaint with your state''s attorney general or data protection authority if the company fails to notify or comply.
5. Consider joining a class-action lawsuit (collectively, victims have more power).

Long-term actions:
1. Monitor your credit reports (annualcreditreport.com is free).
2. Place a fraud alert with credit bureaus.
3. Consider a credit freeze.
4. Watch for phishing attempts and identity theft.', 7),
('ransomware-organizations-recovery', 'How Organizations Respond to Ransomware', 'data', 'A look behind the scenes at enterprise ransomware attacks and recovery.', 'Large-scale ransomware attacks hit headlines regularly. Here is how organizations detect, respond, and recover.

Detection:
1. Security Operations Centers (SOCs) monitor network traffic and logs for signs of encryption activity.
2. Backup systems trigger alerts if data volumes suddenly spike (a sign of file scanning before encryption).
3. EDR (Endpoint Detection & Response) tools detect suspicious process behavior.
4. Internal monitoring catches unusual admin activity or lateral movement.

Initial response:
1. Isolate infected systems immediately to prevent spread.
2. Activate the incident response plan.
3. Preserve evidence for law enforcement and forensic analysis.
4. Notify leadership, legal, and law enforcement (FBI, CISA).
5. Do NOT pay the ransom unless authorized by law enforcement and insurance.

Investigation:
1. Forensic teams analyze infected systems to determine attack entry point.
2. Identify what data was exposed and what was encrypted.
3. Determine the duration of attacker access (often days or weeks before encryption).
4. Review logs to see if data was exfiltrated (stolen) before encryption.

Recovery:
1. Restore from clean backups (carefully verified to not contain malware).
2. Rebuild systems from scratch if necessary.
3. Patch vulnerabilities the attacker exploited.
4. Implement stronger access controls and network segmentation.
5. Deploy EDR and other defensive tools.

Lessons:
1. Ransomware actors often have access for weeks before encryption. Regular threat hunting is critical.
2. Most victims do not restore from backups; they negotiate with attackers or pay the ransom.
3. Paying does not guarantee recovery; many victims lose data anyway.
4. Prevention (patching, backups, segmentation) is far cheaper than response and recovery.', 9)
ON CONFLICT (slug) DO NOTHING;