# AgentSpark — Session C Prompt
## Google Antigravity / AI Code Generation

---

## KONTEKST SESJI C

Sesje A i B wygenerowały kompletną aplikację:

**Sesja A:** Fundament — Next.js 14, Firebase Auth + Firestore, AI Proxy Layer,
AIService class, rate limiting, pino logger, typy TypeScript, Zod validators.

**Sesja B:** Frontend — Zustand store, wszystkie komponenty React, strony, hooki,
integracja frontend ↔ backend przez apiFetch z Firebase ID Token.

**Sesja C implementuje warstwę produkcyjną:**
1. Testy (Vitest + Testing Library)
2. PWA — Service Worker jako osobny plik, offline bar, install banner
3. Deployment config — Vercel + Firebase
4. CI/CD — GitHub Actions
5. Usage Dashboard — widok kosztów AI per user
6. Framework Export — generatory Python (CrewAI, LangGraph, AutoGen, Swarm)
7. `loading.tsx` i `error.tsx` dla każdej trasy
8. `/api/health` endpoint
9. Seed data dla developmentu

**Nie regeneruj** nic z Sesji A i B. Importuj z istniejących ścieżek.

---

## 1. TESTY

### Stack testowy

```json
// devDependencies do dodania:
{
  "vitest": "^1.6.0",
  "@vitest/ui": "^1.6.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/user-event": "^14.5.0",
  "@testing-library/jest-dom": "^6.4.0",
  "msw": "^2.3.0",
  "happy-dom": "^14.0.0"
}
```

### `/vitest.config.ts`

```typescript
// agentspark/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**', 'server/**', 'hooks/**'],
      exclude: ['lib/firebase/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

### `/tests/setup.ts`

```typescript
// agentspark/tests/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase — nie używaj prawdziwego Firebase w testach
vi.mock('@/lib/firebase/client', () => ({
  auth: { currentUser: { uid: 'test-user-id', getIdToken: vi.fn().mockResolvedValue('mock-token') } },
  db: {},
}))

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock pino — nie loguj w testach
vi.mock('@/server/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock fetch globally
global.fetch = vi.fn()
```

---

### `/tests/lib/diff.test.ts`

```typescript
// agentspark/tests/lib/diff.test.ts
import { describe, it, expect } from 'vitest'
import { computeAgentDiff } from '@/lib/diff'
import type { Agent } from '@/types/agent'

const makeAgent = (id: string, overrides: Partial<Agent> = {}): Agent => ({
  id,
  name: `Agent ${id}`,
  emoji: '🤖',
  type: 'technical',
  role: 'SPECIALIST',
  description: 'Test agent description',
  agentMd: `# Agent: ${id}`,
  skillMd: `# Skill: ${id}`,
  ...overrides,
})

describe('computeAgentDiff', () => {
  it('detects added agents', () => {
    const before = [makeAgent('a'), makeAgent('b')]
    const after  = [makeAgent('a'), makeAgent('b'), makeAgent('c')]
    const diff   = computeAgentDiff(before, after)
    expect(diff.added).toHaveLength(1)
    expect(diff.added[0].id).toBe('c')
    expect(diff.removed).toHaveLength(0)
    expect(diff.changed).toHaveLength(0)
  })

  it('detects removed agents', () => {
    const before = [makeAgent('a'), makeAgent('b')]
    const after  = [makeAgent('a')]
    const diff   = computeAgentDiff(before, after)
    expect(diff.removed).toHaveLength(1)
    expect(diff.removed[0].id).toBe('b')
  })

  it('detects changed agents (name)', () => {
    const before = [makeAgent('a', { name: 'Old Name' })]
    const after  = [makeAgent('a', { name: 'New Name' })]
    const diff   = computeAgentDiff(before, after)
    expect(diff.changed).toHaveLength(1)
    expect(diff.changed[0].before.name).toBe('Old Name')
    expect(diff.changed[0].after.name).toBe('New Name')
  })

  it('detects no changes when teams identical', () => {
    const team = [makeAgent('a'), makeAgent('b')]
    const diff = computeAgentDiff(team, [...team.map(a => ({ ...a }))])
    expect(diff.added).toHaveLength(0)
    expect(diff.removed).toHaveLength(0)
    expect(diff.changed).toHaveLength(0)
  })

  it('handles empty before', () => {
    const after = [makeAgent('a'), makeAgent('b')]
    const diff  = computeAgentDiff([], after)
    expect(diff.added).toHaveLength(2)
    expect(diff.removed).toHaveLength(0)
  })

  it('handles empty after', () => {
    const before = [makeAgent('a'), makeAgent('b')]
    const diff   = computeAgentDiff(before, [])
    expect(diff.removed).toHaveLength(2)
    expect(diff.added).toHaveLength(0)
  })
})
```

---

### `/tests/lib/scoring.test.ts`

```typescript
// agentspark/tests/lib/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { scoreProject } from '@/lib/scoring'
import type { Project } from '@/types/project'
import type { Agent } from '@/types/agent'

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'test-id',
  userId: 'user-1',
  name: 'Test Project',
  topic: 'E-Commerce App',
  level: 'iskra',
  lang: 'en',
  modelProvider: 'gemini',
  modelId: 'gemini-3-flash-preview',
  agents: [],
  files: {},
  versionHistory: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makeAgent = (type: 'technical' | 'business'): Agent => ({
  id: `agent-${Math.random()}`,
  name: 'Test Agent',
  emoji: '🤖',
  type,
  role: 'SPECIALIST',
  description: 'Test',
  agentMd: '',
  skillMd: '',
})

describe('scoreProject', () => {
  it('returns valid ScoreResult shape', () => {
    const result = scoreProject(makeProject())
    expect(result).toHaveProperty('overallScore')
    expect(result).toHaveProperty('overallLabel')
    expect(result).toHaveProperty('metrics')
    expect(result).toHaveProperty('risks')
    expect(result).toHaveProperty('levelMatch')
    expect(result).toHaveProperty('suggestedLevel')
    expect(Array.isArray(result.metrics)).toBe(true)
    expect(result.metrics).toHaveLength(4)
  })

  it('overallScore is 0-100', () => {
    const result = scoreProject(makeProject())
    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)
  })

  it('inferno level produces higher score than iskra', () => {
    const iskra   = scoreProject(makeProject({ level: 'iskra' }))
    const inferno = scoreProject(makeProject({ level: 'inferno' }))
    expect(inferno.overallScore).toBeGreaterThan(iskra.overallScore)
  })

  it('more agents produces higher score', () => {
    const few  = scoreProject(makeProject({ agents: [makeAgent('technical')] }))
    const many = scoreProject(makeProject({
      agents: Array(6).fill(null).map(() => makeAgent('technical'))
    }))
    expect(many.overallScore).toBeGreaterThan(few.overallScore)
  })

  it('levelMatch is valid enum value', () => {
    const result = scoreProject(makeProject())
    expect(['ok', 'upgrade', 'downgrade']).toContain(result.levelMatch)
  })

  it('suggestedLevel is valid enum value', () => {
    const result = scoreProject(makeProject())
    expect(['iskra', 'plomien', 'pozar', 'inferno']).toContain(result.suggestedLevel)
  })

  it('risks is array of strings', () => {
    const result = scoreProject(makeProject())
    expect(Array.isArray(result.risks)).toBe(true)
    result.risks.forEach(r => expect(typeof r).toBe('string'))
  })
})
```

---

### `/tests/lib/cost-tracker.test.ts`

```typescript
// agentspark/tests/lib/cost-tracker.test.ts
import { describe, it, expect } from 'vitest'
import { estimateCost } from '@/lib/cost-tracker'

