import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { getOrchestrator } from './providers/orchestrator'
import { SafeLogger } from './providers/logger'
import { getAllAliases, getProviderConfig } from './providers/config'
import { getDb, disconnectDb } from './db'
import { GoogleService } from './services'
import { startScheduler, stopScheduler } from './scheduler'
import cp from 'cron-parser'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'codebox', privileges: { standard: true, secure: true } },
])

app.whenReady().then(() => {
  protocol.registerFileProtocol('codebox', (request, callback) => {
    const url = request.url.substring('codebox://'.length)
    callback({ path: path.normalize(decodeURIComponent(url)) })
  })
  createWindow()
  startScheduler()
})

app.on('window-all-closed', async () => {
  stopScheduler()
  await disconnectDb()
  app.quit()
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('app:getVersion', () => app.getVersion())

const orchestrator = getOrchestrator()

ipcMain.handle('db:user:findByFirebaseUid', async (_e, firebaseUid: string) => {
  const db = getDb()
  return db.user.findUnique({ where: { firebaseUid } })
})

ipcMain.handle('db:user:create', async (_e, data: { firebaseUid: string; email?: string; name?: string; avatarUrl?: string }) => {
  const db = getDb()
  return db.user.create({ data })
})

ipcMain.handle('db:user:update', async (_e, id: string, data: { name?: string; avatarUrl?: string; preferences?: any }) => {
  const db = getDb()
  return db.user.update({ where: { id }, data })
})

ipcMain.handle('db:thread:list', async () => {
  const db = getDb()
  return db.thread.findMany({ orderBy: { createdAt: 'desc' } })
})

ipcMain.handle('db:thread:get', async (_e, id: string) => {
  const db = getDb()
  return db.thread.findUnique({ where: { id }, include: { messages: true } })
})

ipcMain.handle('db:thread:create', async (_e, data: { userId: string; title?: string; mode?: string; projectId?: string; branch?: string; sessionId?: string }) => {
  const db = getDb()
  return db.thread.create({ data })
})

ipcMain.handle('db:thread:update', async (_e, id: string, data: { title?: string; branch?: string; sessionId?: string }) => {
  const db = getDb()
  return db.thread.update({ where: { id }, data })
})

ipcMain.handle('db:thread:delete', async (_e, id: string) => {
  const db = getDb()
  await db.thread.delete({ where: { id } })
  return true
})

ipcMain.handle('db:message:list', async (_e, threadId: string) => {
  const db = getDb()
  return db.message.findMany({ where: { threadId }, orderBy: { timestamp: 'asc' } })
})

ipcMain.handle('db:message:create', async (_e, data: { threadId: string; role: string; content: string; code?: string; reasoning?: string }) => {
  const db = getDb()
  return db.message.create({ data })
})

ipcMain.handle('db:memory:list', async (_e, project?: string) => {
  const db = getDb()
  const where = project ? { project } : {}
  return db.memory.findMany({ where, orderBy: { createdAt: 'desc' } })
})

ipcMain.handle('db:memory:create', async (_e, data: { userId: string; type: string; content: string; project?: string; sourceSession?: string; confidence?: number }) => {
  const db = getDb()
  return db.memory.create({ data })
})

ipcMain.handle('db:memory:search', async (_e, query: string, project?: string) => {
  const db = getDb()
  const memories = await db.memory.findMany({
    where: {
      content: { contains: query, mode: 'insensitive' },
      ...(project ? { project } : {}),
    },
    orderBy: { confidence: 'desc' },
  })
  return memories
})

ipcMain.handle('db:skill:list', async () => {
  const db = getDb()
  return db.skill.findMany({ orderBy: { createdAt: 'desc' } })
})

ipcMain.handle('db:skill:create', async (_e, data: { userId: string; name: string; description?: string; type?: string; content?: string; icon?: string }) => {
  const db = getDb()
  return db.skill.create({ data })
})

ipcMain.handle('db:skill:update', async (_e, id: string, data: { name?: string; description?: string; type?: string; content?: string; icon?: string; enabled?: boolean }) => {
  const db = getDb()
  return db.skill.update({ where: { id }, data })
})

ipcMain.handle('db:skill:delete', async (_e, id: string) => {
  const db = getDb()
  await db.skill.delete({ where: { id } })
  return true
})

ipcMain.handle('db:skill:seedFromOpenCode', async () => {
  const db = getDb()

  let systemUser = await db.user.findFirst({ where: { firebaseUid: 'system' } })
  if (!systemUser) {
    systemUser = await db.user.upsert({
      where: { firebaseUid: 'system' },
      create: { firebaseUid: 'system', name: 'System', email: 'system@eburon.dev' },
      update: {},
    })
  }

  interface SkillEntry {
    path: string
    source: string
  }

  const skills: SkillEntry[] = []

  const opencodeDir = path.join(os.homedir(), '.opencode', 'skills')
  if (fs.existsSync(opencodeDir)) {
    for (const e of fs.readdirSync(opencodeDir, { withFileTypes: true })) {
      if (e.isDirectory()) skills.push({ path: path.join(opencodeDir, e.name, 'SKILL.md'), source: 'opencode' })
    }
  }

  const hermesDir = path.join(os.homedir(), '.hermes')
  if (fs.existsSync(hermesDir)) {
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) walk(full)
        else if (e.name === 'SKILL.md') skills.push({ path: full, source: 'hermes' })
      }
    }
    walk(hermesDir)
  }

  const seeded: string[] = []
  const updatedNames: string[] = []
  const opencodeNames = new Set<string>()
  const hermesNames = new Set<string>()

  function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[-_\s]/g, '')
  }

  // First pass: collect all names (normalized for dedup)
  for (const entry of skills) {
    const content = fs.readFileSync(entry.path, 'utf-8')
    const nameMatch = content.match(/^name:\s*(.+)$/m)
    const rawName = nameMatch ? nameMatch[1].trim() : path.basename(path.dirname(entry.path))
    const name = rawName.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const setName = entry.source === 'opencode' ? opencodeNames : hermesNames
    setName.add(normalizeName(name))
  }

  // Second pass: seed/dedupe with category assignment
  const seenFinal = new Set<string>()

  for (const entry of skills) {
    const content = fs.readFileSync(entry.path, 'utf-8')
    const nameMatch = content.match(/^name:\s*(.+)$/m)
    const descMatch = content.match(/^description:\s*"(.+)"$/m)
    const rawName = nameMatch ? nameMatch[1].trim() : path.basename(path.dirname(entry.path))
    const rawDesc = descMatch ? descMatch[1].trim() : ''

    const name = rawName.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const normalized = normalizeName(name)

    // Assign category
    let category = entry.source
    // If this skill exists in opencode and we're seeing it from hermes, mark as other
    if (entry.source === 'hermes' && opencodeNames.has(normalized)) {
      category = 'other'
    }

    // Skip duplicates (normalized name already seen)
    if (seenFinal.has(normalized)) continue
    seenFinal.add(normalized)

    let description = rawDesc
    const sentences = description.split(/(?<=[.!?])\s+/).filter((s) => s.length > 10)
    if (sentences.length < 2) {
      const skillDir = path.basename(path.dirname(entry.path))
      const dirCategory = skillDir.includes('-') ? skillDir.split('-')[0] : skillDir
      const secondSentence = `This skill provides specialized instructions and tooling for ${dirCategory.replace(/[-_]/g, ' ')} workflows, enabling the agent to handle related tasks autonomously.`
      description = sentences.length === 1
        ? `${sentences[0]} ${secondSentence}`
        : `${secondSentence} It configures the agent with the right context, commands, and best practices for this domain.`
    }

    const existing = await db.skill.findFirst({ where: { name } })
    if (!existing) {
      await db.skill.create({
        data: {
          userId: systemUser.id,
          name,
          description,
          type: 'system',
          category,
          enabled: true,
          icon: path.basename(path.dirname(entry.path)),
          content,
        },
      })
      seeded.push(name)
    } else if (existing.category !== category || existing.description !== description) {
      await db.skill.update({
        where: { id: existing.id },
        data: { description, category },
      })
      updatedNames.push(name)
    }
  }

  // Cleanup: delete system skills that no longer exist on disk
  const allDbSkills = await db.skill.findMany({ where: { type: 'system' } })
  const validNames = new Set(seenFinal)
  let deletedCount = 0
  for (const dbSkill of allDbSkills) {
    if (!validNames.has(normalizeName(dbSkill.name))) {
      await db.skill.delete({ where: { id: dbSkill.id } })
      deletedCount++
    }
  }

  return { count: seeded.length, updated: updatedNames.length, deleted: deletedCount, skills: seeded }
})

