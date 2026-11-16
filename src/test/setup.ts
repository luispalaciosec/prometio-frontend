import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Sin los globales de Vitest, Testing Library no desmonta solo entre tests.
afterEach(() => {
  cleanup()
})