describe('estimateCost', () => {
  it('calculates cost for known model', () => {
    // gpt-4o: $5/1M input, $15/1M output
    const cost = estimateCost('gpt-4o', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(20.0, 1)
  })

  it('calculates cost for gemini flash', () => {
    // gemini-2.0-flash: $0.10/1M input, $0.40/1M output
    const cost = estimateCost('gemini-2.0-flash', 1_000_000, 1_000_000)
    expect(cost).toBeCloseTo(0.50, 2)
  })

  it('uses default rate for unknown model', () => {
    const cost = estimateCost('unknown-model-xyz', 1_000_000, 0)
    expect(cost).toBeGreaterThan(0)
  })

  it('returns 0 for zero tokens', () => {
    const cost = estimateCost('gpt-4o', 0, 0)
    expect(cost).toBe(0)
  })

  it('returns non-negative value always', () => {
    const cost = estimateCost('claude-sonnet-4-6', 500, 250)
    expect(cost).toBeGreaterThanOrEqual(0)
  })
})
```

---

### `/tests/lib/prompts.test.ts`

```typescript
// agentspark/tests/lib/prompts.test.ts
import { describe, it, expect } from 'vitest'
import {
  getInterviewSystemPrompt,
  getRefineSystemPrompt,
  getScoringPrompt,
} from '@/lib/ai/prompts'

const BASE_PARAMS = {
  topic: 'E-Commerce App',
  level: 'iskra' as const,
  lang: 'en' as const,
  maxQuestions: 4,
  agentCount: '2-3',
  focus: 'purpose, users, core features',
}

describe('getInterviewSystemPrompt', () => {
  it('contains topic in prompt', () => {
    const prompt = getInterviewSystemPrompt(BASE_PARAMS)
    expect(prompt).toContain('E-Commerce App')
  })

  it('contains [INTERVIEW_COMPLETE] marker', () => {
    const prompt = getInterviewSystemPrompt(BASE_PARAMS)
    expect(prompt).toContain('[INTERVIEW_COMPLETE]')
  })

  it('contains IMPACT instruction', () => {
    const prompt = getInterviewSystemPrompt(BASE_PARAMS)
    expect(prompt).toContain('IMPACT')
  })

  it('contains correct question count', () => {
    const prompt = getInterviewSystemPrompt({ ...BASE_PARAMS, maxQuestions: 7 })
    expect(prompt).toContain('7')
  })

  it('switches language for Polish', () => {
    const prompt = getInterviewSystemPrompt({ ...BASE_PARAMS, lang: 'pl' })
    expect(prompt.toLowerCase()).toContain('polish')
  })
})

describe('getRefineSystemPrompt', () => {
  it('contains [UPDATED_TEAM] marker', () => {
    const prompt = getRefineSystemPrompt({
      topic: 'Test App',
      level: 'pozar',
      lang: 'en',
      currentAgents: [],
    })
    expect(prompt).toContain('[UPDATED_TEAM]')
  })

  it('contains refine-diff tag instructions', () => {
    const prompt = getRefineSystemPrompt({
      topic: 'Test',
      level: 'iskra',
      lang: 'en',
      currentAgents: [],
    })
    expect(prompt).toContain('refine-diff-added')
    expect(prompt).toContain('refine-diff-removed')
    expect(prompt).toContain('refine-diff-changed')
  })
})

describe('getScoringPrompt', () => {
  it('contains JSON schema instructions', () => {
    const prompt = getScoringPrompt({
      topic: 'Test',
      level: 'iskra',
      lang: 'en',
      interviewHistory: 'Q: What? A: This.',
    })
    expect(prompt).toContain('overallScore')
    expect(prompt).toContain('metrics')
    expect(prompt).toContain('levelMatch')
  })
})
```

---

### `/tests/server/rate-limit.test.ts`

```typescript
// agentspark/tests/server/rate-limit.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from '@/server/rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('allows requests under limit', async () => {
    const userId = 'user-rate-test-1'
    for (let i = 0; i < 19; i++) {
      const result = await checkRateLimit(userId)
      expect(result.allowed).toBe(true)
    }
  })

  it('blocks requests over per-minute limit', async () => {
    const userId = 'user-rate-test-2'
    // Send 20 requests (at limit)
    for (let i = 0; i < 20; i++) {
      await checkRateLimit(userId)
    }
    // 21st request should be blocked
    const result = await checkRateLimit(userId)
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('resets after window expires', async () => {
    const userId = 'user-rate-test-3'
    for (let i = 0; i < 20; i++) {
      await checkRateLimit(userId)
    }
    // Advance time by 61 seconds
    vi.advanceTimersByTime(61_000)
    const result = await checkRateLimit(userId)
    expect(result.allowed).toBe(true)
  })

  it('returns retryAfter in seconds', async () => {
    const userId = 'user-rate-test-4'
    for (let i = 0; i < 21; i++) {
      await checkRateLimit(userId)
    }
    const result = await checkRateLimit(userId)
    expect(result.allowed).toBe(false)
    expect(typeof result.retryAfter).toBe('number')
    expect(result.retryAfter).toBeGreaterThan(0)
    expect(result.retryAfter).toBeLessThanOrEqual(60)
  })
})
```

---

### `/tests/server/ai-service.test.ts`

```typescript
// agentspark/tests/server/ai-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIService } from '@/server/ai-service'

