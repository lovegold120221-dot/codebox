import { getDb } from './db'
import { getOrchestrator } from './providers/orchestrator'
import { SafeLogger } from './providers/logger'
import cp from 'cron-parser'

const POLL_INTERVAL_MS = 60_000
let intervalHandle: ReturnType<typeof setInterval> | null = null

function computeNextRun(cronExpr: string, after: Date = new Date()): Date | null {
  try {
    const interval = cp.parse(cronExpr, { currentDate: after })
    const next = interval.next().value
    return next || null
  } catch {
    return null
  }
}

async function executeAutomation(auto: {
  id: string
  name: string
  prompt: string
  schedule: string
}): Promise<void> {
  const orchestrator = getOrchestrator()
  const db = getDb()

  SafeLogger.internal('info', `Scheduler executing automation "${auto.name}" (${auto.id})`)

  try {
    const response = await orchestrator.execute(auto.prompt, undefined, undefined)

    const now = new Date()
    const nextRun = computeNextRun(auto.schedule, now)

    await db.automation.update({
      where: { id: auto.id },
      data: {
        lastRun: now,
        nextRun,
      },
    })

    SafeLogger.internal('info', `Automation "${auto.name}" completed (${response.tokensUsed} tokens, model: ${response.modelUsed})`)
  } catch (err: any) {
    SafeLogger.internal('error', `Automation "${auto.name}" failed`, err.message)

    const now = new Date()
    const nextRun = computeNextRun(auto.schedule, now)

    await db.automation.update({
      where: { id: auto.id },
      data: {
        lastRun: now,
        nextRun,
      },
    }).catch(() => {})
  }
}

async function tick(): Promise<void> {
  try {
    const db = getDb()
    const now = new Date()

    const due = await db.automation.findMany({
      where: {
        enabled: true,
        OR: [
          { nextRun: null },
          { nextRun: { lte: now } },
        ],
      },
    })

    if (due.length === 0) return

    SafeLogger.internal('info', `Scheduler found ${due.length} due automation(s)`)

    await Promise.all(due.map((auto) => executeAutomation(auto)))
  } catch (err: any) {
    SafeLogger.internal('error', 'Scheduler tick failed', err.message)
  }
}

export function startScheduler(): void {
  if (intervalHandle) return

  SafeLogger.internal('info', 'Starting automation scheduler (poll every 60s)')
  tick()
  intervalHandle = setInterval(tick, POLL_INTERVAL_MS)
}

export function stopScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
    SafeLogger.internal('info', 'Automation scheduler stopped')
  }
}
