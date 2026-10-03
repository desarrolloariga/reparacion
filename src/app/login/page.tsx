import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { Logotipo } from "@/components/marca/logotipo";
import { inicioDe, sesionOpcional } from "@/lib/auth/guardas";

import { FormularioAcceso } from "./formulario-acceso";

export const metadata: Metadata = { title: "Iniciar sesión" };

/** Solo se acepta una ruta interna: `//host` sería una redirección abierta. */
function destinoSeguro(valor: string | string[] | undefined) {
  if (typeof valor !== "string") return null;
  return valor.startsWith("/") && !valor.startsWith("//") ? valor : null;
}

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const redireccion = destinoSeguro(params.redirect);

  // Esta comprobación vive aquí y no en el proxy a propósito: el proxy solo
  // ve si hay cookie, no si vale. Cuando era él quien mandaba al panel, una
  // cookie caducada rebotaba sin fin entre ambos.
  const sesion = await sesionOpcional();
  if (sesion) redirect(redireccion ?? inicioDe(sesion));

  const expirada = params.expirada === "1";
  const sinJoyero = params.sin_joyero === "1";

  return (
    <div className="bg-ink text-bone grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <section className="ariga-glow relative hidden flex-col justify-between overflow-hidden px-[60px] py-14 lg:flex">
        <div className="ariga-hatch pointer-events-none absolute inset-0 opacity-12" />
        <div className="border-gold/25 absolute right-[-190px] bottom-[-160px] size-[520px] rotate-45 border" />
        <div className="border-gold/16 absolute right-[-90px] bottom-[-70px] size-[340px] rotate-45 border" />

        <div className="relative h-px" />

        <div className="relative mx-auto flex max-w-[520px] flex-col items-center gap-[30px] text-center">
          <Logotipo
            tamano={236}
            className="shadow-[0_0_0_1px_rgba(198,161,91,0.35),0_30px_90px_rgba(0,0,0,0.6)]"
          />
          <div className="bg-gold h-px w-[52px]" />
          <p className="font-display text-bone m-0 text-[26px] leading-[1.45]">
            Reparaciones y control de joyeros
          </p>
          <span className="text-gold-light/75 tracking-brand text-[10px] leading-none font-medium">
            ARIGA JOYERÍA
          </span>
        </div>

        <div className="relative flex gap-10">
          {["TRAZABILIDAD", "CONTROL DE TIEMPOS", "RENTABILIDAD"].map((c) => (
            <span
              key={c}
              className="text-bone/35 text-[10px] leading-none tracking-[0.18em]"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Formulario */}
      <section className="bg-bone text-ink flex items-center justify-center p-8 sm:p-14">
        <FormularioAcceso
          redireccion={redireccion ?? ""}
          expirada={expirada}
          sinJoyero={sinJoyero}
        />
      </section>
    </div>
  );
}
