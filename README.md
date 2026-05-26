# 📝 Notitas

**Notitas** es una aplicación de escritorio moderna, ultra-minimalista y altamente optimizada para el uso del teclado, construida sobre **Tauri v2**, **React 19 (TypeScript)** y **Rust**. 

Su diseño está guiado por una estética geométrica abstracta y profunda (Dark Mode), pensada para desarrolladores y estudiantes que buscan una experiencia de toma de notas rápida, fluida y libre de distracciones (mouse-less).

---

## 📐 Arquitectura del Proyecto

El proyecto sigue un patrón desacoplado y estructurado en capas para garantizar la escalabilidad y mantenibilidad del software:

```mermaid
graph TD
    subgraph Frontend (React 19 + TS)
        Views[Vistas / Screens] -->|Consumen| ViewModels[ViewModels / Hooks]
        ViewModels -->|Acceden| Services[Servicios / MockDatabase]
        ShortcutManager[ShortcutManager] -->|Intercepta Teclas| Views & ViewModels
        NavHost[NavHost] -->|Renderea| Views
    end
    
    subgraph Backend (Tauri v2 + Rust)
        RustCore[Rust Core / lib.rs] -->|Migraciones| SQLite[(SQLite / notitas.db)]
        RustCore -->|Gestión de Archivos| FS[Carpeta apuntes_md]
    end

    ViewModels -.->|Futuro: IPC/Tauri Commands| RustCore
```

### 1. Frontend (Capas MVVM & Servicios)
*   **Vistas (`src/screens` & `src/components`)**: Componentes puros de React encargados de la representación visual del estado. No gestionan llamadas a bases de datos ni lógica compleja de teclado directamente.
*   **ViewModels (`src/viewmodels`)**: Hooks personalizados que encapsulan el estado de la vista y la interacción con los servicios de datos. Registran y limpian los atajos de teclado locales correspondientes a cada pantalla.
*   **Controlador de Navegación (`src/navigation`)**: Implementa un historial nativo de navegación (`NavigationController`) manejado en memoria, permitiendo transiciones espaciales dinámicas entre pantallas mediante el componente `NavHost`.
*   **Gestor de Atajos (`src/keyboard`)**: `ShortcutManager` centraliza la captura de combinaciones de teclas globales y locales durante la fase de captura del DOM (`capture: true`), resolviendo colisiones de eventos de forma predecible.
*   **Servicio de Base de Datos (`src/services`)**: Interfaz abstracta para operaciones de consulta y mutación. Actualmente implementado como una base de datos en memoria simulada (`MockDatabase`) lista para migrar a SQLite real.

### 2. Backend (Tauri v2 & Rust)
*   **Ciclo de Vida y Permisos**: Configurado bajo Tauri v2 con plugins modulares.
*   **Persistencia (SQLite)**: Inicializa un motor de base de datos local (`notitas.db`) mediante migraciones de Rust en `src-tauri/src/lib.rs`.
*   **Sistema de Archivos Plano**: Crea automáticamente un directorio plano de markdown (`apuntes_md`) dentro del directorio de datos del sistema para almacenar los apuntes directamente en archivos `.md`.

---

## 🗂️ Estructura de Directorios

