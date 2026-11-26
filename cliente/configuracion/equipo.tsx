"use client";

import { useCallback, useEffect, useState, type JSX } from "react";
import { BOTON_PRINCIPAL, ErrorCampo } from "./controles";

const INPUT_CLASS =
  "w-full rounded-lg border border-borde bg-fondo px-3 py-2 text-[13px] text-texto focus:border-principal focus:outline-none";

interface UsuarioLista {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  creadoEn: number;
}

export function BloqueEquipo(): JSX.Element {
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"operador" | "admin">("operador");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/usuarios", { cache: "no-store" });
      const d = (await r.json()) as { ok?: boolean; usuarios?: UsuarioLista[] };
      if (d.ok && Array.isArray(d.usuarios)) setUsuarios(d.usuarios);
    } catch {
      // Silencio si falla carga inicial
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const r = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, rol }),
      });
      const d = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) {
        setError(d.error ?? "No se pudo crear el usuario");
      } else {
        setNombre("");
        setEmail("");
        setPassword("");
        setRol("operador");
        await cargar();
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <p className="text-[13px] leading-5 text-secundario">
        Gestiona los operadores y administradores que pueden iniciar sesión y atender clientes asignados.
      </p>

      {cargando ? (
        <p className="text-[13px] text-secundario">Cargando usuarios…</p>
      ) : usuarios.length === 0 ? (
        <p className="rounded-lg border border-borde bg-fondo-suave px-3 py-2 text-[13px] text-secundario">
          Todavía no hay usuarios creados. Crea el primer administrador debajo.
        </p>
      ) : (
        <div className="divide-y divide-linea rounded-lg border border-borde">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-3 py-2.5 text-[13px]">
              <div>
                <span className="font-medium text-texto">{u.nombre}</span>
                <span className="ml-2 text-secundario">{u.email}</span>
              </div>
              <span className="rounded-full bg-fondo-suave px-2.5 py-0.5 text-[11px] font-medium uppercase text-secundario">
                {u.rol}
              </span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={(e) => void crear(e)} className="space-y-3 rounded-lg border border-borde bg-fondo-suave p-3.5">
        <p className="text-[13px] font-medium text-texto">Agregar usuario</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className={INPUT_CLASS}
          />
          <input
            type="email"
            placeholder="correo@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={INPUT_CLASS}
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className={INPUT_CLASS}
          />
          <select value={rol} onChange={(e) => setRol(e.target.value as "operador" | "admin")} className={INPUT_CLASS}>
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <ErrorCampo error={error} />
        <div className="flex justify-end">
          <button type="submit" disabled={guardando} className={BOTON_PRINCIPAL}>
            {guardando ? "Guardando…" : "Crear usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}
