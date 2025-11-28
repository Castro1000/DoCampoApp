// app/login/admin.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "http://localhost:3001/api";

export default function LoginAdmin() {
  const router = useRouter();

  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setMensagem("");
    setErro("");

    if (!cpf || !senha) {
      setErro("Preencha CPF e senha.");
      return;
    }

    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/login-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cpf, senha }),
      });

      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        data = {};
      }

      if (!resp.ok || !data.sucesso) {
        setErro(data.erro || "Falha no login do administrador.");
      } else {
        // Salvar admin no AsyncStorage (formato unificado)
        const usuario = data.usuario;

        await AsyncStorage.setItem(
          "@docampo_usuario",
          JSON.stringify({
            tipo: "admin",
            id: usuario.id,
            nome: usuario.nome,
            cpf: usuario.cpf,
          })
        );

        // (Opcional) manter chaves específicas, se quiser usar depois
        await AsyncStorage.setItem("@admin_id", String(usuario.id));
        await AsyncStorage.setItem("@admin_nome", usuario.nome);

        setMensagem("Login realizado com sucesso!");

        // Redirecionar para o painel do administrador
        router.replace("/admin");
      }
    } catch (e) {
      console.error(e);
      setErro("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Voltar */}
      <View style={styles.headerRow}>
        <Link href=".." asChild>
          <TouchableOpacity>
            <Text style={styles.voltarText}>{"< Voltar"}</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Text style={styles.title}>Administrador</Text>
      <Text style={styles.subtitle}>
        Acesse o painel para acompanhar usuários, lotes e transportes.
      </Text>

      {/* CPF */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>CPF</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu CPF"
          placeholderTextColor="#8AA08E"
          keyboardType="numeric"
          value={cpf}
          onChangeText={setCpf}
        />
      </View>

      {/* Senha */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Senha</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Digite sua senha"
            placeholderTextColor="#8AA08E"
            secureTextEntry={!mostrarSenha}
            value={senha}
            onChangeText={setSenha}
          />
          <TouchableOpacity
            style={styles.mostrarBtn}
            onPress={() => setMostrarSenha((prev) => !prev)}
          >
            <Text style={styles.mostrarText}>
              {mostrarSenha ? "Ocultar" : "Mostrar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botão Entrar */}
      <TouchableOpacity
        style={[styles.botaoPrincipal, loading && styles.botaoDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.botaoPrincipalTexto}>Entrar</Text>
        )}
      </TouchableOpacity>

      {/* Mensagens */}
      {mensagem ? <Text style={styles.mensagemSucesso}>{mensagem}</Text> : null}
      {erro ? <Text style={styles.mensagemErro}>{erro}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#E9F7EC",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: 16,
  },
  voltarText: {
    color: "#1D5B2C",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1D5B2C",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#4B6B50",
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#26402A",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1D1D1D",
    borderWidth: 1,
    borderColor: "#C8D9CB",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mostrarBtn: {
    marginLeft: 8,
  },
  mostrarText: {
    color: "#1D5B2C",
    fontWeight: "600",
  },
  botaoPrincipal: {
    backgroundColor: "#1D5B2C",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  botaoDisabled: {
    opacity: 0.7,
  },
  botaoPrincipalTexto: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  mensagemSucesso: {
    marginTop: 12,
    color: "#166534",
    fontSize: 14,
  },
  mensagemErro: {
    marginTop: 12,
    color: "#B91C1C",
    fontSize: 14,
  },
});
