<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { infoPanelNodeId } from '../../lib/deqlStore';

  let { id, data }: { id: string; data: { label: string; hasLineComment?: boolean; hasBlockComment?: boolean } } = $props();

  function openInfoPanel() {
    infoPanelNodeId.set(id);
  }
</script>

<div class="node agg-events-node">
  <Handle type="target" position={Position.Left} />
  <div class="node-header">
    <span class="node-icon">📜</span>
    <span class="node-label">{data.label}</span>
    <span class="header-icons">
      <button class="info-btn" title="Show details" onclick={openInfoPanel}>ℹ</button>
    </span>
  </div>
  <div class="node-type">EVENT STREAM</div>
  <Handle type="source" position={Position.Right} />
  <Handle type="source" position={Position.Bottom} id="bottom" />
</div>

<style>
  .node {
    border-radius: 8px;
    padding: 10px 14px;
    min-width: 160px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    user-select: none;
  }
  .agg-events-node {
    background: #1e2a3a;
    border: 2px dashed #74c7ec;
    color: #74c7ec;
  }
  .node-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
  }
  .node-label { font-size: 12px; }
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
</style>
