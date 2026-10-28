# Offline & Sync

The offline-first architecture — IndexedDB queue on the client, conflict-aware reconciliation on the server.

> **Implementation source-of-truth:** [`../../lib/offline/README.md`](../../lib/offline/README.md). This doc is the conceptual overview that links to it.
> **Decision rationale:** [ADR-0007](../adr/0007-offline-first-with-indexeddb.md).

---

## Why offline-first

A productivity app is most useful when you're focused — and "focused" often means somewhere without reliable internet. The bar for this project was: *the user can do anything offline that they can do online; conflicts are surfaced honestly when reconciling*.

Most apps that "support offline" silently overwrite the server with the local version (last-write-wins). This is data loss in disguise. We chose to surface conflicts to the user explicitly.

---

## How it works (high level)

```
┌─────── Browser ─────────┐                  ┌────── Server ───────┐
│                         │                  │                     │
│  UI component           │                  │                     │
│      ↓                  │                  │                     │
│  use-optimistic-mutation│                  │                     │
│      ↓                  │                  │                     │
│  IndexedDB queue ──fail─┼─── if offline ──→│                     │
│      ↓                  │                  │                     │
│  fetch /api/...         │                  │  /api/sync/queue    │
│      ↓                  │                  │      ↓              │
│  on success:            │                  │  detect conflicts   │
│    remove from queue    │                  │      ↓              │
│  on failure (offline):  │                  │  apply non-conflicts│
│    keep in queue        │                  │  write Conflict-    │
│                         │                  │  Resolution rows    │
│                         │                  │      ↓              │
│  background sync        │                  │  return outcomes    │
│  on reconnect ──────────┼─── post queue ──→│                     │
└─────────────────────────┘                  └─────────────────────┘
```

---

## Components

### Client side (`lib/offline/`)

| File | Role |
|---|---|
| `sync-queue.ts` | IndexedDB-backed queue. Adds, lists, removes pending operations. |
| `use-optimistic-mutation.ts` | React hook wrapping a mutation. Updates UI optimistically, posts to server, falls back to queue on offline. |
| `entity-dispatcher.ts` | Maps an operation to its API endpoint based on entity type (`task`/`habit`/`transaction`/...). |

### Server side (`app/api/sync/`)

| Endpoint | Purpose |
|---|---|
| `POST /api/sync/queue` | Apply a batch of pending ops. Returns per-op outcomes (`SYNCED` / `CONFLICT`). |
| `GET /api/sync/status` | Counts of pending / synced / conflicts. Last sync time. Per-entity breakdown. |
| `POST /api/sync/resolve-conflict` | User resolves a `ConflictResolution` row by choosing local or server. |

### Schema (`prisma/schema.prisma`)

| Model | Role |
|---|---|
| `SyncQueue` | Server-side mirror of in-flight operations. Tracks status. |
| `ConflictResolution` | One row per detected conflict. References the `SyncQueue` op + holds both versions. |

---

## Conflict detection rules

When `POST /api/sync/queue` processes an operation, it detects:

| Operation | Conflict condition |
|---|---|
| `CREATE` | An entity with that `id` already exists. |
| `UPDATE` | The server's `updatedAt > local.updatedAt` (server has been modified since the local version was last seen). |
| `DELETE` | The entity already doesn't exist (the row was deleted server-side or never existed). |

Non-conflicting operations are applied immediately. Conflicting ones produce a `ConflictResolution` row and a `CONFLICT` outcome.

---

## Supported entity types

`task`, `habit`, `transaction`, `exercise`, `meal`, `water`, `learningResource`. Adding a new entity type requires:

1. Registering the entity in `entity-dispatcher.ts` (client) and the server-side reconciler.
2. Ensuring the entity has both an `updatedAt` and an `id` field on the schema.

---

## Limitations

- **Real-time updates are not part of this stack.** This is for offline writes, not for cross-device push. (See [`../06-academic/future-work.md`](../06-academic/future-work.md).)
- **The IndexedDB schema must migrate carefully** if the queue shape changes — old queue entries from a previous schema can break the app on first load after deploy.
- **Per-entity conflict resolution UI is generic** — it shows local vs. server JSON. A field-level merge UI would be a much richer user experience.

---

> **Up:** [Architecture](./) · [Docs index](../README.md)
> **Related:** [ADR-0007](../adr/0007-offline-first-with-indexeddb.md) · [`../../lib/offline/README.md`](../../lib/offline/README.md)
