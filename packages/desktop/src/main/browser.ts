import { exec } from 'child_process'
import { shell } from 'electron'

export async function openInChrome(url: string): Promise<void> {
  const platform = process.platform
  const candidates =
    platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium']
      : platform === 'win32'
        ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe']
        : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']

  for (const cmd of candidates) {
    try {
      await new Promise<void>((resolve, reject) => {
        exec(`"${cmd}" "${url}"`, (err) => (err ? reject(err) : resolve()))
      })
      return
    } catch {
      // try next candidate
    }
  }

  // Fallback to OS default browser
  shell.openExternal(url)
}