// frontend/screens/TransactionEntryScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../config';


const AutocompleteInput = ({ label, placeholder, data, onSelect, text, setText, selectedItem }) => (
    <View>
        <Text style={styles.label}>{label}</Text>
        <TextInput style={styles.input} placeholder={placeholder} value={text} onChangeText={setText} />
        {!selectedItem && text.length > 0 && (
            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.suggestionItem} onPress={() => onSelect(item)}>
                        <Text>{item.name}</Text>
                    </TouchableOpacity>
                )}
                scrollEnabled={false} nestedScrollEnabled={true}
            />
        )}
    </View>
);

export default function TransactionEntryScreen({ route, navigation }) {
    const { type, title } = route.params;

    const [notes, setNotes] = useState('');
    const [boxQuantity, setBoxQuantity] = useState('');
    const [unitQuantity, setUnitQuantity] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [items, setItems] = useState([]);
    
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [registrations, setRegistrations] = useState([]);
    const [registrationSearch, setRegistrationSearch] = useState('');
    const [filteredRegistrations, setFilteredRegistrations] = useState([]);
    const [selectedRegistration, setSelectedRegistration] = useState(null);

    const [editingIndex, setEditingIndex] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, registrationsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/stock/inventory`),
                    axios.get(`${API_URL}/api/stock/registrations`)
                ]);
                setProducts(productsRes.data);
                
                if (type === 'SAIDA_EVENTO' || type === 'RETORNO_EVENTO') {
                    setRegistrations(registrationsRes.data.filter(r => r.type === 'EVENTO').map(r => ({ id: r.id, name: r.name })));
                } else {
                    setRegistrations(registrationsRes.data.filter(r => r.type !== 'EVENTO').map(r => ({ id: r.id, name: r.name })));
                }
            } catch (error) {
                Alert.alert("Erro", "Não foi possível carregar os dados.");
            }
        };
        fetchData();
    }, [type]);

    useEffect(() => {
        if (!selectedProduct && productSearch) setFilteredProducts(products.map(p => ({ id: p.productId, name: p.productName })).filter(p => p.name && p.name.toLowerCase().includes(productSearch.toLowerCase())));
        else setFilteredProducts([]);
    }, [productSearch, products, selectedProduct]);

    useEffect(() => {
        if (!selectedRegistration && registrationSearch) setFilteredRegistrations(registrations.filter(r => r.name && r.name.toLowerCase().includes(registrationSearch.toLowerCase())));
        else setFilteredRegistrations([]);
    }, [registrationSearch, registrations, selectedRegistration]);

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setProductSearch(product.name);
    };

    const handleSelectRegistration = (reg) => {
        setSelectedRegistration(reg);
        setRegistrationSearch(reg.name);
    };

    const handleAddItem = () => {
        if (!selectedProduct || (!boxQuantity && !unitQuantity)) {
            Alert.alert("Erro", "Selecione um produto e informe a quantidade.");
            return;
        }

        const fullProduct = products.find(p => p.productId === selectedProduct.id);
        if (!fullProduct) {
            Alert.alert("Erro", "Produto não encontrado. Tente selecionar novamente.");
            return;
        }

        const totalUnitsRequested = (parseInt(boxQuantity, 10) || 0) * fullProduct.unitsPerBox + (parseInt(unitQuantity, 10) || 0);
        const totalUnitsInStock = (fullProduct.boxStock * fullProduct.unitsPerBox) + fullProduct.unitStock;

        const isEntry = type.includes('COMPRA') || type.includes('RETORNO');

        if (!isEntry && totalUnitsRequested > totalUnitsInStock) {
            Alert.alert(
                "Estoque Insuficiente",
                `Você tentou dar saída de ${totalUnitsRequested} unidades, mas só existem ${totalUnitsInStock} disponíveis para "${fullProduct.productName}". O item não será adicionado.`
            );
            return;
        }

        const newItem = {
            productId: selectedProduct.id, productName: selectedProduct.name,
            boxQuantity: parseInt(boxQuantity, 10) || 0,
            unitQuantity: parseInt(unitQuantity, 10) || 0,
        };
        if (editingIndex !== null) {
            const updatedItems = [...items];
            updatedItems[editingIndex] = newItem;
            setItems(updatedItems);
            setEditingIndex(null);
        } else {
            setItems([...items, newItem]);
        }
        setSelectedProduct(null); setProductSearch('');
        setBoxQuantity(''); setUnitQuantity('');
    };

    const handleEditItem = (item, index) => {
        setEditingIndex(index);
        setSelectedProduct({ id: item.productId, name: item.productName });
        setProductSearch(item.productName);
        setBoxQuantity(item.boxQuantity.toString());
        setUnitQuantity(item.unitQuantity.toString());
    };

    const handleDeleteItem = (index) => {
        const updatedItems = [...items];
        updatedItems.splice(index, 1);
        setItems(updatedItems);
    };
    
    const handleSave = async () => {
        if (items.length === 0 || !selectedRegistration) {
            Alert.alert("Erro", "Adicione itens e selecione um destino/origem.");
            return;
        }
        if (type === 'ALUGUEL_MATERIAL' && !returnDate) {
            Alert.alert("Erro", "A data de devolução é obrigatória para aluguel.");
            return;
        }

        setIsSaving(true);
        try {
            const operatorName = await AsyncStorage.getItem('loggedInUserName');
            const data = {
                type, registrationId: selectedRegistration.id,
                notes, operatorName, products: items,
                returnDate: type === 'ALUGUEL_MATERIAL' ? returnDate : null,
            };

            const response = await axios.post(`${API_URL}/api/stock/movements`, data);
            navigation.navigate('TransactionReport', { details: response.data.details });
            setItems([]); setNotes(''); setReturnDate('');
            setSelectedRegistration(null); setRegistrationSearch('');
        } catch (error) {
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>{title}</Text>
                <View style={styles.formContainer}>
                    <AutocompleteInput 
                        label={type.includes('EVENTO') ? "Evento" : (type.includes('COMPRA') ? "Fornecedor" : "Cliente")}
                        placeholder="Busque pelo nome..."
                        data={filteredRegistrations}
                        onSelect={handleSelectRegistration}
                        text={registrationSearch}
                        setText={(text) => { setRegistrationSearch(text); setSelectedRegistration(null); }}
                        selectedItem={selectedRegistration}
                    />
                    {type === 'ALUGUEL_MATERIAL' && (
                        <>
                            <Text style={styles.label}>Data de Devolução</Text>
                            <TextInput style={styles.input} placeholder="DD/MM/AAAA" value={returnDate} onChangeText={setReturnDate} />
                        </>
                    )}
                </View>
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>{editingIndex !== null ? "Editando Item" : "Adicionar Itens"}</Text>
                    <AutocompleteInput label="Produto" placeholder="Busque pelo nome do produto" data={filteredProducts} onSelect={handleSelectProduct} text={productSearch} setText={(text) => {setProductSearch(text); setSelectedProduct(null);}} selectedItem={selectedProduct} />
                    <View style={styles.quantityRow}>
                        <TextInput style={styles.quantityInput} placeholder="Caixas" value={boxQuantity} onChangeText={setBoxQuantity} keyboardType="numeric" />
                        <TextInput style={styles.quantityInput} placeholder="Unidades" value={unitQuantity} onChangeText={setUnitQuantity} keyboardType="numeric" />
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                        <Text style={styles.addButtonText}>{editingIndex !== null ? "ATUALIZAR ITEM" : "ADICIONAR ITEM"}</Text>
                    </TouchableOpacity>
                </View>
                {items.length > 0 && (
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Itens na Lista</Text>
                        {items.map((item, index) => (
                            <View key={index} style={styles.itemCard}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <Text style={styles.itemQuantity}>{item.boxQuantity} cx / {item.unitQuantity} un</Text>
                                </View>
                                <View style={styles.itemActions}>
                                    <TouchableOpacity onPress={() => handleEditItem(item, index)}><Text style={styles.editButton}>Editar</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteItem(index)}><Text style={styles.deleteButton}>Excluir</Text></TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Observações</Text>
                    <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top'}]} multiline value={notes} onChangeText={setNotes} />
                    <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
                        <Text style={styles.saveButtonText}>{isSaving ? "PROCESSANDO..." : "GERAR COMPROVANTE"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    formContainer: { backgroundColor: '#FFF', padding: 20, marginHorizontal: 15, borderRadius: 10, elevation: 3, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E63B8', marginBottom: 15 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#F7F9FC', padding: 15, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#DDE3EA', marginBottom: 5 },
    addButton: { backgroundColor: '#1E63B8', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    addButtonText: { color: '#FFF', fontWeight: 'bold' },
    saveButton: { backgroundColor: '#28a745', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    disabledButton: { backgroundColor: '#a5d6a7' },
    saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    quantityRow: { flexDirection: 'row', marginTop: 10 },
    quantityInput: { flex: 1, backgroundColor: '#F7F9FC', padding: 15, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#DDE3EA', marginRight: 10 },
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
    itemName: { fontSize: 16, flex: 1 },
    itemQuantity: { fontSize: 14, color: 'gray' },
    itemActions: { flexDirection: 'row' },
    editButton: { color: '#1E63B8', fontWeight: 'bold', marginRight: 15 },
    deleteButton: { color: '#dc3545', fontWeight: 'bold' },
});