# DeQL UI — Roadmap

## Phase 1: Editor Enhancements

### ✅ 1.1 Local File Loading
~~Allow users to load `.deql` files from their local filesystem into the editor via a file picker button.~~ **DONE** — "📂 Load File" button in editor header opens native file picker for `.deql`, `.sql`, `.txt` files. Also added "Load Example…" dropdown loading from `docs/examples/`.

### 1.2 DeQL Linter
Implement a static analysis linter that runs alongside the parser and flags:
- **Orphan commands** — commands not referenced by any decision's `ON COMMAND`
- **Orphan events** — events not emitted by any decision
- **Naming conventions** — commands should be imperative verbs (e.g., `PlaceOrder`), events should be past tense (e.g., `OrderPlaced`)
- **Long SELECT queries** — warn when a projection or STATE AS query exceeds a configurable line threshold
- **JOIN usage** — flag JOINs as a code smell in event-sourced projections
- **Missing aggregate** — decisions referencing an aggregate that hasn't been declared
- **Duplicate names** — two commands, events, or decisions with the same name
- **Unused projections** — projections that don't read from any declared event stream

Display lint warnings as yellow squiggles in the CodeMirror editor alongside the existing red error markers. Show a warning count badge in the editor header.

---

## Phase 2: Diagram Node Interactions

### ✅ 2.1 Node Hover Details
~~Show a tooltip or popover on node hover.~~ **DONE** — NodeTooltip component with 300ms hover delay, 320px max width, kind-specific content (fields for commands/events, aggregate/command/events for decisions, source events for projections). Field truncation: max 3 fields on nodes with ID-first sorting, "…N more ℹ" indicator.

### ✅ 2.2 Node Click Info Panel
~~Add a slide-out info panel triggered by clicking an info icon.~~ **DONE** — 360px InfoPanel slides from right with 200ms ease. Shows full fields, source fragment, section comments (💬 line / 📝 block), aggregate summary (command/decision/event/stream counts). Closes on ×, Escape, or click-outside. ℹ icon on all nodes including aggregate subgraphs.

### ✅ 2.3 Comment Rendering
~~Display comments as annotations on the diagram.~~ **DONE** — Comments associated with nearest subsequent `CREATE` statement. First `/* */` block comment before any CREATE rendered as global comment banner on canvas. Section comments shown in InfoPanel with 💬/📝 icons. Aggregate subgraph InfoPanel shows comments from above `CREATE AGGREGATE`.

---

## Phase 3: DeQL Backend Integration

### 3.1 Backend Connection
Integrate with the DeQL REPL/backend service. Add a connection panel where users configure the backend URL. Show connection status in the header.

### 3.2 Query Fragment Execution
Allow users to select a query fragment in the editor and execute it against the backend. Display results in a tabular output panel below the editor or diagram.

### 3.3 Command Execution Forms
Generate an interactive form for each Command node:
- Auto-generate input fields from the command's field definitions (STRING → text input, INT → number input, DECIMAL → number with step, BOOL → checkbox)
- "Execute" button sends the command to the backend
- Display the result (emitted event or rejection) inline

Accessible from the command node's context menu or info panel.

### 3.4 Inspection Tables
Render inspection tables for:
- `$Events` streams — show the event log with stream_id, seq, event_type, data
- `$Agg` state — show the current derived state
- Projections — show the current read model contents

Display as expandable table panels within the diagram or in a dedicated "Inspect" tab.

### 3.5 Live Inspection
Connect inspection tables to the backend so they refresh after each command execution. Users can:
- Execute a command via the form
- See the emitted event appear in the `$Events` table
- See the projection update in real time
- See the aggregate state change

### 3.6 Decision Inspection Diagram
Render a visual inspection view for each Decision node showing:
- The STATE AS query and its resolved state values (e.g., `current_grade = 'L5'`)
- The guard condition (WHERE clause from EMIT AS) with pass/fail indicator
- Input command parameters and their values
- Output: emitted event or rejection with reason
- Step-by-step evaluation trace: command received → state queried → guard evaluated → event emitted/rejected

Accessible from the Decision node's ℹ panel or via a dedicated "Inspect" button. When connected to the backend, shows live evaluation results for the last executed command.

### 3.7 Projection Inspection Diagram
Render a visual inspection view for each Projection node showing:
- The full SELECT query with column mappings
- Source event stream and filtered event types
- Current projection output as a table (when connected to backend)
- Column lineage: trace each output column back to its source event field
- Aggregation functions used (SUM, COUNT, LAST, etc.) with their semantics

Accessible from the Projection node's ℹ panel or via a dedicated "Inspect" button. When connected to the backend, shows the current materialized view contents.

---

## Phase 4: Documentation Integration

### 4.1 deql-lang Docs Integration
Embed the DeQL diagram renderer as a component in the deql-lang documentation site. Code examples in the docs render an interactive diagram below them. Users can:
- See the visual representation of each code example
- Hover nodes for details
- Toggle between code and diagram views

### 4.2 Exportable Diagrams
Add export options:
- **SVG export** — download the current diagram as a vector image
- **PNG export** — download as a raster image
- **Mermaid export** — generate equivalent mermaid diagram code
- **Embed snippet** — generate an HTML embed code for the diagram

---

## Phase 5: Advanced Features

### 5.1 Diff View
Show visual diffs when the DeQL code changes:
- Highlight added/removed nodes and edges
- Animate transitions between diagram states
- Useful for reviewing schema evolution

### 5.2 Multi-File Support
Support loading multiple `.deql` files that reference each other. Render a unified diagram spanning all files with cross-file aggregate references.

### 5.3 Collaboration
Real-time collaborative editing using CRDT-based sync (e.g., Yjs). Multiple users can edit the same DeQL script and see the diagram update live.

### 5.4 Schema Validation
Validate the DeQL schema against a formal grammar and report structural issues:
- Circular event dependencies
- Unreachable aggregate states
- Conflicting guard conditions
- Missing event handlers in projections

### 5.5 Time-Travel Debugging
Integrate with the backend's event store to:
- Replay events step by step
- Highlight the active node at each step
- Show aggregate state evolution over time
- Visualize decision guard evaluations

### 5.6 AI-Assisted Modeling
Use LLM integration to:
- Suggest missing events or commands based on the domain model
- Generate DeQL from natural language domain descriptions
- Explain complex STATE AS queries in plain English
- Recommend projection optimizations

---

## Priority Matrix

| Feature | Impact | Effort | Priority | Status |
|---------|--------|--------|----------|--------|
| Local file loading | Medium | Low | P0 | ✅ Done |
| DeQL linter | High | Medium | P0 | |
| Node hover details | High | Low | P0 | ✅ Done |
| Comment rendering | Medium | Medium | P1 | ✅ Done |
| Node click info panel | High | Medium | P1 | ✅ Done |
| Backend connection | High | Medium | P1 | |
| Command execution forms | High | Medium | P1 | |
| Query fragment execution | Medium | Medium | P2 | |
| Inspection tables | High | High | P2 | |
| Live inspection | High | High | P2 | |
| Decision inspection diagram | High | Medium | P2 | |
| Projection inspection diagram | High | Medium | P2 | |
| Docs integration | Medium | High | P2 | |
| Exportable diagrams | Medium | Medium | P2 | |
| Diff view | Medium | High | P3 | |
| Multi-file support | Medium | High | P3 | |
| Time-travel debugging | High | High | P3 | |
| AI-assisted modeling | Medium | High | P3 | |
| Collaboration | Low | High | P4 | |
| Schema validation | Medium | High | P3 | |
