// app/produtor/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
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

const imagensCarousel = [
  require('../../assets/agricultor1.jpg'),
  require('../../assets/agricultor2.jpg'),
  require('../../assets/agricultor3.jpg'),
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - 32;

export default function HomeProdutor() {
  const router = useRouter();
  const [produtorNome, setProdutorNome] = useState<string>('');
  const [produtorId, setProdutorId] = useState<number | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');

  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<ScrollView | null>(null);

  const carregarLotes = async (id: number) => {
    try {
      setErro('');
      const resp = await fetch(
        `http://localhost:3001/api/lotes/produtor/${id}`
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
      let isActive = true;

      const init = async () => {
        setLoading(true);
        try {
          const idStr = await AsyncStorage.getItem('@produtor_id');
          const nome = await AsyncStorage.getItem('@produtor_nome');

          if (nome) setProdutorNome(nome);
          if (idStr) {
            const idNum = Number(idStr);
            if (isActive) {
              setProdutorId(idNum);
              await carregarLotes(idNum);
            }
          } else {
            router.replace('/login/produtor');
          }
        } catch (e) {
          console.error(e);
          setErro('Erro ao recuperar dados do produtor.');
        }
      };

      init();

      return () => {
        isActive = false;
      };
    }, [router])
  );

  // carrossel automático
  useEffect(() => {
    if (imagensCarousel.length === 0) return;

    let current = 0;
    const interval = setInterval(() => {
      current = (current + 1) % imagensCarousel.length;
      setCarouselIndex(current);
      if (carouselRef.current) {
        carouselRef.current.scrollTo({
          x: current * CAROUSEL_WIDTH,
          animated: true,
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const onCarouselScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CAROUSEL_WIDTH);
    setCarouselIndex(index);
  };

  const onRefresh = () => {
    if (!produtorId) return;
    setRefreshing(true);
    carregarLotes(produtorId);
  };

  const handleNovoLote = () => {
    router.push('/produtor/novo-lote');
  };

  // quando clicar em um lote na home, leva para a tela principal de lotes
  const handleIrParaPaginaLotes = () => {
    router.push('/produtor/lotes');
  };

  const handleSair = async () => {
    await AsyncStorage.removeItem('@produtor_id');
    await AsyncStorage.removeItem('@produtor_nome');
    router.replace('/login/produtor');
  };

  const primeiroNome =
    produtorNome && produtorNome.trim().length > 0
      ? produtorNome.trim().split(' ')[0]
      : 'Produtor';

  const inicialAvatar =
    produtorNome && produtorNome.trim().length > 0
      ? produtorNome.trim().charAt(0).toUpperCase()
      : 'P';

  const renderLote = ({ item }: { item: Lote }) => (
    <TouchableOpacity
      style={styles.cardLote}
      onPress={handleIrParaPaginaLotes}
    >
      <View style={styles.cardLoteHeader}>
        <Text style={styles.cardLoteProduto}>{item.produto}</Text>
        <Text style={styles.cardLoteQtd}>{item.quantidade} un.</Text>
      </View>
      <Text style={styles.cardLoteLinha}>
        Colheita:{' '}
        <Text style={styles.cardLoteValor}>
          {item.data_colheita || '-'}
        </Text>
      </Text>
      <Text style={styles.cardLoteLinha}>
        Local:{' '}
        <Text style={styles.cardLoteValor}>
          {item.local_producao || 'Não informado'}
        </Text>
      </Text>
    </TouchableOpacity>
  );

  // categorias
  const handleCategoriaPress = (
    tipo: 'transporte' | 'qr' | 'ajuda' | 'outros'
  ) => {
    if (tipo === 'qr') {
      router.push('/produtor/gerar-qrcode');
    } else if (tipo === 'ajuda') {
      router.push('/produtor/ajuda');
    } else if (tipo === 'transporte') {
      // tela futura
      console.log('Transporte: tela ainda não implementada');
    } else {
      console.log('Outros: tela ainda não implementada');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerPerfil}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{inicialAvatar}</Text>
            </View>
            <View>
              <Text style={styles.boasVindas}>Bom dia,</Text>
              <Text style={styles.nomeProdutor}>{primeiroNome}</Text>
            </View>
          </View>

          <View style={styles.headerAcoes}>
            <View style={styles.localBox}>
              <Text style={styles.localLabel}>Local</Text>
              <Text style={styles.localValor}>Minha propriedade</Text>
            </View>
            <TouchableOpacity style={styles.btnSino}>
              <Text style={styles.btnSinoTexto}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARROSSEL */}
        <View style={styles.carouselBloco}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onCarouselScrollEnd}
          >
            {imagensCarousel.map((img, index) => (
              <View
                key={index}
                style={{ width: CAROUSEL_WIDTH, alignItems: 'center' }}
              >
                <Image source={img} style={styles.carouselImagem} />
              </View>
            ))}
          </ScrollView>

          <View style={styles.carouselDots}>
            {imagensCarousel.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.carouselDot,
                  index === carouselIndex && styles.carouselDotAtivo,
                ]}
              />
            ))}
          </View>
        </View>

        {/* CATEGORIAS */}
        <View style={styles.categoriasBloco}>
          <View style={styles.categoriasHeader}>
            <Text style={styles.categoriasTitulo}>Categorias</Text>
            <Text style={styles.categoriasVerTudo}>Ver todas</Text>
          </View>
          <View style={styles.categoriasRow}>
            <TouchableOpacity
              style={styles.categoriaChip}
              onPress={() => router.push('/produtor/transporte')}
            >
              <Text style={styles.categoriaIcone}>🚚</Text>
              <Text style={styles.categoriaTexto}>Transporte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.categoriaChip}
              onPress={() => handleCategoriaPress('qr')}
            >
              <Text style={styles.categoriaIcone}>🔳</Text>
              <Text
                style={styles.categoriaTexto}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                Gerar QR Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.categoriaChip}
              onPress={() => handleCategoriaPress('ajuda')}
            >
              <Text style={styles.categoriaIcone}>❓</Text>
              <Text style={styles.categoriaTexto}>Ajuda</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.categoriaChip}
              onPress={() => handleCategoriaPress('outros')}
            >
              <Text style={styles.categoriaIcone}>⚙️</Text>
              <Text style={styles.categoriaTexto}>Outros</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LISTA DE LOTES */}
        <View style={styles.listaBloco}>
          <View style={styles.listaHeader}>
            <Text style={styles.listaTitulo}>Seus lotes</Text>
            <TouchableOpacity onPress={handleNovoLote}>
              <Text style={styles.listaVerTudo}>+ Novo lote</Text>
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

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomItemAtivo}>
          <Text style={styles.bottomIcone}>🏠</Text>
          <Text style={styles.bottomTextoAtivo}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomItem}
          onPress={() => router.push('/produtor/lotes')}
        >
          <Text style={styles.bottomIcone}>📦</Text>
          <Text style={styles.bottomTexto}>Lotes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomItem}
          onPress={() => router.push('/produtor/relatorios')}
        >
          <Text style={styles.bottomIcone}>📊</Text>
          <Text style={styles.bottomTexto}>Relatórios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomItem}
          onPress={() => router.push('/produtor/perfil')}
        >
          <Text style={styles.bottomIcone}>👤</Text>
          <Text style={styles.bottomTexto}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Botão sair flutuante */}
      <TouchableOpacity style={styles.btnSairFlutuante} onPress={handleSair}>
        <Text style={styles.btnSairFlutuanteTexto}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E9F7EC',
  },
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1D5B2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  boasVindas: {
    fontSize: 12,
    color: '#4B6B50',
  },
  nomeProdutor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D5B2C',
  },
  headerAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  localBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#C8D9CB',
  },
  localLabel: {
    fontSize: 10,
    color: '#4B6B50',
  },
  localValor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D5B2C',
  },
  btnSino: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8D9CB',
  },
  btnSinoTexto: {
    fontSize: 16,
  },
  carouselBloco: {
    marginBottom: 16,
  },
  carouselImagem: {
    width: CAROUSEL_WIDTH,
    height: 170,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: '#C8D9CB',
  },
  carouselDotAtivo: {
    backgroundColor: '#1D5B2C',
  },
  categoriasBloco: {
    marginBottom: 16,
  },
  categoriasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoriasTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D5B2C',
  },
  categoriasVerTudo: {
    fontSize: 12,
    color: '#4B6B50',
  },
  categoriasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoriaChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8D9CB',
    minHeight: 80,
  },
  categoriaIcone: {
    fontSize: 18,
    marginBottom: 4,
  },
  categoriaTexto: {
    fontSize: 12,
    color: '#1D5B2C',
    fontWeight: '600',
    textAlign: 'center',
  },
  listaBloco: {
    flex: 1,
  },
  listaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D5B2C',
  },
  listaVerTudo: {
    fontSize: 12,
    color: '#1D5B2C',
    fontWeight: '600',
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
    marginBottom: 6,
  },
  cardLoteProduto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D5B2C',
  },
  cardLoteQtd: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B6B50',
  },
  cardLoteLinha: {
    fontSize: 12,
    color: '#4B6B50',
  },
  cardLoteValor: {
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
  bottomBar: {
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#C8D9CB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomItem: {
    flex: 1,
    alignItems: 'center',
  },
  bottomItemAtivo: {
    flex: 1,
    alignItems: 'center',
  },
  bottomIcone: {
    fontSize: 18,
    marginBottom: 2,
  },
  bottomTexto: {
    fontSize: 11,
    color: '#4B6B50',
  },
  bottomTextoAtivo: {
    fontSize: 11,
    color: '#1D5B2C',
    fontWeight: '700',
  },
  btnSairFlutuante: {
    position: 'absolute',
    right: 16,
    top: 40,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#B91C1C',
  },
  btnSairFlutuanteTexto: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '600',
  },
});
