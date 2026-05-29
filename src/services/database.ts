// Ruta: src/services/database.ts

// 1. MODELOS DE TABLAS PURAS (Como se verían en tu SQLite)
export class Curso {
  constructor(public id: string, public abreviatura: string, public nombre: string) {}
}

export class Ambiente {
  constructor(public id: string, public nombre: string) {}
}

export class Tarea {
  constructor(
    public id: string,
    public curso_id: string,
    public ambiente_id: string,
    public nota_id: string, // Vincular cada tarea con una nota
    public descripcion: string,
    public estado: 'incomplete' | 'in_progress' | 'completed',
    public fecha_entrega: string
  ) {}
}

export class Nota {
  constructor(
    public id: string,
    public curso_id: string,
    public ambiente_id: string,
    public titulo: string,
    public contenido: string, // Markdown con formato
    public fecha_creacion: string
  ) {}
}

// LA TABLA INTERMEDIA (N:M)
export class CursoAmbiente {
  constructor(public curso_id: string, public ambiente_id: string) {}
}

// 2. INTERFACES PARA LA VISTA (Lo que React necesita para dibujar)
export interface CursoDetalle {
  id: string;
  abreviatura: string;
  nombre: string;
  ambientes: string[]; // Nombres de los ambientes ('Teoría', 'Laboratorio')
  tareasCount: number; // Número de tareas asociadas
}

export interface TareaDetail {
  id: string;
  cursoId: string;
  ambienteId: string;
  ambienteNombre: string;
  notaId: string;
  descripcion: string;
  estado: 'incomplete' | 'in_progress' | 'completed';
  fechaEntrega: string;
}

// 3. PARSER DE MARKDOWN Y HELPER DE EDICIÓN
export function parseMarkdownNote(markdown: string) {
  const lines = markdown.split('\n');
  let titulo = 'Nota sin título';
  const tasksParsed: { descripcion: string; estado: 'incomplete' | 'in_progress' | 'completed'; fechaEntrega: string }[] = [];

  // Buscar el título: primera línea que empiece con "# "
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      titulo = trimmed.substring(2).trim();
      break;
    }
  }

  // Buscar tareas
  // Sintaxis: :Tarea [estado] descripción @fecha o #Tarea [estado] descripción @fecha
  const taskRegex = /^(?::Tarea|#Tarea)\s+\[(.*?)\]\s+(.*?)(?:\s+@(.*))?$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(taskRegex);
    if (match) {
      const stateChar = match[1].trim();
      let estado: 'incomplete' | 'in_progress' | 'completed' = 'incomplete';
      if (stateChar === '/') {
        estado = 'in_progress';
      } else if (stateChar.toLowerCase() === 'x') {
        estado = 'completed';
      }
      
      const descripcion = match[2].trim();
      const fechaEntrega = match[3] ? match[3].trim() : '';
      tasksParsed.push({ descripcion, estado, fechaEntrega });
    }
  }

  return { titulo, tasks: tasksParsed };
}

