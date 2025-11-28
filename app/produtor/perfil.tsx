// app/produtor/perfil.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type ProdutorPerfil = {
  nome: string;
  email: string;
  telefone: string;
  documento: string; // CPF ou CNPJ
  senha: string;
};

export default function PerfilProdutorScreen() {
  const router = useRouter();
  const [dados, setDados] = useState<ProdutorPerfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  // estados de edição
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [emailEdicao, setEmailEdicao] = useState('');
  const [telefoneEdicao, setTelefoneEdicao] = useState('');
  const [senhaEdicao, setSenhaEdicao] = useState('');

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);

      const nome = (await AsyncStorage.getItem('@produtor_nome')) || '';
      const email = (await AsyncStorage.getItem('@produtor_email')) || '';
      const telefone =
        (await AsyncStorage.getItem('@produtor_telefone')) || '';
      const documento =
        (await AsyncStorage.getItem('@produtor_documento')) || '';
      const senha =
        (await AsyncStorage.getItem('@produtor_senha')) || '';

      const perfil: ProdutorPerfil = {
        nome,
        email,
        telefone,
        documento,
        senha,
      };

      setDados(perfil);

      // já deixa os campos de edição preenchidos
      setEmailEdicao(email);
      setTelefoneEdicao(telefone);
      setSenhaEdicao(senha);
    } catch (e) {
      console.log('Erro ao carregar dados do perfil:', e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const handleSair = async () => {
    await AsyncStorage.removeItem('@produtor_id');
    await AsyncStorage.removeItem('@produtor_nome');
    await AsyncStorage.removeItem('@produtor_email');
    await AsyncStorage.removeItem('@produtor_telefone');
    await AsyncStorage.removeItem('@produtor_documento');
    await AsyncStorage.removeItem('@produtor_senha');
    router.replace('/login/produtor');
  };

  const getValor = (valor: string) =>
    valor && valor.trim().length > 0 ? valor : 'Não informado';

  const inicial =
    dados?.nome && dados.nome.trim().length > 0
      ? dados.nome.trim().charAt(0).toUpperCase()
      : 'P';

  const iniciarEdicao = () => {
    if (!dados) return;
    setEmailEdicao(dados.email || '');
    setTelefoneEdicao(dados.telefone || '');
    setSenhaEdicao(dados.senha || '');
    setEditando(true);
  };

  const cancelarEdicao = () => {
    if (dados) {
      setEmailEdicao(dados.email || '');
      setTelefoneEdicao(dados.telefone || '');
      setSenhaEdicao(dados.senha || '');
    }
    setEditando(false);
  };

  const salvarEdicao = async () => {
    if (!dados) return;
    try {
      setSalvando(true);

      await AsyncStorage.setItem('@produtor_email', emailEdicao);
      await AsyncStorage.setItem('@produtor_telefone', telefoneEdicao);
      await AsyncStorage.setItem('@produtor_senha', senhaEdicao);

      setDados({
        ...dados,
        email: emailEdicao,
        telefone: telefoneEdicao,
        senha: senhaEdicao,
      });

      setEditando(false);
    } catch (e) {
      console.log('Erro ao salvar edição do perfil:', e);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitulo}>Perfil</Text>
          </View>
          <View style={styles.center}>
            <ActivityIndicator color="#1D5B2C" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>Perfil do Produtor</Text>
        </View>

        {/* CARD PRINCIPAL */}
        <View style={styles.card}>
          {/* Avatar + nome */}
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{inicial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nomeProdutor}>
                {getValor(dados?.nome || '')}
              </Text>
              <Text style={styles.tipoPerfil}>Produtor rural</Text>
            </View>
          </View>

          {/* E-MAIL */}
          <View style={styles.linha}>
            <Text style={styles.linhaLabel}>E-mail</Text>
            {editando ? (
              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                value={emailEdicao}
                onChangeText={setEmailEdicao}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.linhaValor}>
                {getValor(dados?.email || '')}
              </Text>
            )}
          </View>

          {/* TELEFONE */}
          <View style={styles.linha}>
            <Text style={styles.linhaLabel}>Telefone</Text>
            {editando ? (
              <TextInput
                style={styles.input}
                placeholder="Digite seu telefone"
                value={telefoneEdicao}
                onChangeText={setTelefoneEdicao}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.linhaValor}>
                {getValor(dados?.telefone || '')}
              </Text>
            )}
          </View>

          {/* CPF/CNPJ */}
          <View style={styles.linha}>
            <Text style={styles.linhaLabel}>CPF/CNPJ</Text>
            <Text style={styles.linhaValor}>
              {getValor(dados?.documento || '')}
            </Text>
          </View>

          {/* SENHA */}
          <View style={styles.linha}>
            <Text style={styles.linhaLabel}>Senha</Text>
            {editando ? (
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                value={senhaEdicao}
                onChangeText={setSenhaEdicao}
                secureTextEntry
              />
            ) : (
              <Text style={styles.linhaValor}>
                {getValor(dados?.senha || '')}
              </Text>
            )}
          </View>
        </View>

        {/* BOTÕES */}
        <View style={styles.botoesBloco}>
          <TouchableOpacity
            style={[
              styles.btnPrincipal,
              editando && styles.btnPrincipalEditando,
            ]}
            onPress={editando ? salvarEdicao : iniciarEdicao}
            disabled={salvando}
          >
            <Text style={styles.btnPrincipalTexto}>
              {editando ? (salvando ? 'Salvando...' : 'Salvar alterações') : 'Editar dados'}
            </Text>
          </TouchableOpacity>

          {editando && (
            <TouchableOpacity
              style={styles.btnCancelar}
              onPress={cancelarEdicao}
              disabled={salvando}
            >
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btnSair} onPress={handleSair}>
            <Text style={styles.btnSairTexto}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const GREEN = '#1D5B2C';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E9F7EC',
  },
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  headerTitulo: {
    fontSize: 20,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8D9CB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  nomeProdutor: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
  tipoPerfil: {
    fontSize: 13,
    color: '#4B6B50',
    marginTop: 2,
  },

  linha: {
    marginTop: 10,
  },
  linhaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  linhaValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    color: '#111827',
  },

  botoesBloco: {
    marginTop: 24,
    gap: 10,
  },
  btnPrincipal: {
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GREEN,
    backgroundColor: '#E5F3EA',
    alignItems: 'center',
  },
  btnPrincipalEditando: {
    backgroundColor: GREEN,
  },
  btnPrincipalTexto: {
    color: GREEN,
    fontWeight: '700',
    fontSize: 14,
  },
  btnCancelar: {
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  btnCancelarTexto: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSair: {
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
  },
  btnSairTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
