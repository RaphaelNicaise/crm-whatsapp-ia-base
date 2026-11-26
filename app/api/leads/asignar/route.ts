import { z } from "zod";
import { asignarLeadUsuario } from "@/lib/db/repositorios/leads.repo";

export const dynamic = "force-dynamic";

const esquemaAsignar = z.object({
  leadId: z.string().min(1),
  usuarioId: z.string().nullable(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = esquemaAsignar.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }

  const ok = await asignarLeadUsuario(parsed.data.leadId, parsed.data.usuarioId);
  if (!ok) {
    return Response.json({ ok: false, error: "Lead no encontrado" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
