import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  className?: string
  children: ReactNode
}

/**
 * Wraps a wide table in a horizontally-scrollable card. On mobile, where the
 * table overflows, shows a fading edge hint so a second/third column being
 * clipped doesn't silently go unnoticed — it disappears once scrolled to the end.
 */
export function ScrollableTableCard({ className = '', children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const scrollable = el.scrollWidth > el.clientWidth + 1
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
      setShowHint(scrollable && !atEnd)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(el)
    window.addEventListener('resize', update)

    return () => {
      el.removeEventListener('scroll', update)
      resizeObserver.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="relative">
      <div ref={scrollRef} className={`overflow-x-auto rounded-[20px] border border-border bg-white ${className}`}>
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-[20px] bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ${
          showHint ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
