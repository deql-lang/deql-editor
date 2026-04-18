import type { ParseResult, DeQLNode, DecisionNode, ProjectionNode, InspectDecisionNode, CreateTableNode, InspectProjectionNode } from './parser';
import { associateComments } from './commentAssociation';
import type { AssociatedComment } from './commentAssociation';

export interface GraphNode {
  id: string;
  type: string;
  data: {
    label: string;
    kind: string;
    fields?: { name: string; type: string }[];
    comments?: string;
    sectionComments?: AssociatedComment[];
    sourceFragment?: string;
    hasLineComment?: boolean;
    hasBlockComment?: boolean;
    [key: string]: unknown;
  };
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, string>;
  markerEnd?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface GraphGroup {
  id: string;
  label: string;
  nodeIds: string[];
  order: number;
  sectionComments?: AssociatedComment[];
}

export interface GraphIR {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: GraphGroup[];
  globalComments: AssociatedComment[];
}

// Strip DeReg. prefix and quotes from labels
function cleanLabel(label: string): string {
  return label.replace(/^DeReg\."?/i, '').replace(/"$/g, '');
}

// Build graph IR from parsed AST
export function buildGraphIR(parseResult: ParseResult): GraphIR {
  const { nodeComments, globalComments } = associateComments(
    parseResult.comments,
    parseResult.sourceFragments
  );

  const fragmentMap = new Map<string, { startOffset: number; endOffset: number }>();
  for (const frag of parseResult.sourceFragments) {
    fragmentMap.set(`${frag.nodeKind}:${frag.nodeName}`, {
      startOffset: frag.startOffset,
      endOffset: frag.endOffset,
    });
  }

  function enrichNodeData(
    data: GraphNode['data'],
    nodeKind: string,
    nodeName: string
  ): GraphNode['data'] {
    const key = `${nodeKind}:${nodeName}`;
    const comments = nodeComments.get(key) || [];
    const fragment = fragmentMap.get(key);
    const sourceFragment = fragment
      ? parseResult.source.slice(fragment.startOffset, fragment.endOffset + 1)
      : undefined;
    return {
      ...data,
      sectionComments: comments,
      sourceFragment,
      hasLineComment: comments.some(c => !c.isBlock),
      hasBlockComment: comments.some(c => c.isBlock),
    };
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();
  let edgeCount = 0;
  const nodeCounter = { n: 0 };

  const decisionAstNodes = parseResult.nodes.filter(n => n.kind === 'decision') as DecisionNode[];

  function addEdge(source: string, target: string, label?: string, animated = false, style?: Record<string, string>, sourceHandle?: string, targetHandle?: string) {
    const key = `${source}->${target}->${label ?? ''}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ id: `e${++edgeCount}`, source, target, label, animated, style, sourceHandle, targetHandle });
  }

  for (const node of parseResult.nodes) {
    const id = getNodeId(node, nodeCounter);

    switch (node.kind) {
      case 'aggregate':
        if (!nodes.find(n => n.id === id)) {
          nodes.push({ id, type: 'aggregateNode', data: enrichNodeData({ label: node.name, kind: 'aggregate' }, node.kind, node.name), position: { x: 0, y: 0 } });
        }
        break;

      case 'command':
        if (!nodes.find(n => n.id === id)) {
          nodes.push({ id, type: 'commandNode', data: enrichNodeData({ label: node.name, kind: 'command', fields: node.fields }, node.kind, node.name), position: { x: 0, y: 0 } });
        }
        break;

      case 'event':
        if (!nodes.find(n => n.id === id)) {
          nodes.push({ id, type: 'eventNode', data: enrichNodeData({ label: node.name, kind: 'event', fields: node.fields }, node.kind, node.name), position: { x: 0, y: 0 } });
        }
        break;

      case 'decision': {
        const dn = node as DecisionNode;
        if (!nodes.find(n => n.id === id)) {
          nodes.push({ id, type: 'decisionNode', data: enrichNodeData({ label: dn.name, kind: 'decision', aggregate: dn.aggregate, onCommand: dn.onCommand, hasStateQuery: dn.hasStateQuery }, dn.kind, dn.name), position: { x: 0, y: 0 } });
        }

        if (dn.onCommand) {
          addEdge(`cmd-${dn.onCommand}`, id, 'EXECUTE');
        }

        if (dn.hasStateQuery && dn.stateQuerySource) {
          const aggId = `aggstate-${dn.stateQuerySource}`;
          if (!nodes.find(n => n.id === aggId)) {
            nodes.push({ id: aggId, type: 'aggStateNode', data: enrichNodeData({ label: cleanLabel(dn.stateQuerySource), kind: 'aggState' }, 'aggState', cleanLabel(dn.stateQuerySource)), position: { x: 0, y: 0 } });
          }
        }

        if (dn.stateQuerySources && dn.stateQuerySources.length > 0) {
          for (const src of dn.stateQuerySources) {
            const cleaned = cleanLabel(src);
            const eventsMatch = cleaned.match(/^(\w+)\$Events$/);
            if (eventsMatch) {
              const foreignAggName = eventsMatch[1];
              if (foreignAggName !== dn.aggregate) {
                const foreignStreamId = `aggstream-${foreignAggName}`;
                addEdge(id, foreignStreamId, `reads ${foreignAggName}`, true, { stroke: '#a0a0a0', strokeDasharray: '6 3' });
              }
            }
          }
        }

        for (const evtName of dn.emitsEvents) {
          addEdge(id, `evt-${evtName}`, dn.hasStateQuery ? 'EMIT or REJECT' : 'EMIT');
        }
        break;
      }

      case 'projection': {
        const pn = node as ProjectionNode;
        if (!nodes.find(n => n.id === id)) {
          nodes.push({ id, type: 'projectionNode', data: enrichNodeData({ label: pn.name, kind: 'projection', sourceEvents: pn.sourceEvents }, pn.kind, pn.name), position: { x: 0, y: 0 } });
        }
        break;
      }

      case 'inspectDecision': {
        const idn = node as InspectDecisionNode;
        const inspectIndex = nodes.filter(n => n.data.kind === 'inspect').length;
        const inspectId = `inspect-${idn.decisionName}-${inspectIndex}`;
        const srcTblId = `srctbl-${idn.sourceTable}`;
        const dstTblId = `dsttbl-${idn.destinationTable}`;

        const refDecision = nodes.find(n => n.data.kind === 'decision' && n.data.label === idn.decisionName);
        const decisionAggregate = (refDecision?.data as { aggregate?: string })?.aggregate || '';
        const decisionOnCommand = (refDecision?.data as { onCommand?: string })?.onCommand || '';
        const decisionHasStateQuery = (refDecision?.data as { hasStateQuery?: boolean })?.hasStateQuery || false;

        const refCommand = nodes.find(n => n.data.kind === 'command' && n.data.label === decisionOnCommand);
        const commandFields = (refCommand?.data.fields as { name: string; type: string }[]) || [];

        const refDecisionAst = decisionAstNodes.find(d => d.name === idn.decisionName);
        const emittedEventName = refDecisionAst?.emitsEvents?.[0] || '';
        const refEvent = nodes.find(n => n.data.kind === 'event' && n.data.label === emittedEventName);
        const emittedEventFields = (refEvent?.data.fields as { name: string; type: string }[]) || [];

        const stateQuerySources = refDecisionAst?.stateQuerySources || [];

        nodes.push({ id: inspectId, type: 'inspectNode', data: enrichNodeData({ label: `INSPECT ${idn.decisionName}`, kind: 'inspect', decisionName: idn.decisionName, sourceTable: idn.sourceTable, destinationTable: idn.destinationTable, aggregate: decisionAggregate, onCommand: decisionOnCommand, hasStateQuery: decisionHasStateQuery, commandFields, emittedEventFields, stateQuerySources }, idn.kind, idn.decisionName), position: { x: 0, y: 0 } });

        const createTableAst = parseResult.nodes.find(n => n.kind === 'createTable' && (n as CreateTableNode).tableName === idn.sourceTable) as CreateTableNode | undefined;
        const tableValues = createTableAst?.values || [];

        if (!nodes.find(n => n.id === srcTblId)) {
          nodes.push({ id: srcTblId, type: 'sourceTableNode', data: enrichNodeData({ label: idn.sourceTable, kind: 'sourceTable', fields: commandFields, values: tableValues }, 'createTable', idn.sourceTable), position: { x: 0, y: 0 } });
        }

        if (!nodes.find(n => n.id === dstTblId)) {
          const fixedFields = [{ name: 'stream_id', type: 'STRING' }, { name: 'event_type', type: 'STRING' }, { name: 'data', type: 'STRUCT' }];
          nodes.push({ id: dstTblId, type: 'destinationTableNode', data: enrichNodeData({ label: idn.destinationTable, kind: 'destinationTable', fields: fixedFields, dataFields: emittedEventFields, inspectedDecision: idn.decisionName, sourceTableName: idn.sourceTable }, 'inspectDecision', idn.destinationTable), position: { x: 0, y: 0 } });
        }

        addEdge(srcTblId, inspectId, 'FROM', false, { stroke: '#74c7ec' });
        addEdge(inspectId, dstTblId, 'INTO', false, { stroke: '#a6e3a1' });
        break;
      }

      case 'inspectProjection': {
        const ipn = node as InspectProjectionNode;
        const inspProjIndex = nodes.filter(n => n.data.kind === 'inspectProjection').length;
        const inspProjId = `inspproj-${ipn.projectionName}-${inspProjIndex}`;
        const dstTblId = `dsttbl-${ipn.destinationTable}`;

        const refProjection = nodes.find(n => n.data.kind === 'projection' && n.data.label === ipn.projectionName);
        const projSourceEvents = ((refProjection?.data as any)?.sourceEvents as string[]) || [];

        const cleanedSource = cleanLabel(ipn.sourceStream);
        const eventsMatch = cleanedSource.match(/^(\w+)\$Events$/);
        const sourceAggName = eventsMatch ? eventsMatch[1] : cleanedSource;
        const aggStreamId = eventsMatch ? `aggstream-${sourceAggName}` : '';

        const allEventFields: { name: string; type: string }[] = [];
        for (const evtName of projSourceEvents) {
          const evtNode = nodes.find(n => n.data.kind === 'event' && n.data.label === evtName);
          const fields = (evtNode?.data.fields as { name: string; type: string }[]) || [];
          for (const f of fields) {
            if (!allEventFields.find(ef => ef.name === f.name)) allEventFields.push(f);
          }
        }

        nodes.push({ id: inspProjId, type: 'inspectNode', data: enrichNodeData({ label: `INSPECT ${ipn.projectionName}`, kind: 'inspectProjection', projectionName: ipn.projectionName, sourceStream: ipn.sourceStream, destinationTable: ipn.destinationTable, sourceEvents: projSourceEvents, eventFields: allEventFields }, ipn.kind, ipn.projectionName), position: { x: 0, y: 0 } });

        if (!nodes.find(n => n.id === dstTblId)) {
          const fixedFields = [{ name: 'stream_id', type: 'STRING' }, { name: 'event_type', type: 'STRING' }, { name: 'data', type: 'STRUCT' }];
          nodes.push({ id: dstTblId, type: 'destinationTableNode', data: enrichNodeData({ label: ipn.destinationTable, kind: 'destinationTable', fields: fixedFields, dataFields: allEventFields, inspectedDecision: ipn.projectionName, sourceTableName: cleanedSource }, 'inspectProjection', ipn.destinationTable), position: { x: 0, y: 0 } });
        }

        if (aggStreamId) {
          addEdge(aggStreamId, inspProjId, 'FROM', false, { stroke: '#74c7ec' });
        }
        addEdge(inspProjId, dstTblId, 'INTO', false, { stroke: '#a6e3a1' });
        break;
      }

      case 'createTable':
      case 'execute':
      case 'select':
        break;
    }
  }

  // Build event → aggregate mapping
  const eventToAggregate = new Map<string, string>();
  for (const dn of decisionAstNodes) {
    for (const evtName of dn.emitsEvents) {
      eventToAggregate.set(evtName, dn.aggregate);
    }
  }

  const aggregates = parseResult.nodes.filter(n => n.kind === 'aggregate');
  const events = parseResult.nodes.filter(n => n.kind === 'event');
  const projections = parseResult.nodes.filter(n => n.kind === 'projection') as ProjectionNode[];

  for (const agg of aggregates) {
    const aggName = (agg as { name: string }).name;
    const aggEventsId = `aggstream-${aggName}`;
    const aggEvents = events.filter(evt => eventToAggregate.get((evt as { name: string }).name) === aggName);

    if (aggEvents.length > 0) {
      nodes.push({ id: aggEventsId, type: 'aggEventsNode', data: enrichNodeData({ label: cleanLabel(`${aggName}$Events`), kind: 'aggEvents' }, 'aggEvents', cleanLabel(`${aggName}$Events`)), position: { x: 0, y: 0 } });

      for (const evt of aggEvents) {
        addEdge(`evt-${(evt as { name: string }).name}`, aggEventsId, undefined);
      }

      const aggStateNodes = nodes.filter(n => n.data.kind === 'aggState' && n.id.includes(aggName));
      for (const aggStateNode of aggStateNodes) {
        addEdge(aggEventsId, aggStateNode.id, undefined, false, undefined, 'bottom', 'top');
      }

      for (const proj of projections) {
        const projReadsThisAgg = proj.sourceEvents.some(se => eventToAggregate.get(se) === aggName);
        const projFromThisAgg = proj.fromSource && proj.fromSource.includes(`${aggName}$Events`);
        if (projReadsThisAgg || projFromThisAgg) {
          addEdge(aggEventsId, `proj-${proj.name}`, undefined);
        }
      }
    }
  }

  for (const proj of projections) {
    const projId = `proj-${proj.name}`;
    const hasAggStreamEdge = edges.some(e => e.target === projId);
    if (!hasAggStreamEdge) {
      for (const evtName of proj.sourceEvents) {
        addEdge(`evt-${evtName}`, projId, undefined);
      }
    }
  }

  // Build groups
  const groups: GraphGroup[] = [];
  const aggGroups = new Map<string, string[]>();

  for (const agg of aggregates) {
    const aggName = (agg as { name: string }).name;
    aggGroups.set(aggName, []);
  }

  const decisionNodes = nodes.filter(n => n.data.kind === 'decision');
  for (const dn of decisionNodes) {
    const aggName = (dn.data as { aggregate?: string }).aggregate || '';
    if (!aggName || !aggGroups.has(aggName)) continue;
    const group = aggGroups.get(aggName)!;

    const onCommand = (dn.data as { onCommand?: string }).onCommand;
    if (onCommand) {
      const cmdId = `cmd-${onCommand}`;
      if (nodes.find(n => n.id === cmdId) && !group.includes(cmdId)) group.push(cmdId);
    }

    if (!group.includes(dn.id)) group.push(dn.id);

    const emitEdges = edges.filter(e => e.source === dn.id && (e.label === 'EMIT' || e.label === 'EMIT or REJECT'));
    for (const edge of emitEdges) {
      if (nodes.find(n => n.id === edge.target) && !group.includes(edge.target)) group.push(edge.target);
    }
  }

  for (const [aggName, group] of aggGroups) {
    const aggEventsId = `aggstream-${aggName}`;
    if (nodes.find(n => n.id === aggEventsId) && !group.includes(aggEventsId)) group.push(aggEventsId);
    const aggStateNodes = nodes.filter(n => n.data.kind === 'aggState' && n.id.includes(aggName));
    for (const asn of aggStateNodes) {
      if (!group.includes(asn.id)) group.push(asn.id);
    }
  }

  let orderIdx = 0;
  const sortedAggNames = [...aggGroups.keys()].sort();
  for (const aggName of sortedAggNames) {
    const nodeIds = aggGroups.get(aggName)!;
    if (nodeIds.length > 0) {
      const aggNode = nodes.find(n => n.data.kind === 'aggregate' && n.data.label === aggName);
      const aggSectionComments = (aggNode?.data.sectionComments as AssociatedComment[] | undefined) ?? [];
      groups.push({ id: `group-${aggName.toLowerCase()}`, label: `${aggName} Aggregate`, nodeIds, order: orderIdx++, sectionComments: aggSectionComments });
    }
  }

  const projNodes = nodes.filter(n => n.data.kind === 'projection');
  if (projNodes.length > 0) {
    const projAggOrder = new Map<string, number>();
    for (const pn of projNodes) {
      const feedingEdge = edges.find(e => e.target === pn.id && e.source.startsWith('aggstream-'));
      if (feedingEdge) {
        const aggName = feedingEdge.source.replace('aggstream-', '');
        const aggIdx = sortedAggNames.indexOf(aggName);
        projAggOrder.set(pn.id, aggIdx >= 0 ? aggIdx : 999);
      } else {
        projAggOrder.set(pn.id, 999);
      }
    }
    const sortedProjIds = projNodes.map(n => n.id).sort((a, b) => (projAggOrder.get(a) ?? 999) - (projAggOrder.get(b) ?? 999));
    groups.push({ id: 'group-projections', label: 'Projections', nodeIds: sortedProjIds, order: orderIdx++ });
  }

  const inspectionNodeIds = nodes.filter(n => n.data.kind === 'inspect' || n.data.kind === 'inspectProjection' || n.data.kind === 'sourceTable' || n.data.kind === 'destinationTable').map(n => n.id);
  if (inspectionNodeIds.length > 0) {
    groups.push({ id: 'group-inspections', label: 'Inspect Decisions & Projections', nodeIds: inspectionNodeIds, order: orderIdx++ });
  }

  const filteredNodes = nodes.filter(n => n.data.kind !== 'aggregate');

  return { nodes: filteredNodes, edges, groups, globalComments };
}

function getNodeId(node: DeQLNode, counter: { n: number }): string {
  switch (node.kind) {
    case 'aggregate': return `agg-${node.name}`;
    case 'command': return `cmd-${node.name}`;
    case 'event': return `evt-${node.name}`;
    case 'decision': return `dec-${node.name}`;
    case 'projection': return `proj-${node.name}`;
    case 'inspectDecision': return `inspect-${node.decisionName}-${++counter.n}`;
    case 'inspectProjection': return `inspproj-${node.projectionName}-${++counter.n}`;
    case 'createTable': return `tbl-${node.tableName}-${++counter.n}`;
    case 'execute': return `exec-${node.commandName}-${++counter.n}`;
    case 'select': return `sel-${node.source}-${++counter.n}`;
    default: return `node-${++counter.n}`;
  }
}
