# 11 · Integraciones

> Revisado contra el código el 13/10/2026.

Esta página lista cada servicio externo con el que prometIO habla de verdad en el código: para qué, en
qué dirección, dónde vive la credencial (solo el **nombre** de la variable) y qué pasa cuando falla.

Dos principios atraviesan todas:

- **Las credenciales viven en el backend.** El frontend solo tiene valores públicos (URL y clave anónima
  de Supabase, URL del backend, client ID de Basecamp, DSN de Sentry). Todo secreto está en las
  variables de Railway o, si lo carga un admin desde la app, cifrado en la base.
- **Una integración caída no tumba el negocio.** Donde se puede, la falla es best-effort: el contacto se
  crea aunque falle Meta, la actividad se guarda aunque falle Google, el lead se guarda aunque falle la IA.

## Resumen

| Servicio | Para qué | Dirección | Credenciales |
|---|---|---|---|
| [Supabase Auth](#supabase-auth) | Login con correo o Google, invitaciones | Frontend ↔ Supabase; backend verifica | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| [Google Calendar y Meet](#google-calendar-y-meet) | Eventos de visitas y videollamadas, links de Meet | prometIO → Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| [Basecamp](#basecamp) | Mostrar la cuenta de Basecamp del vendedor | prometIO → Basecamp | `VITE_BASECAMP_CLIENT_ID`, `BASECAMP_CLIENT_ID`, `BASECAMP_CLIENT_SECRET`, `BASECAMP_ACCOUNT_ID` |
| [Contífico](#contifico) | Leer facturas emitidas | prometIO → Contífico (solo lectura) | `CONTIFICO_API_KEY` |
| [BackIO](#backio) | Avisar cotizaciones aprobadas y altas de empresas | prometIO → BackIO (webhook) | Secreto por webhook, cifrado en la base |
| [Resend](#resend) | Email a ventas por cada lead; eventos de email marketing | Ambas | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` |
| [Apify](#apify) | LinkedIn, Google Search y Google Maps | prometIO → Apify | `APIFY_API_TOKEN` |
| [hCaptcha](#hcaptcha) | Captcha del formulario web | Widget → hCaptcha; backend verifica | `HCAPTCHA_SECRET_KEY`, `HCAPTCHA_HOSTNAMES` |
| [Meta y GA4](#meta-conversions-api-y-ga4) | Conversiones del formulario web | prometIO → Meta / Google | Cargadas desde la app, cifradas |
| [PageSpeed](#pagespeed-y-rastreo-seo) | Core Web Vitals | prometIO → Google | `PAGESPEED_API_KEY` |
| [IA (Anthropic Claude)](#ia-anthropic-claude) | Documento de alcance, investigación de leads, sugerencias | prometIO → Anthropic | `ANTHROPIC_API_KEY` |
| [Sentry](#sentry) | Errores de frontend y backend | Ambos → Sentry | `VITE_SENTRY_DSN`, `SENTRY_DSN` |
| [Jelou / WhatsApp](#jelou-whatsapp-messenger-instagram) | Canales de la bandeja | No construido | — |

**Variables obligatorias.** En el backend, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CONTIFICO_API_KEY`, `APIFY_API_TOKEN`,
`RESEND_WEBHOOK_SECRET` y `PAGESPEED_API_KEY` son obligatorias: si falta una, el backend no arranca. Las
demás son opcionales a propósito, para que una integración todavía sin configurar no tumbe todo el
servicio; sin ellas, solo falla la función que las usa. Ver [Setup](./12-setup.md) y
[Despliegue](./13-despliegue.md).

**Secretos cargados desde la app.** Los tokens de Meta y GA4, los secretos de webhooks salientes y los
refresh tokens de Google y Basecamp se guardan cifrados con Fernet usando `SECRETS_ENCRYPTION_KEY`. Si
esa variable no está, se guardan sin cifrar; si hay un valor cifrado y falta la clave (o cambió), leerlo
falla. Nunca se devuelven por la API. Ver [Seguridad](./14-seguridad.md).

## Supabase Auth

**Para qué.** Iniciar sesión. Todo lo demás del dominio pasa por el backend, no directo a Supabase.

**Cómo.**

- Login con **correo y contraseña** o con **Google** (OAuth gestionado por Supabase).
- Los usuarios nuevos entran por **invitación**: `administrativo` invita desde Usuarios y el backend
  llama al endpoint de invitación de Supabase Auth con la service role. Desactivar un usuario lo bloquea
  también en Supabase Auth.
- El frontend manda el JWT de la sesión en cada llamada. El backend lo verifica contra las **claves
  públicas (JWKS) del proyecto**, con algoritmo ES256 y audiencia `authenticated`. No hay secreto
  compartido.
- Un perfil desactivado recibe 403 en cualquier endpoint, aunque su sesión siga vigente.

**Si falla.** Sin Supabase no hay login ni datos: es la única dependencia sin la que prometIO no
funciona. Salud chequea la base y el storage.

## Google Calendar y Meet

**Para qué.** Que una visita o videollamada programada en prometIO aparezca en el calendario del
vendedor, con link de Meet si es videollamada. Funcionamiento en [Agenda](./10-agenda.md#google-calendar-y-meet).

**Cómo se conecta.** Desde **Cuenta**, el vendedor vuelve a pasar por el login de Google de Supabase,
esta vez pidiendo el permiso `calendar.events` con acceso offline y consentimiento explícito. Supabase
devuelve el refresh token de Google al frontend, que lo manda al backend (`POST /google/conectar-calendar`).
El backend lo valida canjeándolo por un access token, lo guarda **cifrado** por vendedor y registra el
email de Google conectado.

Cada vez que hay que crear o mover un evento, el backend canjea el refresh token por un access token
nuevo con `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

**Por qué por vendedor.** El evento tiene que estar en el calendario de quien va a la reunión, con su
identidad. Una cuenta de servicio no tendría acceso a esos calendarios.

**Si falla.** La actividad se guarda igual con el error de sincronización y se puede reintentar. Si
Google no devuelve el permiso en la conexión, Cuenta muestra el error y pide volver a conectar. Si el
refresh token es inválido, la conexión responde 422.

## Basecamp

**Para qué.** Hoy, solo dos cosas: que el vendedor conecte su cuenta de Basecamp para mostrar "conectado
como" con su nombre y foto, y un chequeo de disponibilidad en Salud. **No hay sincronización** de
proyectos ni tareas: eso es rol de BackIO. La ficha de cuenta solo guarda una URL de referencia.

**Cómo.** OAuth 2.0 de Basecamp, por vendedor:

1. El frontend redirige a Launchpad con `VITE_BASECAMP_CLIENT_ID` y un `state` aleatorio guardado en la
   sesión del navegador.
2. Basecamp vuelve a `/auth/basecamp/callback` con un `code`. El frontend valida el `state`.
3. El frontend manda el `code` crudo al backend (`POST /basecamp/conectar`), y **el backend hace el
   canje** con `BASECAMP_CLIENT_ID` y `BASECAMP_CLIENT_SECRET`.
4. Con el access token lee el perfil del vendedor dentro de la cuenta de la agencia
   (`BASECAMP_ACCOUNT_ID`) y guarda el refresh token cifrado.

**Por qué el canje va en el backend.** Con Google, Supabase hace el canje del lado del servidor. Basecamp
no tiene ese intermediario: si el frontend canjeara el `code`, el client secret quedaría dentro del
bundle de Vite, visible para cualquiera. Por eso el navegador solo maneja el `code`.

**Si falla.** Las variables de Basecamp son opcionales: sin ellas el backend arranca y solo fallan los
endpoints de Basecamp. Un `code` rechazado responde 422. Si no se puede leer el perfil, se guarda la
conexión sin nombre ni foto.

## Contífico

**Para qué.** Leer las facturas electrónicas (`FAC`) emitidas por la agencia: pantalla Facturas, meta de
agencia y facturación del Dashboard, Panel TV, proyección de contratos e historial de precios de un
servicio. **Solo lectura.** Emitir facturas desde prometIO está diferido; "marcar facturada" es un
registro manual.

**Cómo.** API v2 de Contífico, documentos de clientes por rango de fechas, con `CONTIFICO_API_KEY` en el
header `Authorization`. Páginas de 100 documentos, **hasta 30 páginas** por consulta (unos 3.000
documentos). Contífico puede devolver el mismo documento en dos páginas, así que se deduplica por número.
El monto que se usa es `subtotal_0 + subtotal_12` (sin IVA).

**Por qué no hay búsqueda ni orden del lado de Contífico.** Su API no los soporta en este endpoint: el
filtro por cliente y el orden se hacen en el backend sobre lo ya traído.

**Si falla.** Un rechazo de Contífico responde **502** con el mensaje de Contífico, y un timeout o caída de red,
**502** «Contífico no respondió». Nunca una lista vacía: "sin facturas" y "Contífico caído" no pueden verse igual.

- En **Facturas** y en el bloque de facturación del Dashboard se muestra el error o un vacío explícito.
- En el **Panel TV**, se mantiene el último dato conocido con un aviso.
- El **historial de 12 meses** avisa cuántos meses no se pudieron traer.
- La meta de agencia del Dashboard consulta Contífico dentro de `GET /dashboard/kpis`. Si Contífico falla,
  el resto del Dashboard carga igual: la meta muestra «No disponible» y el forecast avisa que no incluye lo
  facturado (`metas.cerrado_no_disponible`). Un vendedor no se ve afectado, porque su meta usa el CRM.

**Si hay más documentos que el tope.** Con más de unos 3.000 documentos en el rango, el backend lo deja en el log y
marca la respuesta como truncada (`truncado` en `/facturas` y `/facturas/resumen`, `facturacion_truncada` en el
Panel TV, `metas.cerrado_truncado` en el Dashboard). La interfaz avisa que los totales pueden estar incompletos.

## BackIO

**Para qué.** BackIO es el sistema de backlog y gestión de cuenta de Geeks. prometIO le avisa cuándo se
gana un negocio, para que nazca la propuesta de proyecto, y le mantiene al día los clientes. `cliente_id`
es el mismo UUID en los dos sistemas. Detalle del lado de BackIO en su documentación
("Interconexión BackIO ↔ PrometIO").

**Cómo.** Webhooks salientes por organización (`organizacion_webhook`). BackIO se registra como un
destino más:

| Evento | Cuándo | `data` |
|---|---|---|
| `cotizacion.aprobada` | Una cotización pasa de enviada a aprobada | Cotización, número, oportunidad, empresa (id, nombre, activo), valor, validez y líneas (servicio, cantidad, descripción) |
| `empresa.creada` | Alta de empresa | id, nombre, activo, RUC, logo |
| `empresa.actualizada` | Edición de empresa | Igual que arriba |

Mismo formato y firma que cualquier webhook de prometIO (ver
[Formulario web → Webhooks](./07-bandeja-formulario.md#webhooks)): cuerpo
`{ evento, timestamp, data }`, `X-Prometio-Signature: sha256=<HMAC>` y `X-Prometio-Timestamp`. Solo
`https` y servidores públicos.

**Garantías.**

- La transición a aprobada es condicional al estado: si dos personas aprueban a la vez, solo una gana y
  el webhook sale **una sola vez**.
- Las cotizaciones mensuales de un [contrato](./05-contratos-facturacion.md#generar-el-mes) nacen en
  `por_facturar` sin pasar por "aprobada", así que **no** disparan `cotizacion.aprobada`: BackIO no
  recibe una propuesta de proyecto por cada mes de un fee.

**Si falla.** 3 intentos (inmediato, a los 5 s y a los 30 s). Si los tres fallan, solo queda un log en el
backend; no hay cola ni reintento posterior. Una cotización aprobada mientras BackIO estaba caído hay que
reenviarla a mano. La consulta en sentido contrario (prometIO leyendo el estado de entrega desde BackIO)
no está construida en prometIO.

## Resend

**Para qué.** Dos usos:

1. **Envío:** el email que avisa a todo el equipo de ventas de cada lead nuevo del formulario web, con
   remitente del dominio del CRM. Usa `RESEND_API_KEY`.
2. **Recepción:** el webhook `POST /webhooks/resend` registra eventos de email (`email.*`) en
   `resend_evento` (el conteo de "Mails" en [Resumen](./06-dashboard.md#resumen)) y, cuando un contacto
   se da de baja, marca `contacto.elegible_marketing = false`. La firma se verifica con Svix y
   `RESEND_WEBHOOK_SECRET`; una firma inválida recibe 401.

Las campañas de email marketing se componen y envían desde el propio dashboard de Resend, no desde
prometIO. prometIO solo guarda las estadísticas que se cruzan con sus contactos.

**Si falla.** Sin `RESEND_API_KEY`, el aviso de leads no sale, pero el lead se crea igual. Si falla el
envío a una persona, se sigue con las demás. Las fallas solo quedan en el log del backend.

## Apify

**Para qué.** Traer datos públicos sin mantener scrapers propios:

| Uso | Actor |
|---|---|
| [Prospección LinkedIn](./08-prospeccion-linkedin.md): búsqueda de perfiles | `harvestapi~linkedin-profile-search` |
| Post reciente de un perfil | `harvestapi~linkedin-profile-posts` |
| Datos de empresa en LinkedIn (prospección e investigación) | `harvestapi~linkedin-company` |
| Enriquecer un contacto desde su LinkedIn | `harvestapi~linkedin-profile-scraper` |
| Enriquecer una empresa (a pedido, y al crear una oportunidad de una empresa todavía sin enriquecer) | `harvestapi~linkedin-company`, `apify~google-search-scraper`, `compass~crawler-google-places` |

**Cómo.** Ejecución sincrónica de cada actor con `APIFY_API_TOKEN`, timeout de 60 segundos.

**Costo.** Cada perfil es una ejecución paga. Por eso la prospección tiene topes por corrida y un cooldown
entre búsquedas, y la investigación de un lead no vuelve a consultar la empresa si ya la tiene.

**Si falla.** En prospección, 502 con la cantidad de leads guardados antes del error. El
enriquecimiento automático de empresas corre en segundo plano y no afecta el alta de la oportunidad. Salud hace un ping
de alcance a la API de Apify sin ejecutar actores, para no gastar cuota.

## hCaptcha

**Para qué.** Que el [formulario web](./07-bandeja-formulario.md#proteccion-contra-abuso) público no se
llene de bots.

**Cómo.** El widget carga hCaptcha con la site key pública (está en el widget, no es secreta). El backend
verifica el token con `HCAPTCHA_SECRET_KEY`. Si `HCAPTCHA_HOSTNAMES` tiene una lista de dominios
(separados por coma), además exige que el captcha se haya resuelto en uno de ellos, para que un token
resuelto en otro sitio con la misma site key no sirva.

**Si falla.**

| Situación | Respuesta |
|---|---|
| hCaptcha no responde | 503, el widget pide resolver de nuevo |
| Token inválido o de otro dominio | 422 |
| `HCAPTCHA_SECRET_KEY` sin configurar | 422 en **todos** los envíos |

## Meta Conversions API y GA4

**Para qué.** Que Meta y Google Analytics sepan cuándo una campaña generó un lead real del formulario
web. Detalle en [Medición](./07-bandeja-formulario.md#medicion-meta-y-ga4).

**Cómo.** El backend llama directo a la Graph API de Meta y al Measurement Protocol de GA4, sin SDK.
Credenciales cargadas por `administrativo` en Configuración → Formulario web → Medición
(`organizacion_ads_config`): Pixel ID y Measurement ID son públicos; el access token de Meta y el API
secret de GA4 se guardan cifrados y nunca se devuelven.

**Si falla.** Sin reintentos. Cada intento, exitoso o no, queda en `ads_tracking_evento` y se ve en la
pestaña Medición. El error de GA4 se guarda sin la URL, porque GA4 lleva el API secret en la query
string.

## PageSpeed y rastreo SEO

**Para qué.** El módulo SEO de marketing (`/seo`): Core Web Vitals de un sitio y un rastreo de sus
páginas.

**Cómo.**

- **Core Web Vitals:** PageSpeed Insights de Google, categoría performance, con `PAGESPEED_API_KEY`.
- **Rastreo:** el backend descubre páginas por sitemap o enlaces y audita cada una. Corre en segundo
  plano. Solo acepta sitios públicos por http/https, revalida cada redirección y cada enlace, y no puede
  llegar a la red interna.

Ambos tienen límite de 5 ejecuciones cada 5 minutos por usuario.

**Si falla.** El rastreo queda en estado `fallido` con el tipo de error; el detalle va solo al log.
PageSpeed falla con un error controlado.

## IA (Anthropic Claude)

**Para qué.**

| Uso | Dónde |
|---|---|
| Generar y auditar el documento de alcance | [Documento de alcance](./04-documento-alcance.md) |
| Borrador de líneas de cotización | [Cotizaciones](./03-cotizaciones.md) |
| Resumen y mensaje sugerido de un lead | [Prospección LinkedIn](./08-prospeccion-linkedin.md#investigar-con-ia) |
| Sugerencias del día | [Bienvenida](./10-agenda.md#sugerencias) |

**Cómo.** Una sola capa de abstracción (`app/core/ai_provider.py`) con un único proveedor hoy:
Anthropic Claude, por la Messages API, con `ANTHROPIC_API_KEY`. El modelo devuelve JSON que el backend
parsea. Cambiar de proveedor es cambiar esa capa, no cada pantalla.

En todos los usos rige lo mismo: **las reglas deciden y la IA redacta.** Los datos que recibe el modelo
ya están calculados y la instrucción le prohíbe inventar; cuando devuelve referencias (por ejemplo, ids
de sugerencias), el backend descarta lo que no corresponda a algo real.

Las funciones de documento de alcance tienen límite de 10 llamadas cada 5 minutos por usuario.

**Si falla.** Cualquier falla (sin clave, red, respuesta mal formada) se convierte en un error propio del
proveedor y cada función decide su respaldo: la investigación de leads guarda igual los datos de la
empresa, las sugerencias usan textos de plantilla. Sin `ANTHROPIC_API_KEY`, el backend arranca igual y
solo fallan las funciones de IA.

## Sentry

**Para qué.** Registrar errores en producción.

**Cómo.** Dos proyectos separados: el frontend con `VITE_SENTRY_DSN` (y `VITE_SENTRY_ENVIRONMENT`
opcional) y el backend con `SENTRY_DSN`. Ninguno mide rendimiento (traces en 0). El frontend asocia los
errores solo al id del perfil, nunca al email ni al nombre. El backend no envía datos personales y filtra
secretos de los logs.

**Si falla o no está configurado.** Sin DSN no se inicializa y la app funciona igual.

## Jelou, WhatsApp, Messenger, Instagram

**No construido.** La [Bandeja](./07-bandeja-formulario.md#bandeja) tiene los canales WhatsApp,
Instagram, Messenger y Chat web en el modelo de datos y la pantalla funciona, pero no existe en el código
ninguna conexión con Jelou ni con las APIs de Meta para mensajería. Los mensajes que se escriben en la
bandeja no salen a ningún canal.

## Fuera de alcance por ahora

| Integración | Estado |
|---|---|
| Google Ads (conversión server-side) | En pausa por decisión explícita; diseño aprobado, sin construir |
| Emisión de facturas en Contífico | Diferida |
| Conectores para ChatGPT y Gemini | "Próximamente" en Configuración → Conectores. Necesitan OAuth por usuario antes de construirse |

El conector de **Claude** (servidor MCP de solo lectura, que corre en la máquina de cada usuario con su
propio token) está documentado en Configuración → Conectores.
