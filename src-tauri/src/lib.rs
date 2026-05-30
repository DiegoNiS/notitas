use std::fs;
use std::path::{Path, PathBuf};
use rusqlite::Connection;
use serde::{Serialize, Deserialize};
use tauri::Manager;

pub struct AppPaths {
    pub db_path: PathBuf,
    pub notes_dir: PathBuf,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Ambiente {
    pub id: String,
    pub nombre: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[allow(non_snake_case)]
pub struct TareaDetail {
    pub id: String,
    pub cursoId: String,
    pub ambienteId: String,
    pub ambienteNombre: String,
    pub notaId: String,
    pub descripcion: String,
    pub estado: String,
    pub fechaEntrega: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Nota {
    pub id: String,
    pub curso_id: String,
    pub ambiente_id: String,
    pub titulo: String,
    pub contenido: String,
    pub fecha_creacion: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NotaConCount {
    pub id: String,
    pub curso_id: String,
    pub ambiente_id: String,
    pub titulo: String,
    pub contenido: String,
    pub fecha_creacion: String,
    pub tareas_count: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[allow(non_snake_case)]
pub struct CursoDetalle {
    pub id: String,
    pub abreviatura: String,
    pub nombre: String,
    pub ambientes: Vec<String>,
    pub tareasCount: i64,
    pub archivado: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedTask {
    pub descripcion: String,
    pub estado: String,
    pub fecha_entrega: String,
}

// Abre una conexión habilitando las llaves foráneas
fn get_connection(db_path: &Path) -> Result<Connection, String> {
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    conn.execute("PRAGMA foreign_keys = ON;", []).map_err(|e| e.to_string())?;
    Ok(conn)
}

// Analizador de Markdown en Rust para extraer el título de la nota y sus tareas
pub fn parse_markdown_note(markdown: &str) -> (String, Vec<ParsedTask>) {
    let mut titulo = "Nota sin título".to_string();
    let mut tasks = Vec::new();

    let mut found_title = false;
    for line in markdown.lines() {
        let trimmed = line.trim();
        if !found_title && trimmed.starts_with("# ") {
            titulo = trimmed[2..].trim().to_string();
            found_title = true;
        }

        if trimmed.starts_with(":Tarea") || trimmed.starts_with("#Tarea") {
            if let (Some(start_bracket), Some(end_bracket)) = (trimmed.find('['), trimmed.find(']')) {
                if start_bracket > 0 && end_bracket > start_bracket {
                    let state_char = trimmed[start_bracket + 1..end_bracket].trim();
                    let rest = trimmed[end_bracket + 1..].trim();

                    // Separar por el último '@' para obtener la fecha
                    let (desc, fecha_entrega) = if let Some(at_idx) = rest.rfind('@') {
                        (rest[..at_idx].trim().to_string(), rest[at_idx + 1..].trim().to_string())
                    } else {
                        (rest.to_string(), "".to_string())
                    };

                    let estado = match state_char {
                        "/" => "in_progress",
                        "x" | "X" => "completed",
                        _ => "incomplete",
                    };

                    tasks.push(ParsedTask {
                        descripcion: desc,
                        estado: estado.to_string(),
                        fecha_entrega,
                    });
                }
            }
        }
    }

    (titulo, tasks)
}

// Actualiza el estado de una tarea específica en el texto plano de Markdown
pub fn update_task_state_in_markdown(
    markdown: &str,
    task_description: &str,
    nuevo_estado: &str,
) -> String {
    let state_char = match nuevo_estado {
        "in_progress" => "/",
        "completed" => "x",
        _ => " ",
    };

    let mut new_lines = Vec::new();
    for line in markdown.lines() {
        let trimmed = line.trim();
        let mut updated = false;

        if trimmed.starts_with(":Tarea") || trimmed.starts_with("#Tarea") {
            if let (Some(start_bracket), Some(end_bracket)) = (trimmed.find('['), trimmed.find(']')) {
                if start_bracket > 0 && end_bracket > start_bracket {
                    let rest = trimmed[end_bracket + 1..].trim();
                    let (desc, fecha_str) = if let Some(at_idx) = rest.rfind('@') {
                        (rest[..at_idx].trim(), format!(" @{}", rest[at_idx + 1..].trim()))
                    } else {
                        (rest, "".to_string())
                    };

                    if desc == task_description {
                        let prefix = if trimmed.starts_with(":Tarea") { ":Tarea" } else { "#Tarea" };
                        let leading_whitespace = line.chars().take_while(|c| c.is_whitespace()).collect::<String>();
                        new_lines.push(format!("{}{}[{}] {}{}", leading_whitespace, prefix, state_char, desc, fecha_str));
                        updated = true;
                    }
                }
            }
        }

        if !updated {
            new_lines.push(line.to_string());
        }
    }

    new_lines.join("\n")
}

// Inicializa las tablas de SQLite y carga datos semilla
pub fn inicializar_db(db_path: &Path) -> Result<(), rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    conn.execute("PRAGMA foreign_keys = ON;", [])?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS configuracion (
            clave TEXT PRIMARY KEY,
            valor TEXT NOT NULL
        );",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS ambientes_plantilla (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL
        );",
        [],
    )?;

    // Poblamos ambientes predeterminados
    conn.execute(
        "INSERT OR IGNORE INTO ambientes_plantilla (id, nombre) VALUES 
        ('amb_1', 'Teoría'),
        ('amb_2', 'Laboratorio'),
        ('amb_3', 'Práctica'),
        ('amb_4', 'Proyecto'),
        ('amb_5', 'Seminario');",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS cursos (
            id TEXT PRIMARY KEY,
            abreviatura TEXT NOT NULL,
            nombre TEXT NOT NULL,
            fecha_creacion TEXT NOT NULL,
            archivado INTEGER NOT NULL DEFAULT 0
        );",
        [],
    )?;

    // Migración para bases de datos existentes
    let _ = conn.execute("ALTER TABLE cursos ADD COLUMN archivado INTEGER NOT NULL DEFAULT 0;", []);

    conn.execute(
        "CREATE TABLE IF NOT EXISTS ambiente_curso (
            id TEXT PRIMARY KEY,
            curso_id TEXT NOT NULL,
            ambiente_plantilla_id TEXT NOT NULL,
            orden INTEGER DEFAULT 0,
            is_default BOOLEAN NOT NULL DEFAULT 0,
            FOREIGN KEY(curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
            FOREIGN KEY(ambiente_plantilla_id) REFERENCES ambientes_plantilla(id) ON DELETE RESTRICT
        );",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS notas (
            id TEXT PRIMARY KEY,
            titulo TEXT NOT NULL,
            ambiente_curso_id TEXT NOT NULL,
            nombre_archivo TEXT NOT NULL,
            fecha_creacion TEXT NOT NULL,
            fecha_modificacion TEXT NOT NULL,
            FOREIGN KEY(ambiente_curso_id) REFERENCES ambiente_curso(id) ON DELETE CASCADE
        );",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tareas (
            id TEXT PRIMARY KEY,
            nota_id TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'incomplete',
            fecha_entrega TEXT NOT NULL,
            fecha_creacion TEXT NOT NULL,
            FOREIGN KEY(nota_id) REFERENCES notas(id) ON DELETE CASCADE
        );",
        [],
    )?;

