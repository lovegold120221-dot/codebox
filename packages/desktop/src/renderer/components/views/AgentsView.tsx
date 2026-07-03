import { useStore } from '@/store'
import {
  Code2, Layers, Shield, Bug, Mic, ListChecks, FileText, Search,
  Zap, ChevronRight,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  Code2, Layers, Shield, Bug, Mic, ListChecks, FileText, Search,
}

const ROLE_COLORS: Record<string, string> = {
  'Coding Agent': 'text-codebox-blue bg-codebox-blue/10',
  'Architect Agent': 'text-codebox-purple bg-codebox-purple/10',
  'Reviewer Agent': 'text-codebox-green bg-codebox-green/10',
  'Debugger Agent': 'text-codebox-red bg-red-500/10',
  'Voice Agent': 'text-pink-400 bg-pink-400/10',
  'Planner Agent': 'text-orange-400 bg-orange-400/10',
  'Documentation Agent': 'text-yellow-400 bg-yellow-400/10',
  'Research Agent': 'text-cyan-400 bg-cyan-400/10',
}

export default function AgentsView() {
  const { agents, toggleAgent, setActiveView } = useStore()

  const activeAgents = agents.filter((a) => a.active)
  const inactiveAgents = agents.filter((a) => !a.active)

  return (
    <div className="w-full max-w-[900px] flex flex-col gap-6 px-2 py-6 pb-10 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Eburon Agents</h2>
          <p className="text-[13px] text-codebox-secondary mt-0.5">
            {activeAgents.length} active · {inactiveAgents.length} inactive
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-codebox-secondary bg-codebox-card border border-codebox-border px-3 py-1.5 rounded-lg">
          <Zap size={13} className="text-codebox-blue" />
          <span>Agent Orchestrator: Active</span>
        </div>
      </div>

      <div className="bg-codebox-card border border-codebox-border rounded-xl p-4">
        <div className="text-xs text-codebox-muted mb-3 font-medium uppercase tracking-wider">How it works</div>
        <p className="text-[13px] text-codebox-secondary leading-relaxed">
          Eburon agents are specialized AI personas that collaborate on your tasks. Each agent has a defined role and context window. They communicate through the Eburon orchestrator and can work in parallel on complex projects.
        </p>
        <div className="flex gap-4 mt-3 text-[12px]">
          <div className="flex items-center gap-1.5 text-codebox-green">
            <span className="w-1.5 h-1.5 rounded-full bg-codebox-green" /> Orchestrator online
          </div>
          <div className="flex items-center gap-1.5 text-codebox-blue">
            <span className="w-1.5 h-1.5 rounded-full bg-codebox-blue" /> {activeAgents.length} agents ready
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-[11px] font-medium text-codebox-muted uppercase tracking-wider px-1">Active Agents</div>
        {activeAgents.map((agent) => {
          const Icon = ICON_MAP[agent.icon] || Code2
          const colorClass = ROLE_COLORS[agent.role] || 'text-codebox-secondary bg-codebox-input'
          return (
            <div key={agent.id} className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex items-center gap-4 hover:border-codebox-secondary transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-codebox-primary">{agent.name}</span>
                  <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-medium ${colorClass}`}>{agent.role}</span>
                </div>
                <p className="text-[12px] text-codebox-secondary mt-0.5 truncate">{agent.description}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] text-codebox-green">
                  <span className="w-1.5 h-1.5 rounded-full bg-codebox-green animate-pulse" /> Active
                </div>
                <label className="relative inline-flex w-9 h-5 flex-shrink-0 cursor-pointer">
                  <input type="checkbox" checked={agent.active} onChange={() => toggleAgent(agent.id)} className="sr-only peer" />
                  <span className="absolute inset-0 rounded-full bg-codebox-green peer-focus:ring-2 peer-focus:ring-codebox-blue/30 transition-all" />
                  <span className="absolute w-4 h-4 bg-white rounded-full shadow top-0.5 left-4 transition-all" />
                </label>
              </div>
            </div>
          )
        })}
      </div>

      {inactiveAgents.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-medium text-codebox-muted uppercase tracking-wider px-1">Inactive Agents</div>
          {inactiveAgents.map((agent) => {
            const Icon = ICON_MAP[agent.icon] || Code2
            const colorClass = ROLE_COLORS[agent.role] || 'text-codebox-secondary bg-codebox-input'
            return (
              <div key={agent.id} className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex items-center gap-4 opacity-60 hover:opacity-80 transition-opacity">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-codebox-primary">{agent.name}</span>
                    <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-medium ${colorClass}`}>{agent.role}</span>
                  </div>
                  <p className="text-[12px] text-codebox-secondary mt-0.5 truncate">{agent.description}</p>
                </div>
                <label className="relative inline-flex w-9 h-5 flex-shrink-0 cursor-pointer">
                  <input type="checkbox" checked={false} onChange={() => toggleAgent(agent.id)} className="sr-only peer" />
                  <span className="absolute inset-0 rounded-full bg-codebox-input border border-codebox-border peer-focus:ring-2 peer-focus:ring-codebox-blue/30 transition-all" />
                  <span className="absolute w-4 h-4 bg-white rounded-full shadow top-0.5 left-0.5 transition-all" />
                </label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
