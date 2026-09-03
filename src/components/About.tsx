import { Shield, Target, Link2, KeyRound, BookOpen, Siren, Activity, Lock, Mail, Github, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import type { ViewId } from '@/lib/nav';

export default function About({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const features = [
    { icon: Link2, title: 'URL Threat Checker', desc: 'Analyze suspicious URLs for phishing, malware, and impersonation signals with detailed risk scoring.' },
    { icon: KeyRound, title: 'Password Strength Analyzer', desc: 'Test password strength locally with entropy calculation and estimated crack-time — nothing leaves your device.' },
    { icon: BookOpen, title: 'Cyber Awareness Library', desc: 'Curated guides on phishing, malware, privacy, social engineering, and data breach response.' },
    { icon: Siren, title: 'Threat Reporting', desc: 'Report suspicious activity to a community board and help others stay informed.' },
    { icon: Target, title: 'Real-time Threat Map', desc: 'Visualize cyber threats reported worldwide with severity filtering and location details.' },
    { icon: Activity, title: 'Live Dashboard', desc: 'Monitor protection scores, recent scans, and community threat activity in real-time.' },
  ];

  return (
    <div className="about-view">
      <div className="about-hero">
        <div className="about-hero-mark"><Shield className="h-14 w-14" strokeWidth={2.5} /></div>
        <h1>About CYBERSHIELD</h1>
        <p>Your all-in-one cybersecurity toolkit. Check suspicious URLs, analyze passwords, learn about threats, and report incidents — all in one place.</p>
        <div className="about-badges">
          <span><Lock className="h-3.5 w-3.5" /> 100% Secure</span>
          <span><Activity className="h-3.5 w-3.5" /> Real-time</span>
          <span><Shield className="h-3.5 w-3.5" /> Community-driven</span>
        </div>
      </div>

      <div className="about-features">
        <h2>What We Offer</h2>
        <div className="about-features-grid">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="about-feature-card">
                <div className="about-feature-icon"><Icon className="h-6 w-6" /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="about-mission">
        <h2>Our Mission</h2>
        <p>
          Cyber threats are growing more sophisticated every day, and everyone deserves access to tools that help them stay safe online.
          CYBERSHIELD brings professional-grade security analysis to everyone — no technical background required.
          We believe that awareness is the first line of defense, and that by working together as a community, we can make the internet safer for all.
        </p>
      </div>

      <div className="about-cta">
        <h2>Ready to protect yourself?</h2>
        <p>Start using CYBERSHIELD's tools right now — it only takes a minute.</p>
        <div className="about-cta-buttons">
          <button onClick={() => onNavigate('url-checker')}>Check a URL <ArrowRight className="h-4 w-4" /></button>
          <button className="secondary" onClick={() => onNavigate('awareness')}>Learn Security <BookOpen className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="about-contact">
        <h2>Get in Touch</h2>
        <div className="about-contact-links">
          <a href="mailto:contact@cybershield.com"><Mail className="h-4 w-4" /> contact@cybershield.com</a>
          <a href="#"><Github className="h-4 w-4" /> GitHub</a>
          <a href="#"><Twitter className="h-4 w-4" /> Twitter</a>
          <a href="#"><Linkedin className="h-4 w-4" /> LinkedIn</a>
        </div>
      </div>
    </div>
  );
}
