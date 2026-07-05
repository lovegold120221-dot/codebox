# Eburon Codebox - Developer Instructions & Architecture Guide

This document acts as the foundational engineering guidelines and architectural blueprint for the **Eburon Codebox** project. Always refer to this document before starting implementation or changes.

---

## 1. Project Overview

**Eburon Codebox** is an AI coding agent desktop application designed to provide a cohesive, model-agnostic LLM interface with enterprise-grade auto-failover, dual safe-logging, memory/skill management, scheduler automations, Google Workspace integration, and a native Android companion app.

### Main Technologies & Tech Stack
- **Desktop Application:** Electron V33 (with isolated context preload and IPC bridge)
- **Frontend / Renderer:** React 18, TypeScript, Tailwind CSS (with a custom `codebox` theme), and Zustand (V5) for centralized state management
- **Build Tools:** Vite V6, esbuild (for compiling Main process TS to CommonJS)
- **Database & Persistence:** PostgreSQL V16 (run via Alpine Docker image) + Prisma Client (V7) for migrations, transactions, and safe operations
- **External APIs & Integrations:** Google Workspace (Gmail, Calendar, Drive) OAuth 2.0 (using secure native Electron `safeStorage`), Firebase Auth
- **Companion Mobile App:** Native Android wrapper built with Kotlin & a WebView container loaded with force-dark auto-theming support

---

## 2. Directory Structure & Architecture

