# 🚀 SidePanel Prompt & Code Explainer

Una extensión moderna y ligera para Google Chrome (**Manifest V3**) que integra la inteligencia artificial de Google Gemini directamente en el panel lateral nativo (`chrome.sidePanel`). Diseñada para desarrolladores, estudiantes y auditores de software que necesitan comprender, auditar y transformar fragmentos de código mientras navegan por la web.

![Manifest V3](https://img.shields.io/badge/Manifest_V3-Chrome_116+-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_API-2.5_Flash_%2F_Pro-8E75C4?style=flat-square&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📌 ¿Qué problema resuelve?

Al navegar por repositorios de GitHub, hilos de StackOverflow o documentación técnica, es común encontrar funciones complejas, snippets desactualizados o código en lenguajes que no dominamos por completo. 

El flujo tradicional de copiar, cambiar de pestaña a un chat de IA, escribir el prompt y volver rompe el foco de atención. **SidePanel Prompt & Code Explainer** permite seleccionar cualquier fragmento de código, hacer clic derecho y analizarlo al instante en el lateral de la pantalla sin cambiar de pestaña ni perder el contexto de lectura.

---

## ✨ Características Principales

### 1. 📖 Explicación de Lógica Paso a Paso
- Desglosa la arquitectura y el propósito general del bloque seleccionado.
- Explica el flujo de ejecución de manera secuencial y pedagógica.
- Analiza la complejidad algorítmica ($O(n)$, espacio y tiempo) y patrones utilizados.

### 2. 🔍 Detección de Bugs, Vulnerabilidades y Casos Límite (Edge Cases)
- Realiza una auditoría estática rápida del fragmento seleccionado.
- Identifica desbordamientos, variables no controladas, nulos (`null` / `undefined`), concurrencia o condiciones de carrera.
- Alerta sobre riesgos de inyección, sanitización o fugas de memoria.
- Propone el parche o solución recomendada.

### 3. ⚡ Refactorización y Conversión de Sintaxis
- Traduce y moderniza código a cualquier lenguaje o estándar deseado (TypeScript, Python 3, Rust, Go, Java, etc.).
- Aplica principios de diseño limpio (*Clean Code*, inmutabilidad, tipado estricto, manejo seguro de errores).
- Proporciona el código de reemplazo completo listo para copiar con un clic.

### 4. 💻 Experiencia de Usuario Nativa
- **Integración con `chrome.sidePanel`**: No obstruye la página web activa con ventanas modales o popups molestos.
- **Tema Oscuro estilo IDE**: Paleta inspirada en DevTools (`#121214` / `#202024`) con resaltado de código monoespaciado (`JetBrains Mono`, `Fira Code`).
- **Sincronización en tiempo real**: Si el panel ya está abierto, se actualiza automáticamente al seleccionar nuevo código en la página.
- **Soporte de Modelos**: Permite alternar entre **Gemini 2.5 Flash** (respuestas ultrarrápidas) y **Gemini 2.5 Pro** (análisis y razonamiento profundo).
- **Seguridad y Privacidad**: Tu API Key se guarda exclusivamente en el almacenamiento local de tu navegador (`chrome.storage.local`). Tus peticiones van directo a los servidores de Google sin intermediarios ni analíticas externas.

---

## 🛠️ Tecnologías y Arquitectura

```text
sidepanel-code-explainer/
├── manifest.json         # Configuración Manifest V3 y permisos nativos
├── background.js         # Service Worker (Context Menu & apertura del Side Panel)
├── sidepanel.html        # UI responsiva optimizada para paneles estrechos
├── sidepanel.css         # Estilos oscuros modernos y scrollbars estilizadas
├── sidepanel.js          # Control de estados, cliente REST Gemini y parser Markdown
├── icons/                # Iconos en resoluciones estándar (16, 48, 128 px)
└── README.md             # Documentación técnica
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
1. Google Chrome (versión 116 o superior).
2. Una API Key gratuita de Google Gemini, disponible en [Google AI Studio](https://aistudio.google.com/).

### Paso 1: Clonar o descargar el repositorio
```bash
git clone https://github.com/cervantessaralucia4-dotcom/sidepanel-code-explainer.git
cd sidepanel-code-explainer
```

### Paso 2: Cargar la extensión en Google Chrome
1. Abre Google Chrome y escribe en la barra de direcciones:
   ```text
   chrome://extensions/
   ```
2. Activa el interruptor **"Modo de desarrollador"** (Developer mode) situado en la esquina superior derecha.
3. Haz clic en el botón **"Cargar descomprimida"** (Load unpacked).
4. Selecciona la carpeta `sidepanel-code-explainer` donde se encuentra este proyecto.

### Paso 3: Configurar tu API Key
1. Haz clic en el icono de **Code Explainer** en la barra de extensiones para desplegar el Side Panel.
2. Pulsa en el icono de engranaje (⚙️) en la cabecera.
3. Pega tu API Key de Gemini y haz clic en **Guardar**.

---

## 🕹️ Guía de Uso

1. Navega por cualquier sitio web (por ejemplo [GitHub](https://github.com) o [StackOverflow](https://stackoverflow.com)).
2. Resalta con el cursor cualquier función, expresión regular o bloque de código.
3. Haz clic derecho y selecciona **"Analizar con Code Explainer"**.
4. El panel lateral se abrirá automáticamente con el código cargado.
5. Elige la acción deseada:
   - **Explicar lógica**: Obtén un desglose didáctico del código.
   - **Buscar bugs**: Revisa posibles errores y edge cases.
   - **Refactorizar / Convertir**: Escribe o elige el lenguaje de destino y obtén la versión modernizada.
6. Copia el resultado directamente al portapapeles con el botón **"Copiar"**.

---

## 🔒 Privacidad y Permisos

Esta extensión respeta al 100% tu privacidad:
- **`sidePanel`**: Requerido para renderizar la interfaz en el panel nativo lateral.
- **`contextMenus`**: Requerido para añadir la opción en el menú contextual del clic derecho.
- **`storage`**: Almacena tu API Key y la última selección únicamente en tu navegador.
- **`activeTab`**: Permite capturar la selección del usuario bajo demanda sin inyectar scripts permanentes en segundo plano.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

