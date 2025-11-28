// app/produtor/lotes.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Lote = {
  id: number;
  produto: string;
  quantidade: number;
  data_colheita: string;
  local_producao: string | null;
};

export default function TelaLotes() {
  const router = useRouter();
  const [produtorId, setProdutorId] = useState<number | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');

  // modal de exclusão
  const [modalExcluirVisivel, setModalExcluirVisivel] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<Lote | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregarLotes = async (id: number) => {
    try {
      setErro('');
      const resp = await fetch(
        `https://docampo-backend-production.up.railway.app/api/lotes/produtor/${id}`
      );
      const data = await resp.json();

      if (!resp.ok) {
        setErro(data.erro || 'Erro ao carregar lotes.');
        setLotes([]);
      } else {
        setLotes(data);
      }
    } catch (e) {
      console.error(e);
      setErro('Erro de conexão ao carregar lotes.');
      setLotes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const init = async () => {
        setLoading(true);
        try {
          const idStr = await AsyncStorage.getItem('@produtor_id');
          if (!idStr) {
            router.replace('/login/produtor');
            return;
          }
          const idNum = Number(idStr);
          if (ativo) {
            setProdutorId(idNum);
            await carregarLotes(idNum);
          }
        } catch (e) {
          console.error(e);
          setErro('Erro ao recuperar dados do produtor.');
        }
      };

      init();

      return () => {
        ativo = false;
      };
    }, [router])
  );

  const onRefresh = () => {
    if (!produtorId) return;
    setRefreshing(true);
    carregarLotes(produtorId);
  };

  const handleNovoLote = () => {
    router.push('/produtor/novo-lote');
  };

  const handleDetalhes = (id: number) => {
    router.push(`/produtor/detalhes/${id}`);
  };

  const handleEditar = (id: number) => {
    router.push(`/produtor/editar-lote/${id}`);
  };

  // abrir modal de confirmação de exclusão
  const abrirModalExcluir = (lote: Lote) => {
    setLoteSelecionado(lote);
    setModalExcluirVisivel(true);
  };

  const fecharModalExcluir = () => {
    if (excluindo) return;
    setModalExcluirVisivel(false);
    setLoteSelecionado(null);
  };

  const confirmarExcluir = async () => {
    if (!loteSelecionado) return;
    if (!produtorId) return;

    try {
      setExcluindo(true);
      const resp = await fetch(
        `https://docampo-backend-production.up.railway.app/api/lotes/${loteSelecionado.id}`,
        { method: 'DELETE' }
      );
      const data = await resp.json();

      if (!resp.ok) {
        console.error('Erro ao excluir lote:', data);
      } else {
        await carregarLotes(produtorId);
      }
    } catch (e) {
      console.error('Erro de conexão ao excluir lote:', e);
    } finally {
      setExcluindo(false);
      setModalExcluirVisivel(false);
      setLoteSelecionado(null);
    }
  };

  const handleVoltar = () => {
    // @ts-ignore
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/produtor');
    }
  };

  const renderLote = ({ item }: { item: Lote }) => (
    <View style={styles.cardLote}>
      <TouchableOpacity onPress={() => handleDetalhes(item.id)}>
        <Text style={styles.cardTitulo}>{item.produto}</Text>
        <Text style={styles.cardLinha}>
          Quantidade:{' '}
          <Text style={styles.cardValor}>{item.quantidade} un.</Text>
        </Text>
        <Text style={styles.cardLinha}>
          Colheita:{' '}
          <Text style={styles.cardValor}>
            {item.data_colheita || '-'}
          </Text>
        </Text>
        <Text style={styles.cardLinha}>
          Local:{' '}
          <Text style={styles.cardValor}>
            {item.local_producao || 'Não informado'}
          </Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.cardAcoes}>
        <TouchableOpacity
          style={[styles.acaoBotao, styles.acaoEditar]}
          onPress={() => handleEditar(item.id)}
        >
          <Text style={styles.acaoTexto}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acaoBotao, styles.acaoExcluir]}
          onPress={() => abrirModalExcluir(item)}
        >
          <Text style={styles.acaoTexto}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.root}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleVoltar}>
            <Text style={styles.voltar}>{'< Voltar'}</Text>
          </TouchableOpacity>
          <Text style={styles.topTitulo}>Meus lotes</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Conteúdo */}
        <View style={styles.container}>
          <View style={styles.headerLista}>
            <Text style={styles.subtitulo}>
              Cadastre, edite ou exclua seus lotes.
            </Text>
            <TouchableOpacity
              style={styles.btnNovo}
              onPress={handleNovoLote}
            >
              <Text style={styles.btnNovoTexto}>+ Novo lote</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          ) : (
            <>
              {erro ? (
                <Text style={styles.mensagemErro}>{erro}</Text>
              ) : null}

              {lotes.length === 0 && !erro ? (
                <View style={styles.center}>
                  <Text style={styles.semLotes}>
                    Você ainda não cadastrou nenhum lote.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={lotes}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderLote}
                  contentContainerStyle={styles.lista}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                />
              )}
            </>
          )}
        </View>
      </View>

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      <Modal
        transparent
        visible={modalExcluirVisivel}
        animationType="fade"
        onRequestClose={fecharModalExcluir}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCaixa}>
            <Text style={styles.modalTitulo}>Excluir lote</Text>
            <Text style={styles.modalMensagem}>
              Tem certeza que deseja excluir o lote{' '}
              <Text style={{ fontWeight: '700' }}>
                {loteSelecionado?.produto}
              </Text>
              ?
            </Text>

            <View style={styles.modalBotoesLinha}>
              <TouchableOpacity
                style={styles.modalBotaoCancelar}
                onPress={fecharModalExcluir}
                disabled={excluindo}
              >
                <Text style={styles.modalBotaoTextoCancelar}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBotaoExcluir}
                onPress={confirmarExcluir}
                disabled={excluindo}
              >
                <Text style={styles.modalBotaoTextoExcluir}>
                  {excluindo ? 'Excluindo...' : 'Excluir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E9F7EC',
  },
  topBar: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voltar: {
    color: '#1D5B2C',
    fontSize: 14,
    fontWeight: '600',
  },
  topTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D5B2C',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  subtitulo: {
    flex: 1,
    marginRight: 8,
    fontSize: 13,
    color: '#4B6B50',
  },
  btnNovo: {
    backgroundColor: '#1D5B2C',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnNovoTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  lista: {
    paddingBottom: 16,
  },
  cardLote: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C8D9CB',
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D5B2C',
    marginBottom: 4,
  },
  cardLinha: {
    fontSize: 12,
    color: '#4B6B50',
  },
  cardValor: {
    fontWeight: '600',
    color: '#1D5B2C',
  },
  cardAcoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  acaoBotao: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 8,
  },
  acaoEditar: {
    backgroundColor: '#D1FAE5',
  },
  acaoExcluir: {
    backgroundColor: '#FEE2E2',
  },
  acaoTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D5B2C',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  mensagemErro: {
    marginBottom: 8,
    color: '#B91C1C',
  },
  semLotes: {
    color: '#4B6B50',
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
  modalBotaoCancelar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: '#E5E7EB',
  },
  modalBotaoExcluir: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#B91C1C',
  },
  modalBotaoTextoCancelar: {
    color: '#111827',
    fontWeight: '600',
  },
  modalBotaoTextoExcluir: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
