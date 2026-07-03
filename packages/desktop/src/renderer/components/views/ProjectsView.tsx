import { useState } from 'react'
import { useStore } from '@/store'
import {
  FolderOpen, GitBranch, Clock, Pin, Plus, Search,
  MoreHorizontal, ExternalLink, Star, Folder,
} from 'lucide-react'

export default function ProjectsView() {
  const { projects, activeProjectId, setActiveProject, addProject, threads } = useStore()
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPath, setNewPath] = useState('')

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCreate = () => {
    if (!newName.trim()) return
    addProject({
      id: `proj-${Date.now()}`,
      name: newName.trim(),
      path: newPath.trim() || `~/Projects/${newName.trim().toLowerCase().replace(/\s+/g, '-')}`,
      branch: 'main',
      lastActive: Date.now(),
    })
    setNewName('')
    setNewPath('')
    setShowNew(false)
  }

  return (
    <div className="w-full max-w-[900px] flex flex-col gap-5 px-2 py-6 pb-10 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Projects</h2>
          <p className="text-[13px] text-codebox-secondary mt-0.5">Manage your workspaces and repositories</p>
        </div>
        <button
          className="flex items-center gap-1.5 bg-codebox-blue text-white px-3.5 py-2 rounded-lg text-[13px] font-medium cursor-pointer border-none hover:bg-blue-500 transition-colors"
          onClick={() => setShowNew(!showNew)}
        >
          <Plus size={15} /> New Project
        </button>
      </div>

      {showNew && (
        <div className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex flex-col gap-3">
          <div className="text-sm font-medium text-codebox-primary">Create New Project</div>
          <div className="flex gap-3">
            <input
              className="flex-1 bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-codebox-secondary placeholder:text-codebox-muted"
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <input
              className="flex-1 bg-codebox-input border border-codebox-border text-codebox-primary px-3 py-2 rounded-lg text-sm outline-none focus:border-codebox-secondary placeholder:text-codebox-muted font-mono"
              placeholder="~/Projects/my-project"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="px-3 py-1.5 rounded-lg text-[13px] text-codebox-secondary hover:bg-white/5 cursor-pointer border-none" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="px-3.5 py-1.5 rounded-lg text-[13px] bg-codebox-blue text-white font-medium cursor-pointer border-none hover:bg-blue-500 transition-colors" onClick={handleCreate}>Create</button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-codebox-muted" />
        <input
          className="w-full bg-codebox-input border border-codebox-border text-codebox-primary pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none focus:border-codebox-secondary placeholder:text-codebox-muted"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((project) => {
          const projectThreads = threads.filter((t) => t.projectId === project.id)
          const isActive = project.id === activeProjectId
          return (
            <div
              key={project.id}
              className={`bg-codebox-card border rounded-xl p-4 cursor-pointer transition-all hover:border-codebox-secondary group ${
                isActive ? 'border-codebox-blue shadow-[0_0_0_1px_rgba(59,130,246,0.3)]' : 'border-codebox-border'
              }`}
              onClick={() => setActiveProject(project.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-codebox-blue/15' : 'bg-codebox-input'}`}>
                    <Folder size={18} className={isActive ? 'text-codebox-blue' : 'text-codebox-secondary'} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-codebox-primary">{project.name}</div>
                    <div className="text-[11.5px] text-codebox-muted font-mono mt-0.5 truncate max-w-[180px]">{project.path}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {project.pinned && <Pin size={13} className="text-codebox-blue" />}
                  <button className="p-1 rounded hover:bg-white/10 text-codebox-muted hover:text-codebox-primary border-none bg-transparent cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11.5px] text-codebox-secondary">
                <span className="flex items-center gap-1.5">
                  <GitBranch size={12} strokeWidth={1.8} />
                  <span className="font-mono">{project.branch}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FolderOpen size={12} strokeWidth={1.8} />
                  <span>{projectThreads.length} session{projectThreads.length !== 1 ? 's' : ''}</span>
                </span>
                <span className="flex items-center gap-1.5 ml-auto">
                  <Clock size={12} strokeWidth={1.8} />
                  <span>{formatRelativeTime(project.lastActive)}</span>
                </span>
              </div>

              {isActive && (
                <div className="mt-3 pt-3 border-t border-codebox-border flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-codebox-green" />
                  <span className="text-[11px] text-codebox-green">Active workspace</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-codebox-muted text-sm">
          No projects found.{' '}
          <button className="text-codebox-blue hover:underline cursor-pointer bg-transparent border-none" onClick={() => setShowNew(true)}>
            Create one
          </button>
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}
