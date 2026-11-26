import { gte, sql } from "drizzle-orm";
import { db, consumoIa } from "../index";

export interface ResumenModeloConsumo {
  proveedor: string;
  modelo: string;
  interacciones: number;
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number;
}

export interface ResumenConsumoMes {
  totalInteracciones: number;
  totalTokensEntrada: number;
  totalTokensSalida: number;
  totalCostoUsd: number;
  porModelo: ResumenModeloConsumo[];
}

export async function obtenerConsumoMesActual(): Promise<ResumenConsumoMes> {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();

  const filas = await db
    .select({
      proveedor: consumoIa.proveedor,
      modelo: consumoIa.modelo,
      interacciones: sql<number>`count(*)::int`,
      tokensEntrada: sql<number>`coalesce(sum(${consumoIa.tokensEntrada}), 0)::int`,
      tokensSalida: sql<number>`coalesce(sum(${consumoIa.tokensSalida}), 0)::int`,
      costoUsd: sql<number>`coalesce(sum(${consumoIa.costoUsd}::numeric), 0)::float8`,
    })
    .from(consumoIa)
    .where(gte(consumoIa.creadoEn, inicioMes))
    .groupBy(consumoIa.proveedor, consumoIa.modelo);

  let totalInteracciones = 0;
  let totalTokensEntrada = 0;
  let totalTokensSalida = 0;
  let totalCostoUsd = 0;

  for (const f of filas) {
    totalInteracciones += f.interacciones;
    totalTokensEntrada += f.tokensEntrada;
    totalTokensSalida += f.tokensSalida;
    totalCostoUsd += f.costoUsd;
  }

  return {
    totalInteracciones,
    totalTokensEntrada,
    totalTokensSalida,
    totalCostoUsd,
    porModelo: filas,
  };
}
