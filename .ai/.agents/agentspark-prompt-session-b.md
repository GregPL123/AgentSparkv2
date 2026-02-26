# AgentSpark — Session B Prompt
## Google Antigravity / AI Code Generation

---

## KONTEKST SESJI B

Sesja A wygenerowała kompletny fundament:
- Next.js 14 + TypeScript strict + Tailwind
- Firebase Auth + Firestore + Security Rules
- AI Proxy Layer (`/api/ai/*`)
- `AIService` class z multi-model routing, fallback, cost tracking
- Rate limiting, pino logger
- Wszystkie typy domenowe (`/types/*`)
- Zod validators

**Sesja B implementuje:**
1. Zustand store — globalny stan aplikacji
2. Wszystkie komponenty React (`/components/*`)
3. Wszystkie strony (`/app/**`)
4. Integrację frontend ↔ backend przez fetch
5. Canvas graph agentów
6. Pełne UX (animacje, notifs, trace panel, version history, diff)

**Nie generuj ponownie:** Firebase config, API routes, typy, AIService, prompts, validators.
Importuj je — zakładaj że istnieją i są poprawne.

---

## STACK (niezmieniony z Sesji A)

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 14, App Router |
| Język | TypeScript strict |
| State | **Zustand** (`npm install zustand`) |
| Styling | Tailwind CSS |
| Markdown | react-markdown |
| ZIP | jszip |
| Graph | Canvas 2D API (bez zewnętrznej biblioteki) |

---

## ZUSTAND STORE

### `/lib/store.ts`

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ── Typy ekranów ──────────────────────────────────────────
type Screen = 'topic' | 'chat' | 'results' | 'dashboard'

// ── Typy modeli ───────────────────────────────────────────
interface SelectedModel {
  provider: string
  model: string
  tag: string       // 'gemini' | 'openai' | 'anthropic' | 'mistral' | 'groq'
  label: string
}

// ── Trace span ────────────────────────────────────────────
interface TraceSpan {
  id: number
  label: string
  model: string
  provider: string
  startMs: number
  endMs: number | null
  durationMs: number | null
  status: 'pending' | 'ok' | 'fallback' | 'error'
  isFallback: boolean
  tokens: number | null
  error: string | null
}

// ── Główny store ──────────────────────────────────────────
interface AgentSparkStore {
  // Navigation
  screen: Screen
  setScreen: (s: Screen) => void

  // Project identity
  currentProjectId: string | null
  currentTopic: string
  currentLevel: ProjectLevel
  lang: ProjectLang
  setTopic: (t: string) => void
  setLevel: (l: ProjectLevel) => void
  setLang: (l: ProjectLang) => void

  // Model selection
  selectedModel: SelectedModel
  setSelectedModel: (m: SelectedModel) => void

  // Interview state
  chatHistory: { role: 'user' | 'ai'; text: string }[]
  questionCount: number
  maxQuestions: number
  isInterviewing: boolean
  addChatMessage: (role: 'user' | 'ai', text: string) => void
  resetChat: () => void

  // Generated team
  generatedAgents: Agent[]
  generatedFiles: Record<string, string>
  setGeneratedTeam: (agents: Agent[], files: Record<string, string>) => void

  // Version history
  versionHistory: ProjectVersion[]
  addVersion: (v: ProjectVersion) => void
  restoreVersion: (v: ProjectVersion) => void

  // Refine state
  refineHistory: { role: 'user' | 'ai'; text: string }[]
  isRefining: boolean
  selectedRefineAction: string | null
  addRefineMessage: (role: 'user' | 'ai', text: string) => void
  setRefineAction: (a: string | null) => void

  // Scoring
  scoringData: ScoreResult | null
  setScoringData: (d: ScoreResult | null) => void

  // Trace
  traceSpans: TraceSpan[]
  traceSessionStart: number | null
  addTraceSpan: (s: TraceSpan) => void
  updateTraceSpan: (id: number, update: Partial<TraceSpan>) => void
  resetTrace: () => void

  // UI state
  notif: { text: string; isError: boolean } | null
  showNotif: (text: string, isError?: boolean) => void
  clearNotif: () => void

