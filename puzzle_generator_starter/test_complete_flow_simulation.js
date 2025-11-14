// Simulación completa del flujo frontend-backend para creación de libros
// Ejecutar con: node test_complete_flow_simulation.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== SIMULACIÓN DE BACKEND ====================

class MockBackendAPI {
  constructor() {
    this.temas = [
      {
        "id": "33682b77-a16e-4ffd-983f-3401f49a27ff",
        "nombre": "Animales Salvajes",
        "descripcion": "Tema sobre animales del safari",
        "words": ["leon", "tigre", "elefante", "jirafa"],
        "updated_at": "2025-11-03T01:47:56.822053+00:00"
      },
      {
        "id": "c8f682ab-4f47-4b62-8696-64030827f79f",
        "nombre": "Animales del Desierto",
        "descripcion": "Tema sobre animales del desierto",
        "words": ["camello", "escorpion", "lagarto", "buho"],
        "updated_at": "2025-11-03T01:51:32.192852+00:00"
      },
      {
        "id": "4e1e1df3-5faa-4bbe-bfae-07118049e1c5",
        "nombre": "Frutas Tropicales",
        "descripcion": "Frutas deliciosas de climas cálidos",
        "words": ["mango", "piña", "coco", "papaya", "guayaba"],
        "updated_at": "2025-11-11T08:30:00.000000+00:00"
      }
    ];
  }

  // Simular endpoint GET /api/temas
  async getTemas() {
    console.log('🔄 BACKEND: Consultando temas disponibles...');
    await this.simulateDelay(100); // Simular latencia de red
    console.log(`✅ BACKEND: Retornando ${this.temas.length} temas`);
    return { data: this.temas, status: 200 };
  }

  // Simular endpoint GET /api/temas/:id
  async getTemaById(id) {
    console.log(`🔄 BACKEND: Consultando tema específico: ${id}`);
    await this.simulateDelay(50);
    const tema = this.temas.find(t => t.id === id);
    if (!tema) {
      throw new Error(`Tema con ID ${id} no encontrado`);
    }
    console.log(`✅ BACKEND: Tema encontrado: ${tema.nombre}`);
    return { data: tema, status: 200 };
  }

