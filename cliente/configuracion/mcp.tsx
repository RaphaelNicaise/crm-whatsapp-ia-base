"use client";

import { Wrench } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import { BOTON } from "./controles";

const MCP_TOOLS: { nombre: string; categoria: string; descripcion: string }[] = [
  { nombre: "listar_leads", categoria: "Clientes", descripcion: "Lista clientes filtrados por estado o operador asignado." },
  { nombre: "asignar_lead", categoria: "Clientes", descripcion: "Asigna un cliente a un operador específico del equipo." },
  { nombre: "enviar_whatsapp", categoria: "WhatsApp", descripcion: "Envía un mensaje manual por WhatsApp (respetando bajas)." },
  { nombre: "listar_productos", categoria: "Catálogo", descripcion: "Consulta productos y servicios por categoría, búsqueda o estado." },
  { nombre: "crear_producto", categoria: "Catálogo", descripcion: "Crea un nuevo producto o servicio con precio y stock." },
  { nombre: "listar_ventas", categoria: "Ventas", descripcion: "Lista operaciones y pedidos filtrados por estado o búsqueda." },
  { nombre: "registrar_venta", categoria: "Ventas", descripcion: "Registra una nueva venta descontando stock automáticamente." },
  { nombre: "ver_consumo_ia", categoria: "IA", descripcion: "Consulta tokens consumidos y gasto acumulado en USD del mes." },
  { nombre: "leer_instrucciones", categoria: "IA", descripcion: "Lee las instrucciones activas actuales del asistente virtual." },
  { nombre: "actualizar_instrucciones", categoria: "IA", descripcion: "Actualiza las instrucciones activas del asistente virtual." },
  { nombre: "listar_usuarios", categoria: "Equipo", descripcion: "Lista los operadores y administradores registrados." },
];

export function BloqueMcp(): JSX.Element {
  const [origin, setOrigin] = useState("http://localhost:8000");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const endpoint = `${origin}/api/mcp`;
  const snippet = JSON.stringify(
    {
      mcpServers: {
        "crm-whatsapp": {
          url: endpoint,
          headers: {
            Authorization: "Bearer TU_MCP_TOKEN_AQUI",
          },
        },
      },
    },
    null,
    2,
  );

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2_000);
    } catch {
      // Ignorar si clipboard no disponible
    }
  };

  return (
    <div className="space-y-5 py-4">
      <p className="text-[13px] leading-5 text-secundario">
        Conecta Claude Desktop, Cursor o cualquier cliente compatible con <strong>Model Context Protocol (MCP)</strong> para
        operar tu CRM de forma remota.
      </p>

      <div className="rounded-lg border border-linea bg-lienzo px-3.5 py-2.5 text-[13px]">
        <span className="text-secundario">Endpoint remoto HTTP: </span>
        <code className="font-mono font-medium text-tinta">{endpoint}</code>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-secundario">Configuración JSON para tu cliente MCP:</span>
          <button type="button" onClick={() => void copiar()} className={BOTON}>
            {copiado ? "Copiado ✓" : "Copiar JSON"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-linea bg-lienzo p-3.5 text-[12px] text-tinta">
          {snippet}
        </pre>
      </div>

      {/* Listado de solo lectura de todas las herramientas del servidor MCP */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-secundario" />
          <h3 className="text-[14px] font-medium text-tinta">
            Herramientas disponibles en este servidor ({MCP_TOOLS.length})
          </h3>
        </div>
        <div className="divide-y divide-linea rounded-[10px] border border-linea bg-white">
          {MCP_TOOLS.map((tool) => (
            <div key={tool.nombre} className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <code className="font-mono text-[12.5px] font-semibold text-tinta">{tool.nombre}</code>
                <p className="text-[12px] text-secundario">{tool.descripcion}</p>
              </div>
              <span className="w-fit shrink-0 rounded-full bg-lienzo px-2.5 py-0.5 text-[11px] font-medium text-secundario">
                {tool.categoria}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
