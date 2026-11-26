export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: true, modo: "oficial", fase: "apagado", permitidos: [] });
}

export async function POST() {
  return Response.json(
    { ok: false, error: "El modo prueba local con QR fue deshabilitado. Usa la API oficial de Meta." },
    { status: 400 },
  );
}
