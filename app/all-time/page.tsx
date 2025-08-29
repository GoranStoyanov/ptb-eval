'use client';

import { useEffect, useMemo, useState } from 'react';

type Row = {
  player: string;
  dates_count: number;
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

type Resp = { ok: true; rows: Row[] };

export const dynamic = 'force-dynamic';

const tips = {
  player: 'Играчът, за когото са агрегирани всички оценки (всички дати).',
  matches: 'Брой дати/мачове, в които този играч има получени оценки.',
  overall: 'Средно от 6-те компонента (Technique, Positioning, Engagement, Focus, Teamplay, Position metric) агрегирано през всички дати.',
  self: 'Средна стойност на самооценките на играча през всички дати.',
  deltaSelf: 'Разлика: Self − Overall (положително = играчът се оценява по-високо от останалите).',
  technique: 'Първо докосване, точност на пасове, контрол върху топката (агрегирано през всички дати).',
  positioning: 'Заемане на зони, движение без топка, покриване на пространства (агрегирано през всички дати).',
  engagement: 'Интензитет, усилие, единоборства и преса (агрегирано през всички дати).',
  focus: 'Концентрация, реакция, минимизиране на грешки (агрегирано през всички дати).',
  teamplay: 'Комуникация, взаимодействие, дисциплина (агрегирано през всички дати).',
  position_metric: 'Показател според позицията (вратар: спасявания; защитник: 1v1/пресичания; халф: контрол/преход; нападател: завършващи удари) — агрегирано.'
};

export default function AllTimePage() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const r: Resp = await fetch('/api/summary-all', { cache: 'no-store' }).then(res => res.json());
        if (on && r?.ok) setData(r.rows || []);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const rows = useMemo(() => data.slice().sort((a, b) => b.overall - a.overall), [data]);

  return (
    <div className="ptb-card">
      <h1 style={{ marginTop: 0 }}>All time</h1>
      {loading ? (
        <div style={{ color: 'var(--ptb-muted)' }}>Зареждане…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th} title={tips.player}>Играч</th>
                <th style={th} title={tips.matches}>Мачове</th>
                <th style={th} title={tips.overall}>Overall</th>
                <th style={th} title={tips.self}>Self</th>
                <th style={th} title={tips.deltaSelf}>Δ(Self-Other)</th>
                <th style={th} title={tips.technique}>Technique</th>
                <th style={th} title={tips.positioning}>Positioning</th>
                <th style={th} title={tips.engagement}>Engagement</th>
                <th style={th} title={tips.focus}>Focus</th>
                <th style={th} title={tips.teamplay}>Teamplay</th>
                <th style={th} title={tips.position_metric}>Position metric</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.player}>
                  <td style={td}>{r.player}</td>
                  <td style={tdNum} title={tips.matches}>{r.dates_count}</td>
                  <td style={tdNum} title={tips.overall}>{r.overall.toFixed(2)}</td>
                  <td style={tdNum} title={tips.self}>{r.self_avg != null ? r.self_avg.toFixed(2) : '—'}</td>
                  <td style={tdNum} title={tips.deltaSelf}>{r.delta_self_vs_others != null ? r.delta_self_vs_others.toFixed(2) : '—'}</td>
                  <td style={tdNum} title={tips.technique}>{r.technique.toFixed(2)}</td>
                  <td style={tdNum} title={tips.positioning}>{r.positioning.toFixed(2)}</td>
                  <td style={tdNum} title={tips.engagement}>{r.engagement.toFixed(2)}</td>
                  <td style={tdNum} title={tips.focus}>{r.focus.toFixed(2)}</td>
                  <td style={tdNum} title={tips.teamplay}>{r.teamplay.toFixed(2)}</td>
                  <td style={tdNum} title={tips.position_metric}>{r.position_metric.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid var(--ptb-border)', padding: '8px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { borderBottom: '1px solid var(--ptb-border)', padding: '8px' };
const tdNum: React.CSSProperties = { ...td, textAlign: 'right', whiteSpace: 'nowrap' };
