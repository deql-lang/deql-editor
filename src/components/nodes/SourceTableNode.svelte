<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { truncateFields } from '../../lib/fieldUtils';
  import { infoPanelNodeId } from '../../lib/deqlStore';

  let { id, data }: { id: string; data: { label: string; fields?: { name: string; type: string }[]; hasLineComment?: boolean; hasBlockComment?: boolean } } = $props();

  const truncated = $derived(truncateFields(data.fields ?? [], 3));

  function openInfoPanel() {
    infoPanelNodeId.set(id);
  }
</script>

<div class="node source-table-node">
  <div class="node-header">
    <span class="node-icon">📋</span>
    <span class="node-label">{data.label}</span>
    <span class="header-icons">
      <button class="info-btn" title="Show details" onclick={openInfoPanel}>ℹ</button>
    </span>
  </div>
  <div class="node-type">TABLE (INPUT)</div>
  {#if truncated.visibleFields.length > 0}
    <div class="fields">
      {#each truncated.visibleFields as f}
        <div class="field">{f.name}: <span class="field-type">{f.type}</span></div>
      {/each}
      {#if truncated.hiddenCount > 0}
        <div class="field-more" onclick={openInfoPanel} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && openInfoPanel()}>…{truncated.hiddenCount} more ℹ</div>
      {/if}
    </div>
  {/if}
  <Handle type="source" position={Position.Right} />
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
  .source-table-node {
    background: #1e2a3a;
    border: 2px solid #74c7ec;
    color: #74c7ec;
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
  .field-more {
    font-size: 11px;
    color: #6c7086;
    padding: 1px 0;
    cursor: pointer;
  }
  .field-more:hover {
    color: #cdd6f4;
  }
</style>
