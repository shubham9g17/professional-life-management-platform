# ADR-0004 — JWT sessions over database-backed sessions

## Status

Accepted.

## Context

NextAuth.js supports two session strategies:

1. **JWT.** Sessions are signed JWTs stored in an HTTP-only cookie. The server verifies the signature on each request; no database round-trip.
2. **Database.** Sessions are rows in a `sessions` table. Each request looks up the row.

The trade-off:

- JWT — fast (no DB hit), stateless (any server instance can verify), but harder to revoke (you wait for the token to expire).
- Database — slower (one DB query per request), stateful (revoke = delete row), but adds a hot path to the database.

This is a single-server deployment with a JWT-friendly threat model: there's no requirement to revoke a session before its 7-day expiry except on user-initiated sign-out (which clears the cookie regardless).

## Decision

Use **JWT-strategy sessions** with a 7-day expiry. The session callback in `lib/auth/config.ts` injects `user.id` into both the JWT and the resolved session.

```typescript
{
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60,    // 7 days
  // ...
}
```

Cookie names are deliberately `next-auth.session-token` (HTTP) and `__Secure-next-auth.session-token` (HTTPS). `proxy.ts` checks for both.

## Consequences

**Better:**
- Every request is one signature verification. No DB hit on the auth path.
- `getServerSession(authOptions)` is fast enough that we don't memoize it.
- No `sessions` table to manage, expire, or back up.

**Worse / accepted trade-offs:**
- A signed-out token remains valid until expiry. Sign-out is implemented as cookie-clear; the JWT itself isn't blacklisted. (For this app's threat model, that's fine; high-security apps should reconsider.)
- Token rotation requires care — see the NextAuth docs on `jwt` callback `trigger: 'update'`.
- Larger cookie payload than a session-id cookie (still well under the 4 KB limit).

If multi-tenant or admin-revocation requirements emerge, this would be revisited and a new ADR written.
