import { describe, expect, it } from "vitest";
import { hrefDe, leerUbicacion } from "../../cliente/navegacion";

describe("navegacion", () => {
  it("lee correctamente la vista hoy por defecto", () => {
    const u = leerUbicacion("http://localhost:8000/panel");
    expect(u.vista).toBe("hoy");
    expect(u.cliente).toBeNull();
    expect(u.bloque).toBeNull();
  });

  it("lee correctamente clientes, productos, ventas y agenda", () => {
    expect(leerUbicacion("http://localhost:8000/panel#clientes").vista).toBe("clientes");
    expect(leerUbicacion("http://localhost:8000/panel#productos").vista).toBe("productos");
    expect(leerUbicacion("http://localhost:8000/panel#ventas").vista).toBe("ventas");
    expect(leerUbicacion("http://localhost:8000/panel#agenda").vista).toBe("agenda");
  });

  it("lee ajustes y sub-bloques correctamente", () => {
    const u1 = leerUbicacion("http://localhost:8000/panel#ajustes");
    expect(u1.vista).toBe("configuracion");
    expect(u1.bloque).toBeNull();

    const u2 = leerUbicacion("http://localhost:8000/panel#ajustes-asistente");
    expect(u2.vista).toBe("configuracion");
    expect(u2.bloque).toBe("asistente");

    const u3 = leerUbicacion("http://localhost:8000/panel#ajustes-conexiones");
    expect(u3.vista).toBe("configuracion");
    expect(u3.bloque).toBe("whatsapp");

    const u4 = leerUbicacion("http://localhost:8000/panel#ajustes-horario");
    expect(u4.vista).toBe("configuracion");
    expect(u4.bloque).toBe("agenda");

    const u5 = leerUbicacion("http://localhost:8000/panel#ajustes-equipo");
    expect(u5.vista).toBe("configuracion");
    expect(u5.bloque).toBe("equipo");

    const u6 = leerUbicacion("http://localhost:8000/panel#ajustes-mcp");
    expect(u6.vista).toBe("configuracion");
    expect(u6.bloque).toBe("mcp");

    const u7 = leerUbicacion("http://localhost:8000/panel#ajustes-avanzado");
    expect(u7.vista).toBe("configuracion");
    expect(u7.bloque).toBe("avanzado");
  });

  it("genera hrefDe correctamente", () => {
    expect(hrefDe({ vista: "hoy" })).toBe("/panel");
    expect(hrefDe({ vista: "clientes" })).toBe("/panel#clientes");
    expect(hrefDe({ vista: "productos" })).toBe("/panel#productos");
    expect(hrefDe({ vista: "ventas" })).toBe("/panel#ventas");
    expect(hrefDe({ vista: "agenda" })).toBe("/panel#agenda");
    expect(hrefDe({ vista: "configuracion" })).toBe("/panel#ajustes");
    expect(hrefDe({ vista: "configuracion", bloque: "asistente" })).toBe("/panel#ajustes-asistente");
    expect(hrefDe({ vista: "configuracion", bloque: "equipo" })).toBe("/panel#ajustes-equipo");
    expect(hrefDe({ vista: "configuracion", bloque: "mcp" })).toBe("/panel#ajustes-mcp");
    expect(hrefDe({ vista: "configuracion", bloque: "avanzado" })).toBe("/panel#ajustes-avanzado");
  });
});
