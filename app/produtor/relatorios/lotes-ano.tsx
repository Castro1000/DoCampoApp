import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LotesPorAno() {
  const router = useRouter();
  const [ano, setAno] = useState("");

  const MOCK = [
    { produto: "Banana", total: 410 },
    { produto: "Alface", total: 220 },
    { produto: "Macaxeira", total: 150 },
  ];

  const soma = MOCK.reduce((a, b) => a + b.total, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lotes por Ano</Text>

      <TextInput
        style={styles.input}
        placeholder="Ano"
        keyboardType="numeric"
        value={ano}
        onChangeText={setAno}
      />

      <FlatList
        data={MOCK}
        keyExtractor={(i, idx) => idx.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.produto}>{item.produto}</Text>
            <Text style={styles.info}>{item.total} unidades</Text>
          </View>
        )}
      />

      <Text style={styles.total}>Total no ano: {soma} unidades</Text>

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
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0E2D0",
    marginBottom: 10,
  },
  produto: { fontSize: 16, fontWeight: "700", color: GREEN },
  info: { marginTop: 4, color: "#555" },
  total: {
    marginTop: 20,
    fontWeight: "800",
    fontSize: 18,
    textAlign: "center",
    color: GREEN,
  },
  voltarBtn: { marginTop: 20, alignSelf: "center", padding: 10 },
  voltarTxt: { color: GREEN, fontWeight: "700" },
});
