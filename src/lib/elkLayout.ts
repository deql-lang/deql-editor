import type { GraphIR, GraphNode, GraphEdge } from './graphBuilder';
import type { DiagramLayout } from './deqlStore';

export interface GroupBounds {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groupBounds: GroupBounds[];
  nodeGroupMap: Record<string, string>;
  edgeType: string;
}

// Layout-specific spacing configs
const SPACING: Record<DiagramLayout, { groupGap: number; nodePadSide: number; nodePadTop: number; nodePadBottom: number; nodeGapX: number; nodeGapY: number; stagger: number }> = {
  layered:    { groupGap: 120, nodePadSide: 35, nodePadTop: 50, nodePadBottom: 35, nodeGapX: 60, nodeGapY: 40, stagger: 50 },
  compact:    { groupGap: 80,  nodePadSide: 30, nodePadTop: 45, nodePadBottom: 30, nodeGapX: 50, nodeGapY: 35, stagger: 40 },
  orthogonal: { groupGap: 140, nodePadSide: 40, nodePadTop: 55, nodePadBottom: 40, nodeGapX: 70, nodeGapY: 45, stagger: 60 },
};

const EDGE_TYPES: Record<DiagramLayout, string> = {
  layered: 'smoothstep',
  compact: 'bezier',
  orthogonal: 'step',
};

// Node dimensions by kind
export const NODE_DIMS: Record<string, { width: number; height: number }> = {
  aggregate:   { width: 160, height: 60 },
  command:     { width: 180, height: 120 },
  event:       { width: 180, height: 90 },
  decision:    { width: 200, height: 130 },
  projection:  { width: 200, height: 100 },
  aggState:    { width: 180, height: 75 },
  aggEvents:   { width: 180, height: 65 },
  inspect:          { width: 250, height: 130 },
  inspectProjection: { width: 250, height: 130 },
  sourceTable:      { width: 220, height: 120 },
  destinationTable: { width: 220, height: 100 },
};

/**
 * Main layout function. Manually positions groups left-to-right in order,
 * then stacks nodes vertically within each group. This guarantees the
 * sequence: Commands → Decisions → Events → Aggregates → Projections.
 */
