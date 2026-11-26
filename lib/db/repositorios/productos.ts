import type { ProductoModel, NuevoProductoModel } from "../schema";

// Almacén en memoria para entornos locales / pruebas / desarrollo ágil
let productosMemoria: ProductoModel[] = [];

export function reiniciarProductosMemoria(): void {
  productosMemoria = [];
}

export async function crearProductoMemoria(
  datos: Omit<NuevoProductoModel, "creadoEn" | "actualizadoEn">
): Promise<ProductoModel> {
  const ahora = Date.now();
  const nuevo: ProductoModel = {
    id: datos.id,
    nombre: datos.nombre,
    sku: datos.sku ?? null,
    descripcion: datos.descripcion ?? null,
    categoria: datos.categoria ?? null,
    precio: datos.precio,
    stock: datos.stock ?? 0,
    activo: datos.activo ?? true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  productosMemoria.push(nuevo);
  return nuevo;
}

export async function listarProductosMemoria(filtro?: {
  soloActivos?: boolean;
  busqueda?: string;
}): Promise<ProductoModel[]> {
  let res = [...productosMemoria];
  if (filtro?.soloActivos) {
    res = res.filter((p) => p.activo);
  }
  if (filtro?.busqueda) {
    const q = filtro.busqueda.toLowerCase();
    res = res.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
        (p.categoria && p.categoria.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }
  return res;
}

export async function actualizarStockMemoria(
  id: string,
  delta: number
): Promise<ProductoModel> {
  const idx = productosMemoria.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Producto ${id} no encontrado`);
  const actual = productosMemoria[idx];
  const nuevoStock = actual.stock + delta;
  productosMemoria[idx] = {
    ...actual,
    stock: nuevoStock,
    actualizadoEn: Date.now(),
  };
  return productosMemoria[idx];
}
