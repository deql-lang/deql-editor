import { createToken, Lexer, tokenMatcher, type IToken } from 'chevrotain';

// ─── Tokens ───────────────────────────────────────────────────────────────────

const LineComment = createToken({ name: 'LineComment', pattern: /--[^\n]*/, group: 'comments' });
const BlockComment = createToken({ name: 'BlockComment', pattern: /\/\*[\s\S]*?\*\//, group: 'comments', line_breaks: true });

const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z_][a-zA-Z0-9_$]*/ });

// Keywords — use longer_alt so "OrderBook" matches Identifier, not Order+Book
const Create = createToken({ name: 'Create', pattern: /CREATE/i, longer_alt: Identifier });
const Aggregate = createToken({ name: 'Aggregate', pattern: /AGGREGATE/i, longer_alt: Identifier });
const Command = createToken({ name: 'Command', pattern: /COMMAND/i, longer_alt: Identifier });
const Event = createToken({ name: 'Event', pattern: /EVENT/i, longer_alt: Identifier });
const Decision = createToken({ name: 'Decision', pattern: /DECISION/i, longer_alt: Identifier });
const Projection = createToken({ name: 'Projection', pattern: /PROJECTION/i, longer_alt: Identifier });
const For = createToken({ name: 'For', pattern: /FOR/i, longer_alt: Identifier });
const On = createToken({ name: 'On', pattern: /ON/i, longer_alt: Identifier });
const Emit = createToken({ name: 'Emit', pattern: /EMIT/i, longer_alt: Identifier });
const As = createToken({ name: 'As', pattern: /AS/i, longer_alt: Identifier });
const State = createToken({ name: 'State', pattern: /STATE/i, longer_alt: Identifier });
const Execute = createToken({ name: 'Execute', pattern: /EXECUTE/i, longer_alt: Identifier });
const Select = createToken({ name: 'Select', pattern: /SELECT/i, longer_alt: Identifier });
const From = createToken({ name: 'From', pattern: /FROM/i, longer_alt: Identifier });
const Where = createToken({ name: 'Where', pattern: /WHERE/i, longer_alt: Identifier });
const Group = createToken({ name: 'Group', pattern: /GROUP/i, longer_alt: Identifier });
const Order = createToken({ name: 'Order', pattern: /ORDER/i, longer_alt: Identifier });
const By = createToken({ name: 'By', pattern: /BY/i, longer_alt: Identifier });
const StringType = createToken({ name: 'StringType', pattern: /STRING/i, longer_alt: Identifier });
const IntType = createToken({ name: 'IntType', pattern: /INT/i, longer_alt: Identifier });
const BoolType = createToken({ name: 'BoolType', pattern: /BOOL/i, longer_alt: Identifier });
const Last = createToken({ name: 'Last', pattern: /LAST/i, longer_alt: Identifier });
const Coalesce = createToken({ name: 'Coalesce', pattern: /COALESCE/i, longer_alt: Identifier });
const Inspect = createToken({ name: 'Inspect', pattern: /INSPECT/i, longer_alt: Identifier });
const Table = createToken({ name: 'Table', pattern: /TABLE/i, longer_alt: Identifier });
const Into = createToken({ name: 'Into', pattern: /INTO/i, longer_alt: Identifier });
const Values = createToken({ name: 'Values', pattern: /VALUES/i, longer_alt: Identifier });

