'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import { surveyJson } from '../surveyJson';

type ValueChangedEvent = { name?: string; value?: unknown };
type CompletingEvent = { allow: boolean };

type PlayerPanel = {
  player?: string;
  technique?: number;
  positioning?: number;
  engagement?: number;
  focus?: number;
  teamplay?: number;
  position_metric?: number;
};

type SurveyData = {
  match_date?: string;
  count?: number | string;
  players?: PlayerPanel[];
  self_player?: string;
  self_score?: number | string;
  team_overall?: number | string;
  notes?: string;
};

type PanelDynamicHandle = {
  panelCount: number;
  minPanelCount?: number;
  maxPanelCount?: number;
  panels: Array<{ getQuestionByName: (n: string) => { addError: (m: string) => void } | undefined }>;
};

type QuestionHandle = { addError?: (m: string) => void };

function cryptoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as Crypto).randomUUID();
  return 'id-' + Math.random().toString(36).slice(2);
}

function buildPayload(data: SurveyData) {
  const timestamp = new Date().toISOString();
  const submissionId = cryptoId();
  const match_date = data?.match_date ?? '';
  const team_overall = Number(data?.team_overall ?? 0);
  const notes = data?.notes ?? '';
  const self_player = data?.self_player ?? '';
  const self_score_num = Number(data?.self_score ?? 0);
  const players = Array.isArray(data?.players) ? data.players : [];

  const evalRows = players
    .filter((p) => p?.player)
    .map((p) => ({
      submissionId,
      timestamp,
      match_date,
      player: String(p.player),
      technique: Number(p.technique ?? 0),
      positioning: Number(p.positioning ?? 0),
      engagement: Number(p.engagement ?? 0),
      focus: Number(p.focus ?? 0),
      teamplay: Number(p.teamplay ?? 0),
      position_metric: Number(p.position_metric ?? 0),
      team_overall,
      notes
    }));

  const selfRow = {
    submissionId,
    timestamp,
    match_date,
    self_player: String(self_player),
    self_score: Number(self_score_num.toFixed(1))
  };

  return { evalRows, selfRow, match_date };
}

export default function Page() {
  const survey = useMemo(() => new Model(surveyJson as unknown as Record<string, unknown>), []);
  const submittingRef = useRef<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    survey.locale = 'bg';

    const handleValueChanged = (sender: Model, opt: ValueChangedEvent) => {
      if (opt.name !== 'count') return;
      const n = parseInt(String(opt.value), 10) || 0;
      const pd = sender.getQuestionByName('players') as unknown as PanelDynamicHandle | undefined;
      if (!pd) return;
      const min = pd.minPanelCount ?? 1;
      const max = pd.maxPanelCount ?? 11;
      pd.panelCount = Math.max(min, Math.min(max, n));
    };

    const handleCompleting = (sender: Model, options: CompletingEvent) => {
      const pd = sender.getQuestionByName('players') as unknown as PanelDynamicHandle | undefined;
      if (!pd) return;

      const data = (sender.data as SurveyData)?.players ?? [];
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

      const cnt = parseInt(String((sender.data as SurveyData)?.count), 10) || 0;
      const target = Math.max(pd.minPanelCount ?? 1, Math.min(pd.maxPanelCount ?? 11, cnt));
      if (pd.panelCount !== target) {
        pd.panelCount = target;
        options.allow = false;
      }

      const selfScore = Number((sender.data as SurveyData)?.self_score);
      if (isNaN(selfScore) || selfScore < 1 || selfScore > 5) {
        options.allow = false;
        const q = (sender.getQuestionByName('self_score') as unknown) as QuestionHandle;
        q?.addError?.('Самооценката трябва да е между 1.0 и 5.0.');
      }
    };

    const handleComplete = async (sender: Model) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      const { evalRows, selfRow, match_date } = buildPayload(sender.data as SurveyData);
      try {
        await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ evalRows, selfRow }),
          cache: 'no-store'
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
