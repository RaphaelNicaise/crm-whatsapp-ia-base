import { describe, it, expect } from "vitest";
import { productos, ventas, lineasVenta } from "../db/schema";

describe("Esquema de Base de Datos - Productos y Ventas", () => {
  it("debe tener la estructura correcta para la tabla productos", () => {
    expect(productos).toBeDefined();
    expect(productos.id).toBeDefined();
    expect(productos.nombre).toBeDefined();
    expect(productos.precio).toBeDefined();
    expect(productos.stock).toBeDefined();
    expect(productos.activo).toBeDefined();
  });

  it("debe tener la estructura correcta para la tabla ventas", () => {
    expect(ventas).toBeDefined();
    expect(ventas.id).toBeDefined();
    expect(ventas.leadId).toBeDefined();
    expect(ventas.estado).toBeDefined();
    expect(ventas.total).toBeDefined();
  });

  it("debe tener la estructura correcta para la tabla lineas_venta", () => {
    expect(lineasVenta).toBeDefined();
    expect(lineasVenta.ventaId).toBeDefined();
    expect(lineasVenta.productoId).toBeDefined();
    expect(lineasVenta.precioUnitario).toBeDefined();
  });
});
