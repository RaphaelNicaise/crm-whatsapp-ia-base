import postgres from "postgres";
import { urlPostgres } from "./db";

/** Lo que necesita bd.ts para leer y escribir, dentro o fuera de una transacción. */
export interface Consultas {
  filas<T>(sql: string, parametros?: unknown[]): Promise<T[]>;
  /** Devuelve cuántas filas ha cambiado. */
  ejecutar(sql: string, parametros?: unknown[]): Promise<number>;
}

export interface Conexion extends Consultas {
  /** Todo junto o nada: si algo falla, se deshace lo anterior. */
  transaccion<T>(trabajo: (c: Consultas) => Promise<T>): Promise<T>;
  cerrar(): Promise<void>;
}

export type MotorBd = { motor: "postgres"; url: string };

const BIGINT = 20;

export function queBaseDeDatos(env: Record<string, string | undefined> = process.env): MotorBd {
  return { motor: "postgres", url: urlPostgres(env) };
}

export async function conectar(): Promise<Conexion> {
  const url = urlPostgres();
  const preparadas = !/:6543\//.test(url);
  const opciones = (parametros: unknown[]) => ({ prepare: preparadas && parametros.length > 0 });
  const ssl =
    /sslmode=disable/i.test(url) ||
    /@(localhost|127\.0\.0\.1|postgres|db|host\.docker\.internal)[:/]/.test(url)
      ? false
      : "require";

  const sql = postgres(url, {
    prepare: preparadas,
    max: 5,
    idle_timeout: 0,
    connect_timeout: 10,
    ssl,
    types: {
      milisegundos: {
        to: BIGINT,
        from: [BIGINT],
        serialize: (x: number) => String(x),
        parse: (x: string) => Number(x),
      },
    },
    onnotice: () => {},
  });

  const consultas = (s: postgres.Sql | postgres.TransactionSql): Consultas => ({
    filas: async <T>(texto: string, parametros: unknown[] = []) =>
      (await s.unsafe(texto, parametros as postgres.ParameterOrJSON<never>[], opciones(parametros))) as unknown as T[],
    ejecutar: async (texto, parametros = []) =>
      (await s.unsafe(texto, parametros as postgres.ParameterOrJSON<never>[], opciones(parametros))).count,
  });

  return {
    ...consultas(sql),
    transaccion: async (trabajo) => (await sql.begin((tx) => trabajo(consultas(tx)))) as Awaited<ReturnType<typeof trabajo>>,
    cerrar: () => sql.end({ timeout: 5 }),
  };
}

export function nombreDeTabla(sql: string): string {
  return sql.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i)?.[1] ?? sql.slice(0, 40);
}
