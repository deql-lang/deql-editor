<script lang="ts">
  import { sortFields } from '../lib/fieldUtils';
  import type { AssociatedComment } from '../lib/commentAssociation';

  interface Props {
    nodeData: Record<string, any> | null;
    open: boolean;
    onClose: () => void;
  }

  let { nodeData, open, onClose }: Props = $props();

  const sortedFields = $derived(
    nodeData?.fields ? sortFields(nodeData.fields) : []
  );

  const sectionComments = $derived(
    (nodeData?.sectionComments as AssociatedComment[] | undefined) ?? []
  );

  function kindBadge(kind: string, groupType?: string): { label: string; color: string } {
    if (kind === 'group' && groupType === 'inspections') return { label: 'INSPECT DECISIONS', color: '#94e2d5' };
    if (kind === 'group' && groupType === 'projections') return { label: 'PROJECTIONS', color: '#cba6f7' };
    switch (kind) {
      case 'command': return { label: 'COMMAND', color: '#89b4fa' };
      case 'event': return { label: 'EVENT', color: '#f9e2af' };
      case 'decision': return { label: 'DECISION', color: '#fab387' };
      case 'projection': return { label: 'PROJECTION', color: '#cba6f7' };
      case 'aggEvents': return { label: 'EVENT STREAM', color: '#74c7ec' };
      case 'aggState': return { label: 'AGG STATE', color: '#94e2d5' };
      case 'group': return { label: 'AGGREGATE', color: '#a6e3a1' };
      case 'inspect': return { label: 'INSPECT', color: '#94e2d5' };
      case 'inspectProjection': return { label: 'INSPECT PROJECTION', color: '#cba6f7' };
      case 'sourceTable': return { label: 'TABLE (INPUT)', color: '#74c7ec' };
      case 'destinationTable': return { label: 'TABLE (OUTPUT)', color: '#a6e3a1' };
      default: return { label: kind.toUpperCase(), color: '#cdd6f4' };
    }
  }

  function cleanCommentText(text: string): string {
    return text.replace(/^--\s?/, '').replace(/^\/\*\s?/, '').replace(/\s?\*\/$/, '').trim();
  }
</script>