```
eburon-codebox/
├── install.sh                          # One-command fresh machine setup script
├── package.json                        # Root workspace configuration (pnpm monorepo)
├── pnpm-lock.yaml
├── AGENTS.md                           # OpenCode agent workflow configurations
├── GEMINI.md                           # This file (AI developer instructions & blueprints)
├── android/                            # Companion Native Android wrapper app (WebView-based Kotlin)
│   └── app/src/main/java/.../MainActivity.kt  # Android webview bootstrapper with dark mode
└── packages/desktop/                   # Core Electron + React Monorepo Package
    ├── package.json                    # Package metadata & desktop lifecycle scripts
    ├── docker-compose.yml              # Dev/Production PostgreSQL setup (Postgres 16 Alpine)
    ├── tailwind.config.js              # Custom theme configs and codebox color palette
    ├── tsconfig.json                   # Path mapping configuring `@/*` to `src/renderer/*`
    ├── prisma/
    │   └── schema.prisma               # Prisma DB Schema for Postgres containing 6 core models
    ├── scripts/
    │   ├── build-main.mjs              # esbuild script compiling main process files
    │   └── copy-prisma.mjs             # Moves compiled Prisma engines to appropriate targets
    └── src/
        ├── main/                       # Main process (Node/Electron context, SQLite/Postgres DB)
        │   ├── index.ts                # App bootstrapper, browser window setup, and IPC routing
        │   ├── preload.ts              # Native preload isolation exposing electronAPI.*
        │   ├── db/index.ts             # Prisma Pg pool client instantiation
        │   ├── providers/              # Provider management, auto-failover, and dual logging
        │   │   ├── config.ts           # Mappings of Eburon aliases to real models / environments
        │   │   ├── orchestrator.ts     # Failover logic engine
        │   │   └── adapters/           # Main adapters: opencode-zen, codex-ollama, claude-ollama, etc.
        │   └── services/               # Integrations: Google Gmail, Calendar, Drive APIs
        └── renderer/                   # React Render Process (Bundled using Vite)
            ├── App.tsx                 # Desktop Layout & routing entry
            ├── main.tsx                # Renderer React entry
            ├── store/                  # Centralized Zustand store
            ├── styles/                 # Tailwind stylesheet
            ├── components/             # Reusable modular UI components (Composer, Skills, Terminal, Voice)
            └── lib/                    # Core UI utilities (adapters, helpers, client wrappers)
```

---

## 3. Core Subsystems

### A. Provider-Agnostic LLM Engine (Failover & Dual Logging)
- **Dual Logging:** Real provider/model details are logged internally for debugging, while the frontend displays safe, standardized `eburon-*` aliases.
- **Failover Logic:** If a model times out, hits rate limits, or hits a token limit, the Main process `orchestrator.ts` automatically switches to the next priority provider.
- **Provider Aliases Configuration (`packages/desktop/src/main/providers/config.ts`):**
  - `eburon-sirius` -> Qwen 3.6 latest (via local OpenCode server on port `4096`)
  - `eburon-vega` -> Gemma 4 (via local Ollama on port `11434`)
  - `eburon-orion` -> Ornith 9b (via local Ollama on port `11434`)
  - `eburon-polaris` -> Orbit-AI latest (via local Ollama)
  - `eburon-zen` -> DeepSeek V4 Flash (via OpenCode CLI)
  - `eburon-breeze` -> DeepSeek V4 Flash (via FreeBuff CLI proxy on port `8000`)
  - `eburon-vortex` -> Qwen 3.6 latest (via Ollama Cloud on port `11434`)

### B. Database Models (Prisma)
All storage utilizes PostgreSQL (run via Docker). The schema consists of:
1. **User:** Keyed off firebaseUid, stores preferences and references.
2. **Thread:** Message thread metadata, categorized by projects.
3. **Message:** Standardized message items with optional raw formatting and structural fields.
4. **Memory:** Local and project-specific persistence to record and query user facts.
5. **Skill:** Reusable tools and agent commands configured locally.
6. **Automation:** Timed prompt routines managed via a cron scheduler.

---

## 4. Building, Running & Developing

All development tasks should run from the root of the workspace.

### Core Development Commands

| Command / Task | Script / CLI Action |
| --- | --- |
| **Complete Machine Setup** | `./install.sh` |
| **Start Database Container** | `docker compose -f packages/desktop/docker-compose.yml up -d` |
| **Generate Prisma client** | `pnpm --filter @eburon/desktop exec prisma generate` |
| **Sync Database Schema** | `pnpm --filter @eburon/desktop exec prisma db push` |
| **Open Prisma Studio** | `pnpm --filter @eburon/desktop exec prisma studio` |
| **Start Frontend (Vite)** | `pnpm dev` or `pnpm --filter @eburon/desktop exec vite --host` |
| **Build Electron Main Process** | `pnpm --filter @eburon/desktop exec node scripts/build-main.mjs` |
| **Start Desktop App (Dev)** | `DATABASE_URL="postgresql://eburon:eburon@localhost:5432/eburon" VITE_DEV_SERVER_URL=http://localhost:5173 npx electron packages/desktop/dist-electron/main.cjs` |
| **Build Frontend** | `pnpm --filter @eburon/desktop build` |
| **Type Check Source Files** | `pnpm --filter @eburon/desktop exec tsc --noEmit` |

---

## 5. Development Conventions & Guidelines

- **Centralized State:** Always use the primary Zustand store in `src/renderer/store/index.ts`. Do not introduce custom React contexts or independent Redux configurations unless explicitly requested.
- **Environment Handling:** Ensure critical backend credentials (like database URLs, custom API tokens, and Firebase config settings) are stored within `packages/desktop/.env` and loaded selectively through the Electron main process via `.env`.
- **Preload Isolation:** Never expose direct Node.js modules or imports to the Renderer process. Expose only scoped secure endpoints in `src/main/preload.ts` inside the `electronAPI` namespace.
- **Strict Typing:** Write fully typed TypeScript modules. Bypassing types using `any` should be avoided unless dealing with legacy third-party window objects or external preloads. Run `tsc --noEmit` to verify type safety.
- **Tailwind Styling:** Use standard Tailwind CSS utilities combined with custom codebox tokens defined in `packages/desktop/tailwind.config.js` (e.g. `bg-codebox-bg`, `text-codebox-primary`). Avoid hardcoding hex-codes. Support both dark mode and light mode the proper way (dark mode is selected class-wise, light mode via the `data-theme="light"` attribute on the root).
- **Google API Client Maintenance:** Any enhancements to Gmail, Calendar, or Drive interactions should belong inside `src/main/services/` and map securely via the IPC channels configured in `preload.ts` and `index.ts`. Keep raw API tokens encrypted.
