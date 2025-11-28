// app/produtor/novo-lote.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
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

export default function NovoLote() {
  const router = useRouter();
  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [dataColheita, setDataColheita] = useState('');
  const [localProducao, setLocalProducao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const [sucessoVisivel, setSucessoVisivel] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const irParaTelaLotes = () => {
    router.replace('/produtor/lotes');
  };

  const handleVoltar = () => {
    // @ts-ignore
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      irParaTelaLotes();
    }
  };

  const handleSalvar = async () => {
    console.log('👉 handleSalvar chamado');
    setErro('');

    if (!produto || !quantidade) {
      setErro('Preencha produto e quantidade.');
      return;
    }

    try {
      setLoading(true);

      const produtorIdStr = await AsyncStorage.getItem('@produtor_id');
      console.log('produtorIdStr', produtorIdStr);

      if (!produtorIdStr) {
        setErro('Produtor não encontrado. Faça login novamente.');
        router.replace('/login/produtor');
        return;
      }

      const body = {
        produtor_id: Number(produtorIdStr),
        produto,
        quantidade: Number(quantidade),
        data_colheita: dataColheita,
        local_producao: localProducao,
      };

      console.log('Enviando POST /api/lotes com body:', body);

      const resp = await fetch('http://localhost:3001/api/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('Status resposta:', resp.status);

      let data: any = {};
      try {
        data = await resp.json();
        console.log('Resposta JSON:', data);
      } catch (e) {
        console.log('Não conseguiu fazer resp.json()', e);
      }

      if (!resp.ok) {
        const msg = data.erro || 'Erro ao cadastrar lote.';
        setErro(msg);
      } else {
        // limpa campos
        setProduto('');
        setQuantidade('');
        setDataColheita('');
        setLocalProducao('');

        // abre popup de sucesso
        setMensagemSucesso('Seu lote foi cadastrado com sucesso.');
        setSucessoVisivel(true);
      }
    } catch (e) {
      console.error('Erro no handleSalvar:', e);
      setErro('Erro de conexão ao salvar o lote.');
    } finally {
      setLoading(false);
    }
  };

  const fecharPopupSucesso = () => {
    setSucessoVisivel(false);
    irParaTelaLotes();
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleVoltar}>
            <Text style={styles.voltarText}>{'< Voltar'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Novo lote</Text>
        <Text style={styles.subtitle}>
          Cadastre um novo lote para rastrear sua produção.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Produto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Tomate orgânico"
            value={produto}
            onChangeText={setProduto}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 100"
            keyboardType="numeric"
            value={quantidade}
            onChangeText={setQuantidade}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Data de colheita</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 10/10/2025"
            value={dataColheita}
            onChangeText={setDataColheita}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Local de produção</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Sítio Boa Esperança"
            value={localProducao}
            onChangeText={setLocalProducao}
          />
        </View>

        <TouchableOpacity
          style={[styles.botaoPrincipal, loading && styles.botaoDisabled]}
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.botaoPrincipalTexto}>Salvar lote</Text>
          )}
        </TouchableOpacity>

        {erro ? <Text style={styles.mensagemErro}>{erro}</Text> : null}
      </ScrollView>

      {/* MODAL DE SUCESSO */}
      <Modal
        transparent
        visible={sucessoVisivel}
        animationType="fade"
        onRequestClose={fecharPopupSucesso}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCaixa}>
            <Text style={styles.modalTitulo}>Lote cadastrado</Text>
            <Text style={styles.modalMensagem}>{mensagemSucesso}</Text>

            <View style={styles.modalBotoesLinha}>
              <TouchableOpacity
                style={styles.modalBotaoConfirmar}
                onPress={fecharPopupSucesso}
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
    paddingTop: 40,
    paddingBottom: 32,
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
    backgroundColor: '#1D5B2C',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modalBotaoTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
