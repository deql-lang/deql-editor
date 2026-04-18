<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteFlow, Controls, Background, MiniMap, type Node, type Edge } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { deqlCode, showBackground, diagramLayout, edgeStyle, infoPanelNodeId, showInspections } from '../lib/deqlStore';
  import { parseDeQL } from '../lib/deqlParser';
  import { buildGraphIR } from '../lib/graphBuilder';
  import { applyElkLayout } from '../lib/elkLayout';
  import type { AssociatedComment } from '../lib/commentAssociation';

  import AggregateNode from './nodes/AggregateNode.svelte';
  import CommandNode from './nodes/CommandNode.svelte';
  import EventNode from './nodes/EventNode.svelte';
  import DecisionNode from './nodes/DecisionNode.svelte';
  import ProjectionNode from './nodes/ProjectionNode.svelte';
  import AggEventsNode from './nodes/AggEventsNode.svelte';
  import AggStateNode from './nodes/AggStateNode.svelte';
  import GroupNode from './nodes/GroupNode.svelte';
  import InspectNode from './nodes/InspectNode.svelte';
  import SourceTableNode from './nodes/SourceTableNode.svelte';
  import DestinationTableNode from './nodes/DestinationTableNode.svelte';
  import NodeTooltip from './NodeTooltip.svelte';
  import InfoPanel from './InfoPanel.svelte';

  const nodeTypes = {
    aggregateNode: AggregateNode,
    commandNode: CommandNode,
    eventNode: EventNode,
    decisionNode: DecisionNode,
    projectionNode: ProjectionNode,
    aggEventsNode: AggEventsNode,
    aggStateNode: AggStateNode,
    groupNode: GroupNode,
    inspectNode: InspectNode,
    sourceTableNode: SourceTableNode,
    destinationTableNode: DestinationTableNode,
  };

  let nodes: Node[] = $state([]);
  let edges: Edge[] = $state([]);
  let loading = $state(false);

  // Tooltip state
  let tooltipData = $state<{ nodeData: any; position: { x: number; y: number } } | null>(null);
  let tooltipTimer: ReturnType<typeof setTimeout> | null = null;

  // Info panel open state — starts open with welcome message
  let panelOpen = $state(true);

  // Global comments (Task 12.3)
  let globalComments = $state<AssociatedComment[]>([]);

  // Info panel derived state
  const infoPanelData = $derived.by(() => {
    const id = $infoPanelNodeId;
    if (!id) return null;
    const node = nodes.find(n => n.id === id);
    return node?.data ?? null;
  });

  // Open panel when a node is selected
  $effect(() => {
    if ($infoPanelNodeId) panelOpen = true;
  });

  let debounceTimer: ReturnType<typeof setTimeout>;

  async function updateDiagram(code: string, forceReset = false) {
    loading = true;
    try {
      // Clear nodes/edges first to force SvelteFlow to re-render with fresh positions
      if (forceReset) {
        nodes = [];
        edges = [];
        await new Promise(r => setTimeout(r, 0));
      }

      console.time('parseDeQL');
      const parseResult = parseDeQL(code);
      console.timeEnd('parseDeQL');
      
      console.time('buildGraphIR');
      const graphIR = buildGraphIR(parseResult);
      console.timeEnd('buildGraphIR');

      // Store global comments for banner rendering (Task 12.3)
      globalComments = graphIR.globalComments ?? [];
      
      console.time('applyElkLayout');
      const laid = await applyElkLayout(graphIR, $diagramLayout);
      console.timeEnd('applyElkLayout');

      const groupNodes = laid.groupBounds.map(g => {
        // Compute aggregate summary counts from member nodes
        const group = graphIR.groups.find(gr => gr.id === g.id);
        const memberNodeIds = group?.nodeIds ?? [];
        const members = laid.nodes.filter(n => memberNodeIds.includes(n.id));
        const commandCount = members.filter(n => n.data.kind === 'command').length;
        const decisionCount = members.filter(n => n.data.kind === 'decision').length;
        const eventCount = members.filter(n => n.data.kind === 'event').length;
        const streamCount = members.filter(n => n.data.kind === 'aggEvents').length;
        const inspectCount = members.filter(n => n.data.kind === 'inspect').length;
        const projCount = members.filter(n => n.data.kind === 'projection').length;
        // Get the aggregate's section comments from the group definition
        const groupDef = graphIR.groups.find(gr => gr.id === g.id);
        const aggComments = groupDef?.sectionComments ?? [];

        return {
          id: g.id,
          type: 'groupNode',
          position: { x: g.x, y: g.y },
          data: { label: g.label, width: g.width, height: g.height, kind: 'group', groupType: g.id === 'group-inspections' ? 'inspections' : g.id === 'group-projections' ? 'projections' : 'aggregate', nodeIds: memberNodeIds, commandCount, decisionCount, eventCount, streamCount, inspectCount, projCount, sectionComments: aggComments },
          style: `width: ${g.width}px; height: ${g.height}px;`,
          selectable: true,
          draggable: true,
          connectable: false,
        };
      });

      // Set parentId on child nodes so they move with their group
      const memberNodes = laid.nodes.map(n => {
        const groupId = laid.nodeGroupMap[n.id];
        if (groupId) {
          return { ...n, parentId: groupId, extent: 'parent' as const };
        }
        return n;
      });

      // Filter out inspection nodes/edges if hidden
      const inspectionKinds = new Set(['inspect', 'inspectProjection', 'sourceTable', 'destinationTable']);
      const hideInspections = !$showInspections;
      
      let filteredGroupNodes = groupNodes;
      let filteredMemberNodes = memberNodes;
      if (hideInspections) {
        filteredGroupNodes = groupNodes.filter(g => g.id !== 'group-inspections');
        filteredMemberNodes = memberNodes.filter(n => !inspectionKinds.has((n.data as any).kind));
      }

      nodes = [...filteredGroupNodes, ...filteredMemberNodes] as Node[];
      
      const inspectNodeIds = hideInspections 
        ? new Set(laid.nodes.filter(n => inspectionKinds.has(n.data.kind)).map(n => n.id))
        : new Set<string>();
      
      edges = laid.edges
        .filter(e => !hideInspections || (!inspectNodeIds.has(e.source) && !inspectNodeIds.has(e.target)))
        .map(e => {
        const isStateQuery = e.label?.includes('STATE');
        const isEmit = e.label === 'EMIT';
        const isEmitOrReject = e.label === 'EMIT or REJECT';
        const isExecute = e.label === 'EXECUTE';
        const isReadState = e.label === 'read-state';
        const isFrom = e.label === 'FROM';
        const isInto = e.label === 'INTO';
        return {
          ...e,
          type: $edgeStyle,
          markerEnd: {
            type: 'arrowclosed',
            color: (isEmit || isEmitOrReject) ? '#f9e2af' : (isStateQuery || isReadState) ? '#aaa' : isInto ? '#a6e3a1' : '#74c7ec',
          },
          animated: isStateQuery || isEmit || isEmitOrReject || isReadState,
          style: (isStateQuery || isReadState)
            ? { stroke: '#a0a0a0', strokeDasharray: '6 3' }
            : isFrom
              ? { stroke: '#74c7ec' }
              : isInto
                ? { stroke: '#a6e3a1' }
                : (isExecute)
                  ? { stroke: '#74c7ec' }
                  : (isEmit || isEmitOrReject)
                    ? { stroke: '#f9e2af' }
                    : { stroke: '#74c7ec' },
          labelStyle: { fontSize: '10px', fill: '#cdd6f4', fontWeight: '600' },
          labelBgStyle: { fill: '#1e1e2e', fillOpacity: 0.85 },
          label: e.label || undefined,
        };
      }) as Edge[];
    } catch (e) {
      console.error('Diagram update error:', e);
    }
    loading = false;
  }

  let prevLayout = $diagramLayout;

  $effect(() => {
    const code = $deqlCode;
    const currentLayout = $diagramLayout;
    const _edgeStyle = $edgeStyle;
    const _showInspections = $showInspections; // trigger re-render on edge style change
    const layoutChanged = currentLayout !== prevLayout;
    prevLayout = currentLayout;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => updateDiagram(code, layoutChanged), layoutChanged ? 0 : 350);
  });

  onMount(() => {
    updateDiagram($deqlCode);

    // Escape key closes info panel (Task 12.2)
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape' && panelOpen) {
        panelOpen = false;
        infoPanelNodeId.set(null);
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  // Tooltip handlers (Task 12.1)
  function onNodeMouseEnter(event: CustomEvent) {
    const { node, event: mouseEvent } = event.detail;
    if (tooltipTimer) clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => {
      tooltipData = {
        nodeData: node.data,
        position: { x: mouseEvent.clientX + 12, y: mouseEvent.clientY + 12 },
      };
    }, 300);
  }

  function onNodeMouseLeave() {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
      tooltipTimer = null;
    }
    tooltipData = null;
  }

  // Info panel close handler (Task 12.2)
  function closeInfoPanel() {
    infoPanelNodeId.set(null);
  }

  // Format global comment for display — strip comment markers, preserve newlines
  function formatGlobalComment(comments: AssociatedComment[]): string {
    return comments
      .map(c => {
        let text = c.text;
        // Strip block comment markers
        text = text.replace(/^\/\*\s*\n?/, '').replace(/\n?\s*\*\/$/, '');
        // Strip leading * on each line (common block comment style)
        text = text.split('\n').map(line => line.replace(/^\s*\*\s?/, '')).join('\n');
        // Strip line comment markers
        text = text.replace(/^--\s?/gm, '');
        return text.trim();
      })
      .join('\n')
      .split('\n')
      .map(line => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
      .join('<br>');
  }
</script>

<div class="canvas-wrapper">
  <div class="canvas-header">
    <span class="canvas-title">CQRS Diagram</span>
    <button
      class="bg-toggle"
      class:active={$showBackground}
      onclick={() => showBackground.update(v => !v)}
    >
      Grid
    </button>
    <div class="diagram-layout-selector">
      <button
        class="layout-opt"
        class:active={$diagramLayout === 'layered'}
        onclick={() => diagramLayout.set('layered')}
        title="Layered — smooth curved edges"
      >Layered</button>
      <button
        class="layout-opt"
        class:active={$diagramLayout === 'compact'}
        onclick={() => diagramLayout.set('compact')}
        title="Compact — tighter spacing, bezier edges"
      >Compact</button>
      <button
        class="layout-opt"
        class:active={$diagramLayout === 'orthogonal'}
        onclick={() => diagramLayout.set('orthogonal')}
        title="Orthogonal — right-angle edges"
      >Ortho</button>
    </div>
    <div class="diagram-layout-selector">
      <button
        class="layout-opt"
        class:active={$edgeStyle === 'smoothstep'}
        onclick={() => edgeStyle.set('smoothstep')}
        title="Smooth step — rounded right-angle paths"
      >Smooth</button>
      <button
        class="layout-opt"
        class:active={$edgeStyle === 'bezier'}
        onclick={() => edgeStyle.set('bezier')}
        title="Bezier — curved paths"
      >Bezier</button>
      <button
        class="layout-opt"
        class:active={$edgeStyle === 'step'}
        onclick={() => edgeStyle.set('step')}
        title="Step — sharp right-angle paths"
      >Step</button>
      <button
        class="layout-opt"
        class:active={$edgeStyle === 'straight'}
        onclick={() => edgeStyle.set('straight')}
        title="Straight — direct lines"
      >Straight</button>
    </div>
    {#if loading}
      <span class="loading">Updating...</span>
    {/if}
    <button
      class="bg-toggle"
      class:active={$showInspections}
      onclick={() => showInspections.update(v => !v)}
      title={$showInspections ? 'Hide inspections' : 'Show inspections'}
    >
      🔍 Inspect
    </button>
  </div>
  <div class="canvas-container">
    {#if globalComments.length > 0}
      <div class="global-comment-banner">{@html formatGlobalComment(globalComments)}</div>
    {/if}
    <SvelteFlow
      bind:nodes
      bind:edges
      {nodeTypes}
      fitView
      defaultEdgeOptions={{ type: 'smoothstep' }}
      on:nodeMouseEnter={onNodeMouseEnter}
      on:nodeMouseLeave={onNodeMouseLeave}
    >
      {#if $showBackground}
        <Background />
      {/if}
      <Controls />
      <MiniMap />
    </SvelteFlow>
    <NodeTooltip
      nodeData={tooltipData?.nodeData ?? null}
      position={tooltipData?.position ?? { x: 0, y: 0 }}
      visible={tooltipData !== null}
    />
    <InfoPanel
      nodeData={infoPanelData}
      open={panelOpen}
      onClose={() => { panelOpen = false; infoPanelNodeId.set(null); }}
    />
  </div>
</div>

<style>
  .canvas-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e2e;
    border-radius: 8px;
    overflow: hidden;
  }
  .canvas-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: #181825;
    border-bottom: 1px solid #313244;
    font-size: 13px;
    color: #cdd6f4;
    flex-wrap: wrap;
  }
  .canvas-title {
    font-weight: 600;
  }
  .bg-toggle {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid #313244;
    background: #313244;
    color: #cdd6f4;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  .bg-toggle:hover {
    filter: brightness(1.15);
  }
  .bg-toggle.active {
    background: #cba6f733;
    border-color: #cba6f7;
    color: #cba6f7;
  }
  .diagram-layout-selector {
    display: flex;
    gap: 2px;
    background: #313244;
    border-radius: 4px;
    padding: 2px;
  }
  .layout-opt {
    padding: 2px 8px;
    border: none;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 600;
    background: transparent;
    color: #6c7086;
    cursor: pointer;
    font-family: inherit;
  }
  .layout-opt:hover {
    color: #cdd6f4;
  }
  .layout-opt.active {
    background: rgba(203, 166, 247, 0.15);
    color: #cba6f7;
  }
  .loading {
    font-size: 11px;
    color: #6c7086;
    margin-left: auto;
  }
  .canvas-container {
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  .global-comment-banner {
    position: absolute;
    top: 8px;
    left: 12px;
    z-index: 10;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: #6c7086;
    white-space: pre-wrap;
    line-height: 1.5;
    pointer-events: none;
    max-width: calc(100% - 24px);
  }
  :global(.svelte-flow) {
    background: #1e1e2e;
  }
  :global(.svelte-flow .svelte-flow__minimap) {
    background: #181825;
  }
</style>
