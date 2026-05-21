// 1. MODELOS DE TABLAS PURAS (Como se verían en tu SQLite)
export class Curso {
  constructor(public id: string, public abreviatura: string, public nombre: string) {}
}

export class Ambiente {
  constructor(public id: string, public nombre: string) {}
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
}

// 3. LA BASE DE DATOS SIMULADA
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

  // Simulamos la consulta: 
  // SELECT c.*, a.nombre FROM cursos c 
  // JOIN curso_ambientes ca ON c.id = ca.curso_id 
  // JOIN ambientes a ON ca.ambiente_id = a.id
  async obtenerCursos(): Promise<CursoDetalle[]> {
    await this.delay(300);
    
    return this.tablas.cursos.map(curso => {
      // 1. Buscamos en la tabla intermedia qué ambientes le pertenecen a este curso
      const relaciones = this.tablas.curso_ambientes.filter(ca => ca.curso_id === curso.id);
      
      // 2. Extraemos los nombres de esos ambientes
      const nombresAmbientes = relaciones.map(rel => {
        const ambiente = this.tablas.ambientes.find(a => a.id === rel.ambiente_id);
        return ambiente ? ambiente.nombre : 'Desconocido';
      });

      return {
        id: curso.id,
        abreviatura: curso.abreviatura,
        nombre: curso.nombre,
        ambientes: nombresAmbientes
      };
    });
  }

  // --- MUTACIONES (Insert/Update/Delete) ---

  async crearCurso(abreviatura: string, nombre: string, ambientesIds: string[]): Promise<void> {
    await this.delay(500); // Simulamos el tiempo que tarda la DB en escribir
    
    // 1. Insertamos en la tabla cursos
    const nuevoCursoId = crypto.randomUUID();
    this.tablas.cursos.push(new Curso(nuevoCursoId, abreviatura, nombre));

    // 2. Insertamos en la tabla intermedia (Múltiples filas)
    ambientesIds.forEach(ambienteId => {
      this.tablas.curso_ambientes.push(new CursoAmbiente(nuevoCursoId, ambienteId));
    });
  }
}

export const db = new MockDatabase();