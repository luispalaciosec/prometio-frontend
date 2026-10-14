# Registro de decisiones

Por qué prometIO funciona como funciona. Cada decisión dice qué se decidió, por qué y cuándo. Antes de cambiar una de
estas reglas, conviene leer su porqué: casi todas nacieron de un problema real o de una alternativa que ya se evaluó y
se descartó.

La fuente original es el registro de arquitectura compartido por los dos repos (`docs/DECISIONS.md`, entradas ADR).
Las decisiones posteriores salen de `CLAUDE.md` del backend, de las migraciones y del historial de commits. Una
decisión no se borra: si se revierte, se agrega una nueva que la reemplaza. Un «—» en la fecha significa que es del
diseño original y no quedó fechada.

Para agregar una decisión: copia el formato de las de abajo, con la fecha, y enlaza la página que la explica.

## Stack e infraestructura

### ADR-001 · Postgres vía Supabase, no MongoDB {#adr-001}

**Qué.** La base de datos es Postgres, gestionada por Supabase.

**Por qué.** El modelo (contacto, empresa, oportunidad, cotización, línea) es relacional de punta a punta, con
integridad referencial real. Y toda la matriz de permisos vive en políticas RLS de Postgres, que Mongo no tiene: habría
que reconstruir el control de acceso en el código. Supabase además trae Auth, Storage y Realtime integrados.

**Cuándo.** —

### ADR-002 · Backend en Railway (US East) {#adr-002}

**Qué.** El backend corre en Railway, región US East. Se descartaron Fly.io (que tiene región en São Paulo) y Render.

**Por qué.** El equipo ya usa Railway y la facturación queda unificada. Para una herramienta interna de pocos usuarios,
la diferencia de latencia hacia Ecuador no se nota.

**Cuándo.** —

### ADR-003 · Frontend en Vercel {#adr-003}

**Qué.** El frontend se publica en Vercel.

**Por qué.** Ya estaba integrado al flujo de trabajo del equipo.

**Cuándo.** —

### ADR-004 · FastAPI más Supabase, arquitectura híbrida {#adr-004}

**Qué.** Supabase resuelve datos, permisos y login. FastAPI (Python) se usa solo donde la lógica es demasiado compleja
para la base: motor de márgenes, IA, webhooks, integraciones y tareas programadas.

**Por qué.** Python es el lenguaje principal del equipo, y así se evita escribir reglas de negocio en PL/pgSQL o en
funciones de borde.

**Cuándo.** — · Ver [Arquitectura](./00-arquitectura.md).

### ADR-006 · Sin GraphQL en v1 {#adr-006}

**Qué.** La API es REST.

**Por qué.** Hay un solo frontend y no hace falta pedir datos con formas distintas por cliente. Se reconsidera solo si
algún día hay una API pública para terceros.

**Cuándo.** —

### ADR-007 · Sin Elixir/Phoenix en v1 {#adr-007}

**Qué.** La bandeja no usa un servicio dedicado de mensajería en tiempo real.

**Por qué.** Es irrelevante a esta escala, el equipo no conoce el lenguaje y frenaría la entrega. Se revisa solo si el
volumen real de conversaciones lo justifica, y como microservicio aislado, no como reescritura.

**Cuándo.** —

### ADR-011 · Dos repos, no monorepo {#adr-011}

**Qué.** `prometio-backend` y `prometio-frontend` son repos independientes.

**Por qué.** Permite trabajar los dos en paralelo sin conflictos de archivos entre los dos hilos de desarrollo. El
contrato entre ambos es el modelo de datos más el OpenAPI.

**Cuándo.** —

### ADR-018 · Construir desde cero {#adr-018}

**Qué.** Los dos repos se construyen desde un scaffolding limpio, sin reutilizar código de otro proyecto. Reemplaza a
la ADR-008, que proponía partir del cotizador hecho para un cliente.

