# AgentSpark — Session A Prompt
## Google Antigravity / AI Code Generation

---

## KONTEKST

Budujesz **AgentSpark** — aplikację SaaS do generowania zespołów AI agentów.
Istnieje już działający monolityczny prototyp (single-file HTML/JS/CSS, ~6000 linii).
Twoim zadaniem jest zbudowanie **produkcyjnego backendu i pełnej aplikacji Next.js**
od zera — przepisując całą logikę biznesową w sposób bezpieczny i skalowalny.

---

## STACK (bez negocjacji)

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 14, App Router |
| Język | TypeScript, strict mode (`"strict": true`) |
| Baza danych | Firebase Firestore |
| Auth | Firebase Auth (nie NextAuth) |
| Styling | Tailwind CSS |
| Walidacja | Zod |
| Rate limiting | In-memory (LRU cache) — Upstash opcjonalnie przez env |
| Logging | pino |
| ZIP export | jszip |
| AI providers | Gemini, OpenAI, Anthropic, Mistral, Groq |
| Deployment | Vercel + Firebase |

---

## WYMAGANIA BEZPIECZEŃSTWA (absolutne, bez wyjątków)

```
❌ ZABRONIONE:
- API keys AI (Gemini/OpenAI/Anthropic) w jakimkolwiek pliku frontendowym
- Bezpośrednie wywołania do zewnętrznych AI API z przeglądarki
- Klucze w localStorage, sessionStorage, window.*

✅ WYMAGANE:
- Wszystkie wywołania AI WYŁĄCZNIE przez /app/api/ai/* (Next.js API Routes)
- Klucze AI tylko w zmiennych środowiskowych serwera (process.env, nie NEXT_PUBLIC_*)
- Firebase Admin SDK tylko po stronie serwera
- Firebase Client SDK tylko do Auth i nasłuchiwania Firestore po stronie klienta
```

---

## STRUKTURA PROJEKTU (wygeneruj dokładnie tę strukturę)

```
agentspark/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── interview/route.ts      # Obsługa tury rozmowy
│   │   │   ├── generate/route.ts       # Generowanie zespołu agentów
│   │   │   ├── refine/route.ts         # Edycja zespołu
│   │   │   └── scoring/route.ts        # Analiza złożoności projektu
│   │   └── projects/
│   │       ├── route.ts                # GET lista, POST nowy
│   │       └── [id]/route.ts           # GET, PUT, DELETE projekt
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/page.tsx              # Lista projektów usera
│   ├── project/
│   │   └── [id]/page.tsx              # Widok projektu
│   ├── layout.tsx
│   └── page.tsx                        # Redirect do /dashboard lub /login
├── components/
│   ├── Chat/
│   │   ├── ChatMessages.tsx
│   │   ├── ChatInput.tsx
│   │   ├── OptionButton.tsx
│   │   └── TypingIndicator.tsx
│   ├── Agents/
│   │   ├── AgentCard.tsx
│   │   ├── AgentGrid.tsx
│   │   └── AgentModal.tsx
│   ├── Interview/
│   │   ├── TopicSelector.tsx
│   │   ├── LevelSelector.tsx
│   │   └── InterviewLayout.tsx
│   ├── Results/
│   │   ├── ResultsActions.tsx
│   │   ├── ScoringPanel.tsx
│   │   └── VersionHistory.tsx
│   ├── Refine/
│   │   ├── RefinePanel.tsx
│   │   └── RefineDiff.tsx
│   └── UI/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Notif.tsx
│       └── TracePanel.tsx
├── lib/
│   ├── ai/
│   │   ├── prompts.ts                  # getSystemPrompt, getRefineSystemPrompt, getScoringPrompt
│   │   └── provider.ts                 # Multi-model routing logic
│   ├── scoring/
│   │   └── index.ts                    # scoreProject() — pure function
│   ├── diff/
│   │   └── index.ts                    # computeAgentDiff() — pure function
│   ├── firebase/
│   │   ├── admin.ts                    # Firebase Admin SDK (server only)
│   │   └── client.ts                   # Firebase Client SDK
│   ├── validators.ts                   # Zod schemas
│   └── cost-tracker.ts                 # Token cost estimation
├── server/
│   ├── ai-service.ts                   # AIService class
│   ├── rate-limit.ts                   # Rate limiter
│   └── logger.ts                       # pino logger
├── types/
│   ├── agent.ts
│   ├── project.ts
│   ├── scoring.ts
│   └── ai.ts
├── middleware.ts                        # Auth guard
├── .env.local.example
├── next.config.ts
└── tailwind.config.ts
```

