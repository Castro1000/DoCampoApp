// app/transportador/index.tsx
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

const API_BASE_URL = "http://localhost:3001/api";

interface UsuarioLogado {
  tipo: string;
  id: number;
  nome: string;
  cpf: string;
}

interface Transporte {
  id: number;
  destino: string;
  status: string;
  data_saida: string;
  data_chegada: string | null;
  descricao: string | null;
  produtor_nome: string;
}

export default function TransportadorHomeScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);

  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const [atualizandoId, setAtualizandoId] = useState<number | null>(null);

  async function carregarUsuario() {
    try {
      const json = await AsyncStorage.getItem("@docampo_usuario");
      if (!json) {
        setUsuario(null);
        return;
      }
      const data = JSON.parse(json) as UsuarioLogado;
      if (data.tipo === "transportador") {
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

  async function carregarTransportes(transportadorId: number) {
    try {
      setLoadingLista(true);
      setErroLista(null);

      const resp = await fetch(
        `${API_BASE_URL}/transportes/transportador/${transportadorId}`
      );
      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        data = {};
      }

      console.log(">>> RESPOSTA /transportes/transportador:", resp.status, data);

      if (!resp.ok || !data.sucesso) {
        setErroLista(
          data?.erro || "Erro ao carregar seus serviços de transporte."
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
      carregarTransportes(usuario.id);
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
    if (s === "ENTREGUE") return "#16A34A";
    if (s === "EM TRANSPORTE") return "#2563EB";
    if (s === "EM PREPARO") return "#92400E";
    return "#4B5563";
  }

  function proximoStatus(statusAtual: string): "EM TRANSPORTE" | "ENTREGUE" | null {
    const s = statusAtual.toUpperCase();
    if (s === "EM PREPARO") return "EM TRANSPORTE";
    if (s === "EM TRANSPORTE") return "ENTREGUE";
    return null;
  }

  function textoBotaoStatus(statusAtual: string): string | null {
    const s = statusAtual.toUpperCase();
    if (s === "EM PREPARO") return "Iniciar transporte";
    if (s === "EM TRANSPORTE") return "Marcar como entregue";
    return null;
  }

  async function handleAtualizarStatus(transporte: Transporte) {
    const prox = proximoStatus(transporte.status);
    if (!prox) return;

    try {
      setAtualizandoId(transporte.id);

      const resp = await fetch(
        `${API_BASE_URL}/transportes/${transporte.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: prox }),
        }
      );

      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        data = {};
      }

      console.log(">>> RESPOSTA PATCH status:", resp.status, data);

      if (!resp.ok || !data.sucesso) {
        alert(
          data?.erro || "Não foi possível atualizar o status deste transporte."
        );
        return;
      }

      const atualizado = data.transporte;

      // Atualizar lista local
      setTransportes((lista) =>
        lista.map((t) =>
          t.id === transporte.id
            ? {
                ...t,
                status: atualizado.status,
                data_chegada: atualizado.data_chegada,
              }
            : t
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro de conexão ao atualizar status.");
    } finally {
      setAtualizandoId(null);
    }
  }

  if (carregandoUsuario) {
    return (
      <View style={styles.fullCenter}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>
          Carregando dados do transportador...
        </Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.fullCenter}>
        <Text style={styles.emptyText}>
          Nenhum transportador logado encontrado.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/login/transportador")}
        >
          <Text style={styles.primaryButtonText}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Topo */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{"< Voltar"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Meus serviços</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Transportador: {usuario.nome}</Text>
        <Text style={styles.sectionSubtitle}>
          Acompanhe e atualize o status das cargas que você está levando.
        </Text>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => router.push("/transportador/novo-contrato")}
        >
          <Text style={styles.outlineButtonText}>+ Novo contrato</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listaContainer}>
        {erroLista && <Text style={styles.errorText}>{erroLista}</Text>}

        {loadingLista && transportes.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>
              Carregando seus transportes...
            </Text>
          </View>
        ) : transportes.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              Você ainda não possui serviços de transporte cadastrados.
            </Text>
          </View>
        ) : (
          <FlatList
            data={transportes}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => {
              const textoBotao = textoBotaoStatus(item.status);
              const podeMudar = !!textoBotao;

              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    Produtor: {item.produtor_nome}
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

                    {podeMudar && (
                      <TouchableOpacity
                        style={[
                          styles.statusButton,
                          atualizandoId === item.id && {
                            opacity: 0.7,
                          },
                        ]}
                        onPress={() => handleAtualizarStatus(item)}
                        disabled={atualizandoId === item.id}
                      >
                        {atualizandoId === item.id ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.statusButtonText}>
                            {textoBotao}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
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
    marginBottom: 8,
  },
  outlineButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#14532D",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  outlineButtonText: {
    color: "#14532D",
    fontSize: 13,
    fontWeight: "700",
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
    justifyContent: "space-between",
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
  statusButton: {
    backgroundColor: "#16A34A",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
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
