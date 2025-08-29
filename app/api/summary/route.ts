import { NextRequest, NextResponse } from 'next/server';

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
  team_overall: number; // анкета: отборна оценка (1–5) за мача
};

type SelfRow = {
  submissionId: string;
  match_date: string;
  self_player: string;
  self_score: number;
};

type BaserowListResponse<T> = {
  results: T[];
  next: string | null;
};

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    if (!date) return NextResponse.json({ ok: false, error: 'Missing date' }, { status: 400 });

    const [evalRowsAll, selfRowsAll] = await Promise.all([fetchAll<EvalRow>(TABLE_ID), fetchAll<SelfRow>(SELF_TABLE_ID)]);
    const evalRows = evalRowsAll.filter((r) => r.match_date === date);
    const selfRows = selfRowsAll.filter((r) => r.match_date === date);

    // Анкетна „team_overall“ средно по различни submissionId (по един на човек)
    const overallBySubmission = new Map<string, number>();
    for (const r of evalRows) {
      const v = Number(r.team_overall);
      if (!Number.isFinite(v) || v <= 0) continue;
      if (!overallBySubmission.has(r.submissionId)) overallBySubmission.set(r.submissionId, v);
    }
    const distinctSubmissions = overallBySubmission.size;
    const team_overall_avg =
      distinctSubmissions
        ? +(
            Array.from(overallBySubmission.values()).reduce((a, b) => a + b, 0) / distinctSubmissions
          ).toFixed(2)
        : null;

    // Агрегация по играч
    const byPlayer: Record<
      string,
      { player: string; count: number; sums: Record<'technique' | 'positioning' | 'engagement' | 'focus' | 'teamplay' | 'position_metric', number> }
    > = {};
    for (const r of evalRows) {
      const k = r.player;
      if (!k) continue;
      const o =
        byPlayer[k] ??
        {
          player: k,
          count: 0,
          sums: { technique: 0, positioning: 0, engagement: 0, focus: 0, teamplay: 0, position_metric: 0 }
        };
      o.count += 1;
      o.sums.technique += Number(r.technique || 0);
      o.sums.positioning += Number(r.positioning || 0);
      o.sums.engagement += Number(r.engagement || 0);
      o.sums.focus += Number(r.focus || 0);
      o.sums.teamplay += Number(r.teamplay || 0);
      o.sums.position_metric += Number(r.position_metric || 0);
      byPlayer[k] = o;
    }

    // Самооценки по играч (за справка в таблицата)
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
        position_metric: +(o.sums.position_metric / o.count).toFixed(2)
      };
      const overall = +(
        (avg.technique + avg.positioning + avg.engagement + avg.focus + avg.teamplay + avg.position_metric) /
        6
      ).toFixed(2);
      const selfAgg = selfByPlayer[name];
      const self_avg = selfAgg && selfAgg.count ? +(selfAgg.sum / selfAgg.count).toFixed(2) : null;
      const delta_self_vs_others = self_avg != null ? +(self_avg - overall).toFixed(2) : null;
      return { player: name, count: o.count, overall, self_avg, delta_self_vs_others, ...avg };
    });

    // Изчислена отборна: средно от per-player overall (равно тегло по играч)
    const computed_team_overall =
      rows.length ? +(rows.reduce((s, r) => s + r.overall, 0) / rows.length).toFixed(2) : null;

    // Δ между анкетната team_overall и изчислената отборна
    const delta_self_team_overall_vs_computed =
      team_overall_avg != null && computed_team_overall != null
        ? +(team_overall_avg - computed_team_overall).toFixed(2)
        : null;

    return NextResponse.json({
      ok: true,
      date,
      total_submissions: distinctSubmissions,
      team_overall_avg,                     // „анкета“
      computed_team_overall,               // „изчислена“
      delta_self_team_overall_vs_computed, // Δ(self - computed)
      rows
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