  // Reset all (new project)
  resetAll: () => void
}
```

Zaimplementuj store z `create<AgentSparkStore>()(devtools(...))`.

**Ważne reguły store:**
- `resetAll()` czyści: chatHistory, generatedAgents, generatedFiles, versionHistory, refineHistory, traceSpans, scoringData, questionCount, currentProjectId
- `addVersion()` limituje versionHistory do max 20 wpisów (usuwa najstarsze)
- `showNotif()` automatycznie czyści notif po 3000ms przez `setTimeout`
- `maxQuestions` jest pochodną `currentLevel` — aktualizuj przy `setLevel()`

```typescript
const LEVEL_QUESTIONS: Record<ProjectLevel, number> = {
  iskra: 4, plomien: 5, pozar: 6, inferno: 7
}
```

---

## DESIGN TOKENS — TAILWIND CONFIG

### `/tailwind.config.ts`

```typescript
// Rozszerz theme o kolory AgentSpark:
colors: {
  accent:  '#00e5ff',   // cyan — primary
  accent2: '#ff6b35',   // orange — warnings/business
  accent3: '#7c3aff',   // purple — technical/premium
  bg:      '#050810',   // main background
  surface: '#0a0f1e',   // card background
  surface2:'#0d1428',   // elevated surface
  border:  '#1a2040',   // border color
  muted:   '#4a5568',   // muted text
  text:    '#e2e8f0',   // primary text
}
// Dark mode: class strategy
darkMode: 'class'
```

Domyślnie aplikacja zawsze jest w dark mode — dodaj `className="dark"` do `<html>` w layout.

---

## KOMPONENTY — SPECYFIKACJA PEŁNA

### `UI/Button.tsx`

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
}
```

- `primary`: `bg-accent text-bg font-bold hover:opacity-90`
- `secondary`: `border border-border text-text hover:border-accent`
- `danger`: `border border-accent2 text-accent2 hover:bg-accent2/10`
- `loading`: pokazuje spinner (CSS animate-spin) zamiast dzieci

---

### `UI/Modal.tsx`

```tsx
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string  // default 'max-w-2xl'
}
```

- Overlay: `fixed inset-0 bg-black/70 backdrop-blur-sm z-50`
- Kliknięcie w overlay → `onClose()`
- Animacja wejścia: `animate-[modalIn_0.25s_ease]`
- ESC key → `onClose()`

```css
/* W globals.css */
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
```

---

### `UI/Notif.tsx`

Globalny toast notification — zawsze widoczny gdy `store.notif !== null`.

```tsx
// Pozycja: fixed bottom-6 right-6 z-[100]
// Animacja: slide-up + fade
// Kolory: isError → border-accent2 bg-accent2/10, ok → border-accent bg-accent/10
// Auto-dismiss: store.showNotif() ustawia timeout 3s
```

---

### `UI/TracePanel.tsx`

Gantt chart wywołań API — renderowany pod wynikami.

```tsx
interface TracePanelProps {
  spans: TraceSpan[]
  sessionStart: number | null
  open: boolean
  onToggle: () => void
}
```

**Gantt rendering:**
- Kolumny: `OPERATION (200px) | TIMELINE (1fr) | DURATION (80px) | TOKENS (70px) | STATUS (60px)`
- Każdy span: `phase · detail` — split po ` · ` lub `: `
- Bar fill: `bg-accent` (ok), `bg-amber-500` (fallback), `bg-accent2` (error), animowany pulse (pending)
- Status badge: `OK` (zielony), `↩ FALLBACK` (amber), `ERROR` (czerwony), `…` (pending, pulse)
- Tooltip (HTML title): `Step | Model | Started (+Xs) | Duration | Tokens | Error?`
- Footer: `N calls · Xs total · N tok avg · ↩ N fallback · ⚠ N error · [czas startu]`
- Collapsible — header klikalny, ikona ▼/▲

**Label parsing (identyczny z monolitem):**
```typescript
function parseSpanLabel(raw: string): { phase: string; detail: string } {
  const dotSep   = raw.indexOf(' · ')
  const colonSep = raw.indexOf(': ')
  if (dotSep !== -1)   return { phase: raw.slice(0, dotSep), detail: raw.slice(dotSep + 3) }
  if (colonSep !== -1) return { phase: raw.slice(0, colonSep), detail: raw.slice(colonSep + 2) }
  return { phase: raw, detail: '' }
}
```

