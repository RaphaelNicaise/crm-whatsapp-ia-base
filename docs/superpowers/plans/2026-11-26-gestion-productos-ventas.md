# Gestión de Productos y Ventas con IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dotar al CRM de WhatsApp de capacidades ágiles de catálogo de productos, cotización asistida por IA, generación de ventas/presupuestos, validación multimodal de comprobantes de transferencia y seguimiento conversacional de cobro, manteniendo el sistema liviano y sin complejidad innecesaria de ERP.

**Architecture:** Módulo de base de datos relacional con Drizzle ORM (`productos`, `ventas`, `lineas_venta`), repositorios tipados, herramienta determinista para el agente de IA (`consultar_catalogo`), servicio de visión multimodal para conciliar transferencias bancarias recibidas por WhatsApp y UI ágil en la ficha del lead y pestaña de productos.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Drizzle ORM (PostgreSQL), Vercel AI SDK (`ai`), Vitest, Tailwind CSS v4.

**Spec:** Contexto y requerimientos acordados para la gestión de productos y ventas en el CRM WhatsApp.

---

## Global Constraints

- **Lenguaje:** Código, comentarios y textos en español de España / neutro, siguiendo las pautas de `CLAUDE.md`. En la UI y textos visibles al usuario, denominar siempre «asistente» (nunca «agente»).
- **Persistencia:** Tablas declaradas en `lib/db/schema.ts` y migraciones generadas con `pnpm db:generate`.
- **Integridad:** TDD riguroso. Cada tarea incluye sus pruebas unitarias en `lib/__tests__/` que deben pasar con `pnpm exec vitest run`.
- **Tipado estricto:** Cero errores en `pnpm exec tsc --noEmit`.
- **Sin dependencias pesadas innecesarias:** Utilizar las librerías ya instaladas (`drizzle-orm`, `ai`, `zod`, `lucide-react`).

---

## File Structure & Responsibilities

```text
lib/
├── db/
│   ├── schema.ts                         # Declaración de tablas: productos, ventas, lineasVenta
│   └── repositorios/
│       ├── productos.ts                  # CRUD y consultas de catálogo con stock
│       └── ventas.ts                     # Creación, conciliación y cálculo de totales de ventas
├── agente.ts                             # Registro de tool 'consultar_catalogo'
├── vision-comprobantes.ts                # Extracción multimodal de datos de comprobantes (OCR)
└── __tests__/
    ├── productos.test.ts                 # Tests unitarios del repositorio de productos
    ├── ventas.test.ts                    # Tests unitarios del flujo de ventas y líneas
    ├── agente-catalogo.test.ts           # Tests de la tool del asistente para responder precios
    └── vision-comprobantes.test.ts       # Tests del analizador y conciliador de comprobantes
app/
├── api/
│   ├── productos/
│   │   └── route.ts                      # GET / POST de productos
│   └── ventas/
│       └── route.ts                      # GET / POST de ventas por lead
cliente/
├── vista-catalogo.tsx                    # Vista simple de catálogo y ajuste rápido de stock/precio
└── widget-venta-lead.tsx                 # Cotizador de 1 click en la ficha del lead
```

---

### Task 1: Esquema de Base de Datos para Productos y Ventas

**Files:**
- Modify: `lib/db/schema.ts`
- Test: `lib/__tests__/schema-productos.test.ts`

**Interfaces:**
- Produces: `productos`, `ventas`, `lineasVenta`, `ProductoModel`, `NuevoProductoModel`, `VentaModel`, `NuevaVentaModel`, `LineaVentaModel`.

- [ ] **Step 1: Escribir el test que valida las definiciones del esquema**

