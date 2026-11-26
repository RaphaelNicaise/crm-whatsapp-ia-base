"use client";

import { Plus, Receipt, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type JSX } from "react";
import { BOTON, BOTON_PRINCIPAL, ENTRADA, SELECT } from "./configuracion/controles";

interface Venta {
  id: string;
  clienteNombre: string;
  estado: "borrador" | "pendiente_pago" | "pagada" | "cancelada";
  metodoPago: string;
  total: number;
  notas: string | null;
  creadoEn: number;
  items: { productoNombre: string; cantidad: number; subtotal: number }[];
}

interface ResumenVentas {
  totalVentas: number;
  ingresosPagados: number;
  pendienteCobro: number;
}

interface ProductoMin {
  id: string;
  nombre: string;
  precio: number;
}

const INPUT = `${ENTRADA} w-full`;

const ETIQUETA_ESTADO: Record<Venta["estado"], { texto: string; clase: string }> = {
  pagada: { texto: "Pagada", clase: "bg-ok/15 text-ok-texto" },
  pendiente_pago: { texto: "Pendiente", clase: "bg-atencion/15 text-atencion-texto" },
  borrador: { texto: "Borrador", clase: "bg-fondo-suave text-secundario" },
  cancelada: { texto: "Cancelada", clase: "bg-error/15 text-error-texto" },
};

