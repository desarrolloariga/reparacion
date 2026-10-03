import type { Database } from "./types";

/**
 * Alias sobre los tipos generados (`types.ts`, que `npm run db:types`
 * sobrescribe por completo). Lo que el código importa a diario vive aquí.
 */

type Esquema = Database["joyeria"];

export type Tabla<T extends keyof Esquema["Tables"]> = Esquema["Tables"][T]["Row"];
export type Insertar<T extends keyof Esquema["Tables"]> = Esquema["Tables"][T]["Insert"];
export type Actualizar<T extends keyof Esquema["Tables"]> = Esquema["Tables"][T]["Update"];
export type Vista<T extends keyof Esquema["Views"]> = Esquema["Views"][T]["Row"];
export type Enumerado<T extends keyof Esquema["Enums"]> = Esquema["Enums"][T];

// ── Roles ────────────────────────────────────────────────────────────────
export type RolUsuario = Enumerado<"rol_usuario">;

export const ROLES = ["admin", "taller", "joyero", "gerencia"] as const satisfies readonly RolUsuario[];

export const ETIQUETA_ROL: Record<RolUsuario, string> = {
  admin: "Administración",
  taller: "Taller",
  joyero: "Joyero",
  gerencia: "Gerencia",
};

export const DESCRIPCION_ROL: Record<RolUsuario, string> = {
  admin: "Todo, incluidos catálogos, parámetros y cuentas.",
  taller: "Recibe, cotiza, asigna, revisa, entrega y cobra.",
  joyero: "Solo ve sus trabajos asignados; nunca precios al cliente.",
  gerencia: "Solo lectura sobre tableros e indicadores.",
};

// ── Catálogos ────────────────────────────────────────────────────────────
export type CategoriaTrabajo = Enumerado<"categoria_trabajo">;

export const CATEGORIAS = ["reparacion", "creacion"] as const satisfies readonly CategoriaTrabajo[];

export const ETIQUETA_CATEGORIA: Record<CategoriaTrabajo, string> = {
  reparacion: "Reparación",
  creacion: "Creación",
};

// ── Filas ────────────────────────────────────────────────────────────────
export type Usuario = Tabla<"usuarios">;
export type Especialidad = Tabla<"especialidades">;
export type TipoTrabajo = Tabla<"tipos_trabajo">;
export type Complejidad = Tabla<"complejidades">;
export type TiempoEstandar = Tabla<"tiempos_estandar">;
export type Parametro = Tabla<"parametros">;
export type DiaCalendario = Tabla<"calendario_laboral">;
export type Joyero = Tabla<"joyeros">;
export type TarifaJoyero = Tabla<"tarifas_joyero">;
export type Cliente = Tabla<"clientes">;
