# Eburon Codebox

**AI coding agent desktop app** — Electron + React + Vite + Zustand + Prisma + PostgreSQL.  
Provider-agnostic LLM interface with auto-failover, Firebase auth, and a fully branded frontend that hides all real provider/model names.

---

## Features

- **7 provider engines** — local Ollama, cloud Ollama, OpenCode CLI (free models), FreeBuff (via proxy)
- **Auto-failover** — seamless switching on timeout, quota, rate-limit, or unavailability
- **Context compression** — automatic summarisation when switching to a smaller context window
- **Firebase Auth** — email/password and Google sign-in
- **PostgreSQL storage** — threads, messages, memories, skills, and user profiles via Prisma ORM
- **10 failure classifications** — token_limit, context_window_exceeded, usage_quota, rate_limited, timeout, empty_response, invalid_response, provider_unavailable, cli_command_failure, task_incomplete
- **Safe dual logging** — internal logs contain real names; frontend shows only `eburon-*` aliases
- **Streaming responses** — real-time token-by-token output
- **Dark/light theme** — Tailwind CSS with custom `codebox` palette
- **Skills & memory** — Prisma-backed persistent learning across sessions
- **Docker Compose** — one-command PostgreSQL setup with alpine image
- **Google Workspace integration** — Gmail, Calendar, Drive APIs via OAuth 2.0
- **Secure token storage** — OAuth tokens encrypted with Electron `safeStorage`

---

## Quick start

```bash
# Clone and enter
git clone https://github.com/lovegold120221-dot/codebox.git
cd codebox

# Run the automated install script
./install.sh

# Or follow the manual steps below
```

### Manual setup

```bash
# 1. Start PostgreSQL
docker compose -f packages/desktop/docker-compose.yml up -d

# 2. Configure environment
cp packages/desktop/.env.example packages/desktop/.env
# Edit packages/desktop/.env: set DATABASE_URL

# 3. Install dependencies
pnpm install

# 4. Push database schema
pnpm --filter @eburon/desktop exec prisma db push

# 5. Build Electron main process
pnpm --filter @eburon/desktop exec node scripts/build-main.mjs

# 6. Terminal 1: Start Vite dev server
pnpm --filter @eburon/desktop exec vite --host

# 7. Terminal 2: Launch Electron
DATABASE_URL="postgresql://eburon:eburon@localhost:5432/eburon" \
  VITE_DEV_SERVER_URL=http://localhost:5173 \
  npx electron packages/desktop/dist-electron/main.cjs
```

---

## Architecture

```
codebox/
├── install.sh                          # Fresh machine setup script
├── package.json                        # Root workspace (pnpm monorepo)
├── pnpm-lock.yaml
├── AGENTS.md                           # OpenCode agent instructions
└── packages/desktop/
    ├── package.json                    # @eburon/desktop
    ├── electron-builder.yml            # Cross-platform packaging config
    ├── docker-compose.yml              # PostgreSQL 16-alpine
    ├── vite.config.ts                  # Vite + React plugin
    ├── tailwind.config.js              # Custom codebox color palette
    ├── tsconfig.json                   # @/* → src/renderer/
    ├── prisma/
    │   └── schema.prisma               # 5 models: User, Thread, Message, Memory, Skill
    ├── scripts/
    │   └── build-main.mjs              # esbuild: main process TS → CJS
    ├── src/
    │   ├── main/                       # Electron main process (Node.js)
    │   │   ├── index.ts                # App entry, BrowserWindow, IPC handlers
    │   │   ├── preload.ts              # contextBridge: electronAPI.*
    │   │   ├── db/index.ts             # PrismaClient singleton
    │   │   ├── providers/
    │   │   │   ├── config.ts           # Alias mapping, env parsing, priority
    │   │   │   ├── orchestrator.ts     # Auto-failover engine
    │   │   │   ├── compressor.ts      # Token estimation & truncation
    │   │   │   ├── logger.ts           # Dual safe/internal logging
    │   │   │   ├── types.ts            # Shared interfaces
    │   │   │   └── adapters/           # 7 provider implementations
    │   │   └── services/               # Google Workspace (Gmail, Calendar, Drive)
    │   └── renderer/                   # React app (Vite-bundled, contextIsolated)
    │       ├── App.tsx                 # Auth gate + main layout
    │       ├── main.tsx
    │       ├── lib/
    │       │   ├── auth/              # Firebase init, email + Google auth
    │       │   ├── providers/         # IPC wrapper for provider operations
    │       │   ├── memory.ts          # Prisma-backed MemoryStore
    │       │   └── skills.ts          # Prisma-backed SkillManager
    │       ├── store/index.ts         # Zustand store (single source of truth)
    │       └── components/            # Composer, sidebar, thread, settings, etc.
    └── release/                       # Build artifacts (gitignored)
        ├── Eburon Codebox-0.1.0-arm64.dmg       # macOS
        ├── Eburon Codebox-0.1.0-arm64-mac.zip    # macOS (portable)
        ├── Eburon Codebox-0.1.0-arm64.AppImage   # Linux
        ├── @eburon/desktop_0.1.0_arm64.deb       # Linux (Debian/Ubuntu)
        └── Eburon Codebox Setup 0.1.0.exe        # Windows
```