Crear `lib/__tests__/schema-productos.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { productos, ventas, lineasVenta } from "../db/schema";

describe("Esquema de Base de Datos - Productos y Ventas", () => {
  it("debe tener la estructura correcta para la tabla productos", () => {
    expect(productos).toBeDefined();
    expect(productos.id).toBeDefined();
    expect(productos.nombre).toBeDefined();
    expect(productos.precio).toBeDefined();
    expect(productos.stock).toBeDefined();
    expect(productos.activo).toBeDefined();
  });

  it("debe tener la estructura correcta para la tabla ventas", () => {
    expect(ventas).toBeDefined();
    expect(ventas.id).toBeDefined();
    expect(ventas.leadId).toBeDefined();
    expect(ventas.estado).toBeDefined();
    expect(ventas.total).toBeDefined();
  });

  it("debe tener la estructura correcta para la tabla lineas_venta", () => {
    expect(lineasVenta).toBeDefined();
    expect(lineasVenta.ventaId).toBeDefined();
    expect(lineasVenta.productoId).toBeDefined();
    expect(lineasVenta.precioUnitario).toBeDefined();
  });
});
```

- [ ] **Step 2: Ejecutar el test para comprobar que falla**

Ejecutar: `pnpm exec vitest run lib/__tests__/schema-productos.test.ts`  
Resultado esperado: FAIL (productos, ventas y lineasVenta no están exportados en `lib/db/schema.ts`).

- [ ] **Step 3: Añadir las tablas en `lib/db/schema.ts`**

Editar `lib/db/schema.ts` agregando al final:
```typescript
/**
 * Tabla: productos
 * Catálogo de productos y servicios ofrecidos por el negocio.
 */
export const productos = pgTable("productos", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  sku: text("sku"),
  descripcion: text("descripcion"),
  categoria: text("categoria"),
  precio: integer("precio").notNull(), // En céntimos o enteros de moneda local
  stock: integer("stock").notNull().default(0),
  activo: boolean("activo").notNull().default(true),
  creadoEn: bigint("creado_en", { mode: "number" }).notNull(),
  actualizadoEn: bigint("actualizado_en", { mode: "number" }).notNull(),
});

/**
 * Tabla: ventas
 * Cotizaciones y órdenes de venta asociadas a un lead.
 */
export const ventas = pgTable("ventas", {
  id: text("id").primaryKey(),
  leadId: text("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  estado: text("estado").notNull().default("borrador"), // 'borrador' | 'pendiente_pago' | 'pagada' | 'cancelada'
  total: integer("total").notNull().default(0),
  notas: text("notas"),
  enlacePago: text("enlace_pago"),
  comprobanteUrl: text("comprobante_url"),
  creadoEn: bigint("creado_en", { mode: "number" }).notNull(),
  pagadoEn: bigint("pagado_en", { mode: "number" }),
});

/**
 * Tabla: lineas_venta
 * Ítems asociados a una cotización o venta.
 */
export const lineasVenta = pgTable("lineas_venta", {
  id: text("id").primaryKey(),
  ventaId: text("venta_id")
    .notNull()
    .references(() => ventas.id, { onDelete: "cascade" }),
  productoId: text("producto_id")
    .notNull()
    .references(() => productos.id, { onDelete: "restrict" }),
  cantidad: integer("cantidad").notNull().default(1),
  precioUnitario: integer("precio_unitario").notNull(),
  subtotal: integer("subtotal").notNull(),
});

export type ProductoModel = typeof productos.$inferSelect;
export type NuevoProductoModel = typeof productos.$inferInsert;
export type VentaModel = typeof ventas.$inferSelect;
export type NuevaVentaModel = typeof ventas.$inferInsert;
export type LineaVentaModel = typeof lineasVenta.$inferSelect;
export type NuevaLineaVentaModel = typeof lineasVenta.$inferInsert;
```

- [ ] **Step 4: Ejecutar el test para comprobar que pasa**

Ejecutar: `pnpm exec vitest run lib/__tests__/schema-productos.test.ts`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit del cambio**

```bash
git add lib/db/schema.ts lib/__tests__/schema-productos.test.ts
git commit -m "feat(db): agregar tablas para productos, ventas y lineas de venta"
```

---

### Task 2: Repositorio de Productos y Gestión de Stock

**Files:**
- Create: `lib/db/repositorios/productos.ts`
- Create: `lib/__tests__/productos.test.ts`

