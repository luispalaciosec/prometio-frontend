# 16 · Arquitectura del backend

> Revisado contra el código el 13/10/2026 (repo `prometio-backend`).

Cómo está armado el backend de prometIO: por dónde entra una petición, quién decide los permisos, quién escribe en
la base y qué corre fuera del ciclo de una petición. El modelo de datos está en [Modelo de datos](./17-modelo-datos.md)
y la lista de endpoints en [API REST](./18-api.md).

La regla de reparto: Supabase resuelve datos, autenticación y almacenamiento. FastAPI hace lo que no cabe ahí: el
motor de márgenes, la orquestación de IA, los PDF, los webhooks, las integraciones y los jobs.

---

## 1. Mapa del repo

```
prometio-backend/
├── app/
│   ├── main.py            Crea la app FastAPI, monta los 33 routers y los middlewares
│   ├── mcp_server.py      Servidor MCP de solo lectura (cliente HTTP de esta misma API)
│   ├── routers/           Un archivo por dominio (oportunidad.py, cotizacion.py, ...)
│   ├── models/            Modelos Pydantic de request/response, uno por entidad
│   ├── core/              Seguridad, cálculo, PDF, clientes externos, utilidades transversales
│   └── templates/         Plantillas Jinja2 de PDF: cotizacion.html, documento_alcance.html, seo_informe.html
├── supabase/
│   ├── migrations/        SQL numerado (0001 → 0094), aplicado en orden
│   └── pendientes/        Migraciones que se aplican a mano tras una coordinación; aplicadas pasan a migrations/
├── tests/                 pytest; las pruebas de RLS levantan un Postgres local (tests/db/sandbox.py)
├── scripts/               cifrar_secretos_existentes.py
├── Dockerfile             python:3.11-slim fijado por digest + librerías nativas de WeasyPrint
├── railway.json           Build con Dockerfile
└── .github/workflows/     ci.yml (lint, pruebas, pip-audit) y generar-cotizaciones-contratos.yml (cron mensual)
```

Dependencias principales (`pyproject.toml`): FastAPI, Uvicorn, `supabase`, Pydantic 2 + `pydantic-settings`, PyJWT,
WeasyPrint, Jinja2, `httpx`, `mcp`, `svix`, BeautifulSoup, `python-docx`, `qrcode`, `sentry-sdk`, `cryptography`.
Las versiones exactas, con hash, están en `requirements.lock`.

---

## 2. Ciclo de una petición

```
Frontend / MCP / widget / cron
   │  Authorization: Bearer <JWT de Supabase>   (o X-Cron-Secret, o nada en los endpoints públicos)
   ▼
CabecerasSeguridadMiddleware   nosniff, no-referrer, DENY, CSP default-src 'none' (salvo PDF), HSTS en producción
   ▼
FormularioCorsMiddleware       /formulario y /formulario/* aceptan cualquier origen (widget embebido)
   ▼
CORSMiddleware                 resto de la API: solo cors_allow_origins (en producción, solo https)
   ▼
ManejadorExcepcionesMiddleware excepción no manejada → 500 {"detail": "Error interno del servidor"}, detalle solo al log
   ▼
router  →  Depends(require_*)  →  limitar(...) si aplica  →  handler
   ▼
app/core/*  (cálculo, transiciones, PDF, IA, clientes externos)
   ▼
get_supabase()  →  Supabase Postgres (service_role)
```

**El orden de los middlewares importa.** Starlette los envuelve en orden inverso al de registro. El manejador de
excepciones se registra antes que CORS para quedar adentro: así su 500 sí lleva las cabeceras CORS y el navegador
muestra el error real en vez de "Failed to fetch". `FormularioCorsMiddleware` se registra después para quedar afuera y
responder el preflight del widget antes de que el CORS global lo rechace.

---

## 3. Routers por dominio

Todos se montan en `app/main.py` sin prefijo global (no hay `/api/v1`).

