"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, Selector } from "@/components/ui/campo";
import { crearUsuario, type EstadoUsuario } from "@/lib/acciones/usuarios";
import { DESCRIPCION_ROL, ETIQUETA_ROL, ROLES, type RolUsuario } from "@/lib/supabase/modelo";

/**
 * Alta de cuentas.
 *
 * La contraseña se muestra una sola vez, aquí mismo: no hay correo de
 * recuperación y en la base solo queda su derivado scrypt, así que si no se
 * copia en este momento no hay forma de recuperarla —solo restablecerla.
 */
export function FormularioUsuario() {
  const formulario = useRef<HTMLFormElement>(null);
  const [estado, accion, enviando] = useActionState<EstadoUsuario, FormData>(
    crearUsuario,
    null,
  );
  const [rol, setRol] = useState<RolUsuario>("taller");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (estado?.credencial) formulario.current?.reset();
  }, [estado]);

  const campo = (n: string) => estado?.campos?.[n];

  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  if (estado?.credencial) {
    const { nombre, correo, clave } = estado.credencial;
    return (
      <div className="flex flex-col gap-4">
        <div className="border-gold/35 bg-gold/8 rounded-card flex flex-col gap-3 border p-5">
          <span className="text-gold-deep flex items-center gap-2 text-[13px] font-medium">
            <Check size={16} />
            Cuenta creada para {nombre}
          </span>

          <dl className="m-0 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <dt className="text-ink/40 text-[9px] font-medium tracking-[0.18em]">ACCESO</dt>
              <dd className="text-ink m-0 font-mono text-[14px]">{correo}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-ink/40 text-[9px] font-medium tracking-[0.18em]">CONTRASEÑA</dt>
              <dd className="m-0 flex items-center gap-2">
                <span className="text-ink font-mono text-[16px] tracking-[0.08em]">{clave}</span>
                <button
                  type="button"
                  onClick={() => copiar(`${correo} / ${clave}`)}
                  className="text-ink/45 hover:text-gold-dark cursor-pointer transition-colors"
                  aria-label="Copiar acceso y contraseña"
                >
                  {copiado ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </dd>
            </div>
          </dl>

          <p className="text-ink/55 m-0 text-[11.5px] leading-relaxed">
            Cópiala ahora: no se vuelve a mostrar. Si se pierde, hay que
            restablecerla desde la lista.
          </p>
        </div>

        <Aviso>{estado.error}</Aviso>

        <Boton variante="contorno" onClick={() => window.location.reload()} className="py-[14px]">
          CREAR OTRA CUENTA
        </Boton>
      </div>
    );
  }

  return (
    <form ref={formulario} action={accion} className="flex flex-col gap-4">
      <Campo
        etiqueta="NOMBRE COMPLETO"
        name="nombre"
        placeholder="Nombre y apellidos"
        error={campo("nombre")}
        required
      />

      <Campo
        etiqueta="ACCESO"
        name="correo"
        placeholder="mariana o mariana@ariga.com"
        autoCapitalize="none"
        spellCheck={false}
        error={campo("correo")}
        required
      />

      <Selector
        etiqueta="ROL"
        name="rol"
        value={rol}
        onChange={(e) => setRol(e.target.value as RolUsuario)}
        ayuda={DESCRIPCION_ROL[rol]}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ETIQUETA_ROL[r]}
          </option>
        ))}
      </Selector>

      <Campo etiqueta="TELÉFONO (OPCIONAL)" name="telefono" placeholder="5512 3456" />

      <Campo
        etiqueta="CONTRASEÑA (OPCIONAL)"
        name="clave"
        type="text"
        autoComplete="off"
        placeholder="Se genera una si lo dejas vacío"
        error={campo("clave")}
      />

      <Aviso>{estado?.error}</Aviso>

      <Boton type="submit" disabled={enviando} className="py-[14px]">
        {enviando ? "CREANDO…" : "CREAR CUENTA"}
      </Boton>
    </form>
  );
}
