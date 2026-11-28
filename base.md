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

### 3. Modo Oscuro Global (Dark Mode) y Adaptación de Chats
- **Componente:** `cliente/interruptor-tema.tsx` (icono de Sol y Luna con persistencia en `localStorage`).
- **Ubicación:** Arriba a la izquierda en la barra lateral de escritorio y en la cabecera móvil.
- **Chats en Dark Mode:**
  - `cliente/hilo.tsx` y `cliente/chat-de-prueba.tsx` adaptados con colores WhatsApp Dark (`#0b141a` fondo, `#202c33` mensajes de cliente, `#005c4b` mensajes del asistente/agente, texto `#e9edef`).
- **Estilos globales:** `app/globals.css` adaptado con variables CSS completas (`html.dark`), soporte nativo para Tailwind v4 (`@custom-variant dark`) y script anti-parpadeo en `app/layout.tsx`.

### 4. Navegación Reactiva del Sidebar y Ajustes
- **Navegación Reactiva (`cliente/navegacion.ts` y `cliente/panel.tsx`):**
  - Almacén reactivo con `useSyncExternalStore` y snapshot inmutable `estadoActual`.
  - Notificación sincrónica a los oyentes al invocar `cambiarUrl` / `irA`, sin despachar eventos sintéticos `popstate` que en Next.js 16 App Router provocaban re-renderizado del Server Component `/panel` y reseteo a la vista por defecto "hoy".
  - Escucha pasiva de eventos nativos del navegador (`popstate`, `hashchange`) para soportar botones adelante/atrás.
  - Corrección en `hrefDe` para no retener el sub-bloque de Ajustes previo al navegar entre vistas principales o regresar a Ajustes general.
  - Contenedor lateral `<aside>` en `cliente/panel.tsx` asegurado con `overflow-y-auto` y `z-20` para evitar solapamientos y permitir scroll en pantallas bajas.
- **Puesta en marcha (`cliente/puesta-en-marcha.tsx`):** el diálogo a pantalla completa (`fixed inset-0 z-[58]`) tapaba la barra lateral en instalaciones nuevas y los clics reales del ratón no llegaban a las secciones. Ahora la X de cierre se muestra también cuando se abre sola y cierra con «Lo dejo para luego» (`aplazar`), que guarda `crm:puesta-luego` en `localStorage` para que no vuelva a aparecer. Así se puede cambiar de sección desde el primer momento.
- **Vista Configuración (`cliente/vista-configuracion.tsx` y `lib/configuracion.ts`):**
  - `SECCIONES_CONFIGURACION` y `IdSeccionConfiguracion` actualizados para incluir todas las pestañas: `negocio`, `asistente`, `agenda`, `whatsapp`, `equipo`, `mcp`, `web`, `avanzado`.
  - Sub-navegación lateral de tabs reactiva e integrada bidireccionalmente con la URL (`#ajustes-<tab>`).
  - Reseteo consistente a la pestaña principal (`negocio`) cuando se navega a `#ajustes` sin sub-bloque.
  - Selector visual de modelos con íconos oficiales (OpenAI, Google Gemini, Anthropic Claude).
- **Botón Conectar/Configurar (`cliente/configuracion/conexiones.tsx`):** Sustituido "Arreglar" por "Conectar" / "Configurar".
- **Buscador y Paleta de Comandos Dinámica (`cliente/paleta.tsx`):**
  - Búsqueda dinámica en tiempo real de funcionalidades, vistas principales (Hoy, Clientes, Productos, Ventas, Agenda), sub-bloques de Ajustes (Negocio, Asistente IA, Horarios, WhatsApp, Equipo, MCP, Web, Avanzado) y clientes/leads.
  - Navegación completa por teclado con flechas (Arriba / Abajo) con auto-scroll visible (`scrollIntoView`) y selección con tecla Enter para navegar inmediatamente al destino o ejecutar la acción elegida.
  - Sincronización exacta 1:1 entre el índice renderizado y el elemento seleccionado en el array de resultados, eliminando claves duplicadas y desfases de cabeceras.
  - Cierre confiable mediante tecla `Escape` o clic en el fondo.
- **Cierre Global con tecla Escape en Modales y Diálogos:**
  - Manejador de teclado en ventana (`window.addEventListener("keydown")`) con `stopPropagation` y `preventDefault` en todos los modales de la app:
    - Diálogo de alta de cliente (`cliente/alta-cliente.tsx`).
    - Diálogo de cierre de venta / estado (`cliente/cierre.tsx`).
    - Diálogo de confirmación de borrado de lead (`cliente/ficha.tsx`).
    - Modal de edición y creación de productos (`cliente/vista-productos.tsx`).
    - Asistente de puesta en marcha inicial (`cliente/puesta-en-marcha.tsx`).
    - Selector y cambio de citas (`cliente/selector-cita.tsx`).
    - Diálogo de retomar conversación WhatsApp (`cliente/retomar.tsx`).
    - Diálogos genéricos de configuración (`cliente/configuracion/controles.tsx`).
    - Paleta de comandos (`cliente/paleta.tsx`).
  - Previene que al perder el foco interno el diálogo quede bloqueado o cierre indebidamente la ficha de lead de fondo.

### 3. Cotizaciones y Gestión de Ventas
- **Tablas `ventas` y `lineas_venta`:** Asocia presupuestos a leads con estados (`borrador`, `pendiente_pago`, `pagada`, `cancelada`), cálculo automático de totales y líneas de detalle.
- **Repositorio:** `lib/db/repositorios/ventas.ts`.
- **API REST:** `GET /api/ventas?leadId=...`, `POST /api/ventas`.
- **UI:** `cliente/widget-venta-lead.tsx` integrado en la ficha del lead (`cliente/ficha.tsx`) para cotizar productos y generar presupuestos con 1 clic.

### 4. Visión Multimodal y Conciliación de Pagos
- **Módulo:** `lib/vision-comprobantes.ts`.
- Validador y conciliador de comprobantes de transferencia bancaria por imagen/OCR para cotejar montos y referencias contra órdenes pendientes.
