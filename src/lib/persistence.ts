import type { ScenarioConfig } from '../types/scenario'

const STORAGE_KEY = 'carstco.scenario.v1'
const URL_PARAM = 's'

export function saveScenarioToLocalStorage(scenario: ScenarioConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario))
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — silently skip persistence.
  }
}

export function loadScenarioFromLocalStorage(): ScenarioConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ScenarioConfig
  } catch {
    return null
  }
}

export function encodeScenarioToUrlParam(scenario: ScenarioConfig): string {
  const json = JSON.stringify(scenario)
  return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))))
}

export function decodeScenarioFromUrlParam(encoded: string): ScenarioConfig | null {
  try {
    const binary = atob(encoded)
    const json = decodeURIComponent(
      Array.from(binary)
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as ScenarioConfig
  } catch {
    return null
  }
}

export function buildShareUrl(scenario: ScenarioConfig): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set(URL_PARAM, encodeScenarioToUrlParam(scenario))
  return url.toString()
}

export function loadScenarioFromUrl(): ScenarioConfig | null {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get(URL_PARAM)
  if (!encoded) return null
  return decodeScenarioFromUrlParam(encoded)
}

export function downloadScenarioAsJson(scenario: ScenarioConfig, filename = 'scenario-tco.json'): void {
  const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function parseScenarioFromJsonText(text: string): ScenarioConfig | null {
  try {
    return JSON.parse(text) as ScenarioConfig
  } catch {
    return null
  }
}