---

### `Chat/ChatMessages.tsx`

```tsx
interface ChatMessagesProps {
  messages: { role: 'user' | 'ai'; text: string }[]
}
```

- AI sender: `⚡ AgentSpark`
- User sender: `You` / `Ty` (z lang store)
- AI message: renderuj przez `react-markdown`, sanitizuj XSS (usuń `<script>`, `<iframe>`, `on*=` atrybuty)
- User message: plain text (`<p>` bez markdown)
- Auto-scroll do końca przy nowej wiadomości (`useEffect` + `ref.scrollIntoView`)
- Strip `[INTERVIEW_COMPLETE]` z renderowanych wiadomości

---

### `Chat/OptionButton.tsx`

**Krytyczny komponent** — renderuje opcje A/B/C/D z IMPACT notes.

```tsx
interface OptionButtonProps {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
  impact: string | null
  selected: boolean
  disabled: boolean
  onSelect: (label: string, text: string) => void
}
```

**Parsowanie opcji z odpowiedzi AI:**
```typescript
// W hooku useInterviewOptions(aiReply: string)
export function parseOptions(text: string): ParsedOption[] {
  const matches = [...text.matchAll(/([A-D])\)\s*(.+?)(?=\n[A-D]\)|$)/gs)]
  return matches.map(m => {
    const label = m[1] as 'A' | 'B' | 'C' | 'D'
    const full  = m[2].trim().replace(/\n/g, ' ')
    const [optText, impactRaw] = full.split(/\s*\|\s*IMPACT:\s*/i)
    return { label, text: optText.trim(), impact: impactRaw?.trim() ?? null }
  })
}
```

**Stan po wyborze:**
- Wybrana opcja: `border-accent bg-accent/15 text-accent`
- Pozostałe: `opacity-30`
- IMPACT note wybranej: podświetlona z ikoną `⚡`
- Po wyborze: wszystkie opcje `disabled`

---

### `Chat/TypingIndicator.tsx`

Trzy animowane kropki — identyczne z monolitem.

```tsx
// Trzy div.typing-dot z animacją bounce (delay: 0, 0.15s, 0.3s)
// Nadawca: "⚡ AgentSpark"
// Dodatkowy status label (tekst przekazywany z zewnątrz, np. "⚠ Gemini failed — trying GPT-4o…")
```

---

### `Interview/TopicSelector.tsx`

Ekran wyboru tematu — screen `topic`.

**Sekcje:**
1. **Nagłówek** — `⚡ AgentSpark` + tagline + wybór języka (EN/PL toggle)
2. **Wybór modelu** — `<select>` z grupami per provider:
   ```
   ── Gemini ──
   Gemini 3 Flash Preview (recommended)
   Gemini 2.0 Flash
   ── OpenAI ──
   GPT-4o
   GPT-4o mini
   ── Anthropic ──
   Claude Sonnet 4.6
   ── Mistral ──
   Mistral Large
   ── Groq (Free) ──
   Llama 3.3 70B
   ```
