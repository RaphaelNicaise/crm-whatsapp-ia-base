CREATE TABLE "consumo_ia" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text,
	"proveedor" text NOT NULL,
	"modelo" text NOT NULL,
	"tokens_entrada" integer NOT NULL,
	"tokens_salida" integer NOT NULL,
	"costo_usd" text NOT NULL,
	"creado_en" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consumo_ia" ADD CONSTRAINT "consumo_ia_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;