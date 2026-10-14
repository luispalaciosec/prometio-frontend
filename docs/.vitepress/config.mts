import { defineConfig } from "vitepress"
import { withMermaid } from "vitepress-plugin-mermaid"

// Sitio de documentación de prometIO. Los .md de esta carpeta son la fuente: se editan aquí y el sitio solo los
// presenta. Local: `npm run docs:dev`. En producción se publica dentro del frontend en prometio.vercel.app/docs:
// `npm run build` compila la app y después este sitio en dist/docs.
export default withMermaid(
  defineConfig({
    lang: "es-EC",
    title: "prometIO",
    description: "Documentación de prometIO · CRM de Geeks Ecuador",
    base: "/docs/",
    outDir: "../dist/docs",
    cleanUrls: false,
    lastUpdated: true,
    // README.md es el índice para quien navega el repo; los HTML del manual se generan aparte.
    srcExclude: ["README.md", "manual-*.html"],
    head: [
      ["link", { rel: "icon", href: "/docs/prometio-icon.svg" }],
      ["meta", { name: "robots", content: "noindex, nofollow" }],
    ],
    themeConfig: {
      logo: "/prometio-icon.svg",
      nav: [
        { text: "Empezar", link: "/empezar" },
        { text: "Cómo funciona", link: "/00-arquitectura" },
        { text: "Operación", link: "/operacion" },
        { text: "Referencia", link: "/15-arquitectura-frontend" },
      ],
      sidebar: [
        {
          text: "Inicio",
          items: [
            { text: "Por dónde empezar", link: "/empezar" },
            { text: "Glosario", link: "/glosario" },
          ],
        },
        {
          text: "Cómo funciona prometIO",
          items: [
            { text: "Arquitectura y reglas", link: "/00-arquitectura" },
            { text: "Roles y permisos", link: "/01-roles-permisos" },
            { text: "Pipeline y oportunidades", link: "/02-pipeline" },
            { text: "Cotizaciones y motor de márgenes", link: "/03-cotizaciones" },
            { text: "Documento de alcance", link: "/04-documento-alcance" },
            { text: "Contratos de fee y facturación", link: "/05-contratos-facturacion" },
            { text: "Dashboard, metas y forecast", link: "/06-dashboard" },
            { text: "Bandeja y formulario web", link: "/07-bandeja-formulario" },
            { text: "Prospección en LinkedIn", link: "/08-prospeccion-linkedin" },
            { text: "Servicios y configuración", link: "/09-servicios-configuracion" },
            { text: "Agenda y seguimiento", link: "/10-agenda" },
            { text: "Integraciones", link: "/11-integraciones" },
          ],
        },
        {
          text: "Operación",
          items: [
            { text: "Operar prometIO: cuando algo falla", link: "/operacion" },
            { text: "Levantar el proyecto en local", link: "/12-setup" },
            { text: "Despliegue", link: "/13-despliegue" },
            { text: "Seguridad", link: "/14-seguridad" },
          ],
        },
        {
          text: "Referencia técnica",
          items: [
            { text: "Arquitectura del frontend", link: "/15-arquitectura-frontend" },
            { text: "Arquitectura del backend", link: "/16-arquitectura-backend" },
            { text: "Modelo de datos", link: "/17-modelo-datos" },
            { text: "API REST", link: "/18-api" },
            { text: "Sistema de diseño", link: "/19-sistema-diseno" },
          ],
        },
        { text: "Decisiones", items: [{ text: "Registro de decisiones", link: "/decisiones" }] },
        {
          text: "Historia",
          collapsed: true,
          items: [
            { text: "Roadmap por fases", link: "/roadmap" },
            { text: "Guía de UI original", link: "/UI_GUIDE" },
            { text: "Endurecimiento tras la auditoría del 10/10", link: "/endurecimiento" },
          ],
        },
      ],
      outline: { level: [2, 3], label: "En esta página" },
      docFooter: { prev: "Anterior", next: "Siguiente" },
      lastUpdated: { text: "Actualizado" },
      returnToTopLabel: "Volver arriba",
      sidebarMenuLabel: "Menú",
      darkModeSwitchLabel: "Tema",
      search: {
        provider: "local",
        options: {
          translations: {
            button: { buttonText: "Buscar", buttonAriaLabel: "Buscar" },
            modal: {
              noResultsText: "Sin resultados para",
              resetButtonTitle: "Limpiar",
              footer: { selectText: "abrir", navigateText: "moverse", closeText: "cerrar" },
            },
          },
        },
      },
      notFound: {
        title: "Página no encontrada",
        quote: "Puede que se haya movido. Usa el buscador o vuelve al inicio.",
        linkText: "Ir al inicio",
      },
    },
    mermaid: { theme: "neutral" },
    vite: { optimizeDeps: { include: ["mermaid"] } },
  }),
)
