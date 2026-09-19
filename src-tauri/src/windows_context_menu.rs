use webview2_com::{
    ContextMenuRequestedEventHandler,
    Microsoft::Web::WebView2::Win32::{ICoreWebView2, ICoreWebView2_11},
};

use windows::core::Interface;

unsafe fn remove_menu_items(
    items: &webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2ContextMenuItemCollection,
) -> windows::core::Result<()> {
    let mut count = 0;
    items.Count(&mut count)?;

    for i in (0..count).rev() {
        let item = items.GetValueAtIndex(i)?;

        let mut label_pwstr = windows::core::PWSTR::null();
        item.Label(&mut label_pwstr)?;
        let label = label_pwstr.to_string().unwrap_or_default();

        let mut name_pwstr = windows::core::PWSTR::null();
        item.Name(&mut name_pwstr)?;
        let name = name_pwstr.to_string().unwrap_or_default();

        if matches!(
            name.as_str(),
            "print"
                | "saveAs"
                | "reload"
                | "share"
                | "back"
                | "forward"
                | "inspectElement"
                | "zoomIn"
                | "zoomOut"
                | "zoomReset"
                | "copyImageLocation"
                | "copyImage"
                | "saveImageAs"
                | "pasteAndMatchStyle"
                | "moreTools"
                | "other"
        ) {
            items.RemoveValueAtIndex(i)?;
            continue;
        }

        println!("Context menu: Name='{name}', Label='{label}'");

        let children = item.Children()?;
        remove_menu_items(&children)?;
    }

    Ok(())
}

pub fn install(core: ICoreWebView2) {
    unsafe {
        let core_11: ICoreWebView2_11 = core.cast().unwrap();

        let handler = ContextMenuRequestedEventHandler::create(Box::new(|_sender, args| {
            if let Some(args) = args {
                let menu_items = args.MenuItems()?;
                remove_menu_items(&menu_items)?;
            }

            Ok(())
        }));

        let mut token = 0i64;

        core_11
            .add_ContextMenuRequested(&handler, &mut token)
            .unwrap();
    }
}
