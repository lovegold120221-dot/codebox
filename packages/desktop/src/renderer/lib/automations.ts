export interface AutomationDef {
  id: string
  userId: string
  name: string
  prompt: string
  schedule: string
  type: string
  enabled: boolean
  lastRun: string | null
  nextRun: string | null
  createdAt: string
}

function getDb() {
  const api = (window as any).electronAPI?.db
  if (!api) throw new Error('Database not available. Run the app in Electron.')
  return api
}

export class AutomationManager {
  async getAll(userId: string): Promise<AutomationDef[]> {
    return getDb().automation.list(userId)
  }

  async create(data: { userId: string; name: string; prompt: string; schedule: string; type?: string }): Promise<string> {
    const auto = await getDb().automation.create(data)
    return auto.id
  }

  async update(id: string, data: Partial<AutomationDef>): Promise<void> {
    await getDb().automation.update(id, data)
  }

  async remove(id: string): Promise<void> {
    await getDb().automation.delete(id)
  }
}

let automationManager: AutomationManager | null = null
export function getAutomationManager(): AutomationManager {
  if (!automationManager) automationManager = new AutomationManager()
  return automationManager
}
