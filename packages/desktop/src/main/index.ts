import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { getOrchestrator } from './providers/orchestrator'
import { SafeLogger } from './providers/logger'
import { getAllAliases, getProviderConfig } from './providers/config'
import { getDb, disconnectDb } from './db'
import { GoogleService } from './services'

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
})

app.on('window-all-closed', async () => {
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
  const skillsDir = path.join(os.homedir(), '.opencode', 'skills')
  if (!fs.existsSync(skillsDir)) return { count: 0 }

  let systemUser = await db.user.findFirst({ where: { firebaseUid: 'system' } })
  if (!systemUser) {
    systemUser = await db.user.upsert({
      where: { firebaseUid: 'system' },
      create: { firebaseUid: 'system', name: 'System', email: 'system@eburon.dev' },
      update: {},
    })
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
  const skillDirs = entries.filter((e) => e.isDirectory())
  const seeded: string[] = []

  for (const dir of skillDirs) {
    const skillPath = path.join(skillsDir, dir.name, 'SKILL.md')
    if (!fs.existsSync(skillPath)) continue

    const content = fs.readFileSync(skillPath, 'utf-8')
    const nameMatch = content.match(/^name:\s*(.+)$/m)
    const descMatch = content.match(/^description:\s*"(.+)"$/m)
    const name = nameMatch ? nameMatch[1].trim() : dir.name
    const description = descMatch ? descMatch[1].trim() : ''

    const existing = await db.skill.findFirst({ where: { name } })
    if (!existing) {
      await db.skill.create({
        data: {
          userId: systemUser.id,
          name,
          description,
          type: 'system',
          enabled: true,
          icon: dir.name,
          content,
        },
      })
      seeded.push(name)
    }
  }

  return { count: seeded.length, skills: seeded }
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
