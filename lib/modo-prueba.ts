// Modo oficial de Meta Cloud API (se eliminó el puente local no oficial Baileys).

export interface ConfigModoPrueba {
  version: 1;
  modo: "prueba";
  secreto: string;
  permitidos: string[];
  aceptadoEn: number;
}

export function leerModoPrueba(): ConfigModoPrueba | null {
  return null;
}

export function esModoPrueba(): boolean {
  return false;
}

export function modoWhatsApp(): "oficial" | "prueba" {
  return "oficial";
}

export function urlEnvioWhatsApp(phoneNumberId: string): string {
  const base = (process.env.GRAPH_BASE_URL || "https://graph.facebook.com/v21.0").replace(/\/+$/, "");
  return `${base}/${phoneNumberId}/messages`;
}

export function cabecerasEnvioWhatsApp(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
