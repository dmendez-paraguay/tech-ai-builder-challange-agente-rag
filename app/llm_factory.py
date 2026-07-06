"""
Fábrica de LLMs: seleccionar qué modelo de lenguaje usar según la variable
de entorno LLM_PROVIDER, sin tocar el resto del pipeline RAG.

Providers soportados:
- "anthropic"  -> Claude (API oficial de Anthropic)
- "nvidia"     -> NVIDIA NIM (catálogo gratuito: DeepSeek, Qwen, GLM, Llama, etc.)
- "groq"       -> Groq (Llama, muy rápido, tier gratis generoso)
- "openrouter" -> OpenRouter (agrega decenas de modelos gratis bajo una sola key)

Todos menos Anthropic exponen un endpoint compatible con la API de
OpenAI, así que se resuelven con la misma clase ChatOpenAI cambiando
solo la base_url y el nombre del modelo.
"""

import os

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI


# base_url de cada proveedor OpenAI-compatible
_OPENAI_COMPATIBLE_BASE_URLS = {
    "nvidia": "https://integrate.api.nvidia.com/v1",
    "groq": "https://api.groq.com/openai/v1",
    "openrouter": "https://openrouter.ai/api/v1",
}

# Modelo por defecto de cada proveedor (podés overridearlo con LLM_MODEL)
_DEFAULT_MODELS = {
    "anthropic": "claude-sonnet-4-6",
    "nvidia": "deepseek-ai/deepseek-r1",
    "groq": "llama-3.3-70b-versatile",
    "openrouter": "deepseek/deepseek-r1:free",
}

# Nombre de la variable de entorno que trae la API key de cada proveedor
_API_KEY_ENV_VARS = {
    "anthropic": "ANTHROPIC_API_KEY",
    "nvidia": "NVIDIA_API_KEY",
    "groq": "GROQ_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
}


def get_llm(temperature: float = 0):
    """
    Devuelve una instancia de chat model lista para usar en la cadena
    RetrievalQA, elegida según LLM_PROVIDER (default: "anthropic").
    """
    provider = os.getenv("LLM_PROVIDER", "anthropic").lower().strip()

    if provider not in _DEFAULT_MODELS:
        raise ValueError(
            f"LLM_PROVIDER='{provider}' no es válido. "
            f"Opciones soportadas: {', '.join(_DEFAULT_MODELS.keys())}"
        )

    api_key_env_var = _API_KEY_ENV_VARS[provider]
    api_key = os.getenv(api_key_env_var)

    if not api_key:
        raise ValueError(
            f"Falta la variable de entorno {api_key_env_var} para usar "
            f"LLM_PROVIDER='{provider}'. Revisá tu archivo .env."
        )

    model_name = os.getenv("LLM_MODEL", _DEFAULT_MODELS[provider])

    if provider == "anthropic":
        return ChatAnthropic(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
        )

    # Resto de proveedores: todos hablan el protocolo de OpenAI
    return ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=_OPENAI_COMPATIBLE_BASE_URLS[provider],
        temperature=temperature,
    )
