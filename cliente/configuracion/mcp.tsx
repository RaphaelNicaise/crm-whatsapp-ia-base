"use client";

import { useEffect, useState, type JSX } from "react";
import { BOTON } from "./controles";

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
    <div className="space-y-3 py-4">
      <p className="text-[13px] leading-5 text-secundario">
        Conecta Claude Desktop, Cursor o cualquier cliente compatible con <strong>Model Context Protocol (MCP)</strong> para
        consultar leads, revisar consumo de IA, asignar operadores o enviar mensajes por WhatsApp.
      </p>
      <div className="rounded-lg border border-borde bg-fondo-suave px-3 py-2 text-[13px]">
        <span className="text-secundario">Endpoint remoto HTTP: </span>
        <code className="font-mono text-texto">{endpoint}</code>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-secundario">Configuración JSON para tu cliente MCP:</span>
          <button type="button" onClick={() => void copiar()} className={BOTON}>
            {copiado ? "Copiado ✓" : "Copiar JSON"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-borde bg-fondo p-3 text-[12px] text-texto">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
