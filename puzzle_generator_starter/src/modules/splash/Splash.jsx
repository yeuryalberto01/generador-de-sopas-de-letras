import { motion } from 'framer-motion'
import NavigationMenu from '../../components/NavigationMenu'

export default function Splash(){
  const containerStyle = {
    minHeight:'100vh', width:'100%',
    display:'flex', alignItems:'center', justifyContent:'center',
    background:'radial-gradient(ellipse at top, #e2e8f0, #cbd5e1)'
  }

  return (
    <div style={containerStyle}>
      <motion.div
        initial={{ opacity:0, scale:0.98 }}
        animate={{ opacity:1, scale:1 }}
        transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
        style={{ width: '100%', maxWidth: '1400px', padding:'0 24px' }}
      >
        <div style={{ textAlign:'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize:48, fontWeight:800, letterSpacing:'-0.02em' }}>Puzzle Generator</h1>
          <p style={{ marginTop:12, color:'#334155' }}>Creador de Puzzles — rápido, modular y bonito.</p>
        </div>

        <NavigationMenu />

        <div style={{ textAlign:'center', marginTop: '20px' }}>
          <p style={{ color:'#64748b', fontSize: '14px' }}>
            💡 <strong>Flujo recomendado:</strong> Temas → Diagramación → APIs (opcional)
          </p>
        </div>
      </motion.div>
    </div>
  )
}
