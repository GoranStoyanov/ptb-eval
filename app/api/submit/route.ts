import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.BASEROW_API_URL!;
const TABLE_ID = process.env.BASEROW_TABLE_ID!;           // Responses
const SELF_TABLE_ID = process.env.BASEROW_SELF_TABLE_ID!; // SelfAssessments
const TOKEN = process.env.BASEROW_TOKEN!;

type EvalRow = {
  submissionId: string;
  timestamp: string;
  match_date: string;
  player: string;
  technique: number;
  positioning: number;
  engagement: number;
  focus: number;
  teamplay: number;
  position_metric: number;
  team_overall: number;
  notes: string;
};

type SelfRow = {
  submissionId: string;
  timestamp: string;
  match_date: string;
  self_player: string;
  self_score: number;
};

type SubmitBody = { evalRows: EvalRow[]; selfRow: SelfRow };

async function insertRow(tableId: string, row: Record<string, unknown>): Promise<unknown> {
  const url = `${API_URL}/api/database/rows/table/${tableId}/?user_field_names=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
    cache: 'no-store'
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Baserow insert failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubmitBody;
    const evalRows = Array.isArray(body?.evalRows) ? body.evalRows : [];
    const selfRow = body?.selfRow ?? null;
    if (!evalRows.length || !selfRow) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    if (!API_URL || !TABLE_ID || !SELF_TABLE_ID || !TOKEN) return NextResponse.json({ ok: false, error: 'Missing env' }, { status: 500 });

    const BATCH = 25;
    for (let i = 0; i < evalRows.length; i += BATCH) {
      const chunk = evalRows.slice(i, i + BATCH);
      await Promise.all(chunk.map((r) => insertRow(TABLE_ID, r)));
    }
    await insertRow(SELF_TABLE_ID, selfRow);

    return NextResponse.json({ ok: true, inserted: evalRows.length + 1 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