ipcMain.handle('db:skill:createFromPrompt', async (_e, data: { userId: string; prompt: string }) => {
  const db = getDb()
  const orchestrator = getOrchestrator()

  const skillPrompt = `You are a skill creation engine. Based on the user's request, generate a skill definition.

CRITICAL: Your entire response must be a valid JSON object with these fields:
{
  "name": "Skill Name (capitalized, 1-4 words)",
  "description": "2-3 sentence description of what this skill does and when to use it",
  "content": "Full skill instructions with system prompt, triggers, and workflow guidance"
}

The skill name must be unique and descriptive. The content should be comprehensive — include system prompt style instructions, trigger conditions, workflow steps, and configuration guidance.

User request: ${data.prompt}

Respond ONLY with the JSON object, no other text.`

  try {
    const response = await orchestrator.execute(skillPrompt, undefined, undefined)
    let parsed
    try {
      parsed = JSON.parse(response.content)
    } catch {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      else throw new Error('Could not parse skill from AI response')
    }

    const existing = await db.skill.findFirst({ where: { name: parsed.name } })
    if (existing) {
      await db.skill.update({
        where: { id: existing.id },
        data: {
          description: parsed.description,
          content: parsed.content,
          type: 'custom',
          category: 'custom',
        },
      })
      return { success: true, skill: { ...existing, description: parsed.description, content: parsed.content, type: 'custom', category: 'custom' }, updated: true }
    }

    const skill = await db.skill.create({
      data: {
        userId: data.userId,
        name: parsed.name,
        description: parsed.description,
        type: 'custom',
        category: 'custom',
        enabled: true,
        icon: parsed.name.toLowerCase().replace(/\s+/g, '-'),
        content: parsed.content,
      },
    })
    return { success: true, skill, updated: false }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('db:automation:list', async (_e, userId: string) => {
  const db = getDb()
  return db.automation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
})

ipcMain.handle('db:automation:create', async (_e, data: { userId: string; name: string; prompt: string; schedule: string; type?: string }) => {
  const db = getDb()
  return db.automation.create({ data })
})

ipcMain.handle('db:automation:update', async (_e, id: string, data: { name?: string; prompt?: string; schedule?: string; enabled?: boolean; lastRun?: Date; nextRun?: Date }) => {
  const db = getDb()
  return db.automation.update({ where: { id }, data })
})

ipcMain.handle('db:automation:delete', async (_e, id: string) => {
  const db = getDb()
  await db.automation.delete({ where: { id } })
  return true
})

ipcMain.handle('google:auth:init', async (_e, credentialsPath?: string) => {
  return GoogleService.auth.init(credentialsPath)
})

ipcMain.handle('google:auth:authenticate', async () => {
  return GoogleService.auth.authenticate()
})

ipcMain.handle('google:auth:signOut', async () => {
  return GoogleService.auth.signOut()
})

ipcMain.handle('google:auth:isAuthenticated', () => {
  return GoogleService.auth.isAuthenticated()
})

ipcMain.handle('google:gmail:listLabels', async () => {
  return GoogleService.gmail.listLabels()
})

ipcMain.handle('google:gmail:listMessages', async (_e, opts?: { maxResults?: number; labelIds?: string[]; query?: string }) => {
  return GoogleService.gmail.listMessages(opts)
})

ipcMain.handle('google:gmail:getMessage', async (_e, messageId: string) => {
  return GoogleService.gmail.getMessage(messageId)
})

ipcMain.handle('google:gmail:sendMessage', async (_e, to: string, subject: string, body: string) => {
  return GoogleService.gmail.sendMessage(to, subject, body)
})

ipcMain.handle('google:calendar:listCalendars', async () => {
  return GoogleService.calendar.listCalendars()
})

ipcMain.handle('google:calendar:listEvents', async (_e, opts?: { calendarId?: string; maxResults?: number; timeMin?: string; timeMax?: string }) => {
  return GoogleService.calendar.listEvents(opts)
})

ipcMain.handle('google:calendar:createEvent', async (_e, opts: { summary: string; description?: string; start: string; end: string; location?: string; attendees?: string[] }) => {
  return GoogleService.calendar.createEvent(opts)
})

ipcMain.handle('google:drive:listFiles', async (_e, opts?: { pageSize?: number; query?: string; orderBy?: string }) => {
  return GoogleService.drive.listFiles(opts)
})

ipcMain.handle('google:drive:uploadFile', async (_e, opts: { filePath: string; name?: string; mimeType?: string; parentFolderId?: string }) => {
  return GoogleService.drive.uploadFile(opts)
})

ipcMain.handle('google:drive:downloadFile', async (_e, fileId: string, destPath: string) => {
  return GoogleService.drive.downloadFile(fileId, destPath)
})

ipcMain.handle('google:drive:createFolder', async (_e, name: string, parentFolderId?: string) => {
  return GoogleService.drive.createFolder(name, parentFolderId)
})

ipcMain.handle('provider:getAliases', () => {
  return getAllAliases()
})

ipcMain.handle('provider:getConfig', (_event, alias: string) => {
  const cfg = getProviderConfig(alias)
  if (!cfg) return null
  return {
    alias: cfg.alias,
    displayName: cfg.displayName,
    contextLimit: cfg.contextLimit,
  }
})

ipcMain.handle('provider:checkAvailability', async () => {
  return orchestrator.checkAvailability()
})

ipcMain.handle('provider:getSwitchHistory', () => {
  return orchestrator.getSwitchHistory().map((entry) => ({
    timestamp: entry.timestamp,
    failedAlias: entry.failedAlias,
    reason: entry.reason,
    nextAlias: entry.nextAlias,
    success: entry.success,
  }))
})

ipcMain.handle('provider:getAvailable', async () => {
  const avail = await orchestrator.checkAvailability()
  return Object.entries(avail)
    .filter(([, isAvail]) => isAvail)
    .map(([alias]) => alias)
})

ipcMain.handle('provider:execute', async (_event, payload: {
  prompt: string
  provider?: string
  sessionId?: string
}) => {
  const { prompt: text, provider } = payload
  const response = await orchestrator.execute(text, undefined, provider)
  return {
    success: true,
    content: response.content,
    tokensUsed: response.tokensUsed,
    finishReason: response.finishReason,
    modelUsed: response.modelUsed,
  }
})

ipcMain.handle('scheduler:runNow', async (_e, automationId: string) => {
  const db = getDb()
  const auto = await db.automation.findUnique({ where: { id: automationId } })
  if (!auto || !auto.enabled) return { success: false, error: 'Automation not found or not enabled' }

  try {
    const orchestrator = getOrchestrator()
    const response = await orchestrator.execute(auto.prompt, undefined, undefined)
    const now = new Date()
    let nextRun: Date | null = null
    try {
      const interval = cp.parse(auto.schedule, { currentDate: now })
      const next = interval.next().value
      nextRun = next || null
    } catch {}
    await db.automation.update({
      where: { id: auto.id },
      data: { lastRun: now, nextRun },
    })
    return { success: true, content: response.content, tokensUsed: response.tokensUsed, modelUsed: response.modelUsed }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('scheduler:computeNextRun', async (_e, cronExpr: string) => {
  try {
    const interval = cp.parse(cronExpr)
    const next = interval.next().value
    return { nextRun: (next || new Date()).toISOString() }
  } catch (err: any) {
    return { error: err.message }
  }
})

ipcMain.handle('scheduler:status', async () => {
  return { running: true, pollIntervalMs: 60_000 }
})

let streamBuffer: string[] = []

ipcMain.handle('provider:streamStart', async (_event, payload: {
  prompt: string
  provider?: string
  sessionId?: string
}) => {
  streamBuffer = []
  const { prompt: text, provider } = payload

  for await (const { chunk, provider: prov } of orchestrator.stream(text, undefined, provider)) {
    streamBuffer.push(chunk)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('provider:streamChunk', { chunk, provider: prov })
    }
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('provider:streamDone', {
      content: streamBuffer.join(''),
      modelUsed: 'eburon-sirius',
    })
  }

  return { success: true }
})

ipcMain.handle('provider:streamStop', async () => {
  return { success: true }
})
