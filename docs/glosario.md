# Glosario

Las palabras del dominio tal como se usan en prometIO, en orden alfabético. Entre paréntesis, el nombre técnico
cuando difiere del que ves en la pantalla.

> Revisado contra el código el 13/10/2026.

**Actividad** (`actividad`). Una interacción con un cliente o una tarea propia: llamada, WhatsApp, visita,
videollamada, email o tarea interna. Puede estar programada (`programada_para`) y luego reportada
(`reportada_en`, con feedback). Si el vendedor conectó su Google Calendar, la actividad se sincroniza como evento y la
videollamada recibe un enlace de Meet. Ver [Agenda](./10-agenda.md).

**Alerta de estancamiento.** Aviso que aparece cuando una oportunidad lleva en su etapa más tiempo que el umbral de esa
etapa (en horas, configurable). Al superar el umbral multiplicado por el multiplicador de escalamiento (2 por defecto),
la alerta escala al supervisor. Se calcula en vivo, no se guarda en una tabla.

**Bandeja** (`conversacion` + `mensaje`). La lista de conversaciones que entran por un canal (WhatsApp, Instagram,
Messenger o chat web). Una conversación se puede reclamar, reasignar, cerrar y reabrir. Ver
[Bandeja y formulario](./07-bandeja-formulario.md).

**Categoría de servicio** (`categoria_servicio`). La clasificación comercial de lo que se vende. Es el mismo
vocabulario para tres cosas: el servicio del catálogo, la categoría de interés de una oportunidad y la línea de
cotización a medida. Cada categoría pertenece a un pilar.

**Categoría de interés** (`oportunidad.categoria_interes_id`). Qué busca el cliente, registrado en la oportunidad sin
tener que elegir todavía un servicio del catálogo. Se precarga como categoría al agregar una línea a medida en la
cotización.

**Causa de pérdida** (`causa_perdida`). Catálogo editable de motivos por los que se pierde un negocio. Al pasar a
Cierre Perdido se elige una principal y, opcionalmente, una secundaria. Si la causa es «Competencia», se puede anotar
el competidor.

**Cliente.** Una de las tres etapas de ciclo de vida de un contacto. No es una tabla aparte.

**Cliente de medios** (`cliente_medios`). Un cliente, identificado por RUC, cuya facturación se agrupa como «Medios» en
la pantalla de Facturas. Lo administra un admin desde Configuración.

**Comisión de agencia** (`comision_agencia_pct`). La segunda capa del motor de márgenes: un porcentaje que se suma
sobre el precio de venta base (no sobre el costo del proveedor). Tiene un rango sugerido (13-20 % por defecto) y el
vendedor la negocia. Bajarla por debajo del mínimo en un servicio de fee manda la cotización a aprobación.

**Configuración general** (`configuracion_general`). La fila única con los parámetros de la organización: margen y
comisión por defecto, umbral de descuento, tasa de impuesto, multiplicador de escalamiento y otros. No existe hasta que
un admin la crea, y la tasa de impuesto es obligatoria al crearla: el sistema nunca inventa una tasa.

**Contacto** (`contacto`). Una persona. Es el único registro de personas del CRM: lead y cliente son etapas del mismo
contacto, no tablas distintas. No se borra: se desactiva y se reactiva.

**Contrato de fee recurrente** (`contrato_recurrente`). Un acuerdo con una empresa por un fee mensual, con fecha de
inicio y de fin, formado por líneas con monto mensual sin IVA. Cada mes genera una cotización propia. Es distinto de la
cuenta contrato. Ver [Contratos y facturación](./05-contratos-facturacion.md).

**Convertir a contacto.** La acción manual que transforma una conversación de la bandeja (o un lead de LinkedIn) en un
contacto. Nunca ocurre sola: un mensaje entrante no crea un contacto.

**Costo del proveedor** (`costo_proveedor`). Lo que le cuesta a la agencia una línea de cotización. Es la base del
motor de márgenes y nunca aparece en el PDF del cliente.

**Cotización** (`cotizacion`). La propuesta económica de una oportunidad, con número correlativo, líneas y un estado.
Sus líneas solo se editan en borrador; para cambiar una cotización ya enviada se crea una nueva versión. Estados:

