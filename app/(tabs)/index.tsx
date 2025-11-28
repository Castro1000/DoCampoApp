// app/(tabs)/index.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  function handlePress(tipo: "produtor" | "transportador" | "cidadao") {
    if (tipo === "cidadao") {
      router.push("/consulta-publica");
    } else if (tipo === "produtor") {
      router.push("/login/produtor");
    } else if (tipo === "transportador") {
      router.push("/login/transportador");
    }
  }

  return (
    <View style={styles.container}>
      {/* LOGO NO TOPO */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/DoCampo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.sectionTitle}>
        Escolha seu perfil para continuar:
      </Text>

      {/* LINHA COM 2 CARDS MENORES */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.cardSmall}
          onPress={() => handlePress("produtor")}
        >
          <Text style={styles.cardEmoji}>🚜</Text>
          <Text style={styles.cardTitle}>Produtor Rural</Text>
          <Text style={styles.cardText}>
            Cadastre lotes e gere QR Codes.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cardSmall}
          onPress={() => handlePress("transportador")}
        >
          <Text style={styles.cardEmoji}>🚚</Text>
          <Text style={styles.cardTitle}>Transportador</Text>
          <Text style={styles.cardText}>
            Gerencie pedidos de transporte.
          </Text>
        </TouchableOpacity>
      </View>

      {/* CARD GRANDE DO CIDADÃO */}
      <TouchableOpacity
        style={styles.cardBig}
        onPress={() => handlePress("cidadao")}
      >
        <Text style={styles.cardEmojiBig}>🧺</Text>
        <Text style={styles.cardTitleBig}>Cidadão</Text>
        <Text style={styles.cardTextBig}>
          Escaneie o QR Code e veja a origem dos alimentos que chegam até você.
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FFF4",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    width: 220,
    height: 140,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#083a1cff",
    marginBottom: 16,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardSmall: {
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
  },
  cardEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0d5329ff",
    textAlign: "center",
  },
  cardText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },

  cardBig: {
    marginTop: 4,
    backgroundColor: "#068e2fff",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: "#00000033",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
  },
  cardEmojiBig: {
    fontSize: 32,
    marginBottom: 6,
    color: "#FFF",
  },
  cardTitleBig: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  cardTextBig: {
    marginTop: 6,
    fontSize: 13,
    color: "#E5E7EB",
    textAlign: "center",
  },
});
