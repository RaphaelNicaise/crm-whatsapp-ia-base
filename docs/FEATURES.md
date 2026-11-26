# Inventario Completo de Features y Capacidades del Sistema

Este documento detalla todas las funcionalidades, integraciones, módulos técnicos y capacidades operativas incluidas en tu **CRM de WhatsApp con IA**.

---

## 1. Motor de Inteligencia Artificial (Multi-Modelo)

* **Soporte Multi-Proveedor (Vercel AI SDK):**
  * **OpenAI:** `gpt-4o-mini` *(equilibrado en costo/calidad)*.
  * **Google:** `gemini-2.0-flash` *(ultrarrápido y el más económico)*.
  * **Anthropic:** `claude-haiku-5-5` *(preciso con reglas estrictas)* y `claude-sonnet-5-5` *(máxima calidad)*.
* **Selector inteligente de modelo:** Permite elegir el modelo desde Ajustes o por variables de entorno, con verificación automática de API Key (`/api/asistente/modelo`).
* **Registro de consumo y costos (`consumo_ia`):** Cada mensaje procesado por la IA registra en PostgreSQL el proveedor, modelo, `tokens_entrada`, `tokens_salida` y el `costo_usd` calculado (`lib/precios.ts`).
* **Herramientas deterministas (Function Calling):** La IA nunca inventa fechas ni precios; ejecuta acciones reales sobre el backend (`lib/agente.ts`):
  * `ver_huecos`: Consulta disponibilidad real en la agenda.
  * `reservar_visita`: Agenda o reprograma una cita de forma atómica (anulando la anterior si existía).
  * `cancelar_visita`: Cancela una cita confirmada.
  * `guardar_dato`: Extrae información clave de la charla (presupuesto, servicio, ubicación, medidas, etc.) y la guarda en la ficha del cliente.
  * `pasar_a_persona`: Silencia al bot, mueve al cliente a la columna humana y dispara alerta al equipo.
  * `marcar_spam`: Detecta ofertas comerciales, estafas o envíos masivos y los archiva sin molestar al equipo.
* **Transcripción automática de notas de voz (`lib/transcripcion.ts`):**
  * Convierte audios entrantes de WhatsApp a texto antes de pasarlos al agente usando **Gemini** (`gemini-3.5-transcribe`), **Groq** (`whisper-large-v3-turbo`) u **OpenAI** (`gpt-4o-mini-transcribe`).
* **Reglas de seguridad y comportamiento (`lib/guion.ts`):**
  * Defensa contra *prompt injection* (ignora intentos del usuario por cambiar instrucciones o pedir datos de otros clientes).
  * Respuestas forzadas en un solo párrafo sin Markdown (optimizado para lectura natural en WhatsApp).
  * Detección automática de pedidos de **baja** o **borrado de datos** (cumplimiento GDPR/privacidad).
* **Prompt editable en vivo (`agente.md`):** Se lee dinámicamente en cada mensaje y puede editarse desde el panel web sin reiniciar el servidor.

---

## 2. Integración Oficial con WhatsApp (Meta Cloud API)

* **Webhook seguro (`app/webhook/route.ts`):**
  * Verificación criptográfica de firmas **HMAC-SHA256** (`META_APP_SECRET`).
  * Control de idempotencia mediante tabla `mensajes_procesados` (`wamid`) para nunca procesar un mensaje duplicado.
* **Buffer anti-ametralladora (`lib/llegadas.ts`, `lib/buzon.ts`):**
  * Agrupa mensajes consecutivos enviados en pocos segundos por un mismo cliente para responder en un único turno coherente y ahorrar tokens.
* **Seguimiento de estado de entrega:** Registra si cada mensaje fue `enviado`, `entregado`, `leido` o `fallido` (traduciendo errores de Meta a español comprensible en `lib/errores.ts`).
* **Gestión de Plantillas de Meta (`lib/plantillas.ts`):**
  * Creación y envío para aprobación directa desde el panel de 3 plantillas clave:
    1. `solicitud_general`: Primer contacto para leads que llegan por formulario web o alta manual.
    2. `aviso_comercial`: Alerta al WhatsApp personal del dueño/comercial cuando la IA escala un cliente.
    3. `retomar_conversacion`: Reactivación de clientes pasadas las 24 horas de ventana gratuita de Meta.
* **Atribución de anuncios (Click-to-WhatsApp):** Guarda los metadatos de referencia de campañas de Meta Ads (`ReferidoMeta`: titular, URL, `ctwa_clid`).
* **Modo Prueba opcional (QR / Baileys y ngrok):** Herramienta local opcional (`lib/modo-prueba.ts`, `lib/tunel.ts`) para pruebas sin cuenta oficial de Meta.

---

## 3. Panel CRM y Experiencia de Usuario

