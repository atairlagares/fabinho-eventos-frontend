// frontend/screens/AuditScreen.js

import React, { useState, useCallback, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, FlatList, 
    ActivityIndicator, TextInput, RefreshControl, Alert, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const API_URL = 'http://192.168.15.34:3001';

const getTypeStyle = (type) => {
    switch (type) {
        case 'ENTRADA':
        case 'COMPRA_FORNECEDOR':
        case 'RETORNO_EVENTO':
            return { color: '#5cb85c', name: 'Entrada' };
        case 'SAÍDA':
        case 'VENDA_DIRETA':
        case 'SAIDA_EVENTO':
        case 'ALUGUEL_MATERIAL':
            return { color: '#d9534f', name: 'Saída' };
        case 'DEVOLUÇÃO':
            return { color: '#f0ad4e', name: 'Devolução' };
        case 'INVENTÁRIO':
            return { color: '#007bff', name: 'Inventário' };
        default:
            return { color: '#6c757d', name: type };
    }
};

export default function AuditScreen({ navigation }) {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'entrada', 'saida', 'devolucao', 'inventario'

    const fetchLogs = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stock/audit`);
            setLogs(response.data);
            setFilteredLogs(response.data);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar os registros de auditoria.");
        }
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            setIsLoading(true);
            fetchLogs().finally(() => setIsLoading(false));
        }, [fetchLogs])
    );
    
    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchLogs();
        setIsRefreshing(false);
    }, [fetchLogs]);

    useEffect(() => {
        let list = [...logs];

        if (filterType !== 'all') {
            list = list.filter(item => {
                const typeStyle = getTypeStyle(item.type);
                return typeStyle.name.toLowerCase() === filterType;
            });
        }

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            list = list.filter(item => 
                (item.productName || '').toLowerCase().includes(lowercasedQuery) ||
                (item.registrationName || '').toLowerCase().includes(lowercasedQuery)
            );
        }
        setFilteredLogs(list);
    }, [searchQuery, filterType, logs]);

    const handleReprint = async (item) => {
        if (item.type === 'INVENTÁRIO') return; // Inventário não tem comprovante
        try {
            const response = await axios.get(`${API_URL}/api/stock/transaction/${item.id}`);
            navigation.navigate('TransactionReport', { details: response.data });
        } catch (error) {
            Alert.alert("Erro", "Não foi possível buscar os detalhes da transação para reimprimir.");
        }
    };

    const renderItem = ({ item }) => {
        const typeStyle = getTypeStyle(item.type);
        return (
            <TouchableOpacity style={styles.card} onPress={() => handleReprint(item)} disabled={item.type === 'INVENTÁRIO'}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.typeText, { color: typeStyle.color }]}>{typeStyle.name}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.detailText}>
                    <Text style={styles.bold}>{item.type === 'INVENTÁRIO' ? 'Detalhe:' : 'Para:'}</Text> {item.registrationName}
                </Text>
                <Text style={styles.detailText}>
                    <Text style={styles.bold}>Operador:</Text> {item.operator}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar por produto ou cliente..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <View style={styles.filterContainer}>
                <TouchableOpacity onPress={() => setFilterType('all')} style={[styles.filterButton, filterType === 'all' && styles.activeFilter]}><Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>Todos</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('entrada')} style={[styles.filterButton, filterType === 'entrada' && styles.activeFilter]}><Text style={[styles.filterText, filterType === 'entrada' && styles.activeFilterText]}>Entrada</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('saída')} style={[styles.filterButton, filterType === 'saída' && styles.activeFilter]}><Text style={[styles.filterText, filterType === 'saída' && styles.activeFilterText]}>Saída</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('devolução')} style={[styles.filterButton, filterType === 'devolução' && styles.activeFilter]}><Text style={[styles.filterText, filterType === 'devolução' && styles.activeFilterText]}>Devolução</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('inventário')} style={[styles.filterButton, filterType === 'inventário' && styles.activeFilter]}><Text style={[styles.filterText, filterType === 'inventário' && styles.activeFilterText]}>Inventário</Text></TouchableOpacity>
            </View>
            {isLoading ? <ActivityIndicator size="large" color="#1E63B8" /> :
            <FlatList
                data={filteredLogs}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum registro encontrado.</Text>}
                contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
                refreshControl={ <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#1E63B8"]} /> }
            />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchInput: { height: 50, backgroundColor: '#FFFFFF', margin: 15, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DDE3EA', fontSize: 16 },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 15, marginBottom: 15, backgroundColor: '#e9ecef', borderRadius: 10 },
    filterButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    activeFilter: { backgroundColor: '#1E63B8', borderRadius: 8 },
    filterText: { fontWeight: 'bold', color: '#333', fontSize: 12 },
    activeFilterText: { color: '#FFF' },
    card: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10, marginBottom: 10 },
    typeText: { fontSize: 16, fontWeight: 'bold' },
    dateText: { fontSize: 12, color: '#6c757d' },
    productName: { fontSize: 18, fontWeight: 'bold', color: '#0D1B2A', marginBottom: 8 },
    detailText: { fontSize: 14, color: '#343a40', lineHeight: 22 },
    bold: { fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});