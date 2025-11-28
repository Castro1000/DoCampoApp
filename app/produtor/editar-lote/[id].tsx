// app/produtor/editar-lote/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EditarLote() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [dataColheita, setDataColheita] = useState('');
  const [localProducao, setLocalProducao] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      if (!id) return;
      try {
        const resp = await fetch(`https://docampo-backend-production.up.railway.app/api/lotes/${id}`);
        const data = await resp.json();
        if (!resp.ok) {
          Alert.alert('Erro', data.erro || 'Erro ao buscar lote.');
          router.back();
          return;
        }
        setProduto(data.produto || '');
        setQuantidade(String(data.quantidade || ''));
        setDataColheita(data.data_colheita || '');
        setLocalProducao(data.local_producao || '');
      } catch (e) {
        console.error(e);
        Alert.alert('Erro', 'Erro de conexão ao buscar lote.');
        router.back();
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [id, router]);

  const handleVoltar = () => {
    // @ts-ignore
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/produtor/lotes');
    }
  };

  const handleSalvar = async () => {
    if (!produto || !quantidade) {
      Alert.alert('Atenção', 'Preencha produto e quantidade.');
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

      const resp = await fetch(`https://docampo-backend-production.up.railway.app/api/lotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();

      if (!resp.ok) {
        Alert.alert('Erro', data.erro || 'Erro ao atualizar lote.');
      } else {
        Alert.alert('Sucesso', 'Lote atualizado com sucesso.', [
          { text: 'OK', onPress: () => router.replace('/produtor/lotes') },
        ]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Erro de conexão ao atualizar o lote.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleVoltar}>
          <Text style={styles.voltarText}>{'< Voltar'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Editar lote</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Produto</Text>
        <TextInput
          style={styles.input}
          value={produto}
          onChangeText={setProduto}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={quantidade}
          onChangeText={setQuantidade}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Data de colheita</Text>
        <TextInput
          style={styles.input}
          value={dataColheita}
          onChangeText={setDataColheita}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Local de produção</Text>
        <TextInput
          style={styles.input}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#E9F7EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    marginBottom: 16,
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
});
