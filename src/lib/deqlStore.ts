import { writable } from 'svelte/store';
import type { DiagramLayout, EdgeStyle } from '@deql-lang/core';
import defaultDeql from '/docs/examples/demoscript.deql?raw';

export type { DiagramLayout, EdgeStyle } from '@deql-lang/core';

export const deqlCode = writable<string>(defaultDeql);

export const parseErrors = writable<string[]>([]);

/** Whether the editor panel is collapsed. Default: false (expanded). */
export const editorCollapsed = writable<boolean>(false);

/** Current layout arrangement. Default: 'side-by-side'. */
export type LayoutMode = 'side-by-side' | 'editor-top';
export const layoutMode = writable<LayoutMode>('side-by-side');

/** Whether the dotted grid background is visible on the diagram canvas. Default: true. */
export const showBackground = writable<boolean>(true);

/** Diagram layout style. Default: 'compact'. */
export const diagramLayout = writable<DiagramLayout>('compact');

/** Edge routing style. Default: 'smoothstep'. */
export const edgeStyle = writable<EdgeStyle>('smoothstep');

/** ID of the node currently shown in the info panel. null when panel is closed. */
export const infoPanelNodeId = writable<string | null>(null);

/** Whether inspect decision nodes are visible on the diagram. Default: true. */
export const showInspections = writable<boolean>(true);
