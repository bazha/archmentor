import { describe, it, expect } from 'vitest';
import { concepts, getConcept } from './index';
import { COURSE, COURSE_ORDER } from './course';
import { GRADE_ORDER } from '@/lib/labels';

describe('course ordering', () => {
  it('groups follow GRADE_ORDER', () => {
    expect(COURSE.map((g) => g.grade)).toEqual(GRADE_ORDER);
  });
  it('covers every concept exactly once', () => {
    expect(COURSE_ORDER.length).toBe(concepts.length);
    expect(new Set(COURSE_ORDER).size).toBe(COURSE_ORDER.length);
    expect([...COURSE_ORDER].sort()).toEqual(concepts.map((c) => c.id).sort());
  });
  it('each id exists and its grade matches its course group', () => {
    for (const group of COURSE)
      for (const id of group.conceptIds) {
        const c = getConcept(id);
        expect(c, `${id} should exist`).toBeDefined();
        expect(c!.grade, `${id} grade`).toBe(group.grade);
      }
  });
});
