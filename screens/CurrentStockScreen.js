// frontend/screens/CurrentStockScreen.js

import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, FlatList, 
    ActivityIndicator, TextInput, RefreshControl 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const API_URL = 'http://192.168.15.34:3001';



// Função para calcular o estoque total em unidades
const calculateTotalUnits = (item) => {
    const unitsPerBox = item.unitsPerBox || 0;
    const boxStock = item.boxStock || 0;
    const unitStock = item.unitStock || 0;
    return (boxStock * unitsPerBox) + unitStock;
};

export default function CurrentStockScreen() {
    // Estados da lista
    const [inventory, setInventory] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    
    // Estados de controle
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Busca os dados do inventário
    const fetchInventory = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stock/inventory`);
            setInventory(response.data);
            setFilteredInventory(response.data); // Inicia a lista filtrada com todos os produtos
        } catch (error) {
            console.error("Erro ao buscar inventário:", error);
            Alert.alert("Erro", "Não foi possível carregar o inventário.");
        }
    }, []);

    // Busca os dados ao entrar na tela
    useFocusEffect(
        React.useCallback(() => {
            setIsLoading(true);
            fetchInventory().finally(() => setIsLoading(false));
        }, [fetchInventory])
    );
    
    // Lógica para o "puxar para atualizar"
    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchInventory();
        setIsRefreshing(false);
    }, [fetchInventory]);

    // Filtra a lista com base na busca
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query) {
            const filteredData = inventory.filter(item => 
                item.productName.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredInventory(filteredData);
        } else {
            setFilteredInventory(inventory);
        }
    };

    // Renderiza cada card de produto
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.productName}>{item.productName}</Text>
            <View style={styles.stockDetails}>
                <View style={styles.stockItem}>
                    <Text style={styles.stockLabel}>Caixas</Text>
                    <Text style={styles.stockValue}>{item.boxStock}</Text>
                </View>
                <View style={styles.stockItem}>
                    <Text style={styles.stockLabel}>Unidades</Text>
                    <Text style={styles.stockValue}>{item.unitStock}</Text>
                </View>
                <View style={styles.stockItemTotal}>
                    <Text style={styles.stockLabelTotal}>Total Unid.</Text>
                    <Text style={styles.stockValueTotal}>{calculateTotalUnits(item)}</Text>
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#1E63B8" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <TextInput
                style={styles.searchInput}
                placeholder="Buscar produto..."
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <FlatList
                data={filteredInventory}
                renderItem={renderItem}
                keyExtractor={(item) => item.productId}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum produto encontrado.</Text>}
                contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#1E63B8"]} />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchInput: {
        height: 50,
        backgroundColor: '#FFFFFF',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DDE3EA',
        fontSize: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0D1B2A',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 10,
    },
    stockDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    stockItem: {
        alignItems: 'center',
    },
    stockItemTotal: {
        alignItems: 'center',
        backgroundColor: '#e9f5ff',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 8,
    },
    stockLabel: {
        fontSize: 14,
        color: '#6c757d',
    },
    stockLabelTotal: {
        fontSize: 14,
        color: '#1E63B8',
        fontWeight: 'bold',
    },
    stockValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#343a40',
        marginTop: 5,
    },
    stockValueTotal: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E63B8',
        marginTop: 5,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: 'gray',
    },
});