// app/(tabs)/index.tsx
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  function handlePress(tipo: "produtor" | "transportador" | "admin" | "cidadao") {
    if (tipo === "cidadao") {
      // depois você cria essa rota (tela de instruções / scan)
      router.push("/consulta-publica");
    } else if (tipo === "produtor") {
      router.push("/login/produtor");
    } else if (tipo === "transportador") {
      router.push("/login/transportador");
    } else if (tipo === "admin") {
      router.push("/login/admin");
    }
  }

  return (
    <View style={styles.container}>
      {/* topo */}
      <View style={styles.header}>
        <Text style={styles.appName}>DoCampo</Text>
        <Text style={styles.subtitle}>
          Rastreabilidade e transparência dos alimentos da agricultura familiar.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Escolha seu perfil para continuar:</Text>

      {/* grid 2x2 */}
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress("produtor")}
        >
          <Text style={styles.cardEmoji}>🚜</Text>
          <Text style={styles.cardTitle}>Produtor Rural</Text>
          <Text style={styles.cardText}>Cadastre lotes e gere QR Codes.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress("transportador")}
        >
          <Text style={styles.cardEmoji}>🚚</Text>
          <Text style={styles.cardTitle}>Transportador</Text>
          <Text style={styles.cardText}>Gerencie pedidos de transporte.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress("admin")}
        >
          <Text style={styles.cardEmoji}>🧑‍💼</Text>
          <Text style={styles.cardTitle}>Administrador</Text>
          <Text style={styles.cardText}>Acompanhe usuários e relatórios.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress("cidadao")}
        >
          <Text style={styles.cardEmoji}>🧺</Text>
          <Text style={styles.cardTitle}>Cidadão</Text>
          <Text style={styles.cardText}>
            Escaneie o QR e veja a origem dos alimentos.
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        DoCampo • Conectando o campo, a logística e o consumidor.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FFF4",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#14532D",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14532D",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: "#00000022",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    alignItems: "center",
    marginBottom: 10,
  },
  cardEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#14532D",
    textAlign: "center",
  },
  cardText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  footer: {
    marginTop: "auto",
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
  },
});
