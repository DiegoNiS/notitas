# Tareas Pendientes y Errores Detectados (Sesión Futura)

Este documento registra los comportamientos incorrectos y detalles pendientes en la aplicación para ser corregidos en la siguiente sesión de desarrollo.

---

## 📋 Lista de Errores y Mejoras a Realizar

### 1. Menú Contextual (Ctrl + K) en Vista de Ambiente
* **Comportamiento**: Al presionar `Ctrl + K` en una nota enfocada en la vista de ambiente, el menú contextual de opciones aparece, pero se renderiza por debajo del overlay de fondo oscurecido (`GlobalOverlay`), impidiendo interactuar con él.
* **Causa**: Problema de orden de apilamiento en el eje Z (`z-index`) entre la tarjeta que contiene el menú flotante y el overlay.
* **Solución**: Ajustar el `z-index` de `.command-menu` o de la tarjeta seleccionada para que quede por encima del `z-index` del overlay.

### 2. Bloqueo de Interacción Detrás de los Modales (Focus Lock)
* **Comportamiento**: Cuando hay un modal activo con un overlay (por ejemplo, el de creación de usuario, creación de curso, confirmaciones, etc.), el usuario todavía puede interactuar con la pantalla de fondo usando el teclado. Por ejemplo, presionar las flechas de dirección cambia de pestañas o desplaza la lista oculta por detrás.
* **Causa**: Los atajos de teclado globales y locales de las vistas siguen activos e interceptan las pulsaciones a pesar de que hay un modal en primer plano.
* **Solución**: Implementar una condición en los manejadores de atajos de teclado para desactivar/congelar todas las acciones si hay algún modal u overlay abierto en la aplicación (ej. verificar el estado global de modales activos).

### 3. Eliminación de Cursos y Notas
* **Comportamiento**: Las acciones para eliminar cursos y notas de la base de datos y limpiar los archivos físicos correspondientes no están funcionando de manera correcta.
* **Solución**: Revisar las funciones IPC de Tauri de eliminación (`eliminar_curso` y `eliminar_nota`) y sus integraciones en los ViewModels correspondientes para asegurar que las transacciones en base de datos SQLite y las operaciones de archivos físicos con `std::fs` se ejecuten sin errores.

### 4. Estética y Navegación del Modal Ctrl + K en el Editor
* **Comportamiento**: Al pulsar `Ctrl + K` dentro del editor de notas para borrarla, el modal que aparece rompe la paleta de colores de la aplicación (muestra colores llamativos en lugar del tema minimalista en escala de grises y opacidades acordadas). Además, no se puede navegar por sus opciones utilizando el teclado.
* **Solución**: Rediseñar visualmente el modal para que use colores blanco/negro/gris, y añadir soporte de teclado en el modal de confirmación (ej. `Enter` para confirmar, `Escape` para cancelar, flechas para alternar entre opciones).

### 5. Comportamiento de la Tecla Escape en Modales
* **Comportamiento**: Al presionar `Escape` con un modal abierto, a veces no se cierra, o se cierra pero a la vez activa la acción de "regresar" en la vista de fondo, provocando que la aplicación retroceda de pantalla accidentalmente.
* **Causa**: La tecla `Escape` dispara simultáneamente el cierre del modal y la acción de retroceso registrada en el ViewModel de la pantalla de fondo.
* **Solución**: Asegurar que cuando un modal esté abierto, este consuma el evento del teclado y llame a `e.stopPropagation()` / `e.preventDefault()`, evitando que el evento se propague a los atajos de teclado de la vista inferior.
