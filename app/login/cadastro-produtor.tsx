// app/login/cadastro-produtor.tsx
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'https://docampo-backend-production.up.railway.app/api';

export default function CadastroProdutor() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  // modal de sucesso
  const [modalVisivel, setModalVisivel] = useState(false);
  const [modalMensagem, setModalMensagem] = useState('');

  // Só números no CPF/CNPJ, no máximo 14 dígitos
  const handleChangeCpfCnpj = (texto: string) => {
    const apenasDigitos = texto.replace(/\D/g, ''); // remove tudo que não for número
    if (apenasDigitos.length <= 14) {
      setCpfCnpj(apenasDigitos);
    }
  };

  // Normaliza e-mail (tira espaços e deixa minúsculo)
  const handleChangeEmail = (texto: string) => {
    setEmail(texto.trim().toLowerCase());
  };

  const handleCadastrar = async () => {
    setMensagem('');
    setErro('');

    if (!nome || !cpfCnpj || !email || !senha || !confirmarSenha) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    // valida CPF/CNPJ: só deixa seguir se tiver 11 ou 14 dígitos
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      setErro('Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }

    // valida e-mail (precisa ter formato algo@dominio.com)
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      setErro('Digite um e-mail válido (ex: nome@exemplo.com).');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem.');
      return;
    }

    setLoading(true);

    try {
      const body = {
        nome,
        email,
        senha,
        cpf: cpfCnpj,
        telefone,
        propriedade: '',
        cidade: '',
        estado: '',
      };

      const resp = await fetch(`${API_BASE_URL}/cadastro-produtor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        // se não vier JSON, ignora
      }

      if (!resp.ok) {
        setErro(
          data.erro ||
            data.message ||
            'Erro ao cadastrar produtor.'
        );
      } else {
        // limpa formulário
        setNome('');
        setCpfCnpj('');
        setEmail('');
        setTelefone('');
        setSenha('');
        setConfirmarSenha('');

        const msg =
          data.message || data.mensagem || 'Produtor cadastrado com sucesso.';

        setMensagem(msg);

        // abre modal de sucesso
        setModalMensagem(
          msg ||
            'Sua conta foi criada com sucesso. Agora você já pode fazer login.'
        );
        setModalVisivel(true);
      }
    } catch (e) {
      console.error(e);
      setErro('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const fecharModal = () => {
    setModalVisivel(false);
    // vai para a tela de login do produtor
    router.replace('/login/produtor');
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Voltar */}
        <View style={styles.headerRow}>
          <Link href="/login/produtor" asChild>
            <TouchableOpacity>
              <Text style={styles.voltarText}>{'< Voltar'}</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Text style={styles.title}>Criar conta de produtor</Text>
        <Text style={styles.subtitle}>
          Preencha seus dados para solicitar acesso ao sistema.
        </Text>

        {/* Nome completo */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome"
            placeholderTextColor="#8AA08E"
            value={nome}
            onChangeText={setNome}
          />
        </View>

        {/* CPF ou CNPJ */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>CPF ou CNPJ</Text>
          <TextInput
            style={styles.input}
            placeholder="Somente números"
            placeholderTextColor="#8AA08E"
            keyboardType="numeric"
            value={cpfCnpj}
            onChangeText={handleChangeCpfCnpj}
            maxLength={14} // 11 (CPF) ou 14 (CNPJ)
          />
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="email@exemplo.com"
            placeholderTextColor="#8AA08E"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={handleChangeEmail}
          />
        </View>

        {/* Telefone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Telefone (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="(00) 90000-0000"
            placeholderTextColor="#8AA08E"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
          />
        </View>

        {/* Senha */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#8AA08E"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />
        </View>

        {/* Confirmar senha */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirmar senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Repita sua senha"
            placeholderTextColor="#8AA08E"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />
        </View>

        {/* Botão cadastrar */}
        <TouchableOpacity
          style={[styles.botaoPrincipal, loading && styles.botaoDisabled]}
          onPress={handleCadastrar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.botaoPrincipalTexto}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        {/* Mensagens em texto (erro/sucesso simples) */}
        {mensagem ? (
          <Text style={styles.mensagemSucesso}>{mensagem}</Text>
        ) : null}
        {erro ? <Text style={styles.mensagemErro}>{erro}</Text> : null}
      </ScrollView>

      {/* MODAL DE SUCESSO */}
      <Modal
        transparent
        visible={modalVisivel}
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCaixa}>
            <Text style={styles.modalTitulo}>Conta criada</Text>
            <Text style={styles.modalMensagem}>{modalMensagem}</Text>

            <View style={styles.modalBotoesLinha}>
              <TouchableOpacity
                style={styles.modalBotaoConfirmar}
                onPress={fecharModal}
              >
                <Text style={styles.modalBotaoTexto}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    fontSize: 22,
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
    marginBottom: 18,
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
  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCaixa: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D5B2C',
    marginBottom: 8,
  },
  modalMensagem: {
    fontSize: 14,
    color: '#4B6B50',
    marginBottom: 16,
  },
  modalBotoesLinha: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBotaoConfirmar: {
    backgroundColor: '#186a2cff',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modalBotaoTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
