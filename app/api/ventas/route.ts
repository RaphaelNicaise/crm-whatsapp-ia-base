import { NextResponse } from "next/server";
import { crearVentaMemoria, obtenerVentasPorLeadMemoria } from "@/lib/db/repositorios/ventas";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  if (!leadId) {
    return NextResponse.json({ error: "leadId requerido" }, { status: 400 });
  }
  const ventas = await obtenerVentasPorLeadMemoria(leadId);
  return NextResponse.json(ventas);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, items, notas } = body;
    if (!leadId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "leadId e items son requeridos" }, { status: 400 });
    }
    const venta = await crearVentaMemoria(leadId, items, notas);
    return NextResponse.json(venta, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear la venta" }, { status: 400 });
  }
}