3. **Wybór poziomu** — 4 karty (`iskra/plomien/pozar/inferno`) z emoji, nazwą, tagline, `agentCount agents`
4. **Tematy szablonowe** — grid z filtrowaniem per kategorię:
   ```typescript
   const TOPIC_TEMPLATES = [
     { icon:'🛒', label:'E-Commerce App', sub:'Store, payments, catalog', cat:'business', agents:'Product, Cart, Payments, Recommendations', time:'~45s' },
     { icon:'📊', label:'Analytics Dashboard', sub:'Data, charts, reports', cat:'business', agents:'Data Ingest, Aggregator, Visualizer, Alerts', time:'~40s' },
     { icon:'💼', label:'SaaS Dev Team', sub:'Multi-tenant SaaS product', cat:'business', agents:'Auth, Billing, API, Infra, Onboarding', time:'~50s' },
     { icon:'📈', label:'Marketing Crew', sub:'Campaigns, copy, SEO', cat:'business', agents:'Strategist, Copywriter, SEO, Analytics', time:'~40s' },
     { icon:'🎓', label:'EdTech Platform', sub:'Courses, quizzes, users', cat:'education', agents:'Curriculum, Assessment, Progress, Content', time:'~45s' },
     { icon:'🏥', label:'Healthcare Tool', sub:'Patients, records, booking', cat:'health', agents:'Records, Scheduler, Alerts, Compliance', time:'~50s' },
     { icon:'💬', label:'Chat Application', sub:'Messaging, rooms, media', cat:'social', agents:'Messaging, Presence, Media, Moderation', time:'~40s' },
     { icon:'🎮', label:'Game / Gamification', sub:'Points, levels, rewards', cat:'social', agents:'Game Loop, Rewards, Leaderboard, Events', time:'~40s' },
     { icon:'🤖', label:'AI Automation Bot', sub:'Tasks, scheduling, workflows', cat:'ai', agents:'Orchestrator, Task Runner, Notifier, Logger', time:'~45s' },
     { icon:'🔍', label:'Research Assistant', sub:'Web search, summaries, reports', cat:'ai', agents:'Searcher, Synthesizer, Fact-checker, Writer', time:'~40s' },
     { icon:'🏗', label:'DevOps Pipeline', sub:'CI/CD, infra, monitoring', cat:'dev', agents:'Builder, Deployer, Monitor, Incident', time:'~50s' },
     { icon:'💰', label:'FinTech App', sub:'Payments, wallets, compliance', cat:'business', agents:'Payments, Risk, KYC, Ledger, Reporting', time:'~50s' },
   ]
   const TOPIC_CATEGORIES = ['All', 'Business', 'AI / Automation', 'Dev Tools', 'Education', 'Health', 'Social']
   ```
5. **Custom topic** — `<input>` + przycisk `Start →`
6. **Import** — `📥 Import existing project (.json / .zip)` — otwiera `ImportModal`

**Walidacja przed startem:**
- Temat niepusty (min 3 znaki)
- Poziom wybrany

---

### `Interview/InterviewLayout.tsx`

Layout ekranu chat — dwa panele z grid.

```
grid-cols-[1fr_320px]  →  collapsed: grid-cols-[1fr_0px]
```

**Lewy panel:**
- Header: status dot (animowany pulse) + tytuł `AI Interview` + subtitle + przycisk toggle sidebar `▶/◀`
- `ChatMessages` — scrollable
- `OptionButtons` — pod wiadomościami, pojawiają się po każdym pytaniu AI

**Prawy panel (sidebar) — 3 sidebar-cards:**
1. **PROGRESS** — kroki (Interview → Scoring → Team):
   ```
   ✓ 1. Interview     ← done
   ● 2. Scoring       ← active
     3. Team          ← pending
   ```
2. **PROJECT** — temat + poziom + model badge
3. **INTERVIEW** — licznik pytań `Q3 / 6`, progress bar

**Collapsible sidebar:** stan w `localStorage('agentspark-sidebar-collapsed')`

---

### `Agents/AgentCard.tsx`

```tsx
interface AgentCardProps {
  agent: Agent
  onClick: (agent: Agent) => void
  isNew?: boolean       // animacja highlight po generate/refine
  isChanged?: boolean   // amber border po refine
}
```

**Wygląd:**
- Gradient top border: technical = `#7c3aff`, business = `#ff6b35`
- Emoji (duże, center) + nazwa + role badge + description (3 linie, clamp)
- Type badge: `⚙ Technical` / `💼 Business`
- Hover: podświetlenie + `cursor-pointer`
- `isNew`: border `border-accent` + `ring-2 ring-accent/30` + animacja
- `isChanged`: border `border-amber-500`

---

### `Agents/AgentModal.tsx`

Modal otwierany po kliknięciu karty agenta.

**Zakładki:**
1. **Agent** — renderowany `agentMd` przez `react-markdown`
2. **Skill** — renderowany `skillMd` przez `react-markdown`

**Akcje w footerze:**
- `⬇ Download .md` — pobiera `agent-{id}.md`
- `📋 Copy` — kopiuje do schowka

---

### `Agents/AgentGraph.tsx`

Canvas 2D — wizualizacja połączeń między agentami.