| Estado | Qué significa |
|---|---|
| `borrador` | Se está armando. Los totales se calculan en vivo. |
| `preparacion` | Tiene un descuento o una comisión fuera de política y espera que un admin o un supervisor la apruebe. |
| `enviada` | Se mandó al cliente. La tasa de impuesto y los precios quedan congelados. |
| `aprobada` | El cliente aceptó. Fija el valor cotizado de la oportunidad. |
| `por_facturar` | Aceptada, pero todavía no se puede facturar (por ejemplo, falta la orden de compra o ya pasó el día de corte). |
| `facturado` | Ya se emitió la factura. Guarda el número de factura, que es obligatorio. |
| `rechazada` | El cliente no aceptó. |
| `vencida` | Pasó su vigencia sin respuesta. |

`por_facturar` y `facturado` se agregaron el 13/10/2026. Las dos cuentan como negocio ganado, igual que `aprobada`.

**Cuenta contrato** (`cuenta_contrato`). La ficha post-venta de una oportunidad ganada: fase actual escrita a mano,
si es recurrente y un enlace de referencia a Basecamp. No es gestión de proyectos ni tiene fechas de inicio y fin; para
fees mensuales con fechas está el contrato de fee recurrente.

**Documento de alcance** (`documento_alcance`). El documento que describe qué se va a hacer, complementario a la
cotización y sin precios. La IA redacta un borrador a partir de los servicios de la cotización, nunca de sus montos.
Estados: borrador, pendiente de aprobación, aprobado y rechazado. Lo aprueba un admin o un supervisor. Ver
[Documento de alcance](./04-documento-alcance.md).

**Empresa** (`empresa`). La organización cliente. Al crear una oportunidad, el sistema intenta enriquecerla con datos
públicos (sector, tamaño, LinkedIn) en segundo plano.

**Equipo** (`perfil.equipo`). El grupo al que pertenece un usuario y que decide qué ve: `administrativo`, `ventas`,
`marketing` o `proveedores`. Dentro de ventas, el rol es vendedor o supervisor. Ver
[Roles y permisos](./01-roles-permisos.md).

**Estimado.** La etiqueta que acompaña al valor referencial de una oportunidad mientras no haya una cotización en
firme.

**Etapa** (`oportunidad.etapa`, catálogo `etapa_pipeline`). La columna del pipeline en la que está una oportunidad.
Son nueve, fijas: Clasificación, Descubrimiento, Presentación Inicial, Propuesta, Evaluación, Negociación,
Contratación, Cierre Ganado y Cierre Perdido. La probabilidad y el umbral de alerta de cada una se editan en
Configuración; las etapas en sí no.

**Etapa de ciclo de vida** (`contacto.etapa_ciclo_vida`). Si un contacto es `contacto`, `lead` o `cliente`. Todo
contacto nace como `contacto` y la etapa se edita en su ficha.

**Fee.** Un servicio que se cobra como monto fijo (`fee_fijo`) o como monto mensual (`fee_recurrente`), en lugar de por
hora. La duración mínima de un fee se expresa siempre en meses.

**Formulario web.** El widget embebible en sitios externos que crea contactos sin sesión de prometIO. Es el único
endpoint público para crear datos. Ver [Bandeja y formulario](./07-bandeja-formulario.md).

**Impuesto** (`tasa_impuesto_pct`). La tasa de IVA, parametrizada en Configuración y nunca escrita en el código. Se
aplica sobre el subtotal. Mientras la cotización es un borrador se lee en vivo; al enviarla queda congelada en la
cotización y ya no cambia aunque la tasa de Configuración cambie.

**Lead.** Una de las tres etapas de ciclo de vida de un contacto. No es una tabla aparte.

**Lead de LinkedIn** (`lead_linkedin`). Un perfil de LinkedIn encontrado por la prospección, con estado `nuevo`,
`revisado`, `descartado` o `convertido`. Es un pool compartido de ventas, invisible para marketing. Ver
[Prospección LinkedIn](./08-prospeccion-linkedin.md).

**Lead score** (`lead_score`). Puntaje de 0 a 100 de una oportunidad, calculado con reglas fijas: frescura del último
contacto, seguimiento reportado, velocidad de primera respuesta en la bandeja, tamaño del negocio y datos de la
empresa. Si un componente no aplica, el puntaje se reescala sin él. Viene con su desglose para que el vendedor entienda
el número. No usa IA.

