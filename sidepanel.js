// Referencias a elementos del DOM
const elements = {
  toggleSettingsBtn: document.getElementById("toggleSettingsBtn"),
  settingsPanel: document.getElementById("settingsPanel"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  modelSelect: document.getElementById("modelSelect"),
  saveKeyBtn: document.getElementById("saveKeyBtn"),
  keyStatusMsg: document.getElementById("keyStatusMsg"),
  selectedCodeBlock: document.getElementById("selectedCodeBlock"),
  clearCodeBtn: document.getElementById("clearCodeBtn"),
  btnExplain: document.getElementById("btnExplain"),
  btnBugs: document.getElementById("btnBugs"),
  btnRefactor: document.getElementById("btnRefactor"),
  targetLangInput: document.getElementById("targetLangInput"),
  loadingIndicator: document.getElementById("loadingIndicator"),
  loadingText: document.getElementById("loadingText"),
  output: document.getElementById("output"),
  outputTitle: document.getElementById("outputTitle"),
  copyOutputBtn: document.getElementById("copyOutputBtn")
};

let currentCode = "";
let rawResponseText = "";

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await loadStoredData();
});

// Cargar datos almacenados en chrome.storage
async function loadStoredData() {
  chrome.storage.local.get(
    ["geminiApiKey", "selectedModel", "lastSelectedCode"],
    (result) => {
      if (result.geminiApiKey) {
        elements.apiKeyInput.value = result.geminiApiKey;
      } else {
        // Mostrar panel de configuración automáticamente si no hay API Key guardada
        elements.settingsPanel.classList.remove("hidden");
      }

      if (result.selectedModel) {
        elements.modelSelect.value = result.selectedModel;
      }

      if (result.lastSelectedCode) {
        updateSelectedCode(result.lastSelectedCode);
      }
    }
  );
}

// Configuración de escuchas de eventos
function setupEventListeners() {
  // Toggle del panel de configuración
  elements.toggleSettingsBtn.addEventListener("click", () => {
    elements.settingsPanel.classList.toggle("hidden");
  });

  // Guardar configuración de API Key y Modelo
  elements.saveKeyBtn.addEventListener("click", () => {
    const key = elements.apiKeyInput.value.trim();
    const model = elements.modelSelect.value;

    if (!key) {
      showKeyStatus("Por favor introduce una API Key válida.", "error");
      return;
    }

    chrome.storage.local.set(
      { geminiApiKey: key, selectedModel: model },
      () => {
        showKeyStatus("¡Configuración guardada correctamente!", "success");
        setTimeout(() => {
          elements.settingsPanel.classList.add("hidden");
          elements.keyStatusMsg.textContent = "";
        }, 1500);
      }
    );
  });

  // Limpiar código seleccionado
  elements.clearCodeBtn.addEventListener("click", () => {
    currentCode = "";
    elements.selectedCodeBlock.textContent = "Selecciona un fragmento de código en cualquier página web, haz clic derecho y pulsa 'Analizar con Code Explainer'...";
    elements.selectedCodeBlock.classList.add("empty-code");
    chrome.storage.local.remove(["lastSelectedCode"]);
  });

  // Botones de análisis
  elements.btnExplain.addEventListener("click", () => runAnalysis("explain"));
  elements.btnBugs.addEventListener("click", () => runAnalysis("bugs"));
  elements.btnRefactor.addEventListener("click", () => runAnalysis("refactor"));

  // Copiar salida al portapapeles
  elements.copyOutputBtn.addEventListener("click", async () => {
    if (!rawResponseText) return;
    try {
      await navigator.clipboard.writeText(rawResponseText);
      const originalText = elements.copyOutputBtn.textContent;
      elements.copyOutputBtn.textContent = "¡Copiado!";
      setTimeout(() => {
        elements.copyOutputBtn.textContent = originalText;
      }, 1800);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  });

  // Escuchar mensajes en tiempo real desde background.js
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "NEW_CODE_SELECTED" && message.payload?.code) {
      updateSelectedCode(message.payload.code);
    }
  });
}

// Actualizar el bloque de código visual
function updateSelectedCode(code) {
  currentCode = code;
  elements.selectedCodeBlock.textContent = code;
  elements.selectedCodeBlock.classList.remove("empty-code");
}

// Mostrar mensajes de estado en el panel de configuración
function showKeyStatus(message, type) {
  elements.keyStatusMsg.textContent = message;
  elements.keyStatusMsg.className = `status-msg ${type}`;
}

// Ejecutar análisis llamando a la API
async function runAnalysis(mode) {
  if (!currentCode || currentCode.trim().length === 0) {
    showError("No hay ningún fragmento de código seleccionado para analizar.");
    return;
  }

  // Obtener API Key y Modelo
  const storageData = await new Promise((resolve) => {
    chrome.storage.local.get(["geminiApiKey", "selectedModel"], resolve);
  });

  const apiKey = storageData.geminiApiKey || elements.apiKeyInput.value.trim();
  const model = storageData.selectedModel || elements.modelSelect.value || "gemini-2.5-flash";

  if (!apiKey) {
    elements.settingsPanel.classList.remove("hidden");
    showError("Se requiere una API Key de Google Gemini. Introdúcela arriba y haz clic en Guardar.");
    return;
  }

  // Construir prompt según el modo
  const promptConfig = buildPrompt(mode, currentCode);
  elements.outputTitle.textContent = promptConfig.title;

  setLoadingState(true, promptConfig.loadingText);

  try {
    const response = await callGeminiApi(apiKey, model, promptConfig.systemInstruction, promptConfig.userPrompt);
    rawResponseText = response;
    renderOutputMarkdown(response);
    elements.copyOutputBtn.classList.remove("hidden");
  } catch (error) {
    console.error("Error en análisis:", error);
    showError(error.message || "Ocurrió un error inesperado al procesar la solicitud.");
  } finally {
    setLoadingState(false);
  }
}