```bash
notitas/
├── src/                         # Código fuente del Frontend (React + TS)
│   ├── assets/                  # Recursos estáticos (imágenes, logos)
│   ├── components/              # Componentes compartidos y modales
│   │   ├── GenericSwitcher.tsx  # Buscador/selector genérico y abstracto
│   │   ├── GlobalOverlay.tsx    # Capa de fondo con desenfoque de cristal (Portal)
│   │   ├── NewCourseModal.tsx   # Formulario accesible para nuevos cursos
│   │   ├── QuickSwitcher.tsx    # Navegador rápido (Spotlight de cursos)
│   │   └── Sidebar.tsx          # Panel lateral colapsable
│   ├── data/                    # Modelos y esquemas de datos del cliente (actualmente vacío)
│   ├── keyboard/                # Sistema de atajos y utilidades de teclado
│   │   ├── globalShortcuts.ts   # Declaración de combinaciones globales
│   │   ├── ShortcutManager.ts   # Administrador de registro de atajos por grupos
│   │   ├── types.ts             # Tipados de configuraciones de shortcuts
│   │   ├── useFocusTrap.ts      # Hook para atrapar el foco Tab en modales (A11y)
│   │   └── useKeysHeld.ts       # Hook para detectar teclas presionadas (ej. Alt+Shift)
│   ├── navigation/              # Controlador de navegación SPA propio
│   │   ├── NavHost.tsx          # Enrutador de pantallas
│   │   ├── NavigationController.ts # Lógica de historial (back/forward)
│   │   └── types.ts             # Definición de rutas (AppRoute)
│   ├── screens/                 # Vistas o Pantallas principales
│   │   ├── CourseView.tsx       # Detalle del curso y sus columnas (Ambientes)
│   │   ├── Dashboard.tsx        # Cuadrícula de cursos con menú Spotlight (Ctrl+K)
│   │   └── WelcomeScreen.tsx    # Pantalla de bienvenida / Boot screen
│   ├── services/                # Servicios del sistema (Persistencia, APIs)
│   │   └── database.ts          # Mock de base de datos local
│   ├── App.css                  # Sistema de diseño, tokens de CSS y animaciones
│   ├── App.tsx                  # Punto de entrada de React, layout principal y atajos globales
│   └── main.tsx                 # Montaje de React en el DOM
├── src-tauri/                   # Código de escritorio y sistema nativo (Rust)
│   ├── capabilities/            # Definición de permisos de Tauri v2
│   ├── src/                     # Lógica en Rust
│   │   ├── lib.rs               # Registro de plugins (SQL, Opener) y migraciones de DB
│   │   └── main.rs              # Punto de entrada de la aplicación nativa
│   ├── Cargo.toml               # Dependencias de Rust
│   └── tauri.conf.json          # Configuración del empaquetado y ventana de Tauri
└── package.json                 # Scripts y dependencias de Node.js (React, Vite, etc.)
```

---

## ⌨️ Sistema de Atajos de Teclado (Keyboard Driven)

La aplicación está diseñada para ser completamente utilizable sin tocar el ratón. A continuación, se listan los atajos de teclado implementados:

| Atajo | Tipo / Contexto | Acción |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>B</kbd> | Global | Abre / Cierra la barra lateral (`Sidebar`). |
| <kbd>Alt</kbd> + <kbd>↑</kbd> | Global | Navega a la pantalla de Bienvenida (`WelcomeScreen`). |
| <kbd>Alt</kbd> + <kbd>↓</kbd> | Global | Navega al Panel Principal (`Dashboard`). |
| <kbd>Alt</kbd> + <kbd>←</kbd> | Global | Navega hacia adelante en el historial. |
| <kbd>Alt</kbd> + <kbd>→</kbd> | Global | Navega hacia atrás en el historial. |
| <kbd>↓</kbd> (Flecha Abajo) | WelcomeScreen | Entra al `Dashboard` desde la pantalla de bienvenida. |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | Dashboard | Abre el modal para crear un Nuevo Curso. |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>[1-9]</kbd> | Dashboard / Sidebar | Enfoca/Selecciona directamente el curso en la posición numérica correspondiente. |
| <kbd>Flechas de Dirección</kbd> | Dashboard | Navega horizontalmente por las tarjetas de la cuadrícula de cursos. |
| <kbd>Enter</kbd> | Dashboard | Si no hay foco de tarjeta, abre el modal de nuevo curso. Si hay foco, abre el curso seleccionado. |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Dashboard | Abre el Spotlight/Menú de comandos rápidos de la tarjeta enfocada. |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>← / →</kbd> | Dashboard | Selección múltiple de tarjetas en bloque (Bulk Selection). |
| <kbd>Esc</kbd> | Global / Modales | Cierra modales abiertos, desactiva menús o regresa al Dashboard (desde `CourseView`). |

