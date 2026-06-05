# Guía: Crear un Agente AI en Onyx

Esta guía te explica paso a paso cómo crear y configurar un Agente (Assistant) personalizado dentro de tu instancia de Onyx para que funcione de forma óptima con esta interfaz web.

## ¿Qué es un Agente en Onyx?

Un Agente en Onyx es un asistente AI personalizado con:
- **Instrucciones específicas** (system prompt)
- **Acceso a fuentes de datos** (Document Sets)
- **Acciones/herramientas** habilitadas (búsqueda, web, código, etc.)
- **Configuración de modelo** (GPT-4, Claude, etc.)

## Paso 1: Acceder al Admin Panel

1. Ve a tu instancia de Onyx: `https://tu-instancia-onyx.com`
2. Inicia sesión con tu cuenta de administrador
3. Haz clic en el ícono de **Admin** (engranaje) en la barra lateral
4. Navega a **Agents** en el menú lateral

## Paso 2: Crear un Nuevo Agente

1. Haz clic en **"New Agent"** (botón en la parte superior)
2. Configura los siguientes campos:

### Nombre y Descripción

| Campo | Valor sugerido |
|-------|---------------|
| **Name** | `Agente Notion` (o el nombre que prefieras) |
| **Description** | `Agente AI especializado en consultar la base de conocimiento de Notion con más de 30,000 documentos indexados` |

### Instrucciones del Sistema (System Prompt)

Este es el prompt que define el comportamiento del agente. Copia y pega el siguiente:

```
Eres un asistente AI experto que tiene acceso a una base de conocimiento con más de 30,000 documentos de Notion. Tu rol principal es:

1. BUSCAR información relevante en los documentos indexados antes de responder
2. RESPONDER siempre en español
3. CITAR las fuentes de donde sacas la información
4. Ser PRECISO y basarte solo en la información disponible en los documentos
5. Si no encuentras información relevante, indicarlo claramente

Cuando el usuario haga una pregunta:
- Primero usa la herramienta de búsqueda interna para encontrar documentos relevantes
- Sintetiza la información de múltiples documentos si es necesario
- Presenta la respuesta de forma clara y estructurada
- Incluye referencias a los documentos fuente

Si la pregunta no está cubierta por los documentos disponibles, indica que no tienes información sobre ese tema en la base de conocimiento.
```

### Ícono (Opcional)

Puedes elegir un ícono para identificar visualmente tu agente (por ejemplo, un libro o una lupa).

## Paso 3: Configurar las Acciones (Tools)

Habilita las siguientes acciones para tu agente:

| Acción | Recomendación | Descripción |
|--------|--------------|-------------|
| **Internal Search** | ✅ Obligatorio | Permite buscar en los documentos indexados |
| **Web Search** | ⚙️ Opcional | Permite búsquedas en internet |
| **Open URL** | ⚙️ Opcional | Permite abrir y leer URLs |
| **Image Generation** | ❌ No necesario | Generación de imágenes |
| **Code Interpreter** | ⚙️ Opcional | Para análisis de datos |

> **Importante**: La acción "Internal Search" es indispensable — sin ella, el agente no podrá acceder a tus documentos de Notion.

## Paso 4: Configurar Fuentes de Datos (Document Sets)

1. Si has creado **Document Sets** específicos en Onyx (grupos de documentos), puedes asignarlos aquí
2. Si no tienes Document Sets configurados, deja este campo vacío — el agente buscará en **todos** los documentos indexados
3. Para crear un Document Set:
   - Ve a **Admin Panel** > **Document Management** > **Document Sets**
   - Crea un nuevo set (ej: "Documentos Notion")
   - Asigna los conectores relevantes (tu conector de Notion)

## Paso 5: Configuración Avanzada

### Modelo LLM

Si tienes múltiples modelos configurados, puedes elegir cuál usar:
- **GPT-4** / **GPT-4o**: Mejor calidad de respuesta
- **Claude Sonnet**: Excelente para análisis largos
- **Modelos más rápidos**: Para respuestas rápidas con menor costo

### Visibilidad

| Opción | Descripción |
|--------|-------------|
| **Public** | Visible para todos los usuarios de la organización |
| **Private** | Solo visible para ti o usuarios específicos |
| **Featured** | Aparece destacado en la pantalla principal |

### Starter Messages (Opcional)

Puedes configurar mensajes de ejemplo que aparecerán como sugerencias:

```
¿Cuáles son los últimos documentos sobre el proyecto X?
Resume la información disponible sobre [tema]
¿Qué políticas tenemos documentadas sobre...?
Busca información sobre el proceso de...
```

## Paso 6: Guardar y Obtener el ID del Agente

1. Haz clic en **"Create"** o **"Save"**
2. Una vez creado, necesitas el **ID del agente** para esta interfaz web
3. Para encontrar el ID:
   - En la URL del navegador cuando editas el agente, verás algo como: `https://tu-instancia/admin/assistants/5`
   - El número al final (en este caso `5`) es el ID
   - O usa la API: `GET /api/persona` para listar todos los agentes con sus IDs

## Paso 7: Conectar con esta Interfaz Web

Una vez que tengas el ID del agente:

1. La interfaz web ya muestra un selector de agentes en la barra superior
2. Si quieres que tu agente sea el predeterminado, puedes configurar el `persona_id` en el código

## Paso 8: Verificar la Conexión

Para verificar que todo funciona, puedes probar con curl:

```bash
# Listar agentes disponibles
curl -X GET "https://tu-instancia-onyx.com/api/persona" \
  -H "Authorization: Bearer TU_API_KEY" \
  -H "Content-Type: application/json"

# Enviar un mensaje de prueba
curl -X POST "https://tu-instancia-onyx.com/api/chat/send-chat-message" \
  -H "Authorization: Bearer TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Qué documentos tienes disponibles?",
    "chat_session_info": {"persona_id": TU_AGENT_ID},
    "stream": false,
    "include_citations": true
  }'
```

## Ejemplo de Interacción

Una vez configurado, así se verá una conversación típica:

**Usuario:** "¿Cuáles son las políticas de vacaciones documentadas?"

**Agente AI:** "Según los documentos encontrados en la base de conocimiento, las políticas de vacaciones incluyen:

1. **Días disponibles**: Los empleados de tiempo completo tienen 15 días hábiles al año [Fuente: Política RH 2024]
2. **Proceso de solicitud**: Se debe solicitar con mínimo 5 días de anticipación a través del sistema [Fuente: Manual de Procesos]
3. **Restricciones**: No se pueden tomar más de 10 días consecutivos sin aprobación del director [Fuente: Reglamento Interno]

*Fuentes consultadas: Política RH 2024, Manual de Procesos v3, Reglamento Interno 2024*"

---

## Resumen Rápido

| Paso | Acción |
|------|--------|
| 1 | Ir a Admin Panel > Agents |
| 2 | Crear nuevo agente con nombre e instrucciones |
| 3 | Habilitar "Internal Search" como acción |
| 4 | (Opcional) Asignar Document Sets |
| 5 | Configurar modelo y visibilidad |
| 6 | Guardar y anotar el ID |
| 7 | El agente ya está disponible en la interfaz web |

## Notas Adicionales

- **Idioma**: La variable `MULTILINGUAL_QUERY_EXPANSION=Spanish` en el entorno asegura que las consultas se expandan en español para mejor recuperación de documentos en ese idioma
- **Límite de tokens**: Ten en cuenta el límite de contexto del modelo elegido al trabajar con documentos largos
- **Actualización de documentos**: Los documentos se re-indexan automáticamente según la configuración del conector de Notion (generalmente cada 10-30 minutos)
