// app/login/produtor.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginProdutor() {
  const router = useRouter();

  const [login, setLogin] = useState(''); // CPF ou CNPJ
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setMensagem('');
    setErro('');

    if (!login || !senha) {
      setErro('Preencha login e senha.');
      return;
    }

    setLoading(true);

    try {
      const resp = await fetch('http://localhost:3001/api/login-produtor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // backend espera { cpf, senha }
        body: JSON.stringify({ cpf: login, senha }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setErro(data.erro || 'Falha no login.');
      } else {
        // Salvar dados do produtor no AsyncStorage (chaves antigas, para não quebrar nada)
        await AsyncStorage.setItem('@produtor_id', String(data.usuario.id));
        await AsyncStorage.setItem('@produtor_nome', data.usuario.nome);

        // >>> NOVO: salvar também no formato unificado @docampo_usuario
        const payload = {
          tipo: 'produtor',
          id: data.usuario.id,
          nome: data.usuario.nome,
          cpf: data.usuario.cpf, // usado na tela de transportes
        };

        await AsyncStorage.setItem('@docampo_usuario', JSON.stringify(payload));
        // <<< FIM DO NOVO TRECHO

        setMensagem('Login realizado com sucesso!');

        // Redirecionar para a Home do produtor
        router.replace('/produtor');
      }
    } catch (e) {
      console.error(e);
      setErro('Erro de conexão com o servidor.');
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
            <Text style={styles.voltarText}>{'< Voltar'}</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Text style={styles.title}>Produtor Rural</Text>
      <Text style={styles.subtitle}>
        Acesse sua conta para cadastrar lotes e gerar QR Codes.
      </Text>

      {/* Login */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Login (CPF ou CNPJ)</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu CPF ou CNPJ"
          placeholderTextColor="#8AA08E"
          keyboardType="numeric"
          value={login}
          onChangeText={setLogin}
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
              {mostrarSenha ? 'Ocultar' : 'Mostrar'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <Text style={styles.linkTextoPequeno}>Esqueceu a senha?</Text>
        </TouchableOpacity>
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

      {/* Criar conta */}
      <View style={styles.footerCadastro}>
        <Text style={styles.textoSimples}>Ainda não tem conta? </Text>
        <Link href="/login/cadastro-produtor" asChild>
          <TouchableOpacity>
            <Text style={styles.linkNegrito}>Criar conta</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#E9F7EC',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: 16,
  },
  voltarText: {
    color: '#1D5B2C',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D5B2C',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B6B50',
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#26402A',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#C8D9CB',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mostrarBtn: {
    marginLeft: 8,
  },
  mostrarText: {
    color: '#1D5B2C',
    fontWeight: '600',
  },
  linkTextoPequeno: {
    marginTop: 6,
    fontSize: 12,
    color: '#1D5B2C',
    textDecorationLine: 'underline',
  },
  botaoPrincipal: {
    backgroundColor: '#1D5B2C',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoDisabled: {
    opacity: 0.7,
  },
  botaoPrincipalTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  mensagemSucesso: {
    marginTop: 12,
    color: '#166534',
    fontSize: 14,
  },
  mensagemErro: {
    marginTop: 12,
    color: '#B91C1C',
    fontSize: 14,
  },
  footerCadastro: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  textoSimples: {
    fontSize: 14,
    color: '#26402A',
  },
  linkNegrito: {
    fontSize: 14,
    color: '#1D5B2C',
    fontWeight: '700',
  },
});
