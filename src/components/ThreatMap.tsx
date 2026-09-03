import { useEffect, useState } from 'react';
import { Target, Globe, Activity, AlertTriangle, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { type ThreatReport } from '@/lib/supabase';
import { apiGet } from '@/lib/api';

type ThreatPin = {
  id: string;
  location: string;
  x: number;
  y: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  time: string;
};

const FALLBACK_PINS: ThreatPin[] = [
  { id: 'f1', location: 'New York, USA', x: 26, y: 38, type: 'phishing', severity: 'high', time: '2 min ago' },
  { id: 'f2', location: 'London, UK', x: 49, y: 30, type: 'malware', severity: 'medium', time: '8 min ago' },
  { id: 'f3', location: 'Moscow, Russia', x: 58, y: 28, type: 'data_breach', severity: 'critical', time: '15 min ago' },
  { id: 'f4', location: 'Mumbai, India', x: 67, y: 52, type: 'social_engineering', severity: 'medium', time: '22 min ago' },
  { id: 'f5', location: 'São Paulo, Brazil', x: 34, y: 70, type: 'phishing', severity: 'low', time: '35 min ago' },
  { id: 'f6', location: 'Tokyo, Japan', x: 82, y: 38, type: 'malware', severity: 'high', time: '41 min ago' },
  { id: 'f7', location: 'Sydney, Australia', x: 85, y: 75, type: 'identity_theft', severity: 'medium', time: '1 hr ago' },
  { id: 'f8', location: 'Lagos, Nigeria', x: 51, y: 60, type: 'phishing', severity: 'high', time: '1 hr ago' },
];

const SEVERITY_CONFIG: Record<string, { color: string; ring: string; label: string }> = {
  critical: { color: '#ff3b5c', ring: 'rgba(255,59,92,.5)', label: 'Critical' },
  high: { color: '#ff6b35', ring: 'rgba(255,107,53,.5)', label: 'High' },
  medium: { color: '#ffb84d', ring: 'rgba(255,184,77,.5)', label: 'Medium' },
  low: { color: '#27dc82', ring: 'rgba(39,220,130,.5)', label: 'Low' },
};

export default function ThreatMap() {
  const [pins, setPins] = useState<ThreatPin[]>(FALLBACK_PINS);
  const [reports, setReports] = useState<ThreatReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ThreatPin | null>(null);

  useEffect(() => {
    async function load() {
      const { items: data } = await apiGet<{ items: ThreatReport[] }>('/reports');
      if (data && data.length > 0) {
        setReports(data.slice(0, 50));
        const dynamicPins = data.slice(0, 10).map((r, i) => {
          const fallback = FALLBACK_PINS[i % FALLBACK_PINS.length];
          return {
            id: r.id,
            location: fallback.location,
            x: fallback.x + (Math.random() - 0.5) * 8,
            y: fallback.y + (Math.random() - 0.5) * 8,
            type: r.report_type,
            severity: r.severity,
            time: timeAgo(r.created_at),
          };
        });
        setPins(dynamicPins);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredPins = filter === 'all' ? pins : pins.filter((p) => p.severity === filter);

  return (
    <div className="threat-map-view">
      <div className="view-header">
        <div className="view-header-icon"><Target className="h-6 w-6" /></div>
        <div>
          <h1>Threat Map</h1>
          <p>Real-time visualization of cyber threats reported worldwide.</p>
        </div>
      </div>

      <div className="threat-map-stats">
        <MapStat icon={AlertTriangle} label="Active Threats" value={pins.length} tone="red" />
        <MapStat icon={ShieldAlert} label="Critical" value={pins.filter((p) => p.severity === 'critical').length} tone="orange" />
        <MapStat icon={ShieldCheck} label="Resolved" value={reports.filter((r) => r.status === 'resolved').length} tone="green" />
        <MapStat icon={Activity} label="Last 24h" value={pins.length} tone="blue" />
      </div>

      <div className="threat-map-filter">
        {['all', 'critical', 'high', 'medium', 'low'].map((f) => (
          <button key={f} className={`map-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Threats' : SEVERITY_CONFIG[f].label}
          </button>
        ))}
      </div>

      <div className="threat-map-container">
        {loading && <div className="map-loading"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        <div className="world-map-large">
          <div className="map-grid-overlay" />
          <div className="map-dots" />
          {filteredPins.map((pin) => {
            const cfg = SEVERITY_CONFIG[pin.severity];
            return (
              <button
                key={pin.id}
                className={`threat-pin ${selected?.id === pin.id ? 'selected' : ''}`}
                style={{ left: `${pin.x}%`, top: `${pin.y}%`, '--pin-color': cfg.color, '--pin-ring': cfg.ring } as React.CSSProperties}
                onClick={() => setSelected(pin)}
                aria-label={`${pin.location} - ${pin.severity}`}
              >
                <span className="pin-pulse" />
                <span className="pin-dot" />
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="map-detail-card">
            <div className="map-detail-header">
              <Globe className="h-4 w-4" />
              <strong>{selected.location}</strong>
              <button onClick={() => setSelected(null)} aria-label="Close">×</button>
            </div>
            <div className="map-detail-body">
              <div className="map-detail-row"><span>Threat Type</span><strong className="capitalize">{selected.type.replace('_', ' ')}</strong></div>
              <div className="map-detail-row"><span>Severity</span><strong style={{ color: SEVERITY_CONFIG[selected.severity].color }}>{SEVERITY_CONFIG[selected.severity].label}</strong></div>
              <div className="map-detail-row"><span>Reported</span><strong>{selected.time}</strong></div>
            </div>
          </div>
        )}
      </div>

      <div className="threat-map-legend">
        <span className="legend-title">Severity</span>
        {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
          <span key={key} className="legend-item"><i style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />{cfg.label}</span>
        ))}
      </div>

      <div className="threat-list-section">
        <h2>Recent Threat Activity</h2>
        <div className="threat-list">
          {pins.map((pin) => {
            const cfg = SEVERITY_CONFIG[pin.severity];
            return (
              <button key={pin.id} className={`threat-list-row ${selected?.id === pin.id ? 'active' : ''}`} onClick={() => setSelected(pin)}>
                <i style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
                <span className="threat-list-location">{pin.location}</span>
                <span className="threat-list-type capitalize">{pin.type.replace('_', ' ')}</span>
                <span className="threat-list-severity" style={{ color: cfg.color }}>{cfg.label}</span>
                <span className="threat-list-time">{pin.time}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MapStat({ icon: Icon, label, value, tone }: { icon: typeof Globe; label: string; value: number; tone: string }) {
  return <div className={`map-stat tone-${tone}`}><Icon className="h-5 w-5" /><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
