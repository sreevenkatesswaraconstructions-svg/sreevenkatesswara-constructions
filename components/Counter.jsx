import { useEffect, useState } from 'react'

export default function Counter({
  to = 0,
  label,
  suffix = '+',
  loading = false,
  className = '',
  valueClassName = '',
  labelClassName = '',
}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (loading) {
      setValue(0)
      return
    }

    const safeTarget = Math.max(0, to)
    let start = 0
    const duration = 1200
    const stepTime = Math.max(Math.floor(duration / Math.max(safeTarget, 1)), 10)
    const timer = setInterval(() => {
      start += Math.ceil(safeTarget / 20)
      if (start >= safeTarget) {
        start = safeTarget
        clearInterval(timer)
      }
      setValue(start)
    }, stepTime)

    return () => clearInterval(timer)
  }, [loading, to])

  return (
    <div className={`text-center ${className}`}>
      <div className={`text-5xl font-serif text-emerald ${valueClassName}`}>
        {loading ? '—' : value}
        {!loading && suffix}
      </div>
      <div className={`mt-3 uppercase tracking-[0.28em] text-sm text-gray-600 ${labelClassName}`}>{label}</div>
    </div>
  )
}
