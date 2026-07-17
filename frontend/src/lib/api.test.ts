import { afterEach, describe, expect, it, vi } from "vitest"

import { askQuestion, getHealth, uploadPdf } from "./api"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("API client", () => {
  it("reads the service health", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", agent_ready: false, pdf_path: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await expect(getHealth()).resolves.toEqual({ status: "ok", agent_ready: false, pdf_path: null })
    expect(fetch).toHaveBeenCalledWith("/health", { signal: undefined })
  })

  it("uploads the PDF as multipart form data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ filename: "guia.pdf", path: "/data/guia.pdf", agent_ready: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const file = new File(["pdf"], "guia.pdf", { type: "application/pdf" })

    await expect(uploadPdf(file)).resolves.toMatchObject({ filename: "guia.pdf", agent_ready: true })
    expect(fetch).toHaveBeenCalledWith(
      "/documents/upload",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    )
  })

  it("surfaces FastAPI error details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "El agente todavia no esta inicializado." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await expect(askQuestion("¿Qué dice?")).rejects.toThrow("El agente todavia no esta inicializado.")
  })
})
