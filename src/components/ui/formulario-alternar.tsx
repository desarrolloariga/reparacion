import { cn } from "@/lib/utils";

/**
 * Botón Activar/Desactivar como formulario mínimo: manda `id` y `activo`
 * actual a una Server Action. Las entidades referenciables no se borran.
 */
export function FormularioAlternar({
  id,
  activo,
  accion,
  className,
  etiquetas = { activar: "Activar", desactivar: "Desactivar" },
}: {
  id: number;
  activo: boolean;
  accion: (formData: FormData) => void | Promise<void>;
  className?: string;
  etiquetas?: { activar: string; desactivar: string };
}) {
  return (
    <form action={accion} className={cn("inline", className)}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="activo" value={String(activo)} />
      <button
        type="submit"
        className="border-ink/14 text-ink/55 hover:border-gold hover:text-ink rounded-field cursor-pointer border px-3 py-[6px] text-[11px] whitespace-nowrap transition-colors"
      >
        {activo ? etiquetas.desactivar : etiquetas.activar}
      </button>
    </form>
  );
}

/** Enlace con el mismo aspecto que el botón de alternar. */
export const CLASE_BOTON_FILA =
  "border-ink/14 text-ink/55 hover:border-gold hover:text-ink rounded-field inline-flex cursor-pointer items-center gap-[6px] border px-3 py-[6px] text-[11px] whitespace-nowrap transition-colors";
