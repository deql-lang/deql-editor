<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { infoPanelNodeId } from '../../lib/deqlStore';

  let { id, data }: { id: string; data: { label: string; aggregate?: string; onCommand?: string; hasStateQuery?: boolean; hasLineComment?: boolean; hasBlockComment?: boolean } } = $props();

  function openInfoPanel() {
    infoPanelNodeId.set(id);
  }
</script>

<div class="node decision-node">
  <Handle type="target" position={Position.Left} />
  <div class="node-header">
    <span class="node-icon">◈</span>
    <span class="node-label">{data.label}</span>
    <span class="header-icons">
      <button class="info-btn" title="Show details" onclick={openInfoPanel}>ℹ</button>
    </span>
  </div>
  <div class="node-type">DECISION</div>
  {#if data.onCommand}
    <div class="meta">ON: {data.onCommand}</div>
  {/if}
  {#if data.aggregate}
    <div class="meta">FOR: {data.aggregate}</div>
  {/if}
  {#if data.hasStateQuery}
    <div class="state-badge">STATE QUERY</div>
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
  .decision-node {
    background: #3a2210;
    border: 2px solid #fab387;
    color: #fab387;
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
  .meta {
    font-size: 11px;
    color: #cdd6f4;
    margin-top: 3px;
  }
  .state-badge {
    display: inline-block;
    margin-top: 4px;
    background: #fab38722;
    border: 1px solid #fab387;
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 10px;
    color: #fab387;
  }
</style>
