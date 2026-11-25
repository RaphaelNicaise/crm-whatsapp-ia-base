import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Tabla: leads
 * Almacena los prospectos y clientes que ingresan por WhatsApp o formulario web.
 */
export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  telefono: text("telefono").notNull(),
  perfilId: text("perfil_id").notNull(),
  perfilNombre: text("perfil_nombre").notNull(),
  nombre: text("nombre").notNull(),
  email: text("email"),
  zona: text("zona"),
  origen: text("origen").notNull(), // 'formulario' | 'whatsapp' | 'prueba' | 'manual'
  estado: text("estado").notNull(), // 'nuevo' | 'conversacion' | 'visita' | 'persona' | 'spam'
  datos: jsonb("datos").notNull().$type<Record<string, unknown>>(),
  huecosOfrecidos: jsonb("huecos_ofrecidos").notNull().$type<unknown[]>(),
  motivoPersona: text("motivo_persona"),
  motivoSpam: text("motivo_spam"),
  msPrimerWhatsapp: integer("ms_primer_whatsapp"),
  creadoEn: bigint("creado_en", { mode: "number" }).notNull(),
  actualizadoEn: bigint("actualizado_en", { mode: "number" }).notNull(),
  cambioEstadoEn: bigint("cambio_estado_en", { mode: "number" }).notNull(),
  presupuesto: integer("presupuesto"),
  cobrado: integer("cobrado"),
  etiquetas: jsonb("etiquetas").notNull().default([]).$type<string[]>(),
  ejemplo: boolean("ejemplo").notNull().default(false),
  silenciadoEn: bigint("silenciado_en", { mode: "number" }),
  fuente: jsonb("fuente").$type<Record<string, unknown>>(),
  msPrimeraRespuesta: integer("ms_primera_respuesta"),
  cierre: text("cierre"), // 'si' | 'no'
  cierreEn: bigint("cierre_en", { mode: "number" }),
  motivoCierre: text("motivo_cierre"),
  vueltaVistaEn: bigint("vuelta_vista_en", { mode: "number" }),
});

/**
 * Tabla: mensajes
 * Historial de mensajes enviados y recibidos con cada cliente.
 */
export const mensajes = pgTable(
  "mensajes",
  {
    orden: bigint("orden", { mode: "number" }).generatedAlwaysAsIdentity(),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    de: text("de").notNull(), // 'cliente' | 'agente'
    texto: text("texto").notNull(),
    ts: bigint("ts", { mode: "number" }).notNull(),
    plantilla: boolean("plantilla").notNull().default(false),
    audio: boolean("audio").notNull().default(false),
    manual: boolean("manual").notNull().default(false),
    entrega: text("entrega"),
    fallo: text("fallo"),
    plantillaNombre: text("plantilla_nombre"),
  },
  (table) => [
    primaryKey({ columns: [table.leadId, table.id] }),
    index("mensajes_por_lead").on(table.leadId, table.orden),
    index("mensajes_por_id").on(table.id),
  ],
);

/**
 * Tabla: visitas (citas / turnos)
 * Citas agendadas por el asistente o confirmadas por el equipo.
 */
export const visitas = pgTable("visitas", {
  huecoId: text("hueco_id").primaryKey(),
  leadId: text("lead_id")
    .notNull()
    .unique()
    .references(() => leads.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  nombre: text("nombre").notNull(),
  perfilNombre: text("perfil_nombre").notNull(),
  prueba: boolean("prueba").notNull(),
});

/**
 * Tabla: notas
 * Notas internas añadidas manualmente por el equipo a la ficha del cliente.
 */
export const notas = pgTable("notas", {
  id: text("id").primaryKey(),
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  ts: bigint("ts", { mode: "number" }).notNull(),
});

/**
 * Tabla: tareas
 * Tareas pendientes asociadas a un lead.
 */
export const tareas = pgTable("tareas", {
  id: text("id").primaryKey(),
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  vence: text("vence"),
  hecha: boolean("hecha").notNull().default(false),
  ts: bigint("ts", { mode: "number" }).notNull(),
});

/**
 * Tabla: actividad
 * Línea de tiempo y auditoría de eventos del lead.
 */
export const actividad = pgTable("actividad", {
  id: text("id").primaryKey(),
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  ts: bigint("ts", { mode: "number" }).notNull(),
});

/**
 * Tabla: proyectos
 * Proyectos u obras vinculadas al cliente.
 */
export const proyectos = pgTable("proyectos", {
  id: text("id").primaryKey(),
  foto: integer("foto").notNull(),
  tipo: text("tipo").notNull(),
  barrio: text("barrio").notNull(),
  estado: text("estado").notNull(),
  avance: integer("avance").notNull(),
  descripcion: text("descripcion").notNull(),
  leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }),
});

/**
 * Tabla: mensajes_procesados
 * Control de duplicados por ID de Meta WhatsApp (wamid).
 */
export const mensajesProcesados = pgTable("mensajes_procesados", {
  wamid: text("wamid").primaryKey(),
});

/**
 * Tabla: ajustes
 * Configuración global del CRM, asistente, horarios y personalización.
 */
export const ajustes = pgTable("ajustes", {
  id: integer("id").primaryKey(),
  leadsPrueba: boolean("leads_prueba").notNull(),
  configuracion: jsonb("configuracion").notNull().default({}),
  logos: jsonb("logos").notNull().default({}),
  ejemplosDe: text("ejemplos_de"),
  instrucciones: jsonb("instrucciones").notNull().default({}),
});

/**
 * Tabla: consumo_ia
 * Registro detallado de tokens y costos por cada interacción de IA.
 */
export const consumoIa = pgTable("consumo_ia", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }),
  proveedor: text("proveedor").notNull(), // 'anthropic' | 'openai' | 'google'
  modelo: text("modelo").notNull(),
  tokensEntrada: integer("tokens_entrada").notNull(),
  tokensSalida: integer("tokens_salida").notNull(),
  costoUsd: text("costo_usd").notNull(),
  creadoEn: bigint("creado_en", { mode: "number" }).notNull(),
});

// Tipos inferidos por Drizzle
export type ConsumoIaModel = typeof consumoIa.$inferSelect;
export type NuevoConsumoIaModel = typeof consumoIa.$inferInsert;

// Tipos inferidos por Drizzle
export type LeadModel = typeof leads.$inferSelect;
export type NuevoLeadModel = typeof leads.$inferInsert;

export type MensajeModel = typeof mensajes.$inferSelect;
export type NuevoMensajeModel = typeof mensajes.$inferInsert;

export type VisitaModel = typeof visitas.$inferSelect;
export type NuevaVisitaModel = typeof visitas.$inferInsert;

export type NotaModel = typeof notas.$inferSelect;
export type TareaModel = typeof tareas.$inferSelect;
export type ActividadModel = typeof actividad.$inferSelect;
export type AjustesModel = typeof ajustes.$inferSelect;
