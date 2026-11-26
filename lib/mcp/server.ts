import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { obtenerConsumoMesActual } from "../db/repositorios/consumo.repo";
import { asignarLeadUsuario, listarLeadsDrizzle } from "../db/repositorios/leads.repo";
import { crearProducto, listarProductos } from "../db/repositorios/productos.repo";
import { listarUsuarios } from "../db/repositorios/usuarios.repo";
import { crearVenta, listarVentas } from "../db/repositorios/ventas.repo";
import { enviarTexto } from "../whatsapp";

/**
 * Crea una instancia del servidor MCP con las herramientas de gestión del CRM.
 */
export function crearServidorMcp(): McpServer {
  const server = new McpServer({
    name: "crm-whatsapp-ia",
    version: "1.0.0",
  });

  server.tool(
    "listar_leads",
    "Lista los clientes/leads del CRM filtrados opcionalmente por estado o usuario asignado.",
    {
      estado: z
        .enum(["nuevo", "conversacion", "visita", "persona", "spam"])
        .optional()
        .describe("Filtrar por estado del lead"),
      asignadoA: z.string().optional().describe("ID del operador asignado"),
      limite: z.number().int().min(1).max(100).optional().describe("Cantidad máxima de resultados"),
    },
    async ({ estado, asignadoA, limite }) => {
      const lista = await listarLeadsDrizzle({ estado, asignadoA, limite });
      return {
        content: [{ type: "text", text: JSON.stringify(lista, null, 2) }],
      };
    },
  );

  server.tool(
    "ver_consumo_ia",
    "Muestra el consumo de tokens y costo acumulado en USD del mes actual desglosado por modelo.",
    {},
    async () => {
      const resumen = await obtenerConsumoMesActual();
      return {
        content: [{ type: "text", text: JSON.stringify(resumen, null, 2) }],
      };
    },
  );

  server.tool(
    "listar_usuarios",
    "Lista los operadores y administradores registrados en el CRM.",
    {},
    async () => {
      const usuarios = await listarUsuarios();
      return {
        content: [{ type: "text", text: JSON.stringify(usuarios, null, 2) }],
      };
    },
  );

  server.tool(
    "asignar_lead",
    "Asigna un lead a un operador específico del CRM (o pasa null para dejarlo sin asignar).",
    {
      leadId: z.string().min(1).describe("ID del lead"),
      usuarioId: z.string().nullable().describe("ID del usuario o null"),
    },
    async ({ leadId, usuarioId }) => {
      const ok = await asignarLeadUsuario(leadId, usuarioId);
      return {
        content: [
          {
            type: "text",
            text: ok ? `Lead ${leadId} actualizado correctamente.` : `No se encontró el lead ${leadId}.`,
          },
        ],
      };
    },
  );

  server.tool(
    "leer_instrucciones",
    "Lee las instrucciones activas del asistente virtual (agente.md).",
    {},
    async () => {
      const ruta = path.join(/*turbopackIgnore: true*/ process.cwd(), "agente.md");
      try {
        const texto = readFileSync(ruta, "utf8");
        return { content: [{ type: "text", text: texto }] };
      } catch {
        return { content: [{ type: "text", text: "No se encontró el archivo agente.md." }] };
      }
    },
  );

  server.tool(
    "actualizar_instrucciones",
    "Reemplaza las instrucciones activas del asistente virtual en agente.md.",
    {
      instrucciones: z.string().min(50).describe("Contenido completo en Markdown de agente.md"),
    },
    async ({ instrucciones }) => {
      const ruta = path.join(/*turbopackIgnore: true*/ process.cwd(), "agente.md");
      writeFileSync(ruta, instrucciones, "utf8");
      return {
        content: [{ type: "text", text: "Instrucciones de agente.md actualizadas correctamente." }],
      };
    },
  );

  server.tool(
    "enviar_whatsapp",
    "Envía un mensaje de texto manual por WhatsApp a un teléfono (dentro de la ventana de 24h de Meta).",
    {
      telefono: z.string().min(6).describe("Número de teléfono en formato internacional sin +"),
      mensaje: z.string().min(1).max(4000).describe("Texto del mensaje a enviar"),
    },
    async ({ telefono, mensaje }) => {
      const leads = await listarLeadsDrizzle({ limite: 100 });
      const encontrado = leads.find((l) => l.telefono === telefono);
      if (encontrado?.silenciadoEn) {
        return {
          content: [{ type: "text", text: "El cliente solicitó no recibir más mensajes (baja/silencio activo)." }],
        };
      }
      const wamid = await enviarTexto(telefono, mensaje);
      return {
        content: [{ type: "text", text: `Mensaje enviado. ID Meta (wamid): ${wamid}` }],
      };
    },
  );

  server.tool(
    "listar_productos",
    "Lista el catálogo de productos y servicios del negocio filtrados opcionalmente.",
    {
      buscar: z.string().optional().describe("Texto a buscar en nombre, SKU o descripción"),
      categoria: z.string().optional().describe("Filtrar por categoría"),
      soloActivos: z.boolean().optional().describe("Si true, solo muestra productos activos"),
    },
    async ({ buscar, categoria, soloActivos }) => {
      const lista = await listarProductos({ buscar, categoria, soloActivos });
      return { content: [{ type: "text", text: JSON.stringify(lista, null, 2) }] };
    },
  );

  server.tool(
    "crear_producto",
    "Crea un nuevo producto o servicio en el catálogo.",
    {
      nombre: z.string().min(1),
      precio: z.number().min(0),
      categoria: z.string().optional(),
      stock: z.number().int().min(0).optional(),
      sku: z.string().optional(),
      descripcion: z.string().optional(),
    },
    async (datos) => {
      const creado = await crearProducto(datos);
      return { content: [{ type: "text", text: JSON.stringify(creado, null, 2) }] };
    },
  );

  server.tool(
    "listar_ventas",
    "Lista las ventas y pedidos registrados en el CRM.",
    {
      estado: z.enum(["todos", "borrador", "pendiente_pago", "pagada", "cancelada"]).optional(),
      buscar: z.string().optional(),
    },
    async ({ estado, buscar }) => {
      const lista = await listarVentas({ estado, buscar });
      return { content: [{ type: "text", text: JSON.stringify(lista, null, 2) }] };
    },
  );

  server.tool(
    "registrar_venta",
    "Registra una venta nueva descontando stock automáticamente.",
    {
      clienteNombre: z.string().min(1),
      estado: z.enum(["borrador", "pendiente_pago", "pagada", "cancelada"]).optional(),
      metodoPago: z.string().optional(),
      items: z.array(z.object({ productoId: z.string(), cantidad: z.number().int().min(1) })).min(1),
    },
    async (datos) => {
      const creada = await crearVenta(datos);
      return { content: [{ type: "text", text: JSON.stringify(creada, null, 2) }] };
    },
  );

  return server;
}