**Por qué.** Razón comercial: el código de un proyecto de cliente no debe terminar dentro de un producto interno. Solo se
conserva conocimiento general de ingeniería (por ejemplo, numerar con una secuencia de Postgres y no contando filas).

**Cuándo.** —

## Integraciones

### ADR-005 · Email con Resend, no Brevo {#adr-005}

**Qué.** Resend es la infraestructura de email. El receptor de sus webhooks vive en el backend, no en una función de
Supabase.

**Por qué.** Brevo trae su propia interfaz de campañas, y usarla rompería el principio de tener todo centralizado; usarlo
solo como API perdería su única ventaja. Resend es simple de integrar.

**Cuándo.** —

### Las campañas se envían desde Resend, no desde prometIO

**Qué.** No hay una pantalla propia para componer ni enviar campañas. Marketing las arma en el panel de Resend.
prometIO solo recibe las estadísticas y las bajas por webhook, y ofrece un enlace al panel.

**Por qué.** El panel de Resend ya resuelve bien editor, audiencias y envío. Reconstruirlo habría sido el trabajo más
grande de la fase para obtener algo peor. Lo que sí cruza con datos propios (las bajas de marketing de cada contacto)
se queda en prometIO.

**Cuándo.** 23/08/2026.

### ADR-009 · WhatsApp vía Jelou {#adr-009}

**Qué.** WhatsApp y Messenger entran por Jelou, un proveedor ecuatoriano, hacia un webhook propio. Instagram Direct
necesita una integración aparte con Meta, porque Jelou no la documenta.

**Por qué.** El equipo ya había trabajado con Jelou con buen resultado. Lo de Instagram se verificó contra la
documentación oficial de Jelou, no contra su material comercial.

**Cuándo.** — · Estado: la conexión con canales reales no está construida. Ver [Roadmap](./roadmap.md).

### ADR-010 · Facturación electrónica con Contífico {#adr-010}

**Qué.** Contífico es el sistema de facturación electrónica. Por ahora prometIO solo consulta: facturas emitidas e
historial de precios. La emisión de facturas desde prometIO quedó diferida, no cancelada.

**Por qué.** La consulta da valor inmediato (precios de referencia al cotizar, facturación real en los tableros) sin
tocar documentos tributarios. Al revisar la API se confirmó que Contífico no calcula el IVA: lo manda quien emite. Por
eso la tasa de Configuración sigue siendo la fuente de verdad hasta el final.

**Cuándo.** — · La consulta se pasó a la versión 2 de su API el 02/09/2026.

### Conectores de IA para ChatGPT y Gemini: OAuth por usuario o nada

**Qué.** Si se construyen, será con OAuth por usuario reutilizando el login existente. Se descartaron una clave de API
compartida y una clave personal por vendedor, incluso como puente temporal.

**Por qué.** Una clave compartida no sabe quién pregunta y terminaría corriendo con alcance de admin. Una clave por
persona deja accesos dispersos, sin revocación central. Además se espera que esos conectores pidan escritura, lo que
hace obligatorio saber quién hace cada llamada.

**Cuándo.** 24/08/2026 · Estado: no construido, «Próximamente» en la pantalla de Conectores.

### El servidor MCP es de solo lectura y usa la identidad del usuario

**Qué.** El servidor MCP expone herramientas de lectura sobre el pipeline y las actividades, atado a un usuario real,
con exactamente el mismo alcance que ese usuario tiene en la API. No hay cuenta de servicio ni modo «ver como».
Desde el 13/10/2026 el MCP es un cliente HTTP de la API que usa el token del usuario.

**Por qué.** Agregar escritura con un token de larga duración sería una superficie de riesgo muy distinta. Antes de
escribir hay que resolver autenticación por llamada.

**Cuándo.** Agosto de 2026, con el cambio a cliente HTTP el 13/10/2026.

### Basecamp: conexión por vendedor, el intercambio de código en el backend

