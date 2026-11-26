import { z } from "zod";
import { buscarUsuarioPorEmail, verifyPassword } from "@/lib/db/repositorios/usuarios.repo";

export const dynamic = "force-dynamic";

const esquemaLogin = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = esquemaLogin.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Email o contraseña inválidos" }, { status: 400 });
  }

  const usuario = await buscarUsuarioPorEmail(parsed.data.email);
  if (!usuario || !usuario.activo || !verifyPassword(parsed.data.password, usuario.passwordHash)) {
    return Response.json({ ok: false, error: "Credenciales incorrectas" }, { status: 401 });
  }

  return Response.json({
    ok: true,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    },
  });
}
