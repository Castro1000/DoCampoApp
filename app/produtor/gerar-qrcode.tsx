// app/produtor/gerar-qrcode.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type Lote = {
  id: number;
  produto: string;
  quantidade: number;
  data_colheita: string;
  local_producao: string | null;
};

const STORAGE_QR_GERADOS = '@qr_lotes_gerados';

export default function GerarQRCodeLote() {
  const router = useRouter();
  const [produtorId, setProdutorId] = useState<number | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [loteSelecionado, setLoteSelecionado] = useState<Lote | null>(null);

  // ids de lotes que já tiveram QR gerado
  const [qrGeradoIds, setQrGeradoIds] = useState<number[]>([]);

  const qrRef = useRef<any>(null);

  // modal de PDF / salvar (usado no app nativo)
  const [modalPrintVisivel, setModalPrintVisivel] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  // ------------ utilidades de estado de QR gerado -------------
  const carregarQrGerados = async () => {
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_QR_GERADOS);
      if (salvo) {
        const ids = JSON.parse(salvo) as number[];
        setQrGeradoIds(ids);
      }
    } catch (e) {
      console.log('Erro ao carregar qr gerados', e);
    }
  };

  const salvarQrGerados = async (ids: number[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_QR_GERADOS, JSON.stringify(ids));
    } catch (e) {
      console.log('Erro ao salvar qr gerados', e);
    }
  };

  const marcarQrGerado = (id: number) => {
    setQrGeradoIds(prev => {
      if (prev.includes(id)) return prev;
      const nova = [...prev, id];
      salvarQrGerados(nova);
      return nova;
    });
  };

  // ---------------- carregar lotes ao entrar na tela ---------------
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const carregar = async () => {
        try {
          setCarregando(true);
          setErro('');

          const idStr = await AsyncStorage.getItem('@produtor_id');
          if (!idStr) {
            router.replace('/login/produtor');
            return;
          }

          const idNum = Number(idStr);
          if (!ativo) return;

          setProdutorId(idNum);

          const resp = await fetch(
            `https://docampo-backend-production.up.railway.app/api/lotes/produtor/${idNum}`,
          );
          const data = await resp.json();

          if (!resp.ok) {
            setErro(data.erro || 'Erro ao carregar lotes.');
            setLotes([]);
          } else {
            setLotes(data);
          }

          await carregarQrGerados();
        } catch (e) {
          console.error(e);
          if (ativo) {
            setErro('Erro de conexão ao carregar lotes.');
            setLotes([]);
          }
        } finally {
          if (ativo) setCarregando(false);
        }
      };

      carregar();

      return () => {
        ativo = false;
      };
    }, [router]),
  );

  const handleVoltar = () => {
    // @ts-ignore
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/produtor');
    }
  };

  const handleSelecionarLote = (lote: Lote) => {
    setLoteSelecionado(lote);
  };

  const jaGerouQr = (id: number) => qrGeradoIds.includes(id);

  // ----------------- render dos cards de lote -----------------
  const renderLote = ({ item }: { item: Lote }) => (
    <TouchableOpacity
      style={styles.cardLote}
      onPress={() => handleSelecionarLote(item)}
    >
      <View style={styles.cardLoteHeader}>
        <Text style={styles.cardTitulo}>{item.produto}</Text>
        <View
          style={[
            styles.badge,
            jaGerouQr(item.id) ? styles.badgeReimprimir : styles.badgeGerar,
          ]}
        >
          <Text
            style={[
              styles.badgeTexto,
              jaGerouQr(item.id) && styles.badgeTextoReimprimir,
            ]}
          >
            {jaGerouQr(item.id) ? 'Reimprimir QR' : 'Gerar QR'}
          </Text>
        </View>
      </View>

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
  );

  // --------- código de rastreio e valor do QR ---------
  const codigoRastreioSelecionado = loteSelecionado
    ? `DOCAMPO-${String(loteSelecionado.id).padStart(4, '0')}`
    : '';

  // QR vai conter EXATAMENTE o código de rastreio
  const qrValue = codigoRastreioSelecionado || ' ';

  // ---------------- compartilhamento simples (texto) ----------------
  const handleCompartilhar = async () => {
    if (!loteSelecionado) return;

    marcarQrGerado(loteSelecionado.id);

    try {
      await Share.share({
        message: `QR Code do lote ${loteSelecionado.produto} – Código de rastreio: ${codigoRastreioSelecionado}.`,
      });
    } catch (error) {
      console.log('Erro ao compartilhar:', error);
    }
  };

  // ---------- gerar PDF (web = tela de impressão / mobile = arquivo) ----------
  const handleImprimir = async () => {
    if (!loteSelecionado) return;
    if (!qrRef.current) return;

    marcarQrGerado(loteSelecionado.id);

    try {
      qrRef.current.toDataURL(async (data: string) => {
        try {
          const local =
            loteSelecionado.local_producao || 'Sítio não informado';

          const html = `
            <html>
              <head>
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <style>
                  * { box-sizing: border-box; margin: 0; padding: 0; }
                  body {
                    font-family: Arial, sans-serif;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .wrapper {
                    width: 100%;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 24px;
                  }
                  .produto {
                    font-size: 20px;
                    font-weight: bold;
                    color: #14532D;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                    text-align: center;
                  }
                  .codigo {
                    font-size: 14px;
                    color: #065F46;
                    font-weight: 600;
                    margin-bottom: 12px;
                    text-align: center;
                  }
                  .local {
                    font-size: 12px;
                    color: #374151;
                    margin-bottom: 16px;
                    text-align: center;
                  }
                  .qr-box {
                    padding: 12px;
                    border-radius: 16px;
                    border: 1px solid #D1D5DB;
                  }
                  img {
                    width: 260px;
                    height: 260px;
                  }
                </style>
              </head>
              <body>
                <div class="wrapper">
                  <div class="produto">${loteSelecionado.produto}</div>
                  <div class="codigo">Código de rastreio: ${codigoRastreioSelecionado}</div>
                  <div class="local">${local}</div>
                  <div class="qr-box">
                    <img src="data:image/png;base64,${data}" />
                  </div>
                </div>
              </body>
            </html>
          `;

          if (Platform.OS === 'web') {
            // Web: abre diálogo de impressão do navegador.
            await Print.printAsync({ html });
          } else {
            // Mobile: gera arquivo PDF e mostra modal para salvar/compartilhar.
            const { uri } = await Print.printToFileAsync({ html });
            setPdfUri(uri);
            setModalPrintVisivel(true);
          }
        } catch (err) {
          console.log('Erro ao gerar PDF:', err);
          Alert.alert('Erro', 'Não foi possível gerar o PDF.');
        }
      });
    } catch (error) {
      console.log('Erro ao preparar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    }
  };

  // ------------- botão do modal: salvar/compartilhar PDF (apenas mobile) -------------
  const acaoSalvarOuCompartilharPdf = async () => {
    if (!pdfUri) return;

    try {
      const disponivel = await Sharing.isAvailableAsync();
      if (!disponivel) {
        Alert.alert(
          'Recurso indisponível',
          'Salvar/compartilhar PDF não está disponível neste dispositivo.',
        );
        return;
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Salvar ou compartilhar PDF do QR Code',
      });
    } catch (e) {
      console.log('Erro ao compartilhar PDF:', e);
    }
  };

  const jaGerouSelecionado =
    loteSelecionado && jaGerouQr(loteSelecionado.id);

  // --------------------------- UI ---------------------------
  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleVoltar}>
          <Text style={styles.voltar}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Gerar QR Code</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.container}>
        {/* QR CODE NO TOPO */}
        <View style={styles.qrContainer}>
          {loteSelecionado ? (
            <>
              <Text style={styles.qrTitulo}>
                {jaGerouSelecionado
                  ? 'Reimprimir QR Code'
                  : 'Gerar QR Code do lote'}
              </Text>
              <Text style={styles.qrSubtitulo}>
                {loteSelecionado.produto}
              </Text>
              {codigoRastreioSelecionado ? (
                <Text style={styles.qrCodigo}>
                  Código de rastreio:{' '}
                  <Text style={styles.qrCodigoValor}>
                    {codigoRastreioSelecionado}
                  </Text>
                </Text>
              ) : null}

              <View style={styles.qrBox}>
                <QRCode
                  value={qrValue}
                  size={200}
                  getRef={c => (qrRef.current = c)}
                />
              </View>

              <View style={styles.qrBotoesLinha}>
                <TouchableOpacity
                  style={styles.qrBotaoPrimario}
                  onPress={handleImprimir}
                >
                  <Text style={styles.qrBotaoPrimarioTexto}>
                    PDF / Salvar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.qrBotaoSecundario}
                  onPress={handleCompartilhar}
                >
                  <Text style={styles.qrBotaoSecundarioTexto}>
                    Compartilhar
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.qrTitulo}>
                Selecione um lote para gerar o QR Code
              </Text>
              <Text style={styles.qrDescricao}>
                Toque em um dos lotes abaixo para criar ou reimprimir o
                QR Code de rastreamento.
              </Text>
            </>
          )}
        </View>

        <Text style={styles.subtitulo}>
          Lotes cadastrados ({lotes.length}) – os que já tiveram QR
          gerado aparecem como "Reimprimir QR".
        </Text>

        {carregando ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            {erro ? <Text style={styles.mensagemErro}>{erro}</Text> : null}

            {lotes.length === 0 && !erro ? (
              <View style={styles.center}>
                <Text style={styles.semLotes}>
                  Você ainda não cadastrou nenhum lote.
                </Text>
              </View>
            ) : (
              <FlatList
                data={lotes}
                keyExtractor={item => String(item.id)}
                renderItem={renderLote}
                contentContainerStyle={styles.lista}
              />
            )}
          </>
        )}
      </View>

      {/* MODAL interno do app (apenas mobile) */}
      <Modal
        visible={modalPrintVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalPrintVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCaixa}>
            <Text style={styles.modalTitulo}>QR Code gerado</Text>
            <Text style={styles.modalTexto}>
              O PDF com o QR Code foi gerado. Toque no botão abaixo para
              salvar ou compartilhar pelo seu celular.
            </Text>

            <View style={styles.modalBotoesLinha}>
              <TouchableOpacity
                style={styles.modalBotaoSecundario}
                onPress={() => setModalPrintVisivel(false)}
              >
                <Text style={styles.modalBotaoSecundarioTexto}>
                  Fechar
                </Text>
              </TouchableOpacity>

              {pdfUri && (
                <TouchableOpacity
                  style={styles.modalBotao}
                  onPress={acaoSalvarOuCompartilharPdf}
                >
                  <Text style={styles.modalBotaoTexto}>
                    Salvar / Compartilhar PDF
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ----------------- estilos -----------------
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
  qrContainer: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  qrTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D5B2C',
    textAlign: 'center',
    marginBottom: 4,
  },
  qrSubtitulo: {
    fontSize: 14,
    color: '#14532D',
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  qrCodigo: {
    fontSize: 12,
    color: '#14532D',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrCodigoValor: {
    fontWeight: '700',
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  qrBotoesLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  qrBotaoPrimario: {
    flex: 1,
    backgroundColor: '#1D5B2C',
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 6,
    alignItems: 'center',
  },
  qrBotaoPrimarioTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  qrBotaoSecundario: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 999,
    marginLeft: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D5B2C',
  },
  qrBotaoSecundarioTexto: {
    color: '#1D5B2C',
    fontWeight: '700',
    fontSize: 13,
  },
  qrDescricao: {
    fontSize: 12,
    color: '#14532D',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: '#4B6B50',
    marginBottom: 8,
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
  cardLoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D5B2C',
  },
  cardLinha: {
    fontSize: 12,
    color: '#4B6B50',
  },
  cardValor: {
    fontWeight: '600',
    color: '#1D5B2C',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeGerar: {
    backgroundColor: '#DCFCE7',
  },
  badgeReimprimir: {
    backgroundColor: '#FEF3C7',
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  badgeTextoReimprimir: {
    color: '#92400E',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  mensagemErro: {
    color: '#B91C1C',
    marginBottom: 8,
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
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1D5B2C',
    marginBottom: 6,
  },
  modalTexto: {
    fontSize: 13,
    color: '#4B6B50',
    marginBottom: 14,
  },
  modalBotoesLinha: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalBotao: {
    backgroundColor: '#1D5B2C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modalBotaoTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  modalBotaoSecundario: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#6B7280',
    marginRight: 'auto',
  },
  modalBotaoSecundarioTexto: {
    fontSize: 13,
    color: '#374151',
  },
});
