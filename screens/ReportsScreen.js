// frontend/screens/ReportsScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../config';


const formatDateOnly = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return 'N/A';
    try {
        const datePart = dateString.split(',')[0];
        const [day, month, year] = datePart.split('/');
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return 'N/A';
    }
};

const formatDateTime = (date) => {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export default function ReportsScreen({ navigation }) {
    const [isLoading, setIsLoading] = useState(false);
    const [logoBase64, setLogoBase64] = useState(null);

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

    const fetchInventoryData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stock/inventory`);
            return response.data;
        } catch (error) {
            Alert.alert("Erro", "Não foi possível buscar os dados do inventário.");
            return null;
        }
    };

    const handleExportPDF = async () => {
        if (!logoBase64) {
            Alert.alert("Aguarde", "A logo ainda está sendo carregada. Tente novamente em um instante.");
            return;
        }
        setIsLoading(true);
        const inventory = await fetchInventoryData();
        if (!inventory) {
            setIsLoading(false);
            return;
        }

        const operatorName = await AsyncStorage.getItem('loggedInUserName') || 'Usuário';
        const reportDate = formatDateTime(new Date());

        const productRows = inventory.map(p => `
            <tr>
                <td>${p.productName} (cx.${p.unitsPerBox})</td>
                <td class="center">${p.boxStock}</td>
                <td class="center">${p.unitStock}</td>
                <td class="center">${formatDateOnly(p.lastVerified)}</td>
            </tr>
        `).join('');

        const htmlContent = `
            <html>
                <head>
                    <style>
                        @page { margin: 40px; }
                        html, body { height: 100%; }
                        body { display: flex; flex-direction: column; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px; }
                        header { width: 100%; flex-shrink: 0; border-bottom: 2px solid #EEE; padding-bottom: 15px; margin-bottom: 25px; }
                        main { flex-grow: 1; }
                        footer { width: 100%; flex-shrink: 0; text-align: center; font-size: 9px; color: #888; border-top: 1px solid #EEE; padding-top: 8px; }
                        
                        .header-flex-container { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center;
                        }
                        .header-left { width: 25%; }
                        .header-center { width: 50%; text-align: center; }
                        .header-right { width: 25%; text-align: right; }
                        
                        .logo { 
                            width: 120px; 
                            height: auto; 
                        }
                        .company-name { font-size: 18px; font-weight: bold; margin: 0; }
                        .report-title { font-size: 14px; margin: 0; color: #555; }
                        .user-info { font-size: 10px; margin: 0; padding: 1px 0; }
                        
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        .center { text-align: center; }
                    </style>
                </head>
                <body>
                    <header>
                        <div class="header-flex-container">
                            <div class="header-left">
                                <img src="${logoBase64}" class="logo" />
                            </div>
                            <div class="header-center">
                                <p class="company-name">FABINHO EVENTOS</p>
                                <p class="report-title">Relatório de Estoque Atual</p>
                            </div>
                            <div class="header-right">
                                <p class="user-info">Gerado por: ${operatorName}</p>
                                <p class="user-info">${reportDate}</p>
                            </div>
                        </div>
                    </header>

                    <main>
                        <table>
                            <thead>
                                <tr>
                                    <th>Produto (Descrição)</th>
                                    <th class="center">Estoque (Caixas)</th>
                                    <th class="center">Estoque (Unidades Avulsas)</th>
                                    <th class="center">Último Inventário</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productRows}
                            </tbody>
                        </table>
                    </main>

                    <footer>
                        <p>Fabinho Eventos - Gestão de bar em eventos</p>
                    </footer>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Relatório de Estoque' });
        } catch (error) {
            Alert.alert("Erro", "Não foi possível gerar ou compartilhar o PDF.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setIsLoading(true);
        const inventory = await fetchInventoryData();
        if (!inventory) {
            setIsLoading(false);
            return;
        }
        
        let dataToExport = [
            ['Produto (Descrição)', 'Qtd por Caixa', 'Estoque (Caixas)', 'Estoque (Unidades Avulsas)', 'Último Inventário']
        ];

        inventory.forEach(p => {
            dataToExport.push([
                `${p.productName} (cx.${p.unitsPerBox})`,
                p.unitsPerBox,
                p.boxStock,
                p.unitStock,
                formatDateOnly(p.lastVerified)
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Estoque");

        const base64 = XLSX.write(wb, { type: "base64", bookType: 'xlsx' });
        const uri = FileSystem.cacheDirectory + 'relatorio_estoque.xlsx';

        try {
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
            await Sharing.shareAsync(uri, { 
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                dialogTitle: 'Compartilhar Relatório de Estoque',
                UTI: 'com.microsoft.excel.xlsx' 
            });
        } catch (error) {
            Alert.alert("Erro", "Não foi possível gerar ou compartilhar o arquivo Excel.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Relatórios</Text>
            {isLoading && <ActivityIndicator size="large" color="#1E63B8" style={{ marginBottom: 20 }} />}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Exportar Estoque Atual</Text>
                <Text style={styles.cardDescription}>
                    Gere um arquivo PDF ou uma planilha Excel (.xlsx) com a posição atual de todos os produtos no inventário.
                </Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={[styles.button, styles.pdfButton]} 
                        onPress={handleExportPDF}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Exportar PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.excelButton]} 
                        onPress={handleExportExcel}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>Exportar Excel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8', padding: 15 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#0D1B2A' },
    card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, elevation: 3, marginHorizontal: 5 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E63B8', marginBottom: 10 },
    cardDescription: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 20 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    button: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
    pdfButton: { backgroundColor: '#d9534f', marginRight: 10 },
    excelButton: { backgroundColor: '#5cb85c', marginLeft: 10 },
    buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});