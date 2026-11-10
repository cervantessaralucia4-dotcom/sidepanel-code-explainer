const CONTEXT_MENU_ID = "analyze-code-selection";

// Inicialización de la extensión
chrome.runtime.onInstalled.addListener(() => {
  // Configurar para que al hacer clic en el icono de la extensión se abra el panel lateral
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.warn("setPanelBehavior:", err));
  }

  // Crear entrada en el menú contextual
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Analizar con Code Explainer",
    contexts: ["selection"]
  });
});

// Manejo del clic en el menú contextual
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) {
    return;
  }

  const selectedCode = info.selectionText.trim();

  // Abrir el SidePanel de forma compatible con Chrome (intentar tabId primero, luego windowId)
  if (tab) {
    try {
      if (tab.id && chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }
    } catch {
      try {
        if (tab.windowId && chrome.sidePanel && chrome.sidePanel.open) {
          await chrome.sidePanel.open({ windowId: tab.windowId });
        }
      } catch (err) {
        console.warn("No se pudo abrir el panel lateral automáticamente:", err);
      }
    }
  }

  // Guardar en storage local
  chrome.storage.local.set(
    {
      lastSelectedCode: selectedCode,
      lastSelectionTimestamp: Date.now()
    },
    () => {
      // Notificar al panel si ya está montado
      chrome.runtime
        .sendMessage({
          type: "NEW_CODE_SELECTED",
          payload: {
            code: selectedCode,
            timestamp: Date.now()
          }
        })
        .catch(() => {
          // Ignorar si el panel no estaba abierto
        });
    }
  );
});
