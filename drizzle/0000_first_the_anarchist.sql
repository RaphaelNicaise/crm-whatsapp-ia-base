CREATE TABLE "actividad" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"texto" text NOT NULL,
	"ts" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ajustes" (
	"id" integer PRIMARY KEY NOT NULL,
	"leads_prueba" boolean NOT NULL,
	"configuracion" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"logos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ejemplos_de" text,
	"instrucciones" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"telefono" text NOT NULL,
	"perfil_id" text NOT NULL,
	"perfil_nombre" text NOT NULL,
	"nombre" text NOT NULL,
	"email" text,
	"zona" text,
	"origen" text NOT NULL,
	"estado" text NOT NULL,
	"datos" jsonb NOT NULL,
	"huecos_ofrecidos" jsonb NOT NULL,
	"motivo_persona" text,
	"motivo_spam" text,
	"ms_primer_whatsapp" integer,
	"creado_en" bigint NOT NULL,
	"actualizado_en" bigint NOT NULL,
	"cambio_estado_en" bigint NOT NULL,
	"presupuesto" integer,
	"cobrado" integer,
	"etiquetas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ejemplo" boolean DEFAULT false NOT NULL,
	"silenciado_en" bigint,
	"fuente" jsonb,
	"ms_primera_respuesta" integer,
	"cierre" text,
	"cierre_en" bigint,
	"motivo_cierre" text,
	"vuelta_vista_en" bigint
);
--> statement-breakpoint
CREATE TABLE "mensajes" (
	"orden" bigint GENERATED ALWAYS AS IDENTITY (sequence name "mensajes_orden_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"lead_id" text NOT NULL,
	"id" text NOT NULL,
	"de" text NOT NULL,
	"texto" text NOT NULL,
	"ts" bigint NOT NULL,
	"plantilla" boolean DEFAULT false NOT NULL,
	"audio" boolean DEFAULT false NOT NULL,
	"manual" boolean DEFAULT false NOT NULL,
	"entrega" text,
	"fallo" text,
	"plantilla_nombre" text,
	CONSTRAINT "mensajes_lead_id_id_pk" PRIMARY KEY("lead_id","id")
);
--> statement-breakpoint
CREATE TABLE "mensajes_procesados" (
	"wamid" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notas" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"texto" text NOT NULL,
	"ts" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proyectos" (
	"id" text PRIMARY KEY NOT NULL,
	"foto" integer NOT NULL,
	"tipo" text NOT NULL,
	"barrio" text NOT NULL,
	"estado" text NOT NULL,
	"avance" integer NOT NULL,
	"descripcion" text NOT NULL,
	"lead_id" text
);
--> statement-breakpoint
CREATE TABLE "tareas" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"texto" text NOT NULL,
	"vence" text,
	"hecha" boolean DEFAULT false NOT NULL,
	"ts" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitas" (
	"hueco_id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"texto" text NOT NULL,
	"nombre" text NOT NULL,
	"perfil_nombre" text NOT NULL,
	"prueba" boolean NOT NULL,
	CONSTRAINT "visitas_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mensajes_por_lead" ON "mensajes" USING btree ("lead_id","orden");--> statement-breakpoint
CREATE INDEX "mensajes_por_id" ON "mensajes" USING btree ("id");