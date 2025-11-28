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

export default function LotesPorMes() {
  const router = useRouter();
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");

  const MOCK = [
    { produto: "Banana", quantidade: 40 },
    { produto: "Alface", quantidade: 22 },
    { produto: "Macaxeira", quantidade: 15 },
  ];

  const total = MOCK.reduce((a, b) => a + b.quantidade, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lotes por Mês</Text>

      <View style={styles.filtros}>
        <TextInput
          style={styles.input}
          placeholder="Mês (01 a 12)"
          keyboardType="numeric"
          value={mes}
          onChangeText={setMes}
        />

        <TextInput
          style={styles.input}
          placeholder="Ano (2025)"
          keyboardType="numeric"
          value={ano}
          onChangeText={setAno}
        />
      </View>

      <FlatList
        data={MOCK}
        keyExtractor={(item, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.produto}>{item.produto}</Text>
            <Text style={styles.info}>{item.quantidade} un.</Text>
          </View>
        )}
      />

      <Text style={styles.total}>Total: {total} unidades</Text>

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
  filtros: { flexDirection: "row", gap: 10, marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C8D9CB",
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
  voltarBtn: {
    marginTop: 20,
    alignSelf: "center",
    padding: 10,
  },
  voltarTxt: { color: GREEN, fontWeight: "700" },
});
