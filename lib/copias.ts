// Copias de seguridad en modo PostgreSQL (se gestionan a nivel de Postgres/pg_dump o proveedor cloud).

export async function hacerCopia(): Promise<string | null> {
  return null;
}

export function programarCopias(): void {
  // En PostgreSQL + Docker las copias se realizan mediante pg_dump sobre el volumen postgres_data.
}
