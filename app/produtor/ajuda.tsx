// app/produtor/ajuda.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AjudaProdutor() {
  const router = useRouter();

  const handleVoltar = () => {
    // @ts-ignore
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/produtor');
    }
  };

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleVoltar}>
          <Text style={styles.voltar}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Ajuda</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Como usar o DoCampo</Text>
        <Text style={styles.paragrafo}>
          Aqui você encontra um passo a passo rápido de como usar o sistema
          para rastrear sua produção, gerar QR Codes e acompanhar seus lotes.
        </Text>

        <Text style={styles.subtitulo}>1. Cadastro e login</Text>
        <Text style={styles.paragrafo}>
          • Crie sua conta de produtor informando nome, CPF ou CNPJ e senha.{'\n'}
          • Depois, faça login na opção "Produtor rural" usando o mesmo CPF/CNPJ
          e senha cadastrados.
        </Text>

        <Text style={styles.subtitulo}>2. Cadastrar um novo lote</Text>
        <Text style={styles.paragrafo}>
          • Na tela inicial, toque em <Text style={styles.negrito}>+ Novo lote</Text> ou no menu{' '}
          <Text style={styles.negrito}>Lotes</Text> na barra inferior.{'\n'}
          • Informe o nome do produto (ex: Tomate orgânico), quantidade, data de
          colheita e local de produção.{'\n'}
          • Toque em <Text style={styles.negrito}>Salvar lote</Text> para gravar as informações.
        </Text>

        <Text style={styles.subtitulo}>3. Ver, editar ou excluir lotes</Text>
        <Text style={styles.paragrafo}>
          • Na tela inicial, em "Seus lotes", você vê os últimos lotes
          cadastrados.{'\n'}
          • Toque em qualquer lote para ir para a tela principal de lotes.{'\n'}
          • Lá você pode tocar em <Text style={styles.negrito}>Editar</Text> para alterar os dados
          ou em <Text style={styles.negrito}>Excluir</Text> para remover um lote incorreto.
        </Text>

        <Text style={styles.subtitulo}>4. Gerar ou reimprimir o QR Code</Text>
        <Text style={styles.paragrafo}>
          • Na tela inicial, toque na categoria{' '}
          <Text style={styles.negrito}>Gerar QR Code</Text>.{'\n'}
          • Escolha o lote desejado na lista.{'\n'}
          • O QR Code será exibido em destaque. Você pode usar esse código na
          embalagem, etiqueta ou ficha do produto para rastreamento.
        </Text>

        <Text style={styles.subtitulo}>5. Rastreamento e transporte</Text>
        <Text style={styles.paragrafo}>
          • Em versões futuras, o módulo de{' '}
          <Text style={styles.negrito}>Transporte</Text> permitirá registrar
          cada etapa do caminho do lote até o consumidor final.{'\n'}
          • O QR Code gerado hoje já prepara o lote para essa etapa de
          rastreamento.
        </Text>

        <Text style={styles.subtitulo}>Dúvidas ou melhorias</Text>
        <Text style={styles.paragrafo}>
          Este aplicativo está em evolução. Se você tiver sugestões ou
          encontrou algum problema, comunique o responsável pelo sistema para
          que possamos melhorar cada vez mais a experiência do produtor.
        </Text>
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D5B2C',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D5B2C',
    marginTop: 16,
    marginBottom: 4,
  },
  paragrafo: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  negrito: {
    fontWeight: '700',
  },
});