<div class="info-panel" class:open>
  {#if nodeData}
    {@const badge = kindBadge(nodeData.kind, nodeData.groupType as string | undefined)}
    <div class="panel-header">
      <div class="panel-title">
        <span class="panel-name">{nodeData.label}</span>
        <span class="panel-badge" style="color: {badge.color}; border-color: {badge.color};">{badge.label}</span>
      </div>
      <button class="close-btn" onclick={onClose} title="Close panel">×</button>
    </div>

    <div class="panel-body">
      <!-- Section Comments -->
      {#if sectionComments.length > 0}
        <div class="panel-section">
          {#each sectionComments as comment}
            {#if comment.isBlock}
              <div class="block-comment">
                <span class="comment-icon">📝</span>
                <div class="comment-text block">{cleanCommentText(comment.text)}</div>
              </div>
            {:else}
              <div class="line-comment">
                <span class="comment-icon">💬</span>
                <span class="comment-text">{cleanCommentText(comment.text)}</span>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Command / Event: all sorted fields -->
      <!-- Group summary -->
      {#if nodeData.kind === 'group' && nodeData.groupType === 'aggregate'}
        <div class="panel-section">
          <div class="section-title">Aggregate Summary</div>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-count">{nodeData.commandCount ?? 0}</span>
              <span class="summary-label">Commands</span>
            </div>
            <div class="summary-item">
              <span class="summary-count">{nodeData.decisionCount ?? 0}</span>
              <span class="summary-label">Decisions</span>
            </div>
            <div class="summary-item">
              <span class="summary-count">{nodeData.eventCount ?? 0}</span>
              <span class="summary-label">Events</span>
            </div>
            <div class="summary-item">
              <span class="summary-count">{nodeData.streamCount ?? 0}</span>
              <span class="summary-label">Streams</span>
            </div>
          </div>
        </div>
      {/if}
      {#if nodeData.kind === 'group' && nodeData.groupType === 'inspections'}
        <div class="panel-section">
          <div class="section-title">Summary Decisions</div>
          <div class="summary-grid single">
            <div class="summary-item">
              <span class="summary-count">{nodeData.inspectCount ?? 0}</span>
              <span class="summary-label">Decisions</span>
            </div>
          </div>
        </div>
      {/if}
      {#if nodeData.kind === 'group' && nodeData.groupType === 'projections'}
        <div class="panel-section">
          <div class="section-title">Summary</div>
          <div class="summary-grid single">
            <div class="summary-item">
              <span class="summary-count">{nodeData.projCount ?? 0}</span>
              <span class="summary-label">Projections</span>
            </div>
          </div>
        </div>
      {/if}

      {#if (nodeData.kind === 'command' || nodeData.kind === 'event') && sortedFields.length > 0}
        <div class="panel-section">
          <div class="section-title">Fields</div>
          {#each sortedFields as f}
            <div class="field-row">
              <span class="field-name">{f.name}</span>
              <span class="field-type">{f.type}</span>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Decision details -->
      {#if nodeData.kind === 'decision'}
        <div class="panel-section">
          <div class="section-title">Details</div>
          {#if nodeData.aggregate}
            <div class="detail-row"><span class="detail-label">Aggregate:</span> {nodeData.aggregate}</div>
          {/if}
          {#if nodeData.onCommand}
            <div class="detail-row"><span class="detail-label">Command:</span> {nodeData.onCommand}</div>
          {/if}
          {#if nodeData.hasStateQuery}
            <div class="detail-row">
              <span class="state-badge">STATE QUERY</span>
            </div>
          {/if}
          {#if nodeData.emitsEvents?.length}
            <div class="detail-row">
              <span class="detail-label">Emits:</span>
              {#each nodeData.emitsEvents as evt}
                <span class="event-tag">{evt}</span>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Projection details -->
      {#if nodeData.kind === 'projection'}
        <div class="panel-section">
          <div class="section-title">Details</div>
          {#if nodeData.sourceEvents?.length}
            <div class="detail-row">
              <span class="detail-label">Source Events:</span>
              {#each nodeData.sourceEvents as evt}
                <span class="event-tag">{evt}</span>
              {/each}
            </div>
          {/if}
          {#if nodeData.fromSource}
            <div class="detail-row"><span class="detail-label">FROM:</span> {nodeData.fromSource}</div>
          {/if}
        </div>
      {/if}

      <!-- AggEvents details -->
      {#if nodeData.kind === 'aggEvents'}
        <div class="panel-section">
          <div class="section-title">Event Stream</div>
          <div class="detail-row">{nodeData.label}</div>
        </div>
      {/if}

      <!-- AggState details -->
      {#if nodeData.kind === 'aggState'}
        <div class="panel-section">
          <div class="section-title">Aggregate State</div>
          <div class="detail-row">{nodeData.label}</div>
        </div>
      {/if}

      <!-- Inspect details -->
      {#if nodeData.kind === 'inspect'}
        <div class="panel-section">
          <div class="section-title">Details</div>
          {#if nodeData.decisionName}
            <div class="detail-row"><span class="detail-label">Decision:</span> {nodeData.decisionName}</div>
          {/if}
          {#if nodeData.aggregate}
            <div class="detail-row"><span class="detail-label">Aggregate:</span> {nodeData.aggregate}</div>
          {/if}
          {#if nodeData.onCommand}
            <div class="detail-row"><span class="detail-label">Command:</span> {nodeData.onCommand}</div>
          {/if}
          {#if nodeData.sourceTable}
            <div class="detail-row"><span class="detail-label">Source Table:</span> {nodeData.sourceTable}</div>
          {/if}
          {#if nodeData.destinationTable}
            <div class="detail-row"><span class="detail-label">Dest Table:</span> {nodeData.destinationTable}</div>
          {/if}
        </div>
        {#if nodeData.commandFields?.length}
          <div class="panel-section">
            <div class="section-title">Command Fields</div>
            {#each nodeData.commandFields as f}
              <div class="field-row">
                <span class="field-name">{f.name}</span>
                <span class="field-type">{f.type}</span>
              </div>
            {/each}
          </div>
        {/if}
        {#if nodeData.emittedEventFields?.length}
          <div class="panel-section">
            <div class="section-title">Data Fields (from emitted event)</div>
            {#each nodeData.emittedEventFields as f}
              <div class="field-row">
                <span class="field-name">data.{f.name}</span>
                <span class="field-type">{f.type}</span>
              </div>
            {/each}
          </div>
        {/if}
        {#if nodeData.stateQuerySources?.length}
          <div class="panel-section">
            <div class="section-title">$Events Streams</div>
            {#each nodeData.stateQuerySources as src}
              <div class="detail-row"><span class="event-tag">{src}</span></div>
            {/each}
          </div>
        {/if}
      {/if}

      <!-- Inspect Projection details -->
      {#if nodeData.kind === 'inspectProjection'}
        <div class="panel-section">
          <div class="section-title">Details</div>
          {#if nodeData.projectionName}
            <div class="detail-row"><span class="detail-label">Projection:</span> {nodeData.projectionName}</div>
          {/if}
          {#if nodeData.sourceStream}
            <div class="detail-row"><span class="detail-label">Source:</span> {nodeData.sourceStream}</div>
          {/if}
          {#if nodeData.destinationTable}
            <div class="detail-row"><span class="detail-label">Dest Table:</span> {nodeData.destinationTable}</div>
          {/if}
        </div>
        {#if nodeData.eventFields?.length}
          <div class="panel-section">
            <div class="section-title">Event Fields</div>
            {#each nodeData.eventFields as f}
              <div class="field-row">
                <span class="field-name">{f.name}</span>
                <span class="field-type">{f.type}</span>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      <!-- Source Table details -->
      {#if nodeData.kind === 'sourceTable'}
        {#if nodeData.fields?.length}
          <div class="panel-section">
            <div class="section-title">Fields</div>
            {#each nodeData.fields as f}
              <div class="field-row">
                <span class="field-name">{f.name}</span>
                <span class="field-type">{f.type}</span>
              </div>
            {/each}
          </div>
        {/if}
        {#if nodeData.values?.length}
          <div class="panel-section">
            <div class="section-title">Row Values</div>
            {#each nodeData.values as row, i}
              <div class="detail-row"><span class="detail-label">Row {i + 1}:</span> ({row.join(', ')})</div>
            {/each}
          </div>
        {/if}
      {/if}

      <!-- Destination Table details -->
      {#if nodeData.kind === 'destinationTable'}
        <div class="panel-section">
          <div class="section-title">Top-Level Fields</div>
          {#if nodeData.fields?.length}
            {#each nodeData.fields as f}
              <div class="field-row">
                <span class="field-name">{f.name}</span>
                <span class="field-type">{f.type}</span>
              </div>
            {/each}
          {/if}
        </div>
        {#if nodeData.dataFields?.length}
          <div class="panel-section">
            <div class="section-title">Nested Data Fields</div>
            {#each nodeData.dataFields as f}
              <div class="field-row">
                <span class="field-name">data.{f.name}</span>
                <span class="field-type">{f.type}</span>
              </div>
            {/each}
          </div>
        {/if}
        <div class="panel-section">
          <div class="section-title">Details</div>
          {#if nodeData.inspectedDecision}
            <div class="detail-row"><span class="detail-label">Decision:</span> {nodeData.inspectedDecision}</div>
          {/if}
          {#if nodeData.sourceTableName}
            <div class="detail-row"><span class="detail-label">Source Table:</span> {nodeData.sourceTableName}</div>
          {/if}
        </div>
      {/if}

      <!-- Source Fragment -->
      {#if nodeData.sourceFragment}
        <div class="panel-section">
          <div class="section-title">Source</div>
          <pre class="source-block"><code>{nodeData.sourceFragment}</code></pre>
        </div>
      {/if}
    </div>
  {:else}
    <div class="panel-header">
      <div class="panel-title">
        <span class="panel-name">DeQL Editor v0.1.0</span>
      </div>
      <button class="close-btn" onclick={onClose} title="Close panel">×</button>
    </div>
    <div class="panel-body">
      <div class="panel-section welcome-note">
        <div class="welcome-icon">ℹ</div>
        <div class="welcome-text">Click on the <strong>ℹ</strong> icon on any node to see more details.</div>
      </div>
    </div>
  {/if}
</div>

<style>
  .info-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: 360px;
    height: 100%;
    background: #181825;
    border-left: 1px solid #313244;
    z-index: 900;
    transform: translateX(100%);
    transition: transform 200ms ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .info-panel.open {
    transform: translateX(0);
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #313244;
    flex-shrink: 0;
  }
  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .panel-name {
    font-weight: 700;
    font-size: 14px;
    color: #cdd6f4;
  }
  .panel-badge {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    border: 1px solid;
    border-radius: 4px;
    padding: 1px 6px;
    font-family: 'JetBrains Mono', monospace;
  }
  .close-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: #6c7086;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    line-height: 1;
  }
  .close-btn:hover {
    color: #cdd6f4;
    background: #313244;
  }
  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
  }
  .panel-section {
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    color: #6c7086;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .field-row {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 12px;
  }
  .field-name {
    color: #cdd6f4;
    font-family: 'JetBrains Mono', monospace;
  }
  .field-type {
    color: #89dceb;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
  }
  .detail-row {
    font-size: 12px;
    color: #cdd6f4;
    padding: 3px 0;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .detail-label {
    color: #6c7086;
    font-weight: 600;
  }
  .state-badge {
    display: inline-block;
    background: #fab38722;
    border: 1px solid #fab387;
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 10px;
    color: #fab387;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }
  .event-tag {
    display: inline-block;
    background: #f9e2af15;
    border: 1px solid #f9e2af44;
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 11px;
    color: #f9e2af;
    font-family: 'JetBrains Mono', monospace;
  }
  .block-comment {
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 6px;
    margin-bottom: 6px;
  }
  .block-comment .comment-text {
    font-size: 13px;
    color: #bac2de;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .line-comment {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
  }
  .line-comment .comment-text {
    font-size: 12px;
    color: #6c7086;
    font-style: italic;
  }
  .comment-icon {
    font-size: 12px;
    flex-shrink: 0;
  }
  .source-block {
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 6px;
    padding: 10px 12px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    color: #cdd6f4;
    overflow-x: auto;
    white-space: pre;
    line-height: 1.5;
    margin: 0;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .summary-grid.single {
    grid-template-columns: 1fr;
  }
  .welcome-note {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px 16px;
    text-align: center;
  }
  .welcome-icon {
    font-size: 28px;
    color: #cba6f7;
  }
  .welcome-text {
    font-size: 13px;
    color: #6c7086;
    line-height: 1.6;
  }
  .welcome-text strong {
    color: #cba6f7;
  }
  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 6px;
  }
  .summary-count {
    font-size: 22px;
    font-weight: 700;
    color: #cba6f7;
    font-family: 'JetBrains Mono', monospace;
  }
  .summary-label {
    font-size: 10px;
    color: #6c7086;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }
</style>
