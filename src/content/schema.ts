import { z } from 'zod';

export const GradeSchema = z.enum(['junior', 'middle', 'senior', 'lead']);
export const CategorySchema = z.enum(['solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff']);
export const QuestionTypeSchema = z.enum(['identify-pattern', 'concept', 'tradeoff', 'code-smell']);

export const CodeSampleSchema = z.object({
  lang: z.literal('typescript'),
  code: z.string().min(1),
  highlightLines: z.array(z.number().int().nonnegative()).optional(),
});

export const ConceptSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  aka: z.array(z.string()).optional(),
  category: CategorySchema,
  grade: GradeSchema,
  tagline: z.string().min(1),
  definition: z.string().min(1),
  problem: z.string().min(1),
  solution: z.string().min(1),
  codeExample: CodeSampleSchema,
  pros: z.array(z.string()).min(1),
  cons: z.array(z.string()).min(1),
  tradeoffs: z.array(z.string()).min(1),
  whenToUse: z.array(z.string()).min(1),
  whenNotToUse: z.array(z.string()).optional(),
  related: z.array(z.string()),
  tags: z.array(z.string()).optional(),
});

export const QuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  type: QuestionTypeSchema,
  category: CategorySchema,
  grade: GradeSchema,
  prompt: z.string().min(1),
  code: CodeSampleSchema.optional(),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string().min(1),
  conceptId: z.string().optional(),
});

export type Grade = z.infer<typeof GradeSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type CodeSample = z.infer<typeof CodeSampleSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type Question = z.infer<typeof QuestionSchema>;

/** Validates shape + cross-references. Throws Error with a descriptive message on any violation. */
export function validateContent(concepts: Concept[], questions: Question[]): void {
  concepts.forEach((c) => ConceptSchema.parse(c));
  questions.forEach((q) => QuestionSchema.parse(q));

  const ids = new Set<string>();
  for (const c of concepts) {
    if (ids.has(c.id)) throw new Error(`duplicate concept id: ${c.id}`);
    ids.add(c.id);
  }

  const qIds = new Set<string>();
  for (const q of questions) {
    if (qIds.has(q.id)) throw new Error(`duplicate question id: ${q.id}`);
    qIds.add(q.id);
  }

  for (const q of questions) {
    if (q.correctIndex >= q.options.length) {
      throw new Error(`question "${q.id}" correctIndex ${q.correctIndex} is out of range (${q.options.length} options)`);
    }
    if (q.conceptId && !ids.has(q.conceptId)) {
      throw new Error(`question "${q.id}" conceptId "${q.conceptId}" is not a known concept`);
    }
  }

  for (const c of concepts) {
    for (const r of c.related) {
      if (!ids.has(r)) throw new Error(`concept "${c.id}" has related "${r}" that is not a known concept`);
    }
  }
}
