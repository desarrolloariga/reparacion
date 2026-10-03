import Link from "next/link";

import { Logotipo } from "@/components/marca/logotipo";

/** Único 404 de la aplicación, con la estética de la marca. */
export default function NoEncontrado() {
  return (
    <main className="bg-ink text-bone flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Logotipo tamano={88} />

      <div className="flex flex-col items-center gap-3">
        <span className="bg-gold h-px w-10" />
        <h1 className="font-display m-0 text-[28px] leading-tight font-normal">
          No encontramos esta página
        </h1>
        <p className="text-bone/50 m-0 max-w-sm text-[13px] leading-relaxed">
          Revisa que la dirección esté completa o vuelve al inicio.
        </p>
      </div>

      <Link
        href="/panel"
        className="border-gold/45 text-gold-light hover:bg-gold/12 rounded-field tracking-action border px-5 py-3 text-[11px] font-semibold transition-colors"
      >
        CONTINUAR
      </Link>
    </main>
  );
}
