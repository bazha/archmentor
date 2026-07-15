import { describe, it, expect } from 'vitest';
import { addNode, removeNode, addEdge, removeEdge, emptyDiagram } from './edit';

describe('diagram edit helpers', () => {
  it('addNode appends a typed node and ignores duplicate ids', () => {
    const d1 = addNode(emptyDiagram, 'cache', 'cache-0');
    expect(d1.nodes).toEqual([{ id: 'cache-0', type: 'cache' }]);
    const d2 = addNode(d1, 'cache', 'cache-0'); // duplicate id
    expect(d2.nodes).toHaveLength(1);
  });

  it('removeNode drops the node and any edges touching it', () => {
    let d = addNode(emptyDiagram, 'api-server', 'api-0');
    d = addNode(d, 'sql-db', 'db-0');
    d = addEdge(d, 'api-0', 'db-0');
    d = removeNode(d, 'db-0');
    expect(d.nodes).toEqual([{ id: 'api-0', type: 'api-server' }]);
    expect(d.edges).toEqual([]);
  });

  it('addEdge ignores self-loops and duplicates', () => {
    let d = addNode(emptyDiagram, 'api-server', 'api-0');
    d = addNode(d, 'cache', 'cache-0');
    d = addEdge(d, 'api-0', 'api-0'); // self loop
    expect(d.edges).toEqual([]);
    d = addEdge(d, 'api-0', 'cache-0');
    d = addEdge(d, 'api-0', 'cache-0'); // duplicate
    expect(d.edges).toHaveLength(1);
  });

  it('removeEdge removes the matching directed edge only', () => {
    let d = addNode(emptyDiagram, 'api-server', 'api-0');
    d = addNode(d, 'cache', 'cache-0');
    d = addEdge(d, 'api-0', 'cache-0');
    d = removeEdge(d, 'cache-0', 'api-0'); // wrong direction, no-op
    expect(d.edges).toHaveLength(1);
    d = removeEdge(d, 'api-0', 'cache-0');
    expect(d.edges).toEqual([]);
  });
});
