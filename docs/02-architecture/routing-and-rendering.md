# Routing & Rendering

How URLs map to code in this Next.js 16 App Router project.

> **Read with:** [overview](./overview.md), [authentication](./authentication.md).

---

## Route groups

Two top-level groupings under `app/`:

| Path | Purpose |
|---|---|
| `app/(dashboard)/` | All authenticated app pages — share `app/(dashboard)/layout.tsx` (sidebar + header). |
| `app/auth/` | Public auth pages — sign-in, sign-up, sign-out. |
| `app/api/` | REST endpoints. Each folder maps to a URL segment; `route.ts` exports HTTP method handlers. |
| `app/page.tsx` | Root `/` — redirects to `/dashboard` if signed in, else to `/auth/signin`. |

The parentheses in `(dashboard)` mean "route group" — it doesn't appear in the URL. So `app/(dashboard)/tasks/page.tsx` is at `/tasks`, not `/dashboard/tasks`.

---

## Auth gating: `proxy.ts`

Next.js 16 renamed `middleware.ts` → `proxy.ts`. The file at the project root is the global auth gate.

```typescript
// proxy.ts (excerpt)
export default withAuth(/* ... */)

export const config = {
  matcher: ['/((?!api/auth|_next|favicon.ico|.*\\.png).*)'],
}
```

The matcher excludes:
- `/api/auth/*` — NextAuth's own endpoints (sign-in, sign-out, session, callback).
- `/_next/*` — Next.js internal assets.
- `/favicon.ico`, `*.png` — static assets.

Everything else hits the middleware. The `withAuth` wrapper checks for `next-auth.session-token` (or `__Secure-...` in HTTPS). No cookie → 302 to `/auth/signin`.

> ⚠️ **Don't** create a `middleware.ts` alongside `proxy.ts`. Next.js loads both, and you'll get duplicate execution.

---

## Page rendering modes

By default, pages and components are **server components**. Add `'use client'` at the top of a file to make it a client component.

| When to use | Pattern |
|---|---|
| Page that just renders an interactive component | Server page mounts a client orchestrator. Page is server; orchestrator is `'use client'`. |
| Component that uses hooks (`useState`, `useEffect`) | `'use client'`. |
| Component that subscribes to context (theme, toast) | `'use client'`. |
| Component that uses browser-only APIs (IndexedDB, `window`) | `'use client'`. |
| Static layout / data-only component | Server. Skips React runtime cost on the client. |

---

## API route handler shape

Every route file exports HTTP method handlers:

```typescript
// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { taskRepository } from '@/lib/repositories/task-repository'
import { handleApiError, getOrCreateCorrelationId } from '@/lib/error/handle-api-error'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new AuthenticationError()
    const tasks = await taskRepository.list(session.user.id)
    return NextResponse.json({ tasks })
  } catch (error) {
    return handleApiError(error, getOrCreateCorrelationId(request))
  }
}

export async function POST(request: NextRequest) { /* ... */ }
```

Three things every route does, in order: resolve user → validate input → delegate to repository → return JSON. See [conventions](../04-development/conventions.md).

---

## Dynamic routes

`app/api/tasks/[id]/route.ts` — `[id]` is a path parameter.

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // Next.js 16: params is a Promise
  // ...
}
```

> ⚠️ Next.js 16 changed `params` and `searchParams` from synchronous objects to Promises. If you copy-paste from older tutorials you'll get a runtime error.

---

## Layouts

Layouts wrap their route segment. The dashboard layout:

```typescript
// app/(dashboard)/layout.tsx
export default async function ProtectedLayout({ children }) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
```

Every page under `app/(dashboard)/` inherits this — no per-page auth wrapper needed.

---

## Special files

| File | Role |
|---|---|
| `page.tsx` | Page component. |
| `layout.tsx` | Wraps every page in the segment. |
| `loading.tsx` | Streaming UI shown while page is loading. |
| `error.tsx` | Error boundary (must be `'use client'`). |
| `not-found.tsx` | 404 page. |
| `route.ts` | HTTP API handler. |
| `template.tsx` | Like layout, but creates a new instance on every navigation. (Not used here.) |

---

> **Up:** [Architecture](./) · [Docs index](../README.md)
> **Related:** [Authentication](./authentication.md) · [Codebase tour](../01-onboarding/codebase-tour.md)
