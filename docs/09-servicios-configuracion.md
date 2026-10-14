# Servicios y configuración

> Revisado contra el código el 13/10/2026.

Todo lo que es un parámetro del negocio vive en el **Panel de Configuración**, no en el código: márgenes, comisiones,
tasa de impuesto, probabilidades por etapa, umbrales de alerta, causas de pérdida, tarifas internas, tipos de
documento, el catálogo de servicios y la marca de la organización.

**Por qué.** Estos números cambian con el negocio: una tasa de IVA, un margen, un umbral. Si estuvieran en el código,
cada cambio necesitaría un desarrollador y un despliegue. En una tabla, los cambia un admin, sin despliegue.

## El Panel de Configuración

Solo el equipo **administrativo** entra al panel (`/configuracion`). El frontend protege cada ruta con `AdminRoute` y
el backend exige `require_admin` en cada escritura. Las lecturas de catálogo (servicios, categorías, etapas, causas,
tarifas, configuración general) están abiertas a cualquier usuario autenticado, porque el pipeline y el cotizador
las necesitan.

| Grupo | Pantalla | Qué configura |
|---|---|---|
| Catálogo y precios | Servicios | Catálogo de servicios, categorías y pilares, wizard de alta |
| | Tarifas internas | Costo interno por rol |
| | Tipos de documento | Catálogo de documentos que un servicio puede requerir |
| Reglas de negocio | Etapas y alertas | Probabilidad por etapa, umbral de alerta, multiplicador de escalamiento |
| | Márgenes e impuestos | Margen y comisión por defecto, umbral de aprobación, tasa de impuesto, horas laborales del mes |
| | Parámetros generales | Validez de cotizaciones, documento de alcance, aviso de renovación, LinkedIn y reparto de leads |
| | Meta comercial | Meta de la agencia y por vendedor (también supervisor de ventas) |
| | Causas de pérdida | Catálogo para Cierre Perdido |
| Marca e integraciones | Marca | Logos, colores y datos de contacto de la organización |
| | Conectores | Conexión de Claude por MCP |
| | Formulario web | Campos, apariencia, webhooks y snippet del widget (ver [Bandeja y formulario web](./07-bandeja-formulario.md)) |
| Organización | Usuarios | Invitar, editar roles, activar y desactivar (ver [Roles y permisos](./01-roles-permisos.md)) |

## Catálogo de servicios

Un **servicio** es algo que la agencia vende: un kit de identidad, gestión de redes, un desarrollo web. El catálogo
alimenta el cotizador: las líneas de catálogo toman de acá su nombre, categoría, precio y márgenes por defecto (ver
[Cotizaciones](./03-cotizaciones.md)).

| Estado | Qué significa | Aparece en el cotizador |
|---|---|---|
| `borrador` | En armado, se puede guardar incompleto | No |
| `activo` | Publicado | Sí |
| `archivado` | Retirado del catálogo | No. Ya no se puede editar (409) |

Todo servicio nace en borrador. Archivar es definitivo: no hay endpoint para desarchivar.

### Modelos de cobro

`modelo_cobro` es la única dimensión excluyente de un servicio:

| Modelo | Significa |
|---|---|
| `por_hora` | El cliente paga las horas reales del equipo |
| `fee_fijo` | Un monto único, aunque el trabajo dure más de un mes |
| `fee_recurrente` | Un monto que se cobra cada ciclo (en general, cada mes) mientras dure el contrato |

Tener fases y el costeo del equipo son atributos independientes: aplican a cualquier modelo de cobro.

El modelo de cobro tiene efectos en otras partes:

- En una línea sin proveedor de un servicio de fee, el precio sale del monto del fee.
- Las líneas con proveedor de servicios `fee_fijo` y `fee_recurrente` están sujetas a la regla (B) de aprobación por
  comisión reducida (ver [Cotizaciones](./03-cotizaciones.md)).
- Las condiciones de pago del Documento de Alcance se eligen según el modelo de cobro (ver
  [Documento de alcance](./04-documento-alcance.md)).

### El wizard de 8 pasos

