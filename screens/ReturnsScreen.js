// frontend/screens/ReturnsScreen.js

import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TextInput, 
    TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, FlatList
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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

export default function ReturnsScreen({ navigation }) {
    const [notes, setNotes] = useState('');
    const [boxQuantity, setBoxQuantity] = useState('');
    const [unitQuantity, setUnitQuantity] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [returnedItems, setReturnedItems] = useState([]);
    
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [registrations, setRegistrations] = useState([]);
    const [registrationSearch, setRegistrationSearch] = useState('');
    const [filteredRegistrations, setFilteredRegistrations] = useState([]);
    const [selectedRegistration, setSelectedRegistration] = useState(null);

    const [events, setEvents] = useState([]);
    const [eventSearch, setEventSearch] = useState('');
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [editingIndex, setEditingIndex] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                try {
                    const [productsRes, registrationsRes] = await Promise.all([
                        axios.get(`${API_URL}/api/stock/inventory`),
                        axios.get(`${API_URL}/api/stock/registrations`)
                    ]);
                    // << CORREÇÃO AQUI: Padroniza os dados do produto para um formato consistente { id, name }
                    setProducts(productsRes.data.map(p => ({ id: p.productId, name: p.productName })));

                    const allRegistrations = registrationsRes.data;
                    setRegistrations(allRegistrations.filter(r => r.type !== 'EVENTO').map(r => ({ id: r.id, name: r.name })));
                    setEvents(allRegistrations.filter(r => r.type === 'EVENTO').map(r => ({ id: r.id, name: r.name })));
                } catch (error) {
                    Alert.alert("Erro", "Não foi possível carregar os dados.");
                }
            };
            fetchData();
        }, [])
    );

    // << CORREÇÃO AQUI: Filtro de produtos mais seguro e usando a propriedade 'name' padronizada
    useEffect(() => {
        if (!selectedProduct && productSearch) {
             setFilteredProducts(products.filter(p => p.name && p.name.toLowerCase().includes(productSearch.toLowerCase())));
        } else {
            setFilteredProducts([]);
        }
    }, [productSearch, products, selectedProduct]);

    useEffect(() => {
        if (!selectedRegistration && registrationSearch) setFilteredRegistrations(registrations.filter(r => r.name && r.name.toLowerCase().includes(registrationSearch.toLowerCase())));
        else setFilteredRegistrations([]);
    }, [registrationSearch, registrations, selectedRegistration]);
    
    useEffect(() => {
        if (!selectedEvent && eventSearch) setFilteredEvents(events.filter(e => e.name && e.name.toLowerCase().includes(eventSearch.toLowerCase())));
        else setFilteredEvents([]);
    }, [eventSearch, events, selectedEvent]);

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setProductSearch(product.name);
    };
    const handleSelectRegistration = (reg) => {
        setSelectedRegistration(reg);
        setRegistrationSearch(reg.name);
    };
    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setEventSearch(event.name);
    };

    const handleAddItem = () => {
        if (!selectedProduct || (!boxQuantity && !unitQuantity)) {
            Alert.alert("Erro", "Selecione um produto e informe a quantidade.");
            return;
        }
        const newItem = {
            productId: selectedProduct.id, productName: selectedProduct.name,
            boxQuantity: parseInt(boxQuantity, 10) || 0,
            unitQuantity: parseInt(unitQuantity, 10) || 0,
        };
        if (editingIndex !== null) {
            const updatedItems = [...returnedItems];
            updatedItems[editingIndex] = newItem;
            setReturnedItems(updatedItems);
            setEditingIndex(null);
        } else {
            setReturnedItems([...returnedItems, newItem]);
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
        const updatedItems = [...returnedItems];
        updatedItems.splice(index, 1);
        setReturnedItems(updatedItems);
    };
    
    const handleSaveReturn = async () => {
        if (returnedItems.length === 0 || !selectedRegistration || !selectedEvent) {
            Alert.alert("Erro", "Adicione itens, selecione o Fornecedor e o Evento de Origem.");
            return;
        }
        setIsSaving(true);
        try {
            const operatorName = await AsyncStorage.getItem('loggedInUserName');
            const returnData = {
                registrationId: selectedRegistration.id,
                eventId: selectedEvent.id,
                eventName: selectedEvent.name,
                notes, operatorName, products: returnedItems,
            };
            const response = await axios.post(`${API_URL}/api/stock/returns`, returnData);
            navigation.navigate('TransactionReport', { details: response.data.details });
            setReturnedItems([]); setNotes('');
            setSelectedRegistration(null); setRegistrationSearch('');
            setSelectedEvent(null); setEventSearch('');
        } catch (error) {
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível salvar a devolução.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>Registrar Devolução</Text>
                    <View style={styles.formContainer}>
                        <AutocompleteInput label="(Cliente/Fornecedor)" placeholder="Busque pelo nome ou razão social" data={filteredRegistrations} onSelect={handleSelectRegistration} text={registrationSearch} setText={(text) => { setRegistrationSearch(text); setSelectedRegistration(null); }} selectedItem={selectedRegistration} />
                        <AutocompleteInput label="Evento de Origem do Produto" placeholder="Busque pelo nome do evento" data={filteredEvents} onSelect={handleSelectEvent} text={eventSearch} setText={(text) => { setEventSearch(text); setSelectedEvent(null); }} selectedItem={selectedEvent} />
                    </View>
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>{editingIndex !== null ? "Editando Item" : "Adicionar Itens"}</Text>
                        <AutocompleteInput label="Produto Devolvido" placeholder="Busque pelo nome do produto" data={filteredProducts} onSelect={handleSelectProduct} text={productSearch} setText={(text) => { setProductSearch(text); setSelectedProduct(null); }} selectedItem={selectedProduct} />
                        <View style={styles.quantityRow}>
    <View style={{flex: 1, marginRight: 5}}>
        <Text style={styles.label}>Caixas</Text>
        <TextInput style={styles.quantityInput} value={boxQuantity} onChangeText={setBoxQuantity} keyboardType="numeric" />
    </View>
    <View style={{flex: 1, marginLeft: 5}}>
        <Text style={styles.label}>Unidades</Text>
        <TextInput style={styles.quantityInput} value={unitQuantity} onChangeText={setUnitQuantity} keyboardType="numeric" />
    </View>
</View>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                            <Text style={styles.addButtonText}>{editingIndex !== null ? "ATUALIZAR ITEM" : "ADICIONAR ITEM"}</Text>
                        </TouchableOpacity>
                    </View>
                    {returnedItems.length > 0 && (
                        <View style={styles.formContainer}>
                            <Text style={styles.sectionTitle}>Itens da Devolução</Text>
                            {returnedItems.map((item, index) => (
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
                        <Text style={styles.label}>Observações Gerais</Text>
                        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Motivo da devolução, etc." value={notes} onChangeText={setNotes} multiline />
                        <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabledButton]} onPress={handleSaveReturn} disabled={isSaving}>
                            <Text style={styles.saveButtonText}>{isSaving ? "PROCESSANDO..." : "GERAR COMPROVANTE"}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#0D1B2A', textAlign: 'center', marginVertical: 20 },
    formContainer: { backgroundColor: '#FFFFFF', padding: 20, marginHorizontal: 15, borderRadius: 10, elevation: 3, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E63B8', marginBottom: 15 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#F7F9FC', padding: 15, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#DDE3EA', marginBottom: 5 },
    addButton: { backgroundColor: '#1E63B8', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    addButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
    saveButton: { backgroundColor: '#f0ad4e', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    disabledButton: { backgroundColor: '#a5d6a7' },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    quantityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    quantityInput: { flex: 1, backgroundColor: '#F7F9FC', padding: 15, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#DDE3EA', marginRight: 10 },
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
    itemName: { fontSize: 16, flex: 1 },
    itemQuantity: { fontSize: 14, color: 'gray' },
    itemActions: { flexDirection: 'row' },
    editButton: { color: '#1E63B8', fontWeight: 'bold', marginRight: 15 },
    deleteButton: { color: '#dc3545', fontWeight: 'bold' },
});