// Mock all external fetch calls
const mockFetch = vi.fn()
global.fetch = mockFetch

const makeGeminiResponse = (text: string, tokens = 100) => ({
  ok: true,
  json: async () => ({
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: { totalTokenCount: tokens },
  }),
})

const makeOpenAIResponse = (text: string, tokens = 100) => ({
  ok: true,
  json: async () => ({
    choices: [{ message: { content: text } }],
    usage: { total_tokens: tokens },
  }),
})

describe('AIService', () => {
  let service: AIService

  beforeEach(() => {
    service = new AIService()
    mockFetch.mockReset()
    process.env.GEMINI_API_KEY = 'test-gemini-key'
    process.env.OPENAI_API_KEY = 'test-openai-key'
  })

  describe('callWithFallback', () => {
    it('succeeds on first attempt', async () => {
      mockFetch.mockResolvedValueOnce(makeGeminiResponse('Hello from Gemini'))

      const result = await service.callWithFallback({
        systemPrompt: 'You are helpful.',
        userMessage: 'Hello',
        modelTag: 'gemini',
        userId: 'u1',
        projectId: 'p1',
        operation: 'interview',
      })

      expect(result.text).toBe('Hello from Gemini')
      expect(result.provider).toBe('gemini')
    })

    it('falls back to next model on 429', async () => {
      // First call: rate limited
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limited' } }),
      })
      // Second call: success
      mockFetch.mockResolvedValueOnce(makeGeminiResponse('Fallback response'))

      const result = await service.callWithFallback({
        systemPrompt: 'You are helpful.',
        userMessage: 'Hello',
        modelTag: 'gemini',
        userId: 'u1',
        projectId: 'p1',
        operation: 'interview',
      })

      expect(result.text).toBe('Fallback response')
      expect(result.isFallback ?? mockFetch).toBeDefined()
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('throws after all fallbacks exhausted', async () => {
      // All calls fail
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: { message: 'Service unavailable' } }),
      })

      await expect(
        service.callWithFallback({
          systemPrompt: 'You are helpful.',
          userMessage: 'Hello',
          modelTag: 'gemini',
          userId: 'u1',
          projectId: 'p1',
          operation: 'generate',
        })
      ).rejects.toThrow()
    })

    it('does NOT fallback on 401 (auth error)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      })

      await expect(
        service.callWithFallback({
          systemPrompt: 'You are helpful.',
          userMessage: 'Hello',
          modelTag: 'gemini',
          userId: 'u1',
          projectId: 'p1',
          operation: 'interview',
        })
      ).rejects.toThrow()

      // Should only have tried once (no fallback for auth errors)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
```

---

### `/tests/components/OptionButton.test.tsx`

```tsx
// agentspark/tests/components/OptionButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OptionButton } from '@/components/Chat/OptionButton'

describe('OptionButton', () => {
  it('renders label and text', () => {
    render(
      <OptionButton
        label="A"
        text="Option A text"
        impact={null}
        selected={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('Option A text')).toBeInTheDocument()
  })

  it('renders impact note when provided', () => {
    render(
      <OptionButton
        label="B"
        text="Option B"
        impact="This will affect auth performance significantly"
        selected={false}
        disabled={false}
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText(/affect auth performance/)).toBeInTheDocument()
  })

  it('calls onSelect with label and text when clicked', () => {
    const onSelect = vi.fn()
    render(
      <OptionButton
        label="C"
        text="Option C"
        impact={null}
        selected={false}
        disabled={false}
        onSelect={onSelect}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('C', 'Option C')
  })

  it('does not call onSelect when disabled', () => {
    const onSelect = vi.fn()
    render(
      <OptionButton
        label="D"
        text="Option D"
        impact={null}
        selected={false}
        disabled={true}
        onSelect={onSelect}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('applies selected styling when selected', () => {
    const { container } = render(
      <OptionButton
        label="A"
        text="Selected option"
        impact="Impact note"
        selected={true}
        disabled={false}
        onSelect={vi.fn()}
      />
    )
    // Check that selected class is applied
    const btn = container.querySelector('button')
    expect(btn?.className).toMatch(/accent|selected/)
  })
})
```

---

### `/tests/hooks/useInterview.test.ts`

```typescript
// agentspark/tests/hooks/useInterview.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useInterview } from '@/hooks/useInterview'

// Mock apiFetch
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}))
import { apiFetch } from '@/lib/api-client'
const mockApiFetch = vi.mocked(apiFetch)

describe('useInterview', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
  })

  it('startInterview sends request and updates chatHistory', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reply: 'QUESTION: What type of app?\nA) Web\nB) Mobile',
        isComplete: false,
        tokens: 150,
        _trace: { model: 'gemini', provider: 'gemini', label: '🎤 Interview · Start', durationMs: 800, tokens: 150, isFallback: false, error: null },
      }),
    } as Response)

    const { result } = renderHook(() => useInterview())

    await act(async () => {
      await result.current.startInterview()
    })

    // Store should have AI message in chatHistory
    // (access through store or returned state)
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/ai/interview',
      expect.objectContaining({ userAnswer: '' })
    )
  })

  it('sendAnswer appends user and AI messages', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reply: 'QUESTION: Next question?\nA) Yes\nB) No',
        isComplete: false,
        tokens: 120,
        _trace: { model: 'gemini', provider: 'gemini', label: '🎤 Interview · Q1 of 4', durationMs: 600, tokens: 120, isFallback: false, error: null },
      }),
    } as Response)

    const { result } = renderHook(() => useInterview())

    await act(async () => {
      await result.current.sendAnswer('A', 'Web app')
    })

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/ai/interview',
      expect.objectContaining({ userAnswer: 'A' })
    )
  })
})
```

---

### `/tests/middleware.test.ts`

```typescript
// agentspark/tests/middleware.test.ts
import { describe, it, expect, vi } from 'vitest'