El alta y la edición de un servicio se hacen en un wizard. Algunos pasos solo aparecen si aplican.

| Paso | Título | Qué pide | Aparece |
|---|---|---|---|
| 1 | Datos básicos | Nombre, categoría, pilar, descripción y si se entrega en fases | Siempre |
| 2 | Modelo de cobro | Por hora, fee fijo o fee recurrente | Siempre |
| 3 | Equipo y costeo | Estimación por rol (tarifa interna) con el costo interno calculado en vivo | Siempre |
| 4 | Configuración de fee | Monto del fee, duración mínima, ciclo de renovación | Solo si el modelo es fee fijo o recurrente |
| 5 | Fases | Nombre de cada fase e hito de pago | Solo si "Se entrega en fases" |
| 6 | Márgenes por defecto | Margen de agencia, comisión sugerida mínima y máxima | Siempre |
| 7 | Documentos requeridos | Si requiere Documento de Alcance y qué tipos de documento | Siempre |
| 8 | Revisión y publicación | Resumen y botón **Activar servicio** | Siempre |

- **Guardar borrador** está disponible en cualquier paso. Para guardar hace falta el nombre y, en un servicio nuevo,
  el pilar. Guardar no cambia el estado: un servicio activo que editas sigue activo.
- **Activar servicio** aparece en el último paso y solo para el equipo administrativo. El backend también lo exige:
  activar es un `PATCH /servicios/{id}` con `estado: activo`, y ese endpoint pide `require_admin`. La UI no es la
  única barrera.
- **Archivar** está en la cabecera del wizard, también solo para admin.

En el paso 6, un servicio nuevo arranca con los valores de agencia vigentes, copiados al servicio. Si borras un campo,
queda vacío y el cotizador cae al default de agencia; un campo vacío no es cero. El margen y la comisión mínima del
servicio, si existen, pisan los de Configuración al crear una línea de cotización. La comisión máxima solo marca el
techo del rango que ve el vendedor.

En el paso 7, "Requiere Documento de Alcance" solo bloquea el envío de cotizaciones si además está encendido el
interruptor general de la organización (ver [Documento de alcance](./04-documento-alcance.md)). Desde ese paso se
puede crear un tipo de documento nuevo sin salir del wizard.

En el paso de márgenes también se cargan, opcionales, el **precio de catálogo** sin IVA (`precio_base_cliente`), que
usa una línea sin proveedor, y el **producto de Contífico** (`contifico_producto_id`), que habilita el historial de
precios facturados. El producto de Contífico se mapea una vez que el servicio existe (el alta no lo acepta). Si un
servicio de fee no tiene precio de catálogo, se usa el monto del fee del paso 4; uno por hora sin precio de catálogo
necesita proveedor o precio manual en la línea.

### Costo interno estimado

El paso 3 estima cuánto le cuesta el servicio a la agencia, por rol y nunca por persona. Cada servicio guarda
`estimacion_interna_por_rol`: por cada tarifa interna, una cantidad cuyo significado depende del modelo de la tarifa.

| Modelo de tarifa | Qué es la cantidad | Costo |
|---|---|---|
| `por_hora` | Horas | horas × costo por hora |
| `por_sueldo` | % del mes (0 a 100) | (% / 100 × horas laborales del mes) × (costo mensual / horas laborales del mes) |
| `por_evento` | Veces que se ejecuta | veces × costo por evento |

**Ejemplo.** Un rol por sueldo con costo mensual de 1.200, dedicado al 25% del mes, con 240 horas laborales:
60 horas equivalentes × 5 por hora = **300**.

El backend devuelve el total como `costo_interno_estimado`, calculado en vivo y nunca guardado. Es informativo: si
falta la configuración general o una tarifa citada se borró, vale nulo y no rompe nada. Las horas laborales del mes
(240 por defecto) se editan en Márgenes e impuestos.

## Categorías y pilares

Las **categorías de servicio** son el catálogo comercial: clasifican servicios, líneas a medida e intereses de
oportunidad. Cada categoría pertenece a un **pilar** de negocio:

