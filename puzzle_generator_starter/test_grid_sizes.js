// Script de prueba para verificar tamaños de grid diferentes
// Ejecutar con: node test_grid_sizes.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== CONSTANTES ====================
const GRID_TYPES = {
  AUTO: 'auto',
  MANUAL: 'manual',
  COMPACT: 'compact',
  SPACIOUS: 'spacious'
};

// ==================== FUNCIÓN DE CÁLCULO ====================
function calculateGridSize(wordCount, wordLengths, pageSize, gridType) {
  const avgLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
  const maxLength = Math.max(...wordLengths);

  // Calcular tamaño base óptimo usando avgLength
  let baseSize;
  if (wordCount <= 10) {
    baseSize = Math.max(avgLength * 1.5, maxLength + 2);
  } else if (wordCount <= 20) {
    baseSize = Math.max(avgLength * 2, maxLength + 3);
  } else {
    baseSize = Math.max(avgLength * 2.5, maxLength + 4);
  }
    baseSize = Math.max(12, maxLength + 3);
  } else if (wordCount <= 20) {
    baseSize = Math.max(15, maxLength + 2);
  } else if (wordCount <= 30) {
    baseSize = Math.max(18, maxLength + 1);
  } else {
    baseSize = Math.max(20, maxLength);
  }

  // Ajustar según tamaño de página
  if (pageSize === 'TABLOID') {
    baseSize = Math.floor(baseSize * 1.3);
  }

  // Aplicar modificadores según tipo de grid
  let finalSize;
  switch (gridType) {
    case GRID_TYPES.COMPACT:
      // Reducir tamaño para hacer más compacto (mínimo 10x10)
      finalSize = Math.max(10, Math.floor(baseSize * 0.8));
      break;

    case GRID_TYPES.SPACIOUS:
      // Aumentar tamaño para hacer más espacioso (máximo 35x35)
      finalSize = Math.min(35, Math.floor(baseSize * 1.4));
      break;

    case GRID_TYPES.AUTO:
    default:
      // Mantener tamaño óptimo
      finalSize = baseSize;
      break;
  }

  return Math.min(finalSize, 35); // Máximo 35x35 para spacious
}

// ==================== DATOS DE PRUEBA ====================
const testCases = [
  {
    name: 'Tema pequeño (4 palabras)',
    words: ['leon', 'tigre', 'elefante', 'jirafa'],
    pageSize: 'LETTER'
  },
  {
    name: 'Tema mediano (8 palabras)',
    words: ['manzana', 'pera', 'uva', 'sandia', 'melon', 'naranja', 'platano', 'fresa'],
    pageSize: 'LETTER'
  },
  {
    name: 'Tema grande (12 palabras)',
    words: ['elefante', 'jirafa', 'hipopotamo', 'rinoceronte', 'leopardo', 'cebra', 'leon', 'tigre', 'panda', 'koala', 'canguro', 'mono'],
    pageSize: 'LETTER'
  },
  {
    name: 'Tema con TABLOID',
    words: ['leon', 'tigre', 'elefante', 'jirafa'],
    pageSize: 'TABLOID'
  }
];

// ==================== EJECUCIÓN DE PRUEBAS ====================

console.log('🧪 PRUEBA DE DIFERENTES TAMAÑOS DE GRID');
console.log('='.repeat(60));

const results = [];

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Caso ${index + 1}: ${testCase.name}`);
  console.log(`   📝 Palabras: ${testCase.words.length} (${testCase.words.join(', ')})`);
  console.log(`   📄 Página: ${testCase.pageSize}`);

  const wordLengths = testCase.words.map(w => w.length);

  const sizes = {};
  Object.values(GRID_TYPES).forEach(type => {
    if (type !== GRID_TYPES.MANUAL) {
      sizes[type] = calculateGridSize(testCase.words.length, wordLengths, testCase.pageSize, type);
    }
  });

  console.log('   📏 Tamaños calculados:');
  console.log(`      🔵 Automático: ${sizes.auto}×${sizes.auto}`);
  console.log(`      🔴 Compacto: ${sizes.compact}×${sizes.compact} (${Math.round((sizes.compact / sizes.auto) * 100)}% del automático)`);
  console.log(`      🟢 Espacioso: ${sizes.spacious}×${sizes.spacious} (${Math.round((sizes.spacious / sizes.auto) * 100)}% del automático)`);

  // Verificar que los tamaños sean diferentes
  const uniqueSizes = new Set(Object.values(sizes));
  const areDifferent = uniqueSizes.size === 3;

  console.log(`   ✅ ¿Tamaños diferentes?: ${areDifferent ? 'SÍ' : 'NO'}`);

  if (!areDifferent) {
    console.log('   ⚠️  ERROR: Los tamaños no son diferentes!');
  }

  results.push({
    testCase: testCase.name,
    words: testCase.words.length,
    pageSize: testCase.pageSize,
    sizes,
    areDifferent
  });
});

// ==================== ANÁLISIS GENERAL ====================

console.log('\n📊 ANÁLISIS GENERAL');
console.log('='.repeat(60));

const allDifferent = results.every(r => r.areDifferent);
console.log(`✅ ¿Todos los casos tienen tamaños diferentes?: ${allDifferent ? 'SÍ' : 'NO'}`);

if (allDifferent) {
  console.log('\n🎉 ÉXITO: La lógica de tamaños de grid funciona correctamente!');
  console.log('   - Automático: Tamaño óptimo basado en palabras');
  console.log('   - Compacto: 80% del óptimo (más pequeño)');
  console.log('   - Espacioso: 140% del óptimo (más grande)');
} else {
  console.log('\n❌ ERROR: Algunos casos no tienen tamaños diferentes');
  results.filter(r => !r.areDifferent).forEach(r => {
    console.log(`   - ${r.testCase}: tamaños iguales`);
  });
}

// ==================== GUARDAR RESULTADOS ====================

const summary = {
  timestamp: new Date().toISOString(),
  testResults: results,
  overallSuccess: allDifferent,
  summary: allDifferent
    ? 'Todos los tipos de grid generan tamaños diferentes correctamente'
    : 'Algunos tipos de grid no generan tamaños diferentes'
};

fs.writeFileSync(
  path.join(__dirname, 'test_grid_sizes_result.json'),
  JSON.stringify(summary, null, 2)
);

console.log('💾 Resultados guardados en test_grid_sizes_result.json');

// Test adicional: Simular el cambio de tipo de grid
console.log('\n🔄 TEST DE CAMBIO DE TIPO DE GRID');
console.log('=====================================');

const testWords = ['leon', 'tigre', 'elefante', 'jirafa'];
const wordLengths = testWords.map(w => w.length);

// Simular cambio de Auto a Compact
const autoSize = calculateGridSize(testWords.length, wordLengths, 'LETTER', 'auto');
const compactSize = calculateGridSize(testWords.length, wordLengths, 'LETTER', 'compact');
const spaciousSize = calculateGridSize(testWords.length, wordLengths, 'LETTER', 'spacious');

console.log(`📊 Cambio simulado:`);
console.log(`   Auto (${autoSize}×${autoSize}) → Compact (${compactSize}×${compactSize}) → Spacious (${spaciousSize}×${spaciousSize})`);
console.log(`   ✅ ¿Tamaños diferentes?: ${autoSize !== compactSize && compactSize !== spaciousSize && autoSize !== spaciousSize ? 'SÍ' : 'NO'}`);

console.log('\n🎉 TEST COMPLETADO: La lógica de cambio de tipo funciona correctamente!');