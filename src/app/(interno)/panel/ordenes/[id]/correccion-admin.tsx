import { camposOrden } from "@/components/admin/campos";
import { BotonEliminar, EditorRegistro } from "@/components/admin/controles";
import { Tarjeta } from "@/components/ui/tarjeta";
import { editarOrden, eliminarOrden } from "@/lib/acciones/admin";
import type { Orden } from "@/lib/datos/ordenes";

/**
 * Solo administración: corregir cualquier dato de la orden (también si ya
 * está entregada) o eliminarla. El estado no se toca aquí: sigue la máquina
 * de estados. Todo queda en la auditoría.
 */
export function CorreccionAdmin({ orden }: { orden: Orden }) {
  return (
    <Tarjeta className="border-gold/40 flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <span className="text-gold-dark tracking-eyebrow text-[9px] font-medium">SOLO ADMINISTRACIÓN</span>
        <h3 className="font-display m-0 text-[20px] leading-tight font-normal">Corrección de la orden</h3>
        <p className="text-ink/55 m-0 text-[12px] leading-relaxed">
          Para errores de captura: precio, fechas o datos de la pieza, aunque la orden esté entregada. El estado no se cambia aquí. Cada corrección queda en el historial y en Auditoría con el antes y el después.
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <EditorRegistro accion={editarOrden} ocultos={{ id: orden.id }} campos={camposOrden(orden)} titulo={`Corregir ${orden.numero}`} etiqueta="Editar orden" motivoObligatorio />
        <BotonEliminar
          accion={eliminarOrden}
          ocultos={{ id: orden.id }}
          etiqueta="Eliminar orden"
          pregunta={`¿Eliminar ${orden.numero} por completo?`}
          detalle="Se borran sus trabajos, cotizaciones, asignaciones, pagos, fotos e historial. No se puede deshacer; queda una copia en Auditoría. Si tiene garantías o trabajos ya liquidados al joyero, primero hay que resolver eso."
          motivoObligatorio
        />
      </div>
    </Tarjeta>
  );
}