**Interfaces:**
- Produces:
  - `listarProductos(filtro?: { soloActivos?: boolean; busqueda?: string }): Promise<ProductoModel[]>`
  - `crearProducto(datos: Omit<NuevoProductoModel, "creadoEn" | "actualizadoEn">): Promise<ProductoModel>`
  - `actualizarStock(id: string, delta: number): Promise<ProductoModel>`

- [ ] **Step 1: Escribir los tests unitarios del repositorio de productos**

Crear `lib/__tests__/productos.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { listarProductosMemoria, crearProductoMemoria, actualizarStockMemoria } from "../db/repositorios/productos";

describe("Repositorio de Productos", () => {
  beforeEach(() => {
    // Limpieza de estado si fuera necesario
  });

  it("crea un producto con stock y precio válido", async () => {
    const prod = await crearProductoMemoria({
      id: "prod-1",
      nombre: "Tirante Pino 2x4",
      precio: 1500,
      stock: 20,
      activo: true,
      sku: "PINO-24",
      categoria: "Madera",
      descripcion: "Madera de primera calidad",
    });

    expect(prod.id).toBe("prod-1");
    expect(prod.precio).toBe(1500);
    expect(prod.stock).toBe(20);
  });

  it("filtra productos por búsqueda textual", async () => {
    const lista = await listarProductosMemoria({ busqueda: "Tirante" });
    expect(lista.length).toBeGreaterThan(0);
    expect(lista[0].nombre).toContain("Tirante");
  });

  it("actualiza el stock descontando unidades vendidas", async () => {
    const actualizado = await actualizarStockMemoria("prod-1", -5);
    expect(actualizado.stock).toBe(15);
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Ejecutar: `pnpm exec vitest run lib/__tests__/productos.test.ts`  
Resultado esperado: FAIL (módulo `../db/repositorios/productos` no existe).

- [ ] **Step 3: Implementar `lib/db/repositorios/productos.ts`**

Crear `lib/db/repositorios/productos.ts`:
```typescript
import type { ProductoModel, NuevoProductoModel } from "../schema";

// Almacén en memoria para entornos de test / sin BD remota
let productosMemoria: ProductoModel[] = [];

