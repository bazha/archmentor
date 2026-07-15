import type { Diagram, Constraint, CheckResult, ComponentType } from './types';

function typeOf(d: Diagram, id: string): ComponentType | undefined {
  return d.nodes.find((n) => n.id === id)?.type;
}
function hasType(d: Diagram, t: ComponentType): boolean {
  return d.nodes.some((n) => n.type === t);
}
function hasEdgeType(d: Diagram, from: ComponentType, to: ComponentType): boolean {
  return d.edges.some((e) => typeOf(d, e.from) === from && typeOf(d, e.to) === to);
}

export function checkOne(d: Diagram, c: Constraint): CheckResult {
  switch (c.kind) {
    case 'required-node':
      return hasType(d, c.node)
        ? { status: 'ok', messageKey: 'diagram.check.required', params: { node: c.node } }
        : { status: 'fail', messageKey: 'diagram.check.missing', params: { node: c.node } };
    case 'any-of': {
      const present = c.nodes.some((t) => hasType(d, t));
      return present
        ? { status: 'ok', messageKey: 'diagram.check.anyOf', params: { nodes: c.nodes.join(',') } }
        : { status: 'fail', messageKey: 'diagram.check.missingAnyOf', params: { nodes: c.nodes.join(',') } };
    }
    case 'forbidden-node':
      if (!hasType(d, c.node)) {
        return { status: 'ok', messageKey: 'diagram.check.noForbidden', params: { node: c.node } };
      }
      return c.severity === 'fail'
        ? { status: 'fail', messageKey: 'diagram.check.forbidden', params: { node: c.node } }
        : { status: 'warn', messageKey: 'diagram.check.discouraged', params: { node: c.node } };
    case 'required-edge':
      return hasEdgeType(d, c.from, c.to)
        ? { status: 'ok', messageKey: 'diagram.check.edge', params: { from: c.from, to: c.to } }
        : { status: 'warn', messageKey: 'diagram.check.missingEdge', params: { from: c.from, to: c.to } };
    case 'between':
      return hasEdgeType(d, c.from, c.middle) && hasEdgeType(d, c.middle, c.to)
        ? { status: 'ok', messageKey: 'diagram.check.between', params: { middle: c.middle, from: c.from, to: c.to } }
        : { status: 'warn', messageKey: 'diagram.check.missingBetween', params: { middle: c.middle, from: c.from, to: c.to } };
  }
}

export function validate(d: Diagram, constraints: Constraint[]): CheckResult[] {
  return constraints.map((c) => checkOne(d, c));
}

/** A diagram passes when no constraint fails. Warnings are allowed (valid alternatives). */
export function isPassed(results: CheckResult[]): boolean {
  return results.every((r) => r.status !== 'fail');
}
