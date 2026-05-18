use std::fs;
use tauri::Manager;
use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migraciones = vec![
        Migration {
            version: 1,
            description: "Creacion de tablas cursos, ambientes y notas",
            sql: "
                CREATE TABLE IF NOT EXISTS cursos (
                    id TEXT PRIMARY KEY,
                    nombre TEXT NOT NULL,
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS ambientes (
                    id TEXT PRIMARY KEY,
                    nombre TEXT NOT NULL,
                    curso_id TEXT NOT NULL,
                    is_default BOOLEAN NOT NULL DEFAULT 0,
                    FOREIGN KEY(curso_id) REFERENCES cursos(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS notas (
                    id TEXT PRIMARY KEY,
                    titulo TEXT NOT NULL,
                    ambiente_id TEXT NOT NULL,
                    nombre_archivo TEXT NOT NULL,
                    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(ambiente_id) REFERENCES ambientes(id) ON DELETE CASCADE
                );
            ",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            SqlBuilder::default()
                .add_migrations("sqlite:notitas.db", migraciones)
                .build(),
        )
        .setup(|app| {
            // 1. Obtenemos la ruta de datos de la aplicación
            if let Ok(app_data_dir) = app.path().app_data_dir() {
                // 2. Creamos una subcarpeta llamada "apuntes_md"
                let notas_dir = app_data_dir.join("apuntes_md");

                // 3. Le decimos a Rust: "Si la carpeta no existe, créala"
                if !notas_dir.exists() {
                    fs::create_dir_all(&notas_dir)
                        .expect("No se pudo crear la carpeta plana para los apuntes");
                    println!("📁 Carpeta de apuntes creada en: {:?}", notas_dir);
                } else {
                    println!("✅ La carpeta de apuntes ya existe en: {:?}", notas_dir);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Ocurrió un error al ejecutar la aplicación Tauri");
}