---

## TYPY DOMENOWE (zaimplementuj dokładnie te typy)

### `/types/agent.ts`
```typescript
export type AgentType = 'technical' | 'business'

export interface Agent {
  id: string           // slug, np. "auth-manager"
  name: string
  emoji: string
  type: AgentType
  role: string         // ROLE_LABEL np. "AUTH_SPECIALIST"
  description: string
  agentMd: string      // Pełny markdown pliku agenta
  skillMd: string      // Pełny markdown pliku skill
}

export interface AgentDiff {
  added: Agent[]
  removed: Agent[]
  changed: {
    id: string
    before: Agent
    after: Agent
  }[]
}

export interface GeneratedTeam {
  agents: Agent[]
  teamConfig: string   // Markdown konfiguracji zespołu
}
```

### `/types/project.ts`
```typescript
export type ProjectLevel = 'iskra' | 'plomien' | 'pozar' | 'inferno'
export type ProjectLang  = 'en' | 'pl'

export interface Project {
  id: string
  userId: string
  name: string
  topic: string
  level: ProjectLevel
  lang: ProjectLang
  modelProvider: string
  modelId: string
  agents: Agent[]
  files: Record<string, string>       // filename → markdown content
  versionHistory: ProjectVersion[]
  createdAt: Date
  updatedAt: Date
}

export interface ProjectVersion {
  id: number
  label: string
  ts: Date
  agents: Agent[]
  files: Record<string, string>
  diff: {
    added: string[]
    removed: string[]
    changed: string[]
  }
  vNum: number
  isOrigin?: boolean
}

export interface RefineHistoryEntry {
  role: 'user' | 'ai'
  text: string
}
```

### `/types/scoring.ts`
```typescript
export interface ScoreMetric {
  label: string
  value: number        // 0-100
  color: string
}

export interface ScoreResult {
  overallScore: number
  overallLabel: string
  metrics: ScoreMetric[]
  risks: string[]
  levelMatch: 'ok' | 'upgrade' | 'downgrade'
  levelSuggestion: string
  suggestedLevel: ProjectLevel
}
```

### `/types/ai.ts`
```typescript
export type ModelProvider = 'gemini' | 'openai' | 'anthropic' | 'mistral' | 'groq'

export interface ModelConfig {
  provider: ModelProvider
  model: string
  endpoint: string
  tag: string
  label: string
}

export interface AICallResult {
  text: string
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
  model: string
  provider: ModelProvider
  durationMs: number
}

export interface AIUsageRecord {
  userId: string
  projectId: string
  model: string
  provider: ModelProvider
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  operation: 'interview' | 'generate' | 'refine' | 'scoring'
  timestamp: Date
}
```

---

## LOGIKA BIZNESOWA — PRZEPISZ DOKŁADNIE

### `/lib/ai/prompts.ts`

Zaimplementuj te trzy funkcje (przepisz z poniższej logiki):

**`getInterviewSystemPrompt(params)`**
Parametry: `{ topic, level, lang, maxQuestions, agentCount, focus }`

Prompt musi:
- Identyfikować się jako "AgentSpark, expert AI system designer"
- Zadawać WYŁĄCZNIE pytania zamknięte z 4 opcjami (A/B/C/D)
- Każda opcja musi mieć `| IMPACT: [max 15 słów]`
- Format pytania: `QUESTION: ...\nA) ... | IMPACT: ...\nB) ...`
- Po `maxQuestions` pytaniach kończyć słowem `[INTERVIEW_COMPLETE]`
- Kalibrować głębokość do poziomu: iskra=proste, plomien=balanced, pozar=tech, inferno=enterprise
- Odpowiadać w języku `lang`

