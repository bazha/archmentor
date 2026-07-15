import { z } from 'zod';
import { LocalizedSchema, GradeSchema, type Localized } from './schema';
import { COMPONENT_TYPES, type ComponentType } from '@/domain/diagram/types';

const ComponentTypeSchema = z.enum(COMPONENT_TYPES);

const ConstraintSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('required-node'), node: ComponentTypeSchema }),
  z.object({ kind: z.literal('any-of'), nodes: z.array(ComponentTypeSchema).min(2) }),
  z.object({ kind: z.literal('forbidden-node'), node: ComponentTypeSchema, severity: z.enum(['warn', 'fail']) }),
  z.object({ kind: z.literal('required-edge'), from: ComponentTypeSchema, to: ComponentTypeSchema }),
  z.object({ kind: z.literal('between'), middle: ComponentTypeSchema, from: ComponentTypeSchema, to: ComponentTypeSchema }),
]);

const DiagramNodeSchema = z.object({ id: z.string().min(1), type: ComponentTypeSchema });
const DiagramEdgeSchema = z.object({ from: z.string().min(1), to: z.string().min(1) });
const DiagramSchema = z.object({ nodes: z.array(DiagramNodeSchema), edges: z.array(DiagramEdgeSchema) });

export const ScenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  grade: GradeSchema,
  title: LocalizedSchema,
  brief: LocalizedSchema,
  palette: z.array(ComponentTypeSchema).min(1),
  constraints: z.array(ConstraintSchema).min(1),
  reference: DiagramSchema,
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const componentNames: Record<ComponentType, Localized> = {
  'client': { ru: 'Клиент', en: 'Client' },
  'load-balancer': { ru: 'Балансировщик', en: 'Load balancer' },
  'api-server': { ru: 'API-сервер', en: 'API server' },
  'cache': { ru: 'Кэш (Redis)', en: 'Cache (Redis)' },
  'sql-db': { ru: 'SQL БД', en: 'SQL DB' },
  'nosql-db': { ru: 'NoSQL БД', en: 'NoSQL DB' },
  'message-queue': { ru: 'Очередь сообщений', en: 'Message queue' },
  'cdn': { ru: 'CDN', en: 'CDN' },
  'object-store': { ru: 'Объектное хранилище', en: 'Object store' },
  'rate-limiter': { ru: 'Rate limiter', en: 'Rate limiter' },
  'worker': { ru: 'Воркер', en: 'Worker' },
};

// Node-id convention in references: `${type}` (one instance per type is enough for grading).
const n = (type: ComponentType) => ({ id: type, type });

