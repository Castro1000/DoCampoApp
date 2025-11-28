// app/admin/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE_URL = "http://localhost:3001/api";

interface UsuarioLogado {
  tipo: string;
  id: number;
  nome: string;
  cpf?: string;
}

interface TransporteAdmin {
  id: number;
  destino: string;
  status: string;
  data_saida: string;
  data_chegada: string | null;
  descricao: string | null;
  produtor_nome: string;
  produtor_cpf: string;
  transportador_nome: string;
}

export default function AdminDashboardScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);

  const [transportes, setTransportes] = useState<TransporteAdmin[]>([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [erroLista, setErroLista] = useState<string | null>(null);

  async function carregarUsuario() {
    try {
      const json = await AsyncStorage.getItem("@docampo_usuario");
      if (!json) {
        setUsuario(null);
        return;
      }
      const data = JSON.parse(json) as UsuarioLogado;
      if (data.tipo === "admin") {
        setUsuario(data);
      } else {
        setUsuario(null);
      }
    } catch (e) {
      console.error("Erro ao ler usuário logado:", e);
      setUsuario(null);
    } finally {
      setCarregandoUsuario(false);
    }
  }

  async function carregarTransportes() {
    try {
      setLoadingLista(true);
      setErroLista(null);

      const resp = await fetch(`${API_BASE_URL}/admin/transportes`);
      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        data = {};
      }

      console.log(">>> RESPOSTA /admin/transportes:", resp.status, data);

      if (!resp.ok || !data.sucesso) {
        setErroLista(
          data?.erro || "Erro ao carregar os transportes para o administrador."
        );
        setTransportes([]);
        return;
      }

      setTransportes(data.transportes || []);
    } catch (err: any) {
      console.error(err);
      setErroLista(err?.message || "Erro de conexão ao carregar dados.");
      setTransportes([]);
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    carregarUsuario();
  }, []);

  useEffect(() => {
    if (usuario) {
      carregarTransportes();
    }
  }, [usuario]);

  // KPIs / Resumo
  const { total, emPreparo, emTransporte, entregues } = useMemo(() => {
    let total = transportes.length;
    let emPreparo = 0;
    let emTransporte = 0;
    let entregues = 0;

    for (const t of transportes) {
      const s = (t.status || "").toUpperCase();
      if (s === "EM PREPARO") emPreparo++;
      else if (s === "EM TRANSPORTE") emTransporte++;
      else if (s === "ENTREGUE") entregues++;
    }

    return { total, emPreparo, emTransporte, entregues };
  }, [transportes]);

  function formatarData(iso: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString().slice(0, 5)}`;
  }

  function corStatus(status: string) {
    const s = status.toUpperCase();
    if (s === "ENTREGUE") return "#16A34A";
    if (s === "EM TRANSPORTE") return "#2563EB";
    if (s === "EM PREPARO") return "#92400E";
    return "#4B5563";
  }

  if (carregandoUsuario) {
    return (
      <View style={styles.fullCenter}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>
          Carregando dados do administrador...
        </Text>
      </View>
    );
  }

  // NENHUM ADMIN LOGADO → MANDA PARA LOGIN
  if (!usuario) {
    return (
      <View style={styles.fullCenter}>
        <Text style={styles.emptyText}>
          Nenhum administrador logado encontrado.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/login/admin")}
        >
          <Text style={styles.primaryButtonText}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Topo */}
      <View className="topBar" style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Painel do administrador</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Olá, {usuario.nome}</Text>
        <Text style={styles.sectionSubtitle}>
          Acompanhe os transportes criados pelos agricultores e transportadores.
        </Text>
      </View>

      {/* Cards de resumo */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total</Text>
          <Text style={styles.kpiValue}>{total}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Em preparo</Text>
          <Text style={styles.kpiValue}>{emPreparo}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Em transporte</Text>
          <Text style={styles.kpiValue}>{emTransporte}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Entregues</Text>
          <Text style={styles.kpiValue}>{entregues}</Text>
        </View>
      </View>

      {/* Lista de transportes */}
      <View style={styles.listaContainer}>
        {erroLista && <Text style={styles.errorText}>{erroLista}</Text>}

        {loadingLista && transportes.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Carregando transportes...</Text>
          </View>
        ) : transportes.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              Ainda não há transportes registrados no sistema.
            </Text>
          </View>
        ) : (
          <FlatList
            data={transportes}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Produtor: {item.produtor_nome}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>CPF:</Text> {item.produtor_cpf}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Transportador:</Text>{" "}
                  {item.transportador_nome}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Destino:</Text>{" "}
                  {item.destino}
                </Text>
                {item.descricao ? (
                  <Text style={styles.cardLine}>
                    <Text style={styles.cardLabel}>Alimentos:</Text>{" "}
                    {item.descricao}
                  </Text>
                ) : null}
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Saída:</Text>{" "}
                  {formatarData(item.data_saida)}
                </Text>
                <Text style={styles.cardLine}>
                  <Text style={styles.cardLabel}>Chegada:</Text>{" "}
                  {formatarData(item.data_chegada)}
                </Text>

                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      { borderColor: corStatus(item.status) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: corStatus(item.status) },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullCenter: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#4B5563",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    paddingTop: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  backText: {
    fontSize: 14,
    color: "#14532D",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#14532D",
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14532D",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 4,
  },
  kpiRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#00000011",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  kpiLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  kpiValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: "#14532D",
  },
  listaContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    marginBottom: 8,
  },
  center: {
    alignItems: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#00000011",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#14532D",
    marginBottom: 4,
  },
  cardLine: {
    fontSize: 13,
    color: "#374151",
  },
  cardLabel: {
    fontWeight: "600",
    color: "#111827",
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: "#16A34A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
