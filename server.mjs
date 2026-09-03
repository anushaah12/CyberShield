import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const DB_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DB_DIR, 'cybershield.sqlite');
mkdirSync(DB_DIR, { recursive: true });

const db = new DatabaseSync(DB_FILE);
db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS url_scans (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  domain TEXT,
  verdict TEXT NOT NULL,
  risk_score REAL NOT NULL,
  reasons_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS threat_reports (
  id TEXT PRIMARY KEY,
  reporter_name TEXT,
  report_type TEXT NOT NULL,
  threat_url TEXT,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS awareness_articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  read_time INTEGER NOT NULL DEFAULT 5,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'CyberShield User',
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
`);

const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
if (!db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail)) {
  db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run(adminEmail, hashPassword(adminPassword));
}

const seedArticles = [
  ['spot-phishing','Spot Phishing Before You Click','phishing','Learn the signals that separate legitimate messages from phishing attempts.','Phishing attacks try to trick you into revealing sensitive information through fake emails, messages, or websites.\n\nKey warning signs:\n- Generic greetings instead of your name\n- Urgent language threatening account closure\n- Mismatched sender addresses (e.g., support@g00gle.com)\n- Requests for passwords, PINs, or verification codes\n- Unexpected attachments or links\n\nHow to protect yourself:\n1. Always verify the sender\'s email address carefully\n2. Hover over links before clicking to see the real URL\n3. Never share passwords or one-time codes via email or phone\n4. When in doubt, contact the company directly through official channels\n5. Use bookmarks for important sites instead of clicking email links\n\nRemember: Legitimate companies never ask for your password via email.',6],
  ['strong-passwords','Build Stronger Passwords','passwords','Practical habits for creating and protecting strong credentials.','Strong passwords are your first line of defense against unauthorized access.\n\nPassword best practices:\n- Use at least 12-16 characters\n- Mix uppercase, lowercase, numbers, and special characters\n- Avoid personal information (birthdays, names, pets)\n- Never reuse passwords across different accounts\n- Use a password manager for complex, unique passwords\n\nTwo-Factor Authentication (2FA):\nEnable 2FA wherever possible. It adds an extra layer of security by requiring something you know (password) and something you have (phone, authenticator app).\n\nPassword managers:\nTools like Bitwarden, 1Password, or LastPass can generate and store secure passwords for you, so you only need to remember one master password.\n\nWhat to avoid:\n- Common words or phrases\n- Sequential patterns (123456, qwerty)\n- Reusing old passwords with slight variations',7],
  ['privacy-basics','Everyday Privacy Basics','privacy','Small changes that reduce the amount of personal data you expose online.','Your personal information is valuable. Protect it with these everyday practices.\n\nSocial Media Privacy:\n- Review your privacy settings regularly\n- Limit who can see your posts and personal information\n- Avoid posting location data, birth dates, or contact details\n- Be cautious about friend requests from strangers\n\nApp Permissions:\n- Only grant necessary permissions to apps\n- Review permissions periodically and revoke unused ones\n- Consider if an app really needs access to your camera, microphone, or contacts\n\nDevice Security:\n- Use screen locks (PIN, pattern, fingerprint, or face recognition)\n- Keep your operating system and apps updated\n- Use encryption on your devices\n- Avoid using public USB charging stations\n\nOnline Shopping:\n- Use secure payment methods (credit cards over debit)\n- Shop only on reputable websites with HTTPS\n- Avoid saving payment information on unfamiliar sites\n- Treat unexpected requests for personal data as suspicious until you verify them independently.',6],
  ['malware-warning-signs','Recognize Malware Warning Signs','malware','Know what to do when a device behaves unexpectedly.','Malware (malicious software) can damage your device, steal data, or give attackers control.\n\nCommon warning signs:\n- Unexpected pop-ups or ads\n- Programs you didn\'t install appearing on your device\n- Sluggish performance or frequent crashes\n- Browser homepage or search engine changes\n- Disabled antivirus or security software\n- Unusual network activity or data usage\n\nTypes of malware:\n- Viruses: Attach themselves to legitimate files\n- Ransomware: Encrypts your files and demands payment\n- Spyware: Secretly monitors your activity\n- Trojans: Disguise as legitimate software\n\nProtection steps:\n1. Install reputable antivirus software and keep it updated\n2. Only download software from official sources\n3. Keep your operating system and applications patched\n4. Be cautious with email attachments and downloads\n5. Use a firewall to monitor network traffic\n6. Regularly backup your important files\n\nIf infected:\n- Disconnect from the internet\n- Run a full malware scan\n- Change passwords from a clean device\n- Consider professional help for severe infections',7],
  ['social-engineering-tactics','Understanding Social Engineering Tactics','social','How attackers manipulate people into revealing sensitive information.','Social engineering exploits human psychology rather than technical vulnerabilities.\n\nCommon tactics:\n\nPretexting:\nAttackers create a fabricated scenario to gain your trust. They might pretend to be IT support, bank officials, or coworkers needing "verification" of information.\n\nUrgency and Fear:\nMessages claiming your account will be closed, you\'ve been hacked, or there\'s an emergency create pressure to act without thinking.\n\nAuthority Figures:\nImpersonating executives, government officials, or law enforcement to demand compliance with requests.\n\nToo Good to Be True:\nOffers of free money, prizes, or exclusive deals that require you to "act now" or pay a small fee.\n\nQuid Pro Quo:\nOffering help in exchange for information or access. "I can fix your computer if you just log in for me."\n\nHow to protect yourself:\n- Verify requests through independent channels\n- Be suspicious of unsolicited contact\n- Never share sensitive information based solely on a request\n- Trust your instincts—if something feels wrong, it probably is\n- Follow established procedures for sensitive actions\n- Report suspicious attempts to your organization\'s security team\n\nRemember: Attackers target helpful, trusting people. Being cautious isn\'t rude—it\'s smart.',8],
  ['data-breach-response','What to Do After a Data Breach','data','Steps to protect yourself when your personal information is exposed.','Data breaches happen. Knowing how to respond quickly can minimize the damage.\n\nImmediate actions:\n\n1. Change affected passwords:\n   - Start with the breached account\n   - Change passwords for any accounts using similar credentials\n   - Use strong, unique passwords for each account\n\n2. Enable two-factor authentication (2FA):\n   - Add 2FA to all important accounts\n   - Use authenticator apps rather than SMS when possible\n\n3. Monitor financial accounts:\n   - Check bank statements and credit card transactions\n   - Report any suspicious activity immediately\n  - Consider setting up transaction alerts\n\n4. Freeze your credit:\n   - Contact credit bureaus (Equifax, Experian, TransUnion)\n   - A credit freeze prevents new accounts from being opened in your name\n   - It\'s free and doesn\'t affect your credit score\n\n5. Stay informed:\n   - Follow official guidance from the affected company\n   - Monitor their communications for updates\n   - Be extra vigilant for phishing attempts related to the breach\n\nLong-term protection:\n- Consider identity theft monitoring services\n- Regularly review your credit reports\n- Use password managers to generate unique credentials\n- Be cautious about sharing personal information online\n\nRemember: Quick action is key. The faster you respond, the less damage attackers can do.',7],
  ['other-cyber-tips','Additional Cyber Security Tips','others','Miscellaneous security practices for everyday digital life.','Comprehensive security requires attention to many small details.\n\nPublic Wi-Fi Safety:\n- Avoid accessing sensitive accounts on public networks\n- Use a VPN when connecting to public Wi-Fi\n- Turn off auto-connect to unknown networks\n- Verify network names with staff before connecting\n\nBackup Strategy:\n- Follow the 3-2-1 rule: 3 copies, 2 different media types, 1 offsite\n- Use cloud backup services for important files\n- Test your backups regularly\n- Keep backups of critical documents offline\n\nSoftware Updates:\n- Enable automatic updates when possible\n- Don\'t ignore security patch notifications\n- Update all devices: phones, tablets, computers, smart home devices\n- Remove software you no longer use\n\nEmail Security:\n- Use spam filters and keep them updated\n- Be cautious with email attachments—even from known senders\n- Verify unexpected attachments with the sender before opening\n- Use encrypted email for sensitive communications\n\nPhysical Security:\n- Lock your devices when stepping away\n- Don\'t leave devices unattended in public places\n- Use privacy screens on laptops in public\n- Destroy physical documents containing sensitive information\n\nGeneral Mindset:\n- Trust your instincts\n- If something seems suspicious, it probably is\n- Take time to verify before acting\n- Stay informed about current threats\n- Share security knowledge with friends and family\n\nSecurity is a habit, not a one-time setup. Small daily actions add up to strong protection.',8],
  ['ransomware-protection','Protecting Against Ransomware','malware','How to defend against one of the most destructive malware threats.','Ransomware encrypts your files and demands payment for the decryption key.\n\nHow ransomware spreads:\n- Phishing emails with malicious attachments\n- Exploiting unpatched software vulnerabilities\n- Malicious downloads from unofficial sources\n- Remote desktop protocol (RDP) attacks\n\nPrevention strategies:\n\n1. Regular backups:\n   - Keep offline backups of critical files\n   - Use the 3-2-1 backup rule\n   - Test backup restoration regularly\n\n2. Keep systems updated:\n   - Patch operating systems and applications promptly\n   - Prioritize security updates\n   - Remove unnecessary software\n\n3. Email and web safety:\n   - Be cautious with email attachments\n  - Don\'t click on suspicious links\n  - Use ad blockers to prevent malvertising\n\n4. Network security:\n   - Use firewalls and intrusion detection\n   - Segment your network\n   - Disable RDP if not needed\n  - Use VPNs for remote access\n\nIf infected:\n- Disconnect from the network immediately\n- Don\'t pay the ransom—there\'s no guarantee you\'ll get your files back\n- Contact law enforcement\n- Restore from clean backups\n- Seek professional help\n\nRemember: Prevention is far better than dealing with an infection. Good backups are your best defense.',6],
  ['secure-shopping','Safe Online Shopping Practices','others','Protect yourself while shopping online.','Online shopping offers convenience but also risks. Follow these practices to shop safely.\n\nBefore shopping:\n- Only use reputable retailers with established track records\n- Verify the website uses HTTPS (look for the padlock icon)\n- Research unfamiliar sellers before purchasing\n- Read reviews from multiple sources\n\nDuring checkout:\n- Use credit cards instead of debit cards\n- Credit cards offer better fraud protection\n- Consider using virtual card numbers for online purchases\n- Avoid saving payment information on unfamiliar sites\n- Don\'t complete purchases over public Wi-Fi without a VPN\n\nAfter purchasing:\n- Save order confirmations and receipts\n- Monitor your accounts for unauthorized charges\n- Track shipments to ensure delivery\n- Report any issues to the retailer immediately\n\nRed flags to watch for:\n- Prices that seem too good to be true\n- Websites with poor grammar or spelling errors\n- Requests for unusual payment methods (wire transfers, gift cards)\n- Lack of contact information or customer service\n- Pressure to act quickly with limited-time offers\n\nAdditional tips:\n- Use strong, unique passwords for shopping accounts\n- Enable two-factor authentication when available\n- Be cautious with promotional emails—verify they\'re legitimate\n- Keep your browser and security software updated\n\nRemember: If a deal seems too good to be true, it probably is.',5],
  ['mobile-security','Mobile Device Security','privacy','Protect your smartphone and tablet from threats.','Mobile devices contain vast amounts of personal data. Secure them properly.\n\nDevice security:\n- Use strong screen locks (PIN, pattern, fingerprint, face ID)\n- Enable auto-lock after short periods of inactivity\n- Keep operating system and apps updated\n- Install apps only from official stores\n\nApp security:\n- Review app permissions before installing\n- Grant only necessary permissions\n- Regularly audit and revoke unused permissions\n- Remove apps you no longer use\n- Read privacy policies for sensitive apps\n\nNetwork security:\n- Avoid public Wi-Fi for sensitive activities\n- Use a VPN when on public networks\n- Turn off auto-connect to unknown networks\n- Disable Bluetooth and Wi-Fi when not in use\n\nData protection:\n- Enable remote tracking and wiping features\n- Regularly backup your device\n- Encrypt device storage when available\n- Be cautious with cloud backup settings\n\nPhysical security:\n- Don\'t leave devices unattended in public\n- Use privacy screen protectors in crowded places\n- Be aware of your surroundings when entering PINs\n- Report lost or stolen devices immediately\n\nPublic charging:\n- Avoid public USB charging stations (juice jacking risk)\n- Carry your own charging cable and power bank\n- Use USB data blockers if you must use public ports\n\nRemember: Your mobile device is a powerful computer—treat it with the same security precautions.',6],
];
const insert = db.prepare('INSERT OR IGNORE INTO awareness_articles (id,slug,title,category,summary,content,read_time) VALUES (?,?,?,?,?,?,?)');
for (const row of seedArticles) insert.run(randomId(), ...row);

function randomId() { return randomBytes(12).toString('hex'); }
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${key}`;
}
function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  return timingSafeEqual(derived, Buffer.from(key, 'hex'));
}
function tokenFor(adminId) {
  const exp = Date.now() + 8 * 60 * 60 * 1000;
  const body = `${adminId}.${exp}`;
  const sig = createHmac('sha256', adminPassword).update(body).digest('hex');
  return Buffer.from(`${body}.${sig}`).toString('base64url');
}
function adminFromToken(req) {
  const raw = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, 'base64url').toString();
    const [id, exp, sig] = decoded.split('.');
    const body = `${id}.${exp}`;
    const expected = createHmac('sha256', adminPassword).update(body).digest('hex');
    if (!id || !exp || !sig || Number(exp) < Date.now() || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return db.prepare('SELECT id,email FROM admins WHERE id=?').get(Number(id)) || null;
  } catch { return null; }
}
async function body(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
}
function send(res, status, payload) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(payload));
}
function rows(table, limit=100) {
  if (table === 'url_scans') return db.prepare(`SELECT id,url,domain,verdict,risk_score,reasons_json,created_at FROM url_scans ORDER BY created_at DESC LIMIT ?`).all(limit).map(r=>({...r,reasons:JSON.parse(r.reasons_json)}));
  return db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT ?`).all(limit);
}
async function handleApi(req, res, url) {
  const method = req.method || 'GET';
  if (method === 'POST' && url.pathname === '/api/admin/login') {
    const { email, password } = await body(req);
    const admin = db.prepare('SELECT * FROM admins WHERE email=?').get(String(email||'').trim().toLowerCase());
    if (!admin || !verifyPassword(String(password||''), admin.password_hash)) return send(res,401,{error:'Invalid admin credentials'});
    return send(res,200,{token:tokenFor(admin.id),admin:{id:admin.id,email:admin.email}});
  }
  if (url.pathname.startsWith('/api/admin/')) {
    const admin = adminFromToken(req);
    if (!admin) return send(res,401,{error:'Admin authentication required'});
    if (method === 'GET' && url.pathname === '/api/admin/me') return send(res,200,{admin});
    if (method === 'GET' && url.pathname === '/api/admin/stats') {
      const count = t => Number(db.prepare(`SELECT COUNT(*) AS count FROM ${t}`).get().count);
      return send(res,200,{stats:{scans:count('url_scans'),reports:count('threat_reports'),articles:count('awareness_articles'),admins:count('admins'),users:count('users')}});
    }
    if (method === 'GET' && url.pathname === '/api/admin/scans') return send(res,200,{items:rows('url_scans',200)});
    if (method === 'GET' && url.pathname === '/api/admin/reports') return send(res,200,{items:rows('threat_reports',200)});
    if (method === 'GET' && url.pathname === '/api/admin/articles') return send(res,200,{items:rows('awareness_articles',200)});
    if (method === 'GET' && url.pathname === '/api/admin/users') return send(res,200,{items:db.prepare('SELECT id,name,email,role,status,created_at,last_login FROM users ORDER BY created_at DESC LIMIT 500').all()});
    const userMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (method === 'PATCH' && userMatch) {
      const {status}=await body(req);
      if (!['active','suspended'].includes(String(status))) return send(res,400,{error:'Status must be active or suspended'});
      db.prepare('UPDATE users SET status=? WHERE id=?').run(status,userMatch[1]);
      return send(res,200,{item:db.prepare('SELECT id,name,email,role,status,created_at,last_login FROM users WHERE id=?').get(userMatch[1])});
    }
    const reportMatch = url.pathname.match(/^\/api\/admin\/reports\/([^/]+)$/);
    if (method === 'PATCH' && reportMatch) {
      const {status,severity}=await body(req);
      if (status) db.prepare('UPDATE threat_reports SET status=? WHERE id=?').run(status,reportMatch[1]);
      if (severity) db.prepare('UPDATE threat_reports SET severity=? WHERE id=?').run(severity,reportMatch[1]);
      return send(res,200,{item:db.prepare('SELECT * FROM threat_reports WHERE id=?').get(reportMatch[1])});
    }
    const articleMatch = url.pathname.match(/^\/api\/admin\/articles\/([^/]+)$/);
    if (method === 'DELETE' && articleMatch) {
      db.prepare('DELETE FROM awareness_articles WHERE id=?').run(articleMatch[1]);
      return send(res,200,{ok:true});
    }
    if (method === 'POST' && url.pathname === '/api/admin/articles') {
      const a=await body(req);
      if (!a.title || !a.slug || !a.category || !a.summary || !a.content) return send(res,400,{error:'Title, slug, category, summary and content are required'});
      const id=randomId();
      try {
        db.prepare('INSERT INTO awareness_articles (id,slug,title,category,summary,content,read_time) VALUES (?,?,?,?,?,?,?)').run(id,a.slug,a.title,a.category,a.summary,a.content,Number(a.read_time)||5);
      } catch { return send(res,409,{error:'Slug already exists'}); }
      return send(res,201,{item:db.prepare('SELECT * FROM awareness_articles WHERE id=?').get(id)});
    }
  }
  if (method === 'POST' && url.pathname === '/api/users/sync') {
    const a=await body(req);
    const id=String(a.id||'').trim(), email=String(a.email||'').trim().toLowerCase();
    if (!id || !email) return send(res,400,{error:'User id and email are required'});
    const name=String(a.name||'CyberShield User').trim() || 'CyberShield User';
    const existing=db.prepare('SELECT id FROM users WHERE id=? OR email=?').get(id,email);
    if (existing && existing.id !== id) {
      db.prepare('UPDATE users SET id=?,name=?,last_login=CURRENT_TIMESTAMP WHERE id=?').run(id,name,existing.id);
    } else {
      db.prepare(`INSERT INTO users (id,name,email,last_login) VALUES (?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,last_login=CURRENT_TIMESTAMP`).run(id,name,email);
    }
    return send(res,200,{ok:true,item:db.prepare('SELECT id,name,email,role,status,created_at,last_login FROM users WHERE id=?').get(id)});
  }
  if (method === 'GET' && url.pathname === '/api/stats') return send(res,200,{stats:{scans:Number(db.prepare('SELECT COUNT(*) AS count FROM url_scans').get().count),reports:Number(db.prepare('SELECT COUNT(*) AS count FROM threat_reports').get().count)}});
  if (method === 'GET' && url.pathname === '/api/scans') return send(res,200,{items:rows('url_scans',50)});
  if (method === 'POST' && url.pathname === '/api/scans') {
    const a=await body(req), id=randomId();
    db.prepare('INSERT INTO url_scans (id,url,domain,verdict,risk_score,reasons_json) VALUES (?,?,?,?,?,?)').run(id,a.url,a.domain||null,a.verdict,Number(a.risk_score)||0,JSON.stringify(a.reasons||[]));
    return send(res,201,{item:{id,...a,created_at:new Date().toISOString()}});
  }
  if (method === 'GET' && url.pathname === '/api/reports') return send(res,200,{items:rows('threat_reports',50)});
  if (method === 'POST' && url.pathname === '/api/reports') {
    const a=await body(req), id=randomId();
    db.prepare('INSERT INTO threat_reports (id,reporter_name,report_type,threat_url,description,severity) VALUES (?,?,?,?,?,?)').run(id,a.reporter_name||null,a.report_type,a.threat_url||null,a.description,a.severity||'medium');
    return send(res,201,{item:db.prepare('SELECT * FROM threat_reports WHERE id=?').get(id)});
  }
  if (method === 'GET' && url.pathname === '/api/articles') return send(res,200,{items:rows('awareness_articles',100)});
  return send(res,404,{error:'Not found'});
}

async function serveStatic(req,res) {
  const dist=path.join(ROOT,'dist');
  let filePath=path.join(dist, req.url === '/' ? 'index.html' : req.url);
  try {
    const s=await stat(filePath);
    if (s.isFile()) { res.writeHead(200,{'Content-Type':mime(filePath)}); res.end(await readFile(filePath)); return; }
  } catch {}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(await readFile(path.join(dist,'index.html')));
}
function mime(file) {
  const ext=path.extname(file);
  return ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'})[ext]||'application/octet-stream';
}

const apiServer=http.createServer(async (req,res)=>{
  try {
    const u=new URL(req.url,'http://localhost');
    if (u.pathname.startsWith('/api/')) return await handleApi(req,res,u);
    if (process.argv.includes('--dev')) return res.writeHead(404).end('Use Vite dev server');
    return serveStatic(req,res);
  } catch (e) { console.error(e); send(res,500,{error:'Server error'}); }
});
apiServer.listen(PORT,()=>console.log(`CyberShield API listening on http://localhost:${PORT}`));

if (process.argv.includes('--dev')) {
  const child=process.platform==='win32'
    ? spawn('cmd.exe',['/d','/s','/c','npx vite --host 0.0.0.0'],{cwd:ROOT,stdio:'inherit'})
    : spawn('npx',['vite','--host','0.0.0.0'],{cwd:ROOT,stdio:'inherit'});
  process.on('SIGINT',()=>{child.kill('SIGINT');apiServer.close();process.exit();});
  process.on('SIGTERM',()=>{child.kill('SIGTERM');apiServer.close();process.exit();});
}
