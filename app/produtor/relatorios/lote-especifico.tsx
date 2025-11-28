import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoteEspecifico() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  const MOCK = {
    produto: "Banana",
    quantidade: 40,
    data_saida: "2025-01-16",
    transportador: "Pedro Lucena",
    destino: "Feira do Centro",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lote Específico</Text>

      <TextInput
        style={styles.input}
        placeholder="Código do lote (DOCAMPO-XXXX)"
        value={codigo}
        onChangeText={setCodigo}
      />

      {/* RESULTADO */}
      <View style={styles.card}>
        <Text style={styles.produto}>{MOCK.produto}</Text>
        <Text style={styles.info}>Quantidade: {MOCK.quantidade}</Text>
        <Text style={styles.info}>Saída: {MOCK.data_saida}</Text>
        <Text style={styles.info}>Transportador: {MOCK.transportador}</Text>
        <Text style={styles.info}>Destino: {MOCK.destino}</Text>
      </View>

      <TouchableOpacity onPress={() => router.back()} style={styles.voltarBtn}>
        <Text style={styles.voltarTxt}>‹ Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const GREEN = "#14532D";
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 16 },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: GREEN,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C8D9CB",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0E2D0",
  },
  produto: { fontSize: 18, fontWeight: "700", color: GREEN },
  info: { marginTop: 4, color: "#333" },
  voltarBtn: { marginTop: 20, alignSelf: "center", padding: 10 },
  voltarTxt: { color: GREEN, fontWeight: "700" },
});
