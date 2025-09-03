// frontend/screens/ClosingHistoryScreen.js (Versão Final com Detalhes e Contador)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://192.168.15.34:3001';


const formatDateTime = (isoString) => {
    if (!isoString) return 'Data indisponível';
    if (String(isoString).includes('/')) return isoString;
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const currencyFormat = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const DetailRow = ({ label, value, isFinal = false, color = '#333' }) => (
    <View style={[styles.detailRow, isFinal && styles.finalRow]}>
        <Text style={[styles.detailLabel, isFinal && styles.finalLabel]}>{label}</Text>
        <Text style={[styles.detailValue, isFinal && styles.finalValue, { color }]}>
            {currencyFormat(value)}
        </Text>
    </View>
);

export default function ClosingHistoryScreen() {
    const [closings, setClosings] = useState([]);
    const [filteredClosings, setFilteredClosings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEvent, setActiveEvent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            const fetchClosings = async () => {
                setIsLoading(true);
                setSearchQuery('');
                try {
                    const event = await AsyncStorage.getItem('activeEvent');
                    if (!event) {
                        Alert.alert("Erro", "Nenhum evento ativo selecionado.");
                        return;
                    }
                    setActiveEvent(event);
                    const response = await axios.get(`${API_URL}/api/closings?eventName=${encodeURIComponent(event)}`);
                    setClosings(response.data);
                    setFilteredClosings(response.data);
                } catch (error) {
                    console.error("Erro ao buscar histórico:", error);
                    Alert.alert("Erro", "Não foi possível carregar o histórico de fechamentos.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchClosings();
        }, [])
    );

    useEffect(() => {
        if (searchQuery === '') {
            setFilteredClosings(closings);
        } else {
            const lowercasedQuery = searchQuery.toLowerCase();
            const filteredData = closings.filter(item => {
                const name = (item.waiterName || item.cashierName || '').toLowerCase();
                const protocol = (item.protocol || '').toLowerCase();
                return name.includes(lowercasedQuery) || protocol.includes(lowercasedQuery);
            });
            setFilteredClosings(filteredData);
        }
    }, [searchQuery, closings]);
    
    const showDetails = (item) => {
        let details = `Protocolo: ${item.protocol}\n`;
        details += `Data: ${formatDateTime(item.timestamp)}\n`;
        details += `Evento: ${item.eventName}\n`;
        details += `Operador: ${item.operatorName}\n\n`;

        if (item.type === 'waiter') {
            details += `Tipo: Garçom\n`;
            details += `Garçom: ${item.waiterName}\n\n`;
            details += `Valor Total: ${currencyFormat(item.valorTotal)}\n`;
            details += `Crédito: ${currencyFormat(item.credito)}\n`;
            details += `Débito: ${currencyFormat(item.debito)}\n`;
            details += `PIX: ${currencyFormat(item.pix)}\n`;
            details += `Cashless: ${currencyFormat(item.cashless)}\n\n`;
            details += `Comissão Total: ${currencyFormat(item.comissaoTotal)}\n`;
            details += `${item.acertoLabel} ${currencyFormat(item.valorAcerto)}\n`;
        } else {
            details += `Tipo: Caixa\n`;
            details += `Caixa: ${item.cashierName}\n\n`;
            details += `Venda Total: ${currencyFormat(item.valorTotalVenda)}\n`;
            details += `Crédito: ${currencyFormat(item.credito)}\n`;
            details += `Débito: ${currencyFormat(item.debito)}\n`;
            details += `PIX: ${currencyFormat(item.pix)}\n`;
            details += `Cashless: ${currencyFormat(item.cashless)}\n`;
            details += `Dinheiro Contado: ${currencyFormat(item.dinheiroFisico)}\n\n`;
            details += `Diferença: ${currencyFormat(item.diferenca)}\n`;
        }
        
        Alert.alert(`Detalhes - ${item.protocol}`, details);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => showDetails(item)}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Protocolo: {item.protocol}</Text>
                <View style={[styles.badge, { backgroundColor: item.type === 'waiter' ? '#007bff' : '#28a745' }]}>
                    <Text style={styles.badgeText}>{item.type === 'waiter' ? 'Garçom' : 'Caixa'}</Text>
                </View>
            </View>
            <Text style={styles.cardText}>
                {item.type === 'waiter' ? `Garçom: ${item.waiterName}` : `Caixa: ${item.cashierName}`}
            </Text>
            <Text style={styles.cardDate}>{formatDateTime(item.timestamp)}</Text>
            
            <View style={styles.detailsContainer}>
                {item.type === 'waiter' ? (
                    <>
                        <DetailRow label="Valor Total:" value={item.valorTotal} />
                        <DetailRow label="Comissão Total:" value={item.comissaoTotal} />
                        <DetailRow label={item.acertoLabel} value={item.valorAcerto} isFinal={true} />
                    </>
                ) : (
                    <>
                        <DetailRow label="Venda Total:" value={item.valorTotalVenda} />
                        <DetailRow label="Diferença:" value={item.diferenca} isFinal={true} color={item.diferenca < 0 ? '#d9534f' : '#5cb85c'} />
                    </>
                )}
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return <View style={styles.center}><ActivityIndicator size="large" /><Text>Carregando histórico...</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>Histórico para: <Text style={styles.eventHighlight}>{activeEvent}</Text></Text>
                <Text style={styles.closingsCount}>({filteredClosings.length} fechamentos)</Text>
            </View>
            
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nome ou protocolo..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                data={filteredClosings}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.protocol}-${index}`}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum resultado encontrado.</Text>}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    titleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0D1B2A',
    },
    eventHighlight: { color: '#1E63B8' },
    closingsCount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'red',
        marginTop: 4,
    },
    searchInput: {
        height: 50, backgroundColor: '#FFFFFF', marginHorizontal: 15,
        marginBottom: 10, paddingHorizontal: 15, borderRadius: 10,
        borderWidth: 1, borderColor: '#DDE3EA', fontSize: 16,
    },
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20,
        marginHorizontal: 15, marginBottom: 15, elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 5,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D1B2A' },
    cardText: { fontSize: 16, color: '#333', marginTop: 5 },
    cardDate: { fontSize: 14, color: '#6c757d', marginTop: 10, fontStyle: 'italic' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
    badge: {
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 12,
    },
    badgeText: {
        color: '#FFFFFF', fontSize: 12, fontWeight: 'bold',
    },
    detailsContainer: {
        borderTopWidth: 1, borderTopColor: '#EEE',
        marginTop: 15, paddingTop: 10,
    },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5,
    },
    detailLabel: {
        fontSize: 16, color: '#555',
    },
    detailValue: {
        fontSize: 16, fontWeight: 'bold', color: '#333',
    },
    finalRow: {
        marginTop: 8,
    },
    finalLabel: {
        fontSize: 18, fontWeight: 'bold',
    },
    finalValue: {
        fontSize: 18, fontWeight: 'bold',
    },
});