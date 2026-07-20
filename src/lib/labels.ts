import type { Grade, Category } from '@/content/schema';
import type { Lang } from '@/i18n/lang';

export const GRADE_ORDER: Grade[] = ['junior', 'middle', 'senior', 'lead'];

export const GRADE_LABEL: Record<Grade, string> = {
  junior: 'Junior', middle: 'Middle', senior: 'Senior', lead: 'Lead',
};

export const CATEGORY_LABEL: Record<Lang, Record<Category, string>> = {
  ru: {
    solid: 'SOLID', creational: 'Порождающие', structural: 'Структурные',
    behavioral: 'Поведенческие', architecture: 'Архитектурные стили', tradeoff: 'Trade-offs',
    microservices: 'Микросервисы',
  },
  en: {
    solid: 'SOLID', creational: 'Creational', structural: 'Structural',
    behavioral: 'Behavioral', architecture: 'Architecture styles', tradeoff: 'Trade-offs',
    microservices: 'Microservices',
  },
};
