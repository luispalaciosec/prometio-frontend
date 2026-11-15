import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuditoriaPage } from "@/pages/AuditoriaPage"

const apiFetch = vi.hoisted(() => vi.fn())

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  apiFetch,
}))
vi.mock("@/lib/api/perfiles", () => ({ listPerfiles: vi.fn().mockResolvedValue([]) }))

const pedidosAuditoria = () => apiFetch.mock.calls.map(([path]) => String(path)).filter((p) => p.startsWith("/auditoria"))

describe("AuditoriaPage", () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue([])
  })

  it("pide la auditoría una sola vez al montar", async () => {
    render(<AuditoriaPage />)
    await waitFor(() => expect(pedidosAuditoria()).toHaveLength(1))
    // Un tick más: si el efecto se redisparara, aparecería un segundo pedido.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(pedidosAuditoria()).toHaveLength(1)
  })

  it("no pide al tipear; pide una vez al filtrar, con el filtro", async () => {
    render(<AuditoriaPage />)
    await waitFor(() => expect(pedidosAuditoria()).toHaveLength(1))

    fireEvent.change(screen.getByLabelText("Acción"), { target: { value: "oportunidad.desactivar" } })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(pedidosAuditoria()).toHaveLength(1)

    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }))
    await waitFor(() => expect(pedidosAuditoria()).toHaveLength(2))
    expect(pedidosAuditoria()[1]).toContain("accion=oportunidad.desactivar")
  })
})
