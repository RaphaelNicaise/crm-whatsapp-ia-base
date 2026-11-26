import { describe, it, expect } from "vitest";
import { conciliarComprobanteConVenta } from "../vision-comprobantes";

describe("Conciliación de Comprobantes de Pago", () => {
  it("valida exitosamente cuando el monto del comprobante coincide exactamente con la venta", () => {
    const res = conciliarComprobanteConVenta(
      { monto: 15000, referencia: "TRANSF-889" },
      { id: "vta-1", total: 15000 }
    );
    expect(res.coincide).toBe(true);
    expect(res.diferencia).toBe(0);
  });

  it("detecta diferencia si el monto transferido no cubre el total", () => {
    const res = conciliarComprobanteConVenta(
      { monto: 12000, referencia: "TRANSF-889" },
      { id: "vta-1", total: 15000 }
    );
    expect(res.coincide).toBe(false);
    expect(res.diferencia).toBe(-3000);
  });
});
