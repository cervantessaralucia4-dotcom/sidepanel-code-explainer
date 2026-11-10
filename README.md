# 🚀 SidePanel Code Explainer (Motor 100% Local y Autónomo)

Una extensión para Google Chrome (**Manifest V3**) que analiza, explica, audita y refactoriza código fuente directamente en el panel lateral nativo (`chrome.sidePanel`), impulsada por un **motor de análisis estático y sintáctico 100% local en JavaScript**.

**⚡ Sin APIs, sin claves (API Keys), sin flags experimentales de Chrome y sin esperas.**

![Manifest V3](https://img.shields.io/badge/Manifest_V3-Chrome_116+-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Motor Local](https://img.shields.io/badge/Motor-100%25_JavaScript_Local-04d361?style=flat-square&logo=javascript&logoColor=white)
![No API Keys](https://img.shields.io/badge/API_Keys-No_Requeridas-8257e5?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 📌 ¿Por qué esta solución?

Las extensiones que dependen de APIs externas exigen configurar claves privadas, cuentas de pago o tokens con límites de cuota. Por otro lado, los modelos locales integrados (como Gemini Nano) requieren flags experimentales de Chrome y descargas pesadas de varios gigabytes que no funcionan en todos los equipos.

**SidePanel Code Explainer** resuelve esto implementando un motor sintáctico y de análisis estático en JavaScript puro que se ejecuta de forma **inmediata (<15 ms)** en cualquier versión moderna de Google Chrome, garantizando que siempre funcione sin importar tu configuración.

---

## ✨ Características Principales

### 1. 📖 Explicación de Lógica y Arquitectura Paso a Paso
- **Detección de Lenguaje Automática:** Identifica JavaScript, TypeScript, Python, HTML, SQL, Rust, Go, Java, C++ y JSON.
- **Desglose Secuencial:** Explica imports, firmas de funciones, variables declaradas (`const`/`let`), llamadas asíncronas (`async/await`) y estructuras de control.
- **Cálculo de Complejidad:** Estima la complejidad temporal ($O(1)$, $O(n)$, $O(n^2)$) y espacial según las estructuras de bucle e iteración.

### 2. 🔍 Auditoría Profunda de Bugs y Seguridad
- **Puntuación de Salud del Código (0 a 100):** Calcula una métrica de calidad basada en hallazgos.
- **Chequeo de Sintaxis y Balanceo:** Detecta llaves `{}`, corchetes `[]` y paréntesis `()` desbalanceados.
- **Vulnerabilidades de Seguridad:** Alerta sobre inyecciones de código (`eval`, `new Function`), manipulación insegura del DOM (`.innerHTML` - XSS).
- **Bugs Lógicos y Tipado:** Detecta asignaciones erróneas en condicionales (`if (x = y)`), comparaciones débiles (`==` vs `===`), uso de `var` obsoleto y bloques `catch` silenciados.
- **Casos Límite (Edge Cases):** Sugerencias para valores `null`/`undefined`, colecciones vacías y navegación segura con encadenamiento opcional (`?.`).

### 3. ⚡ Refactorización y Conversión Sintáctica
- **A TypeScript (Clean Code):** Infiere firmas con tipado y convierte variables a inmutables.
- **A JavaScript Moderno (ES2024):** Convierte a arrow functions, template literals y operadores modernos.
- **Traducción a Python 3:** Convierte sintaxis a `def`, indentación, operadores lógicos (`and`, `or`, `not`) y valores estándar (`True`, `False`, `None`).
- **Generador JSDoc / Docstrings:** Documenta automáticamente parámetros (`@param`) y retornos (`@returns`).

### 4. 🖱️ Doble Vía de Entrada
- **Menú Contextual:** Selecciona cualquier fragmento en una página web, haz clic derecho y pulsa **"Analizar con Code Explainer"**.
- **Editor Manual Integrado:** Escribe o pega código directamente en el panel lateral con botones de **Pegar** y **Limpiar**.

---

## 🚀 Instalación en Google Chrome

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/cervantessaralucia4-dotcom/sidepanel-code-explainer.git
cd sidepanel-code-explainer
```

### Paso 2: Cargar la extensión en Chrome
1. Abre Google Chrome y ve a `chrome://extensions/`.
2. Activa el **"Modo de desarrollador"** (interruptor superior derecho).
3. Haz clic en **"Cargar descomprimida"** (Load unpacked).
4. Selecciona la carpeta `sidepanel-code-explainer`.

---

## 🕹️ Guía de Uso

1. Haz clic en el icono de la extensión en la barra de herramientas para abrir el panel lateral (o selecciona código en cualquier página web, haz clic derecho y elige **"Analizar con Code Explainer"**).
2. Elige cualquiera de los tres modos:
   - **Explicar lógica**: Desglose pedagógico e interactivo del flujo de ejecución.
   - **Buscar bugs**: Auditoría de seguridad, errores sintácticos y buenas prácticas con tarjeta de puntuación.
   - **Refactorizar / Convertir**: Selecciona la conversión deseada y obtén el código listo para producción.
3. Copia el resultado con el botón **"Copiar"**.

---

## 🔒 Privacidad y Permisos

- **Cero peticiones de red:** La extensión no incluye ningún permiso de red ni envía telemetría.
- **`sidePanel`**: Renderiza el panel lateral nativo.
- **`contextMenus`**: Habilita la opción al hacer clic derecho sobre selecciones de texto.
- **`storage`**: Recuerda el último fragmento analizado en la sesión local.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
