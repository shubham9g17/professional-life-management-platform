# ADR-0007 — IndexedDB queue + server-side conflict resolution

## Status

Accepted.

## Context

A productivity app should keep working without an internet connection. Common approaches:

- **No offline support.** Failures with "you're offline" toasts. Easiest to build, worst UX.
- **Service worker + cache-first reads, optimistic writes that retry on reconnect.** Good for read-heavy apps, but doesn't address what happens when the server has changed since the offline write started.
- **Full offline-first with conflict detection and resolution.** The user can do anything offline; conflicts are detected and surfaced for explicit resolution.

The third option requires real engineering, but it's the only one that respects the user's time when they're offline for non-trivial periods.

## Decision

Implement a **full offline-first stack**:

1. **Client-side IndexedDB queue.** All mutations are written first to a local IndexedDB store, then enqueued for sync. The UI optimistically updates from the local store immediately. (`lib/offline/sync-queue.ts`, `lib/offline/use-optimistic-mutation.ts`.)
2. **Background sync.** When connectivity returns, the queue posts to `POST /api/sync/queue` with all pending operations.
3. **Server-side conflict detection.** For each operation:
   - `CREATE` of an existing row → conflict.
   - `UPDATE` where `server.updatedAt > local.updatedAt` → conflict.
   - `DELETE` of a missing row → conflict (the row was already deleted server-side).
4. **Conflict resolution.** Conflicts are recorded as `ConflictResolution` rows. The user is notified and can resolve via `POST /api/sync/resolve-conflict`.
5. **Sync status.** `GET /api/sync/status` reports counts of pending / synced / conflicts.

Supports `task`, `habit`, `transaction`, `exercise`, `meal`, `water`, `learningResource` entity types.

## Consequences

**Better:**
- The user can use the entire app offline. Logging a habit on a flight just works.
- Conflict resolution is *honest* — instead of silently winning by last-write, the user is shown a conflict and decides.
- Easy to extend to new entities — register them in the entity dispatcher.
- `SyncQueue` and `ConflictResolution` rows make the sync state inspectable in `prisma studio`.

**Worse / accepted trade-offs:**
- Significant client-side complexity. The IndexedDB layer needs careful testing, especially around schema migrations.
- The server has to handle every entity type's reconciliation logic, which couples sync code to per-entity rules.
- The UX is not free — the user has to occasionally resolve a conflict, which most apps avoid by silently overwriting.
- Real-time updates are still pull-based; the sync queue is for offline writes, not for cross-device push.

## Read more

- Implementation: `lib/offline/`
- Server side: `app/api/sync/queue/route.ts`, `app/api/sync/resolve-conflict/route.ts`, `app/api/sync/status/route.ts`
- Schema: `SyncQueue`, `ConflictResolution` models in `prisma/schema.prisma`
- Conceptual overview: [`docs/02-architecture/offline-and-sync.md`](../02-architecture/offline-and-sync.md)