**Qué.** Cada vendedor conecta su cuenta de Basecamp para mostrar su nombre y su foto. El código que devuelve Basecamp
se intercambia por el token en el backend. No se sincronizan tareas ni proyectos.

**Por qué.** A diferencia de Google, donde Supabase hace el intercambio, en Basecamp el frontend tendría que conocer el
secreto de la aplicación, y quedaría expuesto en el código del navegador. Sincronizar tareas no es el rol de este
sistema.

**Cuándo.** 27/08/2026.

### Conversiones del formulario: Meta deduplicado, GA4 solo desde el servidor

**Qué.** Un lead del formulario se registra en Meta desde el navegador y desde el servidor, deduplicado por un id de
evento compartido. En GA4 la conversión sale solo del servidor; el navegador solo carga la etiqueta base y manda su id
de cliente para atribuir la sesión.

**Por qué.** Meta deduplica de forma confiable por id de evento. GA4 no lo garantiza para un evento genérico como
`generate_lead`, así que disparar desde los dos lados contaría cada lead dos veces.

**Cuándo.** 03/09/2026. Google Ads quedó en pausa por decisión explícita ese mismo día, con el diseño ya aprobado.

## Modelo de datos y negocio

### ADR-012 · Un solo contacto, sin tabla de leads {#adr-012}

**Qué.** Contacto, lead y cliente son valores de `contacto.etapa_ciclo_vida`.

**Por qué.** Separar contacto y lead duplicaría datos y crearía errores de sincronización. Es la misma solución que usan
los CRM grandes.

**Cuándo.** — · Ver [Glosario](./glosario.md).

### ADR-013 · Oportunidad y cuenta contrato son objetos separados {#adr-013}

**Qué.** La oportunidad es el ciclo de venta. La cuenta contrato es la ficha que vive después del cierre ganado: fase
escrita a mano y un enlace a Basecamp.

**Por qué.** La agencia vende servicios con retainers y necesita algo que viva después del cierre sin forzarlo dentro
del objeto de venta. Límite explícito: no es gestión de proyectos.

**Cuándo.** —

### ADR-014 · Campos personalizados en JSONB {#adr-014}

**Qué.** Cada tabla principal tiene una columna `propiedades_custom` en vez de un modelo de propiedades dinámicas.

**Por qué.** Da casi toda la flexibilidad con una fracción del trabajo.

**Cuándo.** —

### ADR-015 · Costeo interno por rol, no por persona {#adr-015}

**Qué.** Las tarifas internas son por rol (por ejemplo, «Diseñador Jr»), nunca por persona.

**Por qué.** Evita exponer sueldos individuales en una herramienta que usan varios vendedores. Es además el estándar de
costeo en agencias.

**Cuándo.** —

### ADR-016 · Motor de márgenes de tres capas {#adr-016}

**Qué.** Costo del proveedor, más margen de agencia (editable), más comisión de agencia (negociable, calculada sobre el
precio con margen), más impuesto (parametrizado). La cotización pasa a aprobación si el descuento total supera el
umbral o si se baja la comisión de un servicio de fee por debajo del mínimo.

**Por qué.** Es como cotiza la agencia. La segunda condición existe porque la comisión es una capa chica: bajarla en un
servicio recurrente casi nunca cruza el umbral de descuento por sí sola, y sin esa regla pasaría sin control.

**Cuándo.** — · Ver [Cotizaciones](./03-cotizaciones.md).

### ADR-017 · Transiciones de etapa con condiciones fijas {#adr-017}

**Qué.** Las transiciones automáticas de etapa se configuran con un set fijo de condiciones, no con un motor de reglas
libre.

**Por qué.** Un motor de reglas libre es un proyecto en sí mismo.

**Cuándo.** — · Estado: no se encontró una implementación en el código. Por confirmar.

### ADR-019 · Equipo de proveedores {#adr-019}

**Qué.** Un quinto equipo, `proveedores`, que solo gestiona proveedores.

