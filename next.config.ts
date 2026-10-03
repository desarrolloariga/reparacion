import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * La raíz del proyecto es esta carpeta. Sin esto Turbopack sube por el
   * árbol buscando lockfiles y encuentra los del directorio del usuario.
   */
  turbopack: {
    root: path.join(__dirname),
  },

  images: {
    // Dominios permitidos para <Image>. Al usar Supabase Storage, agregar aquí
    // el host del proyecto: <ref>.supabase.co
    remotePatterns: [],
  },
};

export default nextConfig;
