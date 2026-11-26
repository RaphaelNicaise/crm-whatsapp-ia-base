import { randomUUID } from "node:crypto";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, productos, type ProductoModel } from "../index";

export async function listarProductos(filtros?: {
  buscar?: string;
  categoria?: string;
  soloActivos?: boolean;
}): Promise<ProductoModel[]> {
  const condiciones = [];
  if (filtros?.soloActivos !== undefined) {
    condiciones.push(eq(productos.activo, filtros.soloActivos));
  }
  if (filtros?.categoria && filtros.categoria !== "todas") {
    condiciones.push(eq(productos.categoria, filtros.categoria));
  }
  if (filtros?.buscar?.trim()) {
    const q = `%${filtros.buscar.trim()}%`;
    condiciones.push(or(ilike(productos.nombre, q), ilike(productos.sku, q), ilike(productos.descripcion, q)));
  }

  return db
    .select()
    .from(productos)
    .where(condiciones.length > 0 ? and(...condiciones) : undefined)
    .orderBy(desc(productos.actualizadoEn));
}

export async function crearProducto(datos: {
  nombre: string;
  sku?: string;
  descripcion?: string;
  categoria?: string;
  precio: number;
  stock?: number;
  activo?: boolean;
}): Promise<ProductoModel> {
  const ahora = Date.now();
  const nuevo: ProductoModel = {
    id: randomUUID(),
    nombre: datos.nombre.trim(),
    sku: datos.sku?.trim() || null,
    descripcion: datos.descripcion?.trim() || null,
    categoria: datos.categoria?.trim() || "General",
    precio: Math.round(datos.precio),
    stock: datos.stock ?? 0,
    activo: datos.activo ?? true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  await db.insert(productos).values(nuevo);
  return nuevo;
}

export async function actualizarProducto(
  id: string,
  cambios: Partial<{
    nombre: string;
    sku: string | null;
    descripcion: string | null;
    categoria: string | null;
    precio: number;
    stock: number;
    activo: boolean;
  }>,
): Promise<ProductoModel | null> {
  const [actualizado] = await db
    .update(productos)
    .set({
      ...cambios,
      actualizadoEn: Date.now(),
    })
    .where(eq(productos.id, id))
    .returning();
  return actualizado ?? null;
}

export async function eliminarProducto(id: string): Promise<boolean> {
  const res = await db.delete(productos).where(eq(productos.id, id)).returning({ id: productos.id });
  return res.length > 0;
}
