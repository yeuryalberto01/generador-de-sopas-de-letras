import { AlertCircle, BookOpen, CheckCircle, Copy, Download, Edit, Eye, Loader, Plus, Trash2 } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI_TEXTS } from '../../constants/uiTexts';
import { AppContext } from '../../context/AppContext';
import { BookProject, BookTemplate, useBook } from '../../context/BookContext';
import { useTemaOperations } from '../../hooks/useTemaOperations';

// ==================== COMPONENTES ====================

function QuickTemaDialog({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (titulo: string, palabras: string[]) => void }) {
  const [titulo, setTitulo] = useState('');
  const [palabras, setPalabras] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !palabras.trim()) return;

    setIsCreating(true);
    try {
      const palabrasArray = palabras.split('\n').map(p => p.trim()).filter(p => p);
      await onCreate(titulo.trim(), palabrasArray);
      setTitulo('');
      setPalabras('');
    } catch (error) {
      console.error('Error creando tema:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Crear Tema Rápido
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Tema
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Animales de la Selva"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Palabras (una por línea)
              </label>
              <textarea
                value={palabras}
                onChange={(e) => setPalabras(e.target.value)}
                placeholder="tigre&#10;mono&#10;jaguar&#10;leon"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!titulo.trim() || !palabras.trim() || isCreating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creando...' : 'Crear Tema'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CreationProgress({ isVisible, progress, message }: { isVisible: boolean; progress: { current: number; total: number; message: string }; message?: string }) {
  if (!isVisible) return null;

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Creando Libro
          </h3>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{progress.message}</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {progress.current} de {progress.total} pasos completados
        </p>
      </div>
    </div>
  );
}

function ValidationErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h4 className="text-sm font-medium text-red-800">
          Errores de validación
        </h4>
      </div>
      <ul className="text-sm text-red-700 space-y-1">
        {errors.map((error, index) => (
          <li key={index}>• {error}</li>
        ))}
      </ul>
    </div>
  );
}

