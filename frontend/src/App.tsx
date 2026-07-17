import { Github, Moon, Sun } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { ChatPanel, type ChatMessage } from "@/components/ChatPanel"
import { DocumentPanel } from "@/components/DocumentPanel"
import { StatusPill } from "@/components/StatusPill"
import { Button } from "@/components/ui/button"
import { askQuestion, getHealth, uploadPdf, type HealthResponse } from "@/lib/api"
import { createId } from "@/lib/id"

type Theme = "light" | "dark"

function getInitialTheme(): Theme {
  const saved = localStorage.getItem("rag-theme")
  if (saved === "light" || saved === "dark") return saved
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function basename(path: string | null) {
  if (!path) return null
  return path.split(/[\\/]/).pop() ?? path
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [isHealthLoading, setIsHealthLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const controller = new AbortController()
    getHealth(controller.signal)
      .then((data) => {
        setHealth(data)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return
        setHealth(null)
        setError(requestError instanceof Error ? requestError.message : "No se pudo conectar con la API.")
      })
      .finally(() => setIsHealthLoading(false))

    return () => controller.abort()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("rag-theme", theme)
  }, [theme])

  const status = useMemo(() => {
    if (isUploading || isHealthLoading) return { state: "loading" as const, label: isUploading ? "Indexando PDF" : "Conectando" }
    if (!health) return { state: "offline" as const, label: "API sin conexión" }
    if (health.agent_ready) return { state: "ready" as const, label: "Documento listo" }
    return { state: "waiting" as const, label: "Esperando PDF" }
  }, [health, isHealthLoading, isUploading])

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)
    try {
      const result = await uploadPdf(file)
      setHealth({ status: "ok", agent_ready: result.agent_ready, pdf_path: result.path })
      setMessages([])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo cargar el documento.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAsk = async (question: string) => {
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: question,
    }
    setMessages((current) => [...current, userMessage])
    setIsAsking(true)
    setError(null)

    try {
      const result = await askQuestion(question)
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: result.answer,
          sources: result.sources,
          lowRelevance: result.low_relevance,
        },
      ])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo generar la respuesta.")
    } finally {
      setIsAsking(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center bg-[var(--ink)] font-mono text-sm font-bold text-[var(--paper)]">
              R/
            </div>
            <div>
              <p className="font-semibold tracking-[-0.02em]">RAG Workspace</p>
              <p className="hidden text-xs text-[var(--ink-muted)] sm:block">Preguntas con contexto verificable</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusPill state={status.state} label={status.label} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              aria-label={theme === "light" ? "Activar tema oscuro" : "Activar tema claro"}
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
            <Button asChild className="hidden sm:inline-flex" variant="ghost" size="icon">
              <a
                href="https://github.com/dmendez-paraguay/tech-ai-builder-challange-agente-rag"
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir repositorio en GitHub"
              >
                <Github className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mb-7 max-w-3xl">
          <p className="eyebrow">Agente documental</p>
          <h1 className="mt-2 max-w-full text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Tu documento, convertido en respuestas claras.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)] sm:text-base">
            Cargá un PDF, consultá su contenido y revisá qué páginas respaldan cada respuesta.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 border border-red-700/25 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200" role="alert">
            <span>{error}</span>
            <button className="shrink-0 font-semibold underline underline-offset-4" type="button" onClick={() => setError(null)}>
              Cerrar
            </button>
          </div>
        )}

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden border border-[var(--border-strong)] bg-[var(--surface)] lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.55fr)]">
          <div className="min-w-0 border-b border-[var(--border-strong)] lg:border-r lg:border-b-0">
            <DocumentPanel
              filename={basename(health?.pdf_path ?? null)}
              isUploading={isUploading}
              onUpload={handleUpload}
            />
          </div>
          <ChatPanel
            messages={messages}
            canAsk={Boolean(health?.agent_ready) && !isUploading}
            isAsking={isAsking}
            onAsk={handleAsk}
          />
        </div>
      </main>
    </div>
  )
}