const QuotedIdentifier = createToken({ name: 'QuotedIdentifier', pattern: /"[^"]*"/ });
const StringLiteral = createToken({ name: 'StringLiteral', pattern: /'[^']*'/ });
const NumberLiteral = createToken({ name: 'NumberLiteral', pattern: /\d+(\.\d+)?/ });
const Param = createToken({ name: 'Param', pattern: /:[a-zA-Z_][a-zA-Z0-9_]*/ });

const LParen = createToken({ name: 'LParen', pattern: /\(/ });
const RParen = createToken({ name: 'RParen', pattern: /\)/ });
const Comma = createToken({ name: 'Comma', pattern: /,/ });
const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
const Dot = createToken({ name: 'Dot', pattern: /\./ });
const Assign = createToken({ name: 'Assign', pattern: /:=/ });
const NotEq = createToken({ name: 'NotEq', pattern: /<>/ });
const LtEq = createToken({ name: 'LtEq', pattern: /<=/ });
const GtEq = createToken({ name: 'GtEq', pattern: />=/ });
const Lt = createToken({ name: 'Lt', pattern: /</ });
const Gt = createToken({ name: 'Gt', pattern: />/ });
const Equals = createToken({ name: 'Equals', pattern: /=/ });
const Star = createToken({ name: 'Star', pattern: /\*/ });

const WhiteSpace = createToken({ name: 'WhiteSpace', pattern: /\s+/, group: Lexer.SKIPPED, line_breaks: true });

// Order matters - longer/more specific patterns first
const allTokens = [
  WhiteSpace,
  BlockComment,
  LineComment,
  Assign,
  NotEq, LtEq, GtEq, Lt, Gt, Equals,
  Group, Order, By,
  Create, Aggregate, Command, Event, Decision, Projection,
  For, On, Emit, As, State, Execute, Select, From, Where,
  Inspect, Table, Into, Values,
  StringType, IntType, BoolType, Last, Coalesce,
  Param,
  QuotedIdentifier,
  StringLiteral,
  NumberLiteral,
  Identifier,
  LParen, RParen, Comma, Semicolon, Dot, Star,
];

export const deqlLexer = new Lexer(allTokens);

// ─── AST Types ────────────────────────────────────────────────────────────────

export interface FieldDef { name: string; type: string; }

export interface AggregateNode {
  kind: 'aggregate';
  name: string;
  comment?: string;
}

export interface CommandNode {
  kind: 'command';
  name: string;
  fields: FieldDef[];
  comment?: string;
}

export interface EventNode {
  kind: 'event';
  name: string;
  fields: FieldDef[];
  comment?: string;
}

export interface DecisionNode {
  kind: 'decision';
  name: string;
  aggregate: string;
  onCommand: string;
  emitsEvents: string[];
  hasStateQuery: boolean;
  stateQuerySource?: string;
  stateQuerySources: string[];
  comment?: string;
}

export interface ProjectionNode {
  kind: 'projection';
  name: string;
  sourceEvents: string[];
  fromSource?: string;
  comment?: string;
}

export interface ExecuteNode {
  kind: 'execute';
  commandName: string;
  args: Record<string, string>;
  comment?: string;
}

export interface SelectNode {
  kind: 'select';
  source: string;
  comment?: string;
}

export interface InspectDecisionNode {
  kind: 'inspectDecision';
  decisionName: string;
  sourceTable: string;
  destinationTable: string;
}

export interface CreateTableNode {
  kind: 'createTable';
  tableName: string;
  values: string[][];
}

export interface InspectProjectionNode {
  kind: 'inspectProjection';
  projectionName: string;
  sourceStream: string;
  destinationTable: string;
}

export type DeQLNode = AggregateNode | CommandNode | EventNode | DecisionNode | ProjectionNode | ExecuteNode | SelectNode | InspectDecisionNode | CreateTableNode | InspectProjectionNode;

export interface SourceFragment {
  nodeKind: string;
  nodeName: string;
  startOffset: number;
  endOffset: number;
  startLine: number;
  endLine: number;
}

export interface ParseResult {
  nodes: DeQLNode[];
  errors: string[];
  comments: { text: string; line: number; startOffset: number; endOffset: number; isBlock: boolean }[];
  sourceFragments: SourceFragment[];
  source: string;
}

// ─── Simple Recursive-Descent Parser with Error Recovery ──────────────────────

export function parseDeQL(input: string): ParseResult {
  const lexResult = deqlLexer.tokenize(input);
  const tokens = lexResult.tokens;
  const errors: string[] = lexResult.errors.map(e => `Lex error at line ${e.line}: ${e.message}`);

  const comments: { text: string; line: number; startOffset: number; endOffset: number; isBlock: boolean }[] = [
    ...(lexResult.groups['comments'] || []).map((t: IToken) => ({
      text: t.image,
      line: t.startLine || 0,
      startOffset: t.startOffset,
      endOffset: t.endOffset ?? t.startOffset + t.image.length - 1,
      isBlock: tokenMatcher(t, BlockComment),
    }))
  ];

  const nodes: DeQLNode[] = [];
  const sourceFragments: SourceFragment[] = [];
  let pos = 0;
  let lastConsumedToken: IToken | null = null;
  const maxPos = tokens.length;

  function getLastEndOffset(): number {
    if (!lastConsumedToken) return 0;
    return lastConsumedToken.endOffset ?? (lastConsumedToken.startOffset + lastConsumedToken.image.length - 1);
  }

  function getLastEndLine(): number {
    if (!lastConsumedToken) return 0;
    return lastConsumedToken.endLine ?? lastConsumedToken.startLine ?? 0;
  }

  function peek(offset = 0) {
    return tokens[pos + offset];
  }

  function consume() {
    const t = tokens[pos++];
    lastConsumedToken = t;
    return t;
  }

  function match(tokenType: ReturnType<typeof createToken>): boolean {
    const t = peek();
    return t !== undefined && tokenMatcher(t, tokenType);
  }

  function expect(tokenType: ReturnType<typeof createToken>, name: string): string | null {
    if (match(tokenType)) {
      return consume().image;
    }
    const t = peek();
    errors.push(`Expected ${name} but got "${t?.image ?? 'EOF'}" at position ${pos}`);
    return null;
  }

  function skipUntilSemicolon() {
    while (pos < tokens.length && !match(Semicolon)) {
      pos++;
    }
    if (match(Semicolon)) pos++;
  }

  function parseIdentifier(): string | null {
    if (match(Identifier)) return consume().image;
    if (match(QuotedIdentifier)) return consume().image.replace(/"/g, '');
    return null;
  }

  function parseQualifiedName(): string {
    const parts: string[] = [];
    const id = parseIdentifier();
    if (id) parts.push(id);
    while (match(Dot)) {
      consume();
      const next = parseIdentifier();
      if (next) parts.push(next);
    }
    return parts.join('.');
  }

  function parseFieldDefs(): FieldDef[] {
    const fields: FieldDef[] = [];
    if (!match(LParen)) return fields;
    consume();
    while (pos < tokens.length && !match(RParen)) {
      const name = parseIdentifier();
      if (!name) { pos++; continue; }
      let type = 'ANY';
      if (match(StringType)) { type = consume().image; }
      else if (match(IntType)) { type = consume().image; }
      else if (match(BoolType)) { type = consume().image; }
      else if (match(Identifier)) { type = consume().image; }
      fields.push({ name, type });
      if (match(Comma)) consume();
    }
    if (match(RParen)) consume();
    return fields;
  }

  function parseCreateAggregate(): AggregateNode | null {
    const name = expect(Identifier, 'aggregate name');
    if (!name) { skipUntilSemicolon(); return null; }
    if (match(Semicolon)) consume();
    return { kind: 'aggregate', name };
  }

  function parseCreateCommand(): CommandNode | null {
    const name = parseIdentifier();
    if (!name) { skipUntilSemicolon(); return null; }
    const fields = parseFieldDefs();
    if (match(Semicolon)) consume();
    return { kind: 'command', name, fields };
  }

  function parseCreateEvent(): EventNode | null {
    const name = parseIdentifier();
    if (!name) { skipUntilSemicolon(); return null; }
    const fields = parseFieldDefs();
    if (match(Semicolon)) consume();
    return { kind: 'event', name, fields };
  }

  function parseEventEmitList(): string[] {
    const events: string[] = [];
    const startPos = pos;
    while (pos < tokens.length) {
      if (match(Semicolon) || match(Where)) break;
      if (match(Select)) consume();
      if (pos >= tokens.length || match(Semicolon) || match(Where)) break;
      if (match(Event)) consume();
      if (pos >= tokens.length || match(Semicolon) || match(Where)) break;
      const name = parseIdentifier();
      if (name) events.push(name);
      else { pos++; continue; }
      if (match(LParen)) {
        let depth = 1;
        consume();
        while (pos < tokens.length && depth > 0) {
          if (match(LParen)) { depth++; consume(); }
          else if (match(RParen)) { depth--; consume(); }
          else { consume(); }
        }
      }
      if (!match(Comma)) break;
      consume();
    }
    while (pos < tokens.length && !match(Semicolon)) {
      pos++;
    }
    if (pos === startPos && pos < tokens.length) pos++;
    return events;
  }

  function parseCreateDecision(): DecisionNode | null {
    const name = parseIdentifier();
    if (!name) { skipUntilSemicolon(); return null; }
    let aggregateName = '';
    let onCommand = '';
    let hasStateQuery = false;
    let stateQuerySource: string | undefined;
    const stateQuerySources: string[] = [];
    let emitsEvents: string[] = [];

    if (match(For)) {
      consume();
      aggregateName = parseIdentifier() || '';
    }

    if (match(On)) {
      consume();
      if (match(Command)) consume();
      onCommand = parseIdentifier() || '';
    }

    if (match(State)) {
      consume();
      if (match(As)) consume();
      hasStateQuery = true;
      while (pos < tokens.length && !match(Emit)) {
        if (match(From)) {
          consume();
          const src = parseQualifiedName();
          if (src) {
            stateQuerySources.push(src);
            if (!stateQuerySource) stateQuerySource = src;
          }
          continue;
        }
        pos++;
      }
    }

    if (match(Emit)) {
      consume();
      if (match(As)) consume();
      emitsEvents = parseEventEmitList();
    }

    if (match(Semicolon)) consume();

    return { kind: 'decision', name, aggregate: aggregateName, onCommand, emitsEvents, hasStateQuery, stateQuerySource, stateQuerySources };
  }

  function parseCreateProjection(): ProjectionNode | null {
    const name = parseIdentifier();
    if (!name) { skipUntilSemicolon(); return null; }
    if (match(As)) consume();

    const sourceEvents: string[] = [];
    let fromSource: string | undefined;

    while (pos < tokens.length && !match(Semicolon)) {
      if (match(From)) {
        consume();
        fromSource = parseQualifiedName();
        continue;
      }
      if (match(Where)) {
        consume();
        while (pos < tokens.length && !match(Semicolon) && !match(Group) && !match(Order)) {
          const t = peek();
          if (t && t.image.toLowerCase() === 'event_type') {
            consume();
            while (pos < tokens.length && !match(StringLiteral) && !match(Semicolon)) pos++;
            if (match(StringLiteral)) {
              const s = consume().image.replace(/'/g, '');
              sourceEvents.push(s);
            }
          } else {
            pos++;
          }
        }
      } else {
        pos++;
      }
    }

    if (match(Semicolon)) consume();
    return { kind: 'projection', name, sourceEvents, fromSource };
  }

  function parseExecute(): ExecuteNode | null {
    const commandName = parseIdentifier();
    if (!commandName) { skipUntilSemicolon(); return null; }
    const args: Record<string, string> = {};
    if (match(LParen)) {
      consume();
      while (pos < tokens.length && !match(RParen)) {
        const prevArgPos = pos;
        const key = parseIdentifier();
        if (key && match(Assign)) {
          consume();
          const val = peek();
          if (val) { args[key] = val.image; consume(); }
        }
        if (match(Comma)) consume();
        if (pos === prevArgPos) pos++;
      }
      if (match(RParen)) consume();
    }
    if (match(Semicolon)) consume();
    return { kind: 'execute', commandName, args };
  }

  function parseSelect(): SelectNode | null {
    while (pos < tokens.length && !match(From) && !match(Semicolon)) pos++;
    let source = '';
    if (match(From)) {
      consume();
      source = parseQualifiedName();
    }
    skipUntilSemicolon();
    return { kind: 'select', source };
  }

  function parseInspectDecision(): InspectDecisionNode | null {
    const decisionName = parseIdentifier();
    if (!decisionName) { errors.push(`Expected decision name after INSPECT DECISION at position ${pos}`); skipUntilSemicolon(); return null; }
    if (!match(From)) { errors.push(`Expected FROM after INSPECT DECISION ${decisionName} at position ${pos}`); skipUntilSemicolon(); return null; }
    consume();
    const sourceTable = parseIdentifier();
    if (!sourceTable) { errors.push(`Expected source table name after FROM at position ${pos}`); skipUntilSemicolon(); return null; }
    if (!match(Into)) { errors.push(`Expected INTO after FROM ${sourceTable} at position ${pos}`); skipUntilSemicolon(); return null; }
    consume();
    const destinationTable = parseIdentifier();
    if (!destinationTable) { errors.push(`Expected destination table name after INTO at position ${pos}`); skipUntilSemicolon(); return null; }
    if (match(Semicolon)) consume();
    return { kind: 'inspectDecision', decisionName, sourceTable, destinationTable };
  }

  function parseInspectProjection(): InspectProjectionNode | null {
    const projectionName = parseIdentifier();
    if (!projectionName) { errors.push(`Expected projection name after INSPECT PROJECTION at position ${pos}`); skipUntilSemicolon(); return null; }
    if (!match(From)) { errors.push(`Expected FROM after INSPECT PROJECTION ${projectionName} at position ${pos}`); skipUntilSemicolon(); return null; }
    consume();
    const sourceStream = parseQualifiedName();
    if (!sourceStream) { errors.push(`Expected source stream after FROM at position ${pos}`); skipUntilSemicolon(); return null; }
    if (!match(Into)) { errors.push(`Expected INTO after FROM ${sourceStream} at position ${pos}`); skipUntilSemicolon(); return null; }
    consume();
    const destinationTable = parseIdentifier();
    if (!destinationTable) { errors.push(`Expected destination table name after INTO at position ${pos}`); skipUntilSemicolon(); return null; }
    if (match(Semicolon)) consume();
    return { kind: 'inspectProjection', projectionName, sourceStream, destinationTable };
  }

  function parseCreateTable(): CreateTableNode | null {
    const tableName = parseIdentifier();
    if (!tableName) { errors.push(`Expected table name after CREATE TABLE at position ${pos}`); skipUntilSemicolon(); return null; }
    if (!match(As)) { errors.push(`Expected AS after CREATE TABLE ${tableName} at position ${pos}`); skipUntilSemicolon(); return null; }
    consume();
    if (!match(Values)) { errors.push(`Expected VALUES after AS at position ${pos}`); skipUntilSemicolon(); return null; }
    consume();
    const values: string[][] = [];
    while (pos < tokens.length && match(LParen)) {
      consume();
      const row: string[] = [];
      while (pos < tokens.length && !match(RParen)) {
        if (match(StringLiteral) || match(NumberLiteral)) {
          row.push(consume().image);
        } else if (match(Identifier)) {
          row.push(consume().image);
        } else if (match(Comma)) {
          consume();
        } else {
          pos++;
        }
      }
      if (match(RParen)) consume();
      values.push(row);
      if (match(Comma)) consume();
    }
    if (match(Semicolon)) consume();
    return { kind: 'createTable', tableName, values };
  }

  // ─── Main parse loop ─────────────────────────────────────────────────────────
  let loopGuard = 0;
  const maxIterations = tokens.length * 2;
  while (pos < tokens.length) {
    if (++loopGuard > maxIterations) {
      errors.push('Parser safety limit reached — possible infinite loop');
      break;
    }
    const prevPos = pos;
    const t = peek();
    if (!t) break;

    if (tokenMatcher(t, Inspect)) {
      const inspectToken = t;
      const inspectStartOffset = inspectToken.startOffset;
      const inspectStartLine = inspectToken.startLine ?? 0;
      consume();
      const next = peek();
      if (next && tokenMatcher(next, Decision)) {
        consume();
        try {
          const node = parseInspectDecision();
          if (node) {
            nodes.push(node);
            sourceFragments.push({ nodeKind: node.kind, nodeName: node.decisionName, startOffset: inspectStartOffset, endOffset: getLastEndOffset(), startLine: inspectStartLine, endLine: getLastEndLine() });
          }
        } catch (e) { errors.push(`Parse error: ${(e as Error).message}`); skipUntilSemicolon(); }
      } else if (next && tokenMatcher(next, Projection)) {
        consume();
        try {
          const node = parseInspectProjection();
          if (node) {
            nodes.push(node);
            sourceFragments.push({ nodeKind: node.kind, nodeName: node.projectionName, startOffset: inspectStartOffset, endOffset: getLastEndOffset(), startLine: inspectStartLine, endLine: getLastEndLine() });
          }
        } catch (e) { errors.push(`Parse error: ${(e as Error).message}`); skipUntilSemicolon(); }
      } else {
        errors.push(`Expected DECISION or PROJECTION after INSPECT but got "${next?.image ?? 'EOF'}" at position ${pos}`);
        skipUntilSemicolon();
      }
    } else if (tokenMatcher(t, Create)) {
      const createToken = t;
      const createStartOffset = createToken.startOffset;
      const createStartLine = createToken.startLine ?? 0;
      consume();
      const next = peek();
      if (!next) break;

      try {
        if (tokenMatcher(next, Table)) {
          consume();
          const node = parseCreateTable();
          if (node) { nodes.push(node); sourceFragments.push({ nodeKind: node.kind, nodeName: node.tableName, startOffset: createStartOffset, endOffset: getLastEndOffset(), startLine: createStartLine, endLine: getLastEndLine() }); }
        } else if (tokenMatcher(next, Aggregate)) {
          consume();
          const node = parseCreateAggregate();
          if (node) { nodes.push(node); sourceFragments.push({ nodeKind: node.kind, nodeName: node.name, startOffset: createStartOffset, endOffset: getLastEndOffset(), startLine: createStartLine, endLine: getLastEndLine() }); }
        } else if (tokenMatcher(next, Command)) {
          consume();
          const node = parseCreateCommand();
          if (node) { nodes.push(node); sourceFragments.push({ nodeKind: node.kind, nodeName: node.name, startOffset: createStartOffset, endOffset: getLastEndOffset(), startLine: createStartLine, endLine: getLastEndLine() }); }
        } else if (tokenMatcher(next, Event)) {
          consume();
          const node = parseCreateEvent();
          if (node) { nodes.push(node); sourceFragments.push({ nodeKind: node.kind, nodeName: node.name, startOffset: createStartOffset, endOffset: getLastEndOffset(), startLine: createStartLine, endLine: getLastEndLine() }); }
        } else if (tokenMatcher(next, Decision)) {
          consume();
          const node = parseCreateDecision();
          if (node) { nodes.push(node); sourceFragments.push({ nodeKind: node.kind, nodeName: node.name, startOffset: createStartOffset, endOffset: getLastEndOffset(), startLine: createStartLine, endLine: getLastEndLine() }); }
        } else if (tokenMatcher(next, Projection)) {
          consume();
          const node = parseCreateProjection();
          if (node) { nodes.push(node); sourceFragments.push({ nodeKind: node.kind, nodeName: node.name, startOffset: createStartOffset, endOffset: getLastEndOffset(), startLine: createStartLine, endLine: getLastEndLine() }); }
        } else {
          errors.push(`Unknown CREATE type: ${next.image}`);
          skipUntilSemicolon();
        }
      } catch (e) { errors.push(`Parse error: ${(e as Error).message}`); skipUntilSemicolon(); }
    } else if (tokenMatcher(t, Execute)) {
      consume();
      try { const node = parseExecute(); if (node) nodes.push(node); }
      catch (e) { errors.push(`Parse error: ${(e as Error).message}`); skipUntilSemicolon(); }
    } else if (tokenMatcher(t, Select)) {
      consume();
      try { const node = parseSelect(); if (node) nodes.push(node); }
      catch (e) { errors.push(`Parse error: ${(e as Error).message}`); skipUntilSemicolon(); }
    } else {
      pos++;
    }
    if (pos === prevPos) pos++;
  }

  return { nodes, errors, comments, sourceFragments, source: input };
}
