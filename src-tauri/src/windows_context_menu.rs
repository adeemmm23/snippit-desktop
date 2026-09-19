use webview2_com::{
    ContextMenuRequestedEventHandler, CustomItemSelectedEventHandler,
    Microsoft::Web::WebView2::Win32::{
        ICoreWebView2, ICoreWebView2ContextMenuItemCollection, ICoreWebView2Environment9,
        ICoreWebView2_11, ICoreWebView2_2, COREWEBVIEW2_CONTEXT_MENU_ITEM_KIND_COMMAND,
    },
};

use windows::core::{w, Interface};

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
                | "copyLinkToHighlight"
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

unsafe fn add_menu_item(
    env: &webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2Environment,
    items: &ICoreWebView2ContextMenuItemCollection,
) -> windows::core::Result<()> {
    let env9: ICoreWebView2Environment9 = env.cast()?;

    let new_item = env9.CreateContextMenuItem(
        w!("Snippit Action"),
        None,
        COREWEBVIEW2_CONTEXT_MENU_ITEM_KIND_COMMAND,
    )?;

    let click_handler = CustomItemSelectedEventHandler::create(Box::new(|_sender, _args| {
        println!("The custom Snippit Action was clicked!");
        Ok(())
    }));

    let mut token = 0i64;
    new_item.add_CustomItemSelected(&click_handler, &mut token)?;

    let mut count = 0;
    items.Count(&mut count)?;
    items.InsertValueAtIndex(count, &new_item)?;

    Ok(())
}

pub fn install(core: ICoreWebView2) {
    unsafe {
        let core_11: ICoreWebView2_11 = core.cast().unwrap();
        let core_2: ICoreWebView2_2 = core.cast().unwrap();
        let env = core_2.Environment().unwrap();

        let handler = ContextMenuRequestedEventHandler::create(Box::new(move |_sender, args| {
            if let Some(args) = args {
                let menu_items = args.MenuItems()?;

                remove_menu_items(&menu_items)?;
                let target = args.ContextMenuTarget()?;

                let mut is_editable = Default::default();
                target.IsEditable(&mut is_editable)?;

                if is_editable.as_bool() {
                    add_menu_item(&env, &menu_items)?;
                }
            }
            Ok(())
        }));

        let mut token = 0i64;
        core_11
            .add_ContextMenuRequested(&handler, &mut token)
            .unwrap();
    }
}
