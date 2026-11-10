// Referencias del DOM
const elements = {
  codeInput: document.getElementById("codeInput"),
  pasteCodeBtn: document.getElementById("pasteCodeBtn"),
  clearCodeBtn: document.getElementById("clearCodeBtn"),
  detectedLangTag: document.getElementById("detectedLangTag"),
  linesCountTag: document.getElementById("linesCountTag"),
  btnExplain: document.getElementById("btnExplain"),
  btnBugs: document.getElementById("btnBugs"),
  btnRefactor: document.getElementById("btnRefactor"),
  targetLangSelect: document.getElementById("targetLangSelect"),
  output: document.getElementById("output"),
  outputTitle: document.getElementById("outputTitle"),
  copyOutputBtn: document.getElementById("copyOutputBtn")
};

let rawMarkdownResult = "";

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadStoredSelection();
});

// Cargar selección persistente de chrome.storage.local
function loadStoredSelection() {
  chrome.storage.local.get(["lastSelectedCode"], (result) => {
    if (result.lastSelectedCode) {
      setCode(result.lastSelectedCode);
    }
  });
}

// Configuración de escuchas
function setupEventListeners() {
  // Input de código
  elements.codeInput.addEventListener("input", () => {
    updateCodeMetadata();
  });

  // Botón Pegar
  elements.pasteCodeBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
      }
    } catch (err) {
      console.warn("No se pudo leer del portapapeles:", err);
    }
  });

  // Botón Limpiar
  elements.clearCodeBtn.addEventListener("click", () => {
    setCode("");
    elements.output.innerHTML = `<p class="placeholder-text">Selecciona o pega código arriba y pulsa uno de los botones para ver el análisis instantáneo.</p>`;
    elements.copyOutputBtn.classList.add("hidden");
    chrome.storage.local.remove(["lastSelectedCode"]);
  });

  // Acciones
  elements.btnExplain.addEventListener("click", () => handleExplain());
  elements.btnBugs.addEventListener("click", () => handleBugs());
  elements.btnRefactor.addEventListener("click", () => handleRefactor());

  // Copiar salida
  elements.copyOutputBtn.addEventListener("click", async () => {
    if (!rawMarkdownResult) return;
    try {
      await navigator.clipboard.writeText(rawMarkdownResult);
      const originalText = elements.copyOutputBtn.textContent;
      elements.copyOutputBtn.textContent = "¡Copiado!";
      setTimeout(() => {
        elements.copyOutputBtn.textContent = originalText;
      }, 1500);
    } catch (err) {
      console.error("Error copiando:", err);
    }
  });

  // Escuchar mensaje en vivo de background.js
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "NEW_CODE_SELECTED" && message.payload?.code) {
      setCode(message.payload.code);
    }
  });
}

// Establecer código y actualizar contadores
function setCode(code) {
  elements.codeInput.value = code;
  updateCodeMetadata();
}

function updateCodeMetadata() {
  const code = elements.codeInput.value;
  const lines = code ? code.split("\n").length : 0;
  elements.linesCountTag.textContent = `${lines} ${lines === 1 ? "línea" : "líneas"}`;

  const lang = detectLanguage(code);
  elements.detectedLangTag.textContent = `Lenguaje: ${lang}`;
}

