import { useEffect } from 'react'
import { useStore } from '@/store'

export function useKeyboardShortcuts() {
  const store = useStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      // Sidebar
      if (meta && (e.key === 'b' || e.key === '\\')) { e.preventDefault(); store.toggleSidebar() }
      // Terminal
      if (meta && e.key === 'j') { e.preventDefault(); store.toggleTerminal() }
      // Command palette (⌘K) — handled in CommandPalette component; also open new thread when palette closed
      if (meta && e.key === 'k') {
        e.preventDefault()
        if (!store.isCommandPaletteOpen) store.setCommandPaletteOpen(true)
      }
      // Settings
      if (meta && e.key === ',') { e.preventDefault(); store.setActiveView('settings') }
      // Theme toggle
      if (meta && e.key === 't') { e.preventDefault(); store.toggleTheme() }
      // New session
      if (meta && e.key === 'n') { e.preventDefault(); store.setActiveView('new-thread'); store.setActiveThread(null) }
      // Voice orb (⌘.)
      if (meta && e.key === '.') { e.preventDefault(); store.setActiveView('voice') }
      // Ctrl+M — toggle voice orb
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault()
        store.toggleOrb()
      }

      if (e.key === 'Escape') {
        if (store.isCommandPaletteOpen) {
          store.setCommandPaletteOpen(false)
          store.setGlobalSearch('')
        } else if (store.isOrbConnected) {
          store.toggleOrbConnection()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [store])
}
