// frontend/screens/TransactionReportScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const formatDate = (dateString) => {
    if (!dateString) return 'Data inválida';
    try {
        // Tenta criar data a partir do formato ISO (vem da geração inicial)
        let date = new Date(dateString);
        if (isNaN(date.getTime())) {
            // Tenta criar data a partir do formato pt-BR (vem da reimpressão)
            const [datePart, timePart] = dateString.split(', ');
            const [day, month, year] = datePart.split('/');
            const [hour, minute] = (timePart || '00:00').split(':');
            date = new Date(year, month - 1, day, hour, minute);
        }
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'Data inválida';
    }
};

const getTitleAndColor = (type) => {
    switch (type) {
        case 'COMPRA_FORNECEDOR': return { title: 'COMPROVANTE DE ENTRADA', color: '#28a745' };
        case 'RETORNO_EVENTO': return { title: 'COMPROVANTE DE ENTRADA', color: '#28a745' };
        case 'VENDA_DIRETA': return { title: 'VENDA DIRETA', color: '#dc3545' };
        case 'SAIDA_EVENTO': return { title: 'SAÍDA PARA EVENTO', color: '#dc3545' };
        case 'ALUGUEL_MATERIAL': return { title: 'ALUGUEL DE MATERIAL', color: '#007bff' };
        case 'DEVOLUÇÃO': return { title: 'COMPROVANTE DE DEVOLUÇÃO', color: '#ffc107' };
        default: return { title: 'COMPROVANTE', color: '#1E63B8' };
    }
};

export default function TransactionReportScreen({ route, navigation }) {
  const { details } = route.params;
  const [logoBase64, setLogoBase64] = useState(null);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  useEffect(() => {
    const loadLogo = async () => {
        try {
            const asset = Asset.fromModule(require('../assets/logo1.png'));
            await asset.downloadAsync();
            const base64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
            setLogoBase64(`data:image/png;base64,${base64}`);
        } catch (error) {
            console.error("Erro ao carregar a logo:", error);
        }
    };
    loadLogo();
  }, []);

  useEffect(() => {
    const generateAndSharePdf = async () => {
        if (logoBase64 && !pdfGenerated) {
            setPdfGenerated(true);

            const { title, color } = getTitleAndColor(details.type);
            const productRows = details.products.map(p => {
                const totalUnits = (p.boxQuantity * p.unitsPerBox) + p.unitQuantity;
                return `
                    <tr>
                        <td>${p.productName}</td>
                        <td class="center">${p.boxQuantity}</td>
                        <td class="center">${p.unitQuantity}</td>
                        <td class="center bold">${totalUnits}</td>
                    </tr>
                `;
            }).join('');
            
            const clientDetails = `
                <p><span class="bold">${details.type.includes('EVENTO') ? 'Evento:' : 'Nome/Razão Social:'}</span> ${details.registrationName}</p>
                ${details.doc ? `<p><span class="bold">CPF/CNPJ:</span> ${details.doc}</p>` : ''}
                ${details.contact ? `<p><span class="bold">Contato:</span> ${details.contact}</p>` : ''}
                ${details.plate ? `<p><span class="bold">Placa do Veículo:</span> ${details.plate}</p>` : ''}
                ${details.returnDate ? `<p><span class="bold">Data de Devolução (Aluguel):</span> ${details.returnDate}</p>` : ''}
                ${details.eventName ? `<p><span class="bold">Evento de Origem:</span> ${details.eventName}</p>` : ''}
            `;

            const htmlContent = `
                <html><head><style>
                      body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 40px; color: #333; font-size: 12px; }
                      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0056b3; padding-bottom: 20px; margin-bottom: 30px;}
                      .header-info { text-align: right; }
                      .header-info h1 { font-size: 24px; color: ${color}; margin: 0; }
                      .header-info p { margin: 4px 0; color: #555; }
                      .logo { width: 150px; height: auto; }
                      .section { margin-top: 30px; }
                      .section-title { font-size: 14px; font-weight: bold; color: #0056b3; border-bottom: 1px solid #a9d9e6; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase; }
                      p { margin: 2px 0; }
                      .bold { font-weight: bold; }
                      table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
                      th, td { border: 1px solid #cceeff; padding: 10px; text-align: left; }
                      th { background-color: #e0f2f7; font-weight: bold; color: #0056b3; }
                      .center { text-align: center; }
                      .signatures { display: flex; justify-content: space-around; margin-top: 80px; }
                      .signature-box { text-align: center; width: 45%; }
                      .signature-line { border-top: 1px solid #0056b3; margin-top: 50px; padding-top: 5px; }
                      .footer { position: fixed; bottom: 30px; left: 40px; right: 40px; text-align: center; font-size: 10px; color: #0056b3; border-top: 1px solid #a9d9e6; padding-top: 10px; }
                </style></head><body>
                    <div class="header">
                        ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ''}
                        <div class="header-info"><h1>${title}</h1><p><span class="bold">Data:</span> ${formatDate(details.date)}</p><p><span class="bold">Protocolo N°:</span> ${details.id}</p></div>
                    </div>
                    <div class="section"><h2 class="section-title">Dados do Cliente</h2><div>${clientDetails}</div></div>
                    <div class="section"><h2 class="section-title">Itens</h2><table><thead><tr><th>Produto</th><th class="center">Qtd (cx)</th><th class="center">Qtd (un)</th><th class="center">Total Unidades</th></tr></thead><tbody>${productRows}</tbody></table></div>
                    <div class="signatures"><div class="signature-box"><p class="signature-line">Assinatura do Cliente</p></div><div class="signature-box"><p class="signature-line">Assinatura do Conferente</p></div></div>
                    <div class="footer"><p>Fabinho Eventos - Gestão de bar em eventos</p></div>
                </body></html>
            `;

            try {
                const { uri } = await Print.printToFileAsync({ html: htmlContent });
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Comprovante' });
                navigation.goBack();
            } catch (error) {
                Alert.alert("Erro", "Não foi possível gerar ou partilhar o PDF.");
                navigation.goBack();
            }
        }
    };
    
    generateAndSharePdf();
  }, [logoBase64, pdfGenerated, navigation, details]);

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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 20, fontSize: 16, color: '#555', textAlign: 'center' }
});