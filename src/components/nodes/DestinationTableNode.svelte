<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { infoPanelNodeId } from '../../lib/deqlStore';

  let { id, data }: { id: string; data: { label: string; fields?: { name: string; type: string }[]; hasLineComment?: boolean; hasBlockComment?: boolean } } = $props();

  function openInfoPanel() {
    infoPanelNodeId.set(id);
  }
</script>

<div class="node dest-table-node">
  <Handle type="target" position={Position.Left} />
  <div class="node-header">
    <span class="node-icon">📊</span>
    <span class="node-label">{data.label}</span>
    <span class="header-icons">
      <button class="info-btn" title="Show details" onclick={openInfoPanel}>ℹ</button>
    </span>
  </div>
  <div class="node-type">TABLE (OUTPUT)</div>
  <div class="fields">
    <div class="field">stream_id: <span class="field-type">STRING</span></div>
    <div class="field">event_type: <span class="field-type">STRING</span></div>
    <div class="field">data: <span class="field-type">STRUCT</span></div>
  </div>
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
  .dest-table-node {
    background: #1e3a2f;
    border: 2px solid #a6e3a1;
    color: #a6e3a1;
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
  .fields {
    margin-top: 6px;
    border-top: 1px solid #313244;
    padding-top: 4px;
  }
  .field {
    font-size: 11px;
    color: #cdd6f4;
    padding: 1px 0;
  }
  .field-type { color: #89dceb; }
</style>