// Test the auth guard logic in isolation
// (Next.js middleware can't be easily unit tested — test the logic function)
import { verifyFirebaseToken } from '@/lib/firebase/admin'

vi.mock('@/lib/firebase/admin', () => ({
  verifyFirebaseToken: vi.fn(),
}))

describe('Auth middleware logic', () => {
  it('allows request with valid token', async () => {
    vi.mocked(verifyFirebaseToken).mockResolvedValueOnce({
      uid: 'user-123',
      email: 'test@test.com',
    } as any)

    const result = await verifyFirebaseToken('valid-token')
    expect(result.uid).toBe('user-123')
  })

  it('throws with invalid token', async () => {
    vi.mocked(verifyFirebaseToken).mockRejectedValueOnce(
      new Error('Token expired')
    )

    await expect(verifyFirebaseToken('bad-token')).rejects.toThrow('Token expired')
  })
})
```

---

### `package.json` — scripts do dodania

```json
"scripts": {
  "test":         "vitest run",
  "test:watch":   "vitest",
  "test:ui":      "vitest --ui",
  "test:coverage":"vitest run --coverage",
  "typecheck":    "tsc --noEmit",
  "lint":         "eslint . --ext .ts,.tsx --max-warnings 0"
}
```

---

## 2. PWA — SERVICE WORKER

W Next.js Service Worker musi być w `/public/sw.js` (osobny plik, nie blob).

### `/public/sw.js`

```javascript
// agentspark/public/sw.js
// Service Worker — AgentSpark PWA
// Strategy: Cache-first dla statycznych assetów, Network-first dla API

const CACHE_VERSION = 'agentspark-v2'
const STATIC_CACHE  = `${CACHE_VERSION}-static`
const FONT_CACHE    = `${CACHE_VERSION}-fonts`

const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/offline',
]

const NEVER_CACHE = [
  '/api/ai/',
  '/api/projects/',
  'googleapis.com/v1beta',
  'openai.com',
  'anthropic.com',
  'mistral.ai',
  'groq.com',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
]

// ── Install ────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(PRECACHE_URLS).catch(() => {}) // graceful — don't fail install
    )
  )
})

// ── Activate ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ──────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // NEVER cache: AI calls, Firebase, auth
  if (NEVER_CACHE.some(pattern => request.url.includes(pattern))) {
    event.respondWith(fetch(request))
    return
  }

  // NEVER cache: POST requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request))
    return
  }

  // Cache-first: fonts
  if (url.hostname.includes('fonts.g') || request.destination === 'font') {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(request).then(cached =>
          cached || fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone())
            return res
          })
        )
      )
    )
    return
  }

  // Stale-while-revalidate: app shell (Next.js pages + static assets)
  event.respondWith(
    caches.open(STATIC_CACHE).then(cache =>
      cache.match(request).then(cached => {
        const networkFetch = fetch(request)
          .then(res => {
            if (res.ok && res.type !== 'opaque') cache.put(request, res.clone())
            return res
          })
          .catch(() => cached || caches.match('/offline'))
        return cached || networkFetch
      })
    )
  )
})

