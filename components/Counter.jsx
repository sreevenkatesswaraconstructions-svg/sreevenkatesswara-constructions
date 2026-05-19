import { useEffect, useState } from 'react'

export default function Counter({ to=0, label }){
  const [value, setValue] = useState(0)
  useEffect(()=>{
    let start = 0
    const duration = 1200
    const stepTime = Math.max(Math.floor(duration / to), 10)
    const timer = setInterval(()=>{
      start += Math.ceil(to/20)
      if(start >= to){
        start = to
        clearInterval(timer)
      }
      setValue(start)
    }, stepTime)
    return ()=> clearInterval(timer)
  },[to])
  return (
    <div className="text-center">
      <div className="text-3xl font-serif text-emerald">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}
