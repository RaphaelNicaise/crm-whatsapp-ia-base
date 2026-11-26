import { z } from "zod";
import {
  actualizarEstadoVenta,
  crearVenta,
  eliminarVenta,
  listarVentas,
  resumenVentas,
} from "@/lib/db/repositorios/ventas.repo";

export const dynamic = "force-dynamic";

const esquemaCrear = z.object({
  leadId: z.string().nullable().optional(),
  clienteNombre: z.string().min(1, "Nombre de cliente requerido").max(120),
  estado: z.enum(["borrador", "pendiente_pago", "pagada", "cancelada"]).optional(),
  metodoPago: z.enum(["efectivo", "transferencia", "tarjeta", "mercadopago", "otro"]).optional(),
  notas: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        productoId: z.string().min(1),
        cantidad: z.number().int().min(1),
      }),
    )
    .min(1, "Agrega al menos un producto"),
});

const esquemaEstado = z.object({
  id: z.string().min(1),
  estado: z.enum(["borrador", "pendiente_pago", "pagada", "cancelada"]),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const buscar = url.searchParams.get("buscar") ?? undefined;
    const estado = url.searchParams.get("estado") ?? undefined;
    const metodoPago = url.searchParams.get("metodoPago") ?? undefined;

    const [lista, resumen] = await Promise.all([
      listarVentas({ buscar, estado, metodoPago }),
      resumenVentas(),
    ]);
    return Response.json({ ok: true, ventas: lista, resumen });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al listar ventas" },
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
  try {
    const creada = await crearVenta(parsed.data);
    return Response.json({ ok: true, venta: creada }, { status: 201 });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al registrar venta" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = esquemaEstado.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }
  const actualizada = await actualizarEstadoVenta(parsed.data.id, parsed.data.estado);
  if (!actualizada) {
    return Response.json({ ok: false, error: "Venta no encontrada" }, { status: 404 });
  }
  return Response.json({ ok: true, venta: actualizada });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "Falta id" }, { status: 400 });
  const ok = await eliminarVenta(id);
  if (!ok) return Response.json({ ok: false, error: "Venta no encontrada" }, { status: 404 });
  return Response.json({ ok: true });
}
