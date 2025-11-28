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

export default function TransportadoresMes() {
  const router = useRouter();
  const [mes, setMes] = useState("");

  const MOCK = [
    { nome: "Pedro Lucena", viagens: 3 },
    { nome: "José Carlos", viagens: 2 },
  ];

  const total = MOCK.reduce((a, b) => a + b.viagens, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Transportadores no Mês</Text>

      <TextInput
        style={styles.input}
        placeholder="Mês (01 a 12)"
        keyboardType="numeric"
        value={mes}
        onChangeText={setMes}
      />

      <FlatList
        data={MOCK}
        keyExtractor={(i, idx) => idx.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.produto}>{item.nome}</Text>
            <Text style={styles.info}>{item.viagens} viagens</Text>
          </View>
        )}
      />

      <Text style={styles.total}>Total: {total} viagens</Text>

      <TouchableOpacity onPress={() => router.back()}>
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
    textAlign: "center",
    fontWeight: "800",
    fontSize: 18,
    color: GREEN,
  },
  voltarTxt: {
    textAlign: "center",
    marginTop: 20,
    color: GREEN,
    fontWeight: "700",
  },
});
