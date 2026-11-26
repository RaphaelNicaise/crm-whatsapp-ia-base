import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db, lineasVenta, productos, ventas, type VentaModel } from "../index";

export interface VentaConLineas extends VentaModel {
  items: {
    id: string;
    productoId: string;
    productoNombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
}

export async function listarVentas(filtros?: {
  buscar?: string;
  estado?: string;
  metodoPago?: string;
}): Promise<VentaConLineas[]> {
  const condiciones = [];
  if (filtros?.estado && filtros.estado !== "todos") {
    condiciones.push(eq(ventas.estado, filtros.estado));
  }
  if (filtros?.metodoPago && filtros.metodoPago !== "todos") {
    condiciones.push(eq(ventas.metodoPago, filtros.metodoPago));
  }
  if (filtros?.buscar?.trim()) {
    const q = `%${filtros.buscar.trim()}%`;
    condiciones.push(or(ilike(ventas.clienteNombre, q), ilike(ventas.notas, q), ilike(ventas.id, q)));
  }

  const lista = await db
    .select()
    .from(ventas)
    .where(condiciones.length > 0 ? and(...condiciones) : undefined)
    .orderBy(desc(ventas.creadoEn))
    .limit(100);

  if (lista.length === 0) return [];

  const ids = lista.map((v) => v.id);
  const filasLineas = await db
    .select({
      id: lineasVenta.id,
      ventaId: lineasVenta.ventaId,
      productoId: lineasVenta.productoId,
      productoNombre: productos.nombre,
      cantidad: lineasVenta.cantidad,
      precioUnitario: lineasVenta.precioUnitario,
      subtotal: lineasVenta.subtotal,
    })
    .from(lineasVenta)
    .innerJoin(productos, eq(lineasVenta.productoId, productos.id))
    .where(inArray(lineasVenta.ventaId, ids));

  const porVenta = new Map<string, VentaConLineas["items"]>();
  for (const l of filasLineas) {
    const arr = porVenta.get(l.ventaId) ?? [];
    arr.push({
      id: l.id,
      productoId: l.productoId,
      productoNombre: l.productoNombre,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      subtotal: l.subtotal,
    });
    porVenta.set(l.ventaId, arr);
  }

  return lista.map((v) => ({ ...v, items: porVenta.get(v.id) ?? [] }));
}

export async function crearVenta(datos: {
  leadId?: string | null;
  clienteNombre: string;
  estado?: "borrador" | "pendiente_pago" | "pagada" | "cancelada";
  metodoPago?: string;
  notas?: string;
  items: { productoId: string; cantidad: number }[];
}): Promise<VentaConLineas> {
  const ahora = Date.now();
  const ventaId = randomUUID();
  const estado = datos.estado ?? "pagada";

  const prodIds = [...new Set(datos.items.map((i) => i.productoId))];
  const prods = await db.select().from(productos).where(inArray(productos.id, prodIds));
  const mapaProds = new Map(prods.map((p) => [p.id, p]));

  let total = 0;
  const itemsPreparados: VentaConLineas["items"] = [];
  for (const item of datos.items) {
    const prod = mapaProds.get(item.productoId);
    if (!prod) throw new Error(`Producto no encontrado: ${item.productoId}`);
    const cantidad = Math.max(1, Math.round(item.cantidad));
    const subtotal = prod.precio * cantidad;
    total += subtotal;
    itemsPreparados.push({
      id: randomUUID(),
      productoId: prod.id,
      productoNombre: prod.nombre,
      cantidad,
      precioUnitario: prod.precio,
      subtotal,
    });
  }

  const nuevaVenta: VentaModel = {
    id: ventaId,
    leadId: datos.leadId ?? null,
    clienteNombre: datos.clienteNombre.trim() || "Cliente directo",
    estado,
    metodoPago: datos.metodoPago ?? "efectivo",
    total,
    notas: datos.notas?.trim() || null,
    enlacePago: null,
    comprobanteUrl: null,
    creadoEn: ahora,
    pagadoEn: estado === "pagada" ? ahora : null,
  };

  await db.insert(ventas).values(nuevaVenta);

  if (itemsPreparados.length > 0) {
    await db.insert(lineasVenta).values(
      itemsPreparados.map((it) => ({
        id: it.id,
        ventaId,
        productoId: it.productoId,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        subtotal: it.subtotal,
      })),
    );
    if (estado !== "cancelada") {
      for (const it of itemsPreparados) {
        await db
          .update(productos)
          .set({ stock: sql`GREATEST(0, ${productos.stock} - ${it.cantidad})`, actualizadoEn: ahora })
          .where(eq(productos.id, it.productoId));
      }
    }
  }

  return { ...nuevaVenta, items: itemsPreparados };
}

export async function actualizarEstadoVenta(
  id: string,
  estado: "borrador" | "pendiente_pago" | "pagada" | "cancelada",
): Promise<VentaModel | null> {
  const [actualizada] = await db
    .update(ventas)
    .set({
      estado,
      pagadoEn: estado === "pagada" ? Date.now() : null,
    })
    .where(eq(ventas.id, id))
    .returning();
  return actualizada ?? null;
}

export async function eliminarVenta(id: string): Promise<boolean> {
  const res = await db.delete(ventas).where(eq(ventas.id, id)).returning({ id: ventas.id });
  return res.length > 0;
}

export async function resumenVentas(): Promise<{
  totalVentas: number;
  ingresosPagados: number;
  pendienteCobro: number;
}> {
  const [row] = await db
    .select({
      totalVentas: sql<number>`count(*)::int`,
      ingresosPagados: sql<number>`coalesce(sum(case when ${ventas.estado} = 'pagada' then ${ventas.total} else 0 end), 0)::int`,
      pendienteCobro: sql<number>`coalesce(sum(case when ${ventas.estado} = 'pendiente_pago' then ${ventas.total} else 0 end), 0)::int`,
    })
    .from(ventas);

  return {
    totalVentas: row?.totalVentas ?? 0,
    ingresosPagados: row?.ingresosPagados ?? 0,
    pendienteCobro: row?.pendienteCobro ?? 0,
  };
}
