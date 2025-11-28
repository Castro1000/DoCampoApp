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

  const [qrGeradoIds, setQrGeradoIds] = useState<number[]>([]);
  const qrRef = useRef<any>(null);

  const [modalPrintVisivel, setModalPrintVisivel] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const carregarQrGerados = async () => {
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_QR_GERADOS);
      if (salvo) setQrGeradoIds(JSON.parse(salvo));
    } catch (e) {}
  };

  const salvarQrGerados = async (ids: number[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_QR_GERADOS, JSON.stringify(ids));
    } catch (e) {}
  };

  const marcarQrGerado = (id: number) => {
    if (!qrGeradoIds.includes(id)) {
      const novo = [...qrGeradoIds, id];
      setQrGeradoIds(novo);
      salvarQrGerados(novo);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      const carregar = async () => {
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

        try {
          const resp = await fetch(
            `https://docampo-backend-production.up.railway.app/api/lotes/produtor/${idNum}`
          );
          const data = await resp.json();

          if (!resp.ok) setErro(data.erro || 'Erro ao carregar lotes.');
          else setLotes(data);

          await carregarQrGerados();
        } catch (e) {
          setErro('Erro de conexão ao carregar lotes.');
        }

        if (ativo) setCarregando(false);
      };

      carregar();

      return () => {
        ativo = false;
      };
    }, [router])
  );

  const handleSelecionarLote = (lote: Lote) => {
    setLoteSelecionado(lote);
  };

  const jaGerouQr = (id: number) => qrGeradoIds.includes(id);

  // === Código DO QR ===
  const codigoRastreio =
    loteSelecionado &&
    `DOCAMPO-${String(loteSelecionado.id).padStart(4, '0')}`;

  const qrValue = loteSelecionado
    ? JSON.stringify({
        codigo: codigoRastreio,
        loteId: loteSelecionado.id,
        produto: loteSelecionado.produto,
      })
    : '';

  // === Compartilhar texto (WhatsApp, etc) ===
  const handleCompartilhar = async () => {
    if (!loteSelecionado) return;
    marcarQrGerado(loteSelecionado.id);

    await Share.share({
      message: `QR Code do lote ${loteSelecionado.produto} (${codigoRastreio}).`,
    });
  };

  // === GERAR PDF NO CELULAR ===
  const handleImprimir = async () => {
    if (!loteSelecionado) return;

    marcarQrGerado(loteSelecionado.id);

    if (Platform.OS === 'web') {
      setModalPrintVisivel(true);
      return;
    }

    if (!qrRef.current) return;

    qrRef.current.toDataURL(async (data: string) => {
      try {
        const local =
          loteSelecionado.local_producao || 'Local não informado';

        const html = `
          <html>
            <head>
              <meta name="viewport" content="initial-scale=1, width=device-width" />
              <style>
                body {
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding-top: 40px;
                }
                h1 {
                  color: #14532D;
                  font-size: 26px;
                  margin-bottom: 4px;
                }
                h2 {
                  color: #0f5132;
                  font-size: 20px;
                  margin: 4px 0 14px 0;
                }
                h3 {
                  color: #166534;
                  font-size: 16px;
                  margin-bottom: 20px;
                }
                img {
                  width: 260px;
                  height: 260px;
                }
              </style>
            </head>
            <body>
              <h1>${loteSelecionado.produto}</h1>
              <h2>Código de rastreio: ${codigoRastreio}</h2>
              <h3>${local}</h3>

              <img src="data:image/png;base64,${data}" />
            </body>
          </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        setPdfUri(uri);
        setModalPrintVisivel(true);
      } catch (err) {
        Alert.alert('Erro', 'Não foi possível gerar o PDF.');
      }
    });
  };

  const salvarPdfMobile = async () => {
    if (!pdfUri) return;

    const disponivel = await Sharing.isAvailableAsync();
    if (!disponivel) {
      Alert.alert(
        'Indisponível',
        'Seu dispositivo não suporta salvar/compartilhar arquivos.'
      );
      return;
    }

    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Salvar / Compartilhar PDF',
    });
  };

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
            jaGerouQr(item.id)
              ? styles.badgeReimprimir
              : styles.badgeGerar,
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
        Quantidade: <Text style={styles.cardValor}>{item.quantidade}</Text>
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

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Gerar QR Code</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.qrContainer}>
          {loteSelecionado ? (
            <>
              <Text style={styles.qrTitulo}>
                {jaGerouQr(loteSelecionado.id)
                  ? 'Reimprimir QR Code'
                  : 'Gerar QR Code do lote'}
              </Text>

              <Text style={styles.qrSubtitulo}>{loteSelecionado.produto}</Text>
              <Text style={styles.qrCodigo}>Código de rastreio: {codigoRastreio}</Text>

              <View style={styles.qrBox}>
                <QRCode
                  value={qrValue || ' '}
                  size={200}
                  getRef={(c) => (qrRef.current = c)}
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
            </>
          )}
        </View>

        <Text style={styles.subtitulo}>
          Lotes cadastrados ({lotes.length})
        </Text>

        {carregando ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : erro ? (
          <Text style={styles.mensagemErro}>{erro}</Text>
        ) : (
          <FlatList
            data={lotes}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderLote}
            contentContainerStyle={styles.lista}
          />
        )}
      </View>

      {/* MODAL */}
      <Modal visible={modalPrintVisivel} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCaixa}>
            <Text style={styles.modalTitulo}>QR Code gerado</Text>
            <Text style={styles.modalTexto}>
              {Platform.OS === 'web'
                ? 'No navegador não é possível salvar direto. No app instalado você poderá salvar ou compartilhar o PDF normalmente.'
                : 'Agora você pode salvar ou compartilhar o PDF gerado.'}
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

              {Platform.OS !== 'web' && pdfUri && (
                <TouchableOpacity
                  style={styles.modalBotao}
                  onPress={salvarPdfMobile}
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

// === ESTILOS ===
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
    marginBottom: 4,
  },
  qrSubtitulo: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    color: '#14532D',
  },
  qrCodigo: {
    fontSize: 14,
    marginBottom: 8,
    color: '#0f5132',
    fontWeight: '600',
  },
  qrBox: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  qrBotoesLinha: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
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
    color: '#fff',
    fontWeight: '700',
  },
  qrBotaoSecundario: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#1D5B2C',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 999,
    marginLeft: 6,
    alignItems: 'center',
  },
  qrBotaoSecundarioTexto: {
    color: '#1D5B2C',
    fontWeight: '700',
  },
  subtitulo: {
    fontSize: 14,
    marginBottom: 6,
    color: '#4B6B50',
  },
  cardLote: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C8D9CB',
    marginBottom: 10,
  },
  cardLoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D5B2C',
  },
  cardLinha: {
    color: '#4B6B50',
    fontSize: 13,
  },
  cardValor: {
    fontWeight: '700',
    color: '#166534',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
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
  lista: { paddingBottom: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCaixa: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1D5B2C',
  },
  modalTexto: {
    fontSize: 13,
    color: '#4B6B50',
    marginBottom: 12,
  },
  modalBotoesLinha: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalBotao: {
    backgroundColor: '#1D5B2C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modalBotaoTexto: {
    color: '#fff',
    fontWeight: '700',
  },
  modalBotaoSecundario: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalBotaoSecundarioTexto: {
    color: '#333',
    fontWeight: '600',
  },
});