export const scenarios: Scenario[] = [
  // ---- junior ----
  {
    id: 'blog-api',
    grade: 'junior',
    title: { ru: 'Блог / CRUD API', en: 'Blog / CRUD API' },
    brief: {
      ru: 'Спроектируй бэкенд простого блога: посты и комментарии, умеренная нагрузка на чтение и запись.',
      en: 'Design a simple blog backend: posts and comments, moderate read/write load.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'sql-db', 'nosql-db', 'cache'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'] },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
  {
    id: 'url-shortener',
    grade: 'junior',
    title: { ru: 'Сокращатель ссылок', en: 'URL shortener' },
    brief: {
      ru: 'Спроектируй сервис коротких ссылок (bit.ly). ~100M редиректов/день, чтение >> запись, латентность < 50 мс.',
      en: 'Design a URL shortener (bit.ly). ~100M redirects/day, read-heavy, latency < 50ms.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'cache', 'sql-db', 'nosql-db', 'cdn', 'message-queue'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'cache' },
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'] },
      { kind: 'required-edge', from: 'api-server', to: 'cache' },
      { kind: 'forbidden-node', node: 'message-queue', severity: 'warn' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('cache'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'cache' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
  // ---- middle ----
  {
    id: 'rate-limiter',
    grade: 'middle',
    title: { ru: 'Rate limiter', en: 'Rate limiter' },
    brief: {
      ru: 'Спроектируй ограничитель запросов перед API. Лимит на пользователя, счётчики должны переживать рестарт инстанса.',
      en: 'Design request rate limiting in front of the API. Per-user limits; counters must survive an instance restart.',
    },
    palette: ['client', 'load-balancer', 'rate-limiter', 'api-server', 'cache', 'sql-db'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'rate-limiter' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'cache' },
      { kind: 'between', middle: 'rate-limiter', from: 'client', to: 'api-server' },
      { kind: 'required-edge', from: 'rate-limiter', to: 'cache' },
    ],
    reference: {
      nodes: [n('client'), n('rate-limiter'), n('api-server'), n('cache'), n('sql-db')],
      edges: [
        { from: 'client', to: 'rate-limiter' },
        { from: 'rate-limiter', to: 'api-server' },
        { from: 'rate-limiter', to: 'cache' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
  {
    id: 'file-upload',
    grade: 'middle',
    title: { ru: 'Загрузка файлов', en: 'File upload service' },
    brief: {
      ru: 'Спроектируй сервис загрузки и отдачи файлов/изображений. Большие бинарники, быстрая отдача пользователям.',
      en: 'Design a file/image upload and delivery service. Large binaries, fast delivery to users.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'object-store', 'cdn', 'sql-db', 'nosql-db'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'object-store' },
      { kind: 'required-edge', from: 'api-server', to: 'object-store' },
      { kind: 'required-edge', from: 'client', to: 'cdn' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('object-store'), n('cdn'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'object-store' },
        { from: 'client', to: 'cdn' },
        { from: 'cdn', to: 'object-store' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
  // ---- senior ----
  {
    id: 'news-feed',
    grade: 'senior',
    title: { ru: 'Лента новостей', en: 'News feed' },
    brief: {
      ru: 'Спроектируй ленту постов с медиа. Много чтений, нужна доставка картинок и низкая латентность.',
      en: 'Design a post feed with media. Read-heavy, needs image delivery and low latency.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'cache', 'sql-db', 'nosql-db', 'cdn', 'object-store', 'message-queue'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'cache' },
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'] },
      { kind: 'required-edge', from: 'api-server', to: 'cache' },
      { kind: 'required-edge', from: 'client', to: 'cdn' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('cache'), n('nosql-db'), n('cdn'), n('object-store')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'cache' },
        { from: 'api-server', to: 'nosql-db' },
        { from: 'client', to: 'cdn' },
        { from: 'cdn', to: 'object-store' },
      ],
    },
  },
  {
    id: 'chat',
    grade: 'senior',
    title: { ru: 'Чат / мессенджинг', en: 'Chat / messaging' },
    brief: {
      ru: 'Спроектируй мессенджер: доставка сообщений в реальном времени, presence, история переписки.',
      en: 'Design a messaging app: real-time delivery, presence, message history.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'message-queue', 'cache', 'nosql-db', 'sql-db'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'message-queue' },
      { kind: 'required-node', node: 'cache' },
      { kind: 'any-of', nodes: ['nosql-db', 'sql-db'] },
      { kind: 'required-edge', from: 'api-server', to: 'message-queue' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('message-queue'), n('cache'), n('nosql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'message-queue' },
        { from: 'api-server', to: 'cache' },
        { from: 'api-server', to: 'nosql-db' },
      ],
    },
  },
  // ---- lead ----
  {
    id: 'notifications',
    grade: 'lead',
    title: { ru: 'Система нотификаций', en: 'Notification system' },
    brief: {
      ru: 'Спроектируй мультиканальную рассылку уведомлений (email/SMS/push) с фан-аутом. Отправители не должны блокироваться доставкой.',
      en: 'Design a multi-channel notification fan-out (email/SMS/push). Senders must not block on delivery.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'message-queue', 'worker', 'cache', 'sql-db', 'nosql-db'],
    constraints: [
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'message-queue' },
      { kind: 'required-node', node: 'worker' },
      { kind: 'between', middle: 'message-queue', from: 'api-server', to: 'worker' },
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'] },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('message-queue'), n('worker'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'message-queue' },
        { from: 'message-queue', to: 'worker' },
        { from: 'worker', to: 'sql-db' },
      ],
    },
  },
  {
    id: 'video-streaming',
    grade: 'lead',
    title: { ru: 'Видеостриминг', en: 'Video streaming' },
    brief: {
      ru: 'Спроектируй видеосервис: загрузка, транскодинг в фоне, глобальная отдача с низкой задержкой.',
      en: 'Design a video service: upload, background transcoding, low-latency global delivery.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'object-store', 'message-queue', 'worker', 'cdn', 'sql-db', 'nosql-db'],
    constraints: [
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'object-store' },
      { kind: 'required-node', node: 'message-queue' },
      { kind: 'required-node', node: 'worker' },
      { kind: 'between', middle: 'message-queue', from: 'api-server', to: 'worker' },
      { kind: 'required-edge', from: 'client', to: 'cdn' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('object-store'), n('message-queue'), n('worker'), n('cdn'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'object-store' },
        { from: 'api-server', to: 'message-queue' },
        { from: 'message-queue', to: 'worker' },
        { from: 'worker', to: 'object-store' },
        { from: 'client', to: 'cdn' },
        { from: 'cdn', to: 'object-store' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
];

export function validateScenarios(list: Scenario[]): void {
  const seen = new Set<string>();
  list.forEach((sc) => {
    ScenarioSchema.parse(sc);
    if (seen.has(sc.id)) throw new Error(`Duplicate scenario id: ${sc.id}`);
    seen.add(sc.id);
    const inPalette = new Set<ComponentType>(sc.palette);
    sc.reference.nodes.forEach((node) => {
      if (!inPalette.has(node.type)) throw new Error(`Scenario ${sc.id}: reference node type ${node.type} not in palette`);
    });
    const refIds = new Set(sc.reference.nodes.map((node) => node.id));
    sc.reference.edges.forEach((e) => {
      if (!refIds.has(e.from) || !refIds.has(e.to)) throw new Error(`Scenario ${sc.id}: reference edge ${e.from}->${e.to} references unknown node id`);
    });
    for (const c of sc.constraints) {
      const types: ComponentType[] =
        c.kind === 'between' ? [c.middle, c.from, c.to]
        : c.kind === 'required-edge' ? [c.from, c.to]
        : c.kind === 'any-of' ? c.nodes
        : [c.node];
      for (const t of types) {
        if (!inPalette.has(t)) throw new Error(`Scenario ${sc.id}: constraint type ${t} not in palette`);
      }
    }
  });
}
