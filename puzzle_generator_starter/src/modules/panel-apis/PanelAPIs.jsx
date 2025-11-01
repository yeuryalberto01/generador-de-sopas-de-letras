import { useCallback, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Importar estilos de Tailwind
import '../../index.css'
import QuickNav from '../../components/QuickNav'

// Nodos iniciales representando las APIs actuales
const initialNodes = [
  {
    id: 'health',
    type: 'default',
    position: { x: 250, y: 25 },
    data: {
      label: 'API Health',
      method: 'GET',
      endpoint: '/api/health',
      description: 'Verificación de estado del servidor'
    },
    style: {
      background: '#10b981',
      color: 'white',
      border: '2px solid #059669',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      fontWeight: 'bold'
    }
  },
  {
    id: 'temas-list',
    type: 'default',
    position: { x: 100, y: 150 },
    data: {
      label: 'Listar Temas',
      method: 'GET',
      endpoint: '/api/temas',
      description: 'Obtener lista de temas'
    },
    style: {
      background: '#3b82f6',
      color: 'white',
      border: '2px solid #2563eb',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      fontWeight: 'bold'
    }
  },
  {
    id: 'temas-create',
    type: 'default',
    position: { x: 400, y: 150 },
    data: {
      label: 'Crear Tema',
      method: 'POST',
      endpoint: '/api/temas',
      description: 'Crear nuevo tema'
    },
    style: {
      background: '#f59e0b',
      color: 'white',
      border: '2px solid #d97706',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      fontWeight: 'bold'
    }
  },
  {
    id: 'grabacion',
    type: 'default',
    position: { x: 250, y: 275 },
    data: {
      label: 'API Grabación',
      method: 'POST',
      endpoint: '/api/grabacion',
      description: 'Procesar grabación de audio'
    },
    style: {
      background: '#8b5cf6',
      color: 'white',
      border: '2px solid #7c3aed',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      fontWeight: 'bold'
    }
  }
]

// Conexiones iniciales
const initialEdges = [
  {
    id: 'temas-to-grabacion',
    source: 'temas-list',
    target: 'grabacion',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    label: 'usa temas'
  }
]

export default function PanelAPIs() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodes, setSelectedNodes] = useState([])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      label: 'conectado'
    }, eds)),
    [setEdges]
  )

  const onNodesSelect = useCallback((params) => {
    setSelectedNodes(params.nodes)
  }, [])

  const addNewAPI = () => {
    const newNode = {
      id: `api-${Date.now()}`,
      type: 'default',
      position: {
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50
      },
      data: {
        label: 'Nueva API',
        method: 'GET',
        endpoint: '/api/nueva',
        description: 'Descripción de la nueva API'
      },
      style: {
        background: '#6b7280',
        color: 'white',
        border: '2px solid #4b5563',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    }
    setNodes((nds) => [...nds, newNode])
  }

  const deleteSelected = () => {
    const selectedIds = selectedNodes.map(node => node.id)
    setNodes((nds) => nds.filter(node => !selectedIds.includes(node.id)))
    setEdges((eds) => eds.filter(edge =>
      !selectedIds.includes(edge.source) && !selectedIds.includes(edge.target)
    ))
    setSelectedNodes([])
  }

  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800">Panel de APIs</h1>
        <p className="text-gray-600 mt-1">
          Visualiza y gestiona las conexiones entre APIs del sistema
        </p>
      </div>

      <div className="relative w-full" style={{ height: 'calc(100vh - 80px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onNodesSelect}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              switch (node.data.method) {
                case 'GET': return '#10b981'
                case 'POST': return '#f59e0b'
                default: return '#6b7280'
              }
            }}
          />
          <Background variant="dots" gap={12} size={1} />

          <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Herramientas</h3>

              <button
                onClick={addNewAPI}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ➕ Agregar API
              </button>

              {selectedNodes.length > 0 && (
                <button
                  onClick={deleteSelected}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  🗑️ Eliminar Seleccionados ({selectedNodes.length})
                </button>
              )}

              <div className="text-xs text-gray-600 space-y-1">
                <p>• Arrastra para mover nodos</p>
                <p>• Conecta nodos arrastrando desde los puntos</p>
                <p>• Selecciona múltiples nodos con Ctrl+Click</p>
              </div>
            </div>
          </Panel>

          <Panel position="bottom-left" className="bg-white p-4 rounded-lg shadow-lg border max-w-md">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Leyenda</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>GET</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>POST</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Grabación</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span>Nueva API</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>

        {/* Navegación rápida */}
        <QuickNav />
      </div>
    </div>
  )
}