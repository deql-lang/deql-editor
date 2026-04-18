<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { infoPanelNodeId } from '../../lib/deqlStore';

  let { id, data }: { id: string; data: { label: string; sourceEvents?: string[]; hasLineComment?: boolean; hasBlockComment?: boolean } } = $props();

  const visibleEvents = $derived((data.sourceEvents ?? []).slice(0, 2));
  const hiddenEventCount = $derived(Math.max(0, (data.sourceEvents ?? []).length - 2));

  function openInfoPanel() {
    infoPanelNodeId.set(id);
  }
</script>

<div class="node projection-node">
  <Handle type="target" position={Position.Left} />
  <div class="node-header">
    <span class="node-icon">📊</span>
    <span class="node-label">{data.label}</span>
    <span class="header-icons">
      <button class="info-btn" title="Show details" onclick={openInfoPanel}>ℹ</button>
    </span>
  </div>
  <div class="node-type">PROJECTION</div>
  {#if visibleEvents.length > 0}
    <div class="sources">
      {#each visibleEvents as evt}
        <div class="source-item">← {evt}</div>
      {/each}
      {#if hiddenEventCount > 0}
        <div class="source-more" onclick={openInfoPanel} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && openInfoPanel()}>+{hiddenEventCount} more</div>
      {/if}
    </div>
  {/if}
  <Handle type="source" position={Position.Right} />
</div>

<style>
  .node {
    border-radius: 8px;
    padding: 10px 14px;
    min-width: 170px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    user-select: none;
  }
  .projection-node {
    background: #2a1e3a;
    border: 2px solid #cba6f7;
    color: #cba6f7;
  }
  .node-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
  }
  .node-label { font-size: 13px; }
  .header-icons {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-left: auto;
  }
  .comment-icon {
    font-size: 11px;
    line-height: 1;
  }
  .info-btn {
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: transparent;
    color: #6c7086;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    line-height: 1;
  }
  .info-btn:hover {
    color: #cdd6f4;
  }
  .node-type {
    font-size: 10px;
    color: #6c7086;
    margin-top: 2px;
    letter-spacing: 1px;
  }
  .sources {
    margin-top: 4px;
    border-top: 1px solid #313244;
    padding-top: 4px;
  }
  .source-item {
    font-size: 11px;
    color: #cdd6f4;
  }
  .source-more {
    font-size: 11px;
    color: #6c7086;
    cursor: pointer;
  }
  .source-more:hover {
    color: #cdd6f4;
  }
</style>
