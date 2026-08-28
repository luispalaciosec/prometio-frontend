# prometIO — Guía de UI por pantalla

## Pipeline de Ventas (Fase 1)
- Vista Kanban arrastrable, 9 columnas (etapas fijas, ver `DATA_MODEL.md` del backend)
- Cada tarjeta de oportunidad muestra: contacto, empresa, ejecutivo, valor (etiquetado estimado/cotizado), días en la etapa actual
- Filtro por servicio sobre el mismo tablero (no una pantalla separada)
- Indicador visual cuando una oportunidad supera el umbral de alerta de su etapa (color/badge), con acciones sugeridas al hacer clic (evaluar descuento, agendar visita, ofrecer otro servicio)
- Vista alternativa: lista/tabla (TanStack Table) para el supervisor, con scope "todo el equipo" vs. "lo mío" según rol

## Wizard de creación de Servicio (Fase 1, solo admins)
8 pasos, guardable como borrador en cualquier punto:
1. Datos básicos (nombre, categoría, descripción)
2. Modelo de cobro (radio: por hora / fee fijo / fee recurrente) — determina qué pasos siguientes se muestran
3. Equipo y costeo — agregar roles (de `tarifa_interna`) + horas estimadas, con cálculo de costo interno **en vivo** mientras se arma la lista
4. Configuración de fee (solo si aplica) — monto, duración mínima, ciclo de renovación
5. Fases (solo si `tiene_fases`) — lista con nombre, orden, hito de pago de cada una
6. Márgenes por defecto — margen de agencia % y comisión sugerida (hereda default global, se puede sobreescribir)
7. Documentos requeridos — seleccionar de `tipo_documento` existentes o crear uno nuevo sin salir del wizard
8. Revisión y publicación — resumen completo; botón "Activar servicio" solo habilitado para equipo `administrativo`

## Cotizaciones (lista global)
- Ruta `/cotizaciones` en Negocios, junto a Pipeline / Alertas / Dashboard
- Lista con búsqueda (`q`: contacto, empresa o número) y filtro por estado; el backend aplica ownership (vendedor ve las suyas)
- Cada fila: número, contacto/empresa, estado, total, fecha. Click abre `/pipeline/:id?cotizacion=:id` (el constructor de siempre)

## Cotizador (Fase 1)
- Constructor de líneas: seleccionar servicio, proveedor (opcional), costo del proveedor
- Calculadora de margen visible en vivo: costo proveedor → precio con margen → precio con comisión → total con impuestos (fórmula completa en `prometio-backend/CLAUDE.md`)
- Selector de comisión con rango sugerido (13-20%); si baja del rango en un servicio recurrente, o si el descuento total supera 10%, el botón de envío se reemplaza por "Enviar a aprobación"
- Dos previews de PDF: interno (con desglose, según permisos) y de cliente (solo total)
- Generación de documentos adicionales según lo que declare el servicio (alcance, fee creativo, contrato)

## Bandeja de entrada (Fase 2)
- Lista de conversaciones agrupada por canal (WhatsApp/Instagram/Messenger/chat web), con indicador de SLA
- Vista de hilo estilo chat
- Botón explícito "Convertir a contacto" — nunca automático — que abre un formulario pre-llenado con lo extraído del hilo para que el vendedor confirme/complete

## Panel de Configuración (Fase 1 en adelante, solo admin)
Secciones: probabilidades por etapa, umbrales de alerta + escalamiento, causas de pérdida, tarifas internas, márgenes/comisión default, tasa de impuestos, tipos de documento, catálogo de servicios, reglas de transición automática de etapa, theming de organización (logo, colores).

## Dashboard ejecutivo (Fase 1, admin/supervisor)
KPIs: actividades por vendedor, tasa de conversión por etapa, tiempo promedio por etapa, valor de pipeline (bruto y ponderado), win rate, tamaño promedio de deal, ciclo de venta promedio, leads por fuente, forecast del mes vs. meta.

## Panel de TV / modo kiosko (Fase 3)
- Ruta separada, sesión de solo-lectura de larga duración (sin pedir login en cada refresco)
- Rotación automática: ranking de vendedores, valor total de pipeline, cierres de la semana, cuenta regresiva a la meta del mes
- Pantalla completa, auto-refresh
