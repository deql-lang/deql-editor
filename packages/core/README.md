# @deql-lang/core

DeQL parser, graph builder, and layout engine. Framework-agnostic TypeScript library for parsing DeQL source code into an AST, building a graph intermediate representation, and computing node positions for visualization.

## Installation

```bash
npm install @deql-lang/core
```

## Usage

```typescript
import { parseDeQL, buildGraphIR, applyLayout } from '@deql-lang/core';

const source = `
CREATE AGGREGATE Order;
CREATE COMMAND PlaceOrder (orderId STRING, item STRING);
CREATE EVENT OrderPlaced (orderId STRING, item STRING);
CREATE DECISION PlaceOrderDecision
  FOR Order
  ON COMMAND PlaceOrder
  EMIT AS SELECT EVENT OrderPlaced(orderId := :orderId, item := :item);
`;

// 1. Parse DeQL source → AST
const parseResult = parseDeQL(source);

// 2. Build graph intermediate representation
const graphIR = buildGraphIR(parseResult);

// 3. Compute layout positions
const layout = await applyLayout(graphIR, 'compact');

// layout.nodes — positioned graph nodes
// layout.edges — connections between nodes
// layout.groupBounds — aggregate group rectangles
// layout.edgeType — recommended edge rendering style
```

## API

- `parseDeQL(input: string): ParseResult` — Tokenize and parse DeQL source
- `buildGraphIR(parseResult: ParseResult): GraphIR` — Transform AST into graph nodes/edges/groups
- `applyLayout(graphIR: GraphIR, mode?: DiagramLayout): Promise<LayoutResult>` — Position nodes
- `sortFields(fields: FieldDef[]): FieldDef[]` — Sort fields (IDs first)
- `truncateFields(fields: FieldDef[], limit?: number): TruncatedFieldResult` — Truncate field lists

## License

MIT
