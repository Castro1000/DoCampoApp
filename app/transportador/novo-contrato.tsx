// app/transportador/novo-contrato.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "https://docampo-backend-production.up.railway.app/api";

type ModalType = "erro" | "sucesso";

interface UsuarioLogado {
  tipo: string;
  id: number;
  nome: string;
  cpf: string;
}

export default function NovoContratoTransportadorScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);

  const [cpfProdutor, setCpfProdutor] = useState("");
  const [destino, setDestino] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  // modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitulo, setModalTitulo] = useState("");
  const [modalMensagem, setModalMensagem] = useState("");
  const [modalTipo, setModalTipo] = useState<ModalType>("erro");

  function abrirModal(titulo: string, mensagem: string, tipo: ModalType) {
    setModalTitulo(titulo);
    setModalMensagem(mensagem);
    setModalTipo(tipo);
    setModalVisible(true);
  }

  function fecharModal() {
    setModalVisible(false);
  }

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

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function handleCriarContrato() {
    if (!usuario) {
      abrirModal(
        "Não autenticado",
        "Faça login novamente como transportador.",
        "erro"
      );
      return;
    }

    const cpf = cpfProdutor.trim();
    const dest = destino.trim();
    const desc = descricao.trim();

    if (!cpf || !dest) {
      abrirModal(
        "Atenção",
        "CPF do produtor e destino são obrigatórios.",
        "erro"
      );
      return;
    }

    try {
      setLoading(true);

      const resp = await fetch(`${API_BASE_URL}/transportes/novo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transportador_id: usuario.id,
          cpf_produtor: cpf,
          destino: dest,
          descricao: desc,
        }),
      });

      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        data = {};
      }

      console.log(">>> RESPOSTA /transportes/novo:", data);

      if (!resp.ok || !data.sucesso) {
        const msg: string =
          data?.erro ||
          data?.message ||
          "Não foi possível criar o contrato de transporte.";
        abrirModal("Erro ao criar contrato", msg, "erro");
        return;
      }

      abrirModal(
        "Contrato criado",
        "Você iniciou um transporte para este produtor. Agora ele aparecerá no seu painel.",
        "sucesso"
      );
    } catch (err: any) {
      console.error(err);
      abrirModal(
        "Erro de conexão",
        err?.message || "Não foi possível conectar ao servidor.",
        "erro"
      );
    } finally {
      setLoading(false);
    }
  }

  function voltarParaPainel() {
    fecharModal();
    router.replace("/transportador");
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.appName}>DoCampo</Text>
        <Text style={styles.subtitle}>Novo contrato de transporte</Text>
        <Text style={styles.userName}>Transportador: {usuario.nome}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Iniciar um serviço para um agricultor
        </Text>

        <Text style={styles.label}>
          CPF do produtor <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Digite o CPF do produtor"
          placeholderTextColor="#9CA3AF"
          value={cpfProdutor}
          onChangeText={setCpfProdutor}
          keyboardType="numeric"
        />

        <Text style={styles.label}>
          Destino da carga <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Feira do Produtor, Mercado Municipal..."
          placeholderTextColor="#9CA3AF"
          value={destino}
          onChangeText={setDestino}
        />

        <Text style={styles.label}>Descrição dos alimentos</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Ex: 10 caixas de tomate, 5 sacas de mandioca, 3 caixas de cheiro-verde..."
          placeholderTextColor="#9CA3AF"
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCriarContrato}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Criar contrato</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.back()}
        >
          <Text style={styles.linkText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View className="modalContainer" style={styles.modalContainer}>
            <Text
              style={[
                styles.modalTitle,
                modalTipo === "erro" && { color: "#B91C1C" },
                modalTipo === "sucesso" && { color: "#166534" },
              ]}
            >
              {modalTitulo}
            </Text>

            <Text style={styles.modalMessage}>{modalMensagem}</Text>

            <View style={styles.modalButtonsRow}>
              {modalTipo === "sucesso" ? (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={voltarParaPainel}
                >
                  <Text style={styles.modalButtonPrimaryText}>
                    Ir para o painel
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={fecharModal}
                >
                  <Text style={styles.modalButtonPrimaryText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullCenter: {
    flex: 1,
    backgroundColor: "#F0FFF4",
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
    marginBottom: 12,
  },
  container: {
    flex: 1,
    backgroundColor: "#F0FFF4",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#14532D",
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
  },
  userName: {
    marginTop: 4,
    fontSize: 13,
    color: "#14532D",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#00000022",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14532D",
    marginBottom: 12,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
    marginBottom: 4,
  },
  required: {
    color: "#DC2626",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  inputMultiline: {
    textAlignVertical: "top",
  },
  button: {
    marginTop: 18,
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  linkButton: {
    marginTop: 10,
    alignItems: "center",
  },
  linkText: {
    fontSize: 13,
    color: "#14532D",
    textDecorationLine: "underline",
    textAlign: "center",
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    shadowColor: "#00000055",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    color: "#111827",
  },
  modalMessage: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    marginBottom: 18,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    minWidth: 140,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#16A34A",
  },
  modalButtonPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
