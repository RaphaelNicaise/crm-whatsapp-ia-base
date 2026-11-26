import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { crearServidorMcp } from "../lib/mcp/server";

async function main() {
  const server = crearServidorMcp();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Servidor MCP de CRM WhatsApp IA escuchando por stdio...");
}

main().catch((err) => {
  console.error("Error fatal en servidor MCP:", err);
  process.exit(1);
});
