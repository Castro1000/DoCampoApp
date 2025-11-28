import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TransportesResumo() {
  const router = useRouter();

  const MOCK = {
    total_viagens: 12,
    total_categorias: [
      { tipo: "Feiras", qtd: 5 },
      { tipo: "Mercados", qtd: 4 },
      { tipo: "Restaurantes", qtd: 3 },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Resumo de Entregas</Text>

      <Text style={styles.total}>Total de viagens: {MOCK.total_viagens}</Text>

      {MOCK.total_categorias.map((item, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.produto}>{item.tipo}</Text>
          <Text style={styles.info}>{item.qtd} viagens</Text>
        </View>
      ))}

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
    textAlign: "center",
    color: GREEN,
    marginBottom: 20,
  },
  total: {
    fontSize: 18,
    fontWeight: "700",
    color: GREEN,
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D0E2D0",
    marginBottom: 10,
  },
  produto: { fontSize: 16, fontWeight: "700", color: GREEN },
  info: { marginTop: 4, color: "#444" },
  voltarTxt: {
    marginTop: 20,
    textAlign: "center",
    color: GREEN,
    fontWeight: "700",
  },
});
