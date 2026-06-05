# Agente AI - Onyx

Interfaz web personalizada para interactuar con tu instancia de [Onyx](https://github.com/onyx-dot-app/onyx) mediante un agente AI que consulta tu base de conocimiento (Notion, Google Drive, Confluence, etc.).

## Características

- **Chat con IA**: Envía preguntas y obtén respuestas basadas en tus documentos indexados en Onyx
- **Búsqueda de documentos**: Panel lateral para buscar directamente en tu base de conocimiento
- **Citaciones**: Las respuestas incluyen referencias a los documentos fuente
- **Soporte multilingüe**: Configurado para respuestas en español
- **Selector de agentes**: Elige entre los diferentes agentes/asistentes configurados en Onyx
- **Interfaz moderna**: UI responsiva con Tailwind CSS

## Requisitos previos

- Node.js 18+ 
- Una instancia de Onyx en ejecución con documentos indexados
- Una API Key de Onyx (se obtiene desde el Admin Panel)

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/johnfelipe/onyx-ai-agent.git
cd onyx-ai-agent
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:

```bash
cp .env.example .env.local
```

Edita `.env.local` con los valores de tu instancia:

```env
ONYX_API_URL=https://tu-instancia-onyx.com/api
ONYX_API_KEY=tu_api_key_aqui
MULTILINGUAL_QUERY_EXPANSION=Spanish
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Obtener la API Key de Onyx

1. Accede al **Admin Panel** de tu instancia de Onyx
2. Ve a **Settings** > **API Keys**
3. Crea una nueva **Basic API Key** (recomendado) o **Admin API Key**
4. Copia la API Key generada y pégala en tu `.env.local`

> Para más detalles sobre la creación del agente en Onyx, consulta [ONYX_AGENT_SETUP.md](./ONYX_AGENT_SETUP.md).

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Proxy para el endpoint de chat de Onyx
│   │   ├── search/route.ts     # Proxy para búsqueda de documentos
│   │   └── agents/route.ts     # Lista los agentes disponibles
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Página principal
│   └── globals.css             # Estilos globales
├── components/
│   ├── ChatInterface.tsx       # Interfaz principal del chat
│   ├── ChatMessage.tsx         # Componente de mensaje individual
│   └── SearchPanel.tsx         # Panel de búsqueda de documentos
└── lib/
    ├── onyx.ts                 # Cliente API de Onyx
    └── types.ts                # Tipos TypeScript
```

## Despliegue

### Vercel (recomendado)

1. Conecta tu repositorio en [Vercel](https://vercel.com)
2. Configura las variables de entorno en el dashboard de Vercel:
   - `ONYX_API_URL`
   - `ONYX_API_KEY`
   - `MULTILINGUAL_QUERY_EXPANSION`
3. Despliega

### Docker

```bash
docker build -t onyx-ai-agent .
docker run -p 3000:3000 \
  -e ONYX_API_URL=https://tu-instancia-onyx.com/api \
  -e ONYX_API_KEY=tu_api_key \
  onyx-ai-agent
```

## Ejemplos de uso

Una vez que la aplicación esté corriendo, puedes interactuar con el agente AI de la siguiente manera:

**Ejemplo 1 - Consulta general:**
> "¿Cuáles son los últimos documentos agregados sobre el proyecto X?"

**Ejemplo 2 - Búsqueda específica:**
> "Encuentra toda la información relacionada con las políticas de la empresa"

**Ejemplo 3 - Resumen:**
> "Resume los documentos más importantes sobre el proceso de onboarding"

**Ejemplo 4 - Análisis:**
> "¿Qué información tenemos sobre los KPIs del último trimestre?"

## Licencia

MIT