function BookPreview({ project, isOpen, onClose }: { project: BookProject | null; isOpen: boolean; onClose: () => void }) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [project]);

  if (!isOpen || !project) return null;

  const currentPage = project.pages[currentPageIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Vista Previa: {project.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              ← Anterior
            </button>

            <span className="text-sm text-gray-600">
              Página {currentPageIndex + 1} de {project.pages.length}
            </span>

            <button
              onClick={() => setCurrentPageIndex(prev => Math.min(project.pages.length - 1, prev + 1))}
              disabled={currentPageIndex === project.pages.length - 1}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              Siguiente →
            </button>
          </div>

          {/* Page Content */}
          {currentPage ? (
            <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
              <h4 className="text-xl font-bold text-center mb-4">
                {currentPage.title}
              </h4>

              {/* Puzzle Grid Preview */}
              {currentPage.puzzleData?.grid && (
                <div className="flex justify-center mb-4">
                  <div
                    className="inline-grid gap-px bg-gray-300 border-2 border-gray-400"
                    style={{
                      gridTemplateColumns: `repeat(${currentPage.puzzleData.config?.cols || 10}, 20px)`,
                      gridTemplateRows: `repeat(${currentPage.puzzleData.config?.rows || 10}, 20px)`
                    }}
                  >
                    {currentPage.puzzleData.grid.flat().map((letter: string, index: number) => (
                      <div
                        key={index}
                        className="bg-white flex items-center justify-center text-xs font-bold border border-gray-300"
                        style={{ width: '20px', height: '20px' }}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Words List */}
              {currentPage.puzzleData?.words && (
                <div className="border-t pt-4">
                  <h5 className="font-semibold mb-2">Palabras a encontrar:</h5>
                  <div className="flex flex-wrap gap-2">
                    {currentPage.puzzleData.words.map((word: any, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {word.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay contenido en esta página</p>
            </div>
          )}

          {/* Book Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Plantilla:</span>
                <p className="text-gray-900">{project.template.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Temas:</span>
                <p className="text-gray-900">{project.temaIds.length}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Páginas:</span>
                <p className="text-gray-900">{project.pages.length}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Creado:</span>
                <p className="text-gray-900">{new Date(project.metadata.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LibrosDashboard() {
  const navigate = useNavigate();
  const { currentProject, projects, templates, isCreating, creationProgress, createProject, loadProject, deleteProject, duplicateProject, validateBookData, autoSaveEnabled, setAutoSaveEnabled } = useBook();
  const { temas, createNewTema } = useContext(AppContext);
  const temaOps = useTemaOperations();

  console.log('LibrosDashboard - Temas cargados:', temas);
  console.log('LibrosDashboard - Número de temas:', temas.length);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewProject, setPreviewProject] = useState<BookProject | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BookTemplate | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showQuickTemaDialog, setShowQuickTemaDialog] = useState(false);

  // Auto-open create dialog if no projects exist and there are temas to use
  useEffect(() => {
    if (projects.length === 0 && temas.length > 0 && !showCreateDialog) {
      setShowCreateDialog(true);
    }
  }, [projects.length, temas.length, showCreateDialog]);

  // Check if themes exist before allowing book creation
  useEffect(() => {
    if (temas.length === 0 && showCreateDialog) {
      // Close the dialog and show a message
      setShowCreateDialog(false);
      // We'll handle this in the UI instead of redirecting automatically
    }
  }, [temas.length, showCreateDialog]);

  // Función para crear tema rápido
  const handleQuickCreateTema = async (titulo: string, palabras: string[]) => {
    try {
      // Crear el tema usando el contexto (que incluye palabras)
      const result = await createNewTema({ nombre: titulo });
      if (result.ok && result.data) {
        // Actualizar las palabras del tema recién creado
        await temaOps.updateTemaPalabras(result.data.id, palabras);
        setShowQuickTemaDialog(false);

        // Si estamos en el diálogo de creación de libro, agregar automáticamente el tema
        if (showCreateDialog && result.data.id) {
          // Esto se maneja en el componente CreateProjectDialog
        }
      }
    } catch (error) {
      console.error('Error creando tema rápido:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                Creador de Libros de Sopas de Letras
              </h1>
              <p className="text-gray-600">
                Crea libros completos organizando tus puzzles en páginas profesionales
              </p>
            </div>

            {/* Auto-save indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-save"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="auto-save" className="text-sm text-gray-600">
                  Auto-guardado
                </label>
              </div>

              {autoSaveEnabled && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Activo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          {temas.length === 0 ? (
            /* No themes available - show message to create themes first */
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <BookOpen className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                ¡Bienvenido al módulo de Libros!
              </h3>
              <p className="text-yellow-700 mb-4">
                Para crear tu primer libro necesitas al menos un tema con palabras.
                Los temas son colecciones de palabras que se convertirán en sopas de letras.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/temas')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Crear Mi Primer Tema
                </button>
                <button
                  onClick={() => setShowQuickTemaDialog(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  Tema Rápido
                </button>
              </div>
            </div>
          ) : (
            /* Themes available - show normal actions */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear Nuevo Libro
              </button>

              <button
                onClick={() => navigate('/temas')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Gestionar Temas
              </button>

              {currentProject && (
                <button
                  onClick={() => navigate('/diagramacion')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  Diagramar Libro
                </button>
              )}
            </div>
          )}
        </div>

        {/* Current Project */}
        {currentProject && (
          <div className="mb-8">
            <ProjectCard
              project={currentProject}
              isActive={true}
              onPreview={(project) => {
                setPreviewProject(project);
                setShowPreview(true);
              }}
            />
          </div>
        )}

        {/* Projects Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Mis Libros ({projects.length})
          </h2>

          {projects.length === 0 ? (
            temas.length === 0 ? (
              /* No themes available */
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay libros disponibles
                </h3>
                <p className="text-gray-500">
                  Crea primero algunos temas para poder generar libros con sopas de letras
                </p>
              </div>
            ) : (
              /* Themes available but no projects */
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¡Crea tu primer libro!
                </h3>
                <p className="text-gray-500 mb-4">
                  Organiza tus puzzles en libros profesionales con páginas, títulos e índices
                </p>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crear Primer Libro
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isActive={currentProject?.id === project.id}
                  onPreview={(project) => {
                    setPreviewProject(project);
                    setShowPreview(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Create Project Dialog */}
        {showCreateDialog && (
          <CreateProjectDialog
            templates={templates}
            temas={temas}
            onClose={() => setShowCreateDialog(false)}
            onCreate={createProject}
            onOpenQuickTemaDialog={() => setShowQuickTemaDialog(true)}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
          />
        )}

        {/* Creation Progress */}
        <CreationProgress
          isVisible={isCreating}
          progress={creationProgress}
        />

        {/* Book Preview */}
        <BookPreview
          project={previewProject}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewProject(null);
          }}
        />

        {/* Quick Tema Creation Dialog */}
        <QuickTemaDialog
          isOpen={showQuickTemaDialog}
          onClose={() => setShowQuickTemaDialog(false)}
          onCreate={handleQuickCreateTema}
        />
      </div>
    </div>
  );
}

function ProjectCard({ project, isActive, onPreview }: { project: BookProject; isActive: boolean; onPreview?: (project: BookProject) => void }) {
  const { loadProject, deleteProject, duplicateProject, exportBook } = useBook();

  const handleLoad = async () => {
    await loadProject(project.id);
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar este libro?')) {
      await deleteProject(project.id);
    }
  };

  const handleDuplicate = async () => {
    await duplicateProject(project.id);
  };

  const handleExport = async () => {
    try {
      const blob = await exportBook('pdf');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(UI_TEXTS.ERRORS.EXPORTING_BOOK);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 transition-all ${
      isActive ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {project.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {project.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{project.pages.length} páginas</span>
              <span>{project.temaIds.length} temas</span>
              <span>{project.template.category}</span>
            </div>
          </div>

          {isActive && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Activo
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleLoad}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            <Eye className="w-4 h-4" />
            Abrir
          </button>

          {onPreview && (
            <button
              onClick={() => onPreview(project)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              title="Vista Previa"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleDuplicate}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Duplicar"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Exportar"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateProjectDialog({
  templates,
  temas,
  onClose,
  onCreate,
  onOpenQuickTemaDialog,
  validationErrors,
  setValidationErrors
}: {
  templates: BookTemplate[];
  temas: any[];
  onClose: () => void;
  onCreate: (name: string, templateId: string, temaIds: string[], temasData?: any[]) => Promise<BookProject>;
  onOpenQuickTemaDialog: () => void;
  validationErrors: string[];
  setValidationErrors: (errors: string[]) => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemaIds, setSelectedTemaIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    // Limpiar errores previos
    setValidationErrors([]);

    // Validaciones básicas
    const errors: string[] = [];
    if (!projectName.trim()) {
      errors.push('El nombre del libro es obligatorio');
    }
    if (!selectedTemplateId) {
      errors.push('Debe seleccionar una plantilla');
    }
    // Nota: Ya no se requiere temas obligatoriamente - se pueden agregar después

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Obtener datos completos de los temas seleccionados
      const selectedTemasData = temas.filter(tema => selectedTemaIds.includes(tema.id));

      await onCreate(projectName, selectedTemplateId, selectedTemaIds, selectedTemasData);
      onClose();
    } catch (error: any) {
      setValidationErrors([error.message || 'Error al crear el proyecto']);
    }
  };

  const toggleTema = (temaId: string) => {
    setSelectedTemaIds(prev =>
      prev.includes(temaId)
        ? prev.filter(id => id !== temaId)
        : [...prev, temaId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Crear Nuevo Libro
          </h2>

          <ValidationErrors errors={validationErrors} />

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Información Básica</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Libro
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej: Sopas de Letras para Niños"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!projectName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Seleccionar Plantilla</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTemplateId === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{template.pageSize}</span>
                      <span>{template.layout.puzzlesPerPage} puzzles/página</span>
                      <span className="capitalize">{template.category}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedTemplateId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Tema Selection */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Seleccionar Temas (Opcional)</h3>
              <p className="text-gray-600 mb-4">
                Elige los temas que quieres incluir en tu libro, o crea uno nuevo
              </p>

              {/* Quick Actions */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={onOpenQuickTemaDialog}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Crear Tema Nuevo
                </button>
                <button
                  onClick={() => navigate('/temas')}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Gestionar Temas
                </button>
              </div>

              {/* Temas disponibles */}
              {temas.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg mb-6">
                  <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 mb-2">No hay temas disponibles</p>
                  <p className="text-sm text-gray-400">
                    Crea tu primer tema para empezar a construir libros
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto">
                  {temas.map(tema => (
                    <div
                      key={tema.id}
                      onClick={() => toggleTema(tema.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTemaIds.includes(tema.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTemaIds.includes(tema.id)}
                          onChange={() => {}} // Handled by onClick
                          className="rounded"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{tema.nombre}</h4>
                          <p className="text-sm text-gray-600">
                            {tema.palabras?.length || 0} palabras
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>{selectedTemaIds.length}</strong> tema(s) seleccionado(s).
                  {selectedTemaIds.length === 0 && " Puedes crear el libro vacío y agregar temas después."}
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Anterior
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creando...' : 'Crear Libro'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LibrosModule() {
  return <LibrosDashboard />;
}
