import { useRef, useState } from 'react'
import type { ScenarioConfig } from '../types/scenario'
import { buildShareUrl, downloadScenarioAsJson, parseScenarioFromJsonText } from '../lib/persistence'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  scenario: ScenarioConfig
  onImport: (scenario: ScenarioConfig) => void
}

export function ExportImport({ scenario, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<ScenarioConfig | null>(null)

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
        setPendingImport(parsed)
        setImportError(null)
      } else {
        setImportError("Ce fichier ne ressemble pas à un scénario CarsTCO valide.")
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const outlineButtonClass =
    'rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink-soft shadow-sm hover:bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-teal'

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button className={outlineButtonClass} onClick={() => downloadScenarioAsJson(scenario)}>
        Exporter
      </button>
      <button className={outlineButtonClass} onClick={handleImportClick}>
        Importer
      </button>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
      <button
        className="rounded-[10px] border-none bg-teal px-4 py-[9px] text-[13.5px] font-bold text-white shadow-sm hover:bg-teal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-dark"
        onClick={handleShare}
      >
        {copied ? 'Lien copié !' : 'Partager le scénario'}
      </button>
      {importError && <span className="text-xs text-red-text">{importError}</span>}

      <ConfirmDialog
        open={pendingImport !== null}
        title="Importer ce scénario ?"
        message="Le scénario en cours sera remplacé par celui du fichier importé. Cette action est irréversible."
        confirmLabel="Importer"
        onConfirm={() => {
          if (pendingImport) onImport(pendingImport)
          setPendingImport(null)
        }}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  )
}
