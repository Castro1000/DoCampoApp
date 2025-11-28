// app/login/transportador.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "http://docampo-backend-production.up.railway.app/api";

export default function LoginTransportadorScreen() {
  const router = useRouter();

  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const [mensagem, setMensagem] = useState<string | null>(null);
  const [mensagemTipo, setMensagemTipo] = useState<"erro" | "info" | null>(
    null
  );

  async function handleLogin() {
    const cpfLimpo = cpf.trim();

    if (!cpfLimpo || !senha) {
      setMensagemTipo("erro");
      setMensagem("Informe CPF e senha.");
      return;
    }

    try {
      setLoading(true);
      setMensagem(null);

      const response = await fetch(`${API_BASE_URL}/login-transportador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpfLimpo, senha }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || !data.sucesso) {
        const msg: string =
          data?.erro || data?.message || "Credenciais inválidas.";
        setMensagemTipo("erro");
        setMensagem(msg);
        return;
      }

      // salva usuário/logado no AsyncStorage
      const usuario = data.usuario;
      const payload = {
        tipo: "transportador",
        id: usuario.id,
        nome: usuario.nome,
        cpf: usuario.cpf,
      };

      await AsyncStorage.setItem("@docampo_usuario", JSON.stringify(payload));

      setMensagemTipo("info");
      setMensagem("Login realizado com sucesso. Redirecionando...");

      // vai para o painel do transportador
      router.replace("/transportador");
    } catch (error: any) {
      console.error(error);
      setMensagemTipo("erro");
      setMensagem(
        error?.message || "Não foi possível conectar ao servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleIrCadastro() {
    router.push("/cadastro/transportador");
  }

  function handleVoltarHome() {
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.appName}>DoCampo</Text>
        <Text style={styles.subtitle}>Login do Transportador</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acesse sua conta</Text>

        {mensagem && (
          <View
            style={[
              styles.messageBox,
              mensagemTipo === "erro"
                ? styles.messageError
                : styles.messageInfo,
            ]}
          >
            <Text style={styles.messageText}>{mensagem}</Text>
          </View>
        )}

        <Text style={styles.label}>CPF</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu CPF"
          placeholderTextColor="#9CA3AF"
          value={cpf}
          onChangeText={setCpf}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleIrCadastro}>
          <Text style={styles.linkText}>Não tenho conta • Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleVoltarHome}>
          <Text style={styles.linkText}>Voltar para a tela inicial</Text>
        </TouchableOpacity>
      </View>
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
  messageBox: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  messageError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
  },
  messageInfo: {
    backgroundColor: "#DBEAFE",
    borderColor: "#93C5FD",
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    color: "#111827",
  },
});
