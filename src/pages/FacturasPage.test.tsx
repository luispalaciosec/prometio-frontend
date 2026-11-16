import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FacturasPage } from "@/pages/FacturasPage"
import type { FacturaContifico } from "@/types/factura"

const apiFetch = vi.hoisted(() => vi.fn())

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  apiFetch,
}))

function factura(n: number): FacturaContifico {
  return {
    numero: `001-001-${String(n).padStart(9, "0")}`,
    fecha_emision: "2026-11-02",
    cliente: `Cliente ${n}`,
    cliente_ruc: `179000000${n}`,
    resumen_productos: null,
    total: 112,
    subtotal: 100,
    anulado: false,
    url_ride: null,
    url_xml: null,
  }
}

/** Solo los pedidos de la lista, no el resumen ni los clientes de medios. */
const pedidosLista = () =>
  apiFetch.mock.calls.map(([path]) => String(path)).filter((p) => p.startsWith("/facturas?"))

const offsetDe = (path: string) => new URLSearchParams(path.split("?")[1]).get("offset")

describe("FacturasPage: paginación y filtros", () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockImplementation((path: string) => {
      if (path.startsWith("/facturas/resumen")) {
        return new Promise(() => {}) // el resumen no importa aquí: queda cargando
      }
      if (path.startsWith("/facturas?")) {
        return Promise.resolve({
          cuenta_verificada: true,
          truncado: false,
          total: 60,
          resultados: Array.from({ length: 25 }, (_, i) => factura(i + 1)),
        })
      }
      return Promise.resolve([])
    })
  })

  it("pide la lista una sola vez al montar", async () => {
    render(<FacturasPage />)
    await waitFor(() => expect(pedidosLista()).toHaveLength(1))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(pedidosLista()).toHaveLength(1)
    expect(offsetDe(pedidosLista()[0])).toBe("0")
  })

  it("al cambiar el orden desde la página 2 pide una sola vez, ya en la página 1", async () => {
    render(<FacturasPage />)
    await screen.findByText("Cliente 1")

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    await waitFor(() => expect(pedidosLista()).toHaveLength(2))
    expect(offsetDe(pedidosLista()[1])).toBe("25")
    await screen.findByText("Cliente 1")

    fireEvent.click(screen.getByRole("button", { name: /Cliente/ }))
    await waitFor(() => expect(pedidosLista()).toHaveLength(3))
    await new Promise((resolve) => setTimeout(resolve, 50))
    // Antes del arreglo había un cuarto pedido: el efecto ponía offset en 0 y eso lo volvía a disparar.
    expect(pedidosLista()).toHaveLength(3)
    expect(offsetDe(pedidosLista()[2])).toBe("0")
    expect(pedidosLista()[2]).toContain("orden_por=cliente")
  })
})
