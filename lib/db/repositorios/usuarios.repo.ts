import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, usuarios, type UsuarioModel } from "../index";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(":");
  if (!salt || !keyHex) return false;
  const key = Buffer.from(keyHex, "hex");
  const derived = scryptSync(password, salt, 64);
  return key.length === derived.length && timingSafeEqual(key, derived);
}

export async function contarUsuarios(): Promise<number> {
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(usuarios);
  return row?.total ?? 0;
}

export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioModel | undefined> {
  const [user] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email.trim().toLowerCase()))
    .limit(1);
  return user;
}

export async function buscarUsuarioPorId(id: string): Promise<UsuarioModel | undefined> {
  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  return user;
}

export async function listarUsuarios(): Promise<Omit<UsuarioModel, "passwordHash">[]> {
  return db
    .select({
      id: usuarios.id,
      email: usuarios.email,
      nombre: usuarios.nombre,
      rol: usuarios.rol,
      activo: usuarios.activo,
      creadoEn: usuarios.creadoEn,
    })
    .from(usuarios);
}

export async function crearUsuario(datos: {
  email: string;
  nombre: string;
  password: string;
  rol?: "admin" | "operador";
}): Promise<Omit<UsuarioModel, "passwordHash">> {
  const id = randomUUID();
  const nuevo = {
    id,
    email: datos.email.trim().toLowerCase(),
    nombre: datos.nombre.trim(),
    passwordHash: hashPassword(datos.password),
    rol: datos.rol ?? "operador",
    activo: true,
    creadoEn: Date.now(),
  };
  await db.insert(usuarios).values(nuevo);
  const { passwordHash: _, ...sinClave } = nuevo;
  return sinClave;
}
