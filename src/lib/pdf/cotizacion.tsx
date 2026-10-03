import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ETIQUETA_CATEGORIA, type CategoriaTrabajo } from "@/lib/supabase/modelo";

import { Cabecera, Dato, estilos, Pie, Seccion } from "./base";

/**
 * Cotización para el cliente. Lleva precio al cliente por línea y total.
 * NUNCA lleva el costo del joyero ni la utilidad: esos datos no salen de
 * la joyería.
 */
export type DatosCotizacion = {
  numero: string;
  version: number;
  tipo: CategoriaTrabajo;
  fechaEmision: string;
  validoHasta: string | null;
  cliente: { nombre: string; telefono: string | null };
  pieza: string;
  lineas: { nombre: string; complejidad: string; detalle: string | null; cantidad: number; precioUnitario: string; subtotal: string }[];
  total: string;
  diasEstimados: number;
  notas: string | null;
  estado: string;
};

export function DocumentoCotizacion(d: DatosCotizacion) {
  return (
    <Document title={`Cotización ${d.numero} v${d.version}`} author="ARIGA Joyería">
      <Page size="LETTER" style={estilos.pagina}>
        <Cabecera titulo={`COTIZACIÓN · VERSIÓN ${d.version}`} numero={d.numero} />

        <View style={estilos.fila}>
          <Dato etiqueta="Cliente" valor={d.cliente.nombre} />
          <Dato etiqueta="Teléfono" valor={d.cliente.telefono} />
          <Dato etiqueta="Fecha" valor={d.fechaEmision} />
          <Dato etiqueta="Válida hasta" valor={d.validoHasta} />
        </View>

        <Seccion titulo="Pieza">
          <View style={estilos.fila}>
            <Dato etiqueta={ETIQUETA_CATEGORIA[d.tipo]} valor={d.pieza} />
          </View>
        </Seccion>

        <Seccion titulo="Detalle">
          <View style={estilos.tabla}>
            <View style={estilos.tr}>
              <Text style={[estilos.th, { flex: 3 }]}>TRABAJO</Text>
              <Text style={[estilos.th, { flex: 1 }]}>COMPLEJIDAD</Text>
              <Text style={[estilos.th, { flex: 0.5 }, estilos.tdDer]}>CANT.</Text>
              <Text style={[estilos.th, { flex: 1 }, estilos.tdDer]}>PRECIO</Text>
              <Text style={[estilos.th, { flex: 1 }, estilos.tdDer]}>SUBTOTAL</Text>
            </View>
            {d.lineas.map((l, i) => (
              <View key={i} style={estilos.tr}>
                <View style={{ flex: 3 }}>
                  <Text>{l.nombre}</Text>
                  {l.detalle ? <Text style={{ fontSize: 8, color: "#666", marginTop: 1 }}>{l.detalle}</Text> : null}
                </View>
                <Text style={{ flex: 1 }}>{l.complejidad}</Text>
                <Text style={[{ flex: 0.5 }, estilos.tdDer]}>{l.cantidad}</Text>
                <Text style={[{ flex: 1 }, estilos.tdDer]}>{l.precioUnitario}</Text>
                <Text style={[{ flex: 1 }, estilos.tdDer]}>{l.subtotal}</Text>
              </View>
            ))}
          </View>
          <View style={estilos.total}>
            <Text style={estilos.totalEtiqueta}>TOTAL</Text>
            <Text style={estilos.totalValor}>{d.total}</Text>
          </View>
        </Seccion>

        <View style={[estilos.fila, { marginTop: 14 }]}>
          <Dato etiqueta="Tiempo estimado de trabajo" valor={`${d.diasEstimados} días hábiles desde la aprobación`} />
          <Dato etiqueta="Estado" valor={d.estado} />
        </View>

        {d.notas ? (
          <Seccion titulo="Notas">
            <Text style={{ lineHeight: 1.5 }}>{d.notas}</Text>
          </Seccion>
        ) : null}

        <Text style={estilos.nota}>
          Precios en quetzales. La cotización es válida hasta la fecha indicada; pasada esa fecha puede requerir una versión nueva.
          El tiempo estimado cuenta en días hábiles del taller a partir de la aprobación.
        </Text>

        <Pie texto="ARIGA JOYERÍA · TALLER DE REPARACIONES Y CREACIONES" />
      </Page>
    </Document>
  );
}
