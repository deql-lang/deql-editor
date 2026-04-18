<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  let { data }: { data: { label: string } } = $props();
</script>

<div class="node aggregate-node">
  <Handle type="target" position={Position.Left} />
  <div class="node-header">
    <span class="node-icon">⬡</span>
    <span class="node-label">{data.label}</span>
  </div>
  <div class="node-type">AGGREGATE</div>
  <Handle type="source" position={Position.Right} />
</div>

<style>
  .node {
    border-radius: 8px;
    padding: 10px 14px;
    min-width: 140px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
  }
  .aggregate-node {
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
  .node-icon { font-size: 16px; }
  .node-label { font-size: 14px; }
  .node-type {
    font-size: 10px;
    color: #6c7086;
    margin-top: 4px;
    letter-spacing: 1px;
  }
</style>
