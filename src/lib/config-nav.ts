export type ConfigNavItem = {
  to: string
  label: string
  body: string
}

export type ConfigNavGroup = {
  title: string
  items: ConfigNavItem[]
}

export const CONFIG_NAV_GROUPS: ConfigNavGroup[] = [
  {
    title: "Catálogo y precios",
    items: [
      {
        to: "/configuracion/servicios",
        label: "Servicios",
        body: "Catálogo y wizard de creación (borrador → activo).",
      },
      {
        to: "/configuracion/tarifas-internas",
        label: "Tarifas internas",
        body: "Costo/hora por rol. Nunca por persona.",
      },
      {
        to: "/configuracion/tipos-documento",
        label: "Tipos de documento",
        body: "Catálogo abierto asociado a cada servicio.",
      },
    ],
  },
  {
    title: "Reglas de negocio",
    items: [
      {
        to: "/configuracion/etapas",
        label: "Etapas y alertas",
        body: "probabilidad_cierre_default_pct, umbral_alerta_horas y multiplicador_escalamiento_supervisor.",
      },
      {
        to: "/configuracion/margenes",
        label: "Márgenes e impuestos",
        body: "margen_agencia_default_pct, comisión de agencia (rango) y tasa_impuesto_pct.",
      },
      {
        to: "/configuracion/causas-perdida",
        label: "Causas de pérdida",
        body: "Catálogo usado en Cierre Perdido.",
      },
    ],
  },
  {
    title: "Marca e integraciones",
    items: [
      {
        to: "/configuracion/marca",
        label: "Marca",
        body: "Logo y paleta de prometIO. Subida real pendiente — por ahora asset fijo.",
      },
      {
        to: "/configuracion/conectores",
        label: "Conectores",
        body: "Claude, OpenAI y Gemini. Sin conexión activa todavía.",
      },
      {
        to: "/configuracion/formulario-web",
        label: "Formulario web",
        body: "Snippet embebible para landings. POST /formulario.",
      },
    ],
  },
]