  // Simular endpoint POST /api/puzzles/generate
  async generatePuzzle(temaId, config = {}) {
    console.log(`🔄 BACKEND: Generando puzzle para tema: ${temaId}`);
    await this.simulateDelay(500); // Generación toma tiempo

    const tema = this.temas.find(t => t.id === temaId);
    if (!tema) {
      throw new Error(`Tema no encontrado: ${temaId}`);
    }

    // Simular algoritmo de generación
    const gridSize = config.gridSize || 15;
    const grid = this.generateMockGrid(gridSize, tema.words);

    const puzzle = {
      id: `puzzle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      temaId,
      temaNombre: tema.nombre,
      grid,
      words: tema.words.map(word => ({
        text: word,
        positions: this.generateMockPositions(word, gridSize)
      })),
      config: {
        rows: gridSize,
        cols: gridSize,
        allowDiagonal: true,
        allowReverse: true,
        fillWithRandom: true
      },
      stats: {
        totalWords: tema.words.length,
        placedWords: tema.words.length,
        successRate: 100,
        generationTime: 450
      },
      createdAt: new Date().toISOString()
    };

    console.log(`✅ BACKEND: Puzzle generado exitosamente (${gridSize}x${gridSize})`);
    return { data: puzzle, status: 201 };
  }

  generateMockGrid(size, words) {
    // Crear grid con letras aleatorias
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const grid = [];

    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        row.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
      }
      grid.push(row);
    }

    // Colocar algunas palabras reales (simplificado)
    words.forEach((word, index) => {
      if (index < 3) { // Solo colocar las primeras 3 palabras para simplificar
        const wordUpper = word.toUpperCase();
        const startRow = Math.floor(Math.random() * (size - wordUpper.length));
        const startCol = Math.floor(Math.random() * (size - wordUpper.length));

        for (let k = 0; k < wordUpper.length; k++) {
          grid[startRow][startCol + k] = wordUpper[k];
        }
      }
    });

    return grid;
  }

  generateMockPositions(word, gridSize) {
    // Generar posiciones simuladas
    const positions = [];
    for (let i = 0; i < word.length; i++) {
      positions.push({
        row: Math.floor(Math.random() * gridSize),
        col: Math.floor(Math.random() * gridSize),
        letter: word[i].toUpperCase()
      });
    }
    return positions;
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== SIMULACIÓN DE FRONTEND ====================

class MockFrontend {
  constructor(backendAPI) {
    this.backendAPI = backendAPI;
    this.appState = {
      temas: [],
      selectedTemas: [],
      currentBook: null,
      isLoading: false,
      errors: []
    };
  }

  // Paso 1: Cargar temas desde el backend
  async loadTemas() {
    console.log('\n📱 FRONTEND: Paso 1 - Cargando temas...');
    this.setLoading(true);

    try {
      const response = await this.backendAPI.getTemas();
      this.appState.temas = response.data;
      console.log(`✅ FRONTEND: ${this.appState.temas.length} temas cargados`);
      this.setLoading(false);
      return true;
    } catch (error) {
      this.handleError('Error al cargar temas', error);
      return false;
    }
  }

  // Paso 2: Usuario selecciona temas
  selectTemas(temaIds) {
    console.log('\n📱 FRONTEND: Paso 2 - Usuario selecciona temas...');
    const selectedTemas = this.appState.temas.filter(tema =>
      temaIds.includes(tema.id)
    );

    if (selectedTemas.length === 0) {
      this.handleError('Selección inválida', 'Debe seleccionar al menos un tema');
      return false;
    }

    this.appState.selectedTemas = selectedTemas;
    console.log(`✅ FRONTEND: ${selectedTemas.length} temas seleccionados:`);
    selectedTemas.forEach(tema => {
      console.log(`   - ${tema.nombre} (${tema.words.length} palabras)`);
    });
    return true;
  }

  // Paso 3: Validar selección antes de crear libro
  validateBookCreation(name, templateId) {
    console.log('\n📱 FRONTEND: Paso 3 - Validando datos de creación...');

    const errors = [];

    if (!name?.trim()) {
      errors.push('El nombre del libro es obligatorio');
    }

    if (!templateId) {
      errors.push('Debe seleccionar una plantilla');
    }

    if (this.appState.selectedTemas.length === 0) {
      errors.push('Debe seleccionar al menos un tema');
    }

    // Verificar que los temas tengan palabras
    this.appState.selectedTemas.forEach(tema => {
      if (!tema.words || tema.words.length === 0) {
        errors.push(`El tema "${tema.nombre}" no tiene palabras definidas`);
      }
    });

    if (errors.length > 0) {
      console.log('❌ FRONTEND: Errores de validación encontrados:');
      errors.forEach(error => console.log(`   - ${error}`));
      this.appState.errors = errors;
      return false;
    }

    console.log('✅ FRONTEND: Validación exitosa');
    return true;
  }

  // Paso 4: Crear libro con generación de puzzles
  async createBook(name, templateId) {
    console.log('\n📱 FRONTEND: Paso 4 - Creando libro...');

    if (!this.validateBookCreation(name, templateId)) {
      return null;
    }

    this.setLoading(true);
    const totalSteps = this.appState.selectedTemas.length + 2;
    let currentStep = 0;

    try {
      // Crear estructura base del libro
      const book = {
        id: `book-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description: `Libro creado con plantilla ${templateId}`,
        template: { id: templateId, name: 'Plantilla Básica' },
        temaIds: this.appState.selectedTemas.map(t => t.id),
        pages: [],
        metadata: {
          author: 'Usuario',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          totalPages: 0
        },
        settings: {
          autoGeneratePages: true,
          includeIndex: true,
          includeSolutions: false
        }
      };

      console.log(`📝 FRONTEND: Estructura del libro creada: ${book.name}`);

      // Generar puzzles para cada tema
      currentStep = 1;
      console.log(`🔄 FRONTEND: Generando puzzles (${currentStep}/${totalSteps})...`);

      for (const tema of this.appState.selectedTemas) {
        currentStep++;
        console.log(`🔄 FRONTEND: Generando puzzle para "${tema.nombre}" (${currentStep}/${totalSteps})...`);

        const puzzleResponse = await this.backendAPI.generatePuzzle(tema.id, {
          gridSize: 15,
          allowDiagonal: true,
          allowReverse: true
        });

        const page = {
          id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: `Puzzle: ${tema.nombre}`,
          puzzleData: puzzleResponse.data,
          layout: {
            position: { x: 50, y: 100 },
            size: { width: 400, height: 300 },
            pageNumber: book.pages.length + 1
          },
          elements: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        book.pages.push(page);
        console.log(`✅ FRONTEND: Página creada para ${tema.nombre}`);
      }

      // Finalizar
      currentStep++;
      console.log(`🔄 FRONTEND: Finalizando libro (${currentStep}/${totalSteps})...`);

      book.metadata.totalPages = book.pages.length;
      this.appState.currentBook = book;

      console.log(`✅ FRONTEND: Libro creado exitosamente!`);
      console.log(`   📊 Estadísticas:`);
      console.log(`      - Nombre: ${book.name}`);
      console.log(`      - Páginas: ${book.pages.length}`);
      console.log(`      - Temas: ${book.temaIds.length}`);
      console.log(`      - Total palabras: ${book.pages.reduce((sum, page) => sum + page.puzzleData.words.length, 0)}`);

      this.setLoading(false);
      return book;

    } catch (error) {
      this.handleError('Error al crear libro', error);
      this.setLoading(false);
      return null;
    }
  }

