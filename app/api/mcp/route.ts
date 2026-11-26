import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { crearServidorMcp } from "@/lib/mcp/server";

export const dynamic = "force-dynamic";

function autorizado(request: Request): boolean {
  const tokenEsperado = process.env.MCP_TOKEN?.trim();
  if (!tokenEsperado) return true; // En local sin MCP_TOKEN se permite acceso directo
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${tokenEsperado}`;
}

async function manejarMcp(request: Request): Promise<Response> {
  if (!autorizado(request)) {
    return Response.json({ error: "No autorizado: falta MCP_TOKEN válido" }, { status: 401 });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless para compatibilidad serverless/Next.js
  });
  const server = crearServidorMcp();
  await server.connect(transport);
  return transport.handleRequest(request);
}

export async function GET(request: Request) {
  return manejarMcp(request);
}

export async function POST(request: Request) {
  return manejarMcp(request);
}

export async function DELETE(request: Request) {
  return manejarMcp(request);
}
