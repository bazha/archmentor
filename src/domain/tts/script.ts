import type { ConceptView } from '@/content/localize';

export type SpeechSectionId =
  | 'tagline' | 'definition' | 'problem' | 'solution' | 'code'
  | 'pros' | 'cons' | 'tradeoffs' | 'whenToUse' | 'whenNotToUse';

export interface SpeechSection {
  id: SpeechSectionId;
  text: string;
}

export interface SpeechLabels {
  definition: string; problem: string; solution: string; code: string;
  pros: string; cons: string; tradeoffs: string; whenToUse: string; whenNotToUse: string;
}

/** `${label}. ${body}` for prose; list items joined with '. ' as sentence pauses. */
function section(id: SpeechSectionId, label: string, body: string): SpeechSection {
  return { id, text: `${label}. ${body}` };
}

export function buildSpeechScript(c: ConceptView, labels: SpeechLabels): SpeechSection[] {
  const out: SpeechSection[] = [{ id: 'tagline', text: c.tagline }];
  if (c.definition) out.push(section('definition', labels.definition, c.definition));
  if (c.problem) out.push(section('problem', labels.problem, c.problem));
  if (c.solution) out.push(section('solution', labels.solution, c.solution));
  if (c.codeExample.code) out.push({ id: 'code', text: labels.code });
  if (c.pros.length) out.push(section('pros', labels.pros, c.pros.join('. ')));
  if (c.cons.length) out.push(section('cons', labels.cons, c.cons.join('. ')));
  if (c.tradeoffs.length) out.push(section('tradeoffs', labels.tradeoffs, c.tradeoffs.join('. ')));
  if (c.whenToUse.length) out.push(section('whenToUse', labels.whenToUse, c.whenToUse.join('. ')));
  if (c.whenNotToUse?.length) out.push(section('whenNotToUse', labels.whenNotToUse, c.whenNotToUse.join('. ')));
  return out;
}
