<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { deqlCode, parseErrors } from '../lib/deqlStore';
  import { EditorState } from '@codemirror/state';
  import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { sql } from '@codemirror/lang-sql';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { lintGutter, linter, type Diagnostic } from '@codemirror/lint';
  import { parseDeQL } from '../lib/deqlParser';
  import { examples } from '../lib/examples';

  let editorContainer: HTMLDivElement;
  let view: EditorView;
  let debounceTimer: ReturnType<typeof setTimeout>;

  $: errors = $parseErrors;

  function processCode(code: string) {
    const result = parseDeQL(code);
    parseErrors.set(result.errors);
    deqlCode.set(code);
  }

  function loadExample(event: Event) {
    const select = event.target as HTMLSelectElement;
    const idx = parseInt(select.value);
    if (isNaN(idx) || idx < 0) return;
    const example = examples[idx];
    if (!example || !view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: example.content },
    });
    select.value = '-1';
  }

  let fileInput: HTMLInputElement;

  function loadFile() {
    fileInput?.click();
  }

  function handleFileLoad(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !view) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    };
    reader.readAsText(file);
    input.value = '';
  }

  onMount(() => {
    const deqlLinter = linter((view) => {
      const diagnostics: Diagnostic[] = [];
      const code = view.state.doc.toString();
      const result = parseDeQL(code);
      for (const err of result.errors) {
        const lineMatch = err.match(/line (\d+)/i);
        if (lineMatch) {
          const lineNum = parseInt(lineMatch[1]);
          const line = view.state.doc.line(Math.min(lineNum, view.state.doc.lines));
          diagnostics.push({
            from: line.from,
            to: line.to,
            severity: 'error',
            message: err,
          });
        }
      }
      return diagnostics;
    });

    const startState = EditorState.create({
      doc: $deqlCode,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        sql(),
        oneDark,
        lintGutter(),
        deqlLinter,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              processCode(update.state.doc.toString());
            }, 300);
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
        }),
      ],
    });

    view = new EditorView({
      state: startState,
      parent: editorContainer,
    });

    // Initial parse
    processCode($deqlCode);
  });

  onDestroy(() => {
    view?.destroy();
    clearTimeout(debounceTimer);
  });
</script>

<div class="editor-wrapper">
  <div class="editor-header">
    <span class="editor-title">DeQL Editor</span>
    <select class="example-select" onchange={loadExample}>
      <option value="-1">Load Example…</option>
      {#each examples as ex, i}
        <option value={i}>{ex.name}</option>
      {/each}
    </select>
    <button class="load-file-btn" onclick={loadFile} title="Load .deql file from disk">📂 Load File</button>
    <input
      type="file"
      accept=".deql,.sql,.txt"
      class="hidden-file-input"
      bind:this={fileInput}
      onchange={handleFileLoad}
    />
    {#if errors.length > 0}
      <span class="error-badge">{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
    {:else}
      <span class="ok-badge">✓ OK</span>
    {/if}
  </div>
  <div class="editor-container" bind:this={editorContainer}></div>
  {#if errors.length > 0}
    <div class="error-panel">
      {#each errors as err}
        <div class="error-item">⚠ {err}</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .editor-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e2e;
    border-radius: 8px;
    overflow: hidden;
  }
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: #181825;
    border-bottom: 1px solid #313244;
    font-size: 13px;
    color: #cdd6f4;
  }
  .editor-title {
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .example-select {
    background: #313244;
    color: #cdd6f4;
    border: 1px solid #313244;
    border-radius: 4px;
    padding: 3px 8px;
    font-size: 11px;
    font-family: inherit;
    cursor: pointer;
    outline: none;
  }
  .example-select:hover {
    border-color: #cba6f7;
  }
  .example-select:focus {
    border-color: #cba6f7;
  }
  .load-file-btn {
    background: #313244;
    color: #cdd6f4;
    border: 1px solid #313244;
    border-radius: 4px;
    padding: 3px 8px;
    font-size: 11px;
    font-family: inherit;
    cursor: pointer;
  }
  .load-file-btn:hover {
    border-color: #cba6f7;
  }
  .hidden-file-input {
    display: none;
  }
  .error-badge {
    background: #f38ba8;
    color: #1e1e2e;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
  .ok-badge {
    background: #a6e3a1;
    color: #1e1e2e;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
  .editor-container {
    flex: 1;
    overflow: hidden;
  }
  .error-panel {
    max-height: 120px;
    overflow-y: auto;
    background: #181825;
    border-top: 1px solid #f38ba8;
    padding: 8px;
  }
  .error-item {
    color: #f38ba8;
    font-size: 12px;
    padding: 2px 0;
    font-family: monospace;
  }
</style>
