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
- **Repositorio:** `lib/db/repositorios/productos.ts` y `lib/db/repositorios/productos.repo.ts` con soporte para listado, búsqueda por texto, creación, actualización y control de stock.
- **Tool de Asistente IA (`consultar_catalogo`):** Permite a la IA responder consultas de precios y existencias en WhatsApp directamente desde la base de datos sin alucinar.
- **API REST:** `GET`, `POST`, `PATCH`, `DELETE` en `/api/productos`.
- **UI Catálogo (`cliente/vista-productos.tsx`):**
  - Listado de productos con KPIs en tiempo real (total, activos, sin stock).
  - Hover clarito y sutil en registros (`hover:bg-black/[0.02] dark:hover:bg-white/[0.03]`) y clic en la fila completa para abrir el editor.
  - Botón de edición dedicado (`Pencil`) con formulario/modal para editar nombre, SKU, categoría, precio, stock, descripción y estado activo.
  - Borrado y cambio rápido de estado activo/inactivo.

### 3. Modo Oscuro Global (Dark Mode)
- **Componente:** `cliente/interruptor-tema.tsx` (icono de Sol y Luna con persistencia en `localStorage`).
- **Ubicación:** Arriba a la izquierda en la barra lateral de escritorio y en la cabecera móvil.
- **Estilos globales:** `app/globals.css` adaptado con variables CSS completas (`html.dark`), soporte nativo para Tailwind v4 (`@custom-variant dark`) y script anti-parpadeo en `app/layout.tsx`.

### 4. Navegación en Ajustes y Multi-Modelo con Iconos
- **Vista Configuración (`cliente/vista-configuracion.tsx`):** Barra superior horizontal de tabs limpias y adaptativas que no deforman el ancho centrado de 880px del CRM.
- **Selector de Modelos (`cliente/configuracion/asistente.tsx`):** Selección visual con íconos oficiales de cada proveedor (OpenAI, Google Gemini, Anthropic Claude), precios de referencia por millón de tokens y entrada segura para `OPENAI_API_KEY`.
- **Conexiones (`cliente/configuracion/conexiones.tsx`):** Desacoplada la verificación de Claude para mantener WhatsApp y mensajes limpios.

### 3. Cotizaciones y Gestión de Ventas
- **Tablas `ventas` y `lineas_venta`:** Asocia presupuestos a leads con estados (`borrador`, `pendiente_pago`, `pagada`, `cancelada`), cálculo automático de totales y líneas de detalle.
- **Repositorio:** `lib/db/repositorios/ventas.ts`.
- **API REST:** `GET /api/ventas?leadId=...`, `POST /api/ventas`.
- **UI:** `cliente/widget-venta-lead.tsx` integrado en la ficha del lead (`cliente/ficha.tsx`) para cotizar productos y generar presupuestos con 1 clic.

### 4. Visión Multimodal y Conciliación de Pagos
- **Módulo:** `lib/vision-comprobantes.ts`.
- Validador y conciliador de comprobantes de transferencia bancaria por imagen/OCR para cotejar montos y referencias contra órdenes pendientes.
