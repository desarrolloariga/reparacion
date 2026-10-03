/** Construcción de URLs con parámetros, para filtros y paginación por URL. */

export type Parametros = Record<string, string | string[] | undefined>;

export function leerTexto(params: Parametros, clave: string): string {
  const v = params[clave];
  return typeof v === "string" ? v : "";
}

export function leerEntero(params: Parametros, clave: string, porDefecto: number, min = 1, max = 100_000): number {
  const n = Number(leerTexto(params, clave));
  if (!Number.isInteger(n) || n < min || n > max) return porDefecto;
  return n;
}

/** Devuelve una función que arma la URL base + parámetros actuales + cambios. */
export function constructorDeEnlaces(base: string, actuales: Record<string, string | number | undefined>) {
  return (cambios: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...actuales, ...cambios })) {
      if (v === undefined || v === "" || v === null) continue;
      p.set(k, String(v));
    }
    const cadena = p.toString();
    return cadena ? `${base}?${cadena}` : base;
  };
}

/** Paginación: página actual, total de páginas y por-página saneados. */
export function paginar(params: Parametros, total: number, opciones: readonly number[]) {
  const porPagina = leerEntero(params, "porPagina", opciones[0], 1, 500);
  const porPaginaValido = opciones.includes(porPagina) ? porPagina : opciones[0];
  const paginas = Math.max(1, Math.ceil(total / porPaginaValido));
  const pagina = Math.min(leerEntero(params, "pagina", 1), paginas);
  return { pagina, paginas, porPagina: porPaginaValido };
}
