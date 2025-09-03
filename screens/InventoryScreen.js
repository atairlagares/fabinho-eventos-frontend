// frontend/screens/InventoryScreen.js

import React, { useState, useCallback, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TextInput, 
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert, FlatList, ActivityIndicator,
    ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.15.34:3001';



// Componente para o item da lista de inventário
const InventoryItem = ({ item, onUpdate }) => {
    const [boxCount, setBoxCount] = useState(item.boxStock.toString());
    const [unitCount, setUnitCount] = useState(item.unitStock.toString());
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            const operatorName = await AsyncStorage.getItem('loggedInUserName');
            const updateData = {
                productId: item.productId,
                newBoxStock: parseInt(boxCount, 10) || 0,
                newUnitStock: parseInt(unitCount, 10) || 0,
                operatorName,
            };
            await axios.post(`${API_URL}/api/stock/inventory/update`, updateData);
            onUpdate(item.productId, parseInt(boxCount, 10) || 0, parseInt(unitCount, 10) || 0);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível atualizar o estoque.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <View style={[styles.productCard, item.verified ? styles.verifiedCard : styles.unverifiedCard]}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.lastVerified}>Última contagem: {item.lastVerified || 'Nunca'}</Text>
            <View style={styles.stockRow}>
                <View style={styles.stockInputContainer}>
                    <Text style={styles.label}>Caixas</Text>
                    <TextInput style={styles.input} value={boxCount} onChangeText={setBoxCount} keyboardType="numeric" />
                </View>
                <View style={styles.stockInputContainer}>
                    <Text style={styles.label}>Unidades</Text>
                    <TextInput style={styles.input} value={unitCount} onChangeText={setUnitCount} keyboardType="numeric" />
                </View>
            </View>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={isUpdating}>
                <Text style={styles.updateButtonText}>{isUpdating ? 'ATUALIZANDO...' : 'ATUALIZAR'}</Text>
            </TouchableOpacity>
        </View>
    );
};

// Componente para o formulário de cadastro de novo produto
const NewProductForm = ({ onProductAdded }) => {
    const [productName, setProductName] = useState('');
    const [unitsPerBox, setUnitsPerBox] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveProduct = async () => {
        if (!productName || !unitsPerBox) {
            Alert.alert("Erro", "Preencha Nome do Produto e Unidades por Caixa.");
            return;
        }
        setIsSaving(true);
        try {
            const productData = { productName, unitsPerBox, boxStock: 0, unitStock: 0 };
            const response = await axios.post(`${API_URL}/api/stock/inventory`, productData);
            Alert.alert("Sucesso", `Produto "${response.data.productName}" cadastrado!`);
            setProductName('');
            setUnitsPerBox('');
            onProductAdded();
        } catch (error) {
            Alert.alert("Erro", "Não foi possível salvar o produto.");
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <View style={styles.formContainer}>
            <Text style={styles.label}>Nome do Produto</Text>
            <TextInput style={styles.input} placeholder="Ex: Cerveja Original 600ml" value={productName} onChangeText={setProductName} />
            <Text style={styles.label}>Unidades por Caixa</Text>
            <TextInput style={styles.input} placeholder="Ex: 12" value={unitsPerBox} onChangeText={setUnitsPerBox} keyboardType="numeric" />
            <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabledButton]} onPress={handleSaveProduct} disabled={isSaving}>
                <Text style={styles.saveButtonText}>{isSaving ? "SALVANDO..." : "CADASTRAR PRODUTO"}</Text>
            </TouchableOpacity>
        </View>
    );
};


