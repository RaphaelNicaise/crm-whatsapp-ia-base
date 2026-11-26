import { describe, it, expect, beforeEach } from "vitest";
import { crearProductoMemoria, reiniciarProductosMemoria } from "../db/repositorios/productos";
import {
  crearVentaMemoria,
  marcarVentaPagadaMemoria,
  reiniciarVentasMemoria,
} from "../db/repositorios/ventas";

describe("Gestión de Ventas y Cotizaciones", () => {
  beforeEach(async () => {
    reiniciarProductosMemoria();
    reiniciarVentasMemoria();
    await crearProductoMemoria({
      id: "prod-tablon",
      nombre: "Tablón Eucalipto",
      precio: 2000,
      stock: 10,
      activo: true,
    });
  });

  it("crea una venta calculando subtotales y total automáticamente", async () => {
    const venta = await crearVentaMemoria("lead-123", [
      { productoId: "prod-tablon", cantidad: 3 },
    ]);

    expect(venta.leadId).toBe("lead-123");
    expect(venta.estado).toBe("pendiente_pago");
    expect(venta.total).toBe(6000);
    expect(venta.lineas.length).toBe(1);
    expect(venta.lineas[0].subtotal).toBe(6000);
  });

  it("permite marcar la venta como pagada con timestamp", async () => {
    const venta = await crearVentaMemoria("lead-123", [
      { productoId: "prod-tablon", cantidad: 1 },
    ]);
    const pagada = await marcarVentaPagadaMemoria(venta.id);

    expect(pagada.estado).toBe("pagada");
    expect(pagada.pagadoEn).toBeGreaterThan(0);
  });
});
