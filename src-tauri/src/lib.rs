#[cfg(target_os = "windows")]
mod windows_context_menu;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                use tauri::Manager;
                let window = app.get_webview_window("main").unwrap();
                window
                    .with_webview(|webview| unsafe {
                        let core = webview.controller().CoreWebView2().unwrap();
                        windows_context_menu::install(core);
                    })
                    .unwrap();
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_window])
        // .plugin(tauri_plugin_prevent_default::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {}))
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn show_window(window: tauri::Window) {
    window.show().unwrap();
}
