# Roadmap y Features Pendientes (`TODO`)

> **Completado recientemente:** Módulo de Catálogo de Productos, Control de Stock, Cotizaciones, Gestión de Ventas y Validador de Comprobantes por IA (migrado a `docs/FEATURES.md`).



&nbsp;

Lista de funcionalidades, integraciones y mejoras técnicas planificadas para evolucionar el CRM hacia un producto de agencia / SaaS completo.

---

## 1. Servidor MCP (Model Context Protocol) — *Prioridad Alta*
Permitir gestionar el CRM, consultar leads, responder mensajes y ajustar el comportamiento del bot directamente desde **Claude Desktop, Cursor, Antigravity o cualquier agente compatible con MCP**.

- [ ] Instalar `@modelcontextprotocol/sdk` y crear el servidor MCP (`lib/mcp/` o endpoint `/api/mcp` con autenticación Bearer Token).
- [ ] **Tools de Lectura (CRM & Analítica):**
  - [ ] `listar_leads`: Filtrar clientes por estado (`nuevo`, `visita`, `persona`, `cerrado`), fecha o búsqueda.
  - [ ] `ver_conversacion`: Leer el historial completo de chat y datos extraídos de un cliente.
  - [ ] `ver_agenda`: Consultar turnos reservados y huecos disponibles por rango de fechas.
  - [ ] `ver_consumo_ia`: Consultar tokens gastados y costo acumulado en USD desde la tabla `consumo_ia` de Drizzle.
- [ ] **Tools de Acción (Operación):**
  - [ ] `responder_whatsapp`: Enviar un mensaje manual desde Claude al WhatsApp de un cliente.
  - [ ] `cambiar_etapa_lead`: Pasar un lead a humano, cerrarlo o devolverlo al asistente.
  - [ ] `agendar_o_anular_cita`: Crear, modificar o cancelar turnos en la agenda.
- [ ] **Tools de Configuración del Bot:**
  - [ ] `leer_instrucciones` / `actualizar_instrucciones`: Consultar y modificar `agente.md` en vivo mediante lenguaje natural.

---

## 2. Interfaz Multimodelo y Dashboard de Consumo IA
Ya tenemos el backend con OpenAI, Gemini, Claude y la tabla `consumo_ia` en Drizzle; falta exponerlo visualmente en el panel.

- [ ] Agregar en **Ajustes → Tu asistente** el selector visual para elegir entre `GPT-4o Mini`, `Gemini 2.0 Flash`, `Claude Haiku` y `Claude Sonnet` mostrando el costo por millón de tokens y recomendación de uso.
- [ ] Permitir pegar y validar `OPENAI_API_KEY` y `GEMINI_API_KEY` directamente desde **Ajustes → Conexiones**.
- [ ] Crear widget en **Hoy / Ajustes** mostrando el consumo mensual (conversaciones atendidas, tokens usados y costo en USD) + link directo a la recarga/Auto-topup del proveedor.
- [ ] Agregar modo "Gestionado por Agencia" (variable de entorno) que oculte las API Keys cuando el servicio sea *Todo Incluido*.

---

## 3. Automatizaciones y Canales de Notificación
- [ ] **Alertas por Telegram Bot:** Enviar aviso gratuito al celular del comercial/dueño cuando un cliente pasa a *"Te toca a ti"* (alternativa sin costo a la plantilla paga de WhatsApp).
- [ ] **Recordatorios automáticos pre-cita:** Job programado (24h o 2h antes del turno) enviando plantilla de confirmación por WhatsApp para reducir ausencias.
- [ ] **Sincronización con Google Calendar:** Reflejar automáticamente los turnos agendados por la IA en el calendario de Google del cliente y bloquear horarios ocupados manualmente.

---

## 4. Arquitectura, Clean Code y Escalabilidad (Fase Agencia / SaaS)
- [ ] **Reorganizar subcarpetas por dominio:**
  - `lib/` ➔ `lib/ai/`, `lib/whatsapp/`, `lib/crm/`, `lib/auth/`, `lib/db/`.
  - `cliente/` ➔ `cliente/vistas/`, `cliente/componentes/`, `cliente/ui/`.
- [ ] **Migración total a Drizzle ORM:** Reemplazar progresivamente las consultas SQL crudas de `lib/bd.ts` hacia repositorios tipados con Drizzle.
- [ ] **Limpieza de imagen de producción:** Retirar `PGlite`, `ngrok` y `Baileys (modo prueba)` cuando se opere 100% sobre Docker + PostgreSQL + Caddy.
- [ ] **Desacoplar vocabulario regional:** Adaptar los textos y presets base al español neutro / Latinoamérica (limpiando referencias heredadas a "piso/reformas/España").
- [ ] **Multi-usuario y Roles:** Permitir múltiples asesores/vendedores con login individual y asignación automática de leads por zona o especialidad.
