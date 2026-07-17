import { describe, expect, it, vi } from "vitest"

import { createId } from "./id"

describe("createId", () => {
  it("uses randomUUID when the browser supports it", () => {
    const randomUUID = vi.fn(() => "native-id")
    const cryptoApi = { randomUUID } as unknown as Crypto

    expect(createId(cryptoApi)).toBe("native-id")
    expect(randomUUID).toHaveBeenCalledOnce()
  })

  it("creates a UUID with getRandomValues when randomUUID is unavailable", () => {
    const getRandomValues = vi.fn((array: Uint8Array) => array.fill(0))
    const cryptoApi = { getRandomValues } as unknown as Crypto

    expect(createId(cryptoApi)).toBe("00000000-0000-4000-8000-000000000000")
    expect(getRandomValues).toHaveBeenCalledOnce()
  })

  it("still creates unique IDs when the Crypto API is unavailable", () => {
    const first = createId(null)
    const second = createId(null)

    expect(first).not.toBe(second)
    expect(first).toMatch(/^message-/)
  })
})