// Construcción de prompts modulares
function buildPrompt(mode, code) {
  switch (mode) {
    case "explain":
      return {
        title: "Explicación Paso a Paso",
        loadingText: "Analizando lógica y arquitectura del código...",
        systemInstruction: "Eres un desarrollador sénior y educador técnico experto. Explica de forma concisa, estructurada y pedagógica el código proporcionado. Divide la explicación en: 1. Propósito general, 2. Desglose paso a paso de la lógica, 3. Complejidad o consideraciones clave. Responde en español y usa formato Markdown.",
        userPrompt: `Explica en detalle este código:\n\n\`\`\`\n${code}\n\`\`\``
      };

    case "bugs":
      return {
        title: "Detección de Bugs y Vulnerabilidades",
        loadingText: "Auditando bugs, casos límite y vulnerabilidades...",
        systemInstruction: "Eres un auditor de seguridad y QA lead experto en análisis estático de código. Analiza el fragmento en busca de: 1. Posibles errores en tiempo de ejecución o bugs de lógica, 2. Casos límite (edge cases) no contemplados (nulos, vacíos, desbordamientos, tipos), 3. Riesgos de seguridad o fugas de memoria, 4. Solución sugerida. Si el código no presenta problemas evidentes, indícalo claramente. Responde en español y usa Markdown.",
        userPrompt: `Audita este código e identifica errores, vulnerabilidades y edge cases:\n\n\`\`\`\n${code}\n\`\`\``
      };

    case "refactor":
      const targetLang = elements.targetLangInput.value.trim() || "Clean Code moderno";
      return {
        title: `Refactorización a ${targetLang}`,
        loadingText: `Refactorizando y convirtiendo a ${targetLang}...`,
        systemInstruction: `Eres un arquitecto de software experto en diseño limpio y patrones de arquitectura. Tu tarea es refactorizar y convertir el código proporcionado al objetivo: "${targetLang}". Entrega: 1. El código refactorizado completo y optimizado dentro de un bloque de código markdown, 2. Lista de mejoras aplicadas (rendimiento, legibilidad, buenas prácticas, tipado fuerte), 3. Explicación de las transformaciones clave. Responde en español.`,
        userPrompt: `Refactoriza y traduce este código hacia ${targetLang}:\n\n\`\`\`\n${code}\n\`\`\``
      };

    default:
      throw new Error(`Modo no reconocido: ${mode}`);
  }
}

// Llamada a la API REST de Google Gemini
async function callGeminiApi(apiKey, model, systemInstruction, userPrompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Error del servidor HTTP ${response.status}`;
    
    if (response.status === 400 || response.status === 403) {
      throw new Error(`Error de autenticación o API Key inválida: ${message}`);
    } else if (response.status === 429) {
      throw new Error("Has excedido la cuota o límite de peticiones de la API. Espera unos segundos e intenta nuevamente.");
    }
    throw new Error(`Fallo en la API de Gemini: ${message}`);
  }

  const data = await response.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error("La API no devolvió contenido generado para esta consulta.");
  }

  return textOutput;
}

// Control visual de estados de carga
function setLoadingState(isLoading, message = "Procesando...") {
  elements.btnExplain.disabled = isLoading;
  elements.btnBugs.disabled = isLoading;
  elements.btnRefactor.disabled = isLoading;
  elements.clearCodeBtn.disabled = isLoading;

  if (isLoading) {
    elements.loadingText.textContent = message;
    elements.loadingIndicator.classList.remove("hidden");
  } else {
    elements.loadingIndicator.classList.add("hidden");
  }
}

// Mostrar mensajes de error en el contenedor de resultados
function showError(message) {
  elements.output.innerHTML = `
    <div class="error-box">
      <strong>⚠️ Error:</strong>
      <p style="margin-top: 4px;">${escapeHtml(message)}</p>
    </div>
  `;
  elements.copyOutputBtn.classList.add("hidden");
}

// Renderizador seguro de Markdown básico
function renderOutputMarkdown(mdText) {
  let html = escapeHtml(mdText);

  // Bloques de código: ```lang ... ```
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Código en línea: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Encabezados: ### H3, ## H2
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');

  // Negrita: **texto**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Cursiva: *texto*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Elementos de lista: * item o - item
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');
  // Limpiar <ul> anidados consecutivos accidentales
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Párrafos y saltos de línea
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<(?:h2|h3|pre|ul)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(?:h2|h3|pre|ul)>)\s*<\/p>/g, '$1');

  elements.output.innerHTML = html;
}

// Sanitización para prevenir XSS
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

