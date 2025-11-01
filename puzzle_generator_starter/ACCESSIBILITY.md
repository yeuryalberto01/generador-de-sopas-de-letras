# Guía de Accesibilidad - Generador de Sopas de Letras

## ♿ Características de Accesibilidad Implementadas

### 1. Navegación por Teclado
- **Skip Navigation**: Enlace para saltar al contenido principal
- **Gestión de Foco**: Navegación lógica y visible entre elementos
- **Atajos de Teclado**: Soporte para Enter, Espacio y Escape en componentes interactivos

### 2. Controles de Accesibilidad
- **Movimiento Reducido**: Opción para usuarios sensibles a las animaciones
- **Alto Contraste**: Modo de alto contraste para mejor visibilidad
- **Tamaño de Texto**: Control de tamaño de fuente (pequeño, normal, grande)

### 3. ARIA (Accessible Rich Internet Applications)
- **Roles Semánticos**: `button`, `dialog`, `form`, etc.
- **Etiquetas ARIA**: `aria-label`, `aria-describedby`, `aria-pressed`
- **Estados ARIA**: `aria-expanded`, `aria-hidden`, `aria-invalid`

### 4. Mejoras Visuales
- **Contraste de Color**: Cumple con WCAG AA (4.5:1 mínimo)
- **Indicadores de Foco**: Outline visible para elementos enfocados
- **Estados de Hover/Focus**: Feedback visual claro

## 🎯 Implementación Técnica

### Contexto de Accesibilidad
```javascript
// src/context/AccessibilityContext.jsx
- Gestión centralizada de preferencias
- Persistencia en localStorage
- Aplicación automática al documento
```

### Componentes de Accesibilidad
- **AccessibilityControls**: Panel flotante con controles
- **SkipNavigation**: Enlace para saltar al contenido
- **TemaCard**: Componente optimizado con ARIA

### CSS para Accesibilidad
```css
/* Variables para temas de alto contraste */
.high-contrast {
  --bg-primary: #000000;
  --text-primary: #ffffff;
}

/* Mejoras de foco */
.focus-visible button:focus {
  outline: 2px solid #3b82f6;
}
```

## 🔧 Uso para Desarrolladores

### Integración de Componentes
```jsx
// En AppRouter.jsx
<AccessibilityProvider>
  <SkipNavigation />
  <AccessibilityControls />
  {/* Resto de la aplicación */}
</AccessibilityProvider>
```

### Atributos ARIA Recomendados
```jsx
// Para botones
<button
  aria-label="Descripción accionable"
  aria-pressed={isPressed}
>
  Contenido
</button>

// Para diálogos
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">Título</h2>
</div>
```

### Testing de Accesibilidad
1. **Navegación por Teclado**: Verificar tabulación y atajos
2. **Lectores de Pantalla**: Probar con NVDA, VoiceOver, JAWS
3. **Contraste de Color**: Usar herramientas como axe DevTools
4. **Validación ARIA**: Verificar roles y propiedades

## 📊 Cumplimiento de Estándares

### WCAG 2.1 Nivel AA
- ✅ 1.1.1 Contenido no textual
- ✅ 1.3.1 Información y relaciones
- ✅ 1.4.3 Contraste (mínimo)
- ✅ 2.1.1 Teclado
- ✅ 2.4.3 Orden de foco
- ✅ 2.4.7 Foco visible

### Mejores Prácticas Implementadas
- [x] Navegación por teclado completa
- [x] Etiquetas descriptivas para elementos interactivos
- [x] Controles de personalización visual
- [x] Soporte para lectores de pantalla
- [x] Manejo adecuado de modales y diálogos

## 🚀 Próximas Mejoras

### En Desarrollo
- [ ] Soporte para navegación por voz
- [ ] Modo de lectura simplificada
- [ ] Mejoras en anuncios de lectores de pantalla

### Consideradas
- [ ] Soporte para navegación por switch
- [ ] Personalización de colores avanzada
- [ ] Modo de alto contraste personalizable

## 📚 Recursos

### Herramientas de Testing
- [axe DevTools](https://www.deque.com/axe/)
- [WAVE Evaluation Tool](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

### Documentación
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React Accessibility](https://reactjs.org/docs/accessibility.html)
```

### Mejoras de SEO y Meta Tags
```jsx
// En AppRouter.jsx o componente principal
useEffect(() => {
  // Meta tags dinámicos para SEO
  document.title = 'Generador de Sopas de Letras - Crea tus propios puzzles'
  
  const metaDescription = document.querySelector('meta[name=\"description\"]')
  if (!metaDescription) {
    const meta = document.createElement('meta')
    meta.name = 'description'
    meta.content = 'Aplicación web para crear y gestionar sopas de letras personalizadas. Herramienta educativa y de entretenimiento.'
    document.head.appendChild(meta)
  }
}, [])
```

Esta documentación proporciona una guía completa sobre las características de accesibilidad implementadas y cómo mantenerlas.