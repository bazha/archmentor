import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildSpeechScript, type SpeechLabels, type SpeechSectionId } from '@/domain/tts/script';
import { isSpeechSupported, getVoiceForLang, speak, type SpeechController } from '@/domain/tts/speaker';
import type { ConceptView } from '@/content/localize';
import { useT } from '@/i18n/useT';
import { useStore } from '@/store/useStore';

export type SpeechStatus = 'unsupported' | 'idle' | 'playing' | 'paused';

export interface ConceptSpeech {
  status: SpeechStatus;
  activeId: SpeechSectionId | null;
  ordinal: number;
  total: number;
  rate: number;
  play(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  jumpTo(id: SpeechSectionId): void;
}

export function useConceptSpeech(concept: ConceptView): ConceptSpeech {
  const lang = useStore((s) => s.settings.lang);
  const t = useT();

  const sections = useMemo(() => {
    const labels: SpeechLabels = {
      definition: t('concept.definition'), problem: t('concept.problem'),
      solution: t('concept.solution'), code: t('concept.audio.codeNote'),
      pros: t('concept.pros'), cons: t('concept.cons'), tradeoffs: t('concept.tradeoffs'),
      whenToUse: t('concept.whenToUse'), whenNotToUse: t('concept.whenNotToUse'),
    };
    return buildSpeechScript(concept, labels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept, lang]);

  const [status, setStatus] = useState<SpeechStatus>(() => (isSpeechSupported() ? 'idle' : 'unsupported'));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [rate, setRateState] = useState(1);
  const ctrlRef = useRef<SpeechController | null>(null);

  const start = useCallback((from: number, rateOverride?: number) => {
    if (!isSpeechSupported() || sections.length === 0) return;
    ctrlRef.current = speak(sections, {
      startIndex: from,
      rate: rateOverride ?? rate,
      voice: getVoiceForLang(lang),
      onSectionStart: (i) => { setActiveIndex(i); setStatus('playing'); },
      onDone: () => { setActiveIndex(null); setStatus('idle'); ctrlRef.current = null; },
    });
    setStatus('playing');
  }, [sections, rate, lang]);

  const play = useCallback(() => start(0), [start]);
  const jumpTo = useCallback((id: SpeechSectionId) => {
    const i = sections.findIndex((s) => s.id === id);
    if (i >= 0) start(i);
  }, [sections, start]);
  const pause = useCallback(() => { ctrlRef.current?.pause(); setStatus('paused'); }, []);
  const resume = useCallback(() => { ctrlRef.current?.resume(); setStatus('playing'); }, []);
  const stop = useCallback(() => {
    ctrlRef.current?.stop(); ctrlRef.current = null;
    setActiveIndex(null); setStatus('idle');
  }, []);
  const setRate = useCallback((r: number) => {
    setRateState(r);
    if (status === 'playing' && activeIndex != null) start(activeIndex, r);
  }, [status, activeIndex, start]);

  // Cleanup on unmount.
  useEffect(() => () => { ctrlRef.current?.stop(); ctrlRef.current = null; }, []);
  // Stop and reset when the concept or language changes (no background voice).
  useEffect(() => {
    ctrlRef.current?.stop(); ctrlRef.current = null;
    setActiveIndex(null);
    setStatus(isSpeechSupported() ? 'idle' : 'unsupported');
  }, [concept.id, lang]);

  return {
    status,
    activeId: activeIndex == null ? null : sections[activeIndex].id,
    ordinal: activeIndex == null ? 0 : activeIndex + 1,
    total: sections.length,
    rate,
    play, pause, resume, stop, setRate, jumpTo,
  };
}