| Dominio | Routers | Prefijo |
|---|---|---|
| Pipeline comercial | `oportunidad`, `alerta`, `timeline` | `/oportunidades`, `/alertas`, `/timeline` |
| Cotizaciones | `cotizacion`, `documento_alcance` | `/cotizaciones`, `/documentos-alcance` |
| Post-venta y facturación | `contrato_recurrente`, `factura` | `/contratos-recurrentes`, `/facturas` |
| Contactos y empresas | `contacto`, `empresa`, `cumpleanos` | `/contactos`, `/empresas`, `/cumpleanos-proximos` |
| Agenda | `actividad`, `calendario`, `google_calendar` | `/actividades`, `/calendario`, `/google` |
| Bandeja y captación | `conversacion`, `formulario`, `prospeccion_linkedin` | `/conversaciones`, `/formulario`, `/prospeccion-linkedin` |
| Tableros | `inicio`, `resumen`, `dashboard`, `dashboard_detalle`, `dashboard_tv`, `meta_comercial` | `/inicio`, `/resumen`, `/dashboard`, `/metas-comerciales` |
| Marketing | `seo` | `/seo` |
| Catálogos y configuración | `config`, `asignacion_geografica`, `servicio`, `proveedor`, `organizacion` | `/config`, `/servicios`, `/proveedores`, `/organizacion` |
| Personas y operación | `perfil`, `auditoria`, `salud`, `basecamp` | `/perfiles`, `/auditoria`, `/salud`, `/basecamp` |
| Webhooks entrantes | `resend_webhook` | `/webhooks/resend` |

Además, `GET /health` (sin auth) responde `{"status": "ok"}` para Railway.

---

## 4. Autenticación y autorización

### Verificación del JWT (`app/core/security.py`)

El frontend manda el `access_token` de Supabase. `decode_jwt` lo verifica contra el **JWKS público** del proyecto
(`/auth/v1/.well-known/jwks.json`), algoritmo `ES256`, audiencia `authenticated`. No hay secreto compartido: Supabase
firma con claves asimétricas y `PyJWKClient` cachea y rota las claves por `kid`.

::: warning Lección registrada
Durante meses las pruebas firmaron JWT locales con el mismo secreto que los validaba y nunca vieron que la
verificación real (ES256) fallaba. Cualquier cambio en `security.py` o en un flujo de login se verifica al menos una
vez con un token real emitido por Supabase.
:::

### Dependencias de FastAPI

| Dependencia | Deja pasar | Error |
|---|---|---|
| `get_current_user_id` | Header `Authorization: Bearer <jwt>` válido | 401 |
| `get_current_perfil` | Usuario con fila en `perfil` y `activo` distinto de `false` | 401 sin perfil, 403 "Tu cuenta está desactivada" |
| `require_admin` | `equipo = administrativo` | 403 |
| `require_acceso_ventas` | `administrativo` o `ventas` | 403 |
| `require_acceso_marketing` | `administrativo` o `marketing` | 403 |
| `require_admin_o_proveedores` | `administrativo` o `proveedores` | 403 |
| `require_supervisor_o_admin` | `administrativo`, o `ventas` con `rol_ventas = supervisor` | 403 |

Y helpers que se llaman dentro del handler:

| Helper | Para qué |
|---|---|
| `es_solo_lo_propio(perfil)` | `true` para el vendedor: las listas se filtran por `ejecutivo_id = perfil.id` |
| `verificar_ownership_oportunidad` | 403 si un vendedor toca una oportunidad ajena |
| `tiene_visibilidad_total_bandeja` | Admin o supervisor ven toda la bandeja |
| `verificar_ownership_conversacion` | 403 si la conversación está asignada a otra persona |

La matriz completa de quién ve qué está en [Roles y permisos](./01-roles-permisos.md).

### Service role vs. RLS

El backend habla con Supabase con **una sola credencial**: `SUPABASE_SERVICE_ROLE_KEY`, que salta RLS. Por eso la
autorización efectiva de la API vive en estas dependencias y en el filtrado de cada handler, y está cubierta por
`tests/test_matriz_permisos.py`.

