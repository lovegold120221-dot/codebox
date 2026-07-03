import { useStore } from '@/store'
import {
  Layout, GitBranch, FolderOpen, FileCode, Settings2,
  Database, Key, Bell, StickyNote, BookOpen, RefreshCw,
} from 'lucide-react'

export default function WorkspaceView() {
  const { activeProjectId, projects } = useStore()
  const project = projects.find((p) => p.id === activeProjectId)

  return (
    <div className="w-full max-w-[900px] flex flex-col gap-5 px-2 py-6 pb-10 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Workspace</h2>
          <p className="text-[13px] text-codebox-secondary mt-0.5">{project?.name || 'Global'} · configuration and context</p>
        </div>
        <button className="flex items-center gap-1.5 text-[12.5px] text-codebox-secondary bg-codebox-card border border-codebox-border px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/5 border-none">
          <RefreshCw size={13} /> Sync
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: FolderOpen, label: 'Files', value: '1,247', color: 'text-codebox-blue' },
          { icon: GitBranch, label: 'Branch', value: project?.branch || 'main', color: 'text-codebox-green' },
          { icon: FileCode, label: 'Open tabs', value: '3', color: 'text-codebox-purple' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-codebox-input flex items-center justify-center ${color}`}>
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-[11.5px] text-codebox-secondary">{label}</div>
              <div className="text-sm font-medium text-codebox-primary font-mono">{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Section icon={Settings2} title="Workspace Settings">
          <SettingItem label="Auto-save interval" value="5s" />
          <SettingItem label="Tab size" value="2 spaces" />
          <SettingItem label="Format on save" value="Enabled" accent />
          <SettingItem label="Lint on type" value="Enabled" accent />
        </Section>

        <Section icon={Key} title="Workspace Secrets">
          <div className="text-[12px] text-codebox-secondary mb-2">Secrets are encrypted and never exposed to the frontend.</div>
          <div className="flex flex-col gap-1.5">
            {['API_KEY', 'DATABASE_URL', 'GEMINI_API_KEY'].map((k) => (
              <div key={k} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-codebox-input border border-codebox-border">
                <span className="font-mono text-[11.5px] text-codebox-primary">{k}</span>
                <span className="text-[10.5px] text-codebox-green">Set</span>
              </div>
            ))}
          </div>
          <button className="mt-2 text-[12px] text-codebox-blue hover:underline cursor-pointer bg-transparent border-none">+ Add secret</button>
        </Section>

        <Section icon={Database} title="Memory & Context">
          <SettingItem label="Indexed files" value="1,247" />
          <SettingItem label="Embeddings" value="8,421 vectors" />
          <SettingItem label="Memory entries" value="24" />
          <SettingItem label="Auto-index on save" value="Enabled" accent />
          <button className="mt-1 text-[12px] text-codebox-secondary hover:text-codebox-primary cursor-pointer bg-transparent border-none">Re-index workspace →</button>
        </Section>

        <Section icon={StickyNote} title="Notes">
          <textarea
            className="w-full bg-codebox-bg border border-codebox-border rounded-lg px-3 py-2 text-[12.5px] text-codebox-primary placeholder:text-codebox-muted outline-none resize-none focus:border-codebox-secondary"
            placeholder="Workspace notes — jot down context, links, decisions..."
            rows={5}
          />
        </Section>

        <Section icon={BookOpen} title="AI Rules">
          <div className="text-[12px] text-codebox-secondary mb-2">Instructions that apply to every agent in this workspace.</div>
          <textarea
            className="w-full bg-codebox-bg border border-codebox-border rounded-lg px-3 py-2 text-[12.5px] text-codebox-primary placeholder:text-codebox-muted outline-none resize-none focus:border-codebox-secondary font-mono"
            placeholder="e.g. Always use TypeScript strict mode. Prefer functional components. Never use any. ..."
            rows={5}
          />
        </Section>

        <Section icon={Bell} title="Notifications">
          <SettingItem label="Task complete" value="Toast + sound" />
          <SettingItem label="Voice connected" value="Toast" />
          <SettingItem label="Build finished" value="Toast + badge" />
          <SettingItem label="Tests passed" value="Toast" />
          <SettingItem label="Errors" value="Toast + sound" accent={false} danger />
        </Section>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-codebox-primary">
        <Icon size={15} strokeWidth={1.8} className="text-codebox-secondary" />
        {title}
      </div>
      {children}
    </div>
  )
}

function SettingItem({ label, value, accent, danger }: { label: string; value: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-codebox-secondary">{label}</span>
      <span className={danger ? 'text-codebox-red' : accent ? 'text-codebox-green' : 'text-codebox-primary font-medium'}>
        {value}
      </span>
    </div>
  )
}
