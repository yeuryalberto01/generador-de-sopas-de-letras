// Script para verificar el contraste de colores en ambos modos

// Colores del tema claro (light mode)
const lightColors = {
  bgSurface: '#f9fafb', // gray-50
  bgCard: '#ffffff',   // white
  textPrimary: '#111827', // gray-900
  textSecondary: '#4b5563', // gray-600
  accentPrimary: '#4f46e5', // indigo-600
};

// Colores del tema oscuro (dark mode)
const darkColors = {
  bgSurface: '#111827', // gray-900
  bgCard: '#1f2937',   // gray-800
  textPrimary: '#f9fafb', // gray-50
  textSecondary: '#d1d5db', // gray-300
  accentPrimary: '#818cf8', // indigo-400
};

// Función para calcular contraste (WCAG)
function calculateContrast(foreground, background) {
  // Convertir hex a RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calcular luminancia relativa
  const getLuminance = (r, g, b) => {
    const sRGB = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  const lum1 = getLuminance(fg.r, fg.g, fg.b);
  const lum2 = getLuminance(bg.r, bg.g, bg.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Verificar contraste para ambos modos
console.log('=== VERIFICACIÓN DE CONTRASTE ===\n');

// Tema claro
console.log('TEMA CLARO:');
console.log(`Texto principal sobre fondo: ${calculateContrast(lightColors.textPrimary, lightColors.bgSurface).toFixed(2)}:1`);
console.log(`Texto secundario sobre fondo: ${calculateContrast(lightColors.textSecondary, lightColors.bgSurface).toFixed(2)}:1`);
console.log(`Acento sobre fondo: ${calculateContrast(lightColors.accentPrimary, lightColors.bgSurface).toFixed(2)}:1`);
console.log(`Texto sobre tarjeta: ${calculateContrast(lightColors.textPrimary, lightColors.bgCard).toFixed(2)}:1`);

console.log('\nTEMA OSCURO:');
console.log(`Texto principal sobre fondo: ${calculateContrast(darkColors.textPrimary, darkColors.bgSurface).toFixed(2)}:1`);
console.log(`Texto secundario sobre fondo: ${calculateContrast(darkColors.textSecondary, darkColors.bgSurface).toFixed(2)}:1`);
console.log(`Acento sobre fondo: ${calculateContrast(darkColors.accentPrimary, darkColors.bgSurface).toFixed(2)}:1`);
console.log(`Texto sobre tarjeta: ${calculateContrast(darkColors.textPrimary, darkColors.bgCard).toFixed(2)}:1`);

console.log('\n=== ESTÁNDARES WCAG ===');
console.log('✅ Bueno: 4.5:1 o más (AA)');
console.log('✅ Excelente: 7:1 o más (AAA)');
console.log('❌ Insuficiente: menos de 4.5:1');