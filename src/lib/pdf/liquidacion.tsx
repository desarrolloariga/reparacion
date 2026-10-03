import { Document, Page, Text, View } from "@react-pdf/renderer";

import { Cabecera, Dato, estilos, Pie, Seccion } from "./base";

export type DatosLiquidacion = {
  id: number;
  joyero: { nombre: string; telefono: string | null; documento: string | null };
  periodo: string;
  fechaPago: string;
  formaPago: string;
  referencia: string | null;
  lineas: { concepto: string; fecha: string | null; monto: string; descuento: boolean }[];
  subtotalPagos: string;
  subtotalDescuentos: string;
  total: string;
  pagadaPor: string | null;
};

/** Comprobante de liquidación: lo que ARIGA le paga al joyero por un período. */
export function DocumentoLiquidacion(d: DatosLiquidacion) {
  return (
    <Document title={`Liquidación ${d.id} · ${d.joyero.nombre}`} author="ARIGA Joyería">
      <Page size="LETTER" style={estilos.pagina}>
        <Cabecera titulo="COMPROBANTE DE LIQUIDACIÓN" numero={`LIQ-${String(d.id).padStart(5, "0")}`} />

        <View style={estilos.fila}>
          <Dato etiqueta="Joyero" valor={d.joyero.nombre} />
          <Dato etiqueta="Documento" valor={d.joyero.documento} />
          <Dato etiqueta="Teléfono" valor={d.joyero.telefono} />
        </View>
        <View style={[estilos.fila, { marginTop: 6 }]}>
          <Dato etiqueta="Período liquidado" valor={d.periodo} />
          <Dato etiqueta="Fecha de pago" valor={d.fechaPago} />
          <Dato etiqueta="Forma de pago" valor={d.formaPago} />
          <Dato etiqueta="Referencia" valor={d.referencia} />
        </View>

        <Seccion titulo="Detalle">
          <View style={estilos.tabla}>
            <View style={estilos.tr}>
              <Text style={[estilos.th, { flex: 4 }]}>CONCEPTO</Text>
              <Text style={[estilos.th, { flex: 1.2 }]}>TERMINADO</Text>
              <Text style={[estilos.th, { flex: 1.2 }, estilos.tdDer]}>MONTO</Text>
            </View>
            {d.lineas.map((l, i) => (
              <View key={i} style={estilos.tr}>
                <Text style={[{ flex: 4 }, l.descuento ? { color: "#8e4534" } : {}]}>{l.concepto}</Text>
                <Text style={{ flex: 1.2 }}>{l.fecha ?? "—"}</Text>
                <Text style={[{ flex: 1.2 }, estilos.tdDer, l.descuento ? { color: "#8e4534" } : {}]}>{l.monto}</Text>
              </View>
            ))}
          </View>
          <View style={[estilos.total, { marginTop: 10 }]}>
            <Text style={estilos.totalEtiqueta}>TRABAJOS</Text>
            <Text style={{ fontSize: 10 }}>{d.subtotalPagos}</Text>
          </View>
          <View style={[estilos.total, { marginTop: 2 }]}>
            <Text style={estilos.totalEtiqueta}>DESCUENTOS</Text>
            <Text style={{ fontSize: 10, color: "#8e4534" }}>{d.subtotalDescuentos}</Text>
          </View>
          <View style={estilos.total}>
            <Text style={estilos.totalEtiqueta}>TOTAL PAGADO</Text>
            <Text style={estilos.totalValor}>{d.total}</Text>
          </View>
        </Seccion>

        <Text style={estilos.nota}>
          Recibí de ARIGA Joyería la cantidad indicada por los trabajos detallados. Los descuentos corresponden a garantías
          de piezas bajo mi responsabilidad, según lo acordado.{d.pagadaPor ? ` Registró: ${d.pagadaPor}.` : ""}
        </Text>

        <View style={{ flexDirection: "row", gap: 40, marginTop: 36 }}>
          <View style={{ flex: 1, borderTopWidth: 0.5, borderTopColor: "#0b0b0c", paddingTop: 4 }}>
            <Text style={{ fontSize: 8, color: "#666" }}>Firma del joyero</Text>
          </View>
          <View style={{ flex: 1, borderTopWidth: 0.5, borderTopColor: "#0b0b0c", paddingTop: 4 }}>
            <Text style={{ fontSize: 8, color: "#666" }}>Por ARIGA Joyería</Text>
          </View>
        </View>

        <Pie texto="ARIGA JOYERÍA · TALLER DE REPARACIONES Y CREACIONES" />
      </Page>
    </Document>
  );
}
