---
title: "Order Fulfillment — Multi-Aggregate CQRS Visualization"
description: "Visual representation of the Order Fulfillment domain with two aggregates, cross-aggregate state queries, and projections."
---

## Domain

An order fulfillment system with two aggregate boundaries: **OrderBook** (handles orders) and **Warehouse** (handles inventory). The PlaceOrder decision queries Warehouse state before emitting events — a cross-aggregate pattern.

## Runtime Behavior

```mermaid
flowchart LR
  subgraph "OrderBook Aggregate"
    C1["PlaceOrder\n(Command)"]
    D1["PlaceOrder\n(Decision)"]
    E1["OrderPlaced"]
    E2["OrderRejected"]
    S1["OrderBook$Events"]

    C1 -->|"EXECUTE"| D1
    D1 -->|"EMIT or REJECT"| E1
    D1 -->|"EMIT or REJECT"| E2
    E1 --> S1
    E2 --> S1
  end

  subgraph "Warehouse Aggregate"
    C2["ReceiveStock\n(Command)"]
    D2["ReceiveStock\n(Decision)"]
    E3["StockReceived"]
    S2["Warehouse$Events"]

    C2 -->|"EXECUTE"| D2
    D2 -->|"EMIT"| E3
    E3 --> S2
  end

  subgraph "Projections"
    P1["StockLevels"]
    P2["OrderLog"]
  end

  S1 --> P2
  S2 --> P1
```

## Flow

1. `ReceiveStock` command → `ReceiveStock` decision → emits `StockReceived` (unconditional) → flows into `Warehouse$Events`
2. `PlaceOrder` command → `PlaceOrder` decision → queries `Warehouse$Events` for available stock → emits `OrderPlaced` if stock sufficient, `OrderRejected` otherwise → flows into `OrderBook$Events`
3. `Warehouse$Events` feeds the `StockLevels` projection
4. `OrderBook$Events` feeds the `OrderLog` projection

## Aggregate Boundaries

Each aggregate subgraph encapsulates its full CQRS pipeline:

| Aggregate | Commands | Decisions | Events | Stream |
|-----------|----------|-----------|--------|--------|
| OrderBook | PlaceOrder | PlaceOrder | OrderPlaced, OrderRejected | OrderBook$Events |
| Warehouse | ReceiveStock | ReceiveStock | StockReceived | Warehouse$Events |

## Cross-Aggregate Query

The `PlaceOrder` decision performs a cross-aggregate state query against `Warehouse$Events` to check available stock before deciding whether to emit `OrderPlaced` or reject the command.