**`getGenerationSystemPrompt(params)`**
Parametry: `{ topic, level, lang, maxQuestions, agentCount, focus }`

Ten sam prompt co interview (kontynuacja tej samej sesji), bo generacja następuje
gdy backend wyśle `[GENERATE]` na końcu historii rozmowy.

JSON odpowiedzi musi mieć strukturę:
```json
{
  "agents": [{
    "id": "slug",
    "name": "...",
    "emoji": "🤖",
    "type": "technical|business",
    "role": "ROLE_LABEL",
    "description": "...",
    "agentMd": "# Agent: Name\n\n## Identity\n...\n\n## Goal\n...\n\n## Personality\n...\n\n## Context\n...",
    "skillMd": "# Skill: Name\n\n## Capabilities\n...\n\n## Instructions\n...\n\n## Tools\n...\n\n## Output Format\n..."
  }],
  "teamConfig": "# Team Configuration\n\n## Architecture\n..."
}
```

Dystrybucja agentów per poziom:
- iskra: 2 technical + 1 business
- plomien: 2 technical + 2 business
- pozar: 3 technical + 2 business
- inferno: 4 technical + 2 business

**`getRefineSystemPrompt(params)`**
Parametry: `{ topic, level, lang, currentAgents }`

Prompt musi:
- Działać w trybie REFINE
- Przyjmować bieżący zespół jako JSON
- Odpowiadać w dwóch częściach:
  1. Krótkie podsumowanie zmian (1-3 zdania) z tagami HTML dla diff:
     - Nowy agent: `<span class="refine-diff-added">+AgentName</span>`
     - Usunięty: `<span class="refine-diff-removed">-AgentName</span>`
     - Zmieniony: `<span class="refine-diff-changed">~AgentName</span>`
  2. Pełny zaktualizowany JSON za znacznikiem `[UPDATED_TEAM]`
- Zwracać ZAWSZE pełną tablicę agentów (nie tylko zmienione)
- agentMd i skillMd muszą być pełne, nie placeholdery

**`getScoringPrompt(params)`**
Parametry: `{ topic, level, lang, interviewHistory }`

Prompt prosi AI o JSON z dokładnie tą strukturą:
```json
{
  "overallScore": 72,
  "overallLabel": "Medium-High Complexity",
  "metrics": [
    { "label": "Technical Complexity", "value": 80, "color": "#7c3aff" },
    { "label": "Business Complexity", "value": 60, "color": "#ff6b35" },
    { "label": "Integration Needs", "value": 70, "color": "#00e5ff" },
    { "label": "Scalability Demand", "value": 55, "color": "#00ff88" }
  ],
  "risks": ["Risk 1 max 12 words", "Risk 2", "Risk 3"],
  "levelMatch": "ok|upgrade|downgrade",
  "levelSuggestion": "...",
  "suggestedLevel": "iskra|plomien|pozar|inferno"
}
```

---

### `/lib/ai/provider.ts`

Zdefiniuj `FALLBACK_CHAINS` i `MODEL_CONFIGS`:

```typescript
// Gemini providers
gemini: [
  { provider:'gemini', model:'gemini-3-flash-preview', label:'Gemini 3 Flash Preview',
    endpoint:'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent' },
  { provider:'gemini', model:'gemini-2.0-flash', label:'Gemini 2.0 Flash', ... },
  { provider:'gemini', model:'gemini-1.5-flash', label:'Gemini 1.5 Flash', ... },
]
// OpenAI
openai: [gpt-4o, gpt-4o-mini, gpt-3.5-turbo]
// Anthropic
anthropic: [claude-sonnet-4-6, claude-haiku-4-5-20251001]
// Mistral
mistral: [mistral-large-latest, mistral-small-latest, open-mistral-nemo]
// Groq
groq: [llama-3.3-70b-versatile, llama-3.1-8b-instant, gemma2-9b-it]
```

Funkcja `isFallbackable(status: number, message: string): boolean`:
- Retry dla statusów: 429, 500, 502, 503, 504, 529
- Retry dla wiadomości zawierających: 'rate limit', 'overloaded', 'capacity', 'timeout', 'quota', 'unavailable'

