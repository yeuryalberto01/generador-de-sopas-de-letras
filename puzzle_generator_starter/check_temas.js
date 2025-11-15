// Script para verificar temas guardados
console.log('Verificando temas guardados...');

// Simular localStorage para Node.js
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: (key) => {
      // En un entorno real, esto leería del navegador
      console.log(`Intentando leer ${key} desde localStorage`);
      return null;
    },
    setItem: (key, value) => {
      console.log(`Guardando ${key} en localStorage:`, value.substring(0, 100) + '...');
    }
  };
}

const temasBackup = localStorage.getItem('temas_backup');
if (temasBackup) {
  try {
    const temas = JSON.parse(temasBackup);
    console.log(`✅ Encontrados ${temas.length} temas en localStorage:`);
    temas.forEach((tema, index) => {
      console.log(`${index + 1}. ${tema.nombre} (${tema.palabras?.length || 0} palabras)`);
    });
  } catch (error) {
    console.error('❌ Error al parsear temas de localStorage:', error);
  }
} else {
  console.log('❌ No se encontraron temas en localStorage');
}

console.log('\n💡 Si tienes temas creados, deberían aparecer arriba.');
console.log('💡 Si no aparecen, créalos nuevamente en el módulo de temas.');