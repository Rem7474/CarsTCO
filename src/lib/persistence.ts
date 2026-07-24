import type { ScenarioConfig } from '../types/scenario'
import { MAX_VEHICLES, MIN_VEHICLES } from '../data/defaults'

const STORAGE_KEY = 'carstco.scenario.v1'
const URL_PARAM = 's'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function looksLikeCashFinancing(f: Record<string, unknown>): boolean {
  return isFiniteNumber(f.carteGriseCost) && isFiniteNumber(f.resaleValueAtEnd)
}

function looksLikeCreditFinancing(f: Record<string, unknown>): boolean {
  return (
    isFiniteNumber(f.downPayment) &&
    isFiniteNumber(f.annualInterestRatePct) &&
    isFiniteNumber(f.loanDurationMonths) &&
    isFiniteNumber(f.carteGriseCost) &&
    isFiniteNumber(f.resaleValueAtEnd)
  )
}

/** Fields shared by LOA and LDD (`LeaseFinancingBase` in types/scenario.ts). */
function looksLikeLeaseBase(f: Record<string, unknown>): boolean {
  return (
    isFiniteNumber(f.firstPayment) &&
    isFiniteNumber(f.monthlyPayment) &&
    isFiniteNumber(f.contractDurationMonths) &&
    isFiniteNumber(f.contractualAnnualMileageKm) &&
    isFiniteNumber(f.excessMileageCostPerKm) &&
    isFiniteNumber(f.underMileageRefundPerKm) &&
    isFiniteNumber(f.restitutionFees) &&
    typeof f.maintenanceIncluded === 'boolean' &&
    typeof f.insuranceIncluded === 'boolean'
  )
}

function looksLikeLoaFinancing(f: Record<string, unknown>): boolean {
  return (
    looksLikeLeaseBase(f) &&
    (f.endOfContractAction === 'renew' || f.endOfContractAction === 'buyout' || f.endOfContractAction === 'return') &&
    isFiniteNumber(f.buybackValue) &&
    isFiniteNumber(f.estimatedResaleValueAfterBuyout) &&
    typeof f.autoCalculate === 'boolean' &&
    isFiniteNumber(f.annualInterestRatePct)
  )
}

function looksLikeLddFinancing(f: Record<string, unknown>): boolean {
  return looksLikeLeaseBase(f) && (f.endOfContractAction === 'renew' || f.endOfContractAction === 'return')
}

function looksLikeFinancing(value: unknown): boolean {
  if (!isPlainObject(value)) return false
  switch (value.mode) {
    case 'cash':
      return looksLikeCashFinancing(value)
    case 'credit':
      return looksLikeCreditFinancing(value)
    case 'loa':
      return looksLikeLoaFinancing(value)
    case 'ldd':
      return looksLikeLddFinancing(value)
    default:
      return false
  }
}

function looksLikeThermalEnergy(e: Record<string, unknown>): boolean {
  return isFiniteNumber(e.consumptionL100km) && isFiniteNumber(e.fuelPricePerLiter) && isFiniteNumber(e.annualPriceInflationPct)
}

function looksLikeElectricEnergy(e: Record<string, unknown>): boolean {
  return (
    isFiniteNumber(e.consumptionKwh100km) &&
    isFiniteNumber(e.homePricePerKwh) &&
    isFiniteNumber(e.publicPricePerKwh) &&
    isFiniteNumber(e.homeChargeSharePct) &&
    isFiniteNumber(e.annualPriceInflationPct)
  )
}

function looksLikeVehicle(value: unknown): boolean {
  if (!isPlainObject(value)) return false
  if (
    typeof value.id !== 'string' ||
    typeof value.label !== 'string' ||
    (value.energyType !== 'thermal' && value.energyType !== 'electric') ||
    !isFiniteNumber(value.purchasePrice) ||
    !isFiniteNumber(value.maintenanceAnnualCost) ||
    !isFiniteNumber(value.tireSetPrice) ||
    !isFiniteNumber(value.tireLifespanKm) ||
    !isFiniteNumber(value.insuranceAnnualPremium)
  ) {
    return false
  }
  if (!looksLikeFinancing(value.financing)) return false
  if (!isPlainObject(value.energy)) return false
  if (value.energyType === 'thermal' ? !looksLikeThermalEnergy(value.energy) : !looksLikeElectricEnergy(value.energy)) {
    return false
  }
  if (!isPlainObject(value.fiscal) || !isFiniteNumber(value.fiscal.malus) || !isFiniteNumber(value.fiscal.bonus)) {
    return false
  }
  return true
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

  if (!isFiniteNumber(candidate.holdingYears) || candidate.holdingYears <= 0) return null
  if (!isFiniteNumber(candidate.annualMileageKm) || candidate.annualMileageKm < 0) return null
  if (!Array.isArray(candidate.vehicles)) return null
  if (candidate.vehicles.length < MIN_VEHICLES || candidate.vehicles.length > MAX_VEHICLES) return null
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

/**
 * Strips the `s` param from the address bar once its scenario has been read into app state.
 * Without this, the URL keeps winning over localStorage on every reload (see
 * `loadScenarioFromUrl` in `initialScenario`), silently discarding any edits made after
 * opening a shared link.
 */
export function clearScenarioUrlParam(): void {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(URL_PARAM)) return
  url.searchParams.delete(URL_PARAM)
  window.history.replaceState({}, '', url.toString())
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