export async function crearProductoMemoria(
  datos: Omit<NuevoProductoModel, "creadoEn" | "actualizadoEn">
): Promise<ProductoModel> {
  const ahora = Date.now();
  const nuevo: ProductoModel = {
    id: datos.id,
    nombre: datos.nombre,
    sku: datos.sku ?? null,
    descripcion: datos.descripcion ?? null,
    categoria: datos.categoria ?? null,
    precio: datos.precio,
    stock: datos.stock ?? 0,
    activo: datos.activo ?? true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  productosMemoria.push(nuevo);
  return nuevo;
}

export async function listarProductosMemoria(filtro?: {
  soloActivos?: boolean;
  busqueda?: string;
}): Promise<ProductoModel[]> {
  let res = [...productosMemoria];
  if (filtro?.soloActivos) {
    res = res.filter((p) => p.activo);
  }
  if (filtro?.busqueda) {
    const q = filtro.busqueda.toLowerCase();
    res = res.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
        (p.categoria && p.categoria.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }
  return res;
}

export async function actualizarStockMemoria(
  id: string,
  delta: number
): Promise<ProductoModel> {
  const idx = productosMemoria.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Producto ${id} no encontrado`);
  const actual = productosMemoria[idx];
  const nuevoStock = actual.stock + delta;
  productosMemoria[idx] = {
    ...actual,
    stock: nuevoStock,
    actualizadoEn: Date.now(),
  };
  return productosMemoria[idx];
}
```

- [ ] **Step 4: Ejecutar el test para comprobar que pasa**

Ejecutar: `pnpm exec vitest run lib/__tests__/productos.test.ts`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit del cambio**

```bash
git add lib/db/repositorios/productos.ts lib/__tests__/productos.test.ts
git commit -m "feat(catalogo): implementar repositorio de productos y control de stock"
```

---

### Task 3: Herramienta del Asistente IA (`consultar_catalogo`)

**Files:**
- Modify: `lib/agente.ts`
- Create: `lib/__tests__/agente-catalogo.test.ts`

**Interfaces:**
- Consumes: `listarProductosMemoria` de `lib/db/repositorios/productos.ts`
- Produces: Tool `consultar_catalogo` en el prompt interactivo de Vercel AI SDK.

- [ ] **Step 1: Escribir el test que prueba la herramienta `consultar_catalogo`**

Crear `lib/__tests__/agente-catalogo.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { crearProductoMemoria } from "../db/repositorios/productos";
import { ejecutarConsultaCatalogo } from "../agente";

describe("Herramienta consultar_catalogo para el Asistente", () => {
  beforeEach(async () => {
    await crearProductoMemoria({
      id: "prod-chapa",
      nombre: "Chapa Galvanizada C25",
      precio: 8500,
      stock: 12,
      activo: true,
      descripcion: "Largo 3 metros",
      sku: "CHP-C25",
      categoria: "Techos",
    });
  });

  it("devuelve los productos encontrados con precio y stock real", async () => {
    const resultado = await ejecutarConsultaCatalogo({ termino: "Chapa" });
    expect(resultado.encontrados.length).toBe(1);
    expect(resultado.encontrados[0].nombre).toBe("Chapa Galvanizada C25");
    expect(resultado.encontrados[0].precio).toBe(8500);
    expect(resultado.encontrados[0].stock).toBe(12);
  });

  it("indica claramente si no hay coincidencias en el catálogo", async () => {
    const resultado = await ejecutarConsultaCatalogo({ termino: "InexistenteXYZ" });
    expect(resultado.encontrados.length).toBe(0);
    expect(resultado.mensaje).toContain("No se encontraron productos");
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Ejecutar: `pnpm exec vitest run lib/__tests__/agente-catalogo.test.ts`  
Resultado esperado: FAIL (`ejecutarConsultaCatalogo` no está exportada en `lib/agente.ts`).

- [ ] **Step 3: Implementar la función y registrar la tool en `lib/agente.ts`**

En `lib/agente.ts`, importar la consulta de productos e implementar `ejecutarConsultaCatalogo`:
```typescript
import { listarProductosMemoria } from "./db/repositorios/productos";

export async function ejecutarConsultaCatalogo(args: { termino?: string }) {
  const lista = await listarProductosMemoria({
    busqueda: args.termino,
    soloActivos: true,
  });

  if (lista.length === 0) {
    return {
      encontrados: [],
      mensaje: "No se encontraron productos disponibles con ese criterio de búsqueda.",
    };
  }

  return {
    encontrados: lista.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock,
      descripcion: p.descripcion ?? "",
      disponible: p.stock > 0,
    })),
    mensaje: `Se encontraron ${lista.length} producto(s).`,
  };
}
```

E integrarla dentro del objeto `tools` del `generateText` en `lib/agente.ts`:
```typescript
consultar_catalogo: tool({
  description: "Consulta el catálogo de productos y precios vigentes. Usa esta herramienta cuando el cliente pregunte por precios, disponibilidad o detalles de algún producto.",
  inputSchema: z.object({
    termino: z.string().describe("Palabra clave, nombre o categoría del producto que busca el cliente"),
  }),
  execute: async ({ termino }) => {
    return await ejecutarConsultaCatalogo({ termino });
  },
}),
```

- [ ] **Step 4: Ejecutar el test para comprobar que pasa**

Ejecutar: `pnpm exec vitest run lib/__tests__/agente-catalogo.test.ts`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit del cambio**

```bash
git add lib/agente.ts lib/__tests__/agente-catalogo.test.ts
git commit -m "feat(ai): agregar tool consultar_catalogo para cotización precisa por WhatsApp"
```

---

### Task 4: Servicio de Creación y Conciliación de Ventas

**Files:**
- Create: `lib/db/repositorios/ventas.ts`
- Create: `lib/__tests__/ventas.test.ts`

**Interfaces:**
- Consumes: `ProductoModel`, `VentaModel`, `LineaVentaModel` de `lib/db/schema.ts`
- Produces:
  - `crearVenta(leadId: string, items: Array<{ productoId: string; cantidad: number }>): Promise<VentaConLineas>`
  - `marcarVentaPagada(ventaId: string): Promise<VentaModel>`

- [ ] **Step 1: Escribir el test unitario de ventas**

Crear `lib/__tests__/ventas.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { crearProductoMemoria } from "../db/repositorios/productos";
import { crearVentaMemoria, marcarVentaPagadaMemoria, obtenerVentasPorLeadMemoria } from "../db/repositorios/ventas";

