# 06 · Dashboard, Resumen y Panel TV

> Revisado contra el código el 13/10/2026.

prometIO tiene tres tableros, cada uno para una pregunta distinta:

| Tablero | Ruta | Pregunta que responde | Quién |
|---|---|---|---|
| Dashboard | `/dashboard` | ¿Cómo va la venta y cuánto vamos a facturar contra la meta? | `administrativo` y `ventas` |
| Resumen | `/resumen` | ¿Cuánto volumen tiene el CRM (contactos, empresas, conversaciones)? | `administrativo` y `ventas` |
| Panel TV | `/tv` | ¿Qué está pasando ahora? Pensado para una pantalla en la oficina | `administrativo` y `ventas` |

Todos los montos son **sin IVA**. "Valor efectivo" de una oportunidad es siempre el mismo criterio:
`valor_cotizado` si existe, si no `valor_referencial` (ver [Pipeline](./02-pipeline.md)).

## Alcance por rol

El dashboard respeta la misma regla que el resto del módulo de Ventas:

| Rol | Ve |
|---|---|
| `administrativo` y supervisor de ventas | Todo el equipo. Meta de agencia y metas por vendedor. Ranking de vendedores |
| Vendedor | Solo sus oportunidades, cotizaciones y actividades. Solo su meta individual, nunca la de agencia ni la de compañeros |

Solo cuentan oportunidades **activas** (`activo = true`).

## Rango de fechas

Arriba hay un filtro Desde / Hasta. **Aplica solo a "Actividades por vendedor".** Los KPIs, el
pipeline, las cotizaciones y las metas muestran siempre el estado actual del CRM, y la facturación
tiene su propio selector de mes. El texto bajo el filtro lo dice, para que nadie lea un KPI como si
estuviera filtrado.

## Bloques del Dashboard

En orden de aparición.

### 1. KPIs principales

| KPI | Cálculo |
|---|---|
| **Valor en juego** | Σ valor efectivo de las oportunidades en etapas abiertas (todas menos `cierre_ganado` y `cierre_perdido`) |
| **Conversión** | `ganadas / (ganadas + perdidas) × 100`, sobre oportunidades activas en `cierre_ganado` y `cierre_perdido`. Sin cerradas, muestra "—" |
| **Pipeline abierto** | Cantidad de oportunidades en etapas abiertas |

La conversión no tiene ventana de tiempo: cuenta todas las cerradas que siguen activas.

### 2. Meta comercial

Muestra la meta vigente **hoy** (la que cubre la fecha actual) y cuánto se avanzó. Las metas son
mensuales o trimestrales y se cargan en Configuración → Meta comercial (pantalla de `administrativo`;
la API también acepta supervisores de ventas). El rango del dashboard no cambia este período.

Lo que cuenta como **"Cerrado"** depende de quién mira:

| Quién | Meta | Cerrado |
|---|---|---|
| Equipo (`administrativo`, supervisor) | Meta de agencia (sin vendedor asignado) | **Lo facturado en Contífico** en el período de la meta: facturas no anuladas, sin IVA, excluyendo clientes de medios |
| Vendedor | Su meta individual | Σ valor efectivo de **sus** oportunidades en `cierre_ganado` con `fecha_cierre` dentro del período de la meta |

`avance = cerrado / meta × 100`.

**Por qué la agencia usa Contífico.** Una oportunidad puede quedar sin mover a `cierre_ganado` aunque
ya se haya facturado. Con el criterio del CRM, la meta de agencia mostraba $0 con facturación real
encima. Lo facturado es el dato que no miente sobre la agencia. Para un vendedor, en cambio, Contífico
no sabe quién vendió, así que se usa el CRM.

Para el equipo, debajo aparece la tabla por vendedor: meta individual, cerrado según el CRM en el
período de cada meta, y avance.

### 3. Forecast contra la meta

Proyecta dónde va a terminar el período de la meta. Solo aparece si hay meta vigente.

```
comprometido = cerrado + por facturar + fees por generar
forecast     = comprometido + pipeline ponderado
brecha       = meta − forecast
```

