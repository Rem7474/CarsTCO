import type { ReactNode } from 'react'

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

export function NumberField({ label, value, onChange, suffix, step = 1, min, max, help }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          value={Number.isNaN(value) ? '' : value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
        />
        {suffix && <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{suffix}</span>}
      </div>
      {help && <span className="text-xs text-slate-400 dark:text-slate-500">{help}</span>}
    </label>
  )
}

interface SelectFieldProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  help?: string
}

export function SelectField<T extends string>({ label, value, onChange, options, help }: SelectFieldProps<T>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <select
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {help && <span className="text-xs text-slate-400 dark:text-slate-500">{help}</span>}
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
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex flex-col">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        {help && <span className="text-xs text-slate-400 dark:text-slate-500">{help}</span>}
      </span>
    </label>
  )
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function TextField({ label, value, onChange }: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <input
        type="text"
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

interface SectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: ReactNode
}

export function Section({ title, children, defaultOpen = true, icon }: SectionProps) {
  return (
    <details
      className="group rounded-lg border border-slate-200 bg-white open:shadow-sm dark:border-slate-700 dark:bg-slate-900"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 dark:border-slate-800">
        {children}
      </div>
    </details>
  )
}