---

## Provider system

All real provider names (OpenAI, Anthropic, Ollama, OpenCode, FreeBuff) and model names are **never exposed to the frontend**. The UI shows only branded `eburon-*` aliases:

| Alias | Display Name | Backend | Context Limit |
|---|---|---|---|
| `eburon-sirius` | Eburon Sirius | Local Ollama (qwen3.6) | 128K |
| `eburon-vega` | Eburon Vega | Local Ollama (gemma4) | 64K |
| `eburon-zen` | Eburon Zen | OpenCode CLI (free) | 128K |
| `eburon-breeze` | Eburon Breeze | FreeBuff proxy | 64K |
| `eburon-vortex` | Eburon Vortex | Cloud Ollama | 128K |
| `eburon-orion` | Eburon Orion | Local Ollama (ornith) | 32K |
| `eburon-polaris` | Eburon Polaris | Local Ollama (orbit-ai) | 8K |
| `auto` | Auto (Best Available) | Priority-based selection | — |

**Default priority:** `eburon-sirius → eburon-vega → eburon-zen → eburon-breeze → eburon-vortex → eburon-orion → eburon-polaris`

Configure via `PROVIDER_PRIORITY` env var. On failure, the orchestrator automatically switches to the next available provider and compresses context if needed.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `LLM_PROVIDER` | No | `auto` | `auto` or `manual` |
| `PROVIDER_PRIORITY` | No | (see above) | Comma-separated failover order |
| `OLLAMA_HOST` | No | `http://localhost:11434` | Local Ollama base URL |
| `OLLAMA_CLOUD_HOST` | No | — | Remote Ollama base URL |
| `OLLAMA_CLOUD_MODEL` | No | `qwen3.6:latest` | Cloud adapter model |
| `OPENCODE_MODEL` | No | `opencode/deepseek-v4-flash-free` | OpenCode CLI model |
| `FREEBUFF_HOST` | No | `http://localhost:8000` | freebuff2api proxy URL |
| `FREEBUFF_MODEL` | No | `deepseek/deepseek-v4-flash` | FreeBuff model |

---

## Database

### Schema (5 models)

```
User      1──N Thread     — chat sessions
Thread    1──N Message    — individual messages
User      1──N Memory     — cross-session learnings
User      1──N Skill      — reusable instruction packs
```

### Commands

```bash
# Generate Prisma client
pnpm --filter @eburon/desktop exec prisma generate

# Push schema changes
pnpm --filter @eburon/desktop exec prisma db push

# Create a migration
pnpm --filter @eburon/desktop exec prisma migrate dev --name description

# Open Prisma Studio (GUI data browser)
pnpm --filter @eburon/desktop exec prisma studio

# Reset database
pnpm --filter @eburon/desktop exec prisma db push --force-reset
```

---

## Google Workspace Integration

The app integrates with Gmail, Calendar, and Drive via OAuth 2.0. Tokens are encrypted at rest using Electron's `safeStorage` API (macOS Keychain / Windows DPAPI).

### Setup

1. Add `http://localhost` to **Authorized redirect URIs** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable Gmail API, Google Calendar API, and Google Drive API
3. Place the OAuth client secret at `~/Downloads/client_secret_*.apps.googleusercontent.com.json` or set `GOOGLE_OAUTH_CREDENTIALS` env var

### IPC API

| Namespace | Methods |
|---|---|
| `auth` | `init`, `authenticate`, `signOut`, `isAuthenticated` |
| `gmail` | `listLabels`, `listMessages`, `getMessage`, `sendMessage` |
| `calendar` | `listCalendars`, `listEvents`, `createEvent` |
| `drive` | `listFiles`, `uploadFile`, `downloadFile`, `createFolder` |

---

## Build & package

```bash
# Type check
pnpm --filter @eburon/desktop exec tsc --noEmit

# Development build (main process only)
pnpm --filter @eburon/desktop exec node scripts/build-main.mjs

# Full Vite + Electron build
pnpm --filter @eburon/desktop build

# Package for distribution
pnpm --filter @eburon/desktop package:mac    # → release/*.dmg
pnpm --filter @eburon/desktop package:win    # → release/*.exe
pnpm --filter @eburon/desktop package:linux  # → release/*.AppImage

# Clean generated files
pnpm --filter @eburon/desktop clean
```

---

## Keybindings

| Key | Action |
|---|---|
| `Cmd+B` / `Ctrl+B` | Toggle sidebar |
| `Cmd+J` / `Ctrl+J` | Toggle terminal |
| `Cmd+K` / `Ctrl+K` | New thread |
| `Cmd+,` / `Ctrl+,` | Open settings |

---

## Prerequisites

- **Node.js 18+**
- **pnpm** — `npm install -g pnpm`
- **Docker** — for PostgreSQL
- **Ollama** — for local models (`brew install ollama`)
- **OpenCode CLI** — `npm install -g opencode`
- **FreeBuff (optional)** — `npm install -g freebuff` + freebuff2api proxy

---

## License

MIT
