const CONTEXT_MENU_ID = "analyze-code-selection";

// Inicialización al instalar o actualizar la extensión
chrome.runtime.onInstalled.addListener(() => {
  // Permitir que el clic en el icono de la extensión abra directamente el Side Panel
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.error("Error al configurar setPanelBehavior:", err));
  }

  // Registrar la entrada en el menú contextual solo para selecciones de texto
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Analizar con Code Explainer",
    contexts: ["selection"]
  });
});

// Manejo del evento al hacer clic en la opción del menú contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) {
    return;
  }

  const selectedCode = info.selectionText.trim();

  // Abrir el panel lateral en la ventana actual.
  // Es crucial ejecutarlo síncronamente dentro del handler del click para mantener el user gesture.
  if (tab && tab.windowId && chrome.sidePanel && chrome.sidePanel.open) {
    chrome.sidePanel
      .open({ windowId: tab.windowId })
      .catch((err) => console.error("Error abriendo sidePanel:", err));
  }

  // Guardar en chrome.storage.local para persistencia
  chrome.storage.local.set(
    {
      lastSelectedCode: selectedCode,
      lastSelectionTimestamp: Date.now()
    },
    () => {
      // Notificar al side panel en tiempo real si ya está abierto
      chrome.runtime
        .sendMessage({
          type: "NEW_CODE_SELECTED",
          payload: {
            code: selectedCode,
            timestamp: Date.now()
          }
        })
        .catch(() => {
          // Si el side panel aún no está cargado o no hay listener listo, 
          // sidepanel.js leerá el contenido de chrome.storage.local al montar.
        });
    }
  );
});

