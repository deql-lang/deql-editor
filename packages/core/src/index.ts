// @deql-lang/core — DeQL parser, graph builder, and layout engine

export { parseDeQL, deqlLexer } from './parser';
export type {
  FieldDef,
  AggregateNode,
  CommandNode,
  EventNode,
  DecisionNode,
  ProjectionNode,
  ExecuteNode,
  SelectNode,
  InspectDecisionNode,
  CreateTableNode,
  InspectProjectionNode,
  DeQLNode,
  SourceFragment,
  ParseResult,
} from './parser';

export { buildGraphIR } from './graphBuilder';
export type {
  GraphNode,
  GraphEdge,
  GraphGroup,
  GraphIR,
} from './graphBuilder';

export { applyLayout, NODE_DIMS } from './layout';
export type {
  GroupBounds,
  LayoutResult,
} from './layout';

export { associateComments } from './commentAssociation';
export type {
  AssociatedComment,
  CommentAssociationResult,
} from './commentAssociation';

export { sortFields, truncateFields } from './fieldUtils';
export type { TruncatedFieldResult } from './fieldUtils';

export type { DiagramLayout, EdgeStyle } from './types';
