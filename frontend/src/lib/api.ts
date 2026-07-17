export interface HealthResponse {
  status: string
  agent_ready: boolean
  pdf_path: string | null
}

export interface UploadResponse {
  filename: string
  path: string
  agent_ready: boolean
}

export interface AnswerResponse {
  answer: string
  sources: string[]
  low_relevance: boolean
}

interface ApiErrorBody {
  detail?: string
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>
  }

  let message = `La solicitud falló (${response.status}).`
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body.detail) message = body.detail
  } catch {
    // La respuesta no siempre contiene JSON válido.
  }

  throw new Error(message)
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch("/health", { signal })
  return parseResponse<HealthResponse>(response)
}

export async function uploadPdf(file: File): Promise<UploadResponse> {
  const body = new FormData()
  body.append("file", file)

  const response = await fetch("/documents/upload", {
    method: "POST",
    body,
  })
  return parseResponse<UploadResponse>(response)
}

export async function askQuestion(question: string): Promise<AnswerResponse> {
  const response = await fetch("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  })
  return parseResponse<AnswerResponse>(response)
}
