import { z } from "zod";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
} from "@/lib/db/repositorios/productos.repo";

export const dynamic = "force-dynamic";

const esquemaCrear = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120),
  sku: z.string().max(60).optional(),
  descripcion: z.string().max(500).optional(),
  categoria: z.string().max(60).optional(),
  precio: z.number().min(0, "El precio no puede ser negativo"),
  stock: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

const esquemaActualizar = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1).max(120).optional(),
  sku: z.string().max(60).nullable().optional(),
  descripcion: z.string().max(500).nullable().optional(),
  categoria: z.string().max(60).nullable().optional(),
  precio: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const buscar = url.searchParams.get("buscar") ?? undefined;
    const categoria = url.searchParams.get("categoria") ?? undefined;
    const estado = url.searchParams.get("estado");
    const soloActivos = estado === "activos" ? true : estado === "inactivos" ? false : undefined;

    const lista = await listarProductos({ buscar, categoria, soloActivos });
    return Response.json({ ok: true, productos: lista });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al listar productos" },
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
  const creado = await crearProducto(parsed.data);
  return Response.json({ ok: true, producto: creado }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = esquemaActualizar.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { id, ...cambios } = parsed.data;
  const actualizado = await actualizarProducto(id, cambios);
  if (!actualizado) {
    return Response.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
  }
  return Response.json({ ok: true, producto: actualizado });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "Falta id" }, { status: 400 });
  const ok = await eliminarProducto(id);
  if (!ok) return Response.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
  return Response.json({ ok: true });
}
