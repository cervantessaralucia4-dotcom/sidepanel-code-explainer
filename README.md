# 🚀 SidePanel Prompt & Code Explainer (Gemini Nano Local)

Una extensión moderna para Google Chrome (**Manifest V3**) que aprovecha la **IA local integrada nativa de Chrome (Gemini Nano / Prompt API)** directamente en el panel lateral (`chrome.sidePanel`). 

**100% privada, en el dispositivo y sin requerir API Keys externas ni conexión a internet.**

![Manifest V3](https://img.shields.io/badge/Manifest_V3-Chrome_127+-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Chrome Built-in AI](https://img.shields.io/badge/Chrome_Built--in_AI-Gemini_Nano_(On--Device)-34A853?style=flat-square&logo=google&logoColor=white)
![No API Key Needed](https://img.shields.io/badge/API_Key-Not_Required-04d361?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📌 ¿Qué ventajas ofrece?

- **Cero configuración:** No necesitas registrarte en Google Cloud ni pagar cuotas o pegar API Keys. Funciona directo en tu navegador con el modelo local de Chrome.
- **Privacidad total (On-Device):** Tu código jamás sale de tu ordenador hacia un servidor externo. Todo el procesamiento de IA ocurre en tu hardware local.
- **Sin romper tu flujo de trabajo:** Selecciona cualquier código en GitHub, StackOverflow o documentación técnica, haz clic derecho y analízalo en el panel lateral de Chrome sin cambiar de pestaña.

---

## ✨ Características Principales

### 1. 📖 Explicación de Lógica Paso a Paso
- Desglose didáctico del propósito y arquitectura del bloque seleccionado.
- Flujo secuencial de ejecución y consideraciones de complejidad temporal y espacial ($O(n)$).

### 2. 🔍 Detección de Bugs, Vulnerabilidades y Casos Límite (Edge Cases)
- Auditoría de código en el dispositivo para detectar errores de lógica, coerción de tipos, desbordamientos y valores nulos/indefinidos.
- Alertas de patrones inseguros y recomendaciones prácticas de remediación.

### 3. ⚡ Refactorización y Conversión de Sintaxis
- Traducción y modernización de snippets a cualquier lenguaje o estándar deseado (TypeScript, Python 3, Rust, Go, Java, C++, etc.).
- Aplica principios *Clean Code*, inmutabilidad y tipado fuerte.

### 4. ⚡ Streaming de Tokens en Tiempo Real
- La respuesta generada por Gemini Nano fluye en tiempo real directamente en el panel lateral a medida que se procesa en el dispositivo.

---

## 🛠️ Cómo habilitar Gemini Nano en Google Chrome

Para utilizar la IA local integrada de Chrome, asegúrate de activar los siguientes flags experimentales en tu navegador:

1. Abre una nueva pestaña y ve a:
   ```text
   chrome://flags/#optimization-guide-on-device-model
   ```
   Selecciona **Enabled BypassPerfRequirement**.

2. Ve a:
   ```text
   chrome://flags/#prompt-api-for-gemini-nano
   ```
   Selecciona **Enabled**.

3. Haz clic en **Relaunch** (Reiniciar Chrome) para aplicar los cambios.

4. *(Opcional)* Ve a `chrome://components` y verifica que el componente **Optimization Guide On Device Model** figure como actualizado/descargado.

*(Nota: Si aún no tienes activos estos flags, la extensión cuenta con un motor de análisis heurístico local de respaldo para que nunca te quedes sin respuesta).*

---

## 🚀 Instalación de la Extensión

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/cervantessaralucia4-dotcom/sidepanel-code-explainer.git
cd sidepanel-code-explainer
```

### Paso 2: Cargar la extensión en Google Chrome
1. Abre Chrome y entra en `chrome://extensions/`.
2. Activa el interruptor **"Modo de desarrollador"** (esquina superior derecha).
3. Haz clic en **"Cargar descomprimida"** (Load unpacked).
4. Selecciona la carpeta `sidepanel-code-explainer`.

---

## 🕹️ Guía de Uso

1. Selecciona cualquier fragmento de código en cualquier página web.
2. Haz clic derecho y elige **"Analizar con Code Explainer"**.
3. El panel lateral se abrirá automáticamente con el código cargado.
4. Pulsa cualquiera de los botones:
   - **Explicar lógica**
   - **Buscar bugs**
   - **Refactorizar / Convertir** (especificando el lenguaje que desees)
5. Puedes copiar la respuesta al portapapeles con un clic.

---

## 🔒 Privacidad y Permisos

- **Sin permisos de red externos:** La extensión no realiza ninguna petición HTTP hacia APIs externas.
- **`sidePanel`**: Renderiza la interfaz en el panel nativo de Chrome.
- **`contextMenus`**: Agrega el atajo en el menú del clic derecho sobre selecciones.
- **`storage`**: Recuerda el último fragmento de código analizado localmente.

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