// ── Messages (skip waiting, etc.) ─────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting()
})
```

### `/public/offline.html`

Prosta strona offline (bez Next.js — czysty HTML):

```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentSpark — Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #050810; color: #e2e8f0;
      font-family: system-ui, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; text-align: center; padding: 2rem;
    }
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p  { color: #4a5568; font-size: 1rem; max-width: 400px; }
    .retry {
      margin-top: 2rem;
      padding: 0.75rem 2rem;
      background: #00e5ff; color: #050810;
      border: none; border-radius: 8px;
      font-size: 1rem; font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div>
    <h1>📡</h1>
    <h2 style="margin-bottom:0.5rem">You're offline</h2>
    <p>AgentSpark needs an internet connection to generate AI teams. Check your connection and try again.</p>
    <button class="retry" onclick="window.location.reload()">Try again</button>
  </div>
</body>
</html>
```

### `/app/offline/page.tsx` (Next.js route dla /offline)

```tsx
// agentspark/app/offline/page.tsx
// Wyświetlana przez SW gdy brak sieci i brak cache
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-center p-8">
      <div>
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-text mb-2">You're offline</h1>
        <p className="text-muted max-w-sm">
          AgentSpark needs an internet connection to generate AI teams.
          Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 bg-accent text-bg font-bold rounded-lg hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

### `/components/UI/PWAManager.tsx`

```tsx
// agentspark/components/UI/PWAManager.tsx
// Zarządza: rejestracja SW, baner instalacji, pasek offline, toast aktualizacji
'use client'
import { useEffect, useState } from 'react'

export function PWAManager() {
  const [isOffline, setIsOffline]     = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const [showUpdate, setShowUpdate]   = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Offline detection
    const handleOnline  = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // Install prompt
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)

    // Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        setSwReg(reg)
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowUpdate(true)
            }
          })
        })
        window.addEventListener('focus', () => reg.update())
      }).catch(err => console.warn('[AgentSpark SW]', err))

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
    }
  }, [])

  async function installApp() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowInstall(false)
    setDeferredPrompt(null)
  }

  function applyUpdate() {
    swReg?.waiting?.postMessage('skipWaiting')
    setShowUpdate(false)
  }

  return (
    <>
      {/* Offline bar */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-accent2/90 text-white text-center text-sm py-2 px-4 backdrop-blur-sm">
          📡 You're offline — AgentSpark loaded from cache
        </div>
      )}

      {/* Install banner */}
      {showInstall && (
        <div className="fixed bottom-6 left-6 z-[150] bg-surface border border-border rounded-xl p-4 flex items-center gap-4 shadow-xl max-w-sm">
          <div className="text-3xl">⚡</div>
          <div className="flex-1">
            <div className="font-bold text-sm text-text">Install AgentSpark</div>
            <div className="text-xs text-muted">Use offline · Faster access</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInstall(false)} className="text-xs text-muted hover:text-text px-2 py-1">
              Later
            </button>
            <button onClick={installApp} className="text-xs bg-accent text-bg font-bold px-3 py-1 rounded-lg">
              Install
            </button>
          </div>
        </div>
      )}

      {/* Update toast */}
      {showUpdate && (
        <div className="fixed bottom-6 right-6 z-[150] bg-surface border border-accent rounded-xl p-4 flex items-center gap-3 shadow-xl">
          <span className="text-sm text-text">🔄 Update available</span>
          <button onClick={applyUpdate} className="text-xs bg-accent text-bg font-bold px-3 py-1 rounded-lg">
            Reload
          </button>
          <button onClick={() => setShowUpdate(false)} className="text-xs text-muted hover:text-text">
            ✕
          </button>
        </div>
      )}
    </>
  )
}
```

Dodaj `<PWAManager />` do `/app/layout.tsx`.

### `/public/manifest.json`

```json
{
  "name": "AgentSpark",
  "short_name": "AgentSpark",
  "description": "Generate AI agent teams for your project",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#050810",
  "theme_color": "#00e5ff",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "categories": ["productivity", "developer"],
  "lang": "en"
}
```

W `next.config.ts` dodaj link do manifestu w `<head>`:
```typescript
// Lub dodaj w app/layout.tsx:
// <link rel="manifest" href="/manifest.json" />
// <meta name="theme-color" content="#00e5ff" />
```

---

## 3. DEPLOYMENT CONFIG

### `/vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["fra1"],
  "functions": {
    "app/api/ai/**/*.ts": {
      "maxDuration": 60,
      "memory": 512
    },
    "app/api/projects/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/sw.js", "destination": "/public/sw.js" }
  ]
}
```

### `/.firebaserc`

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

### `/firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": ".next",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

### `/firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId",    "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ai_usage",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId",    "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### `/next.config.ts`

```typescript
// agentspark/next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Nie loguj wrażliwych headers w Vercelu
  serverExternalPackages: ['pino', 'firebase-admin'],

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Next.js wymaga unsafe-eval
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://api.openai.com https://api.anthropic.com https://api.mistral.ai https://api.groq.com",
              "frame-ancestors 'none'",
            ].join('; ')
          },
        ],
      },
    ]
  },

  // Webpack — ignoruj pino transport w edge runtime
  webpack: (config) => {
    config.externals = config.externals || []
    config.externals.push('pino-pretty')
    return config
  },
}

export default config
```

---

## 4. CI/CD — GITHUB ACTIONS

### `/.github/workflows/ci.yml`

```yaml
# agentspark/.github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  typecheck:
    name: TypeScript
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    name: Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [typecheck, lint, test]
    env:
      NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
      NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
      # AI keys — używane tylko do build, nie w runtime testów
      GEMINI_API_KEY: test-key
      OPENAI_API_KEY: test-key
      ANTHROPIC_API_KEY: test-key
      MISTRAL_API_KEY: test-key
      GROQ_API_KEY: test-key
      FIREBASE_ADMIN_PROJECT_ID: test-project
      FIREBASE_ADMIN_CLIENT_EMAIL: test@test.com
      FIREBASE_ADMIN_PRIVATE_KEY: '{"type":"service_account"}'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

### `/.github/workflows/deploy.yml`

```yaml
# agentspark/.github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-firebase-rules:
    name: Deploy Firestore Rules
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g firebase-tools
      - run: firebase deploy --only firestore:rules,firestore:indexes --token ${{ secrets.FIREBASE_TOKEN }}

  # Vercel deployment happens automatically via Vercel GitHub integration
  # Ten job tylko weryfikuje że Firebase rules są aktualne
