import { BarCodeScanner, BarCodeScannerResult } from "expo-barcode-scanner";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE_URL = "https://docampo-backend-production.up.railway.app/api";

interface ResultadoRastreio {
  codigo: string;
  produto: string;
  variedade?: string | null;
  produtor_nome: string;
  produtor_comunidade?: string | null;
  produtor_municipio?: string | null;
  data_colheita?: string | null;
  data_envio?: string | null;
  transportador_nome?: string | null;
  status_transporte?: string | null;
}

export default function ConsultaPublicaScreen() {
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoRastreio | null>(null);

  // câmera / scanner
  const [temPermissaoCamera, setTemPermissaoCamera] = useState<boolean | null>(
    null
  );
  const [scannerAtivo, setScannerAtivo] = useState(false);

  const isWeb = Platform.OS === "web";

  function formatarData(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  }

  // 🔧 NORMALIZA o código lido/digitado para bater com o banco
  // - Se vier JSON, tenta pegar campo "codigo" ou "loteId"
  // - Se for só número -> DOCAMPO-<numero>
  // - Se for DOCAMPO-0021 -> DOCAMPO-21 (remove zeros à esquerda)
  function normalizarCodigoBruto(codigoBruto: string): string {
    let codigoFinal = codigoBruto.trim();

    // se for um JSON (começa com {), tenta pegar o campo "codigo" ou "loteId"
    if (codigoFinal.startsWith("{")) {
      try {
        const obj = JSON.parse(codigoFinal);
        if (obj && typeof obj === "object") {
          if (obj.codigo) {
            codigoFinal = String(obj.codigo);
          } else if (obj.loteId) {
            const idNum = Number(obj.loteId);
            if (!Number.isNaN(idNum)) {
              codigoFinal = `DOCAMPO-${idNum}`;
            }
          }
        }
      } catch {
        // se der erro no JSON, mantém o texto original
      }
    }

    codigoFinal = codigoFinal.trim().toUpperCase();

    // se vier só número → DOCAMPO-<numero>
    if (/^\d+$/.test(codigoFinal)) {
      const num = parseInt(codigoFinal, 10);
      if (!Number.isNaN(num)) {
        codigoFinal = `DOCAMPO-${num}`;
      }
    }

    // se vier DOCAMPO-0001, DOCAMPO-0021 etc → remove zeros à esquerda
    const match = /^DOCAMPO-0*(\d+)$/.exec(codigoFinal);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num)) {
        codigoFinal = `DOCAMPO-${num}`;
      }
    }

    return codigoFinal;
  }

  async function handleConsultar(codigoParam?: string) {
    setErro(null);
    setResultado(null);

    const codigoBruto = (codigoParam ?? codigo).trim();
    const codigoUsado = normalizarCodigoBruto(codigoBruto);

    if (!codigoUsado) {
      setErro("Digite ou escaneie o código de rastreio.");
      return;
    }

    try {
      setLoading(true);

      const resp = await fetch(
        `${API_BASE_URL}/consulta-publica/${encodeURIComponent(codigoUsado)}`
      );

      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        data = {};
      }

      console.log(">>> RESPOSTA consulta-publica:", resp.status, data);

      if (!resp.ok || !data.sucesso || !data.rastreio) {
        setErro(
          data?.erro ||
            "Não encontramos informações para esse código. Confira se digitou/escaneou corretamente."
        );
        return;
      }

      setResultado(data.rastreio as ResultadoRastreio);
    } catch (e: any) {
      console.error(e);
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // CÂMERA / SCANNER
  // --------------------------------------------------
  async function abrirScanner() {
    setErro(null);

    if (isWeb) {
      setErro(
        "A leitura por câmera não é suportada nesta versão web. Digite o código de rastreio manualmente ou utilize o app instalado."
      );
      return;
    }

    if (temPermissaoCamera === null) {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      const ok = status === "granted";
      setTemPermissaoCamera(ok);

      if (!ok) {
        setErro(
          "Permissão da câmera negada. Autorize o uso da câmera nas configurações do aparelho."
        );
        return;
      }
    } else if (temPermissaoCamera === false) {
      setErro(
        "Permissão da câmera negada. Autorize o uso da câmera nas configurações do aparelho."
      );
      return;
    }

    setScannerAtivo(true);
  }

  function handleBarCodeScanned(result: BarCodeScannerResult) {
    const valorLidoBruto = String(result.data || "").trim();
    console.log(">>> CÓDIGO ESCANEADO (bruto):", valorLidoBruto);

    const valorNormalizado = normalizarCodigoBruto(valorLidoBruto);
    console.log(">>> CÓDIGO ESCANEADO (normalizado):", valorNormalizado);

    setScannerAtivo(false);

    if (!valorNormalizado) {
      setErro("Não foi possível ler o código. Tente novamente.");
      return;
    }

    setCodigo(valorNormalizado);
    handleConsultar(valorNormalizado);
  }

  if (scannerAtivo && !isWeb) {
    return (
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          style={StyleSheet.absoluteFillObject}
          onBarCodeScanned={handleBarCodeScanned}
        />

        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <View style={styles.scannerTextBox}>
            <Text style={styles.scannerTitle}>Aponte para o QR/código</Text>
            <Text style={styles.scannerSubtitle}>
              Centralize o código dentro do quadrado para ler automaticamente.
            </Text>
            <TouchableOpacity
              style={styles.scannerCancelButton}
              onPress={() => setScannerAtivo(false)}
            >
              <Text style={styles.scannerCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // --------------------------------------------------
  // TELA NORMAL
  // --------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F0FFF4" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.voltarText}>{"< Voltar"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.appName}>DoCampo</Text>
          <Text style={styles.subtitle}>
            Consulte a origem dos alimentos da agricultura familiar.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Consulta pública</Text>
        <Text style={styles.helperText}>
          Digite o código de rastreio ou use a câmera do celular para ler o
          QR/código impresso na embalagem.
        </Text>

        <Text style={styles.label}>Código de rastreio</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: DOCAMPO-0001"
          placeholderTextColor="#9CA3AF"
          value={codigo}
          onChangeText={setCodigo}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => handleConsultar()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Consultar origem</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.scanButton} onPress={abrirScanner}>
          <Text style={styles.scanButtonText}>
            {isWeb
              ? "📷 Escanear (disponível apenas no app)"
              : "📷 Escanear com a câmera"}
          </Text>
        </TouchableOpacity>

        {erro && <Text style={styles.errorText}>{erro}</Text>}

        {resultado && (
          <View style={styles.cardResultado}>
            <Text style={styles.cardHeader}>Origem do alimento</Text>

            <View style={styles.cardLine}>
              <Text style={styles.cardLabel}>Produto: </Text>
              <Text style={styles.cardValue}>
                {resultado.produto}
                {resultado.variedade ? ` (${resultado.variedade})` : ""}
              </Text>
            </View>

            <View style={styles.cardLine}>
              <Text style={styles.cardLabel}>Produtor: </Text>
              <Text style={styles.cardValue}>{resultado.produtor_nome}</Text>
            </View>

            {resultado.produtor_comunidade && (
              <View style={styles.cardLine}>
                <Text style={styles.cardLabel}>Comunidade: </Text>
                <Text style={styles.cardValue}>
                  {resultado.produtor_comunidade}
                </Text>
              </View>
            )}

            {resultado.produtor_municipio && (
              <View style={styles.cardLine}>
                <Text style={styles.cardLabel}>Município: </Text>
                <Text style={styles.cardValue}>
                  {resultado.produtor_municipio}
                </Text>
              </View>
            )}

            <View style={styles.separator} />

            <View style={styles.cardLine}>
              <Text style={styles.cardLabel}>Data da colheita: </Text>
              <Text style={styles.cardValue}>
                {formatarData(resultado.data_colheita)}
              </Text>
            </View>

            <View style={styles.cardLine}>
              <Text style={styles.cardLabel}>Data do envio: </Text>
              <Text style={styles.cardValue}>
                {formatarData(resultado.data_envio)}
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.cardLine}>
              <Text style={styles.cardLabel}>Transportador: </Text>
              <Text style={styles.cardValue}>
                {resultado.transportador_nome || "-"}
              </Text>
            </View>

            <View style={styles.cardLine}>
              <Text style={styles.cardLabel}>Status da carga: </Text>
              <Text style={[styles.cardValue, styles.statusValue]}>
                {resultado.status_transporte || "Em preparação"}
              </Text>
            </View>

            <Text style={styles.footerInfo}>
              Essas informações são fornecidas pelos produtores e
              transportadores cadastrados no sistema DoCampo.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: "#F0FFF4",
  },
  headerRow: {
    marginBottom: 8,
  },
  voltarText: {
    color: "#14532D",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#14532D",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#14532D",
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  scanButton: {
    backgroundColor: "#065F46",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 10,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 13,
    color: "#B91C1C",
  },
  cardResultado: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#00000011",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14532D",
    marginBottom: 8,
  },
  cardLine: {
    flexDirection: "row",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  cardValue: {
    fontSize: 13,
    color: "#111827",
  },
  statusValue: {
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  footerInfo: {
    marginTop: 10,
    fontSize: 11,
    color: "#6B7280",
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  scannerFrame: {
    width: "70%",
    height: "40%",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#22C55E",
    backgroundColor: "transparent",
  },
  scannerTextBox: {
    width: "100%",
    paddingHorizontal: 24,
    alignItems: "center",
  },
  scannerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  scannerSubtitle: {
    color: "#E5E7EB",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  scannerCancelButton: {
    backgroundColor: "#111827AA",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  scannerCancelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