---

### `/server/ai-service.ts`

```typescript
export class AIService {
  // Wywołuje model z obsługą fallback chain
  async callWithFallback(params: {
    systemPrompt: string
    userMessage: string
    modelTag: string      // 'gemini' | 'openai' | etc.
    userId: string
    projectId: string
    operation: AIUsageRecord['operation']
    maxRetries?: number   // default 2
  }): Promise<AICallResult>

  // Parsuje odpowiedź interview (wykrywa [INTERVIEW_COMPLETE])
  async interview(params: InterviewParams): Promise<InterviewResult>

  // Generuje zespół agentów
  async generate(params: GenerateParams): Promise<GeneratedTeam>

  // Refinuje istniejący zespół, zwraca diff
  async refine(params: RefineParams): Promise<RefineResult>

  // Analizuje złożoność projektu
  async scoring(params: ScoringParams): Promise<ScoreResult>

  // Prywatna metoda: wywołuje konkretny model
  private async callSingleModel(
    modelConfig: ModelConfig,
    systemPrompt: string,
    userMessage: string
  ): Promise<AICallResult>

  // Prywatna metoda: obsługuje Gemini API
  private async callGemini(...): Promise<AICallResult>

  // Prywatna metoda: obsługuje OpenAI-compatible API (openai/mistral/groq)
  private async callOpenAI(...): Promise<AICallResult>

  // Prywatna metoda: obsługuje Anthropic API
  private async callAnthropic(...): Promise<AICallResult>
}
```

Klucze API muszą być pobierane z `process.env`:
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `MISTRAL_API_KEY`
- `GROQ_API_KEY`

---

### `/lib/diff/index.ts`

```typescript
export function computeAgentDiff(before: Agent[], after: Agent[]): AgentDiff {
  // added: agenty w after których nie ma w before (po id)
  // removed: agenty w before których nie ma w after (po id)
  // changed: agenty które są w obu ale mają różne pola
  // Porównuje: name, type, role, description, agentMd, skillMd
}
```

---

### `/lib/scoring/index.ts`

```typescript
// Pure function — zero zależności od UI, zero side effects
export function scoreProject(project: Project): ScoreResult {
  // Jeśli projekt ma już scoring z AI — zwróć go
  // Jeśli nie — oblicz heurystycznie na podstawie:
  // - liczby agentów
  // - poziomu (iskra/plomien/pozar/inferno)
  // - liczby refine iterations
}
```

---

### `/lib/cost-tracker.ts`

```typescript
// Szacunkowe ceny per 1M tokenów (input/output)
const COST_TABLE: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.075, output: 0.30 },
  'gemini-2.0-flash':       { input: 0.10,  output: 0.40 },
  'gpt-4o':                 { input: 5.00,  output: 15.00 },
  'gpt-4o-mini':            { input: 0.15,  output: 0.60 },
  'claude-sonnet-4-6':      { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.25, output: 1.25 },
  'mistral-large-latest':   { input: 2.00,  output: 6.00 },
  'llama-3.3-70b-versatile':{ input: 0.59,  output: 0.79 },
  // fallback dla nieznanych modeli:
  '_default':               { input: 1.00,  output: 3.00 },
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number  // zwraca USD

export async function recordUsage(
  db: FirebaseFirestore.Firestore,
  record: AIUsageRecord
): Promise<void>  // zapisuje do kolekcji 'ai_usage' w Firestore
```

---

## FIRESTORE SCHEMA

### Kolekcja `projects`
```
projects/{projectId}
  userId: string           // uid z Firebase Auth
  name: string
  topic: string
  level: ProjectLevel
  lang: ProjectLang
  modelProvider: string
  modelId: string
  agents: Agent[]          // JSON array
  files: map               // { "agent-x.md": "...", "skill-x.md": "..." }
  versionHistory: array    // max 20 wpisów
  createdAt: timestamp
  updatedAt: timestamp
```

### Kolekcja `ai_usage`
```
ai_usage/{autoId}
  userId: string
  projectId: string
  model: string
  provider: string
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  operation: string
  timestamp: timestamp
```

