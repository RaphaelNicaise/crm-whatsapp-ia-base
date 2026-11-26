CREATE TABLE "usuarios" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nombre" text NOT NULL,
	"password_hash" text NOT NULL,
	"rol" text DEFAULT 'operador' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" bigint NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "asignado_a" text;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_asignado_a_usuarios_id_fk" FOREIGN KEY ("asignado_a") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;