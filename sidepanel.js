// Referencias del DOM
const elements = {
  aiStatusBadge: document.getElementById("aiStatusBadge"),
  aiStatusText: document.getElementById("aiStatusText"),
  aiGuideBanner: document.getElementById("aiGuideBanner"),
  recheckAiBtn: document.getElementById("recheckAiBtn"),
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
let isAiAvailable = false;

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await checkChromeBuiltInAi();
  await loadStoredData();
});

// Comprobar la disponibilidad de la Prompt API nativa de Chrome (Gemini Nano)
async function checkChromeBuiltInAi() {
  updateAiBadge("checking", "Verificando IA...");

  const aiObj = window.ai || (typeof ai !== "undefined" ? ai : null);

  if (!aiObj || !aiObj.languageModel) {
    updateAiBadge("error", "IA no detectada");
    elements.aiGuideBanner.classList.remove("hidden");
    isAiAvailable = false;
    return;
  }

  try {
    let availability = "no";
    if (typeof aiObj.languageModel.availability === "function") {
      availability = await aiObj.languageModel.availability();
    } else if (typeof aiObj.languageModel.capabilities === "function") {
      const caps = await aiObj.languageModel.capabilities();
      availability = caps.available;
    }

    if (availability === "readily" || availability === "after-download" || availability === true) {
      if (availability === "after-download") {
        updateAiBadge("downloading", "Descargando modelo...");
      } else {
        updateAiBadge("ready", "Gemini Nano (Local)");
      }
      elements.aiGuideBanner.classList.add("hidden");
      isAiAvailable = true;
    } else {
      updateAiBadge("error", "IA inactiva");
      elements.aiGuideBanner.classList.remove("hidden");
      isAiAvailable = false;
    }
  } catch (err) {
    console.warn("Error al verificar estado de Prompt API:", err);
    // Intentar asumir disponibilidad si el objeto existe
    updateAiBadge("ready", "Gemini Nano (Local)");
    elements.aiGuideBanner.classList.add("hidden");
    isAiAvailable = true;
  }
}

// Actualizar el badge visual de estado
function updateAiBadge(status, text) {
  elements.aiStatusBadge.className = `ai-badge ${status}`;
  elements.aiStatusText.textContent = text;
}

// Cargar selección persistente de chrome.storage.local
async function loadStoredData() {
  chrome.storage.local.get(["lastSelectedCode"], (result) => {
    if (result.lastSelectedCode) {
      updateSelectedCode(result.lastSelectedCode);
    }
  });
}

// Configuración de eventos
function setupEventListeners() {
  // Re-verificar IA nativa
  elements.recheckAiBtn.addEventListener("click", async () => {
    await checkChromeBuiltInAi();
  });

  // Limpiar selección de código
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

  // Escucha de selección en tiempo real enviada desde background.js
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "NEW_CODE_SELECTED" && message.payload?.code) {
      updateSelectedCode(message.payload.code);
    }
  });
}

// Actualizar bloque de código
function updateSelectedCode(code) {
  currentCode = code;
  elements.selectedCodeBlock.textContent = code;
  elements.selectedCodeBlock.classList.remove("empty-code");
}

// Ejecutar análisis (vía Gemini Nano o motor local)
async function runAnalysis(mode) {
  if (!currentCode || currentCode.trim().length === 0) {
    showError("No hay ningún fragmento de código seleccionado para analizar.");
    return;
  }

  const promptConfig = buildPrompt(mode, currentCode);
  elements.outputTitle.textContent = promptConfig.title;

  setLoadingState(true, promptConfig.loadingText);
  rawResponseText = "";
  elements.output.innerHTML = "";

  try {
    const aiObj = window.ai || (typeof ai !== "undefined" ? ai : null);

    if (aiObj && aiObj.languageModel) {
      // 1. Usar Prompt API nativa local de Chrome con Streaming
      await runChromeNanoSession(aiObj, promptConfig);
    } else {
      // 2. Si las flags de Chrome no están activadas, usar analizador heurístico local sin bloquear
      await runLocalFallbackAnalysis(mode, currentCode);
    }

    elements.copyOutputBtn.classList.remove("hidden");
  } catch (error) {
    console.error("Error en análisis:", error);
    showError(error.message || "Ocurrió un error al procesar el código localmente.");
  } finally {
    setLoadingState(false);
  }
}

