# Roadmap

::: warning Documento histórico
La primera parte es el plan de fases original de prometIO (agosto y septiembre de 2026). Sirve de contexto para
entender en qué orden se construyó y por qué; no describe el estado actual. Lo vigente está en
[Dónde estamos](#donde-estamos), al final de esta página, y en el [registro de decisiones](./decisiones.md).
:::

## El criterio del orden

No se construyó todo a la vez. Primero lo que genera valor comercial inmediato (pipeline, cotizaciones, agenda),
después lo que depende de servicios externos (canales de mensajería, facturación, email) y al final lo más incierto
(IA avanzada, seguimiento continuo de SEO, cruce con inversión publicitaria).

## El plan original

| Fase | Alcance | Notas del plan |
|---|---|---|
| **0 · Fundaciones** | Repos, proyecto Supabase con el modelo completo y RLS, organización con logo y colores, login con email y Google, roles, contactos y empresas, importación por CSV, primer despliegue | Secuencial, revisada antes de seguir: todo lo demás depende de esto |
| **1 · MVP de ventas** | Pipeline de nueve etapas, catálogo de servicios con asistente y tarifas internas, cotizaciones con motor de márgenes y PDF, actividades con Google Calendar y Meet, alertas de estancamiento, KPIs y dashboard, panel de configuración | Marcada como completa en el plan |
| **2 · Marketing y bandeja** | Conversaciones y conversión manual a contacto, CRUD de contactos, formulario web embebible, enriquecimiento de empresas, consulta a Contífico, webhooks de Resend, SEO técnico, bandeja unificada, Basecamp | La bandeja quedaba con backend listo y sin canales reales |
| **3 · Inteligencia** | Transcripción de llamadas, copiloto de llamadas, redacción asistida de documentos, lead score, seguimiento de SEO, cruce de inversión en anuncios con pipeline, conversiones de Meta y Google Ads, modo TV, Zapier | Mezcla de cosas hechas, aprobadas sin construir y en pausa |
| **4 · Escalar** | Instancia para otra organización, app móvil, motor de reglas de automatización completo, servicio dedicado para la bandeja, integración más profunda con Basecamp | Futuro, no comprometido |

Durante la Fase 1 se sumaron piezas que no estaban en el plan: el servidor MCP de solo lectura, la pantalla de
conectores de IA, metas comerciales, el timeline del equipo, la asignación automática de leads, el calendario, la
pantalla de Resumen, la auditoría, la salud del sistema, los cumpleaños y el rediseño del PDF de cotización.

### Huecos que el plan dejó anotados

- **Fees y cantidad.** En una línea de un servicio de fee, la cantidad multiplica el total, pero no se valida contra la
  duración mínima del servicio. Quedó por decidir si se agrega una validación o si es responsabilidad de quien cotiza.
- **SLA de la bandeja.** La columna `sla_limite` existe pero nada la escribe. Si se construye, será un cálculo en vivo,
  no una columna (ver [decisiones](./decisiones.md)).
- **Supuestos a validar.** Si Jelou cubría Instagram y Messenger (resuelto: cubre Messenger, no Instagram) y la tasa
  de IVA por defecto (resuelto: 15 %).

## Dónde estamos {#donde-estamos}

> Revisado contra las rutas del frontend (`src/App.tsx`) y los routers del backend el 13/10/2026.

### Construido y en uso

| Área | Qué hay | Página |
|---|---|---|
| Inicio | Bienvenida con sugerencias de IA, Resumen con series diarias, Cumpleaños | [Dashboard](./06-dashboard.md) |
| CRM | Contactos, empresas con enriquecimiento automático | [Pipeline](./02-pipeline.md) |
| Pipeline | Kanban de nueve etapas, lead score, alertas, reasignación | [Pipeline](./02-pipeline.md) |
| Cotizaciones | Motor de márgenes, versiones, aprobación, PDF interno y de cliente, estados por facturar y facturado | [Cotizaciones](./03-cotizaciones.md) |
| Documento de alcance | Borrador con IA, aprobación, PDF | [Documento de alcance](./04-documento-alcance.md) |
| Contratos | Contratos de fee recurrente, renovaciones, proyección, generación mensual | [Contratos y facturación](./05-contratos-facturacion.md) |
| Facturas | Consulta de facturas de Contífico | [Contratos y facturación](./05-contratos-facturacion.md) |
| Tableros | Dashboard, metas comerciales, modo TV | [Dashboard](./06-dashboard.md) |
| Agenda | Actividades, calendario, timeline, Google Calendar y Meet | [Agenda](./10-agenda.md) |
| Bandeja | Pantalla de conversaciones con reclamar, reasignar, cerrar y convertir a contacto | [Bandeja y formulario](./07-bandeja-formulario.md) |
| Formulario web | Widget embebible, conversiones a Meta y GA4 | [Bandeja y formulario](./07-bandeja-formulario.md) |
| Prospección | Búsqueda de leads en LinkedIn, rendimiento, criterios | [Prospección LinkedIn](./08-prospeccion-linkedin.md) |
| Proveedores | Gestión de proveedores y el equipo `proveedores` | [Roles y permisos](./01-roles-permisos.md) |
| Marketing | SEO técnico y Core Web Vitals | [Integraciones](./11-integraciones.md) |
| Administración | Configuración (servicios, categorías, tarifas, causas de pérdida, tipos de documento, etapas, márgenes, meta, conectores, formulario, marca), usuarios, salud, auditoría | [Servicios y configuración](./09-servicios-configuracion.md) |

### Pendiente o en pausa

| Pieza | Estado |
|---|---|
| Canales reales de la bandeja (WhatsApp y Messenger por Jelou, Instagram por Meta, chat web) | No construidos. La pantalla existe, pero no hay conversaciones entrando desde un canal |
| Emisión de facturas en Contífico | Diferida. Solo se consulta |
| Google Ads (conversiones) | En pausa por decisión explícita desde el 03/09/2026, con el diseño aprobado |
| Conectores de ChatGPT y Gemini | Decididos (OAuth por usuario), sin construir |
| Transcripción y copiloto de llamadas | Sin construir |
| Seguimiento de SEO (palabras clave, brechas, enlaces) | Sin construir |
| Cruce de inversión en anuncios con el pipeline | Sin construir |
| Zapier | Sin construir. Existen webhooks salientes para cuatro eventos: contacto creado desde el formulario, empresa creada, empresa actualizada y cotización aprobada |
| Transiciones automáticas de etapa | Por confirmar: no se encontró en el código |
| Importación de contactos por CSV | Por confirmar: no se encontró en el código |
| Fase 4 completa | Sin compromiso |
