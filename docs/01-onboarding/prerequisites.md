# Prerequisites

Tools you need installed before running the project.

## Required

| Tool | Version | Why |
|---|---|---|
| **Node.js** | 18 LTS or newer (20+ recommended) | Runtime for Next.js 16 + the build toolchain. |
| **npm** | bundled with Node.js | Package manager. (`pnpm` or `yarn` should also work but the project's lockfile is `package-lock.json`.) |
| **PostgreSQL** | 14 or newer | Prisma datasource. Local install or any hosted instance — Supabase, Neon, Railway, Render, etc. |

## Optional

| Tool | Version | Why |
|---|---|---|
| **Redis** | 6 or newer | Cache layer. **Disabled by default** (`ENABLE_REDIS=false`); the cache calls become safe no-ops. Enable only if you want the optional read-through caching. See [`../05-operations/no-redis-setup.md`](../05-operations/no-redis-setup.md). |
| **Git** | any recent | For cloning + version control. |

## Sanity check

```bash
node --version    # should print v18.x or higher
npm --version
psql --version    # or your hosted-Postgres equivalent
```

If those print sensible versions, head to [`./installation.md`](./installation.md).

## OS notes

- **macOS:** install everything via Homebrew (`brew install node postgresql@16`).
- **Linux:** use your distro's package manager. `apt install nodejs npm postgresql` on Debian/Ubuntu.
- **Windows:** WSL 2 with an Ubuntu image is the smoothest path. Native Windows works for Node but Postgres is happier on WSL.

---

> **Next:** [Installation](./installation.md) · **Up:** [Docs index](../README.md)