### Firebase Security Rules (Firestore)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Projekty: tylko właściciel ma dostęp
    match /projects/{projectId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
    // AI usage: tylko backend (Admin SDK) — brak dostępu z klienta
    match /ai_usage/{docId} {
      allow read, write: if false;
    }
  }
}
```

---

## API ROUTES — KONTRAKT

### `POST /api/ai/interview`
```typescript
// Request body (Zod schema):
{
  projectId: string
  topic: string
  level: ProjectLevel
  lang: ProjectLang
  modelTag: string
  chatHistory: { role: 'user' | 'ai', text: string }[]
  userAnswer: string        // ostatnia odpowiedź usera (np. "A")
}

// Response:
{
  reply: string             // odpowiedź AI (następne pytanie lub podsumowanie)
  isComplete: boolean       // true gdy reply zawiera [INTERVIEW_COMPLETE]
  tokens: number | null
}
```

### `POST /api/ai/generate`
```typescript
// Request body:
{
  projectId: string
  topic: string
  level: ProjectLevel
  lang: ProjectLang
  modelTag: string
  chatHistory: { role: 'user' | 'ai', text: string }[]
}

// Response:
{
  agents: Agent[]
  teamConfig: string
  files: Record<string, string>
  tokens: number | null
}
```

### `POST /api/ai/refine`
```typescript
// Request body:
{
  projectId: string
  topic: string
  level: ProjectLevel
  lang: ProjectLang
  modelTag: string
  currentAgents: Agent[]
  refineHistory: { role: 'user' | 'ai', text: string }[]
  request: string           // co user chce zmienić
  action?: string           // 'improve' | 'add' | 'remove' | 'connections'
}

// Response:
{
  summary: string           // HTML string z diff tagami
  agents: Agent[]
  teamConfig: string
  files: Record<string, string>
  diff: AgentDiff
  tokens: number | null
}
```

### `POST /api/ai/scoring`
```typescript
// Request body:
{
  projectId: string
  topic: string
  level: ProjectLevel
  lang: ProjectLang
  modelTag: string
  chatHistory: { role: 'user' | 'ai', text: string }[]
}

