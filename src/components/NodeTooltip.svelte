<script lang="ts">
  import { sortFields } from '../lib/fieldUtils';
  import type { AssociatedComment } from '../lib/commentAssociation';

  interface Props {
    nodeData: Record<string, any> | null;
    position: { x: number; y: number };
    visible: boolean;
  }

  let { nodeData, position, visible }: Props = $props();

  const sortedFields = $derived(
    nodeData?.fields ? sortFields(nodeData.fields) : []
  );

  const sectionComments = $derived(
    (nodeData?.sectionComments as AssociatedComment[] | undefined) ?? []
  );

  const commentText = $derived(
    sectionComments.map(c => c.text.replace(/^--|^\/\*|\*\/$/g, '').trim()).join(' ')
  );

  function kindBadge(kind: string): { label: string; color: string } {
    switch (kind) {
      case 'command': return { label: 'COMMAND', color: '#89b4fa' };
      case 'event': return { label: 'EVENT', color: '#f9e2af' };
      case 'decision': return { label: 'DECISION', color: '#fab387' };
      case 'projection': return { label: 'PROJECTION', color: '#cba6f7' };
      case 'aggEvents': return { label: 'EVENT STREAM', color: '#74c7ec' };
      case 'aggState': return { label: 'AGG STATE', color: '#94e2d5' };
      default: return { label: kind.toUpperCase(), color: '#cdd6f4' };
    }
  }
</script>

{#if visible && nodeData}
  {@const badge = kindBadge(nodeData.kind)}
  <div
    class="tooltip"
    style="left: {position.x}px; top: {position.y}px;"
  >
    <div class="tooltip-header">
      <span class="tooltip-name">{nodeData.label}</span>
      <span class="tooltip-badge" style="color: {badge.color}; border-color: {badge.color};">{badge.label}</span>
    </div>

    {#if nodeData.kind === 'command' || nodeData.kind === 'event'}
      {#if sortedFields.length > 0}
        <div class="tooltip-section">
          {#each sortedFields as f}
            <div class="tooltip-field">{f.name}: <span class="field-type">{f.type}</span></div>
          {/each}
        </div>
      {/if}
    {/if}

    {#if nodeData.kind === 'decision'}
      <div class="tooltip-section">
        {#if nodeData.aggregate}<div class="tooltip-meta">FOR: {nodeData.aggregate}</div>{/if}
        {#if nodeData.onCommand}<div class="tooltip-meta">ON: {nodeData.onCommand}</div>{/if}
        {#if nodeData.hasStateQuery}<div class="tooltip-meta state-query">STATE QUERY</div>{/if}
        {#if nodeData.emitsEvents?.length}
          <div class="tooltip-meta">Emits: {nodeData.emitsEvents.join(', ')}</div>
        {/if}
      </div>
    {/if}

    {#if nodeData.kind === 'projection'}
      <div class="tooltip-section">
        {#if nodeData.sourceEvents?.length}
          <div class="tooltip-meta">Events: {nodeData.sourceEvents.join(', ')}</div>
        {/if}
        {#if nodeData.fromSource}
          <div class="tooltip-meta">FROM: {nodeData.fromSource}</div>
        {/if}
      </div>
    {/if}

    {#if nodeData.kind === 'aggEvents'}
      <div class="tooltip-section">
        <div class="tooltip-meta">{nodeData.label}</div>
      </div>
    {/if}

    {#if nodeData.kind === 'aggState'}
      <div class="tooltip-section">
        <div class="tooltip-meta">{nodeData.label}</div>
      </div>
    {/if}

    {#if commentText}
      <div class="tooltip-comment">{commentText}</div>
    {/if}
  </div>
{/if}

<style>
  .tooltip {
    position: absolute;
    z-index: 1000;
    max-width: 320px;
    background: #181825;
    border: 1px solid #313244;
    border-radius: 8px;
    padding: 10px 12px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    color: #cdd6f4;
    pointer-events: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  .tooltip-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .tooltip-name {
    font-weight: 700;
    font-size: 13px;
  }
  .tooltip-badge {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    border: 1px solid;
    border-radius: 4px;
    padding: 1px 6px;
  }
  .tooltip-section {
    border-top: 1px solid #313244;
    padding-top: 6px;
    margin-top: 4px;
  }
  .tooltip-field {
    font-size: 11px;
    padding: 1px 0;
  }
  .field-type {
    color: #89dceb;
  }
  .tooltip-meta {
    font-size: 11px;
    color: #bac2de;
    padding: 1px 0;
  }
  .state-query {
    color: #fab387;
    font-weight: 600;
  }
  .tooltip-comment {
    border-top: 1px solid #313244;
    padding-top: 6px;
    margin-top: 6px;
    font-size: 11px;
    color: #6c7086;
    font-style: italic;
  }
</style>