Las políticas RLS de Postgres siguen activas y valen para cualquier acceso con la clave pública (el navegador con su
JWT). Hoy el frontend solo lee `perfil` directo de Supabase. La migración
`supabase/migrations/0093_a2_revocar_escrituras_directas.sql` quita a los roles `authenticated` y `anon` el permiso de
escribir en las tablas de negocio (cotización, oportunidad, líneas, documento de alcance, contratos, leads de LinkedIn),
para que nadie pueda, por ejemplo, marcar su propia cotización como aprobada saltándose la API. **Se aplicó a mano en
producción el 13/10/2026**, después de confirmar que el frontend no escribe directo en ninguna de esas tablas. El
`SELECT` sobre `perfil` se mantiene porque el login lo necesita.

### Límite de tasa (`app/core/rate_limit.py`)

Ventana deslizante en memoria, como dependencia `limitar(nombre, máximo, ventana_s, por)`. Pasado el límite responde
`429` con `Retry-After`. Es por proceso: con una réplica es exacto; con varias se multiplica.

| Uso | Límite | Clave |
|---|---|---|
| `POST /formulario` | 10 / 60 s | IP |
| `GET /cotizaciones/{id}/verificar` | 30 / 60 s | IP |
| `GET /cotizaciones/{id}/pdf-cliente` | 20 / 60 s | usuario |
| IA del Documento de Alcance (crear, auditar, regenerar sección) | 10 / 300 s | usuario |
| `POST /seo/crawl`, `POST /seo/core-web-vitals` | 5 / 300 s | usuario |

---

## 5. Acceso a datos

### Cliente Supabase compartido

`get_supabase()` (`app/core/supabase_client.py`) es un singleton (`@lru_cache`) para todo el proceso, con un
`httpx.Client` explícito: **HTTP/1.1** (`http2=False`) y un pool de 100 conexiones.

Por qué: con el HTTP/2 por defecto, una ráfaga de ~30 peticiones concurrentes (una pantalla que pedía un recurso por
fila) hizo que el borde de Supabase cortara la conexión con `GOAWAY`, y las peticiones en vuelo terminaban en 500
intermitentes. Regla que quedó: antes de cerrar un endpoint que alimenta una lista, probarlo con N peticiones
concurrentes reales.

`get_or_404(tabla, id)` es el atajo para leer una fila o responder 404.

### Transiciones atómicas (`app/core/transiciones.py`)

Cambiar un estado leyendo, comprobando y después escribiendo deja una ventana: dos clics rápidos pasan los dos la
comprobación. `transicionar(tabla, id, desde, cambios)` hace `UPDATE ... WHERE estado = <esperado>`: Postgres lo
serializa y solo una petición afecta la fila; la otra recibe **409** "El registro cambió de estado mientras lo
procesabas". Los efectos externos (webhooks, emails) se ejecutan solo después de ganar la transición.

### Numeración

El número de cotización (`COT-000123`) sale de una `SEQUENCE` de Postgres (`generate_numero_cotizacion()`), nunca de
un `COUNT(*)`.

---

## 6. Módulos de `app/core`

