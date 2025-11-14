// Script de prueba para crear un libro y analizar fallos
// Ejecutar con: node test_book_creation.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simular datos del frontend
const mockTemas = [
  {
    "id": "ca372b0d-42e7-45bf-9334-09aab584dff1",
    "nombre": "los",
    "descripcion": "",
    "words": ["las", "les"],
    "updated_at": "2025-11-01T06:32:33.735341+00:00"
  },
  {
    "id": "4e1e1df3-5faa-4bbe-bfae-07118049e1c5",
    "nombre": "animales de la selva",
    "descripcion": "",
    "words": ["sol", "lina", "perla", "pardo"],
    "updated_at": "2025-11-01T10:34:03.393193+00:00"
  },
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
  }
];

const mockTemplates = [
  {
    id: 'infantil-basico',
    name: 'Libro Infantil Básico',
    description: 'Perfecto para niños pequeños con puzzles grandes y colores vivos',
    category: 'infantil',
    pageSize: 'LETTER',
    layout: {
      puzzlesPerPage: 1,
      margin: { top: 1, right: 1, bottom: 1, left: 1 },
      spacing: 0.5,
      showPageNumbers: true,
      showTitles: true
    },
    styles: {
      backgroundColor: '#ffffff',
      titleFont: 'Comic Sans MS, cursive',
      titleSize: 24,
      decorations: true
    }
  }
];

// Función para simular la creación de un libro
function createBookSimulation(name, templateId, temaIds) {
  console.log('=== SIMULACIÓN DE CREACIÓN DE LIBRO ===');
  console.log(`Nombre: ${name}`);
  console.log(`Template ID: ${templateId}`);
  console.log(`Tema IDs: ${temaIds.join(', ')}`);

  // 1. Validar template
  const template = mockTemplates.find(t => t.id === templateId);
  if (!template) {
    console.error('❌ ERROR: Template no encontrado');
    return null;
  }
  console.log('✅ Template encontrado:', template.name);

  // 2. Validar temas
  const selectedTemas = mockTemas.filter(tema => temaIds.includes(tema.id));
  if (selectedTemas.length === 0) {
    console.error('❌ ERROR: No se encontraron temas válidos');
    return null;
  }
  console.log('✅ Temas encontrados:', selectedTemas.map(t => t.nombre).join(', '));

  // 3. Crear estructura del libro
  const bookId = `book-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const book = {
    id: bookId,
    name,
    description: `Libro creado con plantilla ${template.name}`,
    template,
    temaIds,
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

  console.log('✅ Libro creado exitosamente');
  console.log('📊 Estadísticas del libro:');
  console.log(`   - ${selectedTemas.length} temas incluidos`);
  console.log(`   - ${selectedTemas.reduce((sum, t) => sum + t.words.length, 0)} palabras totales`);
  console.log(`   - Template: ${template.name} (${template.category})`);

  return book;
}

// Función para simular la generación de páginas
function generatePagesSimulation(book, temas) {
  console.log('\n=== SIMULACIÓN DE GENERACIÓN DE PÁGINAS ===');

  const pages = [];
  let pageNumber = 1;

  temas.forEach(tema => {
    console.log(`📄 Generando página para tema: ${tema.nombre}`);

    // Simular generación de puzzle
    const mockPuzzle = {
      grid: Array(10).fill().map(() => Array(10).fill('')),
      words: tema.words.map(word => ({ text: word, positions: [] })),
      config: { rows: 10, cols: 10 }
    };

    const page = {
      id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Puzzle: ${tema.nombre}`,
      puzzleData: mockPuzzle,
      layout: {
        position: { x: 50, y: 100 },
        size: { width: 400, height: 300 },
        pageNumber: pageNumber++
      },
      elements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    pages.push(page);
    console.log(`✅ Página generada: ${page.title}`);
  });

  book.pages = pages;
  book.metadata.totalPages = pages.length;

  console.log(`\n📚 Libro completado con ${pages.length} páginas`);
  return book;
}

// Función para analizar problemas potenciales
function analyzeIssues() {
  console.log('\n=== ANÁLISIS DE PROBLEMAS POTENCIALES ===');

  const issues = [];

  // 1. Verificar consistencia de datos
  console.log('🔍 Verificando consistencia de datos...');
  mockTemas.forEach(tema => {
    if (!tema.id || !tema.nombre) {
      issues.push(`Tema sin ID o nombre: ${JSON.stringify(tema)}`);
    }
    if (!tema.words || tema.words.length === 0) {
      issues.push(`Tema sin palabras: ${tema.nombre}`);
    }
  });

  // 2. Verificar templates
  mockTemplates.forEach(template => {
    if (!template.layout || !template.styles) {
      issues.push(`Template incompleto: ${template.name}`);
    }
  });

  // 3. Verificar compatibilidad
  console.log('🔍 Verificando compatibilidad entre módulos...');
  if (mockTemas.some(t => !t.words)) {
    issues.push('Algunos temas no tienen la propiedad "words" correcta');
  }

  if (issues.length === 0) {
    console.log('✅ No se encontraron problemas críticos');
  } else {
    console.log('⚠️ Problemas encontrados:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  return issues;
}

// Ejecutar pruebas
console.log('🚀 INICIANDO PRUEBAS DE CREACIÓN DE LIBROS\n');

analyzeIssues();

const testBook = createBookSimulation(
  'Libro de Prueba - Animales',
  'infantil-basico',
  ['33682b77-a16e-4ffd-983f-3401f49a27ff', 'c8f682ab-4f47-4b62-8696-64030827f79f']
);

if (testBook) {
  const temasSeleccionados = mockTemas.filter(t => testBook.temaIds.includes(t.id));
  generatePagesSimulation(testBook, temasSeleccionados);
}

// Guardar resultado como JSON para inspección
if (testBook) {
  fs.writeFileSync(
    path.join(__dirname, 'test_book_result.json'),
    JSON.stringify(testBook, null, 2)
  );
  console.log('\n💾 Resultado guardado en test_book_result.json');
}

console.log('\n🎯 PRUEBAS COMPLETADAS');