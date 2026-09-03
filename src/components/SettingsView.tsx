import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Globe, Moon, Mail, Lock, User, Save, Check, AlertTriangle } from 'lucide-react';

export default function SettingsView({ userEmail, onSignOut }: { userEmail: string | null; onSignOut: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [threatAlerts, setThreatAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [autoScan, setAutoScan] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="settings-view">
      <div className="view-header">
        <div className="view-header-icon"><SettingsIcon className="h-6 w-6" /></div>
        <div>
          <h1>Settings</h1>
          <p>Manage your account, security, and notification preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile */}
        <section className="settings-card">
          <div className="settings-card-header"><User className="h-4 w-4" /><h2>Profile</h2></div>
          <div className="settings-card-body">
            <div className="settings-field"><label>Display Name</label><input defaultValue="CyberShield User" /></div>
            <div className="settings-field"><label>Email Address</label><input defaultValue={userEmail || 'user@cybershield.com'} readOnly /></div>
            <div className="settings-field"><label>Organization</label><input defaultValue="Personal" /></div>
          </div>
        </section>

        {/* Security */}
        <section className="settings-card">
          <div className="settings-card-header"><Lock className="h-4 w-4" /><h2>Security</h2></div>
          <div className="settings-card-body">
            <ToggleRow icon={Shield} label="Two-Factor Authentication" desc="Add an extra layer of security to your account" checked={twoFactor} onChange={setTwoFactor} />
            <ToggleRow icon={Globe} label="Auto-scan URLs" desc="Automatically check URLs you visit" checked={autoScan} onChange={setAutoScan} />
            <div className="settings-field"><label>Change Password</label><input type="password" placeholder="New password" /></div>
            <button className="settings-save-btn" onClick={handleSave}>
              {saved ? <><Check className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-card">
          <div className="settings-card-header"><Bell className="h-4 w-4" /><h2>Notifications</h2></div>
          <div className="settings-card-body">
            <ToggleRow icon={Bell} label="Push Notifications" desc="Receive alerts about new threats" checked={notifications} onChange={setNotifications} />
            <ToggleRow icon={AlertTriangle} label="Threat Alerts" desc="Get notified about critical threats in your area" checked={threatAlerts} onChange={setThreatAlerts} />
            <ToggleRow icon={Mail} label="Weekly Report" desc="Receive a weekly summary of threats" checked={weeklyReport} onChange={setWeeklyReport} />
            <ToggleRow icon={Moon} label="Dark Mode" desc="Use dark theme across the app" checked={darkMode} onChange={setDarkMode} />
          </div>
        </section>

        {/* Account actions */}
        <section className="settings-card">
          <div className="settings-card-header"><User className="h-4 w-4" /><h2>Account</h2></div>
          <div className="settings-card-body">
            <div className="account-info">
              <div className="account-avatar">{(userEmail || 'CS')[0].toUpperCase()}</div>
              <div><strong>{userEmail || 'CyberShield User'}</strong><small>Member since 2026</small></div>
            </div>
            <button className="settings-signout-btn" onClick={onSignOut}>Sign Out</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, desc, checked, onChange }: { icon: typeof Bell; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <div className="toggle-info"><Icon className="h-4 w-4" /><div><strong>{label}</strong><small>{desc}</small></div></div>
      <button className={`toggle-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
        <span className="toggle-knob" />
      </button>
    </div>
  );
}