---

## 🎨 Sistema de Diseño Estético (Deep Minimalist)

Notitas utiliza un diseño personalizado plasmado en `src/App.css`:
*   **Paleta de colores**: Monocromática y de contraste sutil (Fondo `#0d0d0d`, paneles `#151515`, textos en gris neutro y elementos geométricos en blanco puro `#ffffff`).
*   **Geometría Abstracta**: Uso de elementos geométricos en lugar de iconos tradicionales:
    *   `shape-dash`: Línea horizontal gruesa y redondeada para acentos y separadores.
    *   `shape-square`: Cuadrados para adornar títulos de marca e iconos de bienvenida.
    *   `shape-triangle`: Triángulos para indicar la navegación espacial (hacia dónde se mueven las pantallas).
    *   `shape-circle`: Círculo hueco para botones de opciones sutiles.
*   **Micro-animaciones**: Transiciones personalizadas como `slide-up-enter` y `fade-enter` con curvas Bezier personalizadas (`cubic-bezier(0.2, 0.8, 0.2, 1)`) para dar sensación de respuesta táctil y ligereza.
*   **Cristalografía (Glassmorphism)**: Pantallas de fondo oscurecidas con `backdrop-filter: blur(8px)` para separar la jerarquía visual de los modales y switchers.

---

## 🛠️ Estado Actual y Siguientes Pasos (Roadmap de Desarrollo)

### 📌 Desalineación Base de Datos (Simulada vs Real)
Actualmente existe una discrepancia técnica entre las tablas creadas en SQLite y la estructura del mock en el frontend:
*   **Rust (SQLite Migración - `lib.rs`)**:
    *   `cursos` (`id`, `nombre`, `fecha_creacion`)
    *   `ambientes` (`id`, `nombre`, `curso_id`, `is_default`)
    *   `notas` (`id`, `titulo`, `ambiente_id`, `nombre_archivo`, `fecha_modificacion`)
*   **Frontend Mock (`database.ts`)**:
    *   Define `Curso` con un campo `abreviatura` (ej. "ISW") y `nombre`.
    *   Define una tabla intermedia de muchos-a-muchos (`CursoAmbiente`), mientras que el esquema SQL de Rust define una relación **1 a Muchos** (un ambiente pertenece a un único curso mediante `curso_id`).
*   **Acción Requerida**: Sincronizar el cliente React para realizar consultas usando el plugin `@tauri-apps/plugin-sql` y adaptar el código frontend a la estructura relacional 1:N real del SQLite o actualizar la migración en Rust para admitir la relación N:M si es estrictamente necesario.

### 📌 Acciones del Spotlight en Dashboard
El menú contextual (`Ctrl + K` o botón de opciones) presenta opciones de **Editar**, **Archivar** y **Eliminar** en la interfaz, pero actualmente sólo escriben en consola. Falta conectar estas acciones al CRUD de la base de datos.

### 📌 Persistencia Física de Notas (`apuntes_md`)
El backend crea la carpeta física para apuntes, pero el frontend aún no tiene implementados los comandos Tauri IPC para guardar el texto de las notas en formato Markdown (`.md`) dentro de dicha carpeta.

---

## 🚀 Instalación y Desarrollo

### Requisitos Previos
*   **Rust** (instalado vía [rustup](https://rustup.rs/))
*   **Node.js** (v18 o superior)
*   **pnpm** (gestor de paquetes recomendado en el proyecto)

### Pasos para iniciar el entorno de desarrollo

1.  Clonar el repositorio y entrar en el directorio:
    ```bash
    cd notitas
    ```

2.  Instalar las dependencias de Node:
    ```bash
    pnpm install
    ```

3.  Ejecutar el entorno de desarrollo de Tauri (esto levantará Vite y la ventana de Tauri de forma simultánea):
    ```bash
    pnpm tauri dev
    ```

4.  Para compilar la aplicación para producción:
    ```bash
    pnpm tauri build
    ```
