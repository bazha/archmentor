import type { Grade, Category } from '@/content/schema';

export const GRADE_ORDER: Grade[] = ['junior', 'middle', 'senior', 'lead'];

export const GRADE_LABEL: Record<Grade, string> = {
  junior: 'Junior', middle: 'Middle', senior: 'Senior', lead: 'Lead',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  solid: 'SOLID',
  creational: 'Порождающие',
  structural: 'Структурные',
  behavioral: 'Поведенческие',
  architecture: 'Архитектурные стили',
  tradeoff: 'Trade-offs',
};
