---
outline: [2, 3]
---

# 18 · API REST

> Revisado contra los routers el 13/10/2026 (`prometio-backend/app/routers`, 216 rutas más `/health`).

Mapa de la API HTTP del backend: cómo autenticarse, cómo vienen los errores y qué hace cada endpoint. La usan el
frontend, el widget del formulario web, el servidor MCP y el cron mensual. La arquitectura detrás está en
[Arquitectura del backend](./16-arquitectura-backend.md).

## Lo básico

**Base en producción:** `https://prometio-backend-production.up.railway.app`. Las rutas cuelgan directo de la raíz
(`/oportunidades`, `/cotizaciones/{id}`, ...), sin prefijo de versión.

**OpenAPI.** FastAPI genera el esquema, pero **en producción está apagado**: `docs_url`, `redoc_url` y `openapi_url`
son `None` cuando el backend detecta que corre en Railway (`app/main.py`), para no publicar el mapa completo de la API.
En local (`uvicorn app.main:app`) están en `/docs`, `/redoc` y `/openapi.json`. Esta página es la referencia pública.

**Autenticación.** Toda petición lleva el `access_token` de la sesión de Supabase:

```http
Authorization: Bearer <jwt de Supabase>
```

El backend verifica la firma (ES256, JWKS del proyecto), busca el `perfil` del usuario y decide por `equipo` y
`rol_ventas`. No hay API keys propias. Las excepciones están marcadas como **Público** en las tablas.

**Errores.** Formato de FastAPI:

```json
{ "detail": "Esta oportunidad no te pertenece" }
```