| Pilar | Código |
|---|---|
| Marca | `marca` |
| Crecimiento | `crecimiento` |
| Transformación | `transformacion` |
| Transversal | `transversal` |

- Crear una categoría exige nombre y pilar. Editar acepta nombre, pilar o ambos.
- Las categorías anteriores a los pilares pueden no tener pilar: la pantalla muestra **Sin pilar** y permite
  asignarlo al editar.
- Borrar una categoría que usan servicios, líneas de cotización u oportunidades devuelve 409 con el motivo.

Se editan en Configuración → Servicios → Categorías.

## Tarifas internas

Una **tarifa interna** es el costo de un rol para la agencia: "Diseñador senior", "Desarrollador". Tres modelos:

| Modelo | Campo de costo |
|---|---|
| Por hora | `costo_hora` |
| Por sueldo | `costo_mensual` |
| Por evento | `costo_evento` |

Cada tarifa lleva solo el campo de su modelo. Mandar el de otro modelo, o no mandar el suyo, devuelve 422.

**Por qué por rol y nunca por persona.** El costo de una persona con nombre y apellido es un dato sensible y cambia
cuando alguien entra o se va. El costo de un rol es un dato del negocio, estable y comparable entre servicios.

## Márgenes, comisión e impuestos

Todo vive en una sola fila, `configuracion_general`, que se edita en Configuración → Márgenes e impuestos.

| Parámetro | Default | Para qué |
|---|---|---|
| Margen de agencia | 30% | Margen sobre el costo del proveedor si el servicio no define uno |
| Comisión mínima de agencia | 13% | Comisión por defecto y piso de política para la regla (B) |
| Comisión máxima de agencia | 20% | Techo del rango que ve el vendedor |
| Umbral de descuento que pide aprobación | 10% | Regla (A): por encima de este descuento, la cotización va a preparación |
| Multiplicador de escalamiento | 2 | Umbral × multiplicador = escalada al supervisor. Global, no por etapa |
| Tasa de impuesto / IVA | Sin default | Obligatoria al crear. Nunca se inventa |
| Horas laborales del mes | 240 | Base para costear tarifas por sueldo |
| Días de validez de una cotización | 30 | Fecha de validez que se fija al enviar |

**La fila no existe hasta que un admin la crea.** La pantalla lo detecta y ofrece **Crear**, con la tasa de impuesto
obligatoria. Mientras no exista, el backend no puede calcular cotizaciones y responde 422. Crearla dos veces devuelve
409.

**Por qué la tasa no tiene default.** Un default de IVA sería un número inventado que el sistema usaría sin que nadie
lo haya confirmado. Sin fila, el error es visible; con un default equivocado, cada cotización saldría mal en silencio.

Cambiar un valor no reescribe nada guardado: las líneas ya creadas conservan su margen y comisión, y las cotizaciones
enviadas conservan su tasa congelada.

La misma fila guarda otros parámetros, que se editan en Configuración → **Parámetros generales**:

| Sección | Parámetros |
|---|---|
| Cotizaciones | Días de validez de la oferta y condiciones comerciales del PDF |
| Documento de alcance | Interruptor de documento obligatorio y los textos por defecto (exclusiones, consideraciones, «por qué Geeks») |
| Contratos de fee | Días de aviso de renovación |
| Prospección en LinkedIn | Horas entre búsquedas, criterios y perfiles por búsqueda |
| Leads y agenda | Método de asignación de leads y días de anticipación de cumpleaños |

## Etapas y alertas

Las 9 etapas del pipeline son fijas: código, nombre y orden no se editan. En Configuración → Etapas y alertas se edita,
por etapa:

- **Probabilidad de cierre por defecto (%).** Se aplica a la oportunidad cada vez que entra a la etapa.
- **Umbral de alerta en horas.** Si queda vacío, la etapa no genera alerta (es el caso de los cierres).

Y el multiplicador de escalamiento global. Cómo se usan estos valores está en [Pipeline](./02-pipeline.md).

## Causas de pérdida

Catálogo abierto que alimenta el diálogo de Cierre Perdido (causa principal obligatoria y secundaria opcional). La
siembra inicial trae Precio, Competencia, Falta de presupuesto y Pérdida de contacto. El admin puede crear, renombrar y
borrar causas.