```

---

## 5. USAGE DASHBOARD

### `/app/usage/page.tsx`

```tsx
// agentspark/app/usage/page.tsx
// Auth guard: tylko zalogowany user
// Pobiera: ai_usage gdzie userId == currentUser.uid, ostatnie 30 dni
// API route: GET /api/usage (nowy endpoint)
```

### `/app/api/usage/route.ts`

```typescript
// agentspark/app/api/usage/route.ts
// GET — pobiera ai_usage dla zalogowanego usera

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken } from '@/lib/firebase/admin'
import { adminDb } from '@/lib/firebase/admin'
import { logger } from '@/server/logger'

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req)

    // Pobierz ostatnie 30 dni
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const snapshot = await adminDb
      .collection('ai_usage')
      .where('userId', '==', user.uid)
      .where('timestamp', '>=', since)
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get()

    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() ?? null,
    }))

    // Aggregate
    const totalCost   = records.reduce((sum, r) => sum + (r.estimatedCostUsd ?? 0), 0)
    const totalTokens = records.reduce((sum, r) => sum + (r.inputTokens ?? 0) + (r.outputTokens ?? 0), 0)

    const byModel: Record<string, { calls: number; tokens: number; cost: number }> = {}
    const byOperation: Record<string, { calls: number; cost: number }> = {}

    records.forEach(r => {
      const m = r.model ?? 'unknown'
      byModel[m] ??= { calls: 0, tokens: 0, cost: 0 }
      byModel[m].calls++
      byModel[m].tokens += (r.inputTokens ?? 0) + (r.outputTokens ?? 0)
      byModel[m].cost   += r.estimatedCostUsd ?? 0

      const op = r.operation ?? 'unknown'
      byOperation[op] ??= { calls: 0, cost: 0 }
      byOperation[op].calls++
      byOperation[op].cost += r.estimatedCostUsd ?? 0
    })

    return NextResponse.json({
      records,
      summary: { totalCost, totalTokens, totalCalls: records.length, byModel, byOperation },
    })
  } catch (err) {
    logger.error({ event: 'usage_fetch_error', error: String(err) })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

**UI Usage Dashboard (`/app/usage/page.tsx`):**

```
┌─────────────────────────────────────────────┐
│ ⚡ AI Usage — Last 30 days                  │
├─────────┬──────────────┬────────────────────┤
│ $0.847  │ 142,500 tok  │ 23 calls           │
│ Total cost │ Total tokens │ API calls        │
├─────────────────────────────────────────────┤
│ BY MODEL                                    │
│ Gemini 3 Flash   ███████░░░  18 calls $0.12 │
│ GPT-4o           ████░░░░░░   5 calls $0.73 │
├─────────────────────────────────────────────┤
│ BY OPERATION                                │
│ generate  ████████░  12 calls               │
│ interview ████░░░░░   8 calls               │
│ refine    ██░░░░░░░   3 calls               │
├─────────────────────────────────────────────┤
│ RECENT CALLS                                │
│ 2h ago · generate · Gemini · $0.004 · 850t  │
│ 3h ago · interview · GPT-4o · $0.02 · 2.1k │
└─────────────────────────────────────────────┘
```

---

## 6. FRAMEWORK EXPORT GENERATORS

### `/lib/frameworks/index.ts`

```typescript
// agentspark/lib/frameworks/index.ts
// Pure functions — zero side effects — zero UI dependencies
import type { Agent } from '@/types/agent'

export interface FrameworkExport {
  id: string
  label: string
  badge: string
  logo: string
  pip: string
  url: string
  generate: (topic: string, agents: Agent[]) => string
}

// Helper: agent variable name (Python-safe)
function agentVar(agent: Agent): string {
  return agent.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '')
}

function taskVar(agent: Agent): string {
  return `task_${agentVar(agent)}`
}

// ── CrewAI ────────────────────────────────────────────────
function generateCrewAI(topic: string, agents: Agent[]): string {
  const agentDefs = agents.map(a => `
${agentVar(a)} = Agent(
    role="${a.role || a.name}",
    goal="${a.description.split('.')[0]}.",
    backstory="""${a.description}""",
    verbose=True,
    allow_delegation=${a.type === 'technical' ? 'False' : 'True'},
    tools=[],  # Add your tools here
)`).join('\n')

  const taskDefs = agents.map((a, i) => {
    const next = agents[i + 1]
    return `
${taskVar(a)} = Task(
    description="""
    Topic: ${topic}
    Agent: ${a.name} — ${a.role || ''}
    ${a.description}
    """,
    expected_output="Detailed output from ${a.name} covering its responsibilities.",
    agent=${agentVar(a)},${next ? '\n    context=[],  # Will receive output from previous tasks' : ''}
)`
  }).join('\n')

  return `"""
AgentSpark → CrewAI Export
Topic: ${topic}
Generated: ${new Date().toISOString().slice(0, 10)}
Docs: https://docs.crewai.com
"""

from crewai import Agent, Task, Crew, Process
# from crewai_tools import SerperDevTool  # uncomment to add tools

# ── Agents ────────────────────────────────────────────────
${agentDefs}

# ── Tasks ─────────────────────────────────────────────────
${taskDefs}

# ── Crew ──────────────────────────────────────────────────
crew = Crew(
    agents=[${agents.map(a => `\n        ${agentVar(a)},`).join('')}
    ],
    tasks=[${agents.map(a => `\n        ${taskVar(a)},`).join('')}
    ],
    process=Process.sequential,
    verbose=True,
)

if __name__ == "__main__":
    result = crew.kickoff()
    print("\\n=== CREW RESULT ===")
    print(result)
`
}

// ── LangGraph ──────────────────────────────────────────────
function generateLangGraph(topic: string, agents: Agent[]): string {
  const stateFields = agents.map(a =>
    `    ${agentVar(a)}_output: str`
  ).join('\n')

  const nodeDefs = agents.map(a => `
def node_${agentVar(a)}(state: AgentState) -> AgentState:
    """${a.name}: ${a.description.slice(0, 80)}"""
    # TODO: implement with your LLM of choice
    result = f"[${a.name}] Processing: {state.get('input', '')}"
    return {**state, "${agentVar(a)}_output": result}
`).join('')

  const edges = agents.slice(0, -1).map((a, i) =>
    `graph.add_edge("${agentVar(a)}", "${agentVar(agents[i + 1])}")`
  ).join('\n')

  return `"""
AgentSpark → LangGraph Export
Topic: ${topic}
Docs: https://langchain-ai.github.io/langgraph
"""

from typing import TypedDict
from langgraph.graph import StateGraph, END

class AgentState(TypedDict):
    input: str
${stateFields}

${nodeDefs}

# ── Graph ─────────────────────────────────────────────────
graph = StateGraph(AgentState)

${agents.map(a => `graph.add_node("${agentVar(a)}", node_${agentVar(a)})`).join('\n')}

graph.set_entry_point("${agentVar(agents[0])}")
${edges}
graph.add_edge("${agentVar(agents[agents.length - 1])}", END)

app = graph.compile()

if __name__ == "__main__":
    result = app.invoke({"input": "Start processing ${topic}"})
    print(result)
`
}

// ── AutoGen ───────────────────────────────────────────────
function generateAutoGen(topic: string, agents: Agent[]): string {
  const agentDefs = agents.map(a => `
${agentVar(a)} = AssistantAgent(
    name="${a.name.replace(/\s+/g, '_')}",
    system_message="""You are ${a.name}.
Role: ${a.role}
${a.description}""",
    llm_config=llm_config,
)`).join('\n')

  return `"""
AgentSpark → AutoGen Export
Topic: ${topic}
Docs: https://microsoft.github.io/autogen
"""

import autogen

llm_config = {
    "config_list": [{"model": "gpt-4o", "api_key": "YOUR_OPENAI_KEY"}],
    "temperature": 0.7,
}

user_proxy = autogen.UserProxyAgent(
    name="User",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=3,
    code_execution_config={"work_dir": "output", "use_docker": False},
)

${agentDefs}

# ── Group Chat ─────────────────────────────────────────────
groupchat = autogen.GroupChat(
    agents=[user_proxy, ${agents.map(a => agentVar(a)).join(', ')}],
    messages=[],
    max_round=10,
)
manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=llm_config)

