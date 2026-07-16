# Arquitectura del proyecto

## Descripción general

Este proyecto implementa una API RAG (*Retrieval-Augmented Generation*) en Python. Su objetivo es responder preguntas utilizando como contexto el contenido de un documento PDF.

La solución sigue una arquitectura monolítica modular: todos los componentes se ejecutan en un único servicio, pero las responsabilidades están separadas en módulos para la API, la carga documental, la recuperación vectorial y la selección del modelo de lenguaje.

## Diagrama general

```text
Cliente HTTP
    |
    v
FastAPI (app/main.py)
    |
    v
RAGAgent (app/rag_agent.py)
    |
    +-- Carga y fragmentación del PDF (app/loader.py)
    |
    +-- Embeddings locales (all-MiniLM-L6-v2)
    |
    +-- Almacenamiento vectorial (ChromaDB)
    |
    +-- Recuperación de fragmentos relevantes
    |
    +-- Modelo de lenguaje (app/llm_factory.py)
            |-- Anthropic
            |-- NVIDIA NIM
            |-- Groq
            `-- OpenRouter
```

## Componentes principales

### API HTTP

El archivo `app/main.py` es el punto de entrada de la aplicación. Crea la instancia de FastAPI, expone los endpoints y mantiene en memoria el agente RAG activo.

Los endpoints disponibles son:

- `GET /health`: informa si el servicio está activo y si existe un documento indexado.
- `POST /documents/upload`: recibe un PDF, lo almacena y crea un nuevo índice vectorial.
- `POST /ask`: recibe una pregunta y devuelve una respuesta junto con las fuentes utilizadas.
- `GET /docs`: documentación interactiva generada automáticamente por FastAPI.

### Agente RAG

El archivo `app/rag_agent.py` contiene la clase `RAGAgent`, responsable de coordinar el pipeline completo:

1. Crear el modelo de embeddings.
2. Cargar o reutilizar el índice vectorial.
3. Configurar el recuperador semántico.
4. Crear la cadena `RetrievalQA`.
5. Ejecutar preguntas y devolver respuestas con sus fuentes.

El recuperador selecciona los cuatro fragmentos más relevantes para cada pregunta. La cadena utiliza la estrategia `stuff`, que incorpora directamente estos fragmentos al contexto enviado al modelo de lenguaje.

### Carga y fragmentación

El archivo `app/loader.py` procesa los documentos mediante:

- `PyPDFLoader`, para extraer el texto y los metadatos de cada página.
- `RecursiveCharacterTextSplitter`, para dividir el texto en fragmentos.

La configuración predeterminada usa fragmentos de 1.000 caracteres y un solapamiento de 150 caracteres. El solapamiento ayuda a conservar contexto entre fragmentos consecutivos.

### Embeddings y base vectorial

Los embeddings se generan localmente con el modelo:

```text
sentence-transformers/all-MiniLM-L6-v2
```

Los vectores se almacenan en ChromaDB. El índice se persiste dentro de `/data`, por lo que puede reutilizarse en posteriores arranques sin volver a procesar el PDF.

### Fábrica de modelos de lenguaje

El archivo `app/llm_factory.py` desacopla el proveedor del modelo de lenguaje del resto del pipeline RAG.

El proveedor se selecciona mediante `LLM_PROVIDER` y el modelo puede sobrescribirse con `LLM_MODEL`. Los proveedores soportados son:

| Proveedor | Valor de `LLM_PROVIDER` | Integración |
| --- | --- | --- |
| Anthropic | `anthropic` | `ChatAnthropic` |
| NVIDIA NIM | `nvidia` | API compatible con OpenAI |
| Groq | `groq` | API compatible con OpenAI |
| OpenRouter | `openrouter` | API compatible con OpenAI |

Cada proveedor obtiene su credencial desde una variable de entorno específica.

## Flujo de indexación

Al iniciar la aplicación se consulta la variable `PDF_PATH`:

1. Si el PDF existe, se crea una instancia de `RAGAgent`.
2. Si ya existe un índice persistido, ChromaDB lo reutiliza.
3. Si no existe, el PDF se carga y se divide en fragmentos.
4. Se generan los embeddings de los fragmentos.
5. Los embeddings y metadatos se guardan en ChromaDB.
6. Se configura la cadena de recuperación y respuesta.

Si el archivo configurado no existe, la API inicia sin un agente activo y espera la carga de un PDF mediante `POST /documents/upload`.

Cuando se carga un nuevo documento por la API, el archivo se guarda en `/data` y se crea un índice nuevo en un directorio identificado mediante UUID.

## Flujo de una consulta

```text
POST /ask
    |
    v
Validación de la pregunta
    |
    v
Búsqueda semántica en ChromaDB
    |
    v
Recuperación de los 4 fragmentos más relevantes
    |
    v
Construcción del contexto de RetrievalQA
    |
    v
Consulta al LLM configurado
    |
    v
Respuesta y referencias a las páginas utilizadas
```

Las fuentes se construyen a partir de los metadatos `source` y `page` conservados durante la carga del PDF.

## Despliegue

La aplicación se distribuye mediante Docker y Docker Compose.

El contenedor:

- Usa Python 3.11.
- Ejecuta Uvicorn en el puerto `8000`.
- Expone el servicio localmente en el puerto `8888`.
- Carga las variables desde `.env`.
- Monta la carpeta local `./data` como `/data`.

```text
localhost:8888  -->  contenedor:8000
./data          -->  /data
.env            -->  variables de entorno
```

El volumen permite conservar los PDFs y los índices vectoriales aunque el contenedor sea recreado.

## Resumen

La arquitectura implementa las cuatro etapas habituales de un sistema RAG:

1. **Ingesta:** carga del documento PDF.
2. **Indexación:** fragmentación, generación de embeddings y persistencia en ChromaDB.
3. **Recuperación:** búsqueda semántica de los fragmentos relacionados con la pregunta.
4. **Generación:** construcción de una respuesta mediante un LLM usando los fragmentos recuperados como contexto.

La separación entre la API, el agente RAG, el cargador documental y la fábrica de modelos permite cambiar el proveedor del LLM o ajustar la estrategia de carga sin modificar todo el sistema.