## Tipos de documento

Catálogo abierto de documentos que un servicio puede requerir: Cotización, Documento de Alcance, Propuesta de Fee,
Contrato, etc. Cada tipo tiene nombre, una plantilla base de texto y, opcionalmente, un archivo de plantilla (PDF o
DOCX, hasta 10 MB). El backend comprueba que el contenido del archivo coincida con su tipo declarado.

El wizard de servicio asocia tipos en el paso 7 y puede crear uno nuevo sin salir.

## Meta comercial

Metas de venta para el dashboard (ver [Dashboard, metas y forecast](./06-dashboard.md)):

- **Alcance:** la agencia completa o un vendedor. El destino tiene que ser del equipo administrativo o de ventas.
- **Período:** mensual o trimestral.
- Después de creada, **solo se edita el monto**. Si el período o el alcance están mal, se borra y se crea de nuevo.

Es la única pantalla del Panel de Configuración que también puede abrir un supervisor de ventas, igual que la API
(`require_supervisor_o_admin`). El supervisor no ve el resto del panel: entra con «Gestionar metas» desde el
Dashboard.

## Marca de la organización

Configuración → Marca guarda el logo claro, el logo oscuro, cuatro colores (primario, secundario, terciario y
cuaternario) y el email, teléfono y sitio web de la organización.

- Logos: PNG, JPEG, WebP o SVG, hasta 2 MB. El backend valida que el archivo sea una imagen real y rechaza SVG con
  contenido no permitido.
- El logo oscuro se usa en el sidebar y en la cabecera del PDF de cotización. Si no hay, se usa el claro.

**Los colores de marca solo pintan entregables.** Se aplican al PDF de cotización, al Documento de Alcance, al widget
del formulario web y a las vistas previas de esos entregables. **Nunca** tiñen la interfaz del CRM: botones, sidebar
y estados usan los tokens propios de la app.

**Por qué dos capas de color.** Si los colores de la organización pisaran la interfaz, un color de marca mal elegido
(poco contraste, un rojo que parece error) rompería la legibilidad de todo el CRM. Los entregables son del cliente y
llevan su marca; la herramienta de trabajo mantiene un lenguaje visual estable. Ver
[Sistema de diseño](./19-sistema-diseno.md).

## Conectores

Configuración → Conectores explica cómo conectar **Claude** a prometIO por MCP. El servidor MCP corre local, en la
máquina de cada persona (stdio), atado a la sesión de quien lo configura: ve exactamente lo que esa persona ve en la
API, y es de solo lectura.

ChatGPT y Gemini aparecen como **Próximamente**: todavía no tienen integración. Ver
[Integraciones](./11-integraciones.md).

## Endpoints

| Método | Ruta | Quién escribe |
|---|---|---|
| `GET`, `POST`, `PATCH` | `/servicios`, `/servicios/{id}` | Admin |
| `POST` | `/servicios/{id}/archivar` | Admin |
| `GET`, `POST`, `PATCH`, `DELETE` | `/config/categorias-servicio` | Admin |
| `GET`, `POST`, `PATCH`, `DELETE` | `/config/tarifas-internas` | Admin |
| `GET`, `POST`, `PATCH`, `DELETE` | `/config/tipos-documento` (+ `/{id}/plantilla`) | Admin |
| `GET`, `POST`, `PATCH`, `DELETE` | `/config/causas-perdida` | Admin |
| `GET`, `PATCH` | `/config/etapas-pipeline` | Admin |
| `GET`, `POST`, `PATCH` | `/config/general` | Admin |
| `GET`, `POST`, `PATCH`, `DELETE` | `/metas-comerciales` | Supervisor o admin (lectura incluida) |
| `GET`, `PATCH` | `/organizacion` (+ `/logo`, `/logo-oscuro`) | Admin |

Las escrituras de `/config/*` y de metas quedan en la bitácora de auditoría, igual que archivar un servicio. Crear y
editar servicios y cambiar la marca no se auditan hoy. Ver el [mapa de la API](./18-api.md).