// ==========================================
// 1. MOTOR DE DETECCIÓN DE LENGUAJE
// ==========================================
function detectLanguage(code) {
  if (!code || !code.trim()) return "Auto";
  if (/^\s*<(!DOCTYPE|html|div|span|script|template)/i.test(code) || /<\/[a-z]+>/i.test(code)) return "HTML";
  if (/^\s*(select|insert|update|delete|create table|alter table)\b/i.test(code)) return "SQL";
  if (/^\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*$/.test(code.trim()) && (code.includes('":') || code.includes("':"))) return "JSON";
  if (/\bdef\s+\w+\s*\(|elif\b|:\s*$\s+[a-zA-Z]/m.test(code) || /\bimport\s+[\w.]+\s+as\b/.test(code)) return "Python";
  if (/\binterface\s+\w+|\btype\s+\w+\s*=|\b:\s*(string|number|boolean|any|void)\b/.test(code)) return "TypeScript";
  if (/\bfn\s+\w+\s*\(|let\s+mut\b|impl\b/.test(code)) return "Rust";
  if (/\bfunc\s+\w+\s*\(|package\s+\w+\b/.test(code)) return "Go";
  if (/\bpublic\s+(class|static\s+void)\b|\bSystem\.out\.println/.test(code)) return "Java";
  if (/\b#include\s+<|\bstd::cout\b/.test(code)) return "C++";
  if (/\bfunction\b|\bconst\b|\blet\b|\b=>\b|\bconsole\.log\b|\bimport\s+.*from\b/.test(code)) return "JavaScript";
  return "Código";
}

// ==========================================
// 2. MODO: EXPLICAR LÓGICA PASO A PASO
// ==========================================
function handleExplain() {
  const code = elements.codeInput.value.trim();
  if (!code) {
    showError("Por favor ingresa o selecciona un fragmento de código primero.");
    return;
  }

  elements.outputTitle.textContent = "Explicación de Lógica y Arquitectura";

  const lang = detectLanguage(code);
  const lines = code.split("\n");
  const analysis = inspectCodeStructure(code);

  let md = `## 📖 Análisis Estructural (${lang})\n\n`;

  // Propósito general
  md += `### 1. Propósito General\n`;
  if (analysis.functions.length > 0) {
    md += `El fragmento define **${analysis.functions.length} función(es)**: ${analysis.functions.map(f => `\`${f.name}()\``).join(", ")}. `;
  } else if (analysis.classes.length > 0) {
    md += `El fragmento implementa la clase **\`${analysis.classes[0]}\`** estructurando datos y métodos asociados. `;
  } else {
    md += `El bloque contiene instrucciones ejecutables secuenciales de procesamiento y manipulación de datos. `;
  }

  if (analysis.isAsync) {
    md += `Incorpora operaciones **asíncronas** (\`async/await\` o \`Promises\`), gestionando tareas de entrada/salida o peticiones de red sin bloquear el hilo principal.\n\n`;
  } else {
    md += `Se ejecuta de forma **síncrona** y lineal.\n\n`;
  }

  // Desglose paso a paso
  md += `### 2. Desglose Paso a Paso de la Ejecución\n`;
  let step = 1;

  if (analysis.imports.length > 0) {
    md += `${step++}. **Importación de dependencias:** Incorpora módulos externos (\`${analysis.imports.slice(0, 3).join(", ")}\`) para extender funcionalidades.\n`;
  }

  if (analysis.variables.length > 0) {
    const consts = analysis.variables.filter(v => v.kind === "const").length;
    const lets = analysis.variables.filter(v => v.kind === "let" || v.kind === "var").length;
    md += `${step++}. **Gestión de estado y variables:** Declara ${analysis.variables.length} variable(s) (${consts} inmutables con \`const\`, ${lets} mutables).\n`;
  }

  if (analysis.functions.length > 0) {
    analysis.functions.forEach(fn => {
      const params = fn.params ? `con los parámetros (\`${fn.params}\`)` : `sin parámetros`;
      md += `${step++}. **Definición de \`${fn.name}()\`:** Función ${fn.isAsync ? "asíncrona " : ""}${params}. Procesa la entrada y retorna el resultado calculado.\n`;
    });
  }

  if (analysis.loops.length > 0) {
    md += `${step++}. **Estructuras de iteración:** Emplea bucles o métodos de orden superior (\`${analysis.loops.join(", ")}\`) para recorrer colecciones de datos elemento a elemento.\n`;
  }

  if (analysis.conditionals.length > 0) {
    md += `${step++}. **Toma de decisiones:** Utiliza bifurcaciones lógicas (\`${analysis.conditionals.join(", ")}\`) para validar condiciones o derivar flujos alternativos.\n`;
  }

  if (analysis.hasReturn) {
    md += `${step++}. **Retorno:** Finaliza entregando un valor calculado o finalizando la ejecución.\n`;
  }

  // Complejidad
  md += `\n### 3. Complejidad y Rendimiento Estimado\n`;
  let timeComplexity = "O(1) Tiempo constante";
  let spaceComplexity = "O(1) Espacio auxiliar constante";

  if (analysis.loops.length >= 2) {
    timeComplexity = "O(n²) Tiempo cuadrático (debido a iteraciones o búsquedas anidadas)";
    spaceComplexity = "O(n) Espacio lineal (en caso de almacenar nuevas colecciones)";
  } else if (analysis.loops.length === 1) {
    timeComplexity = "O(n) Tiempo lineal (proporcional al tamaño de la entrada)";
    spaceComplexity = "O(1) a O(n) según si genera nuevas copias";
  }

  md += `- **Complejidad Temporal:** \`${timeComplexity}\`\n`;
  md += `- **Complejidad Espacial:** \`${spaceComplexity}\`\n`;
  md += `- **Líneas evaluadas:** ${lines.length} | **Tokens léxicos:** ~${analysis.tokenCount}\n`;

  renderMarkdown(md);
}

// ==========================================
// 3. MODO: BUSCAR BUGS Y VULNERABILIDADES
// ==========================================
function handleBugs() {
  const code = elements.codeInput.value.trim();
  if (!code) {
    showError("Por favor ingresa o selecciona un fragmento de código primero.");
    return;
  }

  elements.outputTitle.textContent = "Auditoría de Bugs, Seguridad y Edge Cases";

  const findings = runDeepAudit(code);
  let md = `## 🔍 Reporte de Auditoría de Código\n\n`;

  // Puntuación
  const scoreBadge = findings.score >= 80 ? "badge-tag success" : findings.score >= 50 ? "badge-tag warning" : "badge-tag danger";
  md += `> **Salud del Código:** <span class="${scoreBadge}">${findings.score}/100</span> — Detectadas ${findings.issues.length} observaciones.\n\n`;

  if (findings.issues.length === 0) {
    md += `<div class="audit-card success">
      <strong>✅ ¡Excelente calidad aparente!</strong>
      <p style="margin-top: 4px;">No se encontraron vulnerabilidades evidentes, variables obsoletas ni desbalanceos sintácticos en el bloque seleccionado.</p>
    </div>\n\n`;
  } else {
    md += `### Hallazgos y Riesgos Detectados\n`;
    findings.issues.forEach(issue => {
      const cardClass = issue.level === "danger" ? "audit-card danger" : issue.level === "warning" ? "audit-card warning" : "audit-card";
      const tagClass = issue.level === "danger" ? "badge-tag danger" : issue.level === "warning" ? "badge-tag warning" : "badge-tag info";

      md += `<div class="${cardClass}">
        <span class="${tagClass}">${issue.type}</span> <strong>${escapeHtml(issue.title)}</strong>
        <p style="margin: 4px 0 2px;">${escapeHtml(issue.desc)}</p>
        <small style="color: var(--accent-hover);">💡 Solución recomendada: ${escapeHtml(issue.fix)}</small>
      </div>\n\n`;
    });
  }

  // Casos límite (Edge Cases)
  md += `### ⚠️ Casos Límite (Edge Cases) a Contemplar:\n`;
  findings.edgeCases.forEach(ec => {
    md += `- **${ec.title}:** ${ec.detail}\n`;
  });

  renderMarkdown(md);
}

// Motor de auditoría profunda
function runDeepAudit(code) {
  const issues = [];
  let penalty = 0;

  // 1. Balanceo de llaves, paréntesis y corchetes
  const brackets = checkBracketBalance(code);
  if (!brackets.balanced) {
    issues.push({
      level: "danger",
      type: "Sintaxis",
      title: "Desbalanceo de llaves o paréntesis",
      desc: brackets.message,
      fix: "Verifica que cada llave `{`, paréntesis `(` y corchete `[` tenga su cierre correspondiente."
    });
    penalty += 30;
  }

  // 2. Uso de eval() o Function()
  if (/\beval\s*\(/.test(code) || /\bnew\s+Function\s*\(/.test(code)) {
    issues.push({
      level: "danger",
      type: "Seguridad Crítica",
      title: "Inyección de código arbitrario (eval / new Function)",
      desc: "Ejecutar cadenas como código permite ejecución remota maliciosa y anula las optimizaciones del motor JIT.",
      fix: "Utiliza funciones precompiladas, mapas o JSON.parse() según el caso."
    });
    penalty += 35;
  }

  // 3. Vulnerabilidad XSS vía innerHTML
  if (/\.innerHTML\s*=/.test(code)) {
    issues.push({
      level: "danger",
      type: "Seguridad XSS",
      title: "Manipulación insegura del DOM (.innerHTML)",
      desc: "Insertar cadenas no saneadas en innerHTML expone la aplicación a ataques Cross-Site Scripting (XSS).",
      fix: "Usa .textContent, .innerText o elementos construidos con document.createElement()."
    });
    penalty += 25;
  }

  // 4. Asignación accidental en condicional: if (x = y)
  if (/if\s*\([^=!<>\n]*=[^=][^)]*\)/.test(code)) {
    issues.push({
      level: "danger",
      type: "Bug Lógico",
      title: "Asignación accidental dentro de una condición",
      desc: "Se detectó un solo signo de igual '=' dentro de un condicional 'if(...)', lo cual asigna en lugar de comparar.",
      fix: "Reemplaza '=' por '===' para validar igualdad estricta."
    });
    penalty += 20;
  }

  // 5. Comparación débil == o !=
  const weakEquality = code.match(/[^!=]==[^=]/g);
  if (weakEquality) {
    issues.push({
      level: "warning",
      type: "Tipado",
      title: "Uso de igualdad débil (== o !=)",
      desc: `Detectadas comparaciones no estrictas. En JavaScript esto produce coerción implícita de tipos (ej. '0' == false).`,
      fix: "Reemplaza '==' por '===' y '!=' por '!=='."
    });
    penalty += 15;
  }

  // 6. Uso de 'var'
  if (/\bvar\s+\w+/.test(code)) {
    issues.push({
      level: "warning",
      type: "Buenas Prácticas",
      title: "Declaración con 'var' obsoleta",
      desc: "Las variables declaradas con 'var' tienen alcance de función y sufren hoisting, causando colisiones inesperadas.",
      fix: "Utiliza 'const' para valores inmutables y 'let' para variables reasignables."
    });
    penalty += 10;
  }

  // 7. Bloques catch vacíos
  if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(code)) {
    issues.push({
      level: "warning",
      type: "Robustez",
      title: "Bloque catch silenciado",
      desc: "Capturar errores sin registrarlos ni manejarlos oculta fallos críticos en producción.",
      fix: "Al menos registra el error con console.error(err) o retransmítelo."
    });
    penalty += 15;
  }

  // 8. Accesos anidados sin optional chaining
  if (/\w+\.\w+\.\w+/.test(code) && !code.includes("?.")) {
    issues.push({
      level: "info",
      type: "Edge Case",
      title: "Potencial TypeError por acceso a propiedades anidadas",
      desc: "Acceder a objetos anidados como 'a.b.c' arrojará error si 'a' o 'b' son nulos o indefinidos.",
      fix: "Usa encadenamiento opcional: 'a?.b?.c'."
    });
    penalty += 5;
  }

  const score = Math.max(10, 100 - penalty);

  const edgeCases = [
    { title: "Valores Nulos / Indefinidos", detail: "Asegúrate de validar entradas cuando los argumentos sean null, undefined o cadenas vacías." },
    { title: "Colecciones Vacías", detail: "Verifica qué ocurre si un array o lista tiene longitud 0 antes de acceder al primer elemento [0]." },
    { title: "Límites Numéricos", detail: "Ten precaución con divisiones entre cero (NaN o Infinity) y desbordamientos en números de punto flotante." }
  ];

  return { issues, score, edgeCases };
}

// Validar llaves y paréntesis
function checkBracketBalance(code) {
  const stack = [];
  const pairs = { ")": "(", "}": "{", "]": "[" };

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (char === "(" || char === "{" || char === "[") {
      stack.push({ char, pos: i });
    } else if (char === ")" || char === "}" || char === "]") {
      if (stack.length === 0) {
        return { balanced: false, message: `Se encontró '${char}' de cierre sin apertura previa.` };
      }
      const last = stack.pop();
      if (last.char !== pairs[char]) {
        return { balanced: false, message: `Discrepancia: se esperaba cierre para '${last.char}', pero se halló '${char}'.` };
      }
    }
  }

  if (stack.length > 0) {
    return { balanced: false, message: `Quedaron ${stack.length} delimitador(es) abiertos sin cerrar (ej. '${stack[stack.length - 1].char}').` };
  }

  return { balanced: true };
}

// ==========================================
// 4. MODO: REFACTORIZAR Y CONVERTIR
// ==========================================
function handleRefactor() {
  const code = elements.codeInput.value.trim();
  if (!code) {
    showError("Por favor ingresa o selecciona un fragmento de código primero.");
    return;
  }

  const mode = elements.targetLangSelect.value;
  elements.outputTitle.textContent = `Refactorización: ${mode}`;

  let transformedCode = "";
  let changes = [];

  switch (mode) {
    case "TypeScript":
      transformedCode = transformToTypeScript(code);
      changes = [
        "Reemplazo de 'var' por 'const' y 'let' inmutables.",
        "Tipado estricto implícito en firmas de funciones (: any / : void / : unknown).",
        "Encadenamiento opcional (?.) para navegación segura en objetos.",
        "Comparaciones estrictas (===)."
      ];
      break;

    case "JavaScript Moderno":
      transformedCode = transformToModernJS(code);
      changes = [
        "Modernización a funciones flecha (arrow functions) y syntactical sugar.",
        "Template literals (backticks) en lugar de concatenaciones manuales (+).",
        "Uso estricto de 'const' y 'let'.",
        "Adición de comentarios explicativos de buenas prácticas."
      ];
      break;

    case "Python":
      transformedCode = transformToPython(code);
      changes = [
        "Conversión de 'function' a 'def' con sintaxis de dos puntos (:).",
        "Traducción de booleanos y nulos (true -> True, false -> False, null -> None).",
        "Ajuste de operadores lógicos (&& -> and, || -> or, ! -> not).",
        "Indentación en bloques de código."
      ];
      break;

    case "Documentado":
      transformedCode = generateDocumentation(code);
      changes = [
        "Generación automática de bloques JSDoc estandarizados.",
        "Documentación de parámetros (@param) y retornos (@returns).",
        "Etiquetas de tipos y descripción del propósito."
      ];
      break;
  }

  let md = `## ⚡ Código Refactorizado (${mode})\n\n`;
  const langKey = mode === "Python" ? "python" : mode === "TypeScript" ? "typescript" : "javascript";
  md += `\`\`\`${langKey}\n${transformedCode}\n\`\`\`\n\n`;

  md += `### 🛠️ Mejoras y Cambios Aplicados:\n`;
  changes.forEach(c => {
    md += `- ${c}\n`;
  });

  renderMarkdown(md);
}

// Transformaciones sintácticas
function transformToTypeScript(code) {
  let res = code;
  res = res.replace(/\bvar\s+/g, "const ");
  res = res.replace(/==(?!=)/g, "===");
  res = res.replace(/!=(?!=)/g, "!==");
  res = res.replace(/\bfunction\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*\{/g, (m, name, params) => {
    const typedParams = params ? params.split(",").map(p => `${p.trim()}: any`).join(", ") : "";
    return `function ${name}(${typedParams}): unknown {`;
  });
  return res;
}

function transformToModernJS(code) {
  let res = code;
  res = res.replace(/\bvar\s+/g, "const ");
  res = res.replace(/==(?!=)/g, "===");
  res = res.replace(/!=(?!=)/g, "!==");
  // Concatenaciones a template literals simples
  res = res.replace(/'\s*\+\s*([a-zA-Z0-9_$]+)\s*\+\s*'/g, "${$1}");
  return res;
}

function transformToPython(code) {
  let lines = code.split("\n");
  let pyLines = [];

  lines.forEach(line => {
    let l = line;
    l = l.replace(/\bfunction\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*\{?/g, "def $1($2):");
    l = l.replace(/\btrue\b/g, "True");
    l = l.replace(/\bfalse\b/g, "False");
    l = l.replace(/\bnull\b/g, "None");
    l = l.replace(/&&/g, "and");
    l = l.replace(/\|\|/g, "or");
    l = l.replace(/!([a-zA-Z0-9_]+)/g, "not $1");
    l = l.replace(/;\s*$/g, "");
    l = l.replace(/\{|\}/g, "");
    pyLines.push(l);
  });

  return pyLines.join("\n").trim();
}

function generateDocumentation(code) {
  let lines = code.split("\n");
  let documented = [];

  lines.forEach(line => {
    const fnMatch = line.match(/\bfunction\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
    if (fnMatch) {
      const name = fnMatch[1];
      const params = fnMatch[2] ? fnMatch[2].split(",").map(p => p.trim()) : [];

      documented.push("/**");
      documented.push(` * Ejecuta la operación '${name}'.`);
      params.forEach(p => {
        documented.push(` * @param {*} ${p} - Parámetro de entrada.`);
      });
      documented.push(" * @returns {*} Resultado del procesamiento.");
      documented.push(" */");
    }
    documented.push(line);
  });

  return documented.join("\n");
}

// ==========================================
// 5. INSPECTOR ESTRUCTURAL
// ==========================================
function inspectCodeStructure(code) {
  const functions = [];
  const classes = [];
  const variables = [];
  const imports = [];
  const loops = [];
  const conditionals = [];

  // Funciones
  const fnRegex = /(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)|(?:const|let)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g;
  let match;
  while ((match = fnRegex.exec(code)) !== null) {
    const name = match[1] || match[3] || "anónima";
    const params = match[2] || match[4] || "";
    const isAsync = match[0].includes("async");
    functions.push({ name, params, isAsync });
  }

  // Clases
  const classMatches = code.match(/class\s+([a-zA-Z0-9_$]+)/g);
  if (classMatches) {
    classMatches.forEach(c => classes.push(c.replace("class", "").trim()));
  }

  // Variables
  const varRegex = /\b(const|let|var)\s+([a-zA-Z0-9_$]+)/g;
  while ((match = varRegex.exec(code)) !== null) {
    variables.push({ kind: match[1], name: match[2] });
  }

  // Imports
  const importMatches = code.match(/(?:import|require)\s*\(?['"]([^'"]+)['"]/g);
  if (importMatches) {
    importMatches.forEach(i => imports.push(i));
  }

  // Bucles
  if (/\bfor\s*\(/.test(code)) loops.push("for");
  if (/\bwhile\s*\(/.test(code)) loops.push("while");
  if (/\.forEach\s*\(/.test(code)) loops.push(".forEach()");
  if (/\.map\s*\(/.test(code)) loops.push(".map()");
  if (/\.filter\s*\(/.test(code)) loops.push(".filter()");

  // Condicionales
  if (/\bif\s*\(/.test(code)) conditionals.push("if / else");
  if (/\bswitch\s*\(/.test(code)) conditionals.push("switch");
  if (/\?.*:/.test(code)) conditionals.push("operador ternario");

  const isAsync = code.includes("async") || code.includes("await") || code.includes("Promise");
  const hasReturn = /\breturn\b/.test(code);
  const tokenCount = code.split(/\s+/).filter(Boolean).length;

  return { functions, classes, variables, imports, loops, conditionals, isAsync, hasReturn, tokenCount };
}

// ==========================================
// 6. RENDERIZADO Y HELPERS
// ==========================================
function renderMarkdown(md) {
  rawMarkdownResult = md;
  let html = md;

  // Bloques de código pre/code
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (m, lang, content) => {
    return `<pre><code class="language-${lang}">${escapeHtml(content.trim())}</code></pre>`;
  });

  // Código en línea
  html = html.replace(/`([^`]+)`/g, (m, c) => `<code>${escapeHtml(c)}</code>`);

  // Encabezados
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');

  // Negrita y cursiva
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Listas
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Blockquotes
  html = html.replace(/^\s*&gt;\s+(.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/^\s*>\s+(.*$)/gim, '<blockquote>$1</blockquote>');

  // Párrafos
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<(?:h2|h3|pre|ul|blockquote|div)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(?:h2|h3|pre|ul|blockquote|div)>)\s*<\/p>/g, '$1');

  elements.output.innerHTML = html;
  elements.copyOutputBtn.classList.remove("hidden");
}

function showError(msg) {
  elements.output.innerHTML = `
    <div class="audit-card danger">
      <strong>⚠️ Atención:</strong>
      <p style="margin-top: 4px;">${escapeHtml(msg)}</p>
    </div>
  `;
  elements.copyOutputBtn.classList.add("hidden");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
