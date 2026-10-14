# 10 · Agenda: actividades, calendario, alertas y Bienvenida

> Revisado contra el código el 13/10/2026.

La agenda es todo lo que le dice a un vendedor **qué hacer y cuándo**: las actividades que programó o
reportó, el calendario del período, las oportunidades que se enfriaron, los cumpleaños de sus
contactos y, al entrar, un resumen del día con sugerencias.

Todas estas pantallas son del área de Ventas (`administrativo` y `ventas`). Un vendedor ve lo suyo;
`administrativo` y supervisores ven al equipo.

| Pantalla | Ruta | Para qué |
|---|---|---|
| Bienvenida | `/` | El día en el CRM: próximas actividades, cotizaciones por vencer, alertas, meta y sugerencias |
| Actividades | `/agenda/actividades` | Lista de actividades en un rango, con filtros |
| Calendario | `/agenda/calendario` | Actividades, cumpleaños y vencimientos en una vista de mes, semana o agenda |
| Timeline | `/agenda/timeline` | Feed de lo que pasó en el equipo |
| Alertas | `/alertas` | Oportunidades estancadas |
| Cumpleaños | `/cumpleanos` | Próximos cumpleaños de contactos |

## Actividades

Una actividad es un contacto comercial con un cliente: algo que se va a hacer (**programada**) o que ya
se hizo (**reportada**).

### Tipos

| Tipo | Sincroniza con Google Calendar |
|---|---|
| Llamada | No |
| WhatsApp | No |
| Visita | Sí |
| Videollamada | Sí, con link de Meet |
| Email | No |
| Tarea interna | No |

El ícono y el color de cada tipo se definen en un único catálogo (`src/lib/actividad-visual.ts`).

### Validación

El backend exige:

- **Al menos uno de** contacto u oportunidad.
- **Al menos una de** fecha programada o fecha reportada.
- **Notas (feedback) obligatorias si hay fecha reportada.** Una actividad hecha sin nada que contar no
  aporta al seguimiento.

El responsable es siempre quien la crea. Un vendedor solo puede registrar actividades sobre
oportunidades propias, y solo ve, edita o borra las suyas.

### Programar y reportar

Programar y reportar se hacen desde la ficha de la oportunidad (sección Actividades), no desde la agenda.

| Acción | Qué guarda |
|---|---|
| **Programar** | Tipo y fecha programada |
| **Reportar** | Fecha reportada y notas. Se puede reportar una programada o registrar una directamente como hecha |

Reportar tiene efectos:

