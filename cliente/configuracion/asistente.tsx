"use client";

import { useEffect, useId, useRef, useState, type JSX } from "react";
import type { EstadoPlantilla } from "@/lib/api-tipos";
import { LIMITES, MODELOS, NOMBRES_MODELO, type IdModelo } from "@/lib/configuracion";
import { PRECIOS } from "@/lib/precios";
import { formatoTelefono } from "@/lib/regional";
import type { Bd } from "@/lib/tipos";
import { cambiarAsistente, enviarAvisoPrueba } from "../api-sistema";
import { CampoClave } from "../campo-clave";
import { ChatDePrueba } from "../chat-de-prueba";
import { confirmar } from "../confirmaciones";
import { useModoPrueba } from "../modo-prueba";
import { useEstado } from "../sistema";
import { guardarInformacion } from "./api";
import { guardarCampo } from "./guardar";
import { IconoModelo } from "./iconos-modelos";
import {
  AREA,
  Ayuda,
  BOTON,
  BOTON_PRINCIPAL,
  CampoTexto,
  ErrorCampo,
  EstadoGuardado,
  Fila,
  Interruptor,
  LineaAtencion,
  SELECT,
  Segmentado,
  cifra,
  useGuardado,
} from "./controles";
import type { PropsBloque } from "./negocio";

// Bloque 2 · «Tu asistente»: si contesta, lo que tiene que saber, el trato, el móvil de los avisos y
// el chat de prueba.

export function BloqueAsistente(
  p: PropsBloque & {
    bd: Bd;
    plantillas: EstadoPlantilla[] | null;
    releerPlantillas: () => Promise<void>;
    /** Lo que deja «Avanzado» al guardar las instrucciones completas: se pinta sin esperar a la recarga. */
    informacionNueva: { texto: string; vez: number } | null;
  },
): JSX.Element {
  return (
    <>
      <Contesta {...p} />
      <SelectorModeloYConsumo {...p} />
      <Informacion {...p} />
      <Trato {...p} />
      <Avisos {...p} />
      <div className="py-4">
        <span className="text-[14px] leading-5 font-medium">Probar tu asistente</span>
        <div className="mt-2.5">
          <ChatDePrueba />
        </div>
      </div>
    </>
  );
}

// ─── Modelo de IA y Consumo ──────────────────────────────────────────────────────────────────────

interface ResumenConsumoApi {
  totalInteracciones: number;
  totalTokensEntrada: number;
  totalTokensSalida: number;
  totalCostoUsd: number;
}

