import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";
import { supabaseEnv, type EsquemaApp } from "./env";

/**
 * Cliente único de Supabase, con la clave de servicio y apuntando a
 * `joyeria`.
 *
 * **Solo servidor.** `server-only` hace fallar el build si un componente
 * `"use client"` lo importa: eso filtraría la clave de servicio al bundle del
 * navegador. Toda lectura y escritura pasa por Server Components, Server
 * Actions o Route Handlers.
 */

type ClienteJoyeria = SupabaseClient<Database, EsquemaApp>;

let cliente: ClienteJoyeria | null = null;

export function db(): ClienteJoyeria {
  if (cliente) return cliente;

  const { url, claveServicio, esquema } = supabaseEnv();

  cliente = createClient<Database, EsquemaApp>(url, claveServicio, {
    db: { schema: esquema },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cliente;
}
