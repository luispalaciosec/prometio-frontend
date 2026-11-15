import { describe, expect, it } from "vitest"

import { esUrlHttps } from "@/lib/url-https"

describe("esUrlHttps", () => {
  it("acepta https con host", () => {
    expect(esUrlHttps("https://example.com")).toBe(true)
    expect(esUrlHttps("https://hooks.example.com/ruta?x=1")).toBe(true)
    expect(esUrlHttps("  https://example.com  ")).toBe(true)
  })

  it("rechaza http", () => {
    expect(esUrlHttps("http://example.com")).toBe(false)
  })

  it("rechaza esquemas que no son web", () => {
    expect(esUrlHttps("javascript:alert(1)")).toBe(false)
    expect(esUrlHttps("data:text/html,hola")).toBe(false)
    expect(esUrlHttps("ftp://example.com")).toBe(false)
  })

  it("rechaza cadenas vacías y texto que no es una URL absoluta", () => {
    expect(esUrlHttps("")).toBe(false)
    expect(esUrlHttps("   ")).toBe(false)
    expect(esUrlHttps("example.com")).toBe(false)
    expect(esUrlHttps("/ruta/relativa")).toBe(false)
  })

  it("rechaza https sin host", () => {
    expect(esUrlHttps("https://")).toBe(false)
    expect(esUrlHttps("https:// ")).toBe(false)
  })
})