export async function applyElkLayout(graphIR: GraphIR, layoutMode: DiagramLayout = 'compact'): Promise<LayoutResult> {
  const edgeType = EDGE_TYPES[layoutMode];
  const sp = SPACING[layoutMode];
  const groups = graphIR.groups ?? [];

  if (groups.length === 0) {
    return applyFlatLayout(graphIR, layoutMode);
  }

  // Sort groups by order
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  // Separate aggregate groups from projections and inspections
  const aggGroupsList = sortedGroups.filter(g => g.id !== 'group-projections' && g.id !== 'group-inspections');
  const projGroup = sortedGroups.find(g => g.id === 'group-projections');
  const inspGroup = sortedGroups.find(g => g.id === 'group-inspections');

  const positioned = [...graphIR.nodes];
  const groupBounds: GroupBounds[] = [];
  const nodeGroupMap: Record<string, string> = {};

  // Helper: compute layout for a single group, returns { width, height, colLayouts }
  function computeGroupLayout(memberNodes: GraphNode[]) {
    const kindColumnOrder = ['command', 'decision', 'event', 'aggEvents', 'aggState', 'sourceTable', 'inspect', 'destinationTable'];
    const columns: GraphNode[][] = [];
    for (const kind of kindColumnOrder) {
      const colNodes = memberNodes.filter(n => n.data.kind === kind);
      if (colNodes.length > 0) columns.push(colNodes);
    }
    const coveredKinds = new Set(kindColumnOrder);
    const otherNodes = memberNodes.filter(n => !coveredKinds.has(n.data.kind));
    if (otherNodes.length > 0) columns.push(otherNodes);

    // Merge aggEvents and aggState into one column
    const aggEventsCol = columns.findIndex(col => col.some(n => n.data.kind === 'aggEvents'));
    const aggStateCol = columns.findIndex(col => col.some(n => n.data.kind === 'aggState'));
    if (aggEventsCol >= 0 && aggStateCol >= 0 && aggEventsCol !== aggStateCol) {
      columns[aggEventsCol].push(...columns[aggStateCol]);
      columns.splice(aggStateCol, 1);
    }

    let totalWidth = sp.nodePadSide;
    let maxColHeight = 0;
    const colLayouts: { x: number; width: number; nodes: { node: GraphNode; dims: { width: number; height: number }; y: number }[] }[] = [];

    for (const col of columns) {
      let colWidth = 0;
      let colHeight = 0;
      const nodeLayouts: { node: GraphNode; dims: { width: number; height: number }; y: number }[] = [];
      for (let i = 0; i < col.length; i++) {
        const dims = NODE_DIMS[col[i].data.kind] ?? { width: 160, height: 70 };
        colWidth = Math.max(colWidth, dims.width);
        nodeLayouts.push({ node: col[i], dims, y: colHeight });
        colHeight += dims.height + (i < col.length - 1 ? sp.nodeGapY : 0);
      }
      colLayouts.push({ x: totalWidth, width: colWidth, nodes: nodeLayouts });
      maxColHeight = Math.max(maxColHeight, colHeight);
      totalWidth += colWidth + sp.nodeGapX;
    }
    totalWidth += sp.nodePadSide - sp.nodeGapX;

    return {
      width: totalWidth,
      height: maxColHeight + sp.nodePadTop + sp.nodePadBottom,
      colLayouts,
    };
  }

  // Layout aggregate groups: stack vertically
  const aggStartX = 30;
  let cursorY = 30;
  let maxAggWidth = 0;

  for (const group of aggGroupsList) {
    const memberNodes = group.nodeIds
      .map(id => graphIR.nodes.find(n => n.id === id))
      .filter((n): n is GraphNode => n !== undefined);
    if (memberNodes.length === 0) continue;

    const layout = computeGroupLayout(memberNodes);
    const groupX = aggStartX;
    const groupY = cursorY;

    // Position nodes within this group
    for (const colLayout of layout.colLayouts) {
      for (const nl of colLayout.nodes) {
        const nodeX = colLayout.x + (colLayout.width - nl.dims.width) / 2;
        const nodeY = sp.nodePadTop + nl.y;
        const idx = positioned.findIndex(n => n.id === nl.node.id);
        if (idx >= 0) {
          positioned[idx] = { ...positioned[idx], position: { x: nodeX, y: nodeY } };
        }
      }
    }

    groupBounds.push({
      id: group.id,
      label: group.label,
      x: groupX,
      y: groupY,
      width: layout.width,
      height: layout.height,
    });

    for (const nodeId of group.nodeIds) {
      nodeGroupMap[nodeId] = group.id;
    }

    maxAggWidth = Math.max(maxAggWidth, layout.width);
    cursorY += layout.height + sp.groupGap;
  }

  // Layout Projections group: to the right of aggregates, vertically centered
  if (projGroup) {
    const memberNodes = projGroup.nodeIds
      .map(id => graphIR.nodes.find(n => n.id === id))
      .filter((n): n is GraphNode => n !== undefined);

    if (memberNodes.length > 0) {
      const layout = computeGroupLayout(memberNodes);
      const projX = aggStartX + maxAggWidth + sp.groupGap;
      const totalAggHeight = cursorY - sp.groupGap - 30; // total height of stacked aggregates
      const projY = 30 + Math.max(0, (totalAggHeight - layout.height) / 2); // vertically center

      for (const colLayout of layout.colLayouts) {
        for (const nl of colLayout.nodes) {
          const nodeX = colLayout.x + (colLayout.width - nl.dims.width) / 2;
          const nodeY = sp.nodePadTop + nl.y;
          const idx = positioned.findIndex(n => n.id === nl.node.id);
          if (idx >= 0) {
            positioned[idx] = { ...positioned[idx], position: { x: nodeX, y: nodeY } };
          }
        }
      }

      groupBounds.push({
        id: projGroup.id,
        label: projGroup.label,
        x: projX,
        y: projY,
        width: layout.width,
        height: layout.height,
      });

      for (const nodeId of projGroup.nodeIds) {
        nodeGroupMap[nodeId] = projGroup.id;
      }
    }
  }

  // Layout Inspections group: below all aggregate groups, with extra spacing
  if (inspGroup) {
    const memberNodes = inspGroup.nodeIds
      .map(id => graphIR.nodes.find(n => n.id === id))
      .filter((n): n is GraphNode => n !== undefined);

    if (memberNodes.length > 0) {
      // Use wider spacing for inspections group
      const inspSp = {
        nodePadSide: sp.nodePadSide + 20,
        nodePadTop: sp.nodePadTop + 10,
        nodePadBottom: sp.nodePadBottom + 10,
        nodeGapX: sp.nodeGapX + 30,
        nodeGapY: sp.nodeGapY + 15,
      };

      // Custom layout with boosted spacing
      const kindColumnOrder = ['sourceTable', 'inspect', 'inspectProjection', 'destinationTable', 'command', 'decision', 'event', 'aggEvents', 'aggState'];
      const columns: GraphNode[][] = [];
      for (const kind of kindColumnOrder) {
        const colNodes = memberNodes.filter(n => n.data.kind === kind);
        if (colNodes.length > 0) columns.push(colNodes);
      }
      const coveredKinds = new Set(kindColumnOrder);
      const otherNodes = memberNodes.filter(n => !coveredKinds.has(n.data.kind));
      if (otherNodes.length > 0) columns.push(otherNodes);

      let totalWidth = inspSp.nodePadSide;
      let maxColHeight = 0;
      const colLayouts: { x: number; width: number; nodes: { node: GraphNode; dims: { width: number; height: number }; y: number }[] }[] = [];

      for (const col of columns) {
        let colWidth = 0;
        let colHeight = 0;
        const nodeLayouts: { node: GraphNode; dims: { width: number; height: number }; y: number }[] = [];
        for (let i = 0; i < col.length; i++) {
          const dims = NODE_DIMS[col[i].data.kind] ?? { width: 160, height: 70 };
          colWidth = Math.max(colWidth, dims.width);
          nodeLayouts.push({ node: col[i], dims, y: colHeight });
          colHeight += dims.height + (i < col.length - 1 ? inspSp.nodeGapY : 0);
        }
        colLayouts.push({ x: totalWidth, width: colWidth, nodes: nodeLayouts });
        maxColHeight = Math.max(maxColHeight, colHeight);
        totalWidth += colWidth + inspSp.nodeGapX;
      }
      totalWidth += inspSp.nodePadSide - inspSp.nodeGapX;

      const inspWidth = totalWidth;
      const inspHeight = maxColHeight + inspSp.nodePadTop + inspSp.nodePadBottom;
      const inspX = aggStartX;
      const inspY = cursorY;

      for (const colLayout of colLayouts) {
        for (const nl of colLayout.nodes) {
          const nodeX = colLayout.x + (colLayout.width - nl.dims.width) / 2;
          const nodeY = inspSp.nodePadTop + nl.y;
          const idx = positioned.findIndex(n => n.id === nl.node.id);
          if (idx >= 0) {
            positioned[idx] = { ...positioned[idx], position: { x: nodeX, y: nodeY } };
          }
        }
      }

      groupBounds.push({
        id: inspGroup.id,
        label: inspGroup.label,
        x: inspX,
        y: inspY,
        width: inspWidth,
        height: inspHeight,
      });

      for (const nodeId of inspGroup.nodeIds) {
        nodeGroupMap[nodeId] = inspGroup.id;
      }
    }
  }

  // Position ungrouped nodes after all groups
  const groupedNodeIds = new Set(Object.keys(nodeGroupMap));
  const ungroupedNodes = graphIR.nodes.filter(n => !groupedNodeIds.has(n.id));
  if (ungroupedNodes.length > 0) {
    const ungroupedX = aggStartX + maxAggWidth + sp.groupGap + (projGroup ? 300 : 0);
    let rowY = 30;
    for (const node of ungroupedNodes) {
      const idx = positioned.findIndex(n => n.id === node.id);
      if (idx >= 0) {
        positioned[idx] = { ...positioned[idx], position: { x: ungroupedX, y: rowY } };
      }
      rowY += 120;
    }
  }

  return { nodes: positioned, edges: graphIR.edges, groupBounds, nodeGroupMap, edgeType };
}

/** Flat layout for when there are no groups (backward compatibility). */
function applyFlatLayout(graphIR: GraphIR, layoutMode: DiagramLayout): LayoutResult {
  const edgeType = EDGE_TYPES[layoutMode];
  const kindOrder = ['command', 'decision', 'event', 'aggEvents', 'aggState', 'projection'];
  const columns: Map<string, GraphNode[]> = new Map();

  for (const node of graphIR.nodes) {
    const kind = node.data.kind;
    const col = kindOrder.indexOf(kind) >= 0 ? String(kindOrder.indexOf(kind)) : '99';
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(node);
  }

  const positioned = [...graphIR.nodes];
  let colX = 50;

  for (const colKey of [...columns.keys()].sort()) {
    const colNodes = columns.get(colKey)!;
    let rowY = 50;
    for (const node of colNodes) {
      const idx = positioned.findIndex(n => n.id === node.id);
      if (idx >= 0) {
        positioned[idx] = { ...positioned[idx], position: { x: colX, y: rowY } };
      }
      rowY += 120;
    }
    colX += 250;
  }

  return { nodes: positioned, edges: graphIR.edges, groupBounds: [], nodeGroupMap: {}, edgeType };
}
