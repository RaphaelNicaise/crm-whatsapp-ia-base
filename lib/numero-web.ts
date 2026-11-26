import { numeroDelNegocio } from "./meta";

/** Las cifras del número de la web; sin conectar (o sin saberlo aún), null. */
export function cifrasDeLaWeb(): string | null {
  try {
    return numeroDelNegocio()?.texto.replace(/\D/g, "") || null;
  } catch {
    return null;
  }
}