export default function InventoryScreen() {
    const [activeTab, setActiveTab] = useState('inventory');
    const [inventoryList, setInventoryList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'verified'

    const fetchInventory = useCallback(async () => {
        try {
            setIsLoadingList(true);
            const response = await axios.get(`${API_URL}/api/stock/inventory`);
            setInventoryList(response.data.map(p => ({ ...p, verified: false })));
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar a lista de produtos.");
        } finally {
            setIsLoadingList(false);
        }
    }, []);
    
    useFocusEffect(
        React.useCallback(() => {
            fetchInventory();
        }, [fetchInventory])
    );

    // Lógica central de filtragem
    useEffect(() => {
        let list = [...inventoryList];

        // Filtra por status (pendente/verificado)
        if (filterStatus === 'pending') {
            list = list.filter(item => !item.verified);
        } else if (filterStatus === 'verified') {
            list = list.filter(item => item.verified);
        }

        // Filtra pela busca de texto
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            list = list.filter(item => item.productName.toLowerCase().includes(lowercasedQuery));
        }

        setFilteredList(list);
    }, [searchQuery, filterStatus, inventoryList]);
    
    // Atualiza o item na lista principal
    const handleProductUpdate = (productId, newBoxStock, newUnitStock) => {
        setInventoryList(prevList =>
            prevList.map(p => 
                p.productId === productId ? { ...p, verified: true, boxStock: newBoxStock, unitStock: newUnitStock } : p
            )
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity onPress={() => setActiveTab('inventory')} style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>REALIZAR INVENTÁRIO</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('register')} style={[styles.tab, activeTab === 'register' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>CADASTRAR PRODUTO</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'inventory' ? (
                <>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar produto..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <View style={styles.filterContainer}>
                        <TouchableOpacity onPress={() => setFilterStatus('all')} style={[styles.filterButton, filterStatus === 'all' && styles.activeFilter]}>
                            <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.activeFilterText]}>Todos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setFilterStatus('pending')} style={[styles.filterButton, filterStatus === 'pending' && styles.activeFilter]}>
                            <Text style={[styles.filterButtonText, filterStatus === 'pending' && styles.activeFilterText]}>Pendentes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setFilterStatus('verified')} style={[styles.filterButton, filterStatus === 'verified' && styles.activeFilter]}>
                            <Text style={[styles.filterButtonText, filterStatus === 'verified' && styles.activeFilterText]}>Verificados</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoadingList ? <ActivityIndicator size="large" color="#1E63B8" style={{ marginTop: 50 }} /> :
                    <FlatList
                        data={filteredList}
                        renderItem={({ item }) => <InventoryItem item={item} onUpdate={handleProductUpdate} />}
                        keyExtractor={(item) => item.productId}
                        ListEmptyComponent={<Text style={styles.placeholderText}>Nenhum produto encontrado.</Text>}
                        contentContainerStyle={{ paddingHorizontal: 15 }}
                    />}
                </>
            ) : (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        <NewProductForm onProductAdded={() => {
                            fetchInventory();
                            setActiveTab('inventory');
                        }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2 },
  tab: { flex: 1, padding: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#1E63B8' },
  tabText: { fontSize: 14, color: '#666' },
  activeTabText: { fontWeight: 'bold', color: '#1E63B8' },
  formContainer: { backgroundColor: '#FFFFFF', padding: 20, margin: 15, borderRadius: 10 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#F7F9FC', padding: 15, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#DDE3EA', marginBottom: 15 },
  saveButton: { backgroundColor: '#28a745', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#a5d6a7' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  placeholderText: { textAlign: 'center', color: 'gray', marginTop: 40 },
  productCard: {
      backgroundColor: '#FFFFFF', padding: 15, marginBottom: 10, borderRadius: 8,
      borderLeftWidth: 5, elevation: 1
  },
  unverifiedCard: { borderColor: '#d9534f' },
  verifiedCard: { borderColor: '#5cb85c' },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  lastVerified: { fontSize: 12, color: 'gray', fontStyle: 'italic', marginVertical: 5 },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  stockInputContainer: { flex: 1, marginRight: 10 },
  updateButton: { backgroundColor: '#1E63B8', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  updateButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  searchInput: {
    height: 50, backgroundColor: '#FFFFFF', marginHorizontal: 15, marginTop: 15,
    paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DDE3EA', fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: '#1E63B8',
  },
  filterButtonText: {
    fontWeight: 'bold',
    color: '#333'
  },
  activeFilterText: {
    color: '#FFFFFF'
  }
});

