import { obtenerConsumoMesActual } from "@/lib/db/repositorios/consumo.repo";
import { MODELOS, NOMBRES_MODELO } from "@/lib/configuracion";
import { PRECIOS } from "@/lib/precios";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const consumo = await obtenerConsumoMesActual();
    const modelos = MODELOS.map((id) => ({
      id,
      nombre: NOMBRES_MODELO[id],
      precios: PRECIOS[id],
    }));
    return Response.json({ ok: true, consumo, modelos });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al consultar consumo" },
      { status: 500 },
    );
  }
}
