// Ruta: src/services/database.ts
import { invoke } from '@tauri-apps/api/core';

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
  archivado: number; // 0 o 1
}

export interface TareaDetail {
  id: string;
  cursoId: string;
  cursoNombre?: string;
  cursoAbreviatura?: string;
  ambienteId: string;
  ambienteNombre: string;
  notaId: string;
  descripcion: string;
  estado: 'incomplete' | 'in_progress' | 'completed';
  fechaEntrega: string;
}

// 3. PARSER DE MARKDOWN Y HELPER DE EDICIÓN
export function formatTaskDueDate(dateStr: string): string {
  if (!dateStr) return '';
  let clean = dateStr.replace(/^@/, '').trim();
  
  // Match DD/MM - HH:MM o DD/MM
  const dateRegex = /^(\d{1,2})\/(\d{1,2})(?:\s*-\s*(\d{1,2}):(\d{1,2}))?$/;
  const match = clean.match(dateRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed in JS
    const year = new Date().getFullYear(); // Usar año corriente
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const dayName = daysOfWeek[date.getDay()];
      const hourMin = match[3] && match[4] ? ` - ${match[3].padStart(2, '0')}:${match[4].padStart(2, '0')}` : '';
      return `${dayName} ${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}${hourMin}`.toUpperCase();
    }
  }
  return clean.toUpperCase();
}

export function parseTaskDueDateToNumber(dateStr: string): number {
  if (!dateStr) return Infinity;
  let clean = dateStr.replace(/^@/, '').trim();
  const dateRegex = /^(\d{1,2})\/(\d{1,2})(?:\s*-\s*(\d{1,2}):(\d{1,2}))?$/;
  const match = clean.match(dateRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const hour = match[3] ? parseInt(match[3], 10) : 0;
    const min = match[4] ? parseInt(match[4], 10) : 0;
    return month * 1000000 + day * 10000 + hour * 100 + min;
  }
  return Infinity;
}

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
class TauriDatabase {
  private tareasCounts = new Map<string, number>();

  async obtenerUsuario() {
    const nombre = await invoke<string>('obtener_nombre_usuario');
    return { nombre };
  }

  async guardarUsuario(nombre: string): Promise<void> {
    await invoke('guardar_nombre_usuario', { nombre });
  }

  async obtenerAmbientesBase(): Promise<Ambiente[]> {
    return await invoke<Ambiente[]>('obtener_ambientes_base');
  }

  async obtenerCursos(): Promise<CursoDetalle[]> {
    return await invoke<CursoDetalle[]>('obtener_cursos');
  }

  async obtenerAmbientesPorCurso(cursoId: string): Promise<Ambiente[]> {
    return await invoke<Ambiente[]>('obtener_ambientes_por_curso', { cursoId });
  }

  async obtenerTareasPendientesPorCurso(cursoId: string): Promise<TareaDetail[]> {
    return await invoke<TareaDetail[]>('obtener_tareas_pendientes_por_curso', { cursoId });
  }

  async obtenerTareasPendientesPorCursoAmbiente(cursoId: string, ambienteId: string): Promise<TareaDetail[]> {
    return await invoke<TareaDetail[]>('obtener_tareas_pendientes_por_curso_ambiente', { cursoId, ambienteId });
  }

  async obtenerNotasPorCursoAmbiente(cursoId: string, ambienteId: string): Promise<Nota[]> {
    const result = await invoke<any[]>('obtener_notas_por_curso_ambiente', { cursoId, ambienteId });
    const notes: Nota[] = [];
    for (const item of result) {
      this.tareasCounts.set(item.id, item.tareas_count || 0);
      notes.push(new Nota(
        item.id,
        item.curso_id,
        item.ambiente_id,
        item.titulo,
        item.contenido,
        item.fecha_creacion
      ));
    }
    return notes;
  }

  async obtenerNotaPorId(notaId: string): Promise<Nota | null> {
    const item = await invoke<any | null>('obtener_nota_por_id', { notaId });
    if (!item) return null;
    return new Nota(
      item.id,
      item.curso_id,
      item.ambiente_id,
      item.titulo,
      item.contenido,
      item.fecha_creacion
    );
  }

  async obtenerTareasPorNota(notaId: string): Promise<TareaDetail[]> {
    return await invoke<TareaDetail[]>('obtener_tareas_por_nota', { notaId });
  }

  obtenerTareasCountDeNotaSync(notaId: string): number {
    return this.tareasCounts.get(notaId) || 0;
  }

  async crearCurso(abreviatura: string, nombre: string, ambientesIds: string[]): Promise<void> {
    await invoke('crear_curso', { abreviatura, nombre, ambientesIds });
  }

  async actualizarTareaEstado(tareaId: string, estado: 'incomplete' | 'in_progress' | 'completed'): Promise<void> {
    await invoke('actualizar_tarea_estado', { tareaId, nuevoEstado: estado });
  }

  async crearNota(cursoId: string, ambienteId: string, titulo: string, contenido: string): Promise<string> {
    return await invoke<string>('crear_nota', { cursoId, ambienteId, titulo, contenido });
  }

  async sincronizarTareasDeNota(notaId: string, markdownContent: string): Promise<void> {
    await invoke('sincronizar_tareas_de_nota', { noteId: notaId, contenido: markdownContent });
  }

  async eliminarCurso(id: string): Promise<void> {
    await invoke('eliminar_curso', { id });
  }

  async eliminarNota(notaId: string): Promise<void> {
    await invoke('eliminar_nota', { notaId });
  }

  async actualizarCurso(id: string, nombre: string, abreviatura: string): Promise<void> {
    await invoke('actualizar_curso', { id, nombre, abreviatura });
  }

  async archivarCurso(id: string, archivado: boolean): Promise<void> {
    await invoke('archivar_curso', { id, archivado });
  }

  async agregarAmbiente(cursoId: string, nombre: string): Promise<void> {
    await invoke('agregar_ambiente', { cursoId, nombre });
  }

  async renameAmbiente(cursoId: string, ambienteId: string, nuevoNombre: string): Promise<void> {
    await invoke('rename_ambiente', { cursoId, ambienteId, nuevoNombre });
  }

  async eliminarAmbiente(cursoId: string, ambienteId: string): Promise<void> {
    await invoke('eliminar_ambiente', { cursoId, ambienteId });
  }

  async obtenerTareasPendientes(): Promise<TareaDetail[]> {
    return await invoke<TareaDetail[]>('obtener_tareas_pendientes');
  }
}

export const db = new TauriDatabase();