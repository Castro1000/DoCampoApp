import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function EditarLoteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [dataColheita, setDataColheita] = useState('');
  const [localProducao, setLocalProducao] = useState('');

  const [carregandoLote, setCarregandoLote] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // Modal de sucesso
  const [sucessoVisivel, setSucessoVisivel] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Voltar
  const handleVoltar = () => {
    // @ts-ignore
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/produtor/lotes');
    }
  };

  // Carrega dados do lote ao abrir a tela
  useEffect(() => {
    if (!id) return;

    const carregarLote = async () => {
      try {
        setCarregandoLote(true);
        setErro('');

        // 👉 Se sua rota de detalhe for diferente, ajuste aqui:
        const resp = await fetch(`${API_BASE_URL}/lotes/${id}`);
        const data = await resp.json();

        if (!resp.ok) {
          setErro(data.erro || 'Erro ao carregar dados do lote.');
          return;
        }

        setProduto(data.produto || '');
        setQuantidade(String(data.quantidade ?? ''));
        setDataColheita(data.data_colheita || '');
        setLocalProducao(data.local_producao || '');
      } catch (e) {
        console.error('Erro ao carregar lote:', e);
        setErro('Erro de conexão ao carregar lote.');
      } finally {
        setCarregandoLote(false);
      }
    };

    carregarLote();
  }, [id]);

  const handleSalvar = async () => {
    if (!id) return;

    setErro('');

    if (!produto || !quantidade) {
      setErro('Preencha produto e quantidade.');
      return;
    }

    try {
      setSalvando(true);

      const body = {
        produto,
        quantidade: Number(quantidade),
        data_colheita: dataColheita,
        local_producao: localProducao,
      };

      console.log('Enviando UPDATE do lote:', body);

      // 👉 Se sua rota de update for PATCH em vez de PUT, troque aqui:
      const resp = await fetch(`${API_BASE_URL}/lotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        // se não vier JSON, ignora
      }

      if (!resp.ok) {
        console.error('Erro ao atualizar lote:', data);
        setErro(data.erro || 'Erro ao salvar alterações do lote.');
        return;
      }

      // ✅ Sucesso: abre o modal
      setMensagemSucesso('As alterações do lote foram salvas com sucesso.');
      setSucessoVisivel(true);
    } catch (e) {
      console.error('Erro de conexão ao salvar lote:', e);
      setErro('Erro de conexão ao salvar o lote.');
    } finally {
      setSalvando(false);
    }
  };

  const fecharPopupSucesso = () => {
    setSucessoVisivel(false);
    // Volta para a lista de lotes
    router.replace('/produtor/lotes');
  };

  if (carregandoLote) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: '#4B6B50' }}>Carregando lote...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleVoltar}>
            <Text style={styles.voltarText}>{'< Voltar'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Editar lote</Text>
        <Text style={styles.subtitle}>
          Ajuste as informações do lote e salve as alterações.
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
          style={[styles.botaoPrincipal, salvando && styles.botaoDisabled]}
          onPress={handleSalvar}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.botaoPrincipalTexto}>Salvar alterações</Text>
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
            <Text style={styles.modalTitulo}>Lote atualizado</Text>
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