export function VistaVentas(): JSX.Element {
  const [lista, setLista] = useState<Venta[]>([]);
  const [resumen, setResumen] = useState<ResumenVentas>({ totalVentas: 0, ingresosPagados: 0, pendienteCobro: 0 });
  const [productos, setProductos] = useState<ProductoMin[]>([]);
  const [cargando, setCargando] = useState(true);

  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("todos");
  const [metodoPago, setMetodoPago] = useState("todos");

  const [mostrarForm, setMostrarForm] = useState(false);
  const [clienteNombre, setClienteNombre] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [metodoNuevo, setMetodoNuevo] = useState("efectivo");
  const [estadoNuevo, setEstadoNuevo] = useState<Venta["estado"]>("pagada");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (buscar.trim()) params.set("buscar", buscar.trim());
      if (estado !== "todos") params.set("estado", estado);
      if (metodoPago !== "todos") params.set("metodoPago", metodoPago);

      const [rV, rP] = await Promise.all([
        fetch(`/api/ventas?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/productos?estado=activos", { cache: "no-store" }),
      ]);
      const dV = (await rV.json()) as { ok?: boolean; ventas?: Venta[]; resumen?: ResumenVentas };
      const dP = (await rP.json()) as { ok?: boolean; productos?: ProductoMin[] };

      if (dV.ok) {
        setLista(dV.ventas ?? []);
        if (dV.resumen) setResumen(dV.resumen);
      }
      if (dP.ok && Array.isArray(dP.productos)) {
        setProductos(dP.productos);
        if (!productoId && dP.productos.length > 0) setProductoId(dP.productos[0].id);
      }
    } finally {
      setCargando(false);
    }
  }, [buscar, estado, metodoPago, productoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId) return;
    setGuardando(true);
    try {
      const r = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNombre: clienteNombre || "Cliente directo",
          metodoPago: metodoNuevo,
          estado: estadoNuevo,
          notas: notas || undefined,
          items: [{ productoId, cantidad: Number(cantidad) || 1 }],
        }),
      });
      if (r.ok) {
        setClienteNombre("");
        setCantidad("1");
        setNotas("");
        setMostrarForm(false);
        await cargar();
      }
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: Venta["estado"]) => {
    await fetch("/api/ventas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado: nuevoEstado }),
    });
    await cargar();
  };

  const borrar = async (id: string) => {
    await fetch(`/api/ventas?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await cargar();
  };

  return (
    <div className="space-y-5 pb-10">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] border border-linea bg-white p-4">
          <p className="text-[12px] text-secundario">Ingresos cobrados</p>
          <p className="mt-1 text-[22px] font-semibold text-ok-texto tabular-nums">${resumen.ingresosPagados.toLocaleString()}</p>
        </div>
        <div className="rounded-[14px] border border-linea bg-white p-4">
          <p className="text-[12px] text-secundario">Pendiente de cobro</p>
          <p className="mt-1 text-[22px] font-semibold text-atencion-texto tabular-nums">${resumen.pendienteCobro.toLocaleString()}</p>
        </div>
        <div className="rounded-[14px] border border-linea bg-white p-4">
          <p className="text-[12px] text-secundario">Total operaciones</p>
          <p className="mt-1 text-[22px] font-semibold text-texto tabular-nums">{resumen.totalVentas}</p>
        </div>
      </div>

      {/* Filtros + Botón nuevo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-linea bg-white p-4">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-secundario" />
            <input
              type="text"
              placeholder="Buscar por cliente o notas…"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className={`${INPUT} pl-9`}
            />
          </div>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className={`${SELECT} w-auto min-w-[155px]`}>
            <option value="todos">Todos los estados</option>
            <option value="pagada">Pagadas</option>
            <option value="pendiente_pago">Pendientes</option>
            <option value="borrador">Borradores</option>
            <option value="cancelada">Canceladas</option>
          </select>
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className={`${SELECT} w-auto min-w-[165px]`}>
            <option value="todos">Todos los métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </div>
        <button type="button" onClick={() => setMostrarForm(!mostrarForm)} className={BOTON_PRINCIPAL}>
          <span className="inline-flex items-center gap-1.5">
            <Plus className="size-4" />
            Nueva venta
          </span>
        </button>
      </div>

      {/* Formulario nueva venta */}
      {mostrarForm && (
        <form onSubmit={(e) => void registrar(e)} className="space-y-3 rounded-[14px] border border-linea bg-white p-5">
          <h3 className="text-[15px] font-semibold text-texto">Registrar nueva venta</h3>
          {productos.length === 0 ? (
            <p className="text-[13px] text-atencion-texto">Primero crea al menos un producto activo en la sección Productos.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                type="text"
                placeholder="Nombre del cliente *"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                required
                className={INPUT}
              />
              <select value={productoId} onChange={(e) => setProductoId(e.target.value)} className={`${SELECT} w-full`}>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (${p.precio.toLocaleString()})
                  </option>
                ))}
              </select>
              <input type="number" min={1} placeholder="Cantidad" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={INPUT} />
              <select value={metodoNuevo} onChange={(e) => setMetodoNuevo(e.target.value)} className={`${SELECT} w-full`}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="mercadopago">Mercado Pago</option>
              </select>
              <select value={estadoNuevo} onChange={(e) => setEstadoNuevo(e.target.value as Venta["estado"])} className={`${SELECT} w-full`}>
                <option value="pagada">Pagada</option>
                <option value="pendiente_pago">Pendiente de pago</option>
                <option value="borrador">Borrador</option>
              </select>
              <input type="text" placeholder="Notas opcionales" value={notas} onChange={(e) => setNotas(e.target.value)} className={INPUT} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMostrarForm(false)} className={BOTON}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando || productos.length === 0} className={BOTON_PRINCIPAL}>
              {guardando ? "Registrando…" : "Guardar venta"}
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-[14px] border border-linea bg-white">
        {cargando ? (
          <p className="p-6 text-[13px] text-secundario">Cargando ventas…</p>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <Receipt className="size-8 text-secundario/50" />
            <p className="text-[14px] font-medium text-texto">Sin ventas registradas</p>
            <p className="text-[13px] text-secundario">Registra tu primera operación para visualizar ingresos y métricas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-linea bg-fondo-suave text-[12px] text-secundario">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {lista.map((v) => {
                  const est = ETIQUETA_ESTADO[v.estado] ?? ETIQUETA_ESTADO.borrador;
                  return (
                    <tr key={v.id} className="hover:bg-fondo-suave/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-texto">{v.clienteNombre}</div>
                        <div className="text-[11px] text-secundario">{new Date(v.creadoEn).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3 text-secundario">
                        {v.items.map((it) => `${it.cantidad}x ${it.productoNombre}`).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 capitalize text-secundario">{v.metodoPago}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">${v.total.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={v.estado}
                          onChange={(e) => void cambiarEstado(v.id, e.target.value as Venta["estado"])}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${est.clase}`}
                        >
                          <option value="pagada">Pagada</option>
                          <option value="pendiente_pago">Pendiente</option>
                          <option value="borrador">Borrador</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void borrar(v.id)}
                          title="Eliminar"
                          className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-secundario hover:bg-error/10 hover:text-error-texto"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
