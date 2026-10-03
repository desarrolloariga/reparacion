import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import { LOGO_PNG_DATA_URL } from "@/lib/marca-datos";

/** Estilos comunes de los documentos ARIGA: negro, crema y oro, sobrio. */
export const estilos = StyleSheet.create({
  pagina: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#0b0b0c" },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#c6a15b" },
  marca: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 19 },
  marcaNombre: { fontSize: 13, letterSpacing: 3, fontFamily: "Helvetica-Bold" },
  marcaSub: { fontSize: 7, letterSpacing: 2.5, color: "#6b6b6b", marginTop: 2 },
  tituloDoc: { fontSize: 9, letterSpacing: 2, color: "#9c7b36", textAlign: "right" },
  numero: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 3 },
  seccion: { marginTop: 14 },
  rotulo: { fontSize: 7, letterSpacing: 1.6, color: "#9c7b36", marginBottom: 4 },
  fila: { flexDirection: "row", gap: 16 },
  celda: { flex: 1 },
  etiqueta: { fontSize: 7, color: "#777", letterSpacing: 1 },
  valor: { fontSize: 10, marginTop: 2 },
  tabla: { marginTop: 6, borderTopWidth: 1, borderTopColor: "#0b0b0c" },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d9d4c7", paddingVertical: 5 },
  th: { fontSize: 7, letterSpacing: 1.2, color: "#555", paddingVertical: 4 },
  tdDer: { textAlign: "right" },
  total: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 24 },
  totalEtiqueta: { fontSize: 9, color: "#555" },
  totalValor: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  nota: { fontSize: 8, color: "#666", lineHeight: 1.5, marginTop: 10 },
  pie: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 7, color: "#888", textAlign: "center", letterSpacing: 1 },
  fotos: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  foto: { width: 118, height: 118, objectFit: "cover", borderWidth: 0.5, borderColor: "#d9d4c7" },
});

export function Cabecera({ titulo, numero }: { titulo: string; numero: string }) {
  return (
    <View style={estilos.cabecera}>
      <View style={estilos.marca}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf, no es <img> */}
        <Image src={LOGO_PNG_DATA_URL} style={estilos.logo} />
        <View>
          <Text style={estilos.marcaNombre}>ARIGA</Text>
          <Text style={estilos.marcaSub}>JOYERÍA · TALLER</Text>
        </View>
      </View>
      <View>
        <Text style={estilos.tituloDoc}>{titulo}</Text>
        <Text style={estilos.numero}>{numero}</Text>
      </View>
    </View>
  );
}

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.seccion}>
      <Text style={estilos.rotulo}>{titulo.toUpperCase()}</Text>
      {children}
    </View>
  );
}

export function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <View style={estilos.celda}>
      <Text style={estilos.etiqueta}>{etiqueta.toUpperCase()}</Text>
      <Text style={estilos.valor}>{valor && valor.trim() ? valor : "—"}</Text>
    </View>
  );
}

export function Pie({ texto }: { texto: string }) {
  return <Text style={estilos.pie} fixed>{texto}</Text>;
}
