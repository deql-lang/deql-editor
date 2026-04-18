<script lang="ts">
  import DeQLEditor from './DeQLEditor.svelte';
  import DiagramCanvas from './DiagramCanvas.svelte';
  import { editorCollapsed, layoutMode } from '../lib/deqlStore';

  let editorWidth = 30; // percentage
  let resizing = false;
  let mainEl: HTMLElement;

  function startResize(e: MouseEvent) {
    if ($editorCollapsed) return;
    resizing = true;
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!mainEl) return;
      const rect = mainEl.getBoundingClientRect();
      if ($layoutMode === 'editor-top') {
        const pct = ((ev.clientY - rect.top) / rect.height) * 100;
        editorWidth = Math.max(15, Math.min(75, pct));
      } else {
        const pct = ((ev.clientX - rect.left) / rect.width) * 100;
        editorWidth = Math.max(15, Math.min(75, pct));
      }
    };
    const onUp = () => {
      resizing = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
</script>

<div class="app">
  <header class="app-header">
    <div class="logo">
      <img src={`${import.meta.env.BASE_URL}deql-logo.svg`} alt="DeQL" class="logo-img" />      
      <span class="logo-sub">CQRS Visualization</span>
    </div>
    <div class="layout-selector">
      <button
        class="layout-btn"
        class:active={$layoutMode === 'side-by-side'}
        on:click={() => layoutMode.set('side-by-side')}
        aria-label="Side-by-side layout"
        title="Side-by-Side"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="8" y="1" width="5" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
      <button
        class="layout-btn"
        class:active={$layoutMode === 'editor-top'}
        on:click={() => layoutMode.set('editor-top')}
        aria-label="Editor top layout"
        title="Editor Top"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="1" y="8" width="12" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
    </div>
    <div class="header-info">
      <span>Live editor · Interactive diagram · Partial AST</span>
    </div>
  </header>

  <main class="app-main" class:layout-top={$layoutMode === 'editor-top'} class:resizing bind:this={mainEl}>
    <div
      class="panel editor-panel"
      class:collapsed={$editorCollapsed}
      class:layout-top={$layoutMode === 'editor-top'}
      style={$editorCollapsed ? '' : ($layoutMode === 'editor-top' ? `max-height:${editorWidth}%; flex:0 0 ${editorWidth}%` : `max-width:${editorWidth}%; flex:0 0 ${editorWidth}%`)}
    >
      <DeQLEditor />
    </div>
    <div
      class="resize-handle"
      class:layout-top={$layoutMode === 'editor-top'}
      class:hidden={$editorCollapsed}
      on:mousedown={startResize}
      role="separator"
      aria-label="Resize editor"
      tabindex="-1"
    ></div>
    <button
      class="collapse-toggle"
      class:layout-top={$layoutMode === 'editor-top'}
      on:click={() => editorCollapsed.update(v => !v)}
      aria-label={$editorCollapsed ? 'Expand editor' : 'Collapse editor'}
    >
      {#if $layoutMode === 'editor-top'}
        {$editorCollapsed ? '▼' : '▲'}
      {:else}
        {$editorCollapsed ? '»' : '«'}
      {/if}
    </button>
    <div class="panel diagram-panel">
      <DiagramCanvas />
    </div>
  </main>
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :global(body) {
    background: #11111b;
    color: #cdd6f4;
    font-family: 'Inter', system-ui, sans-serif;
    height: 100vh;
    overflow: hidden;
  }
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
    background: #181825;
    border-bottom: 1px solid #313244;
    flex-shrink: 0;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .logo-img {
    height: 24px;
    width: auto;
  }
  .logo-text {
    font-size: 20px;
    font-weight: 800;
    color: #cba6f7;
    letter-spacing: -0.5px;
  }
  .logo-sub {
    font-size: 12px;
    color: #6c7086;
    margin-left: 4px;
  }
  .header-info {
    font-size: 12px;
    color: #6c7086;
  }
  .layout-selector {
    display: flex;
    gap: 2px;
    background: #313244;
    border-radius: 4px;
    padding: 2px;
  }
  .layout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 24px;
    background: transparent;
    color: #6c7086;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    padding: 0;
  }
  .layout-btn:hover {
    color: #cdd6f4;
  }
  .layout-btn.active {
    background: rgba(203, 166, 247, 0.15);
    color: #cba6f7;
  }
  .app-main {
    display: flex;
    flex: 1;
    gap: 12px;
    padding: 12px;
    overflow: hidden;
    min-height: 0;
  }
  .app-main.layout-top {
    flex-direction: column;
  }
  .panel {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }
  .editor-panel {
    transition: width 200ms ease, max-width 200ms ease, height 200ms ease, max-height 200ms ease, opacity 200ms ease, padding 200ms ease, flex 200ms ease;
  }
  .editor-panel.layout-top {
    max-width: none;
  }
  .editor-panel.collapsed {
    width: 0;
    max-width: 0;
    overflow: hidden;
    padding: 0;
    opacity: 0;
    flex: 0;
  }
  .editor-panel.collapsed.layout-top {
    width: auto;
    max-width: none;
    height: 0;
    max-height: 0;
  }
  .collapse-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    flex-shrink: 0;
    background: #313244;
    color: #cdd6f4;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  .collapse-toggle.layout-top {
    width: auto;
    height: 20px;
  }
  .collapse-toggle:hover {
    filter: brightness(1.2);
  }
  .resize-handle {
    flex-shrink: 0;
    width: 6px;
    cursor: col-resize;
    background: transparent;
    border-radius: 3px;
    transition: background 0.15s;
  }
  .resize-handle:hover, .app-main.resizing .resize-handle {
    background: #cba6f7;
  }
  .resize-handle.layout-top {
    width: auto;
    height: 6px;
    cursor: row-resize;
  }
  .resize-handle.hidden {
    display: none;
  }
  .app-main.resizing {
    user-select: none;
  }
</style>
