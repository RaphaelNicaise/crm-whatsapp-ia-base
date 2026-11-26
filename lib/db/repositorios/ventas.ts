import type { VentaModel, LineaVentaModel } from "../schema";
import { listarProductosMemoria } from "./productos";

export interface VentaConLineas extends VentaModel {
  lineas: LineaVentaModel[];
}

let ventasMemoria: VentaModel[] = [];
let lineasMemoria: LineaVentaModel[] = [];

export function reiniciarVentasMemoria(): void {
  ventasMemoria = [];
  lineasMemoria = [];
}

export async function crearVentaMemoria(
  leadId: string,
  items: Array<{ productoId: string; cantidad: number }>,
  notas?: string
): Promise<VentaConLineas> {
  const productos = await listarProductosMemoria();
  const ventaId = `vta-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let totalCalculado = 0;
  const nuevasLineas: LineaVentaModel[] = [];

  for (const item of items) {
    const prod = productos.find((p) => p.id === item.productoId);
    if (!prod) throw new Error(`Producto ${item.productoId} no encontrado`);
    const subtotal = prod.precio * item.cantidad;
    totalCalculado += subtotal;

    nuevasLineas.push({
      id: `lin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ventaId,
      productoId: prod.id,
      cantidad: item.cantidad,
      precioUnitario: prod.precio,
      subtotal,
    });
  }

  const nuevaVenta: VentaModel = {
    id: ventaId,
    leadId,
    clienteNombre: "Cliente WhatsApp",
    estado: "pendiente_pago",
    metodoPago: "transferencia",
    total: totalCalculado,
    notas: notas ?? null,
    enlacePago: null,
    comprobanteUrl: null,
    creadoEn: Date.now(),
    pagadoEn: null,
  };

  ventasMemoria.push(nuevaVenta);
  lineasMemoria.push(...nuevasLineas);

  return { ...nuevaVenta, lineas: nuevasLineas };
}

export async function marcarVentaPagadaMemoria(ventaId: string): Promise<VentaModel> {
  const idx = ventasMemoria.findIndex((v) => v.id === ventaId);
  if (idx === -1) throw new Error(`Venta ${ventaId} no encontrada`);
  ventasMemoria[idx] = {
    ...ventasMemoria[idx],
    estado: "pagada",
    pagadoEn: Date.now(),
  };
  return ventasMemoria[idx];
}

export async function obtenerVentasPorLeadMemoria(leadId: string): Promise<VentaConLineas[]> {
  const ventasLead = ventasMemoria.filter((v) => v.leadId === leadId);
  return ventasLead.map((v) => ({
    ...v,
    lineas: lineasMemoria.filter((l) => l.ventaId === v.id),
  }));
}