* **Tiempo Real (Server-Sent Events):** Actualización instantánea en el navegador ante nuevos mensajes, cambios de estado o citas (`app/api/eventos/route.ts`).
* **Alertas visuales y sonoras:** Contador de clientes en espera en el título de la pestaña del navegador y sonido configurable (`lib/sonido.ts`).
* **Vista «Hoy»:** Resumen operativo diario con leads recién llegados, clientes escalados ("Te toca a ti"), citas de hoy/mañana y tareas pendientes.
* **Tablero Kanban de Clientes:**
  * Columnas automáticas: **Con tu asistente**, **Con visita/cita**, **Te toca**, **Cerrados** y **Publicidad/Spam**.
  * Alta manual de clientes (`+ Cliente`) para quienes llaman por teléfono o visitan el local.
  * Buscador rápido por nombre, teléfono, notas o datos extraídos (`lib/buscar.ts`).
* **Ficha completa del cliente:**
  * Historial de chat completo (diferenciando mensajes del bot, respuestas manuales del equipo y notas de voz).
  * Control manual de conversación: *"Lo llevo yo"* (pausa el bot), *"Devolver a tu asistente"*, *"Responder manualmente"*, *"Retomar conversación"*.
  * Gestión directa de citas: dar, cambiar o anular turno.
  * **Notas internas**, **Tareas con vencimiento** y **Línea de tiempo de actividad**.
  * **Registro de cierre comercial:** Marcar si se ganó o perdió la venta, motivo de cierre, presupuesto e importe cobrado.
* **Agenda diaria:** Vista de calendario día por día con todos los turnos confirmados.
* **Simulador integrado («Probar tu asistente»):** Permite chatear con el bot en local directamente desde Ajustes sin gastar mensajes de WhatsApp ni necesitar Meta conectado.

---

## 4. Web Pública de Captación y Multi-Rubro

* **Landing Page pública (`app/page.tsx`):**
  * Personalizable con nombre del negocio, lema, logotipo, color de marca y enlace a política de privacidad.
  * **Dos modos de captación web:**
    * *Botón de WhatsApp:* Abre WhatsApp con un mensaje pre-escrito (el cliente inicia la ventana gratuita de 24h).
    * *Formulario web:* Captura nombre, teléfono, zona y consulta (`/lead`), disparando automáticamente el primer mensaje por WhatsApp.
* **Adaptabilidad por rubro (`perfiles/` y `negocios/`):**
  * Presets listos para **Reformas**, **Inmobiliaria**, **Clínica** y **Genérico**.
  * Vocabulario dinámico (`lib/vocabulario.ts`): adapta automáticamente toda la interfaz y prompts (*visita* vs *cita*, *cliente* vs *paciente*, *piso* vs *servicio*).
  * Configuración regional (`lib/regional.ts`): soporte de países, prefijos telefónicos, monedas y zonas horarias.

---

## 5. Base de Datos, Infraestructura y Seguridad

* **PostgreSQL 17 + Drizzle ORM:**
  * Schema tipado completo en `lib/db/schema.ts` con 10 tablas (`leads`, `mensajes`, `visitas`, `notas`, `tareas`, `actividad`, `proyectos`, `mensajes_procesados`, `ajustes`, `consumo_ia`) y migraciones en `drizzle/`.
  * Compatible con PostgreSQL en Docker, Supabase o Neon (`DATABASE_URL` / `SUPABASE_DB_URL`), además de respaldo local embebido (`PGlite`).
  * Comandos incluidos: `pnpm run db:push`, `pnpm run db:studio`, `pnpm run db:generate`.
* **Exportación y Backups:**
  * Exportación de leads a Excel/CSV desde Ajustes (`app/api/exportar/route.ts`).
  * Copias de seguridad automáticas diarias en carpeta `copias/` (`lib/copias.ts`).
* **Docker y Portainer (`Dockerfile`, `docker-compose.yml`, `docs/PORTAINER.md`):**
  * Stack completo listo para levantar **CRM + PostgreSQL 17 + pgAdmin 4** (`http://localhost:5050`).
  * Preparado para desplegar múltiples clientes aislados en un mismo VPS gestionados desde Portainer.
* **Seguridad y Control de Acceso:**
  * Protección de rutas mediante proxy/middleware (`proxy.ts`, `lib/acceso.ts`): en modo servidor solo el webhook y la portada son públicos; el panel y las APIs requieren sesión firmada (`lib/sesion.ts`).
  * Alta de contraseña inicial mediante código de un solo uso (`CODIGO_ALTA`).
  * Censura automática de API keys en logs y respuestas HTTP (`lib/claves.ts`, `lib/sistema.ts`).
* **Calidad y Testing:**
  * Suite con más de 1.600 tests unitarios en Vitest (`lib/__tests__/`), incluyendo tests de invariantes arquitectónicos y seguridad (`invariantes.test.ts`).
