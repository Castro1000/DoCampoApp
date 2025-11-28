// app/produtor/transportes.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "https://docampo-backend-production.up.railway.app/api";

interface UsuarioLogado {
  tipo: string;
  id: number;
  nome: string;
  cpf: string;
}

interface TransporteProdutor {
  id: number;
  destino: string;
  status: string;
  data_saida: string;
  data_chegada: string | null;
  descricao: string | null;
  transportador_nome: string;
}

interface Transportador {
  id: number;
  nome: string;
  cpf: string;
  telefone: string | null;
}

export default function ProdutorTransportesScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);

  const [transportes, setTransportes] = useState<TransporteProdutor[]>([]);
  const [transportadores, setTransportadores] = useState<Transportador[]>([]);

  const [loadingTransportes, setLoadingTransportes] = useState(false);
  const [loadingTransportadores, setLoadingTransportadores] = useState(false);

  const [erroTransportes, setErroTransportes] = useState<string | null>(null);
  const [erroTransportadores, setErroTransportadores] =
    useState<string | null>(null);

  const [mostrarListaTransportadores, setMostrarListaTransportadores] =
    useState(false);

  async function carregarUsuario() {
    try {
      const json = await AsyncStorage.getItem("@docampo_usuario");
      if (!json) {
        setUsuario(null);
        return;
      }
      const data = JSON.parse(json) as UsuarioLogado;
      if (data.tipo === "produtor") {
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

  async function carregarTransportes(cpfProdutor: string) {
    try {
      setLoadingTransportes(true);
      setErroTransportes(null);

      const url = `${API_BASE_URL}/meus-transportes-produtor/${cpfProdutor}`;
      console.log(">>> BUSCANDO TRANSPORTES CPF:", cpfProdutor, "URL:", url);

      const resp = await fetch(url);

      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        data = {};
      }

      console.log(">>> RESPOSTA /meus-transportes-produtor:", resp.status, data);

      if (!resp.ok || !data.sucesso) {
        setErroTransportes(
          data?.erro ||
            "Erro ao carregar os transportes deste produtor."
        );
        setTransportes([]);
        return;
      }

      setTransportes(data.transportes || []);
    } catch (err: any) {
      console.error(err);
      setErroTransportes(
        err?.message || "Erro de conexão ao carregar dados."
      );
      setTransportes([]);
    } finally {
      setLoadingTransportes(false);
    }
  }

  async function carregarTransportadores() {
    try {
      setLoadingTransportadores(true);
      setErroTransportadores(null);

      const resp = await fetch(`${API_BASE_URL}/transportadores`);
      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        data = {};
      }

      console.log(">>> RESPOSTA /transportadores:", resp.status, data);

      if (!resp.ok || !data.sucesso) {
        setErroTransportadores(
          data?.erro || "Erro ao carregar a lista de transportadores."
        );
        setTransportadores([]);
        return;
      }

      setTransportadores(data.transportadores || []);
    } catch (err: any) {
      console.error(err);
      setErroTransportadores(
        err?.message ||
          "Erro de conexão ao carregar os transportadores."
      );
      setTransportadores([]);
    } finally {
      setLoadingTransportadores(false);
    }
  }

  useEffect(() => {
    carregarUsuario();
  }, []);

  useEffect(() => {
    if (usuario) {
      // usa o CPF salvo no AsyncStorage (ex: 00989272214)
      carregarTransportes(usuario.cpf);
      carregarTransportadores();
    }
  }, [usuario]);

  function formatarData(iso: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toLocaleDateString()} ${d
      .toLocaleTimeString()
      .slice(0, 5)}`;
  }

  function corStatus(status: string) {
    const s = status.toUpperCase();
    if (s.includes("ENTREGUE")) return "#16A34A";
    if (s.includes("EM TRANSPORTE")) return "#2563EB";
    if (s.includes("EM PREPARO")) return "#92400E";
    return "#4B5563";
  }

  if (carregandoUsuario) {
    return (
      <View style={styles.fullCenter}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>
          Carregando dados do produtor...
        </Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.fullCenter}>
        <Text style={styles.emptyText}>
          Nenhum produtor logado encontrado.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/login/produtor")}
        >
          <Text style={styles.primaryButtonText}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Topo com botão voltar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transporte</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Meus transportes</Text>
        <Text style={styles.sectionSubtitle}>
          Acompanhe as cargas em andamento e já concluídas. Os status são
          atualizados pelo transportador.
        </Text>
      </View>

      {/* Lista de transportes */}
      <View style={styles.transportesContainer}>
        {erroTransportes && (
          <Text style={styles.errorText}>{erroTransportes}</Text>
        )}

        {loadingTransportes && transportes.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>
              Carregando transportes...
            </Text>
          </View>
        ) : transportes.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              Você ainda não possui transportes cadastrados.
            </Text>
          </View>
        ) : (
          <FlatList
            data={transportes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Transportador: {item.transportador_nome}
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
            )}
          />
        )}
      </View>

      {/* BLOCO DE TRANSPORTADORES CADASTRADOS */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.bottomHeader}
          onPress={() =>
            setMostrarListaTransportadores((prev) => !prev)
          }
        >
          <Text style={styles.bottomTitle}>
            Transportadores cadastrados
          </Text>
          <Text style={styles.bottomArrow}>
            {mostrarListaTransportadores ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>

        {mostrarListaTransportadores && (
          <View style={styles.bottomContent}>
            {erroTransportadores && (
              <Text style={styles.errorText}>
                {erroTransportadores}
              </Text>
            )}

            {loadingTransportadores && transportadores.length === 0 ? (
              <View style={styles.center}>
                <ActivityIndicator />
              </View>
            ) : transportadores.length === 0 ? (
              <Text style={styles.emptyText}>
                Nenhum transportador cadastrado encontrado.
              </Text>
            ) : (
              <FlatList
                data={transportadores}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.transportadorRow}>
                    <Text style={styles.transportadorNome}>
                      {item.nome}
                    </Text>
                    <Text style={styles.transportadorInfo}>
                      CPF: {item.cpf}
                    </Text>
                    {item.telefone ? (
                      <Text style={styles.transportadorInfo}>
                        Tel: {item.telefone}
                      </Text>
                    ) : null}
                  </View>
                )}
              />
            )}
          </View>
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
    marginBottom: 4,
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#4B5563",
  },
  transportesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  statusBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
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

  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: "#BBF7D0",
    backgroundColor: "#E8F5E9",
  },
  bottomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bottomTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#14532D",
  },
  bottomArrow: {
    fontSize: 16,
    color: "#14532D",
  },
  bottomContent: {
    maxHeight: 220,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  transportadorRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
  },
  transportadorNome: {
    fontSize: 13,
    fontWeight: "700",
    color: "#14532D",
  },
  transportadorInfo: {
    fontSize: 12,
    color: "#374151",
  },
});
