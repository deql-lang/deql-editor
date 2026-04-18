<script lang="ts">
  import { infoPanelNodeId } from '../../lib/deqlStore';

  let { id, data }: { id: string; data: { label: string; width: number; height: number; nodeIds?: string[]; commandCount?: number; decisionCount?: number; eventCount?: number; streamCount?: number } } = $props();

  function openInfoPanel() {
    infoPanelNodeId.set(id);
  }
</script>

<div class="group-node" style="width: {data.width}px; height: {data.height}px;">
  <div class="group-header">
    <span class="group-label">{data.label}</span>
    <button class="info-btn" title="Show aggregate summary" onclick={openInfoPanel}>ℹ</button>
  </div>
</div>

<style>
  .group-node {
    background: rgba(30, 30, 46, 0.15);
    border: 1px solid #313244;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: grab;
  }
  .group-node:active {
    cursor: grabbing;
  }
  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .group-label {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: #6c7086;
    user-select: none;
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
</style>
