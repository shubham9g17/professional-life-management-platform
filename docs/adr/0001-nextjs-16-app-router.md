# ADR-0001 — Next.js 16 with App Router

## Status

Accepted.

## Context

The project needs a web framework that supports server-rendered React, file-based routing for pages and API endpoints, and a low ceremony cost for typical full-stack patterns (auth, forms, data fetching). It also needs to be familiar to future maintainers and recruiters reviewing the codebase.

Three alternatives were considered:

- **Next.js with the older Pages Router.** Mature, lots of tutorials, but Next has been steering everyone toward App Router and the Pages Router is on its way to legacy.
- **Remix.** Excellent loader/action data-flow story; smaller community.
- **SvelteKit.** Best performance characteristics; smaller TypeScript ecosystem at the time of decision.
- **A custom React + Express setup.** Reinvents what Next gives for free.

## Decision

Use **Next.js 16 with the App Router**, server components where useful, the React Compiler enabled to remove most `useMemo`/`useCallback` ceremony, and Turbopack as the dev bundler.

The project also uses Next.js 16's `proxy.ts` middleware (renamed from `middleware.ts`) for the auth gate.

## Consequences

**Better:**
- File-based routing for both pages and API gives a single, scannable surface.
- App Router groups (`app/(dashboard)/`) let us share a layout across all authenticated pages without per-page wrapping.
- The React Compiler removes the bulk of memoization plumbing.
- Turbopack makes the dev loop fast.
- Next.js 16 + React 19 are the current stable line — recruiters reviewing the project see modern tooling.

**Worse / accepted trade-offs:**
- Tutorials online still target the Pages Router. New contributors have to filter for App Router-specific guidance.
- Next.js 16's `proxy.ts` rename is recent and easy to miss; CLAUDE.md and onboarding docs explicitly call this out.
- Server components and client components have a hard boundary — passing class instances or non-serializable values from server to client doesn't work.