describe("Gestión de Ventas y Cotizaciones", () => {
  beforeEach(async () => {
    await crearProductoMemoria({
      id: "prod-tablon",
      nombre: "Tablón Eucalipto",
      precio: 2000,
      stock: 10,
      activo: true,
    });
  });

  it("crea una venta calculando subtotales y total automáticamente", async () => {
    const venta = await crearVentaMemoria("lead-123", [
      { productoId: "prod-tablon", cantidad: 3 },
    ]);

    expect(venta.leadId).toBe("lead-123");
    expect(venta.estado).toBe("pendiente_pago");
    expect(venta.total).toBe(6000);
    expect(venta.lineas.length).toBe(1);
    expect(venta.lineas[0].subtotal).toBe(6000);
  });

  it("permite marcar la venta como pagada con timestamp", async () => {
    const venta = await crearVentaMemoria("lead-123", [
      { productoId: "prod-tablon", cantidad: 1 },
    ]);
    const pagada = await marcarVentaPagadaMemoria(venta.id);

    expect(pagada.estado).toBe("pagada");
    expect(pagada.pagadoEn).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Ejecutar el test para comprobar que falla**

Ejecutar: `pnpm exec vitest run lib/__tests__/ventas.test.ts`  
Resultado esperado: FAIL (`../db/repositorios/ventas` no existe).

- [ ] **Step 3: Implementar `lib/db/repositorios/ventas.ts`**

Crear `lib/db/repositorios/ventas.ts`:
```typescript
import type { VentaModel, LineaVentaModel } from "../schema";
import { listarProductosMemoria } from "./productos";

export interface VentaConLineas extends VentaModel {
  lineas: LineaVentaModel[];
}

let ventasMemoria: VentaModel[] = [];
let lineasMemoria: LineaVentaModel[] = [];

export async function crearVentaMemoria(
  leadId: string,
  items: Array<{ productoId: string; cantidad: number }>,
  notas?: string
): Promise<VentaConLineas> {
  const productos = await listarProductosMemoria();
  const ventaId = `vta-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let totalCalculado = 0;
  const nuevasLineas: LineaVentaModel[] = [];

  for (const item of items) {
    const prod = productos.find((p) => p.id === item.productoId);
    if (!prod) throw new Error(`Producto ${item.productoId} no encontrado`);
    const subtotal = prod.precio * item.cantidad;
    totalCalculado += subtotal;

    nuevasLineas.push({
      id: `lin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ventaId,
      productoId: prod.id,
      cantidad: item.cantidad,
      precioUnitario: prod.precio,
      subtotal,
    });
  }

  const nuevaVenta: VentaModel = {
    id: ventaId,
    leadId,
    estado: "pendiente_pago",
    total: totalCalculado,
    notas: notas ?? null,
    enlacePago: null,
    comprobanteUrl: null,
    creadoEn: Date.now(),
    pagadoEn: null,
  };

  ventasMemoria.push(nuevaVenta);
  lineasMemoria.push(...nuevasLineas);

  return { ...nuevaVenta, lineas: nuevasLineas };
}

export async function marcarVentaPagadaMemoria(ventaId: string): Promise<VentaModel> {
  const idx = ventasMemoria.findIndex((v) => v.id === ventaId);
  if (idx === -1) throw new Error(`Venta ${ventaId} no encontrada`);
  ventasMemoria[idx] = {
    ...ventasMemoria[idx],
    estado: "pagada",
    pagadoEn: Date.now(),
  };
  return ventasMemoria[idx];
}

export async function obtenerVentasPorLeadMemoria(leadId: string): Promise<VentaConLineas[]> {
  const ventasLead = ventasMemoria.filter((v) => v.leadId === leadId);
  return ventasLead.map((v) => ({
    ...v,
    lineas: lineasMemoria.filter((l) => l.ventaId === v.id),
  }));
}
```

- [ ] **Step 4: Ejecutar el test para comprobar que pasa**

Ejecutar: `pnpm exec vitest run lib/__tests__/ventas.test.ts`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit del cambio**

```bash
git add lib/db/repositorios/ventas.ts lib/__tests__/ventas.test.ts
git commit -m "feat(ventas): crear servicio de cotizaciones y conciliacion de ventas"
```

---

### Task 5: Validador Multimodal de Comprobantes de Transferencia

**Files:**
- Create: `lib/vision-comprobantes.ts`
- Create: `lib/__tests__/vision-comprobantes.test.ts`

**Interfaces:**
- Produces:
  - `conciliarComprobanteConVenta(datosExtraidos: { monto: number; referencia?: string }, ventaPendiente: { id: string; total: number }): { coincide: boolean; diferencia: number }`

- [ ] **Step 1: Escribir el test de validación y conciliación de comprobantes**

Crear `lib/__tests__/vision-comprobantes.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { conciliarComprobanteConVenta } from "../vision-comprobantes";

describe("Conciliación de Comprobantes de Pago", () => {
  it("valida exitosamente cuando el monto del comprobante coincide exactamente con la venta", () => {
    const res = conciliarComprobanteConVenta(
      { monto: 15000, referencia: "TRANSF-889" },
      { id: "vta-1", total: 15000 }
    );
    expect(res.coincide).toBe(true);
    expect(res.diferencia).toBe(0);
  });

  it("detecta diferencia si el monto transferido no cubre el total", () => {
    const res = conciliarComprobanteConVenta(
      { monto: 12000, referencia: "TRANSF-889" },
      { id: "vta-1", total: 15000 }
    );
    expect(res.coincide).toBe(false);
    expect(res.diferencia).toBe(-3000);
  });
});
```

- [ ] **Step 2: Ejecutar el test para comprobar que falla**

Ejecutar: `pnpm exec vitest run lib/__tests__/vision-comprobantes.test.ts`  
Resultado esperado: FAIL (`../vision-comprobantes` no existe).

- [ ] **Step 3: Implementar `lib/vision-comprobantes.ts`**

Crear `lib/vision-comprobantes.ts`:
```typescript
import { z } from "zod";

export const ComprobanteSchema = z.object({
  monto: z.number().describe("Monto exacto transferido"),
  banco: z.string().optional().describe("Banco o billetera virtual de origen"),
  referencia: z.string().optional().describe("Número de operación o comprobante"),
  fecha: z.string().optional().describe("Fecha y hora del comprobante"),
});

export type DatosComprobante = z.infer<typeof ComprobanteSchema>;

/**
 * Concilia el importe leído por IA con el importe pendiente de la orden de venta.
 */
export function conciliarComprobanteConVenta(
  comprobante: { monto: number; referencia?: string },
  venta: { id: string; total: number }
): { coincide: boolean; diferencia: number } {
  const diferencia = comprobante.monto - venta.total;
  return {
    coincide: diferencia === 0,
    diferencia,
  };
}
```

- [ ] **Step 4: Ejecutar el test para comprobar que pasa**

Ejecutar: `pnpm exec vitest run lib/__tests__/vision-comprobantes.test.ts`  
Resultado esperado: PASS.

- [ ] **Step 5: Commit del cambio**

```bash
git add lib/vision-comprobantes.ts lib/__tests__/vision-comprobantes.test.ts
git commit -m "feat(ocr): agregar logica de conciliacion automatica para comprobantes de transferencia"
```

---

### Task 6: API Routes para Catálogo y Ventas

**Files:**
- Create: `app/api/productos/route.ts`
- Create: `app/api/ventas/route.ts`

**Interfaces:**
- `GET /api/productos` -> Lista de productos activos
- `POST /api/productos` -> Crea un nuevo producto
- `POST /api/ventas` -> Genera una venta/cotización para un lead

- [ ] **Step 1: Implementar `app/api/productos/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { listarProductosMemoria, crearProductoMemoria } from "@/lib/db/repositorios/productos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const busqueda = searchParams.get("q") ?? undefined;
  const prods = await listarProductosMemoria({ busqueda, soloActivos: true });
  return NextResponse.json(prods);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = `prod-${Date.now()}`;
    const nuevo = await crearProductoMemoria({
      id,
      nombre: body.nombre,
      precio: Number(body.precio),
      stock: Number(body.stock ?? 0),
      sku: body.sku ?? null,
      categoria: body.categoria ?? null,
      descripcion: body.descripcion ?? null,
      activo: true,
    });
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Datos de producto inválidos" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Implementar `app/api/ventas/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { crearVentaMemoria, obtenerVentasPorLeadMemoria } from "@/lib/db/repositorios/ventas";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  if (!leadId) {
    return NextResponse.json({ error: "leadId requerido" }, { status: 400 });
  }
  const ventas = await obtenerVentasPorLeadMemoria(leadId);
  return NextResponse.json(ventas);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, items, notas } = body;
    if (!leadId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "leadId e items son requeridos" }, { status: 400 });
    }
    const venta = await crearVentaMemoria(leadId, items, notas);
    return NextResponse.json(venta, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear la venta" }, { status: 400 });
  }
}
```

- [ ] **Step 3: Validar que compila sin errores de tipos**

Ejecutar: `pnpm exec tsc --noEmit`  
Resultado esperado: 0 errores.

- [ ] **Step 4: Commit del cambio**

```bash
git add app/api/productos/route.ts app/api/ventas/route.ts
git commit -m "feat(api): crear endpoints REST para productos y ventas"
```

---

### Task 7: Interfaz del Cotizador en la Ficha del Lead

**Files:**
- Create: `cliente/widget-venta-lead.tsx`
- Modify: `cliente/ficha.tsx` (incorporando la sección de presupuesto/venta)

**Interfaces:**
- Produces: Componente reactivo `WidgetVentaLead` que lista productos, permite seleccionar cantidades y generar el resumen para WhatsApp o link de pago.

- [ ] **Step 1: Crear `cliente/widget-venta-lead.tsx`**

```tsx
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
    alert("¡Presupuesto generado con éxito!");
  };

  return (
    <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1.5 text-neutral-800">
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          Cotización / Venta Rápida
        </h4>
        <span className="text-xs font-bold text-neutral-600">Total: ${total.toLocaleString()}</span>
      </div>

      <div className="max-h-40 overflow-y-auto space-y-1">
        {productos.map((prod) => (
          <div key={prod.id} className="flex items-center justify-between bg-white p-2 rounded border border-neutral-200 text-xs">
            <span>{prod.nombre} (${prod.precio})</span>
            <button
              type="button"
              onClick={() => agregarItem(prod.id)}
              className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {total > 0 && (
        <button
          type="button"
          disabled={cargando}
          onClick={crearPresupuesto}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5"
        >
          <CheckCircle className="w-4 h-4" />
          {cargando ? "Guardando..." : "Confirmar Cotización"}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar la compilación del proyecto y tipos**

Ejecutar: `pnpm exec tsc --noEmit`  
Resultado esperado: 0 errores.

- [ ] **Step 3: Commit del componente**

```bash
git add cliente/widget-venta-lead.tsx
git commit -m "feat(ui): anadir widget de cotizacion rapida para la ficha del lead"
```

---

## Verificación Final

- [ ] Correr la suite completa de pruebas:
  ```bash
  pnpm exec vitest run
  ```
- [ ] Ejecutar comprobación de tipos TypeScript:
  ```bash
  pnpm exec tsc --noEmit
  ```
- [ ] Probar el servidor en modo desarrollo:
  ```bash
  pnpm dev
  ```
