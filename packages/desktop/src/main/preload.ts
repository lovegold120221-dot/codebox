import { contextBridge, ipcRenderer } from 'electron'

export interface ProviderExecuteResult {
  success: boolean
  content?: string
  tokensUsed?: number
  finishReason?: string
  modelUsed?: string
  error?: string
}

export interface ProviderConfig {
  alias: string
  displayName: string
  contextLimit: number
}

export interface SwitchLogEntry {
  timestamp: number
  failedAlias: string
  reason: string
  nextAlias: string
  success: boolean
}

const google = {
  auth: {
    init: (credentialsPath?: string): Promise<boolean> =>
      ipcRenderer.invoke('google:auth:init', credentialsPath),
    authenticate: (): Promise<boolean> =>
      ipcRenderer.invoke('google:auth:authenticate'),
    signOut: (): Promise<void> =>
      ipcRenderer.invoke('google:auth:signOut'),
    isAuthenticated: (): Promise<boolean> =>
      ipcRenderer.invoke('google:auth:isAuthenticated'),
  },
  gmail: {
    listLabels: (): Promise<any[]> =>
      ipcRenderer.invoke('google:gmail:listLabels'),
    listMessages: (opts?: { maxResults?: number; labelIds?: string[]; query?: string }): Promise<any[]> =>
      ipcRenderer.invoke('google:gmail:listMessages', opts),
    getMessage: (messageId: string): Promise<any> =>
      ipcRenderer.invoke('google:gmail:getMessage', messageId),
    sendMessage: (to: string, subject: string, body: string): Promise<string> =>
      ipcRenderer.invoke('google:gmail:sendMessage', to, subject, body),
  },
  calendar: {
    listCalendars: (): Promise<any[]> =>
      ipcRenderer.invoke('google:calendar:listCalendars'),
    listEvents: (opts?: { calendarId?: string; maxResults?: number; timeMin?: string; timeMax?: string }): Promise<any[]> =>
      ipcRenderer.invoke('google:calendar:listEvents', opts),
    createEvent: (opts: { summary: string; description?: string; start: string; end: string; location?: string; attendees?: string[] }): Promise<any> =>
      ipcRenderer.invoke('google:calendar:createEvent', opts),
  },
  drive: {
    listFiles: (opts?: { pageSize?: number; query?: string; orderBy?: string }): Promise<any[]> =>
      ipcRenderer.invoke('google:drive:listFiles', opts),
    uploadFile: (opts: { filePath: string; name?: string; mimeType?: string; parentFolderId?: string }): Promise<any> =>
      ipcRenderer.invoke('google:drive:uploadFile', opts),
    downloadFile: (fileId: string, destPath: string): Promise<string> =>
      ipcRenderer.invoke('google:drive:downloadFile', fileId, destPath),
    createFolder: (name: string, parentFolderId?: string): Promise<any> =>
      ipcRenderer.invoke('google:drive:createFolder', name, parentFolderId),
  },
}

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  google,

  db: {
    user: {
      findByFirebaseUid: (firebaseUid: string): Promise<any> => ipcRenderer.invoke('db:user:findByFirebaseUid', firebaseUid),
      create: (data: any): Promise<any> => ipcRenderer.invoke('db:user:create', data),
      update: (id: string, data: any): Promise<any> => ipcRenderer.invoke('db:user:update', id, data),
    },
    thread: {
      list: (): Promise<any[]> => ipcRenderer.invoke('db:thread:list'),
      get: (id: string): Promise<any> => ipcRenderer.invoke('db:thread:get', id),
      create: (data: any): Promise<any> => ipcRenderer.invoke('db:thread:create', data),
      update: (id: string, data: any): Promise<any> => ipcRenderer.invoke('db:thread:update', id, data),
      delete: (id: string): Promise<boolean> => ipcRenderer.invoke('db:thread:delete', id),
    },
    message: {
      list: (threadId: string): Promise<any[]> => ipcRenderer.invoke('db:message:list', threadId),
      create: (data: any): Promise<any> => ipcRenderer.invoke('db:message:create', data),
    },
    memory: {
      list: (project?: string): Promise<any[]> => ipcRenderer.invoke('db:memory:list', project),
      create: (data: any): Promise<any> => ipcRenderer.invoke('db:memory:create', data),
      search: (query: string, project?: string): Promise<any[]> => ipcRenderer.invoke('db:memory:search', query, project),
    },
    skill: {
      list: (): Promise<any[]> => ipcRenderer.invoke('db:skill:list'),
      create: (data: any): Promise<any> => ipcRenderer.invoke('db:skill:create', data),
      update: (id: string, data: any): Promise<any> => ipcRenderer.invoke('db:skill:update', id, data),
      delete: (id: string): Promise<boolean> => ipcRenderer.invoke('db:skill:delete', id),
      seedFromOpenCode: (): Promise<{ count: number; skills: string[]; updated: number }> => ipcRenderer.invoke('db:skill:seedFromOpenCode'),
      createFromPrompt: (data: { userId: string; prompt: string }): Promise<{ success: boolean; skill?: any; error?: string }> =>
        ipcRenderer.invoke('db:skill:createFromPrompt', data),
    },
    automation: {
      list: (userId: string): Promise<any[]> => ipcRenderer.invoke('db:automation:list', userId),
      create: (data: { userId: string; name: string; prompt: string; schedule: string; type?: string }): Promise<any> => ipcRenderer.invoke('db:automation:create', data),
      update: (id: string, data: any): Promise<any> => ipcRenderer.invoke('db:automation:update', id, data),
      delete: (id: string): Promise<boolean> => ipcRenderer.invoke('db:automation:delete', id),
    },
  },

  scheduler: {
    runNow: (automationId: string): Promise<{ success: boolean; content?: string; error?: string; tokensUsed?: number; modelUsed?: string }> =>
      ipcRenderer.invoke('scheduler:runNow', automationId),
    computeNextRun: (cronExpr: string): Promise<{ nextRun?: string; error?: string }> =>
      ipcRenderer.invoke('scheduler:computeNextRun', cronExpr),
    status: (): Promise<{ running: boolean; pollIntervalMs: number }> =>
      ipcRenderer.invoke('scheduler:status'),
  },

  provider: {
    getAliases: (): Promise<string[]> => ipcRenderer.invoke('provider:getAliases'),
    getConfig: (alias: string): Promise<ProviderConfig | null> =>
      ipcRenderer.invoke('provider:getConfig', alias),
    checkAvailability: (): Promise<Record<string, boolean>> =>
      ipcRenderer.invoke('provider:checkAvailability'),
    getSwitchHistory: (): Promise<SwitchLogEntry[]> =>
      ipcRenderer.invoke('provider:getSwitchHistory'),
    getAvailable: (): Promise<string[]> =>
      ipcRenderer.invoke('provider:getAvailable'),
    execute: (payload: { prompt: string; provider?: string; sessionId?: string }): Promise<ProviderExecuteResult> =>
      ipcRenderer.invoke('provider:execute', payload),
    streamStart: (payload: { prompt: string; provider?: string; sessionId?: string }): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('provider:streamStart', payload),
    streamStop: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('provider:streamStop'),
    onStreamChunk: (callback: (data: { chunk: string; provider: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: { chunk: string; provider: string }) =>
        callback(data)
      ipcRenderer.on('provider:streamChunk', handler)
      return () => ipcRenderer.removeListener('provider:streamChunk', handler)
    },
    onStreamDone: (callback: (data: { content: string; modelUsed: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: { content: string; modelUsed: string }) =>
        callback(data)
      ipcRenderer.on('provider:streamDone', handler)
      return () => ipcRenderer.removeListener('provider:streamDone', handler)
    },
    onStreamError: (callback: (data: { error: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: { error: string }) =>
        callback(data)
      ipcRenderer.on('provider:streamError', handler)
      return () => ipcRenderer.removeListener('provider:streamError', handler)
    },
  },
})
