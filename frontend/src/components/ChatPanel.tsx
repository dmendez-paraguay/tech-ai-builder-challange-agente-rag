import { ArrowUp, BookOpen, FileQuestion, LoaderCircle, Sparkles } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

interface ChatPanelProps {
  messages: ChatMessage[]
  canAsk: boolean
  isAsking: boolean
  onAsk: (question: string) => Promise<void>
}

const SUGGESTIONS = [
  "¿Cuál es el tema principal?",
  "Resumí los puntos más importantes",
  "¿Qué conclusiones presenta?",
]

export function ChatPanel({ messages, canAsk, isAsking, onAsk }: ChatPanelProps) {
  const [question, setQuestion] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isAsking])

  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    const value = question.trim()
    if (!value || !canAsk || isAsking) return
    setQuestion("")
    await onAsk(value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setQuestion(suggestion)
  }

  return (
    <section className="flex min-w-0 min-h-[38rem] flex-col lg:h-[calc(100vh-9.5rem)] lg:min-h-[42rem]" aria-labelledby="chat-title">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5 sm:px-7">
        <div>
          <p className="eyebrow">Consulta</p>
          <h2 id="chat-title" className="mt-1 text-lg font-semibold tracking-[-0.02em]">
            Conversación
          </h2>
        </div>
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
          RAG · top 4
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
            <div className="grid size-14 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-subtle)]">
              <FileQuestion className="size-6 text-[var(--accent)]" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.025em]">
              {canAsk ? "Preguntale al documento" : "Cargá un PDF para comenzar"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--ink-muted)]">
              {canAsk
                ? "La respuesta se construirá con los fragmentos más relevantes y mostrará las páginas consultadas."
                : "Cuando termine la indexación vas a poder consultar su contenido desde acá."}
            </p>

            {canAsk && (
              <div className="mt-7 flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="min-h-10 rounded-full border border-[var(--border)] px-4 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {messages.map((message) => (
              <article
                key={message.id}
                className={cn("flex gap-3 sm:gap-4", message.role === "user" && "justify-end")}
              >
                {message.role === "assistant" && (
                  <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white">
                    <Sparkles className="size-4" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[88%] text-sm leading-7 sm:max-w-[82%]",
                    message.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-[var(--ink)] px-4 py-3 text-[var(--paper)]"
                      : "min-w-0 pt-1 text-[var(--ink)]",
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose-rag">
                      <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 border-t border-[var(--border)] pt-3">
                      <p className="mb-2 flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                        <BookOpen className="size-3.5" aria-hidden="true" />
                        Fuentes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.sources.map((source) => (
                          <span
                            key={source}
                            className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1 font-mono text-[0.68rem] text-[var(--ink-muted)]"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}

            {isAsking && (
              <div className="flex items-center gap-4 text-sm text-[var(--ink-muted)]">
                <div className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-white">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                </div>
                Buscando en el documento…
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form className="border-t border-[var(--border)] p-4 sm:p-5" onSubmit={submit}>
        <div className="flex items-end gap-2 border border-[var(--border-strong)] bg-[var(--surface)] p-2 focus-within:ring-2 focus-within:ring-[var(--focus)]">
          <label htmlFor="question" className="sr-only">
            Pregunta sobre el documento
          </label>
          <textarea
            id="question"
            rows={1}
            className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-6 outline-none placeholder:text-[var(--ink-faint)] disabled:cursor-not-allowed"
            placeholder={canAsk ? "Escribí una pregunta…" : "Cargá un PDF para habilitar las consultas"}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canAsk || isAsking}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!question.trim() || !canAsk || isAsking}
            aria-label="Enviar pregunta"
          >
            {isAsking ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </Button>
        </div>
        <p className="mt-2 text-center text-[0.68rem] text-[var(--ink-faint)]">
          Enter para enviar · Shift + Enter para una nueva línea
        </p>
      </form>
    </section>
  )
}
