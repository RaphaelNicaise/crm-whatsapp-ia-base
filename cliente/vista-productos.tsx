"use client";

import { Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { BOTON, BOTON_PRINCIPAL, ENTRADA, SELECT } from "./configuracion/controles";

interface Producto {
  id: string;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  categoria: string | null;
  precio: number;
  stock: number;
  activo: boolean;
}

const INPUT = `${ENTRADA} w-full`;

export function VistaProductos(): JSX.Element {
  const [lista, setLista] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [buscar, setBuscar] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [estado, setEstado] = useState<"todos" | "activos" | "inactivos">("todos");

  // Alta
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [sku, setSku] = useState("");
  const [categoriaNueva, setCategoriaNueva] = useState("General");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("0");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Edición
  const [editando, setEditando] = useState<Producto | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editPrecio, setEditPrecio] = useState("");
  const [editStock, setEditStock] = useState("0");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editActivo, setEditActivo] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (buscar.trim()) params.set("buscar", buscar.trim());
      if (categoria !== "todas") params.set("categoria", categoria);
      if (estado !== "todos") params.set("estado", estado);
      const r = await fetch(`/api/productos?${params.toString()}`, { cache: "no-store" });
      const d = (await r.json()) as { ok?: boolean; productos?: Producto[] };
      if (d.ok && Array.isArray(d.productos)) setLista(d.productos);
    } finally {
      setCargando(false);
    }
  }, [buscar, categoria, estado]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const categorias = useMemo(() => {
    const set = new Set<string>(["General"]);
    for (const p of lista) if (p.categoria) set.add(p.categoria);
    return ["todas", ...Array.from(set)];
  }, [lista]);

  const kpis = useMemo(() => {
    const activos = lista.filter((p) => p.activo).length;
    const sinStock = lista.filter((p) => p.stock <= 0).length;
    return { total: lista.length, activos, sinStock };
  }, [lista]);

  const abrirEdicion = (p: Producto) => {
    setEditando(p);
    setEditNombre(p.nombre);
    setEditSku(p.sku ?? "");
    setEditCategoria(p.categoria ?? "General");
    setEditPrecio(p.precio.toString());
    setEditStock(p.stock.toString());
    setEditDescripcion(p.descripcion ?? "");
    setEditActivo(p.activo);
  };

  const cerrarEdicion = () => {
    setEditando(null);
  };

  useEffect(() => {
    if (!editando && !mostrarForm) return;
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (editando) cerrarEdicion();
        else if (mostrarForm) setMostrarForm(false);
      }
    };
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, [editando, mostrarForm]);

  const guardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setActualizando(true);
    try {
      const r = await fetch("/api/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editando.id,
          nombre: editNombre,
          sku: editSku || null,
          categoria: editCategoria || "General",
          precio: Number(editPrecio) || 0,
          stock: Number(editStock) || 0,
          descripcion: editDescripcion || null,
          activo: editActivo,
        }),
      });
      if (r.ok) {
        cerrarEdicion();
        await cargar();
      }
    } finally {
      setActualizando(false);
    }
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const r = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          sku: sku || undefined,
          categoria: categoriaNueva || "General",
          precio: Number(precio) || 0,
          stock: Number(stock) || 0,
          descripcion: descripcion || undefined,
        }),
      });
      if (r.ok) {
        setNombre("");
        setSku("");
        setPrecio("");
        setStock("0");
        setDescripcion("");
        setMostrarForm(false);
        await cargar();
      }
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (p: Producto, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch("/api/productos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, activo: !p.activo }),
    });
    await cargar();
  };

  const borrar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este producto del catálogo?")) return;
    await fetch(`/api/productos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await cargar();
  };

  return (
    <div className="space-y-5 pb-10">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] border border-linea bg-white p-4">
          <p className="text-[12px] text-secundario">Total productos / servicios</p>
          <p className="mt-1 text-[22px] font-semibold text-texto tabular-nums">{kpis.total}</p>
        </div>
        <div className="rounded-[14px] border border-linea bg-white p-4">
          <p className="text-[12px] text-secundario">Activos en catálogo</p>
          <p className="mt-1 text-[22px] font-semibold text-ok-texto tabular-nums">{kpis.activos}</p>
        </div>
        <div className="rounded-[14px] border border-linea bg-white p-4">
          <p className="text-[12px] text-secundario">Sin stock</p>
          <p className="mt-1 text-[22px] font-semibold text-atencion-texto tabular-nums">{kpis.sinStock}</p>
        </div>
      </div>

      {/* Filtros + Botón nuevo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-linea bg-white p-4">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-secundario" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o descripción…"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className={`${INPUT} pl-9`}
            />
          </div>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${SELECT} w-auto min-w-[160px]`}>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c === "todas" ? "Todas las categorías" : c}
              </option>
            ))}
          </select>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as "todos" | "activos" | "inactivos")}
            className={`${SELECT} w-auto min-w-[150px]`}
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
        <button type="button" onClick={() => setMostrarForm(!mostrarForm)} className={BOTON_PRINCIPAL}>
          <span className="inline-flex items-center gap-1.5">
            <Plus className="size-4" />
            Nuevo producto
          </span>
        </button>
      </div>

      {/* Formulario de alta */}
      {mostrarForm && (
        <form onSubmit={(e) => void crear(e)} className="space-y-3 rounded-[14px] border border-linea bg-white p-5">
          <h3 className="text-[15px] font-semibold text-texto">Nuevo producto o servicio</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input type="text" placeholder="Nombre *" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={INPUT} />
            <input type="text" placeholder="SKU / Código" value={sku} onChange={(e) => setSku(e.target.value)} className={INPUT} />
            <input type="text" placeholder="Categoría" value={categoriaNueva} onChange={(e) => setCategoriaNueva(e.target.value)} className={INPUT} />
            <input type="number" placeholder="Precio *" min={0} value={precio} onChange={(e) => setPrecio(e.target.value)} required className={INPUT} />
            <input type="number" placeholder="Stock inicial" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={INPUT} />
            <input
              type="text"
              placeholder="Descripción breve"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={`${INPUT} sm:col-span-2 lg:col-span-3`}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMostrarForm(false)} className={BOTON}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className={BOTON_PRINCIPAL}>
              {guardando ? "Guardando…" : "Guardar producto"}
            </button>
          </div>
        </form>
      )}

      {/* Modal de Edición de Producto */}
      {editando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrarEdicion();
          }}
        >
          <div className="w-full max-w-xl rounded-[16px] border border-linea bg-white dark:bg-[#18181b] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-linea pb-3">
              <h3 className="text-[16px] font-semibold text-texto flex items-center gap-2">
                <Pencil className="size-4 text-emerald-600" />
                Editar producto o servicio
              </h3>
              <button
                type="button"
                onClick={cerrarEdicion}
                className="rounded-lg p-1 text-secundario hover:bg-neutral-100 hover:text-texto dark:hover:bg-neutral-800"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={(e) => void guardarEdicion(e)} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-secundario">Nombre del producto *</label>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    required
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-secundario">SKU / Código</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-secundario">Categoría</label>
                  <input
                    type="text"
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-secundario">Precio ($) *</label>
                  <input
                    type="number"
                    min={0}
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(e.target.value)}
                    required
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-secundario">Stock disponible</label>
                  <input
                    type="number"
                    min={0}
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-secundario">Estado</label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="edit-activo"
                      checked={editActivo}
                      onChange={(e) => setEditActivo(e.target.checked)}
                      className="size-4 cursor-pointer rounded accent-emerald-600"
                    />
                    <label htmlFor="edit-activo" className="cursor-pointer text-[13px] text-texto">
                      {editActivo ? "Activo (visible para la IA y ventas)" : "Inactivo (oculto)"}
                    </label>
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[12px] font-medium text-secundario">Descripción</label>
                  <textarea
                    rows={2}
                    value={editDescripcion}
                    onChange={(e) => setEditDescripcion(e.target.value)}
                    className={`${INPUT} resize-none`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-linea pt-4">
                <button type="button" onClick={cerrarEdicion} className={BOTON}>
                  Cancelar
                </button>
                <button type="submit" disabled={actualizando} className={BOTON_PRINCIPAL}>
                  {actualizando ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-[14px] border border-linea bg-white">
        {cargando ? (
          <p className="p-6 text-[13px] text-secundario">Cargando catálogo…</p>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <Package className="size-8 text-secundario/50" />
            <p className="text-[14px] font-medium text-texto">Sin productos que coincidan</p>
            <p className="text-[13px] text-secundario">Crea tu primer producto o servicio para empezar a registrar ventas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-linea bg-fondo-suave text-[12px] text-secundario">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {lista.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => abrirEdicion(p)}
                    className="cursor-pointer transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-texto">{p.nombre}</div>
                      {p.sku && <div className="text-[11px] text-secundario">SKU: {p.sku}</div>}
                    </td>
                    <td className="px-4 py-3 text-secundario">{p.categoria ?? "General"}</td>
                    <td className="px-4 py-3 font-medium tabular-nums text-texto">${p.precio.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={p.stock <= 0 ? "font-medium text-error-texto" : "text-texto"}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => void toggleActivo(p, e)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          p.activo ? "bg-ok/15 text-ok-texto" : "bg-fondo-suave text-secundario"
                        }`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirEdicion(p);
                          }}
                          title="Editar producto"
                          className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-secundario hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-texto"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => void borrar(p.id, e)}
                          title="Eliminar"
                          className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-secundario hover:bg-error/10 hover:text-error-texto"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
