import React, { useEffect, useState } from 'react';
import { del, get, post, put } from '../../services/apiClient';

// Definición de los endpoints basados en el backend de FastAPI
const apiEndpoints = [
  { 
    id: 'health', 
    method: 'GET', 
    path: '/api/health', 
    description: 'Verifica el estado y la versión de la API.',
    params: []
  },
  { 
    id: 'list-temas', 
    method: 'GET', 
    path: '/api/temas', 
    description: 'Obtiene la lista completa de temas, ordenados por fecha de actualización.',
    params: []
  },
  {
    id: 'create-tema',
    method: 'POST',
    path: '/api/temas',
    description: 'Crea un nuevo tema. El nombre no puede existir previamente.',
    params: [],
    body: { nombre: 'string', descripcion: 'string', words: 'string[]' }
  },
  {
    id: 'update-tema',
    method: 'PUT',
    path: '/api/temas/{tema_id}',
    description: 'Actualiza un tema existente por su ID.',
    params: ['tema_id'],
    body: { nombre: 'string', descripcion: 'string', words: 'string[]' }
  },
  {
    id: 'delete-tema',
    method: 'DELETE',
    path: '/api/temas/{tema_id}',
    description: 'Elimina un tema por su ID.',
    params: ['tema_id']
  },
  {
    id: 'generate-puzzle',
    method: 'POST',
    path: '/api/diagramacion/generate',
    description: 'Genera una nueva sopa de letras a partir de un tema.',
    params: [],
    body: { tema_id: 'string', grid_size: 'string (ej: 15x15)', difficulty: 'string (easy, medium, hard)' }
  }
];

const MethodBadge = ({ method }) => {
  const colors = {
    GET: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    POST: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DELETE: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  return (
    <span className={`w-20 text-center font-bold text-sm px-2 py-1 rounded-md border ${colors[method] || 'bg-gray-500'}`}>
      {method}
    </span>
  );
};

const ApiInteractionPanel = ({ endpoint }) => {
  const [params, setParams] = useState({});
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setParams({});
    setBody(endpoint.body ? JSON.stringify(endpoint.body, null, 2) : '');
    setResponse(null);
  }, [endpoint]);

  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const executeApi = async () => {
    setLoading(true);
    setResponse(null);
    let path = endpoint.path;
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`{${key}}`, encodeURIComponent(value));
    });

    try {
      const apiMethods = {
        GET: get,
        POST: post,
        PUT: put,
        DELETE: del,
      };

      const methodFunc = apiMethods[endpoint.method];
      if (!methodFunc) throw new Error(`Método HTTP no soportado: ${endpoint.method}`);

      let res;
      if (endpoint.method === 'GET' || endpoint.method === 'DELETE') {
        res = await methodFunc(path);
      } else {
        const requestBody = JSON.parse(body);
        res = await methodFunc(path, requestBody);
      }

      setResponse({ 
        status: res.ok ? 'Success' : 'Error from API', 
        data: res.ok ? res.data : res.error 
      });

    } catch (error) {
      setResponse({ 
        status: 'Client Error', 
        data: { message: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800/50 rounded-lg h-full flex flex-col border border-gray-300 dark:border-slate-600 shadow-lg relative z-10">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{endpoint.id}</h2>
      <p className="text-gray-600 dark:text-slate-400 mt-2 mb-6">{endpoint.description}</p>

      <div className="flex-grow overflow-y-auto pr-2">
        {endpoint.params.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-slate-300 mb-2">Parámetros de Ruta</h3>
            {endpoint.params.map(p => (
              <input
                key={p}
                type="text"
                placeholder={p}
                onChange={e => handleParamChange(p, e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-gray-900 dark:text-slate-200 placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 relative z-20"
              />
            ))}
          </div>
        )}

        {endpoint.body && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-slate-300 mb-2">Cuerpo de la Solicitud (JSON)</h3>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-gray-900 dark:text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 relative z-20"
            />
          </div>
        )}

        <button
          onClick={executeApi}
          disabled={loading}
          className="w-full bg-sky-600 dark:bg-sky-700 hover:bg-sky-500 dark:hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed relative z-20"
        >
          {loading ? 'Ejecutando...' : 'Ejecutar'}
        </button>

        {response && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 dark:text-slate-300 mb-2">Respuesta del Servidor</h3>
            <div className={`p-4 rounded-md bg-white dark:bg-slate-900 border ${response.status === 'Success' ? 'border-emerald-500/30' : 'border-rose-500/30'} relative z-20`}>
              <p className={`font-bold ${response.status === 'Success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                Status: {response.status}
              </p>
              <pre className="text-xs text-gray-900 dark:text-slate-200 whitespace-pre-wrap break-all mt-2">{JSON.stringify(response.data, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PanelAPIs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(apiEndpoints[0]);

  return (
    <div className="w-full h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-300 flex font-sans">
      <aside className="w-1/3 h-full border-r border-gray-300 dark:border-slate-800 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-800">
        <div className="pb-4 border-b border-gray-300 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de APIs</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1 text-sm">Explorador interactivo para la API del generador de puzzles.</p>
        </div>
        <nav className="mt-4">
          <ul>
            {apiEndpoints.map(ep => (
              <li key={ep.id} className="mb-1">
                <button
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-md flex items-center gap-4 transition-colors relative z-20 ${selectedEndpoint.id === ep.id ? 'bg-sky-500/10 text-gray-900 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-800/50'}`}>
                  <MethodBadge method={ep.method} />
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{ep.path}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="w-2/3 h-full p-4 bg-white dark:bg-slate-900">
        {selectedEndpoint && <ApiInteractionPanel endpoint={selectedEndpoint} />}
      </main>
    </div>
  );
}
