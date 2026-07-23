import type { ScenarioConfig } from '../types/scenario'

const STORAGE_KEY = 'carstco.scenario.v1'
const URL_PARAM = 's'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function looksLikeVehicle(value: unknown): boolean {
  if (!isPlainObject(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    (value.energyType === 'thermal' || value.energyType === 'electric') &&
    typeof value.purchasePrice === 'number' &&
    isPlainObject(value.financing) &&
    typeof (value.financing as Record<string, unknown>).mode === 'string' &&
    isPlainObject(value.energy) &&
    typeof value.maintenanceAnnualCost === 'number' &&
    typeof value.tireSetPrice === 'number' &&
    typeof value.tireLifespanKm === 'number' &&
    typeof value.insuranceAnnualPremium === 'number' &&
    isPlainObject(value.fiscal)
  )
}

/** Upgrades the legacy { vehicleA, vehicleB } shape (pre-N-vehicle) to { vehicles: [...] }. */
function migrateLegacyShape(raw: Record<string, unknown>): Record<string, unknown> {
  if ('vehicles' in raw) return raw
  if ('vehicleA' in raw && 'vehicleB' in raw) {
    const { vehicleA, vehicleB, ...rest } = raw
    return { ...rest, vehicles: [vehicleA, vehicleB] }
  }
  return raw
}

/**
 * Parses and validates arbitrary input (imported JSON, a decoded share link, whatever was
 * last saved to localStorage) into a trustworthy ScenarioConfig. Returns null instead of
 * throwing so callers can fall back to a known-good scenario rather than crash the app.
 */
export function validateScenario(raw: unknown): ScenarioConfig | null {
  if (!isPlainObject(raw)) return null
  const candidate = migrateLegacyShape(raw)

  if (typeof candidate.holdingYears !== 'number' || !Number.isFinite(candidate.holdingYears)) return null
  if (typeof candidate.annualMileageKm !== 'number' || !Number.isFinite(candidate.annualMileageKm)) return null
  if (!Array.isArray(candidate.vehicles) || candidate.vehicles.length < 2) return null
  if (!candidate.vehicles.every(looksLikeVehicle)) return null

  return candidate as unknown as ScenarioConfig
}

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
    return validateScenario(JSON.parse(raw))
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
    return validateScenario(JSON.parse(json))
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
    return validateScenario(JSON.parse(text))
  } catch {
    return null
  }
}
