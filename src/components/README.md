# Componente de Navegación

## Características

### Diseño Corporativo y Compacto
- **Barra superior**: Muestra el número de versión (v0.1.0) y selector de idioma
- **Barra principal**: Logo circular a la izquierda y botón de conexión a la derecha
- **Optimización móvil**: Diseño específicamente optimizado para pantallas pequeñas

### Elementos de la Navegación

#### Barra Superior (6px de altura)
- **Lado izquierdo**: Número de versión del proyecto
- **Lado derecho**: Selector de idioma con dropdown (ES, EN, PT)

#### Barra Principal (48px de altura)
- **Lado izquierdo**: Logo circular con gradiente azul corporativo
- **Lado derecho**: Botón de conexión de wallet (RainbowKit)

### Responsive Design

#### Pantallas Normales (> 320px)
- Altura total: 54px (6px + 48px)
- Logo: 32x32px
- Padding horizontal: 12px

#### Pantallas Extra Pequeñas (≤ 320px)
- Altura total: 45px (5px + 40px)
- Logo: 28x28px
- Padding horizontal: 8px
- Iconos más pequeños (10x10px)

#### Pantallas Muy Pequeñas (≤ 280px)
- Altura total: 37.5px (5px + 32.5px)
- Logo: 24x24px
- Padding horizontal: 4px

### Tecnologías Utilizadas
- **Next.js 15** con TypeScript
- **Tailwind CSS** para estilos
- **RainbowKit** para conexión de wallet
- **Lucide React** para iconos
- **CSS Modules** para estilos específicos

### Uso
```tsx
import Navigation from '../components/Navigation';

// El componente se incluye automáticamente en _app.tsx
// Aparece en todas las páginas de la aplicación
```

### Personalización
- Colores corporativos: Gradiente azul (#2563eb a #1e40af)
- Fuentes: Sistema de fuentes del dispositivo
- Espaciado: Optimizado para máxima compactación
- Sombras: Sutil para mantener el aspecto profesional