En los 422 de validación de Pydantic, `detail` es una lista de `{loc, msg, type}`. El frontend muestra `detail` tal
cual en un toast (ver [Arquitectura del frontend](./15-arquitectura-frontend.md#apierror-y-los-codigos-que-se-tratan-aparte)).
Un 500 nunca trae el detalle de la excepción: siempre `"Error interno del servidor"`; el detalle va al log.

### Códigos de estado

| Código | Cuándo |
|---|---|
| `200` / `201` / `204` | OK, creado, borrado sin cuerpo. `POST /seo/crawl` responde `202` (corre en segundo plano) |
| `401` | Falta el header, el token es inválido o expiró, o el usuario no tiene `perfil` |
| `403` | El rol no alcanza, el recurso es de otro vendedor, o "Tu cuenta está desactivada" (el frontend cierra la sesión) |
| `404` | El recurso no existe. También `GET /config/general` antes de crear la configuración |
| `409` | Conflicto de estado: una transición que otra petición ya aplicó, una acción no válida en el estado actual (enviar una cotización ya enviada), un duplicado, o borrar algo que está en uso (por ejemplo una categoría usada por servicios o líneas) |
| `422` | Validación: cuerpo mal formado o regla de negocio (falta `categoria_servicio_id` en una línea a medida, fechas inválidas, falta `configuracion_general`) |
| `429` | Límite de tasa superado. Trae `Retry-After` en segundos |
| `502` | Falló un servicio externo (IA, Apify, PageSpeed, Contífico, Storage) |
| `503` | hCaptcha no respondió al verificar el formulario web |

### Quién puede

| Etiqueta | Dependencia del backend | Equipos |
|---|---|---|
| Usuario | `get_current_perfil` | Cualquier perfil activo |
| Ventas | `require_acceso_ventas` | `administrativo`, `ventas` (vendedor y supervisor) |
| Sup/Admin | `require_supervisor_o_admin` | `administrativo`, supervisor de ventas |
| Admin | `require_admin` | `administrativo` |
| Marketing | `require_acceso_marketing` | `administrativo`, `marketing` |
| Proveedores | `require_admin_o_proveedores` | `administrativo`, `proveedores` |
| Público | ninguna | Sin sesión |

En los endpoints "Ventas", un **vendedor** solo ve y modifica lo suyo (oportunidades donde es `ejecutivo_id`, y todo lo
que cuelga de ellas); el filtro se aplica dentro del handler. Ver [Roles y permisos](./01-roles-permisos.md).

### Límites de tasa

| Endpoint | Límite | Por |
|---|---|---|
| `POST /formulario` | 10 cada 60 s | IP |
| `GET /cotizaciones/{id}/verificar` | 30 cada 60 s | IP |
| `GET /cotizaciones/{id}/pdf-cliente` | 20 cada 60 s | usuario |
| IA del Documento de Alcance (crear, auditar, regenerar sección) | 10 cada 300 s | usuario |
| `POST /seo/crawl`, `POST /seo/core-web-vitals` | 5 cada 300 s | usuario |

---

## Pipeline

### Oportunidades — `/oportunidades`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/oportunidades` | Ventas | Crear. Nace en Clasificación con el creador como ejecutivo; enriquece la empresa en segundo plano |
| GET | `/oportunidades` | Ventas | Listar (vendedor: solo las suyas). Incluye lead score |
| GET | `/oportunidades/{id}` | Ventas | Detalle |
| PATCH | `/oportunidades/{id}` | Ventas | Editar, mover de etapa, cerrar |
| POST | `/oportunidades/{id}/reasignar` | Sup/Admin | Cambiar el ejecutivo |
| POST | `/oportunidades/{id}/desactivar` | Sup/Admin | Baja lógica |
| POST | `/oportunidades/{id}/reactivar` | Sup/Admin | Revertir la baja |

### Alertas y timeline

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET | `/alertas` | Ventas | Oportunidades que superaron el umbral de su etapa (y las que escalan al supervisor), calculadas al vuelo |
| GET | `/timeline` | Ventas | Eventos comerciales |

---

## Cotizaciones

### Cotizaciones — `/cotizaciones`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/cotizaciones` | Ventas | Crear en borrador para una oportunidad |
| GET | `/cotizaciones` | Ventas | Listar |
| GET | `/cotizaciones/{id}` | Ventas | Detalle con el cálculo completo |
| GET | `/cotizaciones/{id}/versiones` | Ventas | Cadena de versiones |
| POST | `/cotizaciones/{id}/nueva-version` | Ventas | Nueva versión a partir de esta |
| POST | `/cotizaciones/{id}/duplicar` | Ventas | Cotización nueva e independiente sobre otra oportunidad (se valida contra la oportunidad destino) |
| GET | `/cotizaciones/{id}/preview-aprobacion` | Ventas | Qué líneas harían caer la cotización en preparación al enviarla |
| POST | `/cotizaciones/{id}/sugerir-lineas` | Ventas | Borrador de líneas con IA a partir de un texto libre (no guarda nada) |
| POST | `/cotizaciones/{id}/enviar` | Ventas | Enviar, o pasar a `preparacion` si requiere aprobación. Congela la tasa de impuesto |
| POST | `/cotizaciones/{id}/aprobar-preparacion` | Sup/Admin | Aprobar una cotización en preparación |
| POST | `/cotizaciones/{id}/rechazar-preparacion` | Sup/Admin | Devolverla al vendedor |
| POST | `/cotizaciones/{id}/marcar-aprobada` | Ventas | El cliente aceptó. Dispara el webhook `cotizacion.aprobada` |
| POST | `/cotizaciones/{id}/marcar-por-facturar` | Ventas | Aceptada pero todavía no facturable |
| POST | `/cotizaciones/{id}/marcar-facturada` | Ventas | Facturada, con `numero_factura` |
| POST | `/cotizaciones/{id}/marcar-rechazada` | Ventas | El cliente la rechazó |
| POST | `/cotizaciones/{id}/marcar-vencida` | Ventas | Venció |
| GET | `/cotizaciones/{id}/pdf-cliente` | Ventas | PDF sin costos ni márgenes |
| GET | `/cotizaciones/{id}/pdf-interno` | Ventas | PDF con el desglose (dueño, supervisor o admin) |
| GET | `/cotizaciones/{id}/verificar` | **Público** | Lo que abre el QR del PDF: número, estado, fecha y total |

### Líneas y costos

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/cotizaciones/{cotizacion_id}/lineas` | Ventas | Agregar línea. A medida (`servicio_id: null`) exige `categoria_servicio_id` |
| GET | `/cotizaciones/{cotizacion_id}/lineas` | Ventas | Listar |
| PATCH | `/cotizaciones/{cotizacion_id}/lineas/{id}` | Ventas | Editar (categoría solo en líneas a medida) |
| DELETE | `/cotizaciones/{cotizacion_id}/lineas/{id}` | Ventas | Borrar |
| POST | `/cotizaciones/{cotizacion_id}/lineas/{linea_id}/costos` | Ventas | Agregar un costo interno; recalcula `costo_proveedor` |
| GET | `/cotizaciones/{cotizacion_id}/lineas/{linea_id}/costos` | Ventas | Listar costos |
| PATCH | `/cotizaciones/{cotizacion_id}/lineas/{linea_id}/costos/{id}` | Ventas | Editar costo |
| DELETE | `/cotizaciones/{cotizacion_id}/lineas/{linea_id}/costos/{id}` | Ventas | Borrar costo |

Las transiciones de estado son atómicas: si dos peticiones compiten, una gana y la otra recibe `409`. Reglas del
cálculo en [Cotizaciones y motor de márgenes](./03-cotizaciones.md).

### Documento de Alcance

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/cotizaciones/{cotizacion_id}/documentos-alcance` | Ventas | Crear y generar el borrador con IA en segundo plano |
| GET | `/cotizaciones/{cotizacion_id}/documentos-alcance` | Ventas | Documentos de una cotización |
| GET | `/documentos-alcance/{id}` | Ventas | Detalle |
| PATCH | `/documentos-alcance/{id}` | Ventas | Editar contenido |
| POST | `/documentos-alcance/{id}/regenerar-seccion` | Ventas | Propuesta de IA para una sección (no guarda) |
| POST | `/documentos-alcance/{id}/auditar` | Ventas | Auditoría de IA contra la cotización |
| POST | `/documentos-alcance/{id}/enviar-aprobacion` | Ventas | Pasar a `pendiente_aprobacion` |
| POST | `/documentos-alcance/{id}/aprobar` | Sup/Admin | Aprobar y fijar el PDF |
| POST | `/documentos-alcance/{id}/rechazar` | Sup/Admin | Rechazar |
| POST | `/documentos-alcance/{id}/reabrir` | Ventas | Reabrir uno aprobado para editarlo (invalida la aprobación) |
| GET | `/documentos-alcance/{id}/versiones` | Ventas | Versiones |
| POST | `/documentos-alcance/{id}/nueva-version` | Ventas | Nueva versión |
| GET | `/documentos-alcance/{id}/pdf` | Ventas | PDF (el bucket es privado; se sirve con control de acceso) |
| GET | `/documentos-alcance/{id}/docx` | Ventas | Exportar a Word |
| POST | `/documentos-alcance/{id}/subir-docx` | Ventas | Subir el Word editado y leerlo de vuelta |

Ver [Documento de alcance](./04-documento-alcance.md).

---

## Post-venta y facturación

### Contratos de fee — `/contratos-recurrentes`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/contratos-recurrentes` | Ventas | Crear contrato |
| GET | `/contratos-recurrentes` | Ventas | Listar |
| GET | `/contratos-recurrentes/{id}` | Ventas | Detalle |
| PATCH | `/contratos-recurrentes/{id}` | Ventas | Editar |
| PUT | `/contratos-recurrentes/{id}/lineas` | Ventas | Reemplazar las líneas (solo afecta meses no generados) |
| POST | `/contratos-recurrentes/{id}/renovar` | Ventas | Extender la fecha de fin |
| POST | `/contratos-recurrentes/{id}/desactivar` | Sup/Admin | Baja lógica |
| POST | `/contratos-recurrentes/{id}/reactivar` | Sup/Admin | Revertir |
| GET | `/contratos-recurrentes/renovaciones` | Ventas | Contratos por vencer (ventana configurable) |
| GET | `/contratos-recurrentes/proyeccion` | Ventas | Proyección mensual del piso de facturación (opcional: sumar Contífico) |
| POST | `/contratos-recurrentes/generar-mes` | Ventas o cron | Generar las cotizaciones del mes. Acepta `X-Cron-Secret` en lugar de sesión. Idempotente |

### Facturas — `/facturas`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET | `/facturas` | Ventas | Facturas de Contífico (solo lectura) |
| GET | `/facturas/resumen` | Ventas | Totales sin IVA, separando "Medios" de "agencia" |

---

## Contactos, empresas y agenda

### Contactos — `/contactos`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/contactos` | Usuario | Crear |
| GET | `/contactos` | Usuario | Listar y buscar |
| GET | `/contactos/{id}` | Usuario | Detalle |
| PATCH | `/contactos/{id}` | Usuario | Editar |
| POST | `/contactos/{id}/enriquecer` | Ventas | Enriquecer con datos públicos (Apify) |
| POST | `/contactos/{id}/desactivar` | Admin | Baja lógica |
| POST | `/contactos/{id}/reactivar` | Admin | Revertir |

### Empresas — `/empresas`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/empresas` | Usuario | Crear. Webhook `empresa.creada` |
| GET | `/empresas` | Usuario | Listar |
| GET | `/empresas/{id}` | Usuario | Detalle |
| PATCH | `/empresas/{id}` | Usuario | Editar. Webhook `empresa.actualizada` |
| POST | `/empresas/{id}/enriquecer` | Usuario | Enriquecer (Apify) |
| POST | `/empresas/{id}/desactivar` | Usuario | Baja lógica |
| POST | `/empresas/{id}/reactivar` | Usuario | Revertir |

### Agenda

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/actividades` | Ventas | Crear actividad |
| GET | `/actividades` | Ventas | Listar (rango, vencidas, ...) |
| GET | `/actividades/{id}` | Ventas | Detalle |
| PATCH | `/actividades/{id}` | Ventas | Editar o reportar |
| DELETE | `/actividades/{id}` | Ventas | Borrar |
| POST | `/actividades/{id}/sincronizar-calendar` | Ventas | Reintentar la sincronización con Google Calendar |
| GET | `/calendario` | Ventas | Vista de calendario: actividades, cumpleaños y vencimientos |
| GET | `/cumpleanos-proximos` | Usuario | Cumpleaños de contactos en la ventana configurada |
| POST | `/google/conectar-calendar` | Ventas | Guardar el token de Google Calendar del vendedor |
| GET | `/google/estado-calendar` | Ventas | ¿Está conectado? |

---

## Bandeja y captación

### Conversaciones — `/conversaciones`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/conversaciones` | Usuario | Crear hilo |
| GET | `/conversaciones` | Usuario | Listar (admin y supervisor: todo; resto: lo suyo y lo no asignado) |
| GET | `/conversaciones/{id}` | Usuario | Detalle |
| POST | `/conversaciones/{id}/mensajes` | Usuario | Agregar mensaje |
| GET | `/conversaciones/{id}/mensajes` | Usuario | Mensajes del hilo |
| POST | `/conversaciones/{id}/reclamar` | Usuario | Tomar una conversación sin asignar |
| POST | `/conversaciones/{id}/reasignar` | Usuario (admin o supervisor) | Reasignar |
| POST | `/conversaciones/{id}/cerrar` | Usuario | Cerrar |
| POST | `/conversaciones/{id}/reabrir` | Usuario | Reabrir |
| POST | `/conversaciones/{id}/convertir` | Usuario | Convertir a contacto (acción explícita, nunca automática) |

### Formulario web (widget)

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET | `/formulario/marca` | **Público** | Colores, logo, textos e IDs públicos de tracking para el widget |
| GET | `/formulario/campos` | **Público** | Campos configurados |
| POST | `/formulario` | **Público** | Recibir un lead. hCaptcha + honeypot + límite de tasa. Devuelve `lead_creado` |

Estas tres rutas aceptan cualquier origen (CORS abierto solo para ellas). Ver [Bandeja y formulario web](./07-bandeja-formulario.md).

### Prospección en LinkedIn — `/prospeccion-linkedin`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/prospeccion-linkedin/buscar` | Ventas | Correr los criterios activos (con enfriamiento) |
| POST | `/prospeccion-linkedin/buscar-empresa` | Ventas | Buscar personas de una empresa puntual |
| GET | `/prospeccion-linkedin/criterios/resumen` | Ventas | Rendimiento por criterio |
| GET | `/prospeccion-linkedin/leads` | Ventas | Leads encontrados |
| PATCH | `/prospeccion-linkedin/leads/{id}` | Ventas | Cambiar estado |
| POST | `/prospeccion-linkedin/leads/{id}/investigar` | Ventas | Resumen y mensaje sugerido con IA |
| POST | `/prospeccion-linkedin/leads/{id}/convertir` | Ventas | Convertir en contacto |

---

## Tableros

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET | `/inicio` | Ventas | Pantalla de Bienvenida |
| GET | `/inicio/sugerencias` | Ventas | Sugerencias de IA (cacheadas; `refrescar=true` fuerza) |
| GET | `/resumen` | Usuario | Conteos del resumen |
| GET | `/resumen/series` | Usuario | Series diarias (30 días por defecto) |
| GET | `/dashboard/kpis` | Ventas | KPIs comerciales |
| GET | `/dashboard/detalle/{tarjeta}` | Ventas | Oportunidades detrás de una tarjeta |
| GET | `/dashboard/tv-financiero` | Ventas | Datos financieros para `/tv` (consulta Contífico) |
| GET | `/metas-comerciales` | Sup/Admin | Listar metas |
| POST | `/metas-comerciales` | Sup/Admin | Crear meta |
| GET | `/metas-comerciales/{id}` | Sup/Admin | Detalle |
| PATCH | `/metas-comerciales/{id}` | Sup/Admin | Editar |
| DELETE | `/metas-comerciales/{id}` | Sup/Admin | Borrar |

---

## Marketing

### SEO — `/seo`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/seo/crawl` | Marketing | Iniciar crawl (`202`) |
| GET | `/seo/crawls` | Marketing | Listar |
| GET | `/seo/crawls/{id}` | Marketing | Detalle |
| POST | `/seo/core-web-vitals` | Marketing | Medir con PageSpeed |
| GET | `/seo/core-web-vitals` | Marketing | Mediciones |
| GET | `/seo/informe-pdf` | Marketing | Informe SEO en PDF |

---

## Catálogos y configuración

### Servicios — `/servicios`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/servicios` | Admin | Crear (borrador) |
| GET | `/servicios` | Usuario | Listar |
| GET | `/servicios/{id}` | Usuario | Detalle |
| PATCH | `/servicios/{id}` | Admin | Editar o activar |
| POST | `/servicios/{id}/archivar` | Admin | Archivar |
| GET | `/servicios/{id}/historial-precios` | Ventas | Precios facturados en Contífico |
| GET | `/servicios/{id}/sugerencia-precio` | Ventas | Precio sugerido por cotizaciones ganadas propias |

### Proveedores — `/proveedores`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET | `/proveedores` | Usuario | Listar |
| GET | `/proveedores/{id}` | Usuario | Detalle |
| POST | `/proveedores` | Proveedores | Crear |
| PATCH | `/proveedores/{id}` | Proveedores | Editar |
| DELETE | `/proveedores/{id}` | Proveedores | Borrar |
| POST | `/proveedores/{id}/desactivar` | Proveedores | Baja lógica |
| POST | `/proveedores/{id}/reactivar` | Proveedores | Revertir |

### Organización — `/organizacion`

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET | `/organizacion` | Usuario | Nombre, logos y colores de marca |
| PATCH | `/organizacion` | Admin | Editar |
| POST | `/organizacion/logo` | Admin | Subir logo |
| POST | `/organizacion/logo-oscuro` | Admin | Subir logo para fondo oscuro |

### Panel de Configuración — `/config`

Lectura: Usuario. Escritura: Admin. Salvo donde se indica, cada catálogo tiene el CRUD completo
(`GET` lista, `POST`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`).

| Recurso | Ruta | Notas |
|---|---|---|
| Tarifas internas | `/config/tarifas-internas` | |
| Causas de pérdida | `/config/causas-perdida` | |
| Tipos de documento | `/config/tipos-documento` | Más `POST /{id}/plantilla` (subir archivo) |
| Categorías de servicio | `/config/categorias-servicio` | `POST` exige `nombre` y `pilar`. `DELETE` responde 409 si está en uso |
| Criterios de LinkedIn | `/config/linkedin-criterios-busqueda` | Sin `GET /{id}` |
| Campos del formulario | `/config/formulario-campos` | |
| Mapeo producto Contífico → pilar | `/config/contifico-producto-pilar` | |
| Clientes "Medios" | `/config/clientes-medios` | Solo `GET`, `POST`, `DELETE /{id}` |
| Asignación geográfica | `/config/asignacion-geografica` | Sin `GET /{id}` |
| Etapas del pipeline | `/config/etapas-pipeline` | Solo `GET` y `PATCH /{id}` (las 9 etapas son fijas) |
| Configuración general | `/config/general` | `GET` (404 si no existe), `POST` (409 si ya existe), `PATCH` |

Solo admin, también para leer:

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/config/formulario-meta` | Si Meta y GA4 están configurados (nunca devuelve los secretos) |
| GET / POST / PATCH | `/config/ads-tracking` | Credenciales de Meta CAPI y GA4 |
| POST | `/config/ads-tracking/meta/probar` | Evento de prueba a Meta |
| POST | `/config/ads-tracking/ga4/probar` | Validación contra el endpoint de debug de GA4 |
| GET | `/config/ads-tracking/eventos` | Log de envíos (paginado) |
| CRUD | `/config/organizacion-webhooks` | Webhooks salientes |

---

## Personas y operación

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET | `/perfiles/me` | Usuario | Mi perfil |
| PATCH | `/perfiles/me` | Usuario | Editar mis datos (no equipo, rol ni estado) |
| GET | `/perfiles` | Usuario | Directorio (filtro por `equipo`) |
| POST | `/perfiles/invitar` | Admin | Invitar por email con equipo y rol |
| GET | `/perfiles/{id}` | Admin | Detalle |
| PATCH | `/perfiles/{id}` | Admin | Cambiar equipo, rol, datos |
| POST | `/perfiles/{id}/desactivar` | Admin | Desactivar, banear en Supabase Auth y borrar sus sesiones |
| POST | `/perfiles/{id}/reactivar` | Admin | Reactivar |
| GET | `/auditoria` | Admin | Registro de auditoría |
| GET | `/salud` | Admin | Estado y latencia de Railway, Vercel, Supabase (base y Storage), WeasyPrint, Basecamp, Apify y Resend |
| POST | `/basecamp/conectar` | Ventas | Canjear el código OAuth de Basecamp (el secreto queda en el backend) |
| GET | `/basecamp/estado` | Ventas | ¿Está conectado? |

## Webhooks entrantes y sistema

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/webhooks/resend` | Firma Svix | Eventos de Resend; sincroniza `elegible_marketing` |
| GET | `/health` | **Público** | Latido para Railway: `{"status": "ok"}` |

Los webhooks **salientes** (lo que prometIO envía a BackIO y otros destinos) están descritos en
[Arquitectura del backend](./16-arquitectura-backend.md#_8-lo-que-corre-fuera-de-la-peticion).

Relacionado: [Modelo de datos](./17-modelo-datos.md), [Integraciones](./11-integraciones.md),
[Seguridad](./14-seguridad.md).
