import { Document, Image, Page, Text, View } from "@react-pdf/renderer";

import { ETIQUETA_CATEGORIA, type CategoriaTrabajo } from "@/lib/supabase/modelo";

import { Cabecera, Dato, estilos, Pie, Seccion } from "./base";

export type DatosRecepcion = {
  numero: string;
  tipo: CategoriaTrabajo;
  fechaRecepcion: string;
  cliente: { nombre: string; telefono: string | null; correo: string | null };
  pieza: {
    descripcion: string;
    material: string | null;
    quilataje: string | null;
    pesoEntrada: string | null;
    piedras: string | null;
    observaciones: string | null;
  };
  trabajos: { nombre: string; complejidad: string; detalle: string | null; cantidad: number; dias: number }[];
  diasEstimados: number;
  fechaEstimada: string | null;
  fechaPrometida: string | null;
  recibidoPor: string;
  /** JPEG ya convertidas; vacío si no hay. */
  fotos: Buffer[];
};

export function DocumentoRecepcion(d: DatosRecepcion) {
  return (
    <Document title={`Recepción ${d.numero}`} author="ARIGA Joyería">
      <Page size="LETTER" style={estilos.pagina}>
        <Cabecera titulo="COMPROBANTE DE RECEPCIÓN" numero={d.numero} />

        <View style={estilos.fila}>
          <Dato etiqueta="Tipo" valor={ETIQUETA_CATEGORIA[d.tipo]} />
          <Dato etiqueta="Fecha de recepción" valor={d.fechaRecepcion} />
          <Dato etiqueta="Recibido por" valor={d.recibidoPor} />
        </View>

        <Seccion titulo="Cliente">
          <View style={estilos.fila}>
            <Dato etiqueta="Nombre" valor={d.cliente.nombre} />
            <Dato etiqueta="Teléfono" valor={d.cliente.telefono} />
            <Dato etiqueta="Correo" valor={d.cliente.correo} />
          </View>
        </Seccion>

        <Seccion titulo="Pieza">
          <View style={estilos.fila}>
            <Dato etiqueta="Descripción" valor={d.pieza.descripcion} />
          </View>
          <View style={[estilos.fila, { marginTop: 6 }]}>
            <Dato etiqueta="Material" valor={d.pieza.material} />
            <Dato etiqueta="Quilataje" valor={d.pieza.quilataje} />
            <Dato etiqueta="Peso de entrada" valor={d.pieza.pesoEntrada ? `${d.pieza.pesoEntrada} g` : null} />
          </View>
          <View style={[estilos.fila, { marginTop: 6 }]}>
            <Dato etiqueta="Piedras" valor={d.pieza.piedras} />
          </View>
          <View style={[estilos.fila, { marginTop: 6 }]}>
            <Dato etiqueta="Estado al recibir" valor={d.pieza.observaciones} />
          </View>
        </Seccion>

        <Seccion titulo="Trabajos a realizar">
          <View style={estilos.tabla}>
            <View style={estilos.tr}>
              <Text style={[estilos.th, { flex: 3 }]}>TRABAJO</Text>
              <Text style={[estilos.th, { flex: 1.2 }]}>COMPLEJIDAD</Text>
              <Text style={[estilos.th, { flex: 0.8 }, estilos.tdDer]}>DÍAS HÁBILES</Text>
            </View>
            {d.trabajos.map((t, i) => (
              <View key={i} style={estilos.tr}>
                <View style={{ flex: 3 }}>
                  <Text>{t.cantidad > 1 ? `${t.cantidad} × ` : ""}{t.nombre}</Text>
                  {t.detalle ? <Text style={{ fontSize: 8, color: "#666", marginTop: 1 }}>{t.detalle}</Text> : null}
                </View>
                <Text style={{ flex: 1.2 }}>{t.complejidad}</Text>
                <Text style={[{ flex: 0.8 }, estilos.tdDer]}>{t.dias}</Text>
              </View>
            ))}
          </View>
          <View style={[estilos.fila, { marginTop: 10 }]}>
            <Dato etiqueta="Tiempo estimado" valor={`${d.diasEstimados} días hábiles`} />
            <Dato etiqueta="Entrega estimada" valor={d.fechaEstimada} />
            <Dato etiqueta="Fecha prometida" valor={d.fechaPrometida} />
          </View>
        </Seccion>

        {d.fotos.length > 0 ? (
          <Seccion titulo="Fotografías de entrada">
            <View style={estilos.fotos}>
              {d.fotos.slice(0, 4).map((f, i) => (
                // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf, no es <img>
                <Image key={i} src={{ data: f, format: "jpg" }} style={estilos.foto} />
              ))}
            </View>
          </Seccion>
        ) : null}

        <Text style={estilos.nota}>
          Este comprobante acredita la recepción de la pieza descrita en el estado indicado. El precio se confirma con la cotización;
          la fecha prometida es estimada y se actualiza al aprobarla. Conserve este documento para retirar la pieza.
        </Text>

        <Pie texto="ARIGA JOYERÍA · TALLER DE REPARACIONES Y CREACIONES" />
      </Page>
    </Document>
  );
}
