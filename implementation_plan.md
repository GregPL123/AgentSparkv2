# Implementation Plan — AgentSpark Production Backend & Next.js App

Build a production-ready SaaS application for generating AI agent teams, based on the requirements from [agentspark-prompt-session-a.md](file:///c:/Antigravity/AgentSparkv2/.ai/.agents/agentspark-prompt-session-a.md), [agentspark-prompt-session-b.md](file:///c:/Antigravity/AgentSparkv2/.ai/.agents/agentspark-prompt-session-b.md), and [agentspark-prompt-session-c.md](file:///c:/Antigravity/AgentSparkv2/.ai/.agents/agentspark-prompt-session-c.md). The project involves moving from a single-file prototype to a modular Next.js 14 architecture with a Firebase backend and strict security protocols.

## User Review Required

> [!IMPORTANT]
> **Security Isolation**: This plan strictly adheres to the rule that NO AI API keys or direct AI calls are allowed on the frontend. All AI logic is encapsulated in server-side API routes. No `NEXT_PUBLIC_*` prefix on AI or Admin keys. No `firebase-admin` import outside `server/` and `app/api/`.
> **Firebase Setup**: The user must provide Firebase project credentials (Project ID, API Key, etc.) for both Client and Admin SDKs in the `.env.local` file before running the project.
> **Middleware scope**: `/api/health` is intentionally **public** (no auth required) to support uptime monitoring. All other `/api/*`, `/dashboard`, and `/project/*` routes require a valid Firebase ID Token.

## Proposed Changes

### 1. Project Setup & Infrastructure

Initialization of the modern stack and security foundations.

#### [NEW] [.env.local.example](file:///c:/Antigravity/AgentSparkv2/.env.local.example)
Define all required environment variables for Firebase (Client/Admin), AI Providers (Gemini, OpenAI, Anthropic, Mistral, Groq), Rate Limiting (Upstash optional), and app config.

#### [NEW] [next.config.ts](file:///c:/Antigravity/AgentSparkv2/next.config.ts)
Configure Next.js with security headers (CSP, HSTS, X-Frame-Options), `serverExternalPackages` for pino and firebase-admin, and `maxDuration` overrides. Disable `poweredByHeader`.

#### [NEW] [tailwind.config.ts](file:///c:/Antigravity/AgentSparkv2/tailwind.config.ts)
Extend theme with AgentSpark design tokens: `accent` (#00e5ff), `accent2` (#ff6b35), `accent3` (#7c3aff), `bg` (#050810), `surface` (#0a0f1e), `surface2` (#0d1428), `border` (#1a2040), `muted` (#4a5568), `text` (#e2e8f0). Dark mode strategy: `class`.

---

### 2. Core Types & Utilities

Establishing the domain model and shared logic.

#### [NEW] [types/agent.ts](file:///c:/Antigravity/AgentSparkv2/types/agent.ts)
Define `Agent`, `AgentType`, `AgentDiff`, and `GeneratedTeam` interfaces.

#### [NEW] [types/project.ts](file:///c:/Antigravity/AgentSparkv2/types/project.ts)
Define `Project`, `ProjectLevel`, `ProjectLang`, `ProjectVersion`, and `RefineHistoryEntry`.

#### [NEW] [types/scoring.ts](file:///c:/Antigravity/AgentSparkv2/types/scoring.ts)
Define `ScoreMetric`, `ScoreResult`, and `levelMatch` enum values.

#### [NEW] [types/ai.ts](file:///c:/Antigravity/AgentSparkv2/types/ai.ts)
Define `ModelProvider`, `ModelConfig`, `AICallResult`, and `AIUsageRecord`.

#### [NEW] [lib/validators.ts](file:///c:/Antigravity/AgentSparkv2/lib/validators.ts)
Zod schemas for all API request bodies: `InterviewRequestSchema`, `GenerateRequestSchema`, `RefineRequestSchema`, `ScoringRequestSchema`, `ProjectCreateSchema`, `ProjectUpdateSchema`.

#### [NEW] [lib/store.ts](file:///c:/Antigravity/AgentSparkv2/lib/store.ts)
Global application state using `zustand` with `devtools` middleware. State includes: screen navigation (`topic | chat | results | dashboard`), project identity, chat and refine history, generated agents and files, version history (max 20), trace spans, scoring data, and notification queue (auto-clear after 3s). `maxQuestions` is derived from `currentLevel` on `setLevel()`.

#### [NEW] [lib/i18n.ts](file:///c:/Antigravity/AgentSparkv2/lib/i18n.ts)
Translation object `T` with `en` and `pl` keys for all UI strings. Used as `const t = T[store.lang]` in components — no hardcoded strings.

#### [NEW] [lib/api-client.ts](file:///c:/Antigravity/AgentSparkv2/lib/api-client.ts)
`apiFetch(path, body)` — wraps all `fetch` calls to `/api/*`. Retrieves Firebase ID Token from `auth.currentUser.getIdToken()` and attaches it as `Authorization: Bearer <token>`. All hooks must use this wrapper exclusively — never raw `fetch` to API routes.

#### [NEW] [lib/cost-tracker.ts](file:///c:/Antigravity/AgentSparkv2/lib/cost-tracker.ts)
`estimateCost(model, inputTokens, outputTokens): number` — pure function with price table per model (USD per 1M tokens). `recordUsage(db, record)` — writes to Firestore `ai_usage` collection via Admin SDK (server-only).

#### [NEW] [lib/diff/index.ts](file:///c:/Antigravity/AgentSparkv2/lib/diff/index.ts)
`computeAgentDiff(before, after): AgentDiff` — pure function. Detects added (in after, not in before by id), removed (in before, not in after), and changed (same id, different fields: name, type, role, description, agentMd, skillMd).

#### [NEW] [lib/scoring/index.ts](file:///c:/Antigravity/AgentSparkv2/lib/scoring/index.ts)
`scoreProject(project): ScoreResult` — pure heuristic function. Score is derived from level, agent count, and version history depth. Used as fallback when AI scoring is unavailable.

#### [NEW] [lib/frameworks/index.ts](file:///c:/Antigravity/AgentSparkv2/lib/frameworks/index.ts)
Pure function Python code generators (zero external imports, fully testable): `generateCrewAI`, `generateLangGraph`, `generateAutoGen`, `generateSwarm`. Exported as `FRAMEWORKS` array with `id`, `label`, `badge`, `logo`, `pip`, `url`, and `generate(topic, agents)` fields.

#### [NEW] [server/logger.ts](file:///c:/Antigravity/AgentSparkv2/server/logger.ts)
Configure `pino` for structured JSON logging in production and pretty-print in development. Log every AI call with: `event`, `userId`, `projectId`, `model`, `operation`, `durationMs`, `tokens`, `costUsd`. Log errors with: `event`, `error`, `model`, `attempt`.

#### [NEW] [server/rate-limit.ts](file:///c:/Antigravity/AgentSparkv2/server/rate-limit.ts)
`checkRateLimit(userId?: string, ip?: string): { allowed: boolean, retryAfter?: number }`. Limits per authenticated user (20 req/min, 200 req/day). **IP fallback**: if `userId` is not available (token expired mid-request, edge case before full auth), falls back to rate-limiting by IP from `x-forwarded-for` header. In-memory LRU implementation. If `UPSTASH_REDIS_REST_URL` is present in env, switches to Upstash automatically. Exceeding limit returns HTTP 429 with `Retry-After` header.

> [!WARNING]
> **Serverless limitation**: On Vercel, each serverless function instance has its own isolated memory. The in-memory LRU counter is **not shared across instances** — a user hitting different instances in the same minute gets separate counters, effectively multiplying the limit by the number of active instances. This is acceptable for early stage (low traffic, few concurrent instances). **At scale, Upstash Redis is mandatory** — set `UPSTASH_REDIS_REST_URL` in production env before launching publicly. Document this limitation prominently in README.

---

### 3. AI Service Layer

The engine for agent generation and project analysis.

#### [NEW] [lib/ai/prompts.ts](file:///c:/Antigravity/AgentSparkv2/lib/ai/prompts.ts)
Four prompt generator functions:
- `getInterviewSystemPrompt(params)` — closed questions only, 4 options (A/B/C/D) with `| IMPACT:` suffix per option, calibrated depth per level, ends with `[INTERVIEW_COMPLETE]` after maxQuestions.
- `getGenerationSystemPrompt(params)` — same system prompt as interview (continuation of same session); JSON-only response with full `agents[]` + `teamConfig`.
- `getRefineSystemPrompt(params)` — REFINE mode; returns HTML diff summary + `[UPDATED_TEAM]` + full updated JSON.
- `getScoringPrompt(params)` — returns JSON with `overallScore`, `metrics[4]`, `risks[3]`, `levelMatch`, `suggestedLevel`.

#### [NEW] [lib/ai/provider.ts](file:///c:/Antigravity/AgentSparkv2/lib/ai/provider.ts)
`FALLBACK_CHAINS` per provider tag (gemini, openai, anthropic, mistral, groq) with ordered model configs (best → fastest). `isFallbackable(status, message): boolean` — retries on 429, 500, 502, 503, 504, 529 and on messages containing: 'rate limit', 'overloaded', 'capacity', 'timeout', 'quota', 'unavailable'. Does **not** retry on 401, 403, or 400 (non-transient errors).

#### [NEW] [server/ai-service.ts](file:///c:/Antigravity/AgentSparkv2/server/ai-service.ts)
`AIService` class with:
- `callWithFallback(params)` — iterates fallback chain, logs each attempt, records usage to Firestore on success.
- `interview(params)` — wraps callWithFallback, detects `[INTERVIEW_COMPLETE]` in response.
- `generate(params)` — wraps callWithFallback, parses JSON team from response.
- `refine(params)` — wraps callWithFallback, splits response at `[UPDATED_TEAM]`, parses diff.
- `scoring(params)` — wraps callWithFallback, parses scoring JSON.
- Private `callGemini`, `callOpenAI`, `callAnthropic` methods. Keys read exclusively from `process.env` (server-side only).

---

### 4. Backend (API Routes & Middleware)

Secure endpoints and database integration.

#### [NEW] [middleware.ts](file:///c:/Antigravity/AgentSparkv2/middleware.ts)
Runs in **Edge runtime** — `firebase-admin` is **not available here and must not be imported**. Middleware performs a lightweight presence check only: verifies that the `session` cookie or `Authorization` header exists and is non-empty. It does **not** cryptographically verify the token — that is the responsibility of each API route handler (Node runtime, Admin SDK available).

Protected paths: `/dashboard`, `/project/:path*`, `/api/ai/:path*`, `/api/projects/:path*`, `/api/usage`. **Public paths (no auth check):** `/`, `/login`, `/register`, `/api/health`, `/offline`, `/sw.js`, `/manifest.json`.

Unauthenticated page requests → redirect `/login`. Unauthenticated API requests → HTTP 401 JSON `{ error: "Unauthorized" }`.

> [!IMPORTANT]
> Full token verification (signature, expiry, audience) happens in each API route via `verifyFirebaseToken()` from `lib/firebase/admin.ts` (Node runtime only). Middleware is a gate, not a verifier.

#### [NEW] [app/api/ai/interview/route.ts](file:///c:/Antigravity/AgentSparkv2/app/api/ai/interview/route.ts)
`POST` — validates `InterviewRequestSchema`, calls `AIService.interview()`, returns `{ reply, isComplete, tokens, _trace }`.

#### [NEW] [app/api/ai/generate/route.ts](file:///c:/Antigravity/AgentSparkv2/app/api/ai/generate/route.ts)
`POST` — validates `GenerateRequestSchema`, calls `AIService.generate()`, returns `{ agents, teamConfig, files, tokens, _trace }`.

#### [NEW] [app/api/ai/refine/route.ts](file:///c:/Antigravity/AgentSparkv2/app/api/ai/refine/route.ts)
`POST` — validates `RefineRequestSchema`, calls `AIService.refine()`, computes `AgentDiff` via `computeAgentDiff()`, returns `{ summary, agents, teamConfig, files, diff, tokens, _trace }`.

#### [NEW] [app/api/ai/scoring/route.ts](file:///c:/Antigravity/AgentSparkv2/app/api/ai/scoring/route.ts)
`POST` — validates `ScoringRequestSchema`, calls `AIService.scoring()`, returns `ScoreResult` + `_trace`.

#### [NEW] [app/api/projects/route.ts](file:///c:/Antigravity/AgentSparkv2/app/api/projects/route.ts)
- `GET` — returns all projects for authenticated user, ordered by `updatedAt desc`.
- `POST` — creates new project document with `userId` from verified token.

#### [NEW] [app/api/projects/[id]/route.ts](file:///c:/Antigravity/AgentSparkv2/app/api/projects/%5Bid%5D/route.ts)
- `GET` — returns single project; validates `userId == request.auth.uid`.
- `PUT` — updates project (agents, files, versionHistory, updatedAt); validates ownership.
- `DELETE` — deletes project; validates ownership.

#### [NEW] [app/api/usage/route.ts](file:///c:/Antigravity/AgentSparkv2/app/api/usage/route.ts)
`GET` — queries `ai_usage` collection for `userId == currentUser.uid` and `timestamp >= 30 days ago`. Returns raw records + aggregated summary: `{ totalCost, totalTokens, totalCalls, byModel, byOperation }`.

> [!IMPORTANT]
> This route **must use `adminDb` (Admin SDK) for the Firestore query**, not the Firebase Client SDK. Firestore Security Rules set `ai_usage` to deny-all for client reads — only Admin SDK bypasses rules. Any accidental use of the client SDK here will silently return empty results, not an error. Import from `lib/firebase/admin.ts` only.

#### [NEW] [app/api/health/route.ts](file:///c:/Antigravity/AgentSparkv2/app/api/health/route.ts)
`GET` — **no auth required**. Checks Firestore connectivity via `adminDb.collection('_health').doc('ping').get()` — **read only, not write** (avoids unnecessary write costs; document non-existence treated as healthy). Checks presence of AI keys in `process.env` — does not make live AI calls. Returns `{ status: "ok" | "degraded", checks, ts }` with HTTP 200 if all ok, 207 if degraded.

---

### 5. Frontend (Pages)

#### [NEW] [app/layout.tsx](file:///c:/Antigravity/AgentSparkv2/app/layout.tsx)
Root layout. `<html lang="en" className="dark">`. Imports Space Grotesk (primary) and Space Mono (monospace) via `next/font/google`. Renders global `<Notif />` and `<PWAManager />`. Links `manifest.json` and sets `theme-color` meta tag.

#### [NEW] [app/page.tsx](file:///c:/Antigravity/AgentSparkv2/app/page.tsx)
Checks Firebase auth state: authenticated → redirect `/dashboard`, unauthenticated → redirect `/login`.

#### [NEW] [app/(auth)/login/page.tsx](file:///c:/Antigravity/AgentSparkv2/app/(auth)/login/page.tsx)
`signInWithEmailAndPassword`. Maps Firebase error codes to user-friendly messages (wrong-password, user-not-found, too-many-requests, network-request-failed). Redirect to `/dashboard` on success.

#### [NEW] [app/(auth)/register/page.tsx](file:///c:/Antigravity/AgentSparkv2/app/(auth)/register/page.tsx)
`createUserWithEmailAndPassword`. Validates email format and password min 8 chars. Auto-redirect to `/dashboard` after registration.

#### [NEW] [app/dashboard/page.tsx](file:///c:/Antigravity/AgentSparkv2/app/dashboard/page.tsx)
Auth-guarded. Fetches projects via `GET /api/projects`. Displays project cards (topic, level emoji, agent count, version count, relative time). Actions: Open, Fork, Delete (with confirmation). Empty state with "Create your first team →" CTA.

#### [NEW] [app/project/[id]/page.tsx](file:///c:/Antigravity/AgentSparkv2/app/project/%5Bid%5D/page.tsx)
Main project wizard. State machine: `topic → interview → results`. `id === 'new'` starts fresh; existing ID loads from Firestore and jumps to results. Results view includes: `ResultsActions`, `AgentGraph` (canvas), `AgentGrid`, `ScoringPanel`, `TracePanel`, `VersionHistory`, `RefinePanel` (toggle sidebar).

#### [NEW] [app/usage/page.tsx](file:///c:/Antigravity/AgentSparkv2/app/usage/page.tsx)
Auth-guarded. Fetches from `GET /api/usage`. Displays: total cost, total tokens, total calls summary cards; cost breakdown by model (CSS progress bars, no chart library); cost breakdown by operation; paginated list of recent calls (model, operation, tokens, cost, timestamp).

#### [NEW] [app/offline/page.tsx](file:///c:/Antigravity/AgentSparkv2/app/offline/page.tsx)
Shown by Service Worker when offline and no cached page available. "Try again" button calls `window.location.reload()`.

#### [NEW] [app/loading.tsx](file:///c:/Antigravity/AgentSparkv2/app/loading.tsx)
Global loading skeleton — pulsing `⚡` icon centered on dark background.

#### [NEW] [app/project/[id]/loading.tsx](file:///c:/Antigravity/AgentSparkv2/app/project/%5Bid%5D/loading.tsx)
Project-specific loading — spinner with "Loading project…".

#### [NEW] [app/project/[id]/error.tsx](file:///c:/Antigravity/AgentSparkv2/app/project/%5Bid%5D/error.tsx)
Error boundary for project page. Shows error message, "Try again" (`reset()`) and "My Projects" (`/dashboard`) buttons. Logs error to console.

#### [NEW] [app/not-found.tsx](file:///c:/Antigravity/AgentSparkv2/app/not-found.tsx)
404 page — large `404` in accent color, "Back to AgentSpark" link.

---

### 6. UI Components & Visualizations

#### [NEW] [components/UI/](file:///c:/Antigravity/AgentSparkv2/components/UI/)
- **Button.tsx**: Variants: `primary`, `secondary`, `danger`, `ghost`. Sizes: `sm`, `md`, `lg`. Loading state (spinner replaces children). Disabled state.
- **Modal.tsx**: Overlay with `backdrop-blur-sm`. Click-outside and ESC key close. `animate-[modalIn_0.25s_ease]` entrance. Configurable `maxWidth`.
- **Notif.tsx**: Fixed `bottom-6 right-6`. Error variant (accent2 border) and success variant (accent border). Auto-dismissed after 3s by store.
- **TracePanel.tsx**: Collapsible Gantt chart. Columns: OPERATION (200px) | TIMELINE (1fr) | DURATION (80px) | TOKENS (70px) | STATUS (60px). Label parsed into `phase · detail`. Bars colored by status. Hover tooltip with full metadata. Footer shows totals: calls, duration, avg/call, fallback count, error count, session start time.
- **PWAManager.tsx**: Registers `/sw.js`, handles `beforeinstallprompt` (install banner), `updatefound` (update toast), online/offline events (offline bar at top).

#### [NEW] [components/Chat/](file:///c:/Antigravity/AgentSparkv2/components/Chat/)
- **ChatMessages.tsx**: Renders `role: 'ai'` via `react-markdown` with XSS sanitization (strips `<script>`, `<iframe>`, `on*=` attributes). Renders `role: 'user'` as plain text. Auto-scrolls on new message. Strips `[INTERVIEW_COMPLETE]` from display.
- **OptionButton.tsx**: Parses A/B/C/D options and IMPACT notes via `parseOptions(text)` regex. Selected option gets accent styling; others fade to 30% opacity. All disabled after selection. IMPACT note of selected option highlighted with `⚡` icon.
- **TypingIndicator.tsx**: Three bouncing dots (staggered 0 / 0.15s / 0.3s delay). Displays optional status text (e.g. "↩ Gemini failed — trying GPT-4o…").

#### [NEW] [components/Agents/](file:///c:/Antigravity/AgentSparkv2/components/Agents/)
- **AgentCard.tsx**: Role-based top border gradient (technical: accent3 #7c3aff, business: accent2 #ff6b35). Large emoji, name, role badge, 3-line clamped description. `isNew` prop: accent ring animation. `isChanged` prop: amber border.
- **AgentModal.tsx**: Two tabs — Agent (renders `agentMd` via react-markdown) and Skill (renders `skillMd`). Footer: Download .md button, Copy to clipboard button.
- **AgentGraph.tsx**: Canvas 2D with **deterministic arc layout** (no physics in v1 — physics is a known source of bugs and deferred to a future iteration). Technical agents laid out on left arc, business agents on right arc, positions calculated once on mount. Technical nodes: color #7c3aff. Business nodes: color #ff6b35. Pipeline edges between technical agents (solid). Context edges from business to technical (semi-transparent). Node hover highlight (re-render on mousemove). Click fires `onAgentClick(id)`. No `requestAnimationFrame` loop — canvas is redrawn only on agent data change or hover state change.

> [!NOTE]
> Force-directed / physics layout is explicitly **out of scope for v1**. The deterministic arc layout is predictable and bug-free. Physics can be added as an enhancement after the core app is stable.

#### [NEW] [components/Interview/](file:///c:/Antigravity/AgentSparkv2/components/Interview/)
- **TopicSelector.tsx**: Language toggle (EN/PL). Model selector grouped by provider (Gemini, OpenAI, Anthropic, Mistral, Groq). Level cards (iskra / plomień / pożar / inferno) with emoji, tagline, agent count. Topic template grid (12 templates, filterable by category). Custom topic input. Import button → `ImportModal`.
- **InterviewLayout.tsx**: Two-column grid (`1fr 320px`), collapses to `1fr 0px`. Left: `ChatMessages` + `OptionButtons`. Right sidebar (collapsible, state in localStorage): progress steps, project info card, question counter + progress bar.

#### [NEW] [components/Results/](file:///c:/Antigravity/AgentSparkv2/components/Results/)
- **ResultsActions.tsx**: Action bar with: Download ZIP, Import, Share, Export Framework, Preview Docs, Refine Team, Instructions, Save Project, System Prompts, Start Over. Each opens relevant modal or triggers hook action.
- **ScoringPanel.tsx**: Collapsible. Overall score with color-coded number (green/orange/red by range). Four metric progress bars with colors from AI response. Risks list. Level match badge (✓ OK / ⬆ Upgrade / ⬇ Downgrade).
- **VersionHistory.tsx**: Collapsible timeline. Per-version: number, label, relative timestamp, diff badges (+added / -removed / ~changed). CURRENT tag on active version. Restore button on non-current versions.

#### [NEW] [components/Refine/](file:///c:/Antigravity/AgentSparkv2/components/Refine/)
- **RefinePanel.tsx**: Quick action buttons (Improve / Add agent / Remove agent / Change connections). Refine chat history via `ChatMessages`. Text input + Send button. Refinement counter (e.g. "Refinement 2 of 5"). Max 5 refinements enforced client-side.
- **RefineDiff.tsx**: Renders `summary` HTML string via `dangerouslySetInnerHTML`. CSS classes: `.refine-diff-added` (green), `.refine-diff-removed` (red strikethrough), `.refine-diff-changed` (amber).

#### [NEW] [components/Modals/](file:///c:/Antigravity/AgentSparkv2/components/Modals/)
- **ShareModal.tsx**: Two modes — public link (no encryption) and password-protected (AES-256-GCM via Web Crypto API, PBKDF2 key derivation 200k iterations, gzip compression). Shows payload size in KB and agent count. Copy-to-clipboard with "✓ Copied!" feedback.

> [!WARNING]
> **Known edge cases requiring careful implementation:** (1) URL length — base64-encoded gzip+ciphertext for large teams (5–6 agents with full agentMd/skillMd) can approach or exceed browser URL limits (~2000 chars for some clients). Implement a size check before generating the link and warn the user if payload exceeds 1800 chars. (2) Wrong password — decryption fails silently with a `DOMException`; must catch and show a retry prompt, never crash. (3) Gzip on binary data — use `CompressionStream('gzip')` for encryption output, not text gzip; order matters: `JSON → encrypt → gzip → base64url`. Expect 1–2 follow-up fixes in this component.
- **ImportModal.tsx**: Drag-and-drop zone + browse button. Accepts `.json` and `.zip`. Preview panel: topic, level, agent count, agent list with type badges. "Save as project" checkbox (default checked). Inline error display. Three-strategy ZIP parsing: agentspark.json manifest → other .json → reconstruct from .md files.
- **MarkdownPreviewModal.tsx**: Split view — file list left, `react-markdown` preview right. Per-file download button.
- **SystemPromptsModal.tsx**: Three tabs — Interview, Generate, Refine. Read-only textarea. Copy and Download .txt per tab.
- **FrameworkExportModal.tsx**: Four tabs — CrewAI, LangGraph, AutoGen, Swarm. Renders Python code from `FRAMEWORKS[].generate(topic, agents)`. Syntax-highlighted `<pre><code>`. Copy and Download .py per tab. Shows `pip install` command.

---

### 7. Frontend Logic (Hooks)

#### [NEW] [hooks/useInterview.ts](file:///c:/Antigravity/AgentSparkv2/hooks/useInterview.ts)
`startInterview()` — sends first message to `/api/ai/interview`. `sendAnswer(label, text)` — appends user message, calls `/api/ai/interview`, appends AI reply, renders options. Detects `isComplete: true` → calls `triggerGenerate()`. `triggerGenerate()` — calls `/api/ai/generate` and `/api/ai/scoring` **in parallel via `Promise.allSettled`** (not `Promise.all` — one failure must not block the other). On generate success: updates store with agents, files, adds origin version to versionHistory. On scoring result: if fulfilled → store `scoringData` from API; if rejected → **fall back to `scoreProject(project)` pure function** (never leave scoring empty, never block UI). Each response adds `_trace` span to store.

> [!IMPORTANT]
> The `Promise.allSettled` + `scoreProject()` fallback pattern is mandatory. Generate succeeding while scoring fails is a likely production scenario (different model, different timeout). The UI must never wait on scoring to show the agent grid.

#### [NEW] [hooks/useRefine.ts](file:///c:/Antigravity/AgentSparkv2/hooks/useRefine.ts)
`submitRefine(request)` — calls `/api/ai/refine`, receives `{ summary, agents, files, diff }`. Calls `computeAgentDiff()` for version snapshot. Calls `addVersion()` on store. Calls `showNotif()` on success. Adds `_trace` span to store.

#### [NEW] [hooks/useFirestoreProject.ts](file:///c:/Antigravity/AgentSparkv2/hooks/useFirestoreProject.ts)
All operations via `apiFetch` (not direct Firestore client):
- `saveProject()` → `POST /api/projects` or `PUT /api/projects/[id]`. Returns `projectId`.
- `loadProject(id)` → `GET /api/projects/[id]`. Populates store.
- `deleteProject(id)` → `DELETE /api/projects/[id]`.
- `forkProject(id)` → `GET /api/projects/[id]` + `POST /api/projects` with cloned data + " (fork)" name suffix. Returns new `projectId`.

#### [NEW] [hooks/useZipExport.ts](file:///c:/Antigravity/AgentSparkv2/hooks/useZipExport.ts)
`downloadZip()` — builds ZIP via `jszip` containing all `generatedFiles` + `agentspark.json` manifest (`v: 2, source, topic, level, lang, agents, files, ts`). Triggers browser download. `downloadDocZip()` — same but only `.md` files (no manifest).

#### [NEW] [hooks/useImport.ts](file:///c:/Antigravity/AgentSparkv2/hooks/useImport.ts)
`processFile(file)` — routes to JSON or ZIP parser. Returns `ImportPreview | null`. `confirmImport(preview)` — populates store, optionally saves to Firestore. ZIP parsing: strategy 1 agentspark.json manifest → strategy 2 any .json with `agents[]` → strategy 3 reconstruct from `agent-*.md` (parse name from `# Agent:`, role from `**Role:**`, description from `## Goal`).

---

### 8. Production, Reliability & DevOps

#### [NEW] [Testing Suite](file:///c:/Antigravity/AgentSparkv2/tests/)
- **vitest.config.ts**: Vitest with `@vitejs/plugin-react`, `happy-dom` environment. Coverage thresholds split by layer — `lib/**` and `server/**`: lines 80, functions 80, branches 70 (these are pure functions and services — highest ROI for testing); `hooks/**`: lines 60, functions 60 (harder to test, mocks required); `components/**`: lines 40, functions 40 (UI tests are expensive and brittle — keep light). Path alias `@/` mapped to project root.
- **tests/setup.ts**: Mocks for Firebase client, Firebase admin, pino logger, and global `fetch`.
- **Unit tests** (`tests/lib/`): `diff.test.ts`, `scoring.test.ts`, `cost-tracker.test.ts`, `prompts.test.ts`.
- **Server tests** (`tests/server/`): `rate-limit.test.ts` (uses `vi.useFakeTimers`), `ai-service.test.ts` (mocks fetch, tests fallback and non-retry on 401).
- **Component test** (`tests/components/`): `OptionButton.test.tsx` — renders label, text, impact; fires onSelect; disabled when disabled; applies selected styling.
- **Hook test** (`tests/hooks/`): `useInterview.test.ts` — mocks `apiFetch`, verifies store updates.

#### [NEW] [PWA Support](file:///c:/Antigravity/AgentSparkv2/public/)
- **sw.js**: Plain JavaScript (not TypeScript). Strategies: `NEVER_CACHE` list for all AI/Firebase/auth URLs and POST requests; cache-first for fonts; stale-while-revalidate for app shell. Handles `skipWaiting` message for update flow.
- **manifest.json**: `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color: "#00e5ff"`, `background_color: "#050810"`, icons 192×192 and 512×512.
- **offline.html**: Static HTML fallback (no Next.js dependency). "Try again" reload button.
- **PWAManager.tsx**: Registers `/sw.js`, install banner (`beforeinstallprompt`), update toast (`updatefound`), offline bar (`online`/`offline` events).

#### [NEW] [DevOps & CI/CD](file:///c:/Antigravity/AgentSparkv2/.github/workflows/)
- **ci.yml**: Four parallel jobs — `typecheck` (`tsc --noEmit`), `lint` (`eslint`), `test` (`vitest --coverage`), `build` (only runs after all three pass). Firebase Client keys injected as GitHub secrets for build job. AI keys set to `test-key` placeholder (not needed at build time).
- **deploy.yml**: Triggered on push to `main`. Deploys Firestore rules and indexes via `firebase deploy --only firestore:rules,firestore:indexes`. Vercel deployment handled automatically via Vercel GitHub integration.
- **vercel.json**: `maxDuration: 60` for `/app/api/ai/**`. Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection) on all `/api/` routes. `Referrer-Policy` on all routes.
- **firestore.rules**: Owner-only access for `projects` collection (read/write requires `request.auth.uid == resource.data.userId`). Deny-all for `ai_usage` collection (written only by Admin SDK server-side).
- **firestore.indexes.json**: Compound index 1: `projects` — `userId ASC` + `updatedAt DESC`. Compound index 2: `ai_usage` — `userId ASC` + `timestamp DESC`.

#### [NEW] [AI Framework Exports](file:///c:/Antigravity/AgentSparkv2/lib/frameworks/index.ts)
Pure function generators — zero side effects, zero UI imports, fully unit-testable. Each function takes `(topic: string, agents: Agent[])` and returns a Python string:
- **CrewAI**: `Agent` + `Task` + `Crew` with sequential process. `allow_delegation=True` for business agents.
- **LangGraph**: `TypedDict` state, node functions per agent, `StateGraph` with sequential edges, compiled `app`.
- **AutoGen**: `AssistantAgent` per AI agent + `UserProxyAgent` + `GroupChat` + `GroupChatManager`.
- **Swarm**: `Agent` per agent with `instructions`, first agent has `transfer_to_*` function.

#### [NEW] [Usage & Observability](file:///c:/Antigravity/AgentSparkv2/app/usage/)
- **Usage Dashboard** (`app/usage/page.tsx`): Auth-guarded. Fetches `GET /api/usage`. Summary cards (total cost, tokens, calls). CSS progress bar breakdown by model and by operation (no chart library). Paginated recent calls table.
- **Health Endpoint** (`app/api/health/route.ts`): Public (no auth). Reads `_health/ping` doc from Firestore (**no write** — avoids billing cost; non-existence = healthy). Checks AI key presence. Returns `{ status, checks, ts }` — HTTP 200 if all ok, 207 if degraded.

#### [NEW] [Developer Tooling](file:///c:/Antigravity/AgentSparkv2/scripts/)
- **scripts/seed.ts**: Creates a sample project in Firestore for local development. Run via `npx ts-node scripts/seed.ts` after populating `.env.local`. Requires replacing `REPLACE_WITH_YOUR_UID` with actual Firebase user UID.

---

## Verification Plan

### Automated (run in order)

```bash
npm run typecheck       # npx tsc --noEmit — zero errors required
npm run lint            # npx eslint . — zero warnings required
npm run test:coverage   # vitest --coverage — >80% lines/functions for lib/** and server/**; >60% for hooks/**; UI components excluded from hard threshold
npm run build           # Next.js production build — must complete without errors
```

### Security Isolation Checks

```bash
# No firebase-admin outside server/ and app/api/
grep -r "firebase-admin" components/ app/ --include="*.ts" --include="*.tsx" | grep -v "app/api/"

# No AI keys exposed to client
grep -r "NEXT_PUBLIC_GEMINI\|NEXT_PUBLIC_OPENAI\|NEXT_PUBLIC_ANTHROPIC" . --include="*.ts" --include="*.tsx" --include="*.env*"

# No raw process.env (non-NEXT_PUBLIC) in component files
grep -r "process\.env\." components/ --include="*.ts" --include="*.tsx"
```

### Manual End-to-End Walkthrough

1. **Login/Register**: Create account → redirect to `/dashboard`.
2. **New project**: Click "New Project" → `/project/new` → topic screen loads.
3. **Topic selection**: Pick template, select level (Pożar), select model (Gemini 3 Flash), click Start.
4. **Interview**: Verify A/B/C/D questions appear with IMPACT notes. Verify typing indicator during AI response. Complete all 6 questions.
5. **Generation**: Verify agent grid appears with correct technical/business split. Verify Trace panel shows Gantt chart with all API calls.
6. **Scoring**: Verify scoring panel appears with 4 metrics and risk list.
7. **Refine**: Open Refine panel → request "Add a security agent" → verify diff badge shows `+SecurityAgent`. Check version history updates.
8. **Download ZIP**: Click Download ZIP → verify `agentspark.json` manifest is present inside.
9. **Re-import**: Start Over → Import → drag the downloaded ZIP → verify preview shows correct topic and agent count → confirm → verify agents restore.
10. **Dashboard**: Save project → navigate to `/dashboard` → verify project card appears with correct agent count.
11. **Usage**: Navigate to `/usage` → verify AI calls from this session appear with cost estimates.
12. **Health**: `curl https://your-domain.com/api/health` → verify `{ "status": "ok" }` without auth token.
13. **Offline**: Disable network in DevTools → reload → verify offline bar appears and `/offline` page is served from cache.
