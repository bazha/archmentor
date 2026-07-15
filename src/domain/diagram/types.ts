export const COMPONENT_TYPES = [
  'client', 'load-balancer', 'api-server', 'cache', 'sql-db', 'nosql-db',
  'message-queue', 'cdn', 'object-store', 'rate-limiter',
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export interface DiagramNode { id: string; type: ComponentType }
export interface DiagramEdge { from: string; to: string } // from/to are node ids
export interface Diagram { nodes: DiagramNode[]; edges: DiagramEdge[] }

export type Status = 'ok' | 'warn' | 'fail';
export interface CheckResult {
  status: Status;
  messageKey: string;
  params?: Record<string, string>;
}

/** A required component type must be present. */
export interface RequiredNode { kind: 'required-node'; node: ComponentType }
/** At least one of `nodes` must be present (e.g. "some datastore"). */
export interface AnyOfNodes { kind: 'any-of'; nodes: ComponentType[] }
/** A component that should not appear; `warn` = discouraged, `fail` = wrong. */
export interface ForbiddenNode { kind: 'forbidden-node'; node: ComponentType; severity: 'warn' | 'fail' }
/** A directed connection between two component types should exist. */
export interface RequiredEdge { kind: 'required-edge'; from: ComponentType; to: ComponentType }
/** `middle` should sit on the path `from → middle → to`. */
export interface BetweenRelation { kind: 'between'; middle: ComponentType; from: ComponentType; to: ComponentType }
export type Constraint = RequiredNode | AnyOfNodes | ForbiddenNode | RequiredEdge | BetweenRelation;
