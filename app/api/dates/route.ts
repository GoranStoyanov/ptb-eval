import { NextResponse } from 'next/server';

const API_URL = process.env.BASEROW_API_URL!;
const TABLE_ID = process.env.BASEROW_TABLE_ID!;
const TOKEN = process.env.BASEROW_TOKEN!;

type EvalRow = {
  match_date?: string;
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

export async function GET() {
  try {
    const rows = await fetchAll<EvalRow>(TABLE_ID);
    const set = new Set<string>();
    for (const r of rows) if (r.match_date) set.add(r.match_date);
    const dates = Array.from(set).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    return NextResponse.json({ ok: true, dates });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}