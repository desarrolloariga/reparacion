import "server-only";

/**
 * ¿Tiene este joyero alguna asignación sobre la orden? Decide qué archivos
 * y qué órdenes puede ver desde su portal. Hasta la Fase 3 no existen
 * asignaciones, así que la respuesta es siempre no.
 */
export async function joyeroTieneOrden(_joyeroId: number, _ordenId: number): Promise<boolean> {
  void _joyeroId;
  void _ordenId;
  return false;
}
