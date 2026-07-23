import type { CSSProperties } from 'react'

const inputClass =
  'w-full rounded-[10px] border border-input-border bg-white px-3 py-[9px] text-sm text-ink outline-none focus:border-teal focus-visible:ring-2 focus-visible:ring-teal'

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  step?: number
  min?: number
  max?: number
  help?: string
}

export function NumberField({ label, value, onChange, suffix, step = 1, min = 0, max, help }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px]">
      <span className="font-semibold text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className={inputClass}
          value={Number.isNaN(value) ? '' : value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
          onFocus={(e) => e.target.select()}
        />
        {suffix && <span className="shrink-0 text-xs text-muted">{suffix}</span>}
      </div>
      {help && <span className="text-xs text-muted-2">{help}</span>}
    </label>
  )
}

interface SelectFieldProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  help?: string
  /** Keeps the field accessible while hiding the visible <span> label — used inside compact chip-style pickers. */
  visuallyHiddenLabel?: boolean
  /** Pill-style, single-line variant used inline in card headers. */
  compact?: boolean
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  help,
  visuallyHiddenLabel,
  compact,
}: SelectFieldProps<T>) {
  return (
    <label className={compact ? 'inline-flex flex-col items-start gap-1.5 text-[13px]' : 'flex flex-col gap-1.5 text-[13px]'}>
      <span className={visuallyHiddenLabel ? 'sr-only' : 'font-semibold text-ink-soft'}>{label}</span>
      <select
        className={compact ? 'w-auto self-start rounded-full border border-input-border bg-white px-3 py-[5px] text-[12.5px] font-semibold text-ink-soft outline-none focus-visible:ring-2 focus-visible:ring-teal' : inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {help && <span className="text-xs text-muted-2">{help}</span>}
    </label>
  )
}

interface CheckboxFieldProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  help?: string
}

export function CheckboxField({ label, checked, onChange, help }: CheckboxFieldProps) {
  return (
    <label className="flex items-start gap-2 text-[13px]">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-input-border text-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex flex-col">
        <span className="font-semibold text-ink-soft">{label}</span>
        {help && <span className="text-xs text-muted-2">{help}</span>}
      </span>
    </label>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  visuallyHiddenLabel?: boolean
  className?: string
  style?: CSSProperties
}

export function TextField({ label, value, onChange, visuallyHiddenLabel, className, style }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px]">
      <span className={visuallyHiddenLabel ? 'sr-only' : 'font-semibold text-ink-soft'}>{label}</span>
      <input
        type="text"
        className={className ?? inputClass}
        style={style}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
