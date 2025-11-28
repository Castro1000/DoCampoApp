import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RelatoriosMenu() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      
      {/* BOTÃO VOLTAR */}
      <TouchableOpacity
        style={styles.btnVoltar}
        onPress={() => router.push("/produtor")}
      >
        <Text style={styles.btnVoltarTxt}>‹ Voltar</Text>
      </TouchableOpacity>

      {/* TÍTULO */}
      <Text style={styles.titulo}>Relatórios</Text>

      {/* RELATÓRIOS DE LOTES */}
      <Text style={styles.sectionTitle}>Lotes</Text>

      <View style={styles.box}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/produtor/relatorios/lotes-mes")}
        >
          <Text style={styles.btnTxt}>Lotes por Mês</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/produtor/relatorios/lotes-ano")}
        >
          <Text style={styles.btnTxt}>Lotes por Ano</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/produtor/relatorios/lote-especifico")}
        >
          <Text style={styles.btnTxt}>Lote Específico (Saída para Venda)</Text>
        </TouchableOpacity>
      </View>

      {/* RELATÓRIOS DE TRANSPORTADORES */}
      <Text style={styles.sectionTitle}>Transportadores</Text>

      <View style={styles.box}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/produtor/relatorios/transp-mes")}
        >
          <Text style={styles.btnTxt}>Transportadores no Mês</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/produtor/relatorios/transp-periodo")}
        >
          <Text style={styles.btnTxt}>Transportadores por Período</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push("/produtor/relatorios/transp-resumo")}
        >
          <Text style={styles.btnTxt}>Resumo de Entregas e Viagens</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const GREEN = "#14532D";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F8F4",
    paddingTop: 50,
    paddingHorizontal: 16,
  },

  btnVoltar: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CDE5D0",
    width: 90,
    marginBottom: 10,
  },
  btnVoltarTxt: {
    color: GREEN,
    fontWeight: "700",
    fontSize: 15,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "800",
    color: GREEN,
    textAlign: "center",
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: GREEN,
    marginBottom: 10,
    marginTop: 20,
  },

  box: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#CDE5D0",
  },

  btn: {
    backgroundColor: GREEN,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 12,
  },

  btnTxt: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