// Response: ScoreResult
```

---

## MIDDLEWARE AUTH

### `/middleware.ts`
```typescript
// Chronione ścieżki: /dashboard, /project/*, /api/ai/*, /api/projects/*
// Publiczne: /, /login, /register, /api/health
// Weryfikacja: Firebase ID Token z nagłówka Authorization: Bearer <token>
// lub z cookie 'session'
// Niezalogowany → redirect do /login (dla stron) lub 401 (dla API)
```

---

## RATE LIMITING

### `/server/rate-limit.ts`

Implementuj in-memory rate limiter (LRU):
- Limit dla `/api/ai/*`: **20 requests / minute / userId**
- Limit dla `/api/ai/*`: **200 requests / day / userId**
- Przekroczenie → HTTP 429 z nagłówkiem `Retry-After`
- Jeśli `UPSTASH_REDIS_REST_URL` jest w env → użyj Upstash zamiast in-memory

---

## LOGGER

### `/server/logger.ts`

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // W produkcji: JSON
  // W dev: pretty print
})

// Loguj każde wywołanie AI:
logger.info({
  event: 'ai_call',
  userId,
  projectId,
  model,
  operation,
  durationMs,
  tokens,
  costUsd,
})

// Loguj błędy:
logger.error({ event: 'ai_error', error: err.message, model, attempt })
```

---

## ZMIENNE ŚRODOWISKOWE

Wygeneruj plik `.env.local.example` z WSZYSTKIMI wymaganymi zmiennymi:

```bash
# Firebase Client (NEXT_PUBLIC_ — bezpieczne dla frontu, tylko Firebase Client SDK)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (NIGDY nie NEXT_PUBLIC_ — tylko serwer)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# AI Providers (NIGDY nie NEXT_PUBLIC_)
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
MISTRAL_API_KEY=
GROQ_API_KEY=

# Rate limiting (opcjonalne — jeśli brak, używa in-memory)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=development
```

---

## KOMPONENTY FRONTENDOWE — WYMAGANIA

### Auth pages (`/app/(auth)/login/page.tsx`, `/register/page.tsx`)
- Firebase Auth: `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`
- Po zalogowaniu: redirect `/dashboard`
- Obsługa błędów Firebase Auth (wrong-password, email-already-in-use, itp.)

### Dashboard (`/app/dashboard/page.tsx`)
- Pobiera projekty usera z Firestore (`where('userId', '==', uid)`)
- Karty projektów z: nazwa, temat, liczba agentów, poziom, data
- Przycisk "New Project" → `/project/new`
- Przycisk "Delete" z potwierdzeniem

### Project page (`/app/project/[id]/page.tsx`)
- Maszyna stanów: `topic` → `interview` → `results`
- Topic screen: wybór tematu + poziomu + modelu
- Interview screen: chat z AI (przez `/api/ai/interview`)
- Results screen: siatka agentów + actions

### Wymagania UX (zachowaj z monolitu):
- Animowane pytania z opcjami A/B/C/D + IMPACT notes
- Typing indicator podczas oczekiwania na AI
- Trace panel z Gantt chart wywołań API
- Version history z diff
- Refine panel

---

## POZIOMY PROJEKTU (stałe — nie zmieniaj)

```typescript
export const LEVELS = {
  iskra: {
    id: 'iskra', emoji: '✨', name: 'Iskra',
    tagline: 'Spark — just getting started',
    color: '#00e5ff', questions: 4, agentCount: '2-3',
    focus: 'purpose, users, core features, simple workflow'
  },
  plomien: {
    id: 'plomien', emoji: '🔥', name: 'Płomień',
    tagline: 'Flame — ready to build',
    color: '#ff9500', questions: 5, agentCount: '3-4',
    focus: 'features, integrations, basic tech choices, UX flow'
  },
  pozar: {
    id: 'pozar', emoji: '🌋', name: 'Pożar',
    tagline: 'Fire — serious project',
    color: '#ff3b30', questions: 6, agentCount: '4-5',
    focus: 'architecture, scalability, security, APIs, data models'
  },
  inferno: {
    id: 'inferno', emoji: '💀', name: 'Inferno',
    tagline: 'Inferno — enterprise grade',
    color: '#7c3aff', questions: 7, agentCount: '5-6',
    focus: 'microservices, DevOps, compliance, multi-tenancy, SLAs'
  },
} as const
```

---

## DEFINICJA UKOŃCZENIA SESJI A

Kod jest gotowy gdy:

- [ ] `npx tsc --noEmit` — zero błędów TypeScript
- [ ] `npx eslint .` — zero errorów
- [ ] `npm run build` — build przechodzi bez błędów
- [ ] Brak `NEXT_PUBLIC_*` dla kluczy AI
- [ ] Brak bezpośrednich wywołań AI API w plikach pod `/components/*` lub `/app/(auth)/*`
- [ ] Każdy endpoint `/api/ai/*` sprawdza auth token
- [ ] Rate limiter działa (testuj przez szybkie wywołania)
- [ ] Pino loguje każde wywołanie AI z: userId, model, operation, durationMs, costUsd
- [ ] Firebase Security Rules są wgrane (`firebase deploy --only firestore:rules`)

---

## DODATKOWE INSTRUKCJE DLA GENERATORA

1. **Nie generuj stron z logiem ani markami zewnętrznymi** bez zgody.
2. **Zachowaj nazwę "AgentSpark"** wszędzie.
3. **Zachowaj kolory design tokenów** z monolitu:
   - `--accent: #00e5ff` (cyan)
   - `--accent2: #ff6b35` (orange)
   - `--accent3: #7c3aff` (purple)
   - `--bg: #050810` (dark background)
4. **Tailwind dark mode** — `class` strategy, domyślnie dark.
5. Generuj **pełny, działający kod** — nie placeholdery z komentarzem `// TODO`.
6. Każdy plik musi zaczynać się od komentarza z ścieżką: `// agentspark/server/ai-service.ts`
7. Jeśli plik ma ponad 200 linii — podziel go na mniejsze moduły.