| Módulo | Qué resuelve |
|---|---|
| `calculo.py` | **Motor de márgenes.** `costo_proveedor × (1 + margen) = precio_venta_base`; `× (1 + comisión) = subtotal_con_comision`; `× (1 + impuesto) = total_linea`. Variante sin proveedor (precio base del cliente) y costo interno por rol (por hora, por sueldo, por evento) |
| `estados_cotizacion.py` | `ESTADOS_GANADA = ("aprobada", "por_facturar", "facturado")`: todo lo que pregunta "¿se ganó?" usa esto, o una cotización facturada dejaría de contar |
| `transiciones.py` | Cambios de estado atómicos (409 si otra petición ganó) |
| `security.py` | JWT, dependencias de rol y ownership |
| `rate_limit.py` | `limitar(...)` → 429 |
| `pdf.py` | Render HTML → PDF con WeasyPrint y Jinja2 (sección 7) |
| `docx_alcance.py`, `texto_enriquecido.py` | Exportar el Documento de Alcance a `.docx`, leerlo de vuelta y convertir su texto enriquecido a HTML |
| `ai_provider.py` | Capa de abstracción de IA. Un proveedor real hoy (Claude, vía API de Anthropic); el resto del código no sabe cuál es |
| `documento_alcance_ia.py`, `documento_alcance_auditoria.py` | Borrador asistido, resumen de cambios, auditoría contra la cotización, regenerar una sección. Nunca reciben precios |
| `sugerencias_inicio.py` | Sugerencias de IA de la pantalla de Bienvenida, cacheadas por vendedor en `sugerencia_inicio` |
| `lead_score.py` | Score de lead determinístico, sin IA (ADR-020): cada punto tiene una razón documentada |
| `reparto_leads.py` | Asignación automática de leads: round robin, geografía o carga de trabajo |
| `webhook_saliente.py` | Webhooks salientes firmados (sección 8) |
| `auditoria.py`, `timeline.py` | Registro de acciones sensibles y eventos del timeline comercial |
| `cifrado.py` | Cifrado en reposo (Fernet) de tokens OAuth y secretos de tracking guardados en la base |
| `ssrf.py`, `url_segura.py` | Qué URLs puede descargar el servidor (crawler SEO, recursos de PDF y Word) |
| `archivos.py` | Validación de archivos subidos por tamaño y firma real del contenido |
| `errores.py` | `descripcion_segura(exc)`: tipo de error y código HTTP, nunca la URL (algunas APIs llevan la clave en la query) |
| `observabilidad.py` | Sentry opcional y filtro de logs que redacta secretos |
| `seguridad_http.py`, `formulario_cors.py`, `error_handling.py` | Middlewares |
| `busqueda.py` | Escape de términos para filtros `ilike` de PostgREST |
| `qr.py` | QR del PDF de cotización (apunta a la verificación pública) |
| `seo_crawler.py`, `pagespeed.py`, `seo_recomendaciones.py` | Crawler SEO, Core Web Vitals y recomendaciones deterministas del informe |
| `supabase_auth_admin.py` | Admin API de Supabase Auth: invitar, banear y desbanear usuarios |
| Clientes externos | `contifico.py`, `apify.py`, `google_calendar.py`, `basecamp.py`, `resend_send.py`, `meta_capi.py`, `ga4_mp.py`, `hcaptcha.py` |

---

## 7. PDF

El PDF de cotización lo genera **el backend**, nunca el frontend. La vista para cliente y la interna salen de la misma
plantilla (`templates/cotizacion.html`) con un flag `interno`. Elegir la vista es una decisión de permisos: si el
frontend recibiera el desglose para decidir si mostrarlo, el costo del proveedor ya habría viajado al navegador.

| Endpoint | Plantilla |
|---|---|
| `GET /cotizaciones/{id}/pdf-cliente` | `cotizacion.html`, `interno=False`: solo totales |
| `GET /cotizaciones/{id}/pdf-interno` | `cotizacion.html`, `interno=True`: con costo, margen y comisión |
| `GET /documentos-alcance/{id}/pdf` | `documento_alcance.html` (se fija al aprobar y se guarda en Storage) |
| `GET /seo/informe-pdf` | `seo_informe.html` |

Detalles de `app/core/pdf.py`:

- Jinja2 con **autoescape activo**. Los filtros de texto enriquecido escapan por dentro.
- Los colores de la organización se interpolan en `<style>`, donde el escape HTML no protege: solo se aceptan `#hex`,
  `rgb()`/`rgba()` o nombres simples (`css_color`).
- `_FetcherRestringido`: WeasyPrint solo carga `data:` y el storage público propio. `file://`, `http://` y la red
  interna quedan bloqueados.
- WeasyPrint necesita Pango y HarfBuzz nativos: el `Dockerfile` los instala. En macOS con Homebrew hace falta
  `DYLD_LIBRARY_PATH=/opt/homebrew/lib` para correrlo en local (ver [Setup](./12-setup.md)).

---

## 8. Lo que corre fuera de la petición

No hay scheduler propio ni cola de trabajos. Hay tres mecanismos:

**`BackgroundTasks` de FastAPI** (corren en el mismo proceso, después de responder):

