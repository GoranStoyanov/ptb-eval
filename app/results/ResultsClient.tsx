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

type CommentItem = { author: string; note: string };

type SummaryResponse = {
  ok: true;
  date: string;
  total_submissions: number;
  team_overall_avg: number | null;          // анкета
  computed_team_overall: number | null;     // изчислена (равно тегло по играч)
  delta_self_team_overall_vs_computed: number | null;
  rows: Row[];
  comments: CommentItem[];

};

export default function ResultsClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const qDate = sp.get('date') || '';
  const [dates, setDates] = useState<string[]>([]);
  const [date, setDate] = useState<string>(qDate);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const tips = {
    player: 'Играчът, за когото са агрегирани оценките.',
    n: 'Брой получени оценки за този играч на избраната дата.',
    overall: 'Средно от 6-те компонента (Technique, Positioning, Engagement, Focus, Teamplay, Position metric).',
    self: 'Самооценка на играча за избраната дата.',
    deltaSelf: 'Разлика: Self − Overall (положително = играчът се оценява по-високо от останалите).',
    technique: 'Първо докосване, точност на пасове, контрол върху топката.',
    positioning: 'Заемане на зони, движение без топка, покриване на пространства.',
    engagement: 'Интензитет, усилие, единоборства и преса.',
    focus: 'Концентрация, реакция, минимизиране на грешки.',
    teamplay: 'Комуникация, взаимодействие, дисциплина.',
    position_metric: 'Показател според позицията (вратар: спасявания; защитник: 1v1/пресичания; халф: контрол/преход; нападател: завършващи удари).'
  };

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
      .then((json: SummaryResponse) => {
        if (json?.ok) setData(json);
      })
      .finally(() => setLoading(false));
  }, [date]);

  const rows = useMemo(() => {
    return (data?.rows || []).slice().sort((a, b) => b.overall - a.overall);
  }, [data]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
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

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          {loading ? (
            <span>Зареждане…</span>
          ) : data ? (
            <>
              <span>Подадени формуляри: {data.total_submissions}</span>
              <span>Отборна (анкета): {data.team_overall_avg != null ? data.team_overall_avg.toFixed(2) : '—'}</span>
              <span>Отборна (изчислена): {data.computed_team_overall != null ? data.computed_team_overall.toFixed(2) : '—'}</span>
              <span>Δ(Self−Computed): {data.delta_self_team_overall_vs_computed != null ? data.delta_self_team_overall_vs_computed.toFixed(2) : '—'}</span>
            </>
          ) : null}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th} title={tips.player}>Играч</th>
              <th style={th} title={tips.n}>Брой оценки</th>
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
       {data && data.comments && data.comments.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ margin: '16px 0 8px' }}>Коментари:</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {data.comments.map((c, i) => (
              <li key={`${c.author}-${i}`} style={{
                border: '1px solid var(--ptb-border)',
                borderRadius: 10,
                padding: '10px 12px',
                background: 'rgba(255,255,255,.02)'
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.author}</div>
                <div style={{ color: 'var(--ptb-text)' }}>{c.note}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' };
const td: React.CSSProperties = { borderBottom: '1px solid #eee', padding: '8px' };
const tdNum: React.CSSProperties = { ...td, textAlign: 'right', whiteSpace: 'nowrap' };