**Por qué.** Una marca sobre `administrativo` dejaría a ese perfil pasando todas las verificaciones de admin y obligaría
a excluirlo endpoint por endpoint. Un equipo nuevo queda bloqueado de todo por defecto.

**Cuándo.** 01/09/2026 · Ver [Roles y permisos](./01-roles-permisos.md).

### ADR-020 · Lead score con reglas, no con IA {#adr-020}

**Qué.** El puntaje de cada oportunidad (0 a 100) sale de cinco componentes con peso fijo y se muestra con su desglose.

**Por qué.** No hay historial suficiente para entrenar un modelo, y un puntaje de IA inventaría precisión. Con reglas,
cada punto se puede auditar y ajustar.

**Cuándo.** 01/09/2026 · Ver [Pipeline](./02-pipeline.md).

### Alertas y SLA se calculan en vivo

**Qué.** Las alertas de estancamiento se calculan al consultarlas, sin tabla propia. Si algún día se construye el SLA
de la bandeja, seguirá el mismo criterio, no una columna guardada.

**Por qué.** Una fecha límite guardada hay que recalcularla cada vez que algo cambia, y eso se desincroniza.

**Cuándo.** 24/08/2026 (criterio para el SLA).

### El documento de alcance no lleva precios

**Qué.** La IA redacta el borrador del documento de alcance a partir de los servicios de la cotización, sin leer
costos, márgenes ni totales. La exigencia de tener un documento aprobado antes de enviar la cotización nace desactivada
y se guarda por cotización al crearla, nunca de forma retroactiva.

**Por qué.** El documento complementa a la cotización, no la reemplaza. Que el modelo no vea precios elimina el riesgo
de que los ponga. La sección de casos de éxito la escribe una persona, para que la IA no invente clientes.

**Cuándo.** 29/08/2026 · Ver [Documento de alcance](./04-documento-alcance.md).

### Líneas a medida y precio manual

**Qué.** Una línea de cotización puede no venir del catálogo: lleva descripción, precio y una categoría obligatoria. Y
una línea puede llevar un precio manual con su justificación, sin pasar por aprobación.

**Por qué.** Obligar a crear un servicio de catálogo por cada trabajo a medida o cada variación de precio llenaba el
catálogo de entradas falsas. La categoría obligatoria mantiene la clasificación comercial.

**Cuándo.** 22/09/2026 · Ver [Cotizaciones](./03-cotizaciones.md).

### Un solo vocabulario de categorías, agrupado en pilares

**Qué.** La oportunidad registra una categoría de interés usando la misma tabla de categorías que el catálogo de
servicios. Cada categoría pertenece a un pilar: marca, crecimiento, transformación o transversal.

**Por qué.** Registrar una oportunidad no debería exigir elegir un servicio completo. Usar la misma tabla evita dos
taxonomías que se desalinean con el tiempo.

**Cuándo.** Categoría de interés entre el 17 y el 22/09/2026; pilar por categoría el 23/09/2026.

### Los montos se muestran sin IVA

**Qué.** El valor cotizado de una oportunidad, los tableros y las cotizaciones en pantalla usan el subtotal sin IVA. El
IVA se aplica una sola vez, sobre el subtotal.

**Por qué.** El valor cotizado se guardaba con IVA y los tableros sumaban montos con y sin impuesto mezclados. Se
corrigió y se recalcularon las oportunidades existentes. Ese mismo día se probó presentar como subtotal el monto ya con
IVA y sumarle otro IVA encima; se revirtió horas después.

**Cuándo.** 01/10/2026.

### La meta de agencia se mide con facturación real

**Qué.** El avance «Cerrado» de la meta total de la agencia suma las facturas emitidas en Contífico del periodo, sin
IVA. La meta de cada vendedor sigue usando sus oportunidades ganadas.

