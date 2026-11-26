import { z } from "zod";
import { crearUsuario, listarUsuarios, buscarUsuarioPorEmail } from "@/lib/db/repositorios/usuarios.repo";

export const dynamic = "force-dynamic";

const esquemaCrear = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(2, "Nombre muy corto").max(80),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(["admin", "operador"]).optional(),
});

export async function GET() {
  try {
    const lista = await listarUsuarios();
    return Response.json({ ok: true, usuarios: lista });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al listar usuarios" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = esquemaCrear.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const existente = await buscarUsuarioPorEmail(parsed.data.email);
  if (existente) {
    return Response.json({ ok: false, error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  const creado = await crearUsuario(parsed.data);
  return Response.json({ ok: true, usuario: creado }, { status: 201 });
}