  // Paso 5: Validar libro creado
  validateCreatedBook(book) {
    console.log('\n📱 FRONTEND: Paso 5 - Validando libro creado...');

    const errors = [];

    if (!book.name?.trim()) {
      errors.push('El libro no tiene nombre');
    }

    if (!book.template) {
      errors.push('El libro no tiene plantilla asignada');
    }

    if (!book.temaIds || book.temaIds.length === 0) {
      errors.push('El libro no tiene temas asignados');
    }

    if (!book.pages || book.pages.length === 0) {
      errors.push('El libro no tiene páginas');
    }

    book.pages.forEach((page, index) => {
      if (!page.puzzleData?.grid || page.puzzleData.grid.length === 0) {
        errors.push(`La página ${index + 1} no tiene datos de puzzle válidos`);
      }
      if (!page.puzzleData?.words || page.puzzleData.words.length === 0) {
        errors.push(`La página ${index + 1} no tiene palabras definidas`);
      }
    });

    if (errors.length > 0) {
      console.log('❌ FRONTEND: Errores en validación del libro:');
      errors.forEach(error => console.log(`   - ${error}`));
      return false;
    }

    console.log('✅ FRONTEND: Libro validado correctamente');
    return true;
  }

  // Paso 6: Simular preview del libro
  previewBook(book) {
    console.log('\n📱 FRONTEND: Paso 6 - Mostrando preview del libro...');

    console.log(`📖 Preview del libro: "${book.name}"`);
    console.log(`📄 Páginas totales: ${book.pages.length}`);

    book.pages.forEach((page, index) => {
      console.log(`\n   Página ${index + 1}: ${page.title}`);
      console.log(`   📊 Puzzle: ${page.puzzleData.config.rows}x${page.puzzleData.config.cols}`);
      console.log(`   📝 Palabras: ${page.puzzleData.words.map(w => w.text).join(', ')}`);

      // Mostrar una representación simple del grid
      console.log(`   🗺️  Grid preview (5x5):`);
      for (let i = 0; i < Math.min(5, page.puzzleData.grid.length); i++) {
        const row = page.puzzleData.grid[i].slice(0, 5).join(' ');
        console.log(`      ${row}`);
      }
    });

    console.log('\n✅ FRONTEND: Preview completado');
  }

  setLoading(loading) {
    this.appState.isLoading = loading;
  }

  handleError(context, error) {
    const errorMessage = error.message || error;
    console.log(`❌ FRONTEND: ${context} - ${errorMessage}`);
    this.appState.errors.push(`${context}: ${errorMessage}`);
  }
}

// ==================== EJECUCIÓN DE LA SIMULACIÓN ====================

async function runCompleteFlowSimulation() {
  console.log('🚀 SIMULACIÓN COMPLETA DEL FLUJO FRONTEND-BACKEND');
  console.log('=' .repeat(60));

  const backend = new MockBackendAPI();
  const frontend = new MockFrontend(backend);

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    success: true,
    errors: []
  };

  try {
    // PASO 1: Cargar temas
    const step1 = await frontend.loadTemas();
    results.steps.push({ name: 'Cargar temas', success: step1 });

    if (!step1) {
      throw new Error('Fallo al cargar temas');
    }

    // PASO 2: Seleccionar temas
    const step2 = frontend.selectTemas([
      '33682b77-a16e-4ffd-983f-3401f49a27ff', // Animales Salvajes
      'c8f682ab-4f47-4b62-8696-64030827f79f'  // Animales del Desierto
    ]);
    results.steps.push({ name: 'Seleccionar temas', success: step2 });

    if (!step2) {
      throw new Error('Fallo en selección de temas');
    }

    // PASO 3: Crear libro
    const book = await frontend.createBook('Mi Libro de Animales', 'infantil-basico');
    results.steps.push({ name: 'Crear libro', success: !!book });

    if (!book) {
      throw new Error('Fallo al crear libro');
    }

    // PASO 4: Validar libro
    const step4 = frontend.validateCreatedBook(book);
    results.steps.push({ name: 'Validar libro', success: step4 });

    if (!step4) {
      throw new Error('Libro no válido');
    }

    // PASO 5: Preview
    frontend.previewBook(book);
    results.steps.push({ name: 'Preview del libro', success: true });

    console.log('\n🎉 SIMULACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('✅ Todos los pasos del flujo son lógicos y funcionan correctamente');

    results.summary = {
      totalSteps: results.steps.length,
      successfulSteps: results.steps.filter(s => s.success).length,
      bookCreated: !!book,
      pagesGenerated: book?.pages.length || 0,
      totalWords: book?.pages.reduce((sum, page) => sum + page.puzzleData.words.length, 0) || 0
    };

  } catch (error) {
    console.log(`\n❌ SIMULACIÓN FALLIDA: ${error.message}`);
    results.success = false;
    results.errors.push(error.message);
  }

  // Guardar resultados
  fs.writeFileSync(
    path.join(__dirname, 'test_complete_flow_simulation_result.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n💾 Resultados guardados en test_complete_flow_simulation_result.json');

  return results;
}

// Ejecutar simulación
runCompleteFlowSimulation().catch(console.error);