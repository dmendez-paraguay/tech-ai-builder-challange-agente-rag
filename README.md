# Tech AI Builder Challenge - Agente RAG

API RAG con FastAPI que responde preguntas usando el contenido de un PDF.

## Requisitos

- Docker Desktop instalado y corriendo.
- Archivo `.env` configurado a partir de `.env.example`.
- PDF dentro de la carpeta `data`.

## Configurar .env

Copiar el archivo de ejemplo:

```powershell
Copy-Item .env.example .env
```

Luego editar `.env` y completar:

- `LLM_PROVIDER` con el proveedor que vas a usar.
- La API key del proveedor elegido.
- `PDF_PATH` con la ruta del PDF dentro del contenedor.

Ejemplo:

```text
data/challange-1.pdf
```

En `.env`, la ruta debe apuntar al archivo dentro del contenedor:

```env
PDF_PATH=/data/challange-1.pdf
```

Ejemplo usando Groq:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=tu_api_key_aqui
PDF_PATH=/data/challange-1.pdf
```

El archivo `.env` no debe subirse al repositorio porque contiene credenciales.

## LLMs soportados

El proveedor se define con `LLM_PROVIDER` en `.env`.

| Provider | `LLM_PROVIDER` | API key requerida | Modelo por defecto |
| --- | --- | --- | --- |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-6` |
| NVIDIA NIM | `nvidia` | `NVIDIA_API_KEY` | `deepseek-ai/deepseek-r1` |
| Groq | `groq` | `GROQ_API_KEY` | `llama-3.3-70b-versatile` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | `deepseek/deepseek-r1:free` |

Opcionalmente se puede sobrescribir el modelo por defecto con:

```env
LLM_MODEL=nombre-del-modelo
```

## Iniciar con Docker

Desde la raiz del proyecto:

```powershell
docker compose up -d --build
```

La API queda disponible en:

```text
http://localhost:8888
```

Healthcheck:

```text
http://localhost:8888/health
```

Documentacion interactiva de la API:

```text
http://localhost:8888/docs
```

## Ver logs

```powershell
docker compose logs -f
```

## Detener el proyecto

```powershell
docker compose down
```

## Si cambiaste el archivo .env

Docker puede seguir usando variables viejas si el contenedor ya existe.
Para recrearlo con el `.env` actualizado:

```powershell
docker compose down
docker compose up -d --no-build
```

## Si cambiaste dependencias o el Dockerfile

```powershell
docker compose up -d --build --force-recreate
```