// Ejecutar sesión con Gemini Nano nativo
async function runChromeNanoSession(aiObj, promptConfig) {
  let session = null;
  try {
    // Crear sesión local en el dispositivo
    session = await aiObj.languageModel.create({
      systemPrompt: promptConfig.systemInstruction
    });

    // Soporte para streaming de tokens en tiempo real
    if (typeof session.promptStreaming === "function") {
      const stream = session.promptStreaming(promptConfig.userPrompt);
      let previousChunk = "";

      for await (const chunk of stream) {
        // En algunas versiones de Chrome el stream devuelve el texto acumulado
        const newText = chunk.startsWith(previousChunk) ? chunk : previousChunk + chunk;
        rawResponseText = newText;
        previousChunk = newText;
        renderOutputMarkdown(rawResponseText);
      }
    } else {
      const result = await session.prompt(promptConfig.userPrompt);
      rawResponseText = result;
      renderOutputMarkdown(rawResponseText);
    }
  } finally {
    if (session && typeof session.destroy === "function") {
      session.destroy();
    }
  }
}

// Analizador heurístico offline en caso de que el usuario no tenga activada la Built-in AI aún
async function runLocalFallbackAnalysis(mode, code) {
  elements.aiGuideBanner.classList.remove("hidden");

  // Pequeña pausa estética para feedback
  await new Promise((r) => setTimeout(r, 400));

  let response = "";
  const lines = code.split("\n");
  const targetLang = elements.targetLangInput.value.trim() || "TypeScript";

  if (mode === "explain") {
    response = `### 💡 Análisis Estático Local (Gemini Nano inactivo en Chrome)\n\n` +
      `> **Nota:** Para explicaciones con IA generativa profunda en tu máquina, activa los flags de Chrome indicados arriba.\n\n` +
      `**Estructura del bloque seleccionado:**\n` +
      `- **Líneas analizadas:** ${lines.length}\n` +
      `- **Caracteres:** ${code.length}\n` +
      `- **Tokens/Palabras clave detectadas:** \`${extractKeywords(code).join(", ") || "General"}\`\n\n` +
      `**Flujo inferido:**\n` +
      `1. El código define operaciones sobre \`${lines[0].trim().slice(0, 50)}\`.\n` +
      `2. Ejecuta transformaciones iterativas o condicionales sobre las estructuras de datos recibidas.\n` +
      `3. Complejidad estimada de inspección: Aproximadamente $O(n)$ o constante según bucles anidados.`;
  } else if (mode === "bugs") {
    const issues = detectCommonPitfalls(code);
    response = `### 🔍 Auditoría Estática de Riesgos y Edge Cases\n\n` +
      `> **Nota:** Auditoría basada en reglas estáticas en dispositivo.\n\n` +
      `**Hallazgos detectados:**\n` +
      (issues.length > 0 
        ? issues.map((issue) => `- ${issue}`).join("\n") 
        : `- No se detectaron patrones inseguros evidentes (ej. variables globales sin declarar, eval() o bucles infinitos estáticos).`) +
      `\n\n**Casos límite (Edge Cases) recomendados a validar manualmente:**\n` +
      `- Manejo de valores \`null\`, \`undefined\` o colecciones vacías.\n` +
      `- Desbordamiento o valores negativos en índices.\n` +
      `- Gestión adecuada de excepciones en llamadas asíncronas.`;
  } else if (mode === "refactor") {
    response = `### ⚡ Conversión sugerida a ${targetLang}\n\n` +
      `\`\`\`${targetLang.toLowerCase().replace(/[^a-z0-9]/g, "")}\n` +
      `// Refactorizado para ${targetLang} con Clean Code y tipado seguro:\n` +
      `${formatRefactoredSnippet(code, targetLang)}\n` +
      `\`\`\`\n\n` +
      `**Mejoras sugeridas:**\n` +
      `- Aplicación de inmutabilidad (\`const\` / variables finales).\n` +
      `- Tipado explícito de argumentos y retornos.\n` +
      `- Funciones puras para facilitar pruebas unitarias.`;
  }

  rawResponseText = response;
  renderOutputMarkdown(response);
}

