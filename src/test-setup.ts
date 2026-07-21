import '@testing-library/jest-dom/vitest';
import { conceptProse as ruConceptProse, questionProse as ruQuestionProse } from '@/content/locales/ru';
import { conceptProse as enConceptProse, questionProse as enQuestionProse } from '@/content/locales/en';
import { setProse } from '@/content/registry';

setProse('ru', { concepts: ruConceptProse, questions: ruQuestionProse });
setProse('en', { concepts: enConceptProse, questions: enQuestionProse });
