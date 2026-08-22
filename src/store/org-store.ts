import { create } from "zustand"

import type { Organizacion } from "@/types/organizacion"

type OrgState = {
  organizacion: Organizacion | null
  setOrganizacion: (organizacion: Organizacion | null) => void
}

export const useOrgStore = create<OrgState>((set) => ({
  organizacion: null,
  setOrganizacion: (organizacion) => set({ organizacion }),
}))
