// app/page.tsx
'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import { surveyJson } from './surveyJson';

function cryptoId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID();
  return 'id-' + Math.random().toString(36).slice(2);
}

function buildPayload(data: any) {
  const timestamp = new Date().toISOString();
  const submissionId = cryptoId();
  const match_date = data?.match_date ?? '';
  const team_overall = data?.team_overall ?? '';
  const notes = data?.notes ?? '';
  const self_player = data?.self_player ?? '';
  const self_score = Number(data?.self_score ?? 0);
  const players = Array.isArray(data?.players) ? data.players : [];

  const evalRows = [];
  for (let i = 0; i < players.length; i++) {
    const p = players[i] || {};
    if (!p.player) continue;
    evalRows.push({
      submissionId, timestamp, match_date,
      player: p.player,
      technique: Number(p.technique ?? 0),
      positioning: Number(p.positioning ?? 0),
      engagement: Number(p.engagement ?? 0),
      focus: Number(p.focus ?? 0),
      teamplay: Number(p.teamplay ?? 0),
      position_metric: Number(p.position_metric ?? 0),
      team_overall: Number(team_overall ?? 0),
      notes
    });
  }
  const selfRow = {
    submissionId, timestamp, match_date,
    self_player, self_score: Number(self_score.toFixed(1))
  };
  return { evalRows, selfRow, match_date };
}

export default function Page() {
  const survey = useMemo(() => new Model(surveyJson as any), []);
  const submittingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    survey.locale = 'bg';

    const handleValueChanged = (sender: any, opt: any) => {
      if (opt.name !== 'count') return;
      const n = parseInt(String(opt.value), 10) || 0;
      const pd: any = sender.getQuestionByName('players');
      const min = pd.minPanelCount ?? 1;
      const max = pd.maxPanelCount ?? 11;
      pd.panelCount = Math.max(min, Math.min(max, n));
    };

    const handleCompleting = (sender: any, options: any) => {
      const pd: any = sender.getQuestionByName('players');
      const data = sender.getValue('players') || [];
      const seen = new Set<string>();
      for (let i = 0; i < data.length; i++) {
        const name = data[i]?.player;
        if (!name) continue;
        if (seen.has(name)) {
          options.allow = false;
          pd.panels[i].getQuestionByName('player')?.addError('Играчът е избран повече от веднъж.');
          return;
        }
        seen.add(name);
      }
      const cnt = parseInt(String(sender.getValue('count')), 10) || 0;
      const target = Math.max(pd.minPanelCount ?? 1, Math.min(pd.maxPanelCount ?? 11, cnt));
      if (pd.panelCount !== target) {
        pd.panelCount = target;
        options.allow = false;
      }
      const selfScore = Number(sender.getValue('self_score'));
      if (isNaN(selfScore) || selfScore < 1 || selfScore > 5) {
        options.allow = false;
        const q = sender.getQuestionByName('self_score');
        q.addError('Самооценката трябва да е между 1.0 и 5.0.');
      }
    };

    const handleComplete = async (sender: any) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      const { evalRows, selfRow, match_date } = buildPayload(sender.data);
      try {
        await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ evalRows, selfRow })
        });
      } finally {
        router.replace(`/results?date=${encodeURIComponent(match_date)}`);
      }
    };

    survey.onValueChanged.add(handleValueChanged);
    survey.onCompleting.add(handleCompleting);
    survey.onComplete.add(handleComplete);

    return () => {
      survey.onValueChanged.remove(handleValueChanged);
      survey.onCompleting.remove(handleCompleting);
      survey.onComplete.remove(handleComplete);
    };
  }, [survey, router]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <Survey model={survey} />
    </div>
  );
}
