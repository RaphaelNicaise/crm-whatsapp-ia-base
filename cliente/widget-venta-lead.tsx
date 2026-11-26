"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, CheckCircle, Plus } from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
}

export function WidgetVentaLead({ leadId }: { leadId: string }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [seleccionados, setSeleccionados] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    fetch("/api/productos")
      .then((r) => r.json())
      .then((data) => setProductos(Array.isArray(data) ? data : []))
      .catch(() => setProductos([]));
  }, []);

  const total = Object.entries(seleccionados).reduce((acc, [id, cant]) => {
    const prod = productos.find((p) => p.id === id);
    return acc + (prod ? prod.precio * cant : 0);
  }, 0);

  const agregarItem = (id: string) => {
    setSeleccionados((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const crearPresupuesto = async () => {
    setCargando(true);
    const items = Object.entries(seleccionados)
      .filter(([_, cant]) => cant > 0)
      .map(([productoId, cantidad]) => ({ productoId, cantidad }));

    await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, items }),
    });
    setCargando(false);
    alert("¡Presupuesto y venta guardada con éxito!");
  };

  return (
    <div className="border border-linea rounded-xl p-3 bg-fondo/50 space-y-3 mt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-principal">
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
          Cotización / Venta Rápida
        </h4>
        <span className="text-xs font-bold text-principal">Total: ${total.toLocaleString()}</span>
      </div>

      {productos.length > 0 ? (
        <div className="max-h-36 overflow-y-auto space-y-1">
          {productos.map((prod) => (
            <div key={prod.id} className="flex items-center justify-between bg-fondo p-2 rounded border border-linea text-xs">
              <span className="truncate max-w-[180px]">{prod.nombre} (${prod.precio})</span>
              <button
                type="button"
                onClick={() => agregarItem(prod.id)}
                className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-secundario">No hay productos cargados en catálogo.</p>
      )}

      {total > 0 && (
        <button
          type="button"
          disabled={cargando}
          onClick={crearPresupuesto}
          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {cargando ? "Guardando..." : "Confirmar Cotización"}
        </button>
      )}
    </div>
  );
}