**Layout agentów na canvasie:**
```typescript
// Technical agents — lewa strona (łuk pionowy)
// Business agents — prawa strona (łuk pionowy)
// Centrum — wolne (tytuł projektu)

// Technical nodes: kolor #7c3aff, ikona ⚙
// Business nodes: kolor #ff6b35, ikona 💼

// Krawędzie między technical agents: kolor #7c3aff, label 'pipeline'
// Krawędzie business→technical: kolor rgba(255,107,53,0.4), label 'context'
```

**Node rendering:**
- Koło (r=28) wypełnione + border
- Emoji (16px) + nazwa agenta (10px, pod kołem, clamp do 12 znaków)

**Edge rendering:**
- Curved Bezier line
- Label na środku krawędzi (8px, kolor muted)

**Interakcja:**
- Hover na node: podświetlenie + `cursor-pointer`
- Klik na node: wywołuje `onAgentClick(agent.id)`

**Physics (opcjonalne, jeśli czas pozwala):**
- Force-directed layout: odpychanie między nodes, przyciąganie przez krawędzie
- requestAnimationFrame loop

**Jeśli canvas zbyt skomplikowany:** użyj prostego SVG z `foreignObject` dla labelek.

---

### `Results/ResultsActions.tsx`

Pasek akcji nad wynikami.

```tsx
// Przyciski (w kolejności):
// ⬇ Download ZIP | 📥 Import | 🔗 Share | 🚀 Export Framework
// 📄 Preview Docs | ✏ Refine Team | 📋 Instructions
// 💾 Save Project | 📋 System Prompts | ↩ Start Over
```

**Download ZIP** — generuje ZIP przez `jszip`:
- Wszystkie pliki z `generatedFiles`
- Plus `agentspark.json` (manifest z pełnym stanem — do re-importu)

**agentspark.json w ZIPie:**
```json
{
  "v": 2,
  "source": "agentspark",
  "topic": "...",
  "level": "...",
  "lang": "...",
  "agents": [...],
  "files": {...},
  "ts": 1234567890
}
```

---

### `Results/ScoringPanel.tsx`

```tsx
interface ScoringPanelProps {
  data: ScoreResult
}
```