| Disparador | Tarea |
|---|---|
| `POST /oportunidades` sobre una empresa sin datos enriquecidos | Enriquecer la empresa (Apify) |
| `POST /cotizaciones/{cotizacion_id}/documentos-alcance` | Generar el borrador con IA |
| `POST /seo/crawl` | Ejecutar el crawl (responde `202`) |
| `POST /formulario` | Aviso por email al equipo de ventas, webhook `contacto.creado_formulario`, Meta CAPI y GA4 |
| Crear / editar empresa | Webhooks `empresa.creada` / `empresa.actualizada` |
| `POST /cotizaciones/{id}/marcar-aprobada` | Webhook `cotizacion.aprobada` (lo consume BackIO para proponer el proyecto) |

**Webhooks salientes** (`webhook_saliente.py`). Destinos configurados por un admin en `organizacion_webhook`. Cuerpo
`{evento, timestamp, data}`, firmado con HMAC-SHA256 en `X-Prometio-Signature: sha256=...` y
`X-Prometio-Timestamp`. Tres intentos (inmediato, +5 s, +30 s), sin seguir redirecciones y con transporte anti-SSRF.
Si los tres fallan, solo queda un warning en el log de Railway.

**Cron externo.** `POST /contratos-recurrentes/generar-mes` crea las cotizaciones mensuales de los contratos de fee.
Lo dispara un workflow de GitHub Actions el día 1 de cada mes a las 06:00 de Ecuador, con la cabecera
`X-Cron-Secret`. También acepta la sesión de un usuario de ventas o admin. Es idempotente: un índice único
`(contrato_recurrente_id, periodo_contrato)` impide duplicar un mes.

**Webhook entrante.** `POST /webhooks/resend` verifica la firma Svix y sincroniza `contacto.elegible_marketing`.

---

## 9. Integraciones externas

| Servicio | Módulo | Para qué | Variables |
|---|---|---|---|
| Supabase | `supabase_client.py`, `supabase_auth_admin.py` | Base, Storage, Auth admin | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Anthropic | `ai_provider.py` | Documento de Alcance, sugerencias de Bienvenida, sugerir líneas de cotización, prospección en LinkedIn | `ANTHROPIC_API_KEY` (opcional) |
| Google Calendar | `google_calendar.py` | Eventos de actividades, por vendedor | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Basecamp | `basecamp.py` | Conectar la cuenta del vendedor (OAuth por usuario) | `BASECAMP_CLIENT_ID`, `BASECAMP_CLIENT_SECRET`, `BASECAMP_ACCOUNT_ID` (opcionales) |
| Contífico | `contifico.py` | Facturas e historial de precios, solo lectura (API v2) | `CONTIFICO_API_KEY` |
| Apify | `apify.py` | Enriquecer empresas y contactos, prospección en LinkedIn | `APIFY_API_TOKEN` |
| Resend | `resend_send.py`, `resend_webhook.py` | Email transaccional y eventos de marketing | `RESEND_API_KEY` (opcional), `RESEND_WEBHOOK_SECRET` |
| Meta Conversions API | `meta_capi.py` | Conversión del formulario web | En `organizacion_ads_config` (cifrado) |
| GA4 Measurement Protocol | `ga4_mp.py` | Conversión del formulario web, solo servidor | En `organizacion_ads_config` (cifrado) |
| hCaptcha | `hcaptcha.py` | Captcha del formulario web | `HCAPTCHA_SECRET_KEY`, `HCAPTCHA_HOSTNAMES` (opcionales) |
| PageSpeed Insights | `pagespeed.py` | Core Web Vitals | `PAGESPEED_API_KEY` |
| Sentry | `observabilidad.py` | Errores | `SENTRY_DSN` (opcional) |

El detalle funcional de cada una está en [Integraciones](./11-integraciones.md).

---

## 10. Configuración (`app/core/config.py`)

`Settings` (pydantic-settings) lee variables de entorno o `.env`.

