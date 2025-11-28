import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Ajusta para o endereço do seu backend
const API_BASE_URL = "http://localhost:3001/api";

type Transporte = {
  id: number;
  destino: string;
  status: string;
  data_saida: string | null;
  data_chegada: string | null;
  lotes_produtos?: string | null;
};

export default function TransportadorTransportesScreen() {
  const router = useRouter();
  const { id, nome } = useLocalSearchParams<{ id?: string; nome?: string }>();

  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const transportadorId = id ? Number(id) : null;

  const carregarTransportes = useCallback(async () => {
    if (!transportadorId) {
      setLoading(false);
      Alert.alert("Erro", "ID do transportador não encontrado.");
      return;
    }

    try {
      if (!refreshing) setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/transportes/transportador/${transportadorId}`
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Erro ao carregar transportes",
          data.message || "Tente novamente."
        );
        return;
      }

      // Mapeia para um formato padrão (caso backend mande transporte_id)
      const mapped: Transporte[] = (data || []).map((t: any) => ({
        id: t.transporte_id ?? t.id,
        destino: t.destino,
        status: t.status,
        data_saida: t.data_saida,
        data_chegada: t.data_chegada,
        lotes_produtos: t.lotes_produtos,
      }));

      setTransportes(mapped);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Erro",
        "Não foi possível carregar os transportes. Verifique sua conexão."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transportadorId, refreshing]);

  useEffect(() => {
    carregarTransportes();
  }, [carregarTransportes]);

  const onRefresh = () => {
    setRefreshing(true);
  };

  function formatarData(valor: string | null): string {
    if (!valor) return "-";
    try {
      // Tenta parsear a string de data
      const d = new Date(valor);
      if (isNaN(d.getTime())) return valor; // se não for uma data válida, devolve como está

      const dia = d.getDate().toString().padStart(2, "0");
      const mes = (d.getMonth() + 1).toString().padStart(2, "0");
      const ano = d.getFullYear();
      const hora = d.getHours().toString().padStart(2, "0");
      const min = d.getMinutes().toString().padStart(2, "0");

      return `${dia}/${mes}/${ano} ${hora}:${min}`;
    } catch {
      return valor;
    }
  }

  function getStatusStyle(status: string) {
    const s = status.toUpperCase();
    if (s === "CRIADO" || s === "AGUARDANDO SAÍDA") {
      return { bg: "#FEF3C7", text: "#92400E" }; // amarelo
    }
    if (s === "EM TRANSPORTE") {
      return { bg: "#DBEAFE", text: "#1D4ED8" }; // azul
    }
    if (s === "ENTREGUE" || s === "FINALIZADO") {
      return { bg: "#DCFCE7", text: "#166534" }; // verde
    }
    return { bg: "#E5E7EB", text: "#374151" }; // cinza
  }

  async function registrarSaida(transporte: Transporte) {
    if (!transportadorId) return;

    try {
      setUpdatingId(transporte.id);

      const response = await fetch(
        `${API_BASE_URL}/transportes/${transporte.id}/saida`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transportador_id: transportadorId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Erro",
          data.message || "Não foi possível registrar a saída."
        );
        return;
      }

      // Recarrega lista
      await carregarTransportes();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao registrar saída.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function registrarChegada(transporte: Transporte) {
    if (!transportadorId) return;

    try {
      setUpdatingId(transporte.id);

      const response = await fetch(
        `${API_BASE_URL}/transportes/${transporte.id}/chegada`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transportador_id: transportadorId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Erro",
          data.message || "Não foi possível registrar a chegada."
        );
        return;
      }

      await carregarTransportes();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao registrar chegada.");
    } finally {
      setUpdatingId(null);
    }
  }

  function renderItem({ item }: { item: Transporte }) {
    const statusStyle = getStatusStyle(item.status);
    const produtos = item.lotes_produtos
      ? String(item.lotes_produtos).split(",")
      : [];

    const podeRegistrarSaida = !item.data_saida;
    const podeRegistrarChegada = !!item.data_saida && !item.data_chegada;
    const finalizado = !!item.data_chegada;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.destino}>{item.destino}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.bg },
            ]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {produtos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lotes / Produtos:</Text>
            <Text style={styles.sectionText}>{produtos.join(", ")}</Text>
          </View>
        )}

        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Saída:</Text>
            <Text style={styles.dateValue}>
              {formatarData(item.data_saida)}
            </Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Chegada:</Text>
            <Text style={styles.dateValue}>
              {formatarData(item.data_chegada)}
            </Text>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          {podeRegistrarSaida && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.saidaButton,
                updatingId === item.id && styles.actionButtonDisabled,
              ]}
              onPress={() => registrarSaida(item)}
              disabled={updatingId === item.id}
            >
              {updatingId === item.id ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>Registrar saída</Text>
              )}
            </TouchableOpacity>
          )}

          {podeRegistrarChegada && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.chegadaButton,
                updatingId === item.id && styles.actionButtonDisabled,
              ]}
              onPress={() => registrarChegada(item)}
              disabled={updatingId === item.id}
            >
              {updatingId === item.id ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>Registrar chegada</Text>
              )}
            </TouchableOpacity>
          )}

          {finalizado && (
            <Text style={styles.finalizadoText}>
              Transporte finalizado ✅
            </Text>
          )}
        </View>
      </View>
    );
  }

  function handleVoltar() {
    router.back();
  }

  return (
    <View style={styles.container}>
      {/* topo */}
      <View style={styles.header}>
        <Text style={styles.appName}>DoCampo</Text>
        <Text style={styles.subtitle}>
          Transportes de{" "}
          <Text style={styles.bold}>
            {nome && String(nome).trim().length > 0
              ? String(nome)
              : "Transportador"}
          </Text>
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>Carregando transportes...</Text>
        </View>
      ) : (
        <FlatList
          data={transportes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={
            transportes.length === 0 ? styles.center : { paddingBottom: 16 }
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nenhum transporte encontrado para este transportador.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#16A34A"
            />
          }
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={handleVoltar}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        DoCampo • Rastreando o caminho dos alimentos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FFF4",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  header: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#14532D",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#4B5563",
  },
  bold: {
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#4B5563",
    fontSize: 13,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    marginTop: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#00000011",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  destino: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14532D",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  section: {
    marginTop: 4,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  sectionText: {
    fontSize: 12,
    color: "#4B5563",
  },
  datesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  dateValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  buttonsRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  saidaButton: {
    backgroundColor: "#16A34A",
  },
  chegadaButton: {
    backgroundColor: "#1D4ED8",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  finalizadoText: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "700",
  },
  backButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#14532D",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
  },
});
