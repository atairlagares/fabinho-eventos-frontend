// frontend/screens/ReturnReportScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Formata a data para um padrão mais limpo
const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export default function ReturnReportScreen({ route, navigation }) {
  const { returnDetails } = route.params;
  const [logoBase64, setLogoBase64] = useState(null);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  // Carrega a imagem e converte para base64
  useEffect(() => {
    const loadLogo = async () => {
        try {
            const asset = Asset.fromModule(require('../assets/logo2.png'));
            await asset.downloadAsync();
            const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            setLogoBase64(`data:image/png;base64,${base64}`);
        } catch (error) {
            console.error("Erro ao carregar a logo:", error);
        }
    };
    loadLogo();
  }, []);

  // Gera e partilha o PDF automaticamente
  useEffect(() => {
    const generateAndSharePdf = async () => {
        // Só executa se a logo já foi carregada e o PDF ainda não foi gerado
        if (logoBase64 && !pdfGenerated) {
            setPdfGenerated(true); // Marca como gerado para não repetir

            const productRows = returnDetails.products.map(p => `
                <tr>
                    <td>${p.productName}</td>
                    <td class="center">${p.boxQuantity}</td>
                    <td class="center">${p.unitQuantity}</td>
                </tr>
            `).join('');

            const htmlContent = `
                <html>
                  <head>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
                      .logo { width: 180px; margin: 0 auto 20px auto; display: block; }
                      h1 { text-align: center; color: #0D1B2A; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                      .section { margin-top: 25px; }
                      .section-title { font-size: 1.2em; font-weight: bold; color: #1E63B8; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
                      p { font-size: 1em; line-height: 1.6; margin: 5px 0; }
                      .bold { font-weight: bold; }
                      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f2f2f2; }
                      .center { text-align: center; }
                    </style>
                  </head>
                  <body>
                    <img src="${logoBase64}" class="logo" />
                    <h1>Comprovante de Devolução</h1>
                    <div class="section">
                      <h2 class="section-title">Detalhes da Operação</h2>
                      <p><span class="bold">Protocolo:</span> ${returnDetails.id}</p>
                      <p><span class="bold">Data:</span> ${formatDate(returnDetails.date)}</p>
                      <p><span class="bold">Devolvido para:</span> ${returnDetails.registrationName}</p>
                      <p><span class="bold">Operador:</span> ${returnDetails.operatorName}</p>
                    </div>
                    <div class="section">
                      <h2 class="section-title">Itens Devolvidos</h2>
                      <table>
                        <thead><tr><th>Produto</th><th class="center">Caixas</th><th class="center">Unidades</th></tr></thead>
                        <tbody>${productRows}</tbody>
                      </table>
                    </div>
                    ${returnDetails.notes ? `<div class="section"><h2 class="section-title">Observações</h2><p>${returnDetails.notes}</p></div>` : ''}
                  </body>
                </html>
            `;

            try {
                const { uri } = await Print.printToFileAsync({ html: htmlContent });
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Partilhar Comprovativo' });
                navigation.goBack(); // Volta para a tela anterior após partilhar
            } catch (error) {
                Alert.alert("Erro", "Não foi possível gerar ou partilhar o PDF.");
                navigation.goBack();
            }
        }
    };
    
    generateAndSharePdf();
  }, [logoBase64, pdfGenerated, navigation, returnDetails]);

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#1E63B8" />
            <Text style={styles.loadingText}>A gerar o seu comprovativo em PDF...</Text>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
      marginTop: 20,
      fontSize: 16,
      color: '#555',
      textAlign: 'center',
  }
});