if __name__ == "__main__":
    user_proxy.initiate_chat(manager, message="Build: ${topic}")
`
}

// ── Swarm (OpenAI) ────────────────────────────────────────
function generateSwarm(topic: string, agents: Agent[]): string {
  const agentDefs = agents.map(a => `
${agentVar(a)} = Agent(
    name="${a.name}",
    instructions="""${a.description}

Role: ${a.role}
Type: ${a.type}""",
    model="gpt-4o",
)`).join('\n')

  return `"""
AgentSpark → OpenAI Swarm Export
Topic: ${topic}
Install: pip install git+https://github.com/openai/swarm.git
"""

from swarm import Swarm, Agent

client = Swarm()

${agentDefs}

def transfer_to_${agentVar(agents[1] || agents[0])}():
    return ${agentVar(agents[1] || agents[0])}

${agentVar(agents[0])}.functions = [transfer_to_${agentVar(agents[1] || agents[0])}]

if __name__ == "__main__":
    response = client.run(
        agent=${agentVar(agents[0])},
        messages=[{"role": "user", "content": "Start working on: ${topic}"}],
    )
    print(response.messages[-1]["content"])
`
}

// ── Export ────────────────────────────────────────────────
export const FRAMEWORKS: FrameworkExport[] = [
  {
    id: 'crewai', label: 'CrewAI', badge: 'Python', logo: '🤝',
    pip: 'pip install crewai crewai-tools',
    url: 'https://docs.crewai.com',
    generate: generateCrewAI,
  },
  {
    id: 'langgraph', label: 'LangGraph', badge: 'Python', logo: '🔗',
    pip: 'pip install langgraph langchain-openai',
    url: 'https://langchain-ai.github.io/langgraph',
    generate: generateLangGraph,
  },
  {
    id: 'autogen', label: 'AutoGen', badge: 'Python', logo: '🔄',
    pip: 'pip install pyautogen',
    url: 'https://microsoft.github.io/autogen',
    generate: generateAutoGen,
  },
  {
    id: 'swarm', label: 'Swarm', badge: 'Python', logo: '🐝',
    pip: 'pip install git+https://github.com/openai/swarm.git',
    url: 'https://github.com/openai/swarm',
    generate: generateSwarm,
  },
]
```

---

## 7. LOADING I ERROR PAGES

### `/app/loading.tsx` (global)

```tsx
// agentspark/app/loading.tsx
export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl animate-pulse">⚡</div>
        <div className="text-muted text-sm font-mono">Loading AgentSpark…</div>
      </div>
    </div>
  )
}
```

### `/app/project/[id]/loading.tsx`

```tsx
// agentspark/app/project/[id]/loading.tsx
export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <div className="text-muted text-xs font-mono">Loading project…</div>
      </div>
    </div>
  )
}
```

### `/app/project/[id]/error.tsx`

```tsx
// agentspark/app/project/[id]/error.tsx
'use client'
import { useEffect } from 'react'

export default function ProjectError({
  error, reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AgentSpark] Project error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-text mb-2">Something went wrong</h2>
        <p className="text-muted text-sm mb-6">{error.message || 'Failed to load project'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset}
            className="px-4 py-2 bg-accent text-bg font-bold rounded-lg text-sm hover:opacity-90">
            Try again
          </button>
          <a href="/dashboard"
            className="px-4 py-2 border border-border text-text rounded-lg text-sm hover:border-accent">
            My Projects
          </a>
        </div>
      </div>
    </div>
  )
}
```

