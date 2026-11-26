import { describe, it, expect } from "vitest";
import {
  listarProductosMemoria,
  crearProductoMemoria,
  actualizarStockMemoria,
  reiniciarProductosMemoria,
} from "../db/repositorios/productos";

describe("Repositorio de Productos", () => {
  it("crea un producto con stock y precio válido", async () => {
    reiniciarProductosMemoria();
    const prod = await crearProductoMemoria({
      id: "prod-1",
      nombre: "Tirante Pino 2x4",
      precio: 1500,
      stock: 20,
      activo: true,
      sku: "PINO-24",
      categoria: "Madera",
      descripcion: "Madera de primera calidad",
    });

    expect(prod.id).toBe("prod-1");
    expect(prod.precio).toBe(1500);
    expect(prod.stock).toBe(20);
  });

  it("filtra productos por búsqueda textual", async () => {
    const lista = await listarProductosMemoria({ busqueda: "Tirante" });
    expect(lista.length).toBeGreaterThan(0);
    expect(lista[0].nombre).toContain("Tirante");
  });

  it("actualiza el stock descontando unidades vendidas", async () => {
    const actualizado = await actualizarStockMemoria("prod-1", -5);
    expect(actualizado.stock).toBe(15);
  });
});