**Por qué.** El cierre real no siempre se refleja moviendo la oportunidad en el pipeline, y la meta mostraba cero con
facturas ya emitidas. Hoy no hay forma de atribuir una factura a un vendedor, así que el cálculo individual no cambia.

**Cuándo.** 01/10/2026 · Ver [Dashboard](./06-dashboard.md).

### Estados por facturar y facturado

**Qué.** Después de `aprobada`, una cotización puede pasar a `por_facturar` (aceptada, pero todavía no se puede
facturar) y a `facturado` (con número de factura obligatorio). Las dos cuentan como negocio ganado. El dashboard suma lo
que está por facturar.

**Por qué.** Entre que el cliente acepta y se emite la factura puede pasar tiempo (orden de compra pendiente, día de
corte de la empresa) y ese dinero no se veía en ningún lado.

**Cuándo.** 13/10/2026 · Ver [Cotizaciones](./03-cotizaciones.md).

### ADR-023 · Contratos de fee recurrente {#adr-023}

**Qué.** Tablas propias para contratos con fecha de inicio y fin y sus líneas mensuales. Los periodos no tienen tabla:
cada mes es una cotización del contrato, y un índice único impide generar dos veces el mismo mes. La cotización mensual
nace en `por_facturar`, porque el contrato ya es la aprobación del cliente. Un cron externo dispara la generación el
primer día de cada mes.

**Por qué.** La cuenta contrato no tiene empresa ni fechas, y es otro concepto. Nacer en `por_facturar` evita que cada
mes dispare el webhook de cotización aprobada o pise el valor de la oportunidad. Todo va sin IVA y sin prorrateo de
meses parciales.

**Cuándo.** 13/10/2026 · Ver [Contratos y facturación](./05-contratos-facturacion.md).

## Interfaz y forma de trabajo

### ADR-021 · Modo TV sin backend nuevo {#adr-021}

**Qué.** La pantalla de la sala comercial reutiliza los datos del dashboard y se autentica con una cuenta real
dedicada, logueada una vez en el navegador en modo kiosco. Se refresca por consulta periódica.

**Por qué.** Un token de larga duración propio sería un secreto permanente en un televisor de sala. Una identidad real
mantiene el mismo criterio que el MCP: nada de credenciales compartidas sin dueño.

**Cuándo.** 01/09/2026.

### ADR-022 · Interfaz inspirada en Stripe; la marca solo en los entregables {#adr-022}

**Qué.** Dos capas de colores. La aplicación usa sus propios tokens (canvas claro, primario índigo, sidebar claro,
botones en píldora). Los colores de la organización alimentan solo lo que ve el cliente: PDF de cotización, documentos
y formulario web. El logo siempre viene de la organización.

**Por qué.** El CRM necesita consistencia de producto. Los clientes esperan los colores de la marca en sus
cotizaciones, no en cada botón del pipeline.

**Cuándo.** 17/09/2026 · Ver [Sistema de diseño](./19-sistema-diseno.md).

### El frontend pasa de Cursor a Claude Code

**Qué.** Desde el 13/10/2026 el frontend se desarrolla con Claude Code, igual que el backend. Las convenciones que
vivían en las reglas de Cursor pasaron al `CLAUDE.md` del repo.

**Por qué.** Unificar la herramienta en los dos repos. La separación de repos (ADR-011) se mantiene.

**Cuándo.** 13/10/2026.

### Endurecimiento de seguridad

**Qué.** Una pasada de seguridad sobre los dos repos. Entre otros cambios: un usuario desactivado pierde el acceso al
instante, nadie puede cambiar su propio rol, los endpoints públicos y costosos tienen límite de tasa, y el frontend
maneja las respuestas nuevas (429, 409 y 403 de cuenta desactivada).

**Por qué.** Una revisión encontró huecos concretos, como que un perfil podía modificar sus propias columnas de permisos
llamando directo a la base.

**Cuándo.** 13/10/2026 · Ver [Endurecimiento](./endurecimiento.md).