function SelectorModeloYConsumo({ bd, datos, refrescar }: PropsBloque & { bd: Bd }): JSX.Element {
  const idEtiqueta = useId();
  const idAyuda = useId();
  const g = useGuardado();
  const actual = bd.configuracion?.sistema.asistente.modelo ?? datos.activa.sistema.asistente.modelo ?? "gpt-4o-mini";
  const [modelo, setModelo] = useState<IdModelo>(actual);
  const [consumo, setConsumo] = useState<ResumenConsumoApi | null>(null);

  useEffect(() => {
    setModelo(actual);
  }, [actual]);

  useEffect(() => {
    let vivo = true;
    fetch("/api/asistente/consumo", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { ok?: boolean; consumo?: ResumenConsumoApi }) => {
        if (vivo && d.ok && d.consumo) setConsumo(d.consumo);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const elegirModelo = async (nuevo: IdModelo) => {
    const anterior = modelo;
    setModelo(nuevo);
    const ok = await g.ejecutar(async () => {
      const check = await fetch("/api/asistente/modelo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelo: nuevo }),
      }).then((r) => r.json() as Promise<{ ok: boolean; error?: string }>);
      if (!check.ok) return { ok: false, error: check.error ?? "No se pudo validar la clave de este modelo" };
      const r = await guardarCampo("sistema.asistente.modelo", nuevo);
      return r.ok ? { ok: true } : { ok: false, error: r.error };
    });
    if (!ok) setModelo(anterior);
    else void refrescar();
  };

  const p = PRECIOS[modelo];

  return (
    <Fila
      etiqueta="Modelo de IA y Consumo"
      idEtiqueta={idEtiqueta}
      ayuda="Elige el modelo que contesta a tus clientes. Cada uno tiene sus características y precios."
      idAyuda={idAyuda}
      g={g}
    >
      <div className="space-y-3.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MODELOS.map((id) => {
            const activo = modelo === id;
            const precio = PRECIOS[id];
            return (
              <button
                key={id}
                type="button"
                disabled={g.estado === "guardando"}
                onClick={() => void elegirModelo(id)}
                className={`flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 text-left transition-all ${
                  activo
                    ? "border-marca bg-marca/5 ring-1 ring-marca shadow-xs dark:bg-marca/10"
                    : "border-linea bg-white hover:border-linea/80 hover:bg-black/[0.015] dark:bg-lienzo dark:hover:bg-white/[0.02]"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <IconoModelo modelo={id} className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[13px] font-medium leading-4 text-tinta">
                      {id === "gpt-4o-mini"
                        ? "GPT-4o Mini"
                        : id === "gemini-2.0-flash"
                          ? "Gemini 2.0 Flash"
                          : id === "claude-haiku-5-5"
                            ? "Claude Haiku 3.5"
                            : "Claude Sonnet 3.5"}
                    </span>
                    <span className="text-[11px] font-mono text-secundario">
                      ${precio.entrada.toFixed(2)}/1M
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-3.5 text-secundario">
                    {id.startsWith("gpt")
                      ? "OpenAI · Equilibrado"
                      : id.startsWith("gemini")
                        ? "Google · Ultrarrápido"
                        : id.includes("haiku")
                          ? "Anthropic · Preciso con reglas"
                          : "Anthropic · Máxima calidad"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-[10px] border border-linea bg-lienzo p-3.5">
          {modelo.startsWith("gpt") && <CampoClave nombre="OPENAI_API_KEY" etiqueta="Token de API (OpenAI)" />}
          {modelo.startsWith("gemini") && <CampoClave nombre="GEMINI_API_KEY" etiqueta="Token de API (Google Gemini)" />}
          {modelo.startsWith("claude") && <CampoClave nombre="ANTHROPIC_API_KEY" etiqueta="Token de API (Anthropic Claude)" />}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-linea bg-lienzo px-3.5 py-2.5 text-[12px] text-secundario">
          <span>
            Modelo activo: <strong>{NOMBRES_MODELO[modelo]}</strong>
          </span>
          {consumo && (
            <span>
              Este mes: <strong>{consumo.totalInteracciones}</strong> resp. ·{" "}
              <strong>{(consumo.totalTokensEntrada + consumo.totalTokensSalida).toLocaleString()}</strong> tokens ·{" "}
              <strong>${consumo.totalCostoUsd.toFixed(4)} USD</strong>
            </span>
          )}
        </div>
      </div>
    </Fila>
  );
}

// ─── Contesta a los clientes ──────────────────────────────────────────────────────────────────────

function Contesta({ bd, datos, refrescar }: PropsBloque & { bd: Bd }): JSX.Element {
  const idEtiqueta = useId();
  const idAyuda = useId();
  const g = useGuardado();
  const real = bd.configuracion?.sistema.asistente.activo ?? datos.activa.sistema.asistente.activo;
  const [activo, setActivo] = useState(real);
  const enCurso = useRef(false);
  useEffect(() => {
    if (!enCurso.current) setActivo(real);
  }, [real]);

  return (
    <Fila etiqueta="Contesta a los clientes" idEtiqueta={idEtiqueta} ayuda="Si lo apagas, los mensajes se guardan y les contestas tú" idAyuda={idAyuda} g={g} en="linea">
      <Interruptor
        marcado={activo}
        idEtiqueta={idEtiqueta}
        describe={[idAyuda, g.error ? g.idError : ""].filter(Boolean).join(" ")}
        desactivado={g.estado === "guardando"}
        cambiar={async (v) => {
          const antes = activo;
          setActivo(v);
          enCurso.current = true;
          const bien = await g.ejecutar(async () => {
            const r = await cambiarAsistente(v);
            return r.ok ? { ok: true } : { ok: false, error: r.error };
          });
          enCurso.current = false;
          if (!bien) setActivo(antes);
          else void refrescar();
        }}
      />
    </Fila>
  );
}

// ─── Lo que tiene que saber de tu negocio ─────────────────────────────────────────────────────────

function Informacion({ datos, recargar, informacionNueva }: PropsBloque & { informacionNueva: { texto: string; vez: number } | null }): JSX.Element {
  const id = useId();
  const idContador = useId();
  const g = useGuardado();
  const [texto, setTexto] = useState(datos.prompt.informacion);
  const base = useRef(datos.prompt.informacion);
  const [conflicto, setConflicto] = useState(false);

  // Una recarga trae otro texto: se pinta si no hay nada sin guardar.
  useEffect(() => {
    const nuevo = datos.prompt.informacion;
    if (nuevo === base.current) return;
    const sinGuardar = texto !== base.current;
    base.current = nuevo;
    if (!sinGuardar) setTexto(nuevo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos.prompt.informacion]);

  // Se acaban de guardar las instrucciones completas: su sección manda.
  useEffect(() => {
    if (!informacionNueva) return;
    base.current = informacionNueva.texto;
    setTexto(informacionNueva.texto);
    setConflicto(false);
    g.limpiar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [informacionNueva?.vez]);

  const cambiado = texto !== base.current;
  const largo = texto.length;

  const guardar = async () => {
    setConflicto(false);
    const enviado = texto;
    const bien = await g.ejecutar(async () => {
      const r = await guardarInformacion(enviado, datos.prompt.hash);
      if (!r.ok && r.conflicto) setConflicto(true);
      return r.ok ? { ok: true } : { ok: false, error: r.error };
    });
    if (bien) {
      base.current = enviado;
      void recargar();
    }
  };

  // «Recargar» tras un conflicto: se deja lo escrito y se pinta lo que hay ahora en el servidor.
  const soltar = useRef(false);
  useEffect(() => {
    if (!soltar.current) return;
    soltar.current = false;
    base.current = datos.prompt.informacion;
    setTexto(datos.prompt.informacion);
  }, [datos]);
  const recargarYSoltar = async () => {
    setConflicto(false);
    g.limpiar();
    soltar.current = true;
    await recargar();
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-[14px] leading-5 font-medium">
          Lo que tiene que saber de tu negocio
        </label>
        <EstadoGuardado g={g} />
      </div>
      <textarea
        id={id}
        value={texto}
        rows={5}
        maxLength={LIMITES.informacion}
        placeholder="Precios orientativos, horario, dirección, qué haces y qué no…"
        aria-describedby={[idContador, g.error ? g.idError : ""].filter(Boolean).join(" ")}
        aria-invalid={g.error ? true : undefined}
        onChange={(e) => setTexto(e.target.value)}
        className={`${AREA} mt-2 min-h-[132px] resize-y`}
      />
      <div className="mt-2 flex items-center justify-between gap-4 max-lg:flex-wrap max-lg:gap-y-2">
        <span id={idContador} className={`text-[12px] leading-4 tabular-nums ${largo > LIMITES.informacion * 0.9 ? "text-atencion-texto" : "text-secundario"}`}>
          {cifra(largo)} / {cifra(LIMITES.informacion)}
        </span>
        <div className="flex items-center gap-2 max-lg:flex-wrap">
          {conflicto && (
            <button type="button" onClick={() => void recargarYSoltar()} className={BOTON}>
              Recargar
            </button>
          )}
          <button type="button" onClick={() => void guardar()} disabled={!cambiado || g.estado === "guardando"} className={BOTON_PRINCIPAL}>
            Guardar
          </button>
        </div>
      </div>
      <ErrorCampo id={g.idError} error={g.error} />
    </div>
  );
}

// ─── Trato ────────────────────────────────────────────────────────────────────────────────────────

function Trato({ datos, recargar }: PropsBloque): JSX.Element {
  const idEtiqueta = useId();
  const g = useGuardado();
  const guardado = datos.activa.agente.trato;
  const [trato, setTrato] = useState<"tu" | "usted">(guardado);
  const enCurso = useRef(false);
  useEffect(() => {
    if (!enCurso.current) setTrato(guardado);
  }, [guardado]);

  return (
    <Fila etiqueta="Trata a los clientes de:" idEtiqueta={idEtiqueta} g={g} en="linea">
      <Segmentado
        opciones={[
          { valor: "tu", texto: "tú" },
          { valor: "usted", texto: "usted" },
        ]}
        valor={trato}
        idEtiqueta={idEtiqueta}
        describe={g.error ? g.idError : undefined}
        cambiar={async (v) => {
          const antes = trato;
          setTrato(v);
          enCurso.current = true;
          const bien = await g.ejecutar(() => guardarCampo("agente.trato", v));
          enCurso.current = false;
          if (!bien) setTrato(antes);
          else void recargar();
        }}
      />
    </Fila>
  );
}

// ─── El móvil de los avisos ───────────────────────────────────────────────────────────────────────

/** En el modo prueba el aviso es un mensaje normal desde el móvil vinculado, y solo a un número de la lista. */
function AvisoEnModoPrueba(p: { guardado: string | null }): JSX.Element | null {
  const { estado, releer } = useModoPrueba(false);
  useEffect(() => {
    void releer();
  }, [p.guardado, releer]);
  if (!estado) return null;
  if (estado.avisoPermitido === false) {
    return <LineaAtencion className="mt-3">Modo prueba: este móvil no está en la lista de números permitidos, así que no le llegan los avisos. Añádelo en Ajustes → Conexiones.</LineaAtencion>;
  }
  if (estado.avisoPermitido === true) {
    return <LineaAtencion className="mt-3">Modo prueba: el aviso te llega como un mensaje normal desde el móvil de pruebas</LineaAtencion>;
  }
  return null;
}

function Avisos({ datos, recargar, plantillas, releerPlantillas }: PropsBloque & { plantillas: EstadoPlantilla[] | null; releerPlantillas: () => Promise<void> }): JSX.Element {
  const id = useId();
  const idAyuda = useId();
  const g = useGuardado();
  const gPrueba = useGuardado();
  const [probando, setProbando] = useState(false);
  const guardado = datos.guardada.sistema.avisos?.comercial?.telefono;
  const prefijo = datos.activa.regional.prefijo;
  // Se enseña como lo lee una persona («+34 612 345 678»); el servidor lo guarda normalizado.
  const valor = typeof guardado === "string" && guardado !== "" ? formatoTelefono(guardado, prefijo) : "";
  const sinGuardar = guardado === null || guardado === undefined;
  const aviso = plantillas?.find((e) => e.id === "aviso");
  const prueba = useEstado()?.modoWhatsApp === "prueba";
  const sinAprobar = !prueba && !!aviso && aviso.estado !== "APROBADA" && aviso.estado !== "SIN_CLAVES";

  const probar = async () => {
    setProbando(true);
    gPrueba.limpiar();
    const error = await enviarAvisoPrueba();
    setProbando(false);
    if (error === null) confirmar("Aviso enviado: míralo en tu móvil");
    else gPrueba.fallar(error);
    void releerPlantillas();
  };

  return (
    <Fila
      etiqueta="Cuando te toque, avísame por WhatsApp a:"
      para={id}
      g={g}
      extra={
        <>
          <div className="mt-3 flex items-center gap-3 max-lg:flex-wrap">
            <button type="button" onClick={() => void probar()} disabled={probando} aria-describedby={gPrueba.error ? gPrueba.idError : undefined} className={BOTON}>
              {probando ? "Enviando…" : "Enviarme un aviso de prueba"}
            </button>
          </div>
          <ErrorCampo id={gPrueba.idError} error={gPrueba.error} />
          {sinAprobar && <LineaAtencion className="mt-3">Para que te lleguen los avisos, escribe «hola» al número del negocio una vez al día</LineaAtencion>}
          {prueba && <AvisoEnModoPrueba guardado={guardado ?? null} />}
        </>
      }
    >
      <CampoTexto
        id={id}
        idAyuda={sinGuardar ? idAyuda : undefined}
        valor={valor}
        g={g}
        tipo="tel"
        inputMode="tel"
        placeholder={prefijo === "34" ? "+34 612 345 678" : `+${prefijo} …`}
        className="max-w-[260px] tabular-nums max-lg:max-w-none"
        // Vacío sin nada guardado: se sigue usando el móvil de la instalación, si lo hay.
        ignorar={(t) => t.trim() === "" && sinGuardar}
        guardar={async (t) => {
          const limpio = t.trim();
          const bien = await g.ejecutar(() => guardarCampo("sistema.avisos.comercial.telefono", limpio));
          if (bien) {
            // El error de la prueba anterior («Pon antes tu móvil») ya no vale con el móvil nuevo.
            gPrueba.limpiar();
            void recargar();
          }
          return bien;
        }}
      />
      {sinGuardar && (
        <Ayuda id={idAyuda} className="mt-2">
          Si lo dejas vacío, se usa el móvil que se puso al instalar, si hay uno.
        </Ayuda>
      )}
    </Fila>
  );
}