**Línea de cotización** (`linea_cotizacion`). Un renglón de la cotización. Puede venir del catálogo (`servicio_id`) y
heredar su categoría, o ser a medida (sin servicio), con descripción, precio y categoría obligatoria. Puede llevar un
precio manual con su justificación.

**Margen de agencia** (`margen_pct`). La primera capa del motor de márgenes: el porcentaje que se suma al costo del
proveedor para llegar al precio de venta base (30 % por defecto, con override por servicio).

**Meta comercial** (`meta_comercial`). El objetivo de venta de un periodo, total de la agencia o por vendedor. El
avance de la meta de agencia usa la facturación real; el de cada vendedor, las oportunidades ganadas.

**Modelo de cobro** (`servicio.modelo_cobro`). Cómo se cobra un servicio: `por_hora`, `fee_fijo` o `fee_recurrente`.

**Motor de márgenes.** El cálculo de cada línea: costo del proveedor, más margen de agencia, más comisión de agencia,
igual a subtotal; más impuesto, igual a total. Ver [Cotizaciones](./03-cotizaciones.md).

**Oportunidad** (`oportunidad`). Un negocio posible con un contacto y una empresa, asignado a un ejecutivo, que avanza
por las etapas del pipeline. Puede llevar un nombre libre para distinguir varios negocios del mismo cliente.

**Organización** (`organizacion`). La empresa dueña de los datos (hoy, una sola: Geeks Ecuador). Todo registro de
negocio la referencia con `organizacion_id`. Su logo y sus colores se usan en el PDF, los documentos y el formulario.

**Periodo** (`cotizacion.periodo_contrato`). El mes al que corresponde la cotización generada por un contrato de fee
recurrente. No hay una tabla de periodos: cada periodo es una cotización.

**Pilar** (`categoria_servicio.pilar`). La agrupación mayor de las categorías: `marca`, `crecimiento`,
`transformacion` o `transversal`. Las categorías antiguas pueden no tenerlo y se muestran como «Sin pilar».

**Pipeline.** El tablero Kanban con las nueve etapas de las oportunidades. Hay un solo pipeline; la «vista por
servicio» es un filtro sobre él.

**Piso contratado.** En la proyección de contratos, lo que ya está comprometido por contratos de fee para un mes. Se
desglosa en lo que está por facturar, lo ya facturado y lo que vence ese mes.

**Probabilidad de cierre** (`probabilidad_cierre`). El porcentaje que se espera ganar de una oportunidad. Toma el valor
por defecto de su etapa y se puede editar.

**Proveedor** (`proveedor`). Quien presta el servicio que la agencia revende. Lo gestionan admin y el equipo de
proveedores.

**Proyección.** La vista de contratos que muestra, mes a mes, el piso contratado, lo por facturar, lo facturado y lo
que vence.

**Renovación.** Un contrato de fee recurrente cuya fecha de fin está cerca (según los días de aviso configurados) o que
ya venció sin renovarse.

**Servicio** (`servicio`). Un ítem del catálogo, con modelo de cobro, estimación de horas por rol, márgenes y
categoría. Se crea con un asistente de ocho pasos que se puede guardar como borrador. Estados: borrador, activo y
archivado. Solo un admin lo activa. Ver [Servicios y configuración](./09-servicios-configuracion.md).

**Subtotal** (`subtotal_con_comision`, `subtotal_cotizacion`). El monto sin IVA. Es la cifra que muestra la interfaz en
cotizaciones, oportunidades, contratos y dashboard.

**Supervisor.** Rol de ventas que ve y gestiona el trabajo de todo el equipo comercial y aprueba cotizaciones y
documentos de alcance.

**Tarifa interna** (`tarifa_interna`). El costo por hora de un rol del equipo (por ejemplo, «Diseñador Jr»). Siempre por
rol, nunca por persona.

**Timeline.** El registro de eventos destacados del equipo: actividad reportada, lead convertido, cierre ganado o
perdido, cotización aprobada y asignación automática.

**Valor cotizado** (`valor_cotizado`). El valor de una oportunidad que viene de una cotización aprobada (sin IVA).
Cuando existe, manda sobre el valor referencial.

**Valor referencial** (`valor_referencial`). El valor que el vendedor estima para una oportunidad antes de cotizar. Se
muestra siempre con la etiqueta «estimado».

**Vendedor.** Rol de ventas que ve y edita solo lo propio: sus oportunidades, cotizaciones y contratos.
