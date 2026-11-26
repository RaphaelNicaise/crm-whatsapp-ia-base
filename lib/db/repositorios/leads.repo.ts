import { desc, eq, and } from "drizzle-orm";
import { db, leads } from "../index";

export async function asignarLeadUsuario(leadId: string, usuarioId: string | null): Promise<boolean> {
  const res = await db
    .update(leads)
    .set({ asignadoA: usuarioId, actualizadoEn: Date.now() })
    .where(eq(leads.id, leadId))
    .returning({ id: leads.id });
  return res.length > 0;
}

export async function listarLeadsDrizzle(filtros?: {
  estado?: string;
  asignadoA?: string;
  limite?: number;
}) {
  const condiciones = [];
  if (filtros?.estado) condiciones.push(eq(leads.estado, filtros.estado));
  if (filtros?.asignadoA) condiciones.push(eq(leads.asignadoA, filtros.asignadoA));

  return db
    .select()
    .from(leads)
    .where(condiciones.length > 0 ? and(...condiciones) : undefined)
    .orderBy(desc(leads.actualizadoEn))
    .limit(filtros?.limite ?? 50);
}
