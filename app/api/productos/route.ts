import { NextResponse } from "next/server";
import { listarProductosMemoria, crearProductoMemoria } from "@/lib/db/repositorios/productos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const busqueda = searchParams.get("q") ?? undefined;
  const prods = await listarProductosMemoria({ busqueda, soloActivos: true });
  return NextResponse.json(prods);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = `prod-${Date.now()}`;
    const nuevo = await crearProductoMemoria({
      id,
      nombre: body.nombre,
      precio: Number(body.precio),
      stock: Number(body.stock ?? 0),
      sku: body.sku ?? null,
      categoria: body.categoria ?? null,
      descripcion: body.descripcion ?? null,
      activo: true,
    });
    return NextResponse.json(nuevo, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Datos de producto inválidos" }, { status: 400 });
  }
}