- Actualiza `oportunidad.fecha_ultima_actividad` (solo hacia adelante: una actividad reportada con fecha
  anterior no la hace retroceder). Esa fecha es la que miden las [alertas](#alertas) y el
  [dashboard](./06-dashboard.md).
- Registra `actividad_reportada` en el [Timeline](#timeline), solo la primera vez que pasa de no
  reportada a reportada.

Al borrar una actividad, la fecha de última actividad de la oportunidad se recalcula con las que quedan.

### Pantalla Actividades

Rango Desde / Hasta y filtros por responsable (solo equipo), tipo, contacto y estado (programada o
reportada). Una actividad entra en el rango si su fecha **programada o** su fecha **reportada** cae dentro,
en hora de Ecuador. Es el mismo criterio que "Actividades por vendedor" del
[Dashboard](./06-dashboard.md), para que los números coincidan.

### Google Calendar y Meet

Cada vendedor conecta **su propio** Google Calendar desde **Cuenta** (`/cuenta`). No hay una cuenta de
servicio de la empresa: el evento se crea en el calendario de quien es responsable de la actividad.

Cuando una actividad de tipo **visita** o **videollamada** tiene fecha programada y su responsable tiene
Calendar conectado:

- se crea un evento de 60 minutos en su calendario principal, titulado con el tipo de actividad;
- si es videollamada, Google genera un link de **Meet**, que queda guardado en la actividad;
- si después se cambia la fecha programada, se mueve el evento.

La sincronización es **best-effort**: si Google falla, la actividad se guarda igual y queda con el error
de sincronización visible. Desde la lista se puede reintentar con **Sincronizar**. Si el responsable no
conectó Calendar, no es un error: la actividad simplemente no se sincroniza.

Detalle técnico del permiso en [Integraciones](./11-integraciones.md#google-calendar-y-meet).

## Calendario

`/agenda/calendario` junta en un mismo período tres tipos de evento:

| Evento | Origen | Fecha que usa |
|---|---|---|
| Actividad | Las actividades del usuario (mismo alcance y criterio de rango que Actividades) | La reportada si existe; si no, la programada |
| Cumpleaños | Contactos activos con fecha de nacimiento | El próximo cumpleaños (29 de febrero cae el 28 en años no bisiestos) |
| Vencimiento de cotización | Cotizaciones en estado `enviada` | `valido_hasta` |

Tres vistas: **Mes**, **Semana** y **Agenda** (lista). En pantallas chicas abre en Agenda.

En el calendario la ventana de cumpleaños es el propio rango visible, no los días de anticipación
configurados.

## Timeline

`/agenda/timeline` es el feed del equipo, los últimos 100 eventos, agrupados por día y filtrables por tipo
y por persona.

| Evento | Cuándo se registra |
|---|---|
| `actividad_reportada` | Una actividad pasa a reportada |
| `oportunidad_cierre_ganado` | Una oportunidad pasa a cierre ganado (incluida la que crea un contrato) |
| `oportunidad_cierre_perdido` | Una oportunidad pasa a cierre perdido |
| `cotizacion_aprobada` | Una cotización se marca aprobada |
| `lead_convertido` | Una conversación de la bandeja se convierte en contacto |
| `oportunidad_asignada_automatica` | Una conversión crea una oportunidad con asignación automática |

**Montos.** Los eventos de cierre ganado y cotización aprobada llevan un monto. Un vendedor ve el feed
del equipo, pero el monto solo aparece en los eventos de sus propias oportunidades: el timeline no puede
mostrar un dato que el resto del sistema le restringe.

El mismo feed alimenta "Actividad reciente" del [Panel TV](./06-dashboard.md#panel-tv).

## Alertas

`/alertas` lista las oportunidades activas que llevan demasiado tiempo sin movimiento para su etapa.

```
horas sin movimiento = ahora − (fecha_ultima_actividad, o created_at si nunca tuvo actividad)
```

| Estado | Condición |
|---|---|
| `alerta` | horas ≥ umbral de la etapa |
| `escalada` | horas ≥ umbral × multiplicador de escalamiento |

El umbral es por etapa (`etapa_pipeline.umbral_alerta_horas`, editable en Configuración → Etapas). Una
etapa sin umbral nunca genera alertas. El multiplicador es `configuracion_general.multiplicador_escalamiento_supervisor`.

Lo que cuenta como movimiento es una **actividad reportada**, no un cambio de etapa ni una edición. Así
la alerta mide contacto real con el cliente.

## Cumpleaños

`/cumpleanos` lista los contactos activos cuyo próximo cumpleaños cae dentro de los días de anticipación
configurados (`configuracion_general.dias_anticipacion_cumpleanos`, 7 por defecto), ordenados por
cercanía, con la edad que cumplen. El "hoy" se calcula en hora de Ecuador: el servidor corre en UTC y,
sin esa corrección, entre las 19:00 y las 23:59 tomaría el día siguiente.

## Bienvenida

Es la pantalla de inicio para `administrativo` y `ventas` (`/`). Tiene dos partes.

### El día

Cuatro bloques, cada uno con enlace a su pantalla:

| Bloque | Contenido |
|---|---|
| Actividades próximas | Programadas y todavía sin reportar en los próximos 7 días |
| Cotizaciones por vencer | Enviadas con `valido_hasta` en los próximos 7 días |
| Alertas | Las mismas de [Alertas](#alertas) |
| Meta vs. venta | La meta vigente y su avance, mismo cálculo que el [Dashboard](./06-dashboard.md#_2-meta-comercial) |

### Sugerencias

Una tarjeta con hasta **5 sugerencias** de en qué enfocarse hoy. Siguen la regla de toda la app: **las
reglas deciden los candidatos, la IA solo elige y redacta**.

Candidatos y su puntaje de urgencia:

| Candidato | Condición | Puntaje |
|---|---|---|
| Cotización por vencer | Enviada que vence en ≤ 7 días | 95 si ≤ 2 días, 85 si ≤ 4, 70 si más |
| Oportunidad estancada | Está en Alertas | 90 escalada, 75 alerta |
| Actividad vencida | Programada en los últimos 30 días y sin reportar | 80 + días de atraso, máximo 88 |
| Oportunidad caliente | Abierta, lead score ≥ 70 y 3 días o más sin actividad | 72 |
| Lead de LinkedIn prioritario | Los 3 leads nuevos con mayor prioridad | 60 + prioridad / 2, máximo 92 |
| Cotización por aprobar | Solo equipo: en `preparacion` | 88 |
| Documento por aprobar | Solo equipo: documento de alcance pendiente de aprobación | 82 |
| Meta atrasada | Avance de la meta más de 15 puntos por debajo del % del período transcurrido | 60 |

Se queda a lo sumo un candidato por oportunidad (el de mayor puntaje). Los 12 más urgentes van al modelo,
que elige hasta 5 y escribe título, motivo, acción y, si corresponde contactar al cliente, un mensaje
sugerido en "usted". El backend descarta cualquier sugerencia que no corresponda a un candidato real.

**Si la IA falla**, se muestran los candidatos con textos de plantilla y la tarjeta lo indica. Ese
resultado no se guarda, así que el próximo refresco vuelve a intentar con IA.

**Caché.** Las sugerencias se guardan por usuario. Si se generaron hoy hace menos de 30 minutos, se
sirven sin recalcular nada. Si los candidatos no cambiaron, se reutilizan hasta 8 horas. **Actualizar**
fuerza una nueva generación. La fecha forma parte de la huella porque los textos dicen "vence en 3 días":
al cambiar el día se regeneran.

Las sugerencias se piden aparte del resto de la Bienvenida para que la espera de la IA no frene la
pantalla.
