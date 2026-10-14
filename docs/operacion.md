# Operar prometIO: cuando algo falla

> Revisado contra el código el 13/10/2026.

Esta página es para mantener prometIO andando: dónde mirar primero, qué corre solo y qué hacer ante cada síntoma
conocido. Casi todo error que ves en la app es un mensaje del backend (`detail`) mostrado tal cual en un aviso; leerlo
con atención suele ahorrar la mitad del diagnóstico.

## Dónde mirar primero

| Lugar | Qué muestra | Cuándo |
|---|---|---|
| **Salud del sistema** (`/salud`, solo equipo administrativo) | Estado y latencia de cada servicio del que depende prometIO (ver abajo) | Siempre, como primer vistazo |
| **Auditoría** (`/auditoria`, solo equipo administrativo) | Quién hizo qué y cuándo, con filtros y los eventos con error contados aparte | Para saber quién cambió algo |
| **Consola del navegador** (DevTools) | Errores de CSP, de CORS y de red | Cuando una pantalla queda vacía o un botón «no hace nada» |
| **Logs de Railway** | Una línea por petición y los errores del backend, con secretos redactados | Para seguir lo que pasó del lado del servidor |
| **Pestaña Actions de GitHub** | El CI de cada repo y la corrida mensual de contratos | Si un despliegue o la tarea mensual no se ve reflejada |
| **Sentry** | Errores del navegador y del servidor, sin datos personales | Pendiente: los dos DSN todavía no están cargados (ver [Seguridad](./14-seguridad.md#pendiente-hoy)) |

Los logs de Railway se pueden leer desde la terminal, en la raíz de `prometio-backend` con el proyecto ya vinculado:

```bash
railway logs --lines 200   # últimas 200 líneas
railway logs               # en vivo
```

Por qué así: el backend nunca devuelve el detalle interno de una excepción en la respuesta HTTP (lección de un
incidente del 21/08/2026). Ese detalle solo vive en los logs del servidor.

## Salud del sistema

`/salud` llama a `GET /salud` en el backend, que revisa cada servicio en el momento. La clasificación depende solo de
cuánto tardó en responder:

| Estado | Regla |
|---|---|
| Operativo | Respondió en menos de 1 s |
| Degradado | Respondió entre 1 y 5 s |
| Caído | Tardó 5 s o más, o falló la conexión. Nunca se muestra el detalle del error |

| Servicio | Qué se revisa | Si aparece caído |
|---|---|---|
| `railway` | Nada externo: si la pantalla carga, el backend está arriba. Siempre sale operativo | Si Railway estuviera caído, `/salud` directamente no respondería |
| `vercel` | Que `https://prometio.vercel.app` responda | Revisa el estado del despliegue en Vercel |
| `supabase-db` | Que responda la API REST del proyecto de Supabase | Login, perfiles y todos los datos fallan. Revisa el estado del proyecto en Supabase |
| `supabase-storage` | Que responda el almacenamiento de archivos | Logos, adjuntos y PDF de documentos de alcance fallan |
| `weasyprint` | Que el backend pueda generar un PDF de prueba dentro del contenedor | No salen PDF de cotización ni de documento de alcance. Ver [PDF](#no-se-genera-el-pdf) |
| `basecamp` | Que responda el servidor de autorización de Basecamp | No depende de que algún vendedor esté conectado; solo mide si el servicio está disponible |
| `apify` | Que responda la API de Apify (sin gastar cuota) | Fallan el enriquecimiento de empresas y contactos y la prospección en LinkedIn |
| `resend` | Que responda la API de Resend | Pueden no llegar los eventos del webhook de correo |

El servidor MCP no aparece a propósito: corre en la máquina de cada usuario y no tiene una URL que el backend pueda
consultar.

## Auditoría

`/auditoria` lista el registro de acciones del backend. Filtros: **Usuario**, **Acción** (por ejemplo
`oportunidad.desactivar`), **Entidad** (por ejemplo `oportunidad`), **Desde** y **Hasta**. Arriba muestra el total
filtrado, cuántos fueron exitosos y cuántos con error. Si ningún registro pasa los filtros, sale un estado vacío, no
una tabla en blanco.

## Lo que corre solo

prometIO no tiene un scheduler propio. Hay una sola tarea programada:

| Cuándo (hora de Ecuador) | Qué hace | Dónde vive |
|---|---|---|
| Día 1 de cada mes, 06:00 | Crea la cotización del mes de cada contrato de fee recurrente activo | `.github/workflows/generar-cotizaciones-contratos.yml` en `prometio-backend` |

El workflow llama a `POST /contratos-recurrentes/generar-mes` con la cabecera `X-Cron-Secret`. Cada cotización nace en
`por_facturar` (el contrato ya es la aprobación del cliente) y por eso no dispara el webhook de cotización aprobada.

- **Es idempotente.** Un índice único impide duplicar un mes, así que reintentar o correrlo dos veces es seguro.
- **Si algún contrato falla**, el job queda en rojo y GitHub avisa por correo. El resumen del job dice cuántas se
  generaron, cuántas ya existían y cuántos errores hubo.
- **Para recuperar un mes atrasado:** Actions → «Generar cotizaciones mensuales de contratos» → «Run workflow», con
  `periodo` en formato `AAAA-MM-DD` (cualquier día del mes). Vacío genera el mes en curso.
- **Sin el workflow:** en la app, el botón «Generar mes» hace lo mismo con la sesión de un usuario de administración
  o ventas. Un vendedor solo genera sus propios contratos.

El secreto `CRON_SECRET` tiene que tener **el mismo valor** en dos lugares: la variable del servicio en Railway y el
secreto del repositorio en GitHub (Settings → Secrets and variables → Actions). Si rotas uno, rota el otro.

| Síntoma en el job | Causa |
|---|---|
| `Falta el secreto CRON_SECRET en GitHub` | No está cargado el secreto del repositorio |
| 403 `Secreto de cron inválido o no configurado` | Railway no tiene `CRON_SECRET` o los dos valores no coinciden |
| `periodo debe tener formato AAAA-MM-DD` | El `periodo` manual está mal escrito |
| Job en rojo con errores en el resumen | Uno o más contratos fallaron; los demás sí se generaron. Revisa los logs de Railway y vuelve a correrlo |

## Síntomas y qué hacer

### Errores de la API por código

El frontend muestra el `detail` del backend en un aviso. Esta tabla dice qué suele significar cada código.

| Código | Qué ves | Causa probable | Qué revisar |
|---|---|---|---|
| **401** | `Token inválido o expirado`, `Falta el header Authorization` | La sesión venció o no se envió | Cerrar sesión y volver a entrar. Si pasa con todos los usuarios, revisar que el backend apunte al mismo proyecto de Supabase que el frontend |
| **401** | `No existe un perfil para este usuario` | El usuario existe en Auth pero no tiene fila en `perfil` | El trigger que crea el perfil necesita que exista la fila de `organizacion`. Ver [Setup](./12-setup.md) |
| **403** | `Tu cuenta está desactivada` | Un administrador desactivó la cuenta | La app cierra la sesión sola y muestra un único aviso. Reactivar desde Usuarios si fue un error |
| **403** | `Requiere equipo administrativo`, `Requiere acceso al módulo de Ventas`, `Esta oportunidad no te pertenece` | El equipo o rol del usuario no permite esa acción | Equipo y rol de la persona en Usuarios. Ver [Roles y permisos](./01-roles-permisos.md) |
| **409** | El `detail` del backend y la pantalla se recarga | Otra petición ya cambió el estado (por ejemplo, alguien envió la cotización un segundo antes) | Nada que arreglar: revisar el estado nuevo y repetir si hace falta |
| **422** | Mensaje de validación del backend | Datos inválidos: una URL que no es https, una línea a medida sin categoría, un SVG de logo con scripts, un captcha inválido | Corregir el dato. Si el mensaje no se entiende, buscar el texto en el backend |
| **429** | «Hiciste muchas solicitudes seguidas. Probá de nuevo en N s.» | Límite de tasa del backend (ver [Seguridad](./14-seguridad.md#limites-de-tasa)) | Esperar los segundos que indica |
| **502** | `Contífico rechazó la consulta`, `No se pudo enriquecer…`, `Falló el asistente de IA…` | Falló un servicio externo | Ver la integración correspondiente abajo |
| **503** | En el formulario web: «No pudimos verificar el captcha ahora» | hCaptcha no respondió | Esperar y reenviar; el widget reinicia el captcha solo |

### No puedo entrar

| Síntoma | Causa | Qué hacer |
|---|---|---|
| «Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno.» | El build no tiene las variables de Supabase | Cargarlas en Vercel (o en `.env` en local) y volver a desplegar |
| «Correo o contraseña incorrectos.» | Credenciales mal escritas | Recuperar la contraseña |
| «Confirma tu correo antes de iniciar sesión.» | La cuenta no confirmó el correo | Abrir el enlace de invitación o de confirmación |
| Entra y sale enseguida con «Tu cuenta está desactivada» | Cuenta desactivada | Reactivar desde Usuarios |
| Entra pero no ve ningún módulo | El perfil quedó con el equipo por defecto o sin acceso | Ajustar equipo y rol en Usuarios |
| Login con Google vuelve al login con error | Google rechazó el permiso o el callback no completó | Repetir el login; si persiste, revisar el proveedor Google en Supabase Auth |

### Errores de CSP en la consola

El mensaje empieza con «Refused to connect» o menciona «Content Security Policy».

La CSP del CRM (en `vercel.json`) solo deja conectar con el propio sitio, el backend de Railway, Supabase y el ingest
de Sentry. Si cambiaste la URL del backend (`VITE_API_URL`) o el proyecto de Supabase sin tocar la CSP, el navegador
bloquea las peticiones.

1. Copia el host bloqueado del mensaje de la consola.
2. Si es legítimo, agrégalo a `connect-src` en la regla que corresponda de `vercel.json` y vuelve a desplegar.
3. Si es un script (`script-src`), no agregues `'unsafe-inline'`: el CRM no tiene scripts inline a propósito. El
   tema oscuro se aplica desde `public/theme-init.js` por eso mismo.

El formulario web (`/formulario-demo` y `/widget/`) tiene su propia CSP, que además permite hCaptcha y Google Fonts.

### Errores de CORS en la consola

El backend solo acepta los orígenes de `CORS_ALLOW_ORIGINS`. En producción descarta cualquier origen que no sea
https, así que `http://127.0.0.1:5173` y `http://localhost:5173` solo funcionan contra un backend en modo desarrollo.

- **En local contra Railway:** usa el proxy (`DEV_API_PROXY_TARGET`), no `VITE_API_URL`. Con el proxy el navegador
  habla con Vite y no hay CORS de por medio. Ver [Setup](./12-setup.md).
- **Un dominio nuevo del frontend:** agrégalo a la lista en Railway. Se agrega, nunca se reemplaza.
- El endpoint público `POST /formulario` acepta cualquier origen a propósito: lo usan sitios de terceros.

### Contífico da error

| Síntoma | Causa | Qué hacer |
|---|---|---|
| 502 `Contífico rechazó la consulta: …` en facturas o historial de precios | Contífico respondió con error. El texto que sigue es el de Contífico | Revisar `CONTIFICO_API_KEY` en Railway (va la clave cruda, sin `Bearer`) y el estado de la cuenta |
| 422 `Este servicio no tiene un producto de Contífico mapeado` | El servicio no tiene `contifico_producto_id` | Mapearlo en la configuración del servicio |
| Dashboard TV financiero sin datos de facturación | Mismo 502 de Contífico | Igual que la primera fila |
| 502 «Contífico no respondió» | Timeout o caída de red hacia Contífico | Reintentar; si persiste, revisar el estado de Contífico |
| La meta de agencia dice «No disponible» | Contífico no respondió al calcular lo facturado. El resto del Dashboard sigue andando | Reintentar más tarde |
| Aviso «puede faltar facturación» o «incompleto» | Más de unos 3.000 documentos en el rango: el backend lee hasta 30 páginas | Achicar el rango de fechas en Facturas |

prometIO solo **consulta** Contífico (API v2). La emisión de facturas no está construida.

### Basecamp o Google Calendar no conectan

La conexión se hace desde **Mi cuenta**. El navegador recibe un código y el backend hace el intercambio; los secretos
nunca pasan por el navegador.

| Síntoma | Causa | Qué hacer |
|---|---|---|
| «Basecamp no devolvió el código de autorización.» o «La autorización de Basecamp no es válida» | El redirect llegó incompleto o fuera de flujo | Volver a conectar desde Mi cuenta |
| «Basecamp rechazó la conexión» / 422 `code inválido o rechazado por Basecamp` | El código expiró o la app OAuth no coincide | Revisar que `VITE_BASECAMP_CLIENT_ID` (Vercel) y `BASECAMP_CLIENT_ID`/`BASECAMP_CLIENT_SECRET` (Railway) sean de la misma integración. Local y producción son integraciones distintas |
| Error 500 sin detalle en cualquier acción de Basecamp | Faltan las variables `BASECAMP_*` en Railway | Cargarlas. Son opcionales para que su ausencia no tumbe el resto del backend |
| «Google no devolvió el permiso de Calendar» | El usuario no aceptó el permiso de Calendar | Volver a conectar y aceptar el consentimiento completo |
| 422 `refresh_token inválido o rechazado por Google` | El permiso fue revocado o venció | Volver a conectar desde Mi cuenta |
| 502 al guardar una actividad con Calendar | Falló la sincronización con Google | El aviso trae el error de sincronización; reconectar si es de permisos |

### No se genera el PDF

Los PDF de cotización y de documento de alcance los genera el backend con WeasyPrint, que necesita librerías nativas
(Pango y HarfBuzz).

| Dónde | Síntoma | Qué hacer |
|---|---|---|
| Producción | `weasyprint` caído en `/salud` | Revisar los logs de Railway. El `Dockerfile` instala `libpango-1.0-0`, `libpangoft2-1.0-0` y `libharfbuzz-subset0`; si alguien cambió la imagen, puede faltar alguna |
| Producción | 502 «No se pudo obtener el PDF en este momento» al abrir un documento de alcance aprobado | El backend no pudo descargar el archivo del bucket. Revisar `supabase-storage` en `/salud` |
| Producción | 429 al descargar el PDF para el cliente | Límite de 20 por minuto por usuario. Esperar |
| Local en macOS | `OSError: cannot load library 'libgobject-2.0-0'` | Correr el backend con `DYLD_LIBRARY_PATH=/opt/homebrew/lib`. Ver [Setup](./12-setup.md#pdf-en-macos) |

### El formulario web no envía

| Síntoma | Causa | Qué hacer |
|---|---|---|
| 503 «captcha no configurado en el servidor» | Falta `HCAPTCHA_SECRET_KEY` en Railway | Cargar la clave |
| 422 «Captcha inválido» en todos los envíos | El dominio del sitio no está en `HCAPTCHA_HOSTNAMES`, o la clave no es la del sitio | Agregar el dominio (separados por coma) o revisar la clave |
| 503 «No pudimos verificar el captcha ahora» | hCaptcha no respondió | El widget reinicia el captcha y vuelve a habilitar «Enviar». Reintentar |
| 429 | Más de 10 envíos por minuto desde la misma IP | Esperar |
| El widget no carga en `/formulario-demo` | CSP de esa ruta | Revisar la consola; la regla de `vercel.json` para `/formulario-demo` y `/widget/` es aparte |
| La oportunidad se crea pero no llega el correo al vendedor | Falta `RESEND_API_KEY` en Railway. El envío falla sin afectar al lead | Cargar la clave |

### La IA da error

El borrador y el auditor del documento de alcance y el asistente de cotización usan `ANTHROPIC_API_KEY`. Sin la
clave, la generación falla de forma controlada y el resto del backend sigue sano. Un 502 «Falló el asistente de IA»
trae el motivo; si habla de la clave o del modelo, revisa la variable en Railway. Las funciones de IA del documento
de alcance tienen un límite de 10 llamadas cada 5 minutos por usuario.

### Sentry no muestra nada

Es lo esperado hoy. El frontend solo inicia Sentry si existe `VITE_SENTRY_DSN` y el backend si existe `SENTRY_DSN`;
ninguno está cargado todavía. Mientras tanto, si un error de render tumba la app, aparece una pantalla con
«Recargar» en lugar de quedar en blanco, con o sin DSN.

### El frontend no se actualizó después de un cambio

1. Mira el CI en la pestaña Actions del repo. Si `lint`, `tsc` o el build fallan, el cambio no está listo.
2. Mira el despliegue en el panel de Vercel.
3. Si cambiaste una variable `VITE_*` en Vercel, hay que volver a desplegar: se fijan al compilar.

## Variables de entorno

Las listas completas, con comentarios, están en `.env.example` de cada repo. El detalle de cuáles son obligatorias
está en [Setup](./12-setup.md#variables-del-backend) y dónde se cargan en producción, en
[Despliegue](./13-despliegue.md).
