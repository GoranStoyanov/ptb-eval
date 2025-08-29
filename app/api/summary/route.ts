// app/api/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.BASEROW_API_URL!;
const TABLE_ID = process.env.BASEROW_TABLE_ID!;
const SELF_TABLE_ID = process.env.BASEROW_SELF_TABLE_ID!;
const TOKEN = process.env.BASEROW_TOKEN!;

async function fetchAll(tableId: string) {
  const out: any[] = [];
  let url = `${API_URL}/api/database/rows/table/${tableId}/?user_field_names=true&page=1&size=200`;
  for (;;) {
    const res = await fetch(url, { headers: { Authorization: `Token ${TOKEN}` }, cache: 'no-store' });
    if (!res.ok) throw new Error(`Baserow fetch failed ${res.status}`);
    const json = await res.json();
    out.push(...(json?.results || []));
    const next = json?.next;
    if (!next) break;
    url = next;
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    if (!date) return NextResponse.json({ ok: false, error: 'Missing date' }, { status: 400 });

    const [evalRowsAll, selfRowsAll] = await Promise.all([fetchAll(TABLE_ID), fetchAll(SELF_TABLE_ID)]);
    const evalRows = evalRowsAll.filter((r) => r.match_date === date);
    const selfRows = selfRowsAll.filter((r) => r.match_date === date);

    const byPlayer: Record<string, any> = {};
    for (const r of evalRows) {
      const k = r.player as string;
      if (!k) continue;
      const o = byPlayer[k] || { player: k, count: 0, sums: { technique:0, positioning:0, engagement:0, focus:0, teamplay:0, position_metric:0 } };
      o.count++;
      o.sums.technique += Number(r.technique || 0);
      o.sums.positioning += Number(r.positioning || 0);
      o.sums.engagement += Number(r.engagement || 0);
      o.sums.focus += Number(r.focus || 0);
      o.sums.teamplay += Number(r.teamplay || 0);
      o.sums.position_metric += Number(r.position_metric || 0);
      byPlayer[k] = o;
    }

    const selfByPlayer: Record<string, { sum:number; count:number }> = {};
    // dedupe by submissionId so one self row per submission
    const seen = new Set<string>();
    for (const r of selfRows) {
      const key = `${r.submissionId}::${r.self_player}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const k = r.self_player as string;
      const obj = selfByPlayer[k] || { sum: 0, count: 0 };
      obj.sum += Number(r.self_score || 0);
      obj.count++;
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
      return { player: name, count: o.count, overall, self_avg, delta_self_vs_others, ...avg };
    });

    // distinct submissions that evaluated anyone on that date
    const distinctSubmissions = new Set(evalRows.map((r: any) => r.submissionId)).size;

    return NextResponse.json({ ok: true, date, total_submissions: distinctSubmissions, rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
