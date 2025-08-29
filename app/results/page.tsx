import { Suspense } from 'react';
import ResultsClient from './ResultsClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <ResultsClient />
    </Suspense>
  );
}