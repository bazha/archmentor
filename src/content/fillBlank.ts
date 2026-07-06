import type { Question } from './schema';

// Fill-in-the-blank questions: a concept definition with one key term blanked
// to `___`; options are candidate terms. Bilingual, index-aligned options.
// (Phase 2 regenerates this file with one question per concept.)
export const fillBlankQuestions: Question[] = [
  {
    id: 'fb-strategy-1',
    type: 'fill-blank',
    category: 'behavioral',
    grade: 'middle',
    prompt: {
      ru: 'Определяет семейство алгоритмов, инкапсулирует каждый из них и делает их ___. Strategy позволяет менять алгоритм независимо от клиента, который им пользуется.',
      en: 'Defines a family of algorithms, encapsulates each one, and makes them ___. Strategy lets the algorithm vary independently from the clients that use it.',
    },
    options: {
      ru: ['взаимозаменяемыми', 'неизменяемыми', 'потокобезопасными', 'отложенными'],
      en: ['interchangeable', 'immutable', 'thread-safe', 'lazy'],
    },
    correctIndex: 0,
    explanation: {
      ru: 'Суть Strategy — взаимозаменяемость алгоритмов за общим интерфейсом. Неизменяемость, потокобезопасность и ленивость к определению не относятся.',
      en: 'The essence of Strategy is interchangeable algorithms behind a common interface. Immutability, thread-safety, and laziness are not part of its definition.',
    },
    conceptId: 'strategy',
  },
  {
    id: 'fb-singleton-1',
    type: 'fill-blank',
    category: 'creational',
    grade: 'junior',
    prompt: {
      ru: 'Гарантирует, что у класса есть только один ___, и предоставляет глобальную точку доступа к нему.',
      en: 'Ensures that a class has only one ___ and provides a global point of access to it.',
    },
    options: {
      ru: ['экземпляр', 'интерфейс', 'наследник', 'поток'],
      en: ['instance', 'interface', 'subclass', 'thread'],
    },
    correctIndex: 0,
    explanation: {
      ru: 'Singleton гарантирует единственный экземпляр класса и глобальную точку доступа к нему.',
      en: 'Singleton guarantees a single instance of a class and a global point of access to it.',
    },
    conceptId: 'singleton',
  },
];