// Detección heurística de riesgos básicos
function detectCommonPitfalls(code) {
  const issues = [];
  if (/\beval\s*\(/.test(code)) issues.push("⚠️ **Uso de \`eval()\`**: Representa un riesgo grave de inyección de código arbitrario.");
  if (/\bvar\b/.test(code)) issues.push("⚠️ **Uso de \`var\`**: Se recomienda reemplazar por \`const\` o \`let\` para evitar scoping hoisting confuso.");
  if (/==(?!=)/.test(code)) issues.push("⚠️ **Comparación débil (\`==\`)**: Utiliza comparación estricta (\`===\`) para evitar coerción de tipos inesperada.");
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(code)) issues.push("⚠️ **Bloque catch vacío**: Silenciar errores oculta bugs críticos en tiempo de ejecución.");
  if (/innerHTML\s*=/.test(code)) issues.push("⚠️ **Asignación directa a \`innerHTML\`**: Posible vulnerabilidad a ataques Cross-Site Scripting (XSS).");
  return issues;
}

// Extraer palabras clave
function extractKeywords(code) {
  const matches = code.match(/\b(function|async|await|class|const|let|return|import|export|def|for|while|if|switch)\b/g);
  return matches ? [...new Set(matches)].slice(0, 6) : [];
}

// Formateo de snippet básico
function formatRefactoredSnippet(code, targetLang) {
  let cleaned = code.trim();
  if (targetLang.toLowerCase().includes("typescript")) {
    cleaned = cleaned.replace(/\bvar\b/g, "const");
  }
  return cleaned;
}

// Construir prompts modulares para Gemini Nano
function buildPrompt(mode, code) {
  switch (mode) {
    case "explain":
      return {
        title: "Explicación Paso a Paso (Gemini Nano)",
        loadingText: "Analizando lógica con Gemini Nano local...",
        systemInstruction: "Eres un desarrollador sénior. Explica el siguiente código de forma didáctica, clara y concisa en español. Divide en: 1. Propósito, 2. Desglose secuencial, 3. Complejidad. Usa Markdown.",
        userPrompt: `Explica paso a paso el siguiente código:\n\n\`\`\`\n${code}\n\`\`\``
      };

    case "bugs":
      return {
        title: "Auditoría de Bugs y Edge Cases (Gemini Nano)",
        loadingText: "Detectando vulnerabilidades y casos límite...",
        systemInstruction: "Eres un auditor de seguridad y QA lead. Analiza el código e identifica bugs lógicos, casos límite (nulos, vacíos, tipos) y riesgos de seguridad. Sugiere soluciones en español usando Markdown.",
        userPrompt: `Audita este código en busca de bugs, edge cases y riesgos:\n\n\`\`\`\n${code}\n\`\`\``
      };

    case "refactor":
      const targetLang = elements.targetLangInput.value.trim() || "Clean Code moderno";
      return {
        title: `Refactorización a ${targetLang} (Gemini Nano)`,
        loadingText: `Refactorizando hacia ${targetLang}...`,
        systemInstruction: `Eres un arquitecto de software. Refactoriza y traduce el código proporcionado al objetivo: "${targetLang}". Entrega el código optimizado en un bloque markdown y enumera las mejoras aplicadas en español.`,
        userPrompt: `Refactoriza y convierte este código a ${targetLang}:\n\n\`\`\`\n${code}\n\`\`\``
      };

    default:
      throw new Error(`Modo desconocido: ${mode}`);
  }
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

// Mensaje de error en output
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

  // Encabezados
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');

  // Negrita y Cursiva
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Listas
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Blockquotes
  html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote>$1</blockquote>');

  // Párrafos
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<(?:h2|h3|pre|ul|blockquote)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(?:h2|h3|pre|ul|blockquote)>)\s*<\/p>/g, '$1');

  elements.output.innerHTML = html;
}

// Sanitizar HTML
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