export function updateTaskStateInMarkdown(
  markdown: string,
  taskDescription: string,
  nuevoEstado: 'incomplete' | 'in_progress' | 'completed'
): string {
  const lines = markdown.split('\n');
  const taskRegex = /^(?::Tarea|#Tarea)\s+\[(.*?)\]\s+(.*?)(?:\s+@(.*))?$/i;
  
  let stateChar = ' ';
  if (nuevoEstado === 'in_progress') stateChar = '/';
  else if (nuevoEstado === 'completed') stateChar = 'x';

  const newLines = lines.map(line => {
    const match = line.trim().match(taskRegex);
    if (match) {
      const desc = match[2].trim();
      if (desc === taskDescription) {
        const prefix = line.trim().startsWith(':Tarea') ? ':Tarea' : '#Tarea';
        const dateStr = match[3] ? ` @${match[3]}` : '';
        const leadingWhitespace = line.match(/^\s*/)?.[0] || '';
        return `${leadingWhitespace}${prefix} [${stateChar}] ${desc}${dateStr}`;
      }
    }
    return line;
  });

  return newLines.join('\n');
}

// 4. LA BASE DE DATOS SIMULADA
class MockDatabase {
  private tablas = {
    // Tabla: cursos
    cursos: [
      new Curso('1', 'ISW', 'Ingeniería de Software III'),
      new Curso('2', 'DB2', 'Base de Datos Avanzadas y Distribuidas'),
      new Curso('3', 'SOP', 'Sistemas Operativos y Redes de Computadoras')
    ],
    // Tabla: ambientes
    ambientes: [
      new Ambiente('amb_1', 'Teoría'),
      new Ambiente('amb_2', 'Laboratorio'),
      new Ambiente('amb_3', 'Práctica'),
      new Ambiente('amb_4', 'Proyecto'),
      new Ambiente('amb_5', 'Seminario')
    ],
    // Tabla: curso_ambientes (La tabla intermedia)
    curso_ambientes: [
      new CursoAmbiente('1', 'amb_1'), // ISW tiene Teoría
      new CursoAmbiente('1', 'amb_2'), // ISW tiene Lab
      new CursoAmbiente('2', 'amb_1'), // DB2 tiene Teoría
      new CursoAmbiente('3', 'amb_1'), // SOP tiene Teoría
      new CursoAmbiente('3', 'amb_2'), // SOP tiene Lab
      new CursoAmbiente('3', 'amb_4')  // SOP tiene Proyecto
    ],
    // Tabla: tareas (Vinculadas a notas mock correspondientes)
    tareas: [
      new Tarea('t1', '1', 'amb_1', 'n1', 'Investigar arquitecturas limpias y patrones de diseño', 'in_progress', 'martes 4 - 15:50'),
      new Tarea('t2', '1', 'amb_2', 'n3', 'Configurar entorno de Tauri, Rust y dependencias locales', 'incomplete', 'jueves 6 - 08:30'),
      new Tarea('t3', '1', 'amb_2', 'n3', 'Diseñar diagramas de secuencia para el flujo de autenticación', 'incomplete', 'viernes 7 - 12:00'),
      new Tarea('t4', '3', 'amb_1', 'n4', 'Estudiar planificación de CPU y algoritmos Round Robin', 'in_progress', 'lunes 10 - 10:15'),
      new Tarea('t5', '3', 'amb_2', 'n5', 'Implementar socket multihilo con soporte para Keep-Alive', 'incomplete', 'miércoles 12 - 16:40'),
      new Tarea('t6', '3', 'amb_4', 'n6', 'Presentar el primer avance del proyecto de fin de curso', 'incomplete', 'viernes 14 - 18:00'),
      new Tarea('t7', '3', 'amb_1', 'n4', 'Resolver cuestionario teórico sobre semáforos y locks', 'incomplete', 'lunes 17 - 09:00'),
      new Tarea('t8', '3', 'amb_2', 'n5', 'Configurar y validar el servidor DNS en la red interna', 'in_progress', 'miércoles 19 - 14:30'),
    ],
    // Tabla: notas (Notas mock por ambiente conteniendo el Markdown inicial)
    notas: [
      new Nota(
        'n1', 
        '1', 
        'amb_1', 
        'Conceptos de Arquitectura Hexagonal', 
        `# Conceptos de Arquitectura Hexagonal\nLa arquitectura hexagonal divide el sistema en puertos y adaptadores para aislar el núcleo del negocio...\n\n:Tarea [/] Investigar arquitecturas limpias y patrones de diseño @martes 4 - 15:50`, 
        '28 de mayo'
      ),
      new Nota(
        'n2', 
        '1', 
        'amb_1', 
        'Patrón Repository y su uso con ORMs', 
        `# Patrón Repository y su uso con ORMs\nEl patrón repository permite abstraer el almacenamiento de datos, facilitando las pruebas unitarias...`, 
        '29 de mayo'
      ),
      new Nota(
        'n3', 
        '1', 
        'amb_2', 
        'Instalación de dependencias Tauri en Linux', 
        `# Instalación de dependencias Tauri en Linux\nEs necesario instalar libwebkit2gtk-4.0-dev, build-essential, curl, wget y otras dependencias...\n\n:Tarea [ ] Configurar entorno de Tauri, Rust y dependencias locales @jueves 6 - 08:30\n:Tarea [ ] Diseñar diagramas de secuencia para el flujo de autenticación @viernes 7 - 12:00`, 
        '25 de mayo'
      ),
      new Nota(
        'n4', 
        '3', 
        'amb_1', 
        'Apuntes sobre Semáforos', 
        `# Apuntes sobre Semáforos\nUn semáforo es una variable entera que se utiliza para la sincronización de procesos concurrentes...\n\n:Tarea [/] Estudiar planificación de CPU y algoritmos Round Robin @lunes 10 - 10:15\n:Tarea [ ] Resolver cuestionario teórico sobre semáforos y locks @lunes 17 - 09:00`, 
        '20 de mayo'
      ),
      new Nota(
        'n5',
        '3',
        'amb_2',
        'Socket multihilo en Java y Servidor DNS',
        `# Socket multihilo en Java y Servidor DNS\nNotas sobre el comportamiento de sockets TCP y configuración local del servidor DNS.\n\n:Tarea [ ] Implementar socket multihilo con soporte para Keep-Alive @miércoles 12 - 16:40\n:Tarea [/] Configurar y validar el servidor DNS en la red interna @miércoles 19 - 14:30`,
        '21 de mayo'
      ),
      new Nota(
        'n6',
        '3',
        'amb_4',
        'Avance del Proyecto de Fin de Curso',
        `# Avance del Proyecto de Fin de Curso\nPresentación de diagramas UML iniciales y estructura del backend.\n\n:Tarea [ ] Presentar el primer avance del proyecto de fin de curso @viernes 14 - 18:00`,
        '24 de mayo'
      )
    ]
  };

  private usuario = { nombre: 'Dante' };

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- QUERIES (Peticiones) ---

  async obtenerUsuario() {
    await this.delay(100);
    return this.usuario;
  }

  async obtenerAmbientesBase(): Promise<Ambiente[]> {
    await this.delay(200);
    return [...this.tablas.ambientes];
  }

  async obtenerCursos(): Promise<CursoDetalle[]> {
    await this.delay(300);
    
    return this.tablas.cursos.map(curso => {
      const relaciones = this.tablas.curso_ambientes.filter(ca => ca.curso_id === curso.id);
      
      const nombresAmbientes = relaciones.map(rel => {
        const ambiente = this.tablas.ambientes.find(a => a.id === rel.ambiente_id);
        return ambiente ? ambiente.nombre : 'Desconocido';
      });

      const tareasCount = this.tablas.tareas.filter(
        t => t.curso_id === curso.id && t.estado !== 'completed'
      ).length;

      return {
        id: curso.id,
        abreviatura: curso.abreviatura,
        nombre: curso.nombre,
        ambientes: nombresAmbientes,
        tareasCount
      };
    });
  }

  async obtenerAmbientesPorCurso(cursoId: string): Promise<Ambiente[]> {
    await this.delay(100);
    const relaciones = this.tablas.curso_ambientes.filter(ca => ca.curso_id === cursoId);
    return relaciones.map(rel => {
      const amb = this.tablas.ambientes.find(a => a.id === rel.ambiente_id);
      return amb!;
    }).filter(Boolean);
  }

  async obtenerTareasPendientesPorCurso(cursoId: string): Promise<TareaDetail[]> {
    await this.delay(200);
    return this.tablas.tareas
      .filter(t => t.curso_id === cursoId && t.estado !== 'completed')
      .map(t => {
        const amb = this.tablas.ambientes.find(a => a.id === t.ambiente_id);
        return {
          id: t.id,
          cursoId: t.curso_id,
          ambienteId: t.ambiente_id,
          ambienteNombre: amb ? amb.nombre : 'Desconocido',
          notaId: t.nota_id,
          descripcion: t.descripcion,
          estado: t.estado,
          fechaEntrega: t.fecha_entrega
        };
      });
  }

  async obtenerTareasPendientesPorCursoAmbiente(cursoId: string, ambienteId: string): Promise<TareaDetail[]> {
    await this.delay(200);
    return this.tablas.tareas
      .filter(t => t.curso_id === cursoId && t.ambiente_id === ambienteId && t.estado !== 'completed')
      .map(t => {
        const amb = this.tablas.ambientes.find(a => a.id === t.ambiente_id);
        return {
          id: t.id,
          cursoId: t.curso_id,
          ambienteId: t.ambiente_id,
          ambienteNombre: amb ? amb.nombre : 'Desconocido',
          notaId: t.nota_id,
          descripcion: t.descripcion,
          estado: t.estado,
          fechaEntrega: t.fecha_entrega
        };
      });
  }

  async obtenerNotasPorCursoAmbiente(cursoId: string, ambienteId: string): Promise<Nota[]> {
    await this.delay(200);
    return this.tablas.notas.filter(n => n.curso_id === cursoId && n.ambiente_id === ambienteId);
  }

  async obtenerNotaPorId(notaId: string): Promise<Nota | null> {
    await this.delay(100);
    return this.tablas.notas.find(n => n.id === notaId) || null;
  }

  async obtenerTareasPorNota(notaId: string): Promise<TareaDetail[]> {
    await this.delay(150);
    return this.tablas.tareas
      .filter(t => t.nota_id === notaId)
      .map(t => {
        const amb = this.tablas.ambientes.find(a => a.id === t.ambiente_id);
        return {
          id: t.id,
          cursoId: t.curso_id,
          ambienteId: t.ambiente_id,
          ambienteNombre: amb ? amb.nombre : 'Desconocido',
          notaId: t.nota_id,
          descripcion: t.descripcion,
          estado: t.estado,
          fechaEntrega: t.fecha_entrega
        };
      });
  }

  obtenerTareasCountDeNotaSync(notaId: string): number {
    return this.tablas.tareas.filter(t => t.nota_id === notaId).length;
  }

  // --- MUTACIONES ---

  async crearCurso(abreviatura: string, nombre: string, ambientesIds: string[]): Promise<void> {
    await this.delay(500);
    const nuevoCursoId = crypto.randomUUID();
    this.tablas.cursos.push(new Curso(nuevoCursoId, abreviatura, nombre));

    ambientesIds.forEach(ambienteId => {
      this.tablas.curso_ambientes.push(new CursoAmbiente(nuevoCursoId, ambienteId));
    });
  }

  async actualizarTareaEstado(tareaId: string, estado: 'incomplete' | 'in_progress' | 'completed'): Promise<void> {
    await this.delay(100);
    const t = this.tablas.tareas.find(x => x.id === tareaId);
    if (t) {
      t.estado = estado;
      
      // Sincronizar de vuelta al Markdown de la nota
      const note = this.tablas.notas.find(n => n.id === t.nota_id);
      if (note) {
        note.contenido = updateTaskStateInMarkdown(note.contenido, t.descripcion, estado);
        const parsed = parseMarkdownNote(note.contenido);
        note.titulo = parsed.titulo;
      }
    }
  }

  async crearNota(cursoId: string, ambienteId: string, titulo: string, contenido: string): Promise<string> {
    await this.delay(300);
    const id = crypto.randomUUID();
    const nueva = new Nota(
      id,
      cursoId,
      ambienteId,
      titulo,
      contenido,
      new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
    );
    this.tablas.notas.push(nueva);
    
    // Sincronizar por primera vez si contiene tareas
    await this.sincronizarTareasDeNota(id, contenido);
    
    return id;
  }

  async sincronizarTareasDeNota(notaId: string, markdownContent: string): Promise<void> {
    await this.delay(100);
    const note = this.tablas.notas.find(n => n.id === notaId);
    if (!note) return;

    note.contenido = markdownContent;
    
    const parsed = parseMarkdownNote(markdownContent);
    note.titulo = parsed.titulo;

    // Eliminar tareas viejas de esta nota
    this.tablas.tareas = this.tablas.tareas.filter(t => t.nota_id !== notaId);

    // Insertar tareas nuevas
    parsed.tasks.forEach((taskParsed) => {
      const newTaskId = crypto.randomUUID();
      const newT = new Tarea(
        newTaskId,
        note.curso_id,
        note.ambiente_id,
        notaId,
        taskParsed.descripcion,
        taskParsed.estado,
        taskParsed.fechaEntrega
      );
      this.tablas.tareas.push(newT);
    });
  }
}

export const db = new MockDatabase();