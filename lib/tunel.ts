import type { ErrorExplicado } from "./errores";

export interface EstadoTunel {
  abierto: boolean;
  url: string | null;
  error: ErrorExplicado | null;
  desde: number | null;
}

const CERRADO: EstadoTunel = { abierto: false, url: null, error: null, desde: null };

function variable(nombre: "CRM_DOMINIO" | "CRM_URL_PUBLICA"): string | null {
  return process.env[nombre]?.trim() || null;
}

export function estadoTunel(): EstadoTunel {
  return { ...CERRADO };
}

export function tokenNgrok(): string | null {
  return null;
}

export function modoServidor(): boolean {
  return !!variable("CRM_DOMINIO");
}

export function urlPublica(): string | null {
  const dominio = variable("CRM_DOMINIO");
  if (dominio) return `https://${dominio}`;
  const publica = variable("CRM_URL_PUBLICA");
  if (publica) return publica.replace(/\/+$/, "");
  return null;
}

export function webhookPublico(): string | null {
  const base = urlPublica();
  return base ? `${base}/webhook` : null;
}

export function estadoAcceso(): "ok" | "error" | "desconocido" {
  return "ok";
}

export async function abrirTunel(_opciones?: string | { token?: string }): Promise<EstadoTunel> {
  return { ...CERRADO };
}

export async function cerrarTunel(): Promise<void> {
  // Sin túnel ngrok en modo Docker/PostgreSQL
}

export function esHostLocal(host: string): boolean {
  const limpio = host.toLowerCase().split(":")[0];
  return limpio === "localhost" || limpio === "127.0.0.1" || limpio === "::1";
}