    Ok(())
}

// Helper para sincronizar tareas de una nota en base de datos
fn sincronizar_tareas_de_nota_impl(
    conn: &mut Connection,
    paths: &AppPaths,
    note_id: &str,
    markdown_content: &str,
) -> Result<(), String> {
    // Escribimos el contenido al archivo Markdown
    let filename = format!("{}.md", note_id);
    let note_file_path = paths.notes_dir.join(&filename);
    fs::write(&note_file_path, markdown_content).map_err(|e| e.to_string())?;

    // Parseamos el título y las tareas del Markdown
    let (titulo_parseado, tasks_parseadas) = parse_markdown_note(markdown_content);
    let now_iso = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Actualizamos el título y la fecha de modificación en la DB
    tx.execute(
        "UPDATE notas SET titulo = ?1, fecha_modificacion = ?2 WHERE id = ?3",
        (&titulo_parseado, &now_iso, note_id),
    ).map_err(|e| e.to_string())?;

    // Obtenemos las tareas antiguas para conservar sus IDs estables
    let mut stmt = tx.prepare("SELECT id, descripcion FROM tareas WHERE nota_id = ?1").map_err(|e| e.to_string())?;
    let old_tasks_rows = stmt.query_map([note_id], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    }).map_err(|e| e.to_string())?;

    let mut old_tasks = Vec::new();
    for row in old_tasks_rows {
        old_tasks.push(row.map_err(|e| e.to_string())?);
    }
    drop(stmt);

    // Borramos las tareas antiguas de la DB
    tx.execute("DELETE FROM tareas WHERE nota_id = ?1", [note_id]).map_err(|e| e.to_string())?;

    // Insertamos las nuevas tareas indexadas
    for task in tasks_parseadas {
        // Si hay coincidencia de texto, reutilizamos su ID
        let existing_id = old_tasks.iter()
            .find(|(_, desc)| desc == &task.descripcion)
            .map(|(id, _)| id.clone())
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

        let estado_db = match task.estado.as_str() {
            "in_progress" => "in_progress",
            "completed" => "completed",
            _ => "incomplete",
        };

        tx.execute(
            "INSERT INTO tareas (id, nota_id, descripcion, estado, fecha_entrega, fecha_creacion) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            (&existing_id, &note_id, &task.descripcion, &estado_db, &task.fecha_entrega, &now_iso),
        ).map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// --- COMANDOS TAURI IPC ---

#[tauri::command]
fn obtener_ambientes_base(paths: tauri::State<'_, AppPaths>) -> Result<Vec<Ambiente>, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare("SELECT id, nombre FROM ambientes_plantilla ORDER BY id ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(Ambiente {
            id: row.get(0)?,
            nombre: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn obtener_cursos(paths: tauri::State<'_, AppPaths>) -> Result<Vec<CursoDetalle>, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare(
        "SELECT 
            c.id, 
            c.abreviatura, 
            c.nombre,
            (
                SELECT group_concat(ap.nombre, ',') 
                FROM ambiente_curso ac
                JOIN ambientes_plantilla ap ON ac.ambiente_plantilla_id = ap.id
                WHERE ac.curso_id = c.id
                ORDER BY ac.orden ASC
            ) as nombres_ambientes,
            (
                SELECT COUNT(*)
                FROM tareas t
                JOIN notas n ON t.nota_id = n.id
                JOIN ambiente_curso ac ON n.ambiente_curso_id = ac.id
                WHERE ac.curso_id = c.id AND t.estado != 'completed'
            ) as tareas_count,
            c.archivado
        FROM cursos c
        ORDER BY c.fecha_creacion DESC;"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        let abreviatura: String = row.get(1)?;
        let nombre: String = row.get(2)?;
        let ambientes_str: Option<String> = row.get(3)?;
        let tareas_count: i64 = row.get(4)?;
        let archivado: i32 = row.get(5)?;

        let ambientes = match ambientes_str {
            Some(s) => s.split(',').map(|x| x.to_string()).collect(),
            None => Vec::new(),
        };

        Ok(CursoDetalle {
            id,
            abreviatura,
            nombre,
            ambientes,
            tareasCount: tareas_count,
            archivado,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn crear_curso(
    paths: tauri::State<'_, AppPaths>,
    abreviatura: String,
    nombre: String,
    ambientes_ids: Vec<String>,
) -> Result<(), String> {
    let mut conn = get_connection(&paths.db_path)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let curso_id = uuid::Uuid::new_v4().to_string();
    let fecha = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    tx.execute(
        "INSERT INTO cursos (id, abreviatura, nombre, fecha_creacion) VALUES (?1, ?2, ?3, ?4)",
        (&curso_id, &abreviatura, &nombre, &fecha),
    ).map_err(|e| e.to_string())?;

    for (i, amb_id) in ambientes_ids.iter().enumerate() {
        let rel_id = uuid::Uuid::new_v4().to_string();
        let is_default = if i == 0 { 1 } else { 0 };
        tx.execute(
            "INSERT INTO ambiente_curso (id, curso_id, ambiente_plantilla_id, orden, is_default) VALUES (?1, ?2, ?3, ?4, ?5)",
            (&rel_id, &curso_id, amb_id, &(i as i32), &is_default),
        ).map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn eliminar_curso(paths: tauri::State<'_, AppPaths>, id: String) -> Result<(), String> {
    let conn = get_connection(&paths.db_path)?;

    // Recuperamos todas las notas de este curso para poder limpiar sus archivos Markdown físicos
    let mut stmt = conn.prepare(
        "SELECT n.id FROM notas n
         JOIN ambiente_curso ac ON n.ambiente_curso_id = ac.id
         WHERE ac.curso_id = ?1"
    ).map_err(|e| e.to_string())?;

    let note_ids = stmt.query_map([&id], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;

    // Borramos archivos físicos
    for note_id in note_ids {
        let note_file = paths.notes_dir.join(format!("{}.md", note_id));
        if note_file.exists() {
            let _ = fs::remove_file(note_file);
        }
    }

    // ON DELETE CASCADE en cascada eliminará ambiente_curso, notas y tareas
    conn.execute("DELETE FROM cursos WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn obtener_ambientes_por_curso(paths: tauri::State<'_, AppPaths>, curso_id: String) -> Result<Vec<Ambiente>, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare(
        "SELECT ap.id, ap.nombre
         FROM ambiente_curso ac
         JOIN ambientes_plantilla ap ON ac.ambiente_plantilla_id = ap.id
         WHERE ac.curso_id = ?1
         ORDER BY ac.orden ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&curso_id], |row| {
        Ok(Ambiente {
            id: row.get(0)?,
            nombre: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn obtener_tareas_pendientes_por_curso(paths: tauri::State<'_, AppPaths>, curso_id: String) -> Result<Vec<TareaDetail>, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare(
        "SELECT 
            t.id, 
            ac.curso_id, 
            ac.ambiente_plantilla_id as ambiente_id,
            ap.nombre as ambiente_nombre, 
            t.nota_id, 
            t.descripcion, 
            t.estado, 
            t.fecha_entrega
         FROM tareas t
         JOIN notas n ON t.nota_id = n.id
         JOIN ambiente_curso ac ON n.ambiente_curso_id = ac.id
         JOIN ambientes_plantilla ap ON ac.ambiente_plantilla_id = ap.id
         WHERE ac.curso_id = ?1 AND t.estado != 'completed'
         ORDER BY t.fecha_entrega ASC, t.fecha_creacion DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&curso_id], |row| {
        Ok(TareaDetail {
            id: row.get(0)?,
            cursoId: row.get(1)?,
            ambienteId: row.get(2)?,
            ambienteNombre: row.get(3)?,
            notaId: row.get(4)?,
            descripcion: row.get(5)?,
            estado: row.get(6)?,
            fechaEntrega: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn obtener_tareas_pendientes_por_curso_ambiente(
    paths: tauri::State<'_, AppPaths>, 
    curso_id: String, 
    ambiente_id: String
) -> Result<Vec<TareaDetail>, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare(
        "SELECT 
            t.id, 
            ac.curso_id, 
            ac.ambiente_plantilla_id as ambiente_id,
            ap.nombre as ambiente_nombre, 
            t.nota_id, 
            t.descripcion, 
            t.estado, 
            t.fecha_entrega
         FROM tareas t
         JOIN notas n ON t.nota_id = n.id
         JOIN ambiente_curso ac ON n.ambiente_curso_id = ac.id
         JOIN ambientes_plantilla ap ON ac.ambiente_plantilla_id = ap.id
         WHERE ac.curso_id = ?1 AND ac.ambiente_plantilla_id = ?2 AND t.estado != 'completed'
         ORDER BY t.fecha_entrega ASC, t.fecha_creacion DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&curso_id, &ambiente_id], |row| {
        Ok(TareaDetail {
            id: row.get(0)?,
            cursoId: row.get(1)?,
            ambienteId: row.get(2)?,
            ambienteNombre: row.get(3)?,
            notaId: row.get(4)?,
            descripcion: row.get(5)?,
            estado: row.get(6)?,
            fechaEntrega: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn obtener_notas_por_curso_ambiente(
    paths: tauri::State<'_, AppPaths>,
    curso_id: String,
    ambiente_id: String,
) -> Result<Vec<NotaConCount>, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare(
        "SELECT 
            n.id, 
            ac.curso_id, 
            ac.ambiente_plantilla_id as ambiente_id, 
            n.titulo, 
            n.fecha_creacion,
            (SELECT COUNT(*) FROM tareas t WHERE t.nota_id = n.id) as tareas_count
         FROM notas n
         JOIN ambiente_curso ac ON n.ambiente_curso_id = ac.id
         WHERE ac.curso_id = ?1 AND ac.ambiente_plantilla_id = ?2
         ORDER BY n.fecha_modificacion DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&curso_id, &ambiente_id], |row| {
        let id: String = row.get(0)?;
        let curso_id: String = row.get(1)?;
        let ambiente_id: String = row.get(2)?;
        let titulo: String = row.get(3)?;
        let fecha_creacion: String = row.get(4)?;
        let tareas_count: i64 = row.get(5)?;
        
        Ok((id, curso_id, ambiente_id, titulo, fecha_creacion, tareas_count))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        let (id, curso_id, ambiente_id, titulo, fecha_creacion, tareas_count) = row.map_err(|e| e.to_string())?;
        let content_file = paths.notes_dir.join(format!("{}.md", id));
        let contenido = fs::read_to_string(content_file).unwrap_or_default();

        result.push(NotaConCount {
            id,
            curso_id,
            ambiente_id,
            titulo,
            contenido,
            fecha_creacion,
            tareas_count,
        });
    }
    Ok(result)
}

#[tauri::command]
fn obtener_nota_por_id(paths: tauri::State<'_, AppPaths>, nota_id: String) -> Result<Option<Nota>, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare(
        "SELECT 
            n.id, 
            ac.curso_id, 
            ac.ambiente_plantilla_id as ambiente_id, 
            n.titulo, 
            n.fecha_creacion
         FROM notas n
         JOIN ambiente_curso ac ON n.ambiente_curso_id = ac.id
         WHERE n.id = ?1"
    ).map_err(|e| e.to_string())?;

    let mut rows = stmt.query_map([&nota_id], |row| {
        Ok(Nota {
            id: row.get(0)?,
            curso_id: row.get(1)?,
            ambiente_id: row.get(2)?,
            titulo: row.get(3)?,
            contenido: "".to_string(),
            fecha_creacion: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next() {
        let mut note = row.map_err(|e| e.to_string())?;
        let content_file = paths.notes_dir.join(format!("{}.md", note.id));
        note.contenido = fs::read_to_string(content_file).unwrap_or_default();
        Ok(Some(note))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn obtener_tareas_por_nota(paths: tauri::State<'_, AppPaths>, nota_id: String) -> Result<Vec<TareaDetail>, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare(
        "SELECT 
            t.id, 
            ac.curso_id, 
            ac.ambiente_plantilla_id as ambiente_id, 
            ap.nombre as ambiente_nombre, 
            t.nota_id, 
            t.descripcion, 
            t.estado, 
            t.fecha_entrega
         FROM tareas t
         JOIN notas n ON t.nota_id = n.id
         JOIN ambiente_curso ac ON n.ambiente_curso_id = ac.id
         JOIN ambientes_plantilla ap ON ac.ambiente_plantilla_id = ap.id
         WHERE t.nota_id = ?1
         ORDER BY t.fecha_entrega ASC, t.fecha_creacion DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&nota_id], |row| {
        Ok(TareaDetail {
            id: row.get(0)?,
            cursoId: row.get(1)?,
            ambienteId: row.get(2)?,
            ambienteNombre: row.get(3)?,
            notaId: row.get(4)?,
            descripcion: row.get(5)?,
            estado: row.get(6)?,
            fechaEntrega: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn crear_nota(
    paths: tauri::State<'_, AppPaths>,
    curso_id: String,
    ambiente_id: String,
    titulo: String,
    contenido: String,
) -> Result<String, String> {
    let mut conn = get_connection(&paths.db_path)?;

    // Encontrar el ID de la relación ambiente_curso
    let ac_id = {
        let mut stmt = conn.prepare(
            "SELECT id FROM ambiente_curso WHERE curso_id = ?1 AND ambiente_plantilla_id = ?2"
        ).map_err(|e| e.to_string())?;
        
        let mut rows = stmt.query_map([&curso_id, &ambiente_id], |row| row.get::<_, String>(0)).map_err(|e| e.to_string())?;
        
        match rows.next() {
            Some(r) => r.map_err(|e| e.to_string())?,
            None => return Err("No se encontró la asociación del ambiente con el curso".to_string()),
        }
    };

    let note_id = uuid::Uuid::new_v4().to_string();
    let filename = format!("{}.md", note_id);
    
    // Meses en español
    let date_now = chrono::Local::now();
    let mes_es = match date_now.format("%m").to_string().as_str() {
        "01" => "enero",
        "02" => "febrero",
        "03" => "marzo",
        "04" => "abril",
        "05" => "mayo",
        "06" => "junio",
        "07" => "julio",
        "08" => "agosto",
        "09" => "septiembre",
        "10" => "octubre",
        "11" => "noviembre",
        "12" => "diciembre",
        _ => "de",
    };
    let fecha_es = format!("{} de {}", date_now.format("%e").to_string().trim(), mes_es);
    let now_iso = date_now.format("%Y-%m-%d %H:%M:%S").to_string();

    // Escribimos archivo físico
    fs::write(paths.notes_dir.join(&filename), &contenido).map_err(|e| e.to_string())?;

    // Registramos en base de datos
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO notas (id, titulo, ambiente_curso_id, nombre_archivo, fecha_creacion, fecha_modificacion) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        (&note_id, &titulo, &ac_id, &filename, &fecha_es, &now_iso),
    ).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;

    // Sincronizamos las tareas contenidas
    sincronizar_tareas_de_nota_impl(&mut conn, &paths, &note_id, &contenido)?;

    Ok(note_id)
}

#[tauri::command]
fn sincronizar_tareas_de_nota(
    paths: tauri::State<'_, AppPaths>,
    note_id: String,
    contenido: String,
) -> Result<(), String> {
    let mut conn = get_connection(&paths.db_path)?;
    sincronizar_tareas_de_nota_impl(&mut conn, &paths, &note_id, &contenido)
}

#[tauri::command]
fn actualizar_tarea_estado(
    paths: tauri::State<'_, AppPaths>,
    tarea_id: String,
    nuevo_estado: String,
) -> Result<(), String> {
    let mut conn = get_connection(&paths.db_path)?;

    // Recuperamos los metadatos de la tarea (nota_id y descripción) en un bloque cerrado para liberar préstamos
    let (note_id, descripcion) = {
        let mut stmt = conn.prepare("SELECT nota_id, descripcion FROM tareas WHERE id = ?1").map_err(|e| e.to_string())?;
        let mut rows = stmt.query_map([&tarea_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        }).map_err(|e| e.to_string())?;

        match rows.next() {
            Some(r) => r.map_err(|e| e.to_string())?,
            None => return Err("No se encontró la tarea especificada".to_string()),
        }
    };

    // Leemos el Markdown del archivo
    let content_file = paths.notes_dir.join(format!("{}.md", note_id));
    let contenido = fs::read_to_string(&content_file).unwrap_or_default();

    // Actualizamos el estado en el Markdown
    let nuevo_contenido = update_task_state_in_markdown(&contenido, &descripcion, &nuevo_estado);

    // Escribimos de vuelta y re-indexamos en DB mediante el helper transaccional
    sincronizar_tareas_de_nota_impl(&mut conn, &paths, &note_id, &nuevo_contenido)?;
    Ok(())
}

#[tauri::command]
fn eliminar_nota(paths: tauri::State<'_, AppPaths>, nota_id: String) -> Result<(), String> {
    let conn = get_connection(&paths.db_path)?;

    // Borramos el archivo físico Markdown
    let note_file = paths.notes_dir.join(format!("{}.md", nota_id));
    if note_file.exists() {
        let _ = fs::remove_file(note_file);
    }

    // ON DELETE CASCADE en cascada eliminará las tareas de esta nota
    conn.execute("DELETE FROM notas WHERE id = ?1", [&nota_id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn obtener_tareas_pendientes(paths: tauri::State<'_, AppPaths>) -> Result<Vec<TareaDetail>, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare(
        "SELECT 
            t.id, 
            ac.curso_id, 
            ac.ambiente_plantilla_id as ambiente_id,
            ap.nombre as ambiente_nombre, 
            t.nota_id, 
            t.descripcion, 
            t.estado, 
            t.fecha_entrega
         FROM tareas t
         JOIN notas n ON t.nota_id = n.id
         JOIN ambiente_curso ac ON n.ambiente_curso_id = ac.id
         JOIN ambientes_plantilla ap ON ac.ambiente_plantilla_id = ap.id
         WHERE t.estado != 'completed'
         ORDER BY t.fecha_entrega ASC, t.fecha_creacion DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(TareaDetail {
            id: row.get(0)?,
            cursoId: row.get(1)?,
            ambienteId: row.get(2)?,
            ambienteNombre: row.get(3)?,
            notaId: row.get(4)?,
            descripcion: row.get(5)?,
            estado: row.get(6)?,
            fechaEntrega: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
fn obtener_nombre_usuario(paths: tauri::State<'_, AppPaths>) -> Result<String, String> {
    let conn = get_connection(&paths.db_path)?;
    let mut stmt = conn.prepare("SELECT valor FROM configuracion WHERE clave = 'username'").map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let name: String = row.get(0).map_err(|e| e.to_string())?;
        Ok(name)
    } else {
        Ok("".to_string())
    }
}

#[tauri::command]
fn guardar_nombre_usuario(paths: tauri::State<'_, AppPaths>, nombre: String) -> Result<(), String> {
    let conn = get_connection(&paths.db_path)?;
    conn.execute(
        "INSERT OR REPLACE INTO configuracion (clave, valor) VALUES ('username', ?1)",
        [&nombre],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn actualizar_curso(paths: tauri::State<'_, AppPaths>, id: String, nombre: String, abreviatura: String) -> Result<(), String> {
    let conn = get_connection(&paths.db_path)?;
    conn.execute(
        "UPDATE cursos SET nombre = ?1, abreviatura = ?2 WHERE id = ?3",
        [&nombre, &abreviatura, &id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn archivar_curso(paths: tauri::State<'_, AppPaths>, id: String, archivado: bool) -> Result<(), String> {
    let conn = get_connection(&paths.db_path)?;
    let val = if archivado { 1 } else { 0 };
    conn.execute(
        "UPDATE cursos SET archivado = ?1 WHERE id = ?2",
        (&val, &id),
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn agregar_ambiente(paths: tauri::State<'_, AppPaths>, curso_id: String, nombre: String) -> Result<(), String> {
    let mut conn = get_connection(&paths.db_path)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // 1. Buscamos o creamos el plantilla_id para este nombre
    let mut plantilla_id = String::new();
    {
        let mut stmt = tx.prepare("SELECT id FROM ambientes_plantilla WHERE nombre = ?1").map_err(|e| e.to_string())?;
        let mut rows = stmt.query([&nombre]).map_err(|e| e.to_string())?;
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            plantilla_id = row.get(0).map_err(|e| e.to_string())?;
        }
    }

    if plantilla_id.is_empty() {
        plantilla_id = uuid::Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO ambientes_plantilla (id, nombre) VALUES (?1, ?2)",
            [&plantilla_id, &nombre],
        ).map_err(|e| e.to_string())?;
    }

    // 2. Buscamos el orden máximo actual para este curso
    let mut max_orden = 0;
    {
        let mut stmt = tx.prepare("SELECT COALESCE(MAX(orden), -1) FROM ambiente_curso WHERE curso_id = ?1").map_err(|e| e.to_string())?;
        let mut rows = stmt.query([&curso_id]).map_err(|e| e.to_string())?;
        if let Some(row) = rows.next().map_err(|e| e.to_string())? {
            max_orden = row.get::<_, i32>(0).map_err(|e| e.to_string())? + 1;
        }
    }

    // 3. Insertamos en ambiente_curso
    let ac_id = uuid::Uuid::new_v4().to_string();
    tx.execute(
        "INSERT INTO ambiente_curso (id, curso_id, ambiente_plantilla_id, orden, is_default) VALUES (?1, ?2, ?3, ?4, 0)",
        (&ac_id, &curso_id, &plantilla_id, &max_orden),
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn rename_ambiente(paths: tauri::State<'_, AppPaths>, curso_id: String, ambiente_id: String, nuevo_nombre: String) -> Result<(), String> {
    let conn = get_connection(&paths.db_path)?;
    
    // 1. Creamos un nuevo template con el nuevo nombre
    let plantilla_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO ambientes_plantilla (id, nombre) VALUES (?1, ?2)",
        [&plantilla_id, &nuevo_nombre],
    ).map_err(|e| e.to_string())?;

    // 2. Actualizamos la relación del curso
    conn.execute(
        "UPDATE ambiente_curso SET ambiente_plantilla_id = ?1 WHERE curso_id = ?2 AND ambiente_plantilla_id = ?3",
        [&plantilla_id, &curso_id, &ambiente_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn eliminar_ambiente(paths: tauri::State<'_, AppPaths>, curso_id: String, ambiente_id: String) -> Result<(), String> {
    let conn = get_connection(&paths.db_path)?;

    // 1. Obtener los IDs de las notas en este ambiente
    let mut stmt = conn.prepare(
        "SELECT n.id FROM notas n
         JOIN ambiente_curso ac ON n.ambiente_curso_id = ac.id
         WHERE ac.curso_id = ?1 AND ac.ambiente_plantilla_id = ?2"
    ).map_err(|e| e.to_string())?;

    let note_ids = stmt.query_map([&curso_id, &ambiente_id], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;

    // 2. Eliminar los archivos físicos de notas
    for note_id in note_ids {
        let note_file = paths.notes_dir.join(format!("{}.md", note_id));
        if note_file.exists() {
            let _ = fs::remove_file(note_file);
        }
    }

    // 3. Eliminar la relación de ambiente_curso (la DB cascadeará notas y tareas en cascada)
    conn.execute(
        "DELETE FROM ambiente_curso WHERE curso_id = ?1 AND ambiente_plantilla_id = ?2",
        [&curso_id, &ambiente_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("No se pudo obtener el directorio de datos de la app");
            if !app_data_dir.exists() {
                fs::create_dir_all(&app_data_dir).expect("No se pudo crear el directorio de datos");
            }

            let db_path = app_data_dir.join("notitas.db");
            let notes_dir = app_data_dir.join("apuntes_md");

            if !notes_dir.exists() {
                fs::create_dir_all(&notes_dir).expect("No se pudo crear la carpeta de apuntes");
            }

            // Inicialización de la DB SQLite local
            inicializar_db(&db_path).expect("Error al inicializar la base de datos");

            // Registramos el estado global con las rutas
            app.manage(AppPaths {
                db_path,
                notes_dir,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            obtener_ambientes_base,
            obtener_cursos,
            crear_curso,
            eliminar_curso,
            obtener_ambientes_por_curso,
            obtener_tareas_pendientes_por_curso,
            obtener_tareas_pendientes_por_curso_ambiente,
            obtener_notas_por_curso_ambiente,
            obtener_nota_por_id,
            obtener_tareas_por_nota,
            crear_nota,
            sincronizar_tareas_de_nota,
            actualizar_tarea_estado,
            eliminar_nota,
            obtener_tareas_pendientes,
            obtener_nombre_usuario,
            guardar_nombre_usuario,
            actualizar_curso,
            archivar_curso,
            agregar_ambiente,
            rename_ambiente,
            eliminar_ambiente
        ])
        .run(tauri::generate_context!())
        .expect("Ocurrió un error al ejecutar la aplicación Tauri");
}