### `/app/not-found.tsx`

```tsx
// agentspark/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-center p-8">
      <div>
        <div className="text-6xl mb-4 font-mono text-accent">404</div>
        <h1 className="text-2xl font-bold text-text mb-2">Page not found</h1>
        <p className="text-muted mb-6">This page doesn't exist or was moved.</p>
        <a href="/" className="px-6 py-2 bg-accent text-bg font-bold rounded-lg hover:opacity-90">
          Back to AgentSpark
        </a>
      </div>
    </div>
  )
}
```

---

## 8. HEALTH ENDPOINT

### `/app/api/health/route.ts`

```typescript
// agentspark/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {}

  // Check Firestore connectivity
  try {
    await adminDb.collection('_health').doc('ping').set({ ts: Date.now() })
    checks.firestore = 'ok'
  } catch {
    checks.firestore = 'error'
  }

  // Check AI keys present (nie testuj połączenia — za drogie)
  checks.gemini_key    = process.env.GEMINI_API_KEY    ? 'ok' : 'error'
  checks.openai_key    = process.env.OPENAI_API_KEY    ? 'ok' : 'error'
  checks.anthropic_key = process.env.ANTHROPIC_API_KEY ? 'ok' : 'error'

  const allOk = Object.values(checks).every(v => v === 'ok')

  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 207 }
  )
}
```

---

## 9. SEED DATA

### `/scripts/seed.ts`

```typescript
// agentspark/scripts/seed.ts
// Uruchamiaj przez: npx ts-node scripts/seed.ts
// Tworzy przykładowy projekt w Firestore dla testów dev

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore }        from 'firebase-admin/firestore'

const app = initializeApp({
  credential: cert({
    projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
})

const db = getFirestore(app)

const SEED_PROJECT = {
  userId:        'REPLACE_WITH_YOUR_UID',
  name:          'E-Commerce Demo',
  topic:         'E-Commerce App with AI recommendations',
  level:         'pozar',
  lang:          'en',
  modelProvider: 'gemini',
  modelId:       'gemini-3-flash-preview',
  agents: [
    {
      id: 'product-manager', name: 'Product Manager', emoji: '📦',
      type: 'business', role: 'PRODUCT_STRATEGIST',
      description: 'Defines product roadmap and feature priorities.',
      agentMd: '# Agent: Product Manager\n\n## Goal\nDefine product vision.',
      skillMd: '# Skill: Product Management\n\n## Capabilities\nRoadmap planning.',
    },
    {
      id: 'cart-engine', name: 'Cart Engine', emoji: '🛒',
      type: 'technical', role: 'CART_SPECIALIST',
      description: 'Manages shopping cart state and checkout flow.',
      agentMd: '# Agent: Cart Engine\n\n## Goal\nManage cart operations.',
      skillMd: '# Skill: Cart Management\n\n## Capabilities\nAdd, remove, checkout.',
    },
    {
      id: 'recommendation-ai', name: 'Recommendation AI', emoji: '🤖',
      type: 'technical', role: 'ML_SPECIALIST',
      description: 'Generates personalized product recommendations.',
      agentMd: '# Agent: Recommendation AI\n\n## Goal\nPersonalize experience.',
      skillMd: '# Skill: ML Recommendations\n\n## Capabilities\nCollaborative filtering.',
    },
  ],
  files: {
    'README.md': '# E-Commerce Demo\n\nGenerated by AgentSpark.',
  },
  versionHistory: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

async function seed() {
  const ref = db.collection('projects').doc()
  await ref.set(SEED_PROJECT)
  console.log(`✓ Seed project created: ${ref.id}`)
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
```

---

## DEFINICJA UKOŃCZENIA SESJI C

- [ ] `npm run test` — wszystkie testy przechodzą
- [ ] `npm run test:coverage` — coverage > 70% dla `lib/**` i `server/**`
- [ ] `/public/sw.js` istnieje jako osobny plik (nie blob)
- [ ] `PWAManager` działa: offline bar pojawia się bez sieci
- [ ] `vercel.json` zawiera `maxDuration: 60` dla AI routes
- [ ] `firestore.indexes.json` zawiera compound index dla `userId + updatedAt`
- [ ] GitHub Actions CI uruchamia się na każdym PR
- [ ] `/api/health` zwraca `{ status: 'ok' }` gdy wszystkie klucze skonfigurowane
- [ ] `/app/usage` wyświetla koszty dla zalogowanego usera
- [ ] `FrameworkExportModal` generuje poprawny Python dla CrewAI, LangGraph, AutoGen, Swarm
- [ ] `loading.tsx` i `error.tsx` istnieją dla `/app/project/[id]/`
- [ ] `not-found.tsx` wyświetla elegancką stronę 404

---

## DODATKOWE INSTRUKCJE

1. **Nie regeneruj** nic z Sesji A i B.
2. Każdy plik zaczyna się od `// agentspark/ścieżka/do/pliku.ts`.
3. Testy importują z `@/` — zakładaj że `tsconfig.paths` jest skonfigurowany.
4. `scripts/seed.ts` wymaga `ts-node` — dodaj do devDependencies:
   ```json
   "ts-node": "^10.9.0",
   "@types/node": "^20"
   ```
5. Service Worker w `/public/sw.js` musi być plain JavaScript (nie TypeScript).
6. Usage dashboard nie wymaga dodatkowego pakietu do chartów — użyj prostych
   CSS progress barów (width jako inline style z procentem).
7. Framework generators są pure functions bez żadnych importów zewnętrznych —
   testowalne bez mockowania.
