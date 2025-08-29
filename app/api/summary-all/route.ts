import { NextResponse } from 'next/server';

const API_URL = process.env.BASEROW_API_URL!;
const TABLE_ID = process.env.BASEROW_TABLE_ID!;
const SELF_TABLE_ID = process.env.BASEROW_SELF_TABLE_ID!;
const TOKEN = process.env.BASEROW_TOKEN!;

type EvalRow = {
  submissionId: string;
  match_date: string;
  player: string;
  technique: number;
  positioning: number;
  engagement: number;
  focus: number;
  teamplay: number;
  position_metric: number;
};

type SelfRow = {
  submissionId: string;
  match_date: string;
  self_player: string;
  self_score: number;
};

type BaserowListResponse<T> = { results: T[]; next: string | null };

async function fetchAll<T>(tableId: string): Promise<T[]> {
  const out: T[] = [];
  let url = `${API_URL}/api/database/rows/table/${tableId}/?user_field_names=true&page=1&size=200`;
  for (;;) {
    const res = await fetch(url, { headers: { Authorization: `Token ${TOKEN}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(`Baserow fetch failed ${res.status}`);
    const json = (await res.json()) as BaserowListResponse<T>;
    out.push(...(json.results ?? []));
    if (!json.next) break;
    url = json.next;
  }
  return out;
}

export async function GET() {
  try {
    const [evalRows, selfRows] = await Promise.all([fetchAll<EvalRow>(TABLE_ID), fetchAll<SelfRow>(SELF_TABLE_ID)]);

    const byPlayer: Record<
      string,
      { dates: Set<string>; count: number; sums: Record<'technique'|'positioning'|'engagement'|'focus'|'teamplay'|'position_metric', number> }
    > = {};
    for (const r of evalRows) {
      const k = r.player;
      if (!k) continue;
      const o =
        byPlayer[k] ??
        { dates: new Set<string>(), count: 0, sums: { technique: 0, positioning: 0, engagement: 0, focus: 0, teamplay: 0, position_metric: 0 } };
      o.count += 1;
      o.dates.add(r.match_date);
      o.sums.technique += Number(r.technique || 0);
      o.sums.positioning += Number(r.positioning || 0);
      o.sums.engagement += Number(r.engagement || 0);
      o.sums.focus += Number(r.focus || 0);
      o.sums.teamplay += Number(r.teamplay || 0);
      o.sums.position_metric += Number(r.position_metric || 0);
      byPlayer[k] = o;
    }

    const selfByPlayer: Record<string, { sum: number; count: number }> = {};
    const seen = new Set<string>();
    for (const r of selfRows) {
      const key = `${r.submissionId}::${r.self_player}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const k = r.self_player;
      const obj = selfByPlayer[k] ?? { sum: 0, count: 0 };
      obj.sum += Number(r.self_score || 0);
      obj.count += 1;
      selfByPlayer[k] = obj;
    }

    const players = Object.keys(byPlayer).sort((a, b) => a.localeCompare(b));
    const rows = players.map((name) => {
      const o = byPlayer[name];
      const avg = {
        technique: +(o.sums.technique / o.count).toFixed(2),
        positioning: +(o.sums.positioning / o.count).toFixed(2),
        engagement: +(o.sums.engagement / o.count).toFixed(2),
        focus: +(o.sums.focus / o.count).toFixed(2),
        teamplay: +(o.sums.teamplay / o.count).toFixed(2),
        position_metric: +(o.sums.position_metric / o.count).toFixed(2),
      };
      const overall = +((avg.technique + avg.positioning + avg.engagement + avg.focus + avg.teamplay + avg.position_metric) / 6).toFixed(2);
      const selfAgg = selfByPlayer[name];
      const self_avg = selfAgg && selfAgg.count ? +(selfAgg.sum / selfAgg.count).toFixed(2) : null;
      const delta_self_vs_others = self_avg != null ? +(self_avg - overall).toFixed(2) : null;
      const dates_count = o.dates.size;
      return { player: name, dates_count, overall, self_avg, delta_self_vs_others, ...avg };
    });

    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