- **Obligatorias:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `CONTIFICO_API_KEY`, `APIFY_API_TOKEN`, `RESEND_WEBHOOK_SECRET`, `PAGESPEED_API_KEY`. Sin ellas el proceso no arranca.
- **Opcionales a propósito:** `ANTHROPIC_API_KEY`, `BASECAMP_*`, `HCAPTCHA_SECRET_KEY`, `HCAPTCHA_HOSTNAMES`,
  `RESEND_API_KEY`, `CRON_SECRET`, `SENTRY_DSN`, `SECRETS_ENCRYPTION_KEY`, `ENVIRONMENT`. Una variable nueva
  obligatoria que Railway no tenga tumba **todo** el backend (ya pasó una vez), así que lo nuevo entra como opcional y
  solo falla la función que la usa.
- `CORS_ALLOW_ORIGINS`: lista de orígenes. En producción se descartan los que no son `https://`.
- **Producción** se detecta sola: `RAILWAY_ENVIRONMENT` presente (Railway la define), salvo que `ENVIRONMENT` diga
  `development`/`local`/`test`. En producción no se publican `/docs`, `/redoc` ni `/openapi.json`, y se agrega HSTS.

---

## 11. Servidor MCP

`app/mcp_server.py` (comando `prometio-mcp`) es un servidor MCP de **solo lectura** para Claude Desktop. No importa
los routers ni toca Supabase: llama a esta misma API por HTTP con el token del usuario (`PROMETIO_ACCESS_TOKEN`, y
`PROMETIO_API_URL` opcional). Así cada llamada pasa por la misma autenticación y los mismos permisos que el frontend.
Herramientas: `listar_pipeline`, `listar_actividades`, `resumen_del_dia`. Agregar escritura requiere antes
autenticación por llamada; no se suma sobre este modelo.

---

## 12. Pruebas y CI

- `pytest -q`. `conftest.py` fija valores falsos para todas las variables obligatorias: las pruebas nunca pueden hablar
  con producción.
- Las pruebas de RLS (`test_rls_perfil.py`, `test_a2_escrituras.py`, `test_acceso_desactivados.py`, ...) levantan un
  Postgres local con las migraciones reales (`tests/db/sandbox.py`); si no hay Postgres instalado se saltan.
- Otras suites cubren la matriz de permisos, transiciones, límite de tasa, SSRF, seguridad de PDF, cabeceras, cifrado
  y que ningún error filtre secretos.
- CI (`.github/workflows/ci.yml`): `ruff check --select F,E9`, `pytest -q` y `pip-audit` sobre `requirements.lock`, en
  cada PR y en cada push a `main`.

---

## 13. Dónde mirar cuando algo falla

| Síntoma | Dónde mirar |
|---|---|
| 401 en todo con un login real | `decode_jwt`: JWKS, `ES256`, audiencia. `SUPABASE_URL` correcta |
| 403 "Tu cuenta está desactivada" | `perfil.activo = false`. Reactivar desde Usuarios |
| 500 intermitentes solo bajo carga | Ráfaga de peticiones paralelas desde una pantalla. Ver sección 5 |
| 500 genérico | `railway logs` en el repo del backend: el detalle solo va al log, nunca a la respuesta |
| PDF no se genera | Librerías nativas de WeasyPrint; `GET /salud` incluye un chequeo de WeasyPrint |
| La IA responde 502 o "no configurado" | `ANTHROPIC_API_KEY` en Railway; límite de 10 llamadas cada 5 minutos por usuario |
| El formulario web devuelve 503 | hCaptcha no respondió, o falta `HCAPTCHA_SECRET_KEY` («captcha no configurado en el servidor»). Si devuelve 422 «Captcha inválido», revisar `HCAPTCHA_HOSTNAMES` |
| No se generaron las cotizaciones del mes | Workflow `generar-cotizaciones-contratos.yml` en GitHub y `CRON_SECRET` en Railway y en GitHub |
| Un webhook saliente no llegó | Log de Railway: "webhook saliente falló tras 3 intentos" |
| Una variable nueva tumbó el deploy | Debe ser opcional en `Settings` (sección 10) |

Relacionado: [Arquitectura del frontend](./15-arquitectura-frontend.md), [Modelo de datos](./17-modelo-datos.md),
[API REST](./18-api.md), [Seguridad](./14-seguridad.md), [Despliegue](./13-despliegue.md).
