import { useRef, useState } from 'react'
import type { ScenarioConfig } from '../types/scenario'
import { buildShareUrl, downloadScenarioAsJson, parseScenarioFromJsonText } from '../lib/persistence'

interface Props {
  scenario: ScenarioConfig
  onImport: (scenario: ScenarioConfig) => void
}

export function ExportImport({ scenario, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleShare = async () => {
    const url = buildShareUrl(scenario)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copiez ce lien :', url)
    }
  }

  const handleImportClick = () => {
    setImportError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseScenarioFromJsonText(String(reader.result))
      if (parsed) {
        onImport(parsed)
        setImportError(null)
      } else {
        setImportError("Ce fichier ne ressemble pas à un scénario CarsTCO valide.")
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        onClick={() => downloadScenarioAsJson(scenario)}
      >
        Exporter (JSON)
      </button>
      <button
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        onClick={handleImportClick}
      >
        Importer (JSON)
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
      <button
        className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
        onClick={handleShare}
      >
        {copied ? 'Lien copié !' : 'Partager le scénario'}
      </button>
      {importError && <span className="text-xs text-red-600 dark:text-red-400">{importError}</span>}
    </div>
  )
}
