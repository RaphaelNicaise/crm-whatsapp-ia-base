import { z } from "zod";

export const ComprobanteSchema = z.object({
  monto: z.number().describe("Monto exacto transferido"),
  banco: z.string().optional().describe("Banco o billetera virtual de origen"),
  referencia: z.string().optional().describe("Número de operación o comprobante"),
  fecha: z.string().optional().describe("Fecha y hora del comprobante"),
});

export type DatosComprobante = z.infer<typeof ComprobanteSchema>;

/**
 * Concilia el importe leído por IA con el importe pendiente de la orden de venta.
 */
export function conciliarComprobanteConVenta(
  comprobante: { monto: number; referencia?: string },
  venta: { id: string; total: number }
): { coincide: boolean; diferencia: number } {
  const diferencia = comprobante.monto - venta.total;
  return {
    coincide: diferencia === 0,
    diferencia,
  };
}