| Tramo | Origen |
|---|---|
| **Cerrado** | El mismo "Cerrado" de la meta (Contífico para el equipo, CRM para el vendedor) |
| **Por facturar** | Σ subtotal de las cotizaciones en `por_facturar` del alcance del usuario. No tiene fecha: cuenta entera |
| **Fees por generar** | Para cada mes desde el actual hasta el mes en que termina la meta: `max(0, piso contratado − facturado − por facturar)` de la [proyección de contratos](./05-contratos-facturacion.md#proyeccion). Es decir, los meses de contratos que todavía no tienen cotización |
| **Pipeline ponderado** | Σ `valor efectivo × probabilidad` de las oportunidades abiertas |

La **probabilidad** de cada oportunidad es su `probabilidad_cierre`; si no tiene, la probabilidad por
defecto de su etapa (configurable en Configuración → Etapas).

Tres tarjetas: **Forecast** (con su % de la meta), **Comprometido** (sin pipeline) y **Falta para la
meta** o **Sobre la meta** según el signo de la brecha. Una barra apilada muestra los cuatro tramos con
una marca en la meta.

**Limitación conocida:** el pipeline no tiene fecha estimada de cierre, así que cuenta entero dentro del
período, aunque una oportunidad vaya a cerrar después. El propio bloque lo aclara.

Clic en cualquiera de las tres tarjetas abre el desglose: qué cotizaciones, qué meses de fees y qué
oportunidades componen cada tramo.

### 4. Facturación del mes

Un selector de mes que va de 12 meses atrás a 12 adelante.

**Mes en curso o pasado.** Llama a `GET /facturas/resumen` con el mes calendario: total facturado,
agencia, medios y por categoría, mismo criterio que la pantalla Facturas (ver
[Contratos y facturación](./05-contratos-facturacion.md#facturas-contifico)). Si el mes tiene fees
contratados, una línea abajo resume contratado, facturado y por facturar de esos fees.

**Mes futuro.** Contífico no sabe nada del futuro, así que el bloque cambia a una proyección:

| Tarjeta | Cálculo |
|---|---|
| Fees contratados | Piso contratado del mes según la proyección de contratos |
| Ya generado | `por_facturar + facturado` de las cotizaciones de contrato de ese mes |
| Vence en el mes | Fee mensual de los contratos que terminan ese mes |

Lo único que tiene mes asignado a futuro son los contratos de fee recurrente. Las cotizaciones sueltas
aceptadas no tienen mes: quedan en **Pendiente por facturar**, que aparece en ambos casos y lleva a la
lista de cotizaciones filtrada por ese estado.

### 5. Facturación últimos 12 meses

Gráfico de barras apiladas (agencia y medios, de Contífico) con una línea punteada del piso de fees
contratados de cada mes.

**No se carga solo**: hay que pulsar **Cargar historial**. Son doce consultas a Contífico, de a tres
en paralelo para no saturarlo. Los meses cerrados se guardan en la sesión del navegador
(`sessionStorage`) mientras la pestaña siga abierta; el mes en curso siempre se vuelve a pedir. Si
algún mes falla, se avisa cuántos y el gráfico muestra 0 en ese mes.

### 6. Renovaciones próximas

Los primeros 5 contratos que vencen dentro del aviso configurado o que ya vencieron hace menos de 90
días, con el total mensual en juego. Mismo origen que la pestaña Renovaciones de
[Contratos](./05-contratos-facturacion.md#renovaciones).

### 7. Cotizaciones a seguir

Cotizaciones en estado `enviada` que piden seguimiento. Entra una cotización si cumple cualquiera de
estas dos condiciones:

- su validez (`valido_hasta`) vence en **7 días o menos**, o ya venció;
- pasaron **7 días o más** desde que se creó la cotización.

Se ordenan primero por la validez más próxima y después por antigüedad. El badge dice "Oferta vencida",
"Vence hoy", "Vence en N d" o "N días sin respuesta". Se muestran 6.

### 8. Ranking de vendedores

Solo para `administrativo` y supervisores. Por cada ejecutivo:

| Columna | Cálculo |
|---|---|
| Ganadas | Oportunidades en `cierre_ganado` con `fecha_cierre` en el mes en curso |
| Cerrado | Σ valor efectivo de esas ganadas |
| Pipeline ponderado | Σ `valor efectivo × probabilidad` de sus oportunidades abiertas |
| Avance meta | El avance de su meta individual (período de la meta, no el mes), o "Sin meta" |

Orden: por cerrado y, en empate, por pipeline ponderado. El ranking usa el CRM, no Contífico.

### 9. Ciclo de venta

Sobre las oportunidades ganadas con `fecha_cierre` en los últimos 12 meses:

| Indicador | Cálculo |
|---|---|
| Ticket promedio | Promedio del valor efectivo |
| Ciclo promedio | Promedio de días entre `created_at` y `fecha_cierre` |
| Mayor deal | El valor efectivo más alto |

El ciclo promedio descarta las oportunidades que se cerraron en menos de un día desde su creación: un
alta directa como ganada (por ejemplo, la que crea un contrato sin oportunidad previa) no es un ciclo
de venta y bajaría el promedio artificialmente. Debajo, la lista de esas ganadas.

### 10. Pipeline por etapa

Barras y tabla con las 9 etapas: cantidad de oportunidades y valor en juego (Σ valor efectivo) de cada
una. Incluye las etapas de cierre.

### 11. Cotizaciones por estado

Torta con la cantidad de cotizaciones del alcance del usuario en cada estado (borrador, preparación,
enviada, aprobada, por facturar, facturada, rechazada, vencida).

### 12. Causas de pérdida

Cantidad de oportunidades en `cierre_perdido` agrupadas por su causa principal. Las perdidas sin causa
registrada no aparecen.

### 13. Actividades por vendedor

Cantidad de actividades por responsable. Es el único bloque que usa el rango del dashboard.

- **Con rango:** una actividad cuenta si su `programada_para` **o** su `reportada_en` cae dentro del
  rango. El rango se convierte a hora de Ecuador (`-05:00`): de las 00:00 del día "Desde" a las
  23:59:59.999 del día "Hasta".
- **Sin rango:** todas las actividades que tienen fecha programada o reportada.

Es el mismo criterio que la [Agenda](./10-agenda.md), para que el conteo coincida con lo que se ve allí
con el mismo rango.

## Detalle al hacer clic

Las tarjetas Valor en juego, Conversión, Pipeline abierto, el "Cerrado" de la meta y cada fila de
Pipeline por etapa abren un modal con las oportunidades que componen el número
(`GET /dashboard/detalle/{tarjeta}`). El detalle usa el mismo alcance que la tarjeta, así que siempre
suma lo mismo.

Cada modal trae la tabla de oportunidades (empresa, contacto, ejecutivo, etapa, valor, días sin
actividad para las abiertas, causa para las perdidas) y agrupaciones por etapa y, para el equipo, por
vendedor.

**Ojo con la meta de agencia:** el detalle de la meta lista las oportunidades ganadas en el período
según el CRM. Para la agencia, el "Cerrado" de la tarjeta viene de Contífico, así que el total del
modal puede no coincidir con la tarjeta.

## Resumen

`/resumen` es el tablero de volumen. No tiene montos. La pantalla está en el área de Ventas
(`administrativo` y `ventas`); el endpoint `GET /resumen` acepta cualquier sesión.

| Tarjeta | Cálculo |
|---|---|
| Contactos | Todos los contactos (datos maestros compartidos, sin restricción de dueño) |
| Empresas | Todas las empresas |
| Conversaciones | `administrativo` y supervisor: todas. Resto: las asignadas a sí mismo y las sin asignar |
| Mensajes | Mismo alcance que conversaciones |
| Mails | Eventos de Resend. Solo `administrativo` y `marketing`; para un vendedor no se muestra un 0, sino "Sin visibilidad" |

Debajo, series diarias de altas de contactos, empresas y conversaciones de los últimos 30 días.

## Panel TV

`/tv` es una pantalla de kiosco para una TV en la oficina: sin sidebar, con reloj, logo de la
organización y el cursor que se oculta tras 5 segundos sin mover el mouse. Requiere una sesión
iniciada (en la práctica, `administrativo` o `ventas`, porque los datos vienen de endpoints de Ventas).

| Elemento | Origen |
|---|---|
| Valor en juego, Meta del mes, Conversión, Oportunidades abiertas | `GET /dashboard/kpis`, mismos cálculos que el Dashboard |
| Facturado mes | Contífico, del día 1 a hoy (hora de Ecuador), facturas no anuladas, subtotal sin IVA |
| Pendiente por facturar | Estimación, ver abajo |
| Facturación por pilar | Líneas de las facturas del mes, por pilar |
| Pipeline por etapa / Metas por vendedor | Rotan cada 30 segundos (no rota si el sistema pide movimiento reducido) |
| Actividad reciente | Últimos 20 eventos del [Timeline](./10-agenda.md#timeline) |

Los datos se refrescan cada 90 segundos. Un indicador muestra hace cuánto fue la última sincronización.
Si Contífico falla (502), el panel sigue mostrando el último dato conocido y lo avisa.

### Pendiente por facturar (estimado)

El panel suma dos cosas:

1. **Exacto:** el subtotal de las cotizaciones marcadas `por_facturar`.
2. **Aproximado:** las cotizaciones en `aprobada` que nadie clasificó. Para cada una, aprobada hace al
   menos 7 días, se busca en Contífico una factura que cumpla las tres condiciones: nombre de la
   empresa contenido en el nombre del cliente (sin distinguir mayúsculas), fecha de emisión igual o
   posterior a la aprobación real (del timeline) y monto dentro de ±15% del subtotal de la cotización.
   Si no aparece, cuenta como pendiente.

Es una heurística, no un dato contable, y el panel lo dice. Cuantas más cotizaciones se marquen
`por_facturar` o `facturado` a mano, más exacto queda.

### Facturación por pilar

Cada línea de factura se asigna a un pilar (`marca`, `crecimiento`, `transformacion`, `transversal`)
buscando primero la categoría de producto de Contífico y después el nombre manual de la línea en la
tabla `contifico_producto_pilar`. Lo que no coincide va a **sin clasificar**: nunca se descarta ni se
le inventa un pilar. El mapeo se mantiene en Configuración. El monto de la línea es
`cantidad × precio × (1 − descuento)`, sin IVA.

**Por confirmar:** algunos textos del panel todavía dicen "IVA incluido" junto a Facturado mes y
Facturación por pilar, pero el backend devuelve montos sin IVA desde el 23/09/2026.
