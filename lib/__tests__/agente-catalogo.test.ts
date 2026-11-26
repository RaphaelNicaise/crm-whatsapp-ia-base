import { describe, it, expect, beforeEach } from "vitest";
import { crearProductoMemoria, reiniciarProductosMemoria } from "../db/repositorios/productos";
import { ejecutarConsultaCatalogo } from "../agente";

describe("Herramienta consultar_catalogo para el Asistente", () => {
  beforeEach(async () => {
    reiniciarProductosMemoria();
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
