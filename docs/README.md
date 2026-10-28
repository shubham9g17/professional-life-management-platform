# Documentation

Welcome. The docs are organized around three audiences. Pick the path that matches why you're here.

---

## 👨‍🎓 I'm the developer / student — I want to learn this project

Read in this order. Each step builds on the last.

1. **[01-onboarding/prerequisites.md](./01-onboarding/prerequisites.md)** — what you need installed.
2. **[01-onboarding/installation.md](./01-onboarding/installation.md)** — get the project running locally.
3. **[01-onboarding/first-run.md](./01-onboarding/first-run.md)** — sign up and exercise every module.
4. **[01-onboarding/codebase-tour.md](./01-onboarding/codebase-tour.md)** ★ — narrated walk through the repo, file by file.
5. **[02-architecture/overview.md](./02-architecture/overview.md)** ★ — system diagram, data flow, request lifecycle.
6. **[02-architecture/](./02-architecture/)** — deep-dives on auth, data layer, caching, error handling, offline sync, theming, performance.
7. **[04-development/](./04-development/)** — conventions, testing, build pipeline, how to add a feature.

---

## 🎓 I'm a university teacher / examiner — I want to evaluate this project

Start with the formal report and the design rationale.

| Doc | Why read it |
|---|---|
| **[06-academic/project-report.md](./06-academic/project-report.md)** ★ | Formal report: abstract, problem statement, design, implementation, results, conclusion, references. |
| **[06-academic/design-decisions.md](./06-academic/design-decisions.md)** ★ | Every non-trivial architectural choice, justified. |
| **[06-academic/learning-outcomes.md](./06-academic/learning-outcomes.md)** | Skills demonstrated, mapped to a typical CS curriculum. |
| **[06-academic/future-work.md](./06-academic/future-work.md)** | Known limitations and proposed next steps. |
| **[06-academic/references.md](./06-academic/references.md)** | Libraries, papers, blog posts cited. |
| [adr/](./adr/) | Architecture Decision Records for engineering choices. |
| [02-architecture/overview.md](./02-architecture/overview.md) | Visual system diagram. |
| [../FEATURES.md](../FEATURES.md) | Authoritative feature inventory (every page, every endpoint). |
| [../Test.md](../Test.md) | Test plan and coverage map. |

---

## 💼 I'm a recruiter / interviewer — I want a quick read

Three minutes will give you the gist.

| Doc | Time |
|---|---|
| **[../README.md](../README.md)** | Front-door pitch (60 seconds). |
| **[07-portfolio/elevator-pitch.md](./07-portfolio/elevator-pitch.md)** ★ | 30-second / 2-min / 5-min versions. |
| **[07-portfolio/highlights.md](./07-portfolio/highlights.md)** ★ | The five most technically interesting pieces of the project. |
| **[07-portfolio/tech-stack-rationale.md](./07-portfolio/tech-stack-rationale.md)** | Every dependency, why chosen over alternatives. |
| **[07-portfolio/interview-talking-points.md](./07-portfolio/interview-talking-points.md)** | Anticipated technical questions with thought-out answers. |
| [02-architecture/overview.md](./02-architecture/overview.md) | The architecture diagram. |
| [adr/](./adr/) | Engineering decisions, recorded as ADRs. |

---

## 📁 Full directory map

```
docs/
├── 01-onboarding/        First-time setup + guided codebase tour
├── 02-architecture/      System design (auth, data, caching, sync, etc.)
├── 03-features/          One doc per product domain
├── 04-development/       Conventions, testing, contributing
├── 05-operations/        Deployment, monitoring, runbook, security
├── 06-academic/          Project report + materials for teachers
├── 07-portfolio/         Elevator pitches, interview prep, resume bullets
├── adr/                  Architecture Decision Records
└── assets/               Diagrams, screenshots, ER diagram
```

## Conventions used in these docs

- **★** marks documents written specifically for the college-project audiences (student, teacher, employer). Other docs are reference material that stands on its own.
- **Source-of-truth links** point inward: features described here are anchored in code references, not generic descriptions.
- **No facts duplicated.** Each fact lives in one canonical doc; everything else links to it.

---

> Repo-level docs at the project root: [`../README.md`](../README.md), [`../CLAUDE.md`](../CLAUDE.md), [`../FEATURES.md`](../FEATURES.md), [`../Test.md`](../Test.md), [`../IMPLEMENTATION_STATUS.md`](../IMPLEMENTATION_STATUS.md).
