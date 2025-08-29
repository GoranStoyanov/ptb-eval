'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type Row = {
  player: string;
  count: number;
  overall: number;
  self_avg: number | null;
  delta_self_vs_others: number | null;
  technique: number;
  positioning: number;
  engagement: number;
  focus: number;
  teamplay: number;
  position_metric: number;
};

export default function ResultsClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const qDate = sp.get('date') || '';
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState<string>(qDate);
  const [data, setData] = useState<{ rows: Row[]; total_submissions: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/dates', { cache: 'no-store' }).then(res => res.json());
      if (r?.ok) {
        setDates(r.dates || []);
        if (!qDate && r.dates?.length) {
          const d = r.dates[0];
          setDate(d);
          router.replace(`/results?date=${encodeURIComponent(d)}`);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    fetch(`/api/summary?date=${encodeURIComponent(date)}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json?.ok) setData({ rows: json.rows, total_submissions: json.total_submissions });
      })
      .finally(() => setLoading(false));
  }, [date]);

  const rows = useMemo(() => {
    return (data?.rows || []).slice().sort((a, b) => b.overall - a.overall);
  }, [data]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label htmlFor="date">Дата:</label>
        <select
          id="date"
          value={date}
          onChange={(e) => {
            const v = e.target.value;
            setDate(v);
            router.replace(`/results?date=${encodeURIComponent(v)}`);
          }}
        >
          {dates.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          {loading ? 'Зареждане…' : data ? `Подадени формуляри: ${data.total_submissions}` : ''}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Играч</th>
              <th style={th}>N</th>
              <th style={th}>Overall</th>
              <th style={th}>Self</th>
              <th style={th}>Δ(Self-Other)</th>
              <th style={th}>Technique</th>
              <th style={th}>Positioning</th>
              <th style={th}>Engagement</th>
              <th style={th}>Focus</th>
              <th style={th}>Teamplay</th>
              <th style={th}>Position metric</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.player}>
                <td style={td}>{r.player}</td>
                <td style={tdNum}>{r.count}</td>
                <td style={tdNum}>{r.overall.toFixed(2)}</td>
                <td style={tdNum}>{r.self_avg != null ? r.self_avg.toFixed(2) : '—'}</td>
                <td style={tdNum}>{r.delta_self_vs_others != null ? r.delta_self_vs_others.toFixed(2) : '—'}</td>
                <td style={tdNum}>{r.technique.toFixed(2)}</td>
                <td style={tdNum}>{r.positioning.toFixed(2)}</td>
                <td style={tdNum}>{r.engagement.toFixed(2)}</td>
                <td style={tdNum}>{r.focus.toFixed(2)}</td>
                <td style={tdNum}>{r.teamplay.toFixed(2)}</td>
                <td style={tdNum}>{r.position_metric.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' };
const td: React.CSSProperties = { borderBottom: '1px solid #eee', padding: '8px' };
const tdNum: React.CSSProperties = { ...td, textAlign: 'right', whiteSpace: 'nowrap' };
