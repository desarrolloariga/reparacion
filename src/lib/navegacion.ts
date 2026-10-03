import type { RolUsuario } from "@/lib/supabase/modelo";

/**
 * Estructura del menú. Es la única fuente de verdad: el sidebar, la barra
 * inferior móvil, el título de la cabecera y el control de acceso por ruta
 * se derivan de aquí. Las fases siguientes añaden ítems en este archivo,
 * nunca en los componentes.
 */

export type IconoNav =
  | "inicio"
  | "ordenes"
  | "recepcion"
  | "clientes"
  | "joyeros"
  | "catalogos"
  | "usuarios"
  | "trabajos"
  | "alertas"
  | "tablero"
  | "liquidaciones"
  | "gerencia";

export type ItemNav = {
  nombre: string;
  href: string;
  /** Título de la cabecera si difiere del nombre del menú. */
  titulo?: string;
  icono?: IconoNav;
  /** Aparece en la barra inferior del móvil. */
  destacado?: boolean;
  /** Restringe el ítem más que su grupo. */
  soloRoles?: readonly RolUsuario[];
};

export type GrupoNav = {
  etiqueta: string;
  soloRoles?: readonly RolUsuario[];
  items: ItemNav[];
};

const TODOS: readonly RolUsuario[] = ["admin", "taller", "joyero", "gerencia"];
const OPERACION: readonly RolUsuario[] = ["admin", "taller", "gerencia"];
const ADMIN: readonly RolUsuario[] = ["admin"];

export const NAVEGACION: GrupoNav[] = [
  {
    etiqueta: "OPERACIÓN",
    soloRoles: OPERACION,
    items: [
      { nombre: "Inicio", href: "/panel", titulo: "Resumen", icono: "inicio", destacado: true },
    ],
  },
  {
    etiqueta: "TALLER",
    soloRoles: OPERACION,
    items: [
      { nombre: "Joyeros", href: "/panel/joyeros", icono: "joyeros", destacado: true },
    ],
  },
  {
    etiqueta: "CATÁLOGOS",
    soloRoles: ADMIN,
    items: [
      { nombre: "Especialidades", href: "/panel/catalogos/especialidades" },
      { nombre: "Tipos de trabajo", href: "/panel/catalogos/tipos-trabajo" },
      { nombre: "Complejidades", href: "/panel/catalogos/complejidades" },
      { nombre: "Tiempos estándar", href: "/panel/catalogos/tiempos", titulo: "Matriz de tiempos estándar" },
      { nombre: "Parámetros", href: "/panel/catalogos/parametros" },
      { nombre: "Calendario laboral", href: "/panel/catalogos/calendario" },
    ],
  },
  {
    etiqueta: "ADMINISTRACIÓN",
    soloRoles: ADMIN,
    items: [
      { nombre: "Usuarios", href: "/panel/usuarios", titulo: "Cuentas de acceso", icono: "usuarios" },
    ],
  },
  {
    etiqueta: "MI CUENTA",
    soloRoles: TODOS,
    items: [
      { nombre: "Mi contraseña", href: "/panel/cuenta", titulo: "Cambiar contraseña" },
    ],
  },
];

function permitido(roles: readonly RolUsuario[] | undefined, rol: RolUsuario) {
  return !roles || roles.includes(rol);
}

/** El menú que corresponde a un rol. */
export function navegacionDe(rol: RolUsuario): GrupoNav[] {
  return NAVEGACION.filter((g) => permitido(g.soloRoles, rol))
    .map((g) => ({ ...g, items: g.items.filter((i) => permitido(i.soloRoles, rol)) }))
    .filter((g) => g.items.length > 0);
}

/** Accesos rápidos de la barra inferior en móvil. */
export function accesosMoviles(rol: RolUsuario): ItemNav[] {
  return navegacionDe(rol)
    .flatMap((g) => g.items)
    .filter((i) => i.destacado)
    .slice(0, 5);
}

function coincide(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Item activo para una ruta. Prefiere la coincidencia más específica. */
export function itemActivo(pathname: string): ItemNav | undefined {
  return NAVEGACION.flatMap((g) => g.items)
    .filter((i) => coincide(pathname, i.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

/** Migaja y título de la cabecera para una ruta. */
export function encabezadoDeRuta(pathname: string) {
  const grupo = NAVEGACION.find((g) => g.items.some((i) => coincide(pathname, i.href)));
  const item = itemActivo(pathname);
  return {
    migaja: `${grupo?.etiqueta ?? "JOYERÍA"} / ${(item?.nombre ?? "Panel").toUpperCase()}`,
    titulo: item?.titulo ?? item?.nombre ?? "Panel",
  };
}

/**
 * ¿Puede este rol abrir esta ruta según el menú? Las páginas aplican su
 * propia guarda; esto sirve para no mostrar enlaces a donde no se puede ir.
 */
export function rutaPermitida(pathname: string, rol: RolUsuario) {
  const item = itemActivo(pathname);
  if (!item) return true;
  const grupo = NAVEGACION.find((g) => g.items.includes(item));
  return permitido(grupo?.soloRoles, rol) && permitido(item.soloRoles, rol);
}
