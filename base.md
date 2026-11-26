# CRM WhatsApp con IA — Estado Actual del Sistema

> Última actualización: 2026-11-26 01:12

## Stack Tecnológico
- **Framework:** Next.js 16.4 (App Router)
- **Lenguaje:** TypeScript 5
- **ORM & BD:** Drizzle ORM con PostgreSQL (Postgres.js)
- **Motor de IA:** Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
- **Estilos:** Tailwind CSS v4
- **Testing:** Vitest 5

## Módulos y Arquitectura

### 1. Núcleo CRM y Asistente Conversacional
- Gestión de prospectos y clientes (`leads`, `mensajes`, `visitas`, `notas`, `tareas`, `actividad`).
- Asistente virtual determinista (`lib/agente.ts`): gestiona turnos/visitas, califica leads, detecta spam y pasa a operador humano.
- Métricas de consumo de tokens y costos en tiempo real (`consumo_ia`).

### 2. Catálogo de Productos y Control de Stock
- **Tabla `productos` (`lib/db/schema.ts`):** id, nombre, sku, descripcion, categoria, precio, stock, activo.
- **Repositorio:** `lib/db/repositorios/productos.ts` con soporte para listado, búsqueda por texto, creación y actualización de stock.
- **Tool de Asistente IA (`consultar_catalogo`):** Permite a la IA responder consultas de precios y existencias en WhatsApp directamente desde la base de datos sin alucinar.
- **API REST:** `GET /api/productos`, `POST /api/productos`.

### 3. Cotizaciones y Gestión de Ventas
- **Tablas `ventas` y `lineas_venta`:** Asocia presupuestos a leads con estados (`borrador`, `pendiente_pago`, `pagada`, `cancelada`), cálculo automático de totales y líneas de detalle.
- **Repositorio:** `lib/db/repositorios/ventas.ts`.
- **API REST:** `GET /api/ventas?leadId=...`, `POST /api/ventas`.
- **UI:** `cliente/widget-venta-lead.tsx` integrado en la ficha del lead (`cliente/ficha.tsx`) para cotizar productos y generar presupuestos con 1 clic.

### 4. Visión Multimodal y Conciliación de Pagos
- **Módulo:** `lib/vision-comprobantes.ts`.
- Validador y conciliador de comprobantes de transferencia bancaria por imagen/OCR para cotejar montos y referencias contra órdenes pendientes.
