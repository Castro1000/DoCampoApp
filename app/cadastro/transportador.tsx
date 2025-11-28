import { useRouter } from "expo-router";
import React, { useState } from "react";
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

type ModalType = "erro" | "sucesso" | "confirmacao";

export default function CadastroTransportadorScreen() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  // estado do modal custom
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitulo, setModalTitulo] = useState("");
  const [modalMensagem, setModalMensagem] = useState("");
  const [modalTipo, setModalTipo] = useState<ModalType>("erro");
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | null>(
    null
  );

  function abrirModal(
    titulo: string,
    mensagem: string,
    tipo: ModalType,
    onConfirm?: () => void
  ) {
    setModalTitulo(titulo);
    setModalMensagem(mensagem);
    setModalTipo(tipo);
    setModalOnConfirm(onConfirm || null);
    setModalVisible(true);
  }

  function fecharModal() {
    setModalVisible(false);
  }

  async function executarCadastro(nomeLimpo: string, cpfLimpo: string) {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/cadastro-transportador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeLimpo,
          cpf: cpfLimpo,
          telefone,
          senha,
        }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log(">>> RESPOSTA BACKEND:", data);

      // 1) Se backend mandou "erro"
      if (data && data.erro) {
        const msg = String(
          data.erro || "Erro ao cadastrar transportador."
        );

        if (msg.toLowerCase().includes("cpf já cadastrado")) {
          abrirModal(
            "CPF já cadastrado",
            "Já existe um transportador cadastrado com esse CPF. Tente fazer login.",
            "erro"
          );
        } else {
          abrirModal("Erro ao cadastrar", msg, "erro");
        }
        return;
      }

      // 2) Se veio sucesso:true
      if (data && data.sucesso) {
        abrirModal(
          "Cadastro realizado",
          "Transportador cadastrado com sucesso!",
          "sucesso",
          () => {
            router.replace("/login/transportador");
          }
        );
        return;
      }

      // 3) Se HTTP não é ok e não veio erro/sucesso claro
      if (!response.ok) {
        abrirModal(
          "Erro ao cadastrar",
          "Não foi possível concluir o cadastro. Código HTTP: " +
            response.status,
          "erro"
        );
        return;
      }

      // 4) Fallback: HTTP ok, mas sem campos esperados
      abrirModal(
        "Cadastro realizado",
        "Transportador cadastrado (resposta sem campo 'sucesso').",
        "sucesso",
        () => {
          router.replace("/login/transportador");
        }
      );
    } catch (error: any) {
      console.error(">>> ERRO DE CONEXÃO:", error);
      abrirModal(
        "Erro de conexão",
        error?.message || "Não foi possível conectar ao servidor.",
        "erro"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCadastrar() {
    console.log(">>> handleCadastrar CHAMADO");

    const nomeLimpo = nome.trim();
    const cpfLimpo = cpf.trim();

    if (!nomeLimpo || !cpfLimpo || !senha || !confirmarSenha) {
      abrirModal(
        "Atenção",
        "Preencha todos os campos obrigatórios (*).",
        "erro"
      );
      return;
    }

    if (senha !== confirmarSenha) {
      abrirModal("Atenção", "As senhas não conferem.", "erro");
      return;
    }

    // modal de confirmação
    abrirModal(
      "Confirmar cadastro",
      "Deseja realmente cadastrar este transportador?",
      "confirmacao",
      () => {
        fecharModal();
        executarCadastro(nomeLimpo, cpfLimpo);
      }
    );
  }

  function handleVoltar() {
    router.replace("/login/transportador");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.appName}>DoCampo</Text>
        <Text style={styles.subtitle}>Cadastro de Transportador</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Criar conta de transportador</Text>

        <Text style={styles.label}>
          Nome completo <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: João da Silva Transportes"
          placeholderTextColor="#9CA3AF"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>
          CPF <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu CPF"
          placeholderTextColor="#9CA3AF"
          value={cpf}
          onChangeText={setCpf}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Telefone (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="(92) 99999-9999"
          placeholderTextColor="#9CA3AF"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>
          Senha <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Crie uma senha"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <Text style={styles.label}>
          Confirmar senha <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Repita a senha"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCadastrar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleVoltar}>
          <Text style={styles.linkText}>Voltar para o login</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        DoCampo • Cadastro simples para quem transporta o campo.
      </Text>

      {/* MODAL CUSTOM */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text
              style={[
                styles.modalTitle,
                modalTipo === "erro" && { color: "#B91C1C" },
                modalTipo === "sucesso" && { color: "#166534" },
                modalTipo === "confirmacao" && { color: "#14532D" },
              ]}
            >
              {modalTitulo}
            </Text>

            <Text style={styles.modalMessage}>{modalMensagem}</Text>

            <View style={styles.modalButtonsRow}>
              {modalTipo === "confirmacao" ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={fecharModal}
                  >
                    <Text style={styles.modalButtonSecondaryText}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={() => {
                      const fn = modalOnConfirm;
                      if (fn) fn();
                    }}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Confirmar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    const fn = modalOnConfirm;
                    fecharModal();
                    if (fn) fn();
                  }}
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
    fontSize: 26,
    fontWeight: "800",
    color: "#14532D",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#4B5563",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: "#00000022",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#14532D",
    marginBottom: 16,
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
  footer: {
    marginTop: "auto",
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
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
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    minWidth: 100,
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
  modalButtonSecondary: {
    backgroundColor: "#E5E7EB",
  },
  modalButtonSecondaryText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 14,
  },
});