**Wygląd:**
- Overall score: duża liczba (np. `72`) + label + kolor per zakres:
  - `< 40`: green (#00ff88)
  - `40-70`: orange (#ff9500)
  - `> 70`: red (#ff3b30)
- Metryki: 4 progress bary z kolorami z `data.metrics[].color`
- Ryzyku: lista bulleted (max 3)
- Level match badge: `✓ OK` / `⬆ Upgrade recommended` / `⬇ Could simplify`

---

### `Results/VersionHistory.tsx`

```tsx
interface VersionHistoryProps {
  versions: ProjectVersion[]
  onRestore: (v: ProjectVersion) => void
}
```

**Wygląd (collapsible panel):**
- Timeline — wiersze z: numer wersji, label, timestamp relatywny (`2m ago`)
- Diff badges: `+AgentName` (zielony), `-AgentName` (czerwony), `~AgentName` (amber)
- Aktualna wersja: tag `CURRENT`
- Przycisk `Restore` per wersja (nie przy aktualnej)

---

### `Refine/RefinePanel.tsx`

Panel boczny dla trybu refine.

```tsx
// Akcje szybkiego wyboru (przyciski):
const REFINE_ACTIONS = [
  { id: 'improve', emoji: '⚡', label: 'Improve team' },
  { id: 'add',     emoji: '➕', label: 'Add an agent' },
  { id: 'remove',  emoji: '🗑', label: 'Remove an agent' },
  { id: 'connections', emoji: '🔗', label: 'Change connections' },
]
```

- Historia refine: `ChatMessages` z historią `refineHistory`
- Input + przycisk Send
- Licznik refinements: `Refinement 2 of 5` (max 5)
- Submit wywołuje `POST /api/ai/refine`

---

### `Refine/RefineDiff.tsx`

Wyświetla diff po każdym refine.

```tsx
interface RefineDiffProps {
  summary: string    // HTML string z tagami refine-diff-added/removed/changed
}
// Renderuj przez dangerouslySetInnerHTML — summary pochodzi z backendu
// (nie od usera), więc jest bezpieczny
// Style dla tagów:
// .refine-diff-added   { color: #00ff88 }
// .refine-diff-removed { color: #ff3b30; text-decoration: line-through }
// .refine-diff-changed { color: #ffcc00 }
```

---

## STRONY — SPECYFIKACJA

### `/app/layout.tsx`

```tsx
// html: lang="en" className="dark"
// Importuje: globals.css, Notif component (globalny)
// Providers: AuthProvider (Firebase), ZustandProvider (jeśli potrzebny)
// Font: 'Space Grotesk' (primary) + 'Space Mono' (monospace) z next/font/google
```

---

### `/app/page.tsx`

```tsx
// Sprawdza stan auth:
// - zalogowany → redirect /dashboard
// - niezalogowany → redirect /login
// Używa: useAuthState z firebase/auth (lub własny hook useAuth)
```

---

### `/app/(auth)/login/page.tsx`

```tsx
// Firebase signInWithEmailAndPassword
// Link do /register
// Obsługa błędów:
const FIREBASE_ERRORS: Record<string, string> = {
  'auth/wrong-password':       'Incorrect password.',
  'auth/user-not-found':       'No account with this email.',
  'auth/invalid-email':        'Invalid email address.',
  'auth/too-many-requests':    'Too many attempts. Try again later.',
  'auth/network-request-failed': 'Network error. Check connection.',
}
// Wygląd: ciemne tło bg-bg, karta surface, logo ⚡ AgentSpark
```

---

### `/app/(auth)/register/page.tsx`

```tsx
// Firebase createUserWithEmailAndPassword
// Po rejestracji: automatyczny login + redirect /dashboard
// Walidacja: email format + hasło min 8 znaków
```

---

### `/app/dashboard/page.tsx`

```tsx
// Guard: redirect /login jeśli niezalogowany
// Pobiera projekty: Firestore query where('userId', '==', uid) orderBy('updatedAt', 'desc')
// Wyświetla: ProjectCard grid
// Empty state: "No projects yet. Create your first team →"
// Header: logo + email usera + przycisk Logout + "New Project" button
```

**ProjectCard w dashboardzie:**
```
┌─────────────────────────────┐
│ 🌋 Pożar    [topic name]   │
│ ⚡ 4 agents · 3 versions    │
│ Updated 2h ago              │
│ [Open]  [Fork]  [Delete]   │
└─────────────────────────────┘
```

---

### `/app/project/[id]/page.tsx`

Główna strona projektu — maszyna stanów.

```tsx
// Stan pobierany z: params.id
// Jeśli id === 'new' → nowy projekt (screen: 'topic')
// Jeśli id to istniejące ID → ładuje z Firestore → screen: 'results'

// Maszyna stanów:
type ProjectScreen = 'topic' | 'interview' | 'results'

// Renderuje warunkowo:
// screen === 'topic'     → <TopicSelector />
// screen === 'interview' → <InterviewLayout />
// screen === 'results'   → <ResultsView />
```

**ResultsView** (sub-komponent lub osobny plik):
```
Header: "⚡ AgentSpark" + badge modelu + przycisk "My Projects"
ResultsActions
AgentGraph (canvas)
AgentGrid (siatka kart)
ScoringPanel (collapsible)
TracePanel (collapsible)
VersionHistory (collapsible)
RefinePanel (boczny, toggle)
```

---

## HOOKS

### `/hooks/useInterview.ts`

```typescript
export function useInterview() {
  const store = useAgentSparkStore()

  // Wysyła pierwszą wiadomość (start interview)
  async function startInterview(): Promise<void>

  // Wysyła odpowiedź usera i pobiera następne pytanie
  async function sendAnswer(label: string, text: string): Promise<void>

  // Triggeruje generate gdy interview complete
  async function triggerGenerate(): Promise<void>

  // Wewnętrznie: fetch POST /api/ai/interview
  // Wewnętrznie: fetch POST /api/ai/generate
  // Wewnętrznie: fetch POST /api/ai/scoring (równolegle z generate)
  // Aktualizuje store: chatHistory, questionCount, generatedAgents, scoringData

  return { startInterview, sendAnswer, isLoading: store.isInterviewing }
}
```

**Ważne:** scoring uruchamiaj równolegle z generate (`Promise.allSettled`), nie sekwencyjnie.

---

### `/hooks/useRefine.ts`

```typescript
export function useRefine() {
  async function submitRefine(request: string): Promise<void>
  // fetch POST /api/ai/refine
  // Po odpowiedzi: aktualizuje store.generatedAgents + addVersion()
  // computeAgentDiff() z lib/diff
  // showNotif po sukcesie
  return { submitRefine, isRefining: store.isRefining }
}
```

---

### `/hooks/useFirestoreProject.ts`

```typescript
export function useFirestoreProject() {
  async function saveProject(): Promise<string>  // returns projectId
  async function loadProject(id: string): Promise<void>
  async function deleteProject(id: string): Promise<void>
  async function forkProject(id: string): Promise<string>  // returns new id
  // Wszystkie operacje przez /api/projects/* — NIE bezpośrednio Firestore z klienta
  // (Firestore Security Rules wymagają autentykacji — API route używa Admin SDK)
}
```

---

### `/hooks/useZipExport.ts`

```typescript
export function useZipExport() {
  async function downloadZip(): Promise<void> {
    // jszip: dodaj wszystkie generatedFiles
    // Dodaj agentspark.json (manifest)
    // Pobierz przez URL.createObjectURL
  }

  async function downloadDocZip(): Promise<void> {
    // Tylko pliki .md (bez agentspark.json)
  }
}
```

---

### `/hooks/useImport.ts`

```typescript
export function useImport() {
  // Parsuje .json lub .zip
  // .json: szuka pola agents[] — obsługuje zarówno share payload jak i project record
  // .zip: szuka agentspark.json → fallback: skanuje inne .json → fallback: rekonstruuje z .md
  // Po parsowaniu: wypełnia store (setGeneratedTeam, setTopic, setLevel, itp.)
  // Pokazuje preview przed potwierdzeniem (stan lokalny komponentu)

  async function processFile(file: File): Promise<ImportPreview | null>
  async function confirmImport(preview: ImportPreview): Promise<void>
}
```

---

## FETCH — ZASADA AUTORYZACJI

Każdy fetch do `/api/*` musi wysyłać Firebase ID Token:

```typescript
// /lib/api-client.ts
export async function apiFetch(
  path: string,
  body: unknown
): Promise<Response> {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')

  const token = await user.getIdToken()

  return fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
}
```

Używaj `apiFetch` we wszystkich hookach. Nigdy gołego `fetch` do `/api/*`.

---

## TRACE INTEGRATION (frontend ↔ backend)

API routes zwracają trace info w response body:

```typescript
// Każda response z /api/ai/* zawiera:
{
  // ... główna odpowiedź ...
  _trace: {
    model: string
    provider: string
    label: string          // np. "🎤 Interview · Q3 of 6"
    durationMs: number
    tokens: number | null
    isFallback: boolean
    error: string | null
  }
}
```

Frontend po każdym fetch dodaje span do store:
```typescript
const data = await res.json()
if (data._trace) {
  store.addTraceSpan({
    id: Date.now(),
    ...data._trace,
    startMs: Date.now() - data._trace.durationMs,
    endMs: Date.now(),
    status: data._trace.error ? 'error' : data._trace.isFallback ? 'fallback' : 'ok',
  })
}
```

---

## MODALS

Zaimplementuj jako osobne komponenty używające `UI/Modal`:

### `ShareModal.tsx`
- Tryby: `🌍 Public link` / `🔒 Password protected (AES-256-GCM)`
- Generowanie URL: `window.location.origin + /project/[id]?share=<base64>`
- Payload szyfrowany przez Web Crypto API (`AES-GCM`, `PBKDF2`, identycznie jak w monolicie)
- Kopiowanie do schowka + feedback `✓ Copied!`
- Info: rozmiar KB, liczba agentów

### `ImportModal.tsx`
- Drag & drop zone + browse button
- Preview po parsowaniu: topic, level, liczba agentów, lista z emoji
- Checkbox `Save as project`
- Obsługa błędów inline

### `MarkdownPreviewModal.tsx`
- Przegląd plików .md z `generatedFiles`
- Lista plików po lewej, preview po prawej (przez `react-markdown`)
- Download pojedynczego pliku

### `SystemPromptsModal.tsx`
- 3 zakładki: Interview | Generate | Refine
- Textarea read-only z pełnym promptem
- Copy + Download .txt

### `FrameworkExportModal.tsx`
- 4 zakładki: `🤝 CrewAI` | `🔗 LangGraph` | `🔄 AutoGen` | inne
- Kod Python generowany na froncie z danych agentów
- Syntax highlighting (prism.js lub prosty `<pre><code>`)
- Copy + Download .py

---

## GLOBALS.CSS

```css
/* W /app/globals.css */

@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0a0f1e; }
::-webkit-scrollbar-thumb { background: #1a2040; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #00e5ff; }

/* Animations */
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes notifIn {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* Diff tags (renderowane przez dangerouslySetInnerHTML z backendu) */
.refine-diff-added   { color: #00ff88; font-weight: 600; }
.refine-diff-removed { color: #ff3b30; text-decoration: line-through; }
.refine-diff-changed { color: #ffcc00; }

/* react-markdown — prose styling w dark mode */
.agent-markdown h1,h2,h3 { color: #e2e8f0; border-bottom: 1px solid #1a2040; padding-bottom: 0.3em; }
.agent-markdown code { background: #0d1428; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.85em; }
.agent-markdown pre  { background: #0d1428; padding: 1rem; border-radius: 8px; overflow-x: auto; }
.agent-markdown ul   { list-style: disc; padding-left: 1.5rem; }
.agent-markdown p    { line-height: 1.7; color: #a0aec0; }
```

---

## PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "firebase": "^10.12.0",
    "firebase-admin": "^12.2.0",
    "zustand": "^4.5.0",
    "zod": "^3.23.0",
    "pino": "^9.2.0",
    "react-markdown": "^9.0.0",
    "jszip": "^3.10.0",
    "lru-cache": "^10.2.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "^14.2.0",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

---

## DEFINICJA UKOŃCZENIA SESJI B

- [ ] `npm run build` — zero błędów
- [ ] `npx tsc --noEmit` — zero błędów TypeScript
- [ ] Ekran topic → interview → results działa end-to-end
- [ ] Opcje A/B/C/D z IMPACT notes renderują się poprawnie
- [ ] Trace panel wyświetla spany po każdym wywołaniu AI
- [ ] Version history zapisuje i umożliwia restore
- [ ] Refine zmienia agentów i pokazuje diff
- [ ] Download ZIP generuje plik z agentspark.json manifest
- [ ] Dashboard pokazuje listę projektów z Firestore
- [ ] Brak `console.error` w normalnym przepływie
- [ ] Brak `any` w TypeScript (strict mode)
- [ ] Wszystkie fetche do `/api/*` mają Firebase ID Token w headerze

---

## DODATKOWE INSTRUKCJE

1. **Nie regeneruj** plików z Sesji A. Importuj z ich ścieżek.
2. **Każdy plik** zaczyna się od komentarza: `// agentspark/components/Chat/ChatMessages.tsx`
3. **Brak hardkodowanych stringów** — użyj obiektu `TRANSLATIONS` dla EN/PL:
   ```typescript
   // /lib/i18n.ts
   export const T = {
     en: { interview: 'AI Interview', you: 'You', agentspark: '⚡ AgentSpark', ... },
     pl: { interview: 'Wywiad AI',    you: 'Ty',  agentspark: '⚡ AgentSpark', ... },
   } as const
   // Użyj: const t = T[store.lang]
   ```
4. **Canvas graph** — użyj `useRef<HTMLCanvasElement>` + `useEffect` dla animacji.
5. **Collapsible panels** (Trace, VersionHistory, ScoringPanel) — stan lokalny `useState(false)`, nie w store.
6. **Suspense boundaries** — dodaj `<Suspense fallback={<LoadingSpinner />}>` dla stron ładujących dane z Firestore.
7. **Error boundaries** — dodaj `error.tsx` dla `/app/project/[id]/` obsługujący błędy ładowania.
8. Jeśli plik ma ponad 200 linii — podziel na mniejsze komponenty.
