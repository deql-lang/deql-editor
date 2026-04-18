# deql-editor

Admin UI for editing and visualizing DeQL — a CQRS domain language.

## Prerequisites

- Node.js 22+
- [Corepack](https://nodejs.org/api/corepack.html) enabled (ships with Node.js)

```bash
corepack enable
```

Yarn 4 is configured via `packageManager` in `package.json` — corepack handles the rest.

## Setup

```bash
yarn install
```

## Development

```bash
yarn dev
```

## Build

```bash
yarn workspace @deql-lang/core build
yarn build
```

## Project Structure

```
├── packages/core/       # @deql-lang/core — reusable parser, graph builder & layout engine
├── src/                 # Astro + Svelte editor app
│   ├── components/      # Svelte UI components
│   ├── lib/             # App-specific stores + re-exports from @deql-lang/core
│   └── pages/           # Astro pages
└── docs/examples/       # Example .deql files
```

## Using `@deql-lang/core` in another project

The core package (parser, graph builder, layout) can be consumed directly from this repo via SSH — no registry needed.

### Yarn Berry (v4+) — recommended

Yarn Berry natively supports SSH + monorepo subdirectory resolution:

```json
{
  "dependencies": {
    "@deql-lang/core": "git@github.com:deql-lang/deql-editor.git#workspace=@deql-lang/core"
  }
}
```

Pinned to a tag:

```json
{
  "dependencies": {
    "@deql-lang/core": "git@github.com:deql-lang/deql-editor.git#workspace=@deql-lang/core&commit=v0.1.0"
  }
}
```

Pinned to a branch:

```json
{
  "dependencies": {
    "@deql-lang/core": "git@github.com:deql-lang/deql-editor.git#workspace=@deql-lang/core&commit=main"
  }
}
```

### Quick example

```typescript
import { parseDeQL, buildGraphIR, applyLayout } from '@deql-lang/core';

const result = parseDeQL(deqlSource);
const graph = buildGraphIR(result);
const layout = await applyLayout(graph, 'compact');

// layout.nodes — positioned nodes with { id, type, data, position }
// layout.edges — connections between nodes
// layout.groupBounds — aggregate group rectangles
```

## License

MIT
