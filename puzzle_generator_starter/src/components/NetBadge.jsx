import { useEffect, useState } from 'react'
import { checkHealth } from '../services/health'

export default function NetBadge(){
  const [state, setState] = useState({ online:false, version:undefined })
  useEffect(() => {
    let alive = true
    const run = async () => { const r = await checkHealth(); if (alive) setState(r) }
    run()
    const id = setInterval(run, 30000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  const cls = state.online ? 'bg-green-600' : 'bg-yellow-600'
  const txt = state.online ? `Conectado v${state.version ?? '—'}` : 'Sin conexión'
  const style = {
    position:'fixed', top:12, right:12, color:'#fff',
    padding:'6px 12px', borderRadius:999, boxShadow:'0 2px 10px rgba(0,0,0,.2)',
    backgroundColor: state.online ? '#16a34a' : '#ca8a04', fontSize:13
  }
  return (
    <div role="status" aria-live="polite" style={style}>{txt}</div>
  )
}
