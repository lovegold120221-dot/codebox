import { useState } from 'react'
import { Puzzle, Download, Star, Shield, RefreshCw, Search, Zap } from 'lucide-react'

interface Plugin {
  id: string
  name: string
  description: string
  author: string
  version: string
  downloads: number
  rating: number
  installed: boolean
  category: string
  icon: string
}

const PLUGINS: Plugin[] = [
  { id: 'p1', name: 'Tailwind Intellisense', description: 'Intelligent Tailwind CSS class completion and linting in the composer.', author: 'Eburon Labs', version: '1.2.0', downloads: 8421, rating: 4.9, installed: true, category: 'Styling', icon: '🎨' },
  { id: 'p2', name: 'Prisma Schema AI', description: 'AI-powered Prisma schema generation from natural language descriptions.', author: 'community', version: '0.9.1', downloads: 3102, rating: 4.7, installed: true, category: 'Database', icon: '🗄️' },
  { id: 'p3', name: 'Docker Compose Assistant', description: 'Generate and validate Docker Compose files with AI suggestions.', author: 'Eburon Labs', version: '1.0.4', downloads: 5890, rating: 4.8, installed: false, category: 'DevOps', icon: '🐳' },
  { id: 'p4', name: 'GitHub Actions Builder', description: 'Visual builder for CI/CD pipelines with AI completion.', author: 'community', version: '2.1.0', downloads: 12300, rating: 4.6, installed: false, category: 'DevOps', icon: '⚙️' },
  { id: 'p5', name: 'OpenAPI Generator', description: 'Generate TypeScript clients and server stubs from OpenAPI specs.', author: 'Eburon Labs', version: '1.5.0', downloads: 7200, rating: 4.8, installed: false, category: 'API', icon: '📡' },
  { id: 'p6', name: 'Mermaid Diagrams', description: 'Render Mermaid diagrams inline in chat responses.', author: 'community', version: '0.8.3', downloads: 4500, rating: 4.5, installed: true, category: 'Visualization', icon: '📊' },
]

export default function PluginsView() {
  const [search, setSearch] = useState('')
  const [plugins, setPlugins] = useState(PLUGINS)
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = ['All', ...Array.from(new Set(PLUGINS.map((p) => p.category)))]

  const filtered = plugins.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    return matchSearch && matchCat
  })

  const toggle = (id: string) => {
    setPlugins((prev) => prev.map((p) => p.id === id ? { ...p, installed: !p.installed } : p))
  }

  const installed = plugins.filter((p) => p.installed).length

  return (
    <div className="w-full max-w-[900px] flex flex-col gap-5 px-2 py-6 pb-10 mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-codebox-primary tracking-tight">Plugin Store</h2>
          <p className="text-[13px] text-codebox-secondary mt-0.5">{installed} installed · {plugins.length} available</p>
        </div>
        <button className="flex items-center gap-1.5 text-[12.5px] text-codebox-secondary bg-codebox-card border border-codebox-border px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-codebox-muted" />
        <input
          className="w-full bg-codebox-input border border-codebox-border text-codebox-primary pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none focus:border-codebox-secondary placeholder:text-codebox-muted"
          placeholder="Search plugins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer border transition-all ${
              activeCategory === cat
                ? 'bg-codebox-blue/15 border-codebox-blue/40 text-codebox-blue'
                : 'border-codebox-border text-codebox-secondary hover:border-codebox-secondary bg-transparent'
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((plugin) => (
          <div key={plugin.id} className="bg-codebox-card border border-codebox-border rounded-xl p-4 flex items-center gap-4 hover:border-codebox-secondary transition-colors">
            <div className="w-11 h-11 rounded-xl bg-codebox-input flex items-center justify-center text-xl flex-shrink-0">
              {plugin.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-codebox-primary">{plugin.name}</span>
                <span className="text-[10.5px] px-1.5 py-0.5 rounded-full border border-codebox-border text-codebox-muted">
                  v{plugin.version}
                </span>
                {plugin.author === 'Eburon Labs' && (
                  <span className="flex items-center gap-1 text-[10.5px] text-codebox-blue">
                    <Shield size={10} /> Official
                  </span>
                )}
              </div>
              <p className="text-[12px] text-codebox-secondary mt-0.5 truncate">{plugin.description}</p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-codebox-muted">
                <span className="flex items-center gap-1"><Star size={10} /> {plugin.rating}</span>
                <span className="flex items-center gap-1"><Download size={10} /> {plugin.downloads.toLocaleString()}</span>
                <span className="px-1.5 py-0.5 bg-codebox-input rounded text-codebox-secondary">{plugin.category}</span>
              </div>
            </div>
            <button
              className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium cursor-pointer border flex items-center gap-1.5 transition-all flex-shrink-0 ${
                plugin.installed
                  ? 'border-codebox-border text-codebox-secondary hover:border-codebox-red hover:text-codebox-red bg-transparent'
                  : 'bg-codebox-blue text-white border-transparent hover:bg-blue-500'
              }`}
              onClick={() => toggle(plugin.id)}
            >
              {plugin.installed ? (
                <><Zap size={13} /> Installed</>
              ) : (
                <><Download size={13} /> Install</>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
