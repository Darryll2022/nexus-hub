# 🛠️ Nexus-Hub Dev Log

A living document tracking learnings, decisions, and progress across our build journey.

---

## How to Use This Log

- **Decisions** — architectural choices and the reasoning behind them
- **Learnings** — things discovered during the build (bugs, patterns, gotchas)
- **Stack Notes** — version-specific notes, upgrade tips, gotchas
- **Next Steps** — what's coming up

Add entries in reverse chronological order (newest at the top of each section).

---

## 📅 May 7, 2026 — Phase 3: React Native Mobile App

### What was built
- Monorepo restructure: `packages/core`, `packages/mobile` (web stays in root for now)
- `packages/core` — shared TypeScript logic: types, agent definitions, LLM call (`callLLM`), message builders
- `packages/mobile` — Expo app (SDK 51) with Expo Router for navigation
- Two screens: `app/index.tsx` (chat + agent selector) and `app/settings.tsx` (API key config)
- Mobile `useAgentChat` hook uses `AsyncStorage` instead of `localStorage` — same interface as web
- Dark theme throughout (#0f0f0f base), agent accent colours carried over from web
- Babel `module-resolver` maps `@nexus-hub/core` → `../../core/src/index.ts`

### Architecture decisions
- **Monorepo with workspaces** — shared core avoids duplication. Web and mobile stay in sync on types, agent definitions, and LLM logic.
- **No shared UI components** — web uses Tailwind/React DOM, mobile uses React Native StyleSheet. Only logic is shared, not markup.
- **`callLLM` in core** — the fetch logic is platform-agnostic (both environments support `fetch`). Centralised in core so any bug fix applies everywhere.
- **AsyncStorage over MMKV** — simpler setup, no native build required. Can migrate to MMKV later for perf if needed.
- **Expo Router** — file-based routing mirrors the web mental model. Easier to extend with new screens.

### How to run mobile
```bash
cd packages/mobile
npx expo install  # installs dependencies
npx expo start    # scan QR with Expo Go app
```

### Learnings
- **`@nexus-hub/core` alias** — Babel `module-resolver` + `tsconfig.json` paths must both point to the same file. Expo Metro bundler uses Babel; tsc uses tsconfig.
- **AsyncStorage is async** — hydration must happen in a `useEffect`, not `useState` initializer. Added `isReady` flag to prevent render before data loads.
- **`callLLM` is fetch-based** — works in RN without polyfills (RN ships with fetch since 0.60).
- **Lucide icons not in core** — lucide-react is web-only. Mobile uses emoji/text icons for now. Will add `@expo/vector-icons` in next iteration.

---

## 📅 May 5, 2026 — Automated GitHub PR Review System (Phase 2) ✅

### What was built
- Backend function `reviewPullRequests` (Deno/TypeScript)
- Scans all 11 repos for open PRs every 5 minutes via scheduled automation
- `ReviewedPR` entity tracks processed PRs (dedup key: `repo + pr_number`)
- Fetches PR diff → calls Groq LLM with Atlas system prompt → posts review as GitHub comment
- Diffs >12KB truncated to stay within context limits
- GitHub and Groq tokens stored as encrypted secrets in `.agents/.env`

### Architecture decisions
- **Polling over webhooks** — GitHub connector doesn't support webhooks, so scheduled poller is the pragmatic choice.
- **Single Atlas agent** — watches all repos. Sub-agents per-repo are overkill for a solo dev. Will revisit when team scales.
- **Service role for DB writes** — `base44.asServiceRole.entities.*` bypasses RLS.
- **Diff truncation** — 12KB limit keeps LLM context reasonable and latency low.

### Atlas system prompt
- Focus: correctness, performance, security, maintainability, SOLID principles
- Structured output: Summary, Critical Issues, Improvements, Positives
- Temperature 0.3 for deterministic, consistent reviews

---

## 📅 May 5, 2026 — Bundle Optimisation (Code Splitting) ✅

### What was built
- Wrapped `react-syntax-highlighter` in `React.lazy()` + `Suspense`
- Main app bundle: **953KB → 149KB (84% reduction)**

### Learnings
- **`React.lazy` + dynamic `import()`** — only works with default exports.
- **Module-level cache for async data** — kick off import at module load time, cache in `let`.
- **Vite code splitting** — dynamic `import()` inside `React.lazy` automatically creates separate chunks.

---

## 📅 May 5, 2026 — Custom Agent Builder ✅

### What was built
- `AgentBuilderModal.tsx` — modal form with name, role, icon picker, model select, system prompt
- Custom agents persisted to `localStorage` under `nexus-hub:custom-agents`
- Auto-switches to new agent immediately after creation

---

## 📅 May 4, 2026 — Persistent Chat History ✅

### What was built
- History hydrated from `localStorage` on app load
- `Message.timestamp` serialized as ISO string and deserialized back to `Date` on load

---

## 📅 May 3, 2026 — Markdown Rendering + Syntax Highlighting ✅

### Packages added
- `react-markdown@10.1.0`, `remark-gfm@4.0.1`
- `react-syntax-highlighter@16.1.1`

---

## 📅 May 3, 2026 — Project Kickoff ✅

### Stack
- TypeScript + React 18 + Vite + Tailwind (web)
- TypeScript + React Native 0.74 + Expo SDK 51 (mobile)
- Shared core: `@nexus-hub/core`

### Agents

| Agent | Role | Model | Provider |
|-------|------|-------|----------|
| Blocker Buster | DevOps & Unblocking | `llama-3.1-8b-instant` | Groq |
| Atlas | Senior Code Reviewer | `llama-3.3-70b-versatile` | Groq |
| Lyra | Deep Researcher | `llama-3.3-70b-instruct:free` | OpenRouter |

---

## 🔧 Stack Notes

### Monorepo
- `packages/core` — shared types + LLM logic (no platform dependencies)
- `packages/mobile` — Expo app, imports from core via Babel alias
- Root `package.json` uses npm workspaces

### Expo / React Native
- Expo SDK 51, React Native 0.74
- Expo Router for file-based navigation
- AsyncStorage for persistence (drop-in replacement for localStorage)
- `babel-plugin-module-resolver` for `@nexus-hub/core` alias
- `tsconfig.json` `paths` must match Babel alias

### Vite (web)
- `VITE_` prefix for browser-exposed env vars
- Dynamic `import()` = automatic code splitting

---

## 🗺️ Roadmap

### Phase 1 — Webapp ✅ COMPLETE
- [x] Scaffold, markdown, syntax highlighting, persistent history, custom agent builder, 84% bundle reduction

### Phase 2 — Agents & Automation ✅ COMPLETE
- [x] Atlas automated PR reviews via GitHub polling
- [x] ReviewedPR entity for deduplication
- [x] Groq + GitHub tokens stored as secrets

### Phase 3 — Mobile ✅ IN PROGRESS
- [x] Monorepo restructure with shared core
- [x] Expo app scaffold (SDK 51, Expo Router)
- [x] Chat screen with agent selector
- [x] Settings screen for API keys
- [x] AsyncStorage persistence
- [ ] Vector icons (`@expo/vector-icons`)
- [ ] Markdown rendering in mobile chat
- [ ] Agent builder screen (mobile)
- [ ] Push notifications for Atlas PR reviews

### Phase 4 — Scale
- [ ] Sub-agent orchestration (when team grows)
- [ ] Slack integration for Atlas review alerts
- [ ] Backend sync (replace localStorage with cloud DB)
