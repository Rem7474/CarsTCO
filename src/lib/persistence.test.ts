import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildShareUrl,
  decodeScenarioFromUrlParam,
  encodeScenarioToUrlParam,
  loadScenarioFromLocalStorage,
  loadScenarioFromUrl,
  parseScenarioFromJsonText,
  saveScenarioToLocalStorage,
  validateScenario,
} from './persistence'
import { createDefaultScenario } from '../data/defaults'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState({}, '', '/')
})

describe('localStorage persistence', () => {
  it('round-trips a scenario through save/load', () => {
    const scenario = createDefaultScenario()
    saveScenarioToLocalStorage(scenario)

    const loaded = loadScenarioFromLocalStorage()
    expect(loaded).toEqual(scenario)
  })

  it('returns null when nothing has been saved', () => {
    expect(loadScenarioFromLocalStorage()).toBeNull()
  })
})

describe('URL param encoding', () => {
  it('round-trips a scenario (including accented labels) through encode/decode', () => {
    const scenario = createDefaultScenario()
    scenario.vehicles[0].label = 'Citadine électrique éàç'

    const encoded = encodeScenarioToUrlParam(scenario)
    const decoded = decodeScenarioFromUrlParam(encoded)

    expect(decoded).toEqual(scenario)
  })

  it('returns null for garbage input instead of throwing', () => {
    expect(decodeScenarioFromUrlParam('not-valid-base64!!!')).toBeNull()
  })

  it('builds a share URL carrying the scenario under the "s" query param', () => {
    const scenario = createDefaultScenario()
    const url = buildShareUrl(scenario)
    const parsed = new URL(url)

    expect(parsed.searchParams.has('s')).toBe(true)
    expect(decodeScenarioFromUrlParam(parsed.searchParams.get('s')!)).toEqual(scenario)
  })

  it('loadScenarioFromUrl reads the scenario back out of window.location.search', () => {
    const scenario = createDefaultScenario()
    const encoded = encodeScenarioToUrlParam(scenario)
    window.history.replaceState({}, '', `/?s=${encoded}`)

    expect(loadScenarioFromUrl()).toEqual(scenario)
  })

  it('loadScenarioFromUrl returns null when there is no "s" param', () => {
    window.history.replaceState({}, '', '/')
    expect(loadScenarioFromUrl()).toBeNull()
  })
})

describe('parseScenarioFromJsonText', () => {
  it('parses valid JSON', () => {
    const scenario = createDefaultScenario()
    expect(parseScenarioFromJsonText(JSON.stringify(scenario))).toEqual(scenario)
  })

  it('returns null for invalid JSON instead of throwing', () => {
    expect(parseScenarioFromJsonText('{not json')).toBeNull()
  })

  it('returns null for well-formed JSON that is not a valid scenario (regression: used to crash the app)', () => {
    expect(parseScenarioFromJsonText(JSON.stringify({ foo: 'bar', holdingYears: 'abc' }))).toBeNull()
  })
})

describe('validateScenario', () => {
  it('accepts a well-formed scenario', () => {
    const scenario = createDefaultScenario()
    expect(validateScenario(scenario)).toEqual(scenario)
  })

  it('migrates the legacy { vehicleA, vehicleB } shape to { vehicles: [...] }', () => {
    const scenario = createDefaultScenario()
    const [vehicleA, vehicleB] = scenario.vehicles
    const legacy = { holdingYears: scenario.holdingYears, annualMileageKm: scenario.annualMileageKm, vehicleA, vehicleB }

    expect(validateScenario(legacy)).toEqual(scenario)
  })

  it('rejects non-object input', () => {
    expect(validateScenario(null)).toBeNull()
    expect(validateScenario('scenario')).toBeNull()
    expect(validateScenario(42)).toBeNull()
  })

  it('rejects a scenario with fewer than 2 vehicles', () => {
    const scenario = createDefaultScenario()
    expect(validateScenario({ ...scenario, vehicles: [scenario.vehicles[0]] })).toBeNull()
  })

  it('rejects a scenario where a vehicle is missing required fields', () => {
    const scenario = createDefaultScenario()
    const brokenVehicle = { ...scenario.vehicles[0] } as Record<string, unknown>
    delete brokenVehicle.financing
    expect(validateScenario({ ...scenario, vehicles: [brokenVehicle, scenario.vehicles[1]] })).toBeNull()
  })
})
