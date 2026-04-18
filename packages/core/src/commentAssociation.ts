// ─── Comment Association ──────────────────────────────────────────────────────
//
// Associates DeQL comments with their nearest subsequent CREATE node.
// The first block comment (/* */) before any CREATE is treated as a global comment.

import type { SourceFragment } from './parser';

export interface AssociatedComment {
  text: string;
  isBlock: boolean;
  line: number;
}

export interface CommentAssociationResult {
  nodeComments: Map<string, AssociatedComment[]>;
  globalComments: AssociatedComment[];
}

/**
 * Associates each comment with the nearest subsequent CREATE node.
 * The first block comment before any CREATE statement is extracted as a global comment.
 * All other comments associate with their nearest subsequent CREATE.
 */
export function associateComments(
  comments: { text: string; line: number; startOffset: number; endOffset: number; isBlock: boolean }[],
  sourceFragments: SourceFragment[]
): CommentAssociationResult {
  const nodeComments = new Map<string, AssociatedComment[]>();
  const globalComments: AssociatedComment[] = [];

  if (comments.length === 0 || sourceFragments.length === 0) {
    return { nodeComments, globalComments };
  }

  const sorted = [...comments].sort((a, b) => a.line - b.line);
  const fragments = [...sourceFragments].sort((a, b) => a.startLine - b.startLine);
  const firstCreateLine = fragments[0].startLine;

  // Extract the first block comment before any CREATE as global
  const globalCommentIdx = sorted.findIndex(c => c.isBlock && c.line < firstCreateLine);
  const skipIdx = new Set<number>();
  if (globalCommentIdx >= 0) {
    const gc = sorted[globalCommentIdx];
    globalComments.push({ text: gc.text, isBlock: gc.isBlock, line: gc.line });
    skipIdx.add(globalCommentIdx);
  }

  // Associate remaining comments with nearest subsequent CREATE
  for (let i = 0; i < sorted.length; i++) {
    if (skipIdx.has(i)) continue;
    const c = sorted[i];

    // Binary search for first fragment with startLine > c.line
    let lo = 0, hi = fragments.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (fragments[mid].startLine <= c.line) lo = mid + 1;
      else hi = mid;
    }
    if (lo < fragments.length) {
      const frag = fragments[lo];
      const key = `${frag.nodeKind}:${frag.nodeName}`;
      if (!nodeComments.has(key)) {
        nodeComments.set(key, []);
      }
      nodeComments.get(key)!.push({ text: c.text, isBlock: c.isBlock, line: c.line });
    }
  }

  return { nodeComments, globalComments };
}
