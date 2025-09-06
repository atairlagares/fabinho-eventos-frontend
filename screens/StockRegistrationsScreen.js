// frontend/screens/StockRegistrationsScreen.js

import React, { useState, useCallback, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, FlatList, 
    ActivityIndicator, TextInput, TouchableOpacity, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { API_URL } from '../config';


export default function StockRegistrationsScreen({ navigation }) {
    const [registrations, setRegistrations] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    const fetchRegistrations = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/stock/registrations`);
            setRegistrations(response.data);
            setFilteredList(response.data);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível carregar os cadastros.");
        }
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            setIsLoading(true);
            fetchRegistrations().finally(() => setIsLoading(false));
        }, [fetchRegistrations])
    );

    useEffect(() => {
        let list = [...registrations];
        if (filterType !== 'all') list = list.filter(item => item.type === filterType);
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            list = list.filter(item => item.name.toLowerCase().includes(lowercasedQuery));
        }
        setFilteredList(list);
    }, [searchQuery, filterType, registrations]);

    const handleEdit = (item) => {
        if (item.type === 'CPF') navigation.navigate('NewCpfRegistration', { itemToEdit: item });
        if (item.type === 'CNPJ') navigation.navigate('NewCnpjRegistration', { itemToEdit: item });
        if (item.type === 'EVENTO') navigation.navigate('NewEventRegistration', { itemToEdit: item });
    };
    
    const handleDelete = (item) => {
        Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja excluir "${item.name}"? Esta ação não pode ser desfeita.`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Excluir", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/api/stock/registrations/${item.id}`);
                            Alert.alert("Sucesso", "Cadastro excluído.");
                            fetchRegistrations(); // Atualiza a lista
                        } catch (error) {
                            Alert.alert("Erro", "Não foi possível excluir o cadastro.");
                        }
                    }
                }
            ]
        );
    };
    
    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardType}>{item.type}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{item.doc}</Text>
            {item.contact && <Text style={styles.cardText}>Contato: {item.contact}</Text>}
            {item.notes && <Text style={styles.cardText} numberOfLines={1}>Obs: {item.notes}</Text>}
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEdit(item)}><Text style={styles.editButton}>Editar</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)}><Text style={styles.deleteButton}>Excluir</Text></TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerButtons}>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NewCpfRegistration')}>
                    <Text style={styles.addButtonText}>Novo CPF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NewCnpjRegistration')}>
                    <Text style={styles.addButtonText}>Novo CNPJ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NewEventRegistration')}>
                    <Text style={styles.addButtonText}>Novo Evento</Text>
                </TouchableOpacity>
            </View>
            
            <TextInput style={styles.searchInput} placeholder="Buscar por nome..." value={searchQuery} onChangeText={setSearchQuery} />
            <View style={styles.filterContainer}>
                <TouchableOpacity onPress={() => setFilterType('all')} style={[styles.filterButton, filterType === 'all' && styles.activeFilter]}><Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>Todos</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('CPF')} style={[styles.filterButton, filterType === 'CPF' && styles.activeFilter]}><Text style={[styles.filterText, filterType === 'CPF' && styles.activeFilterText]}>CPF</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('CNPJ')} style={[styles.filterButton, filterType === 'CNPJ' && styles.activeFilter]}><Text style={[styles.filterText, filterType === 'CNPJ' && styles.activeFilterText]}>CNPJ</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterType('EVENTO')} style={[styles.filterButton, filterType === 'EVENTO' && styles.activeFilter]}><Text style={[styles.filterText, filterType === 'EVENTO' && styles.activeFilterText]}>Evento</Text></TouchableOpacity>
            </View>

            {isLoading ? <ActivityIndicator size="large" color="#1E63B8" /> :
            <FlatList
                data={filteredList}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum cadastro encontrado.</Text>}
                contentContainerStyle={{ paddingHorizontal: 15 }}
            />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  headerButtons: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
  addButton: { backgroundColor: '#1E63B8', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontWeight: 'bold' },
  searchInput: { height: 50, backgroundColor: '#FFF', marginHorizontal: 15, borderRadius: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: '#DDE3EA' },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', margin: 15, backgroundColor: '#e9ecef', borderRadius: 10 },
  filterButton: { flex: 1, padding: 12, alignItems: 'center' },
  activeFilter: { backgroundColor: '#1E63B8', borderRadius: 8 },
  filterText: { fontWeight: 'bold', color: '#333' },
  activeFilterText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', padding: 15, marginBottom: 10, borderRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  cardType: { fontSize: 12, fontWeight: 'bold', color: '#FFF', backgroundColor: '#6c757d', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  cardSubtitle: { fontSize: 14, color: '#555', marginBottom: 8 },
  cardText: { fontSize: 14, color: 'gray' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10, marginTop: 10 },
  editButton: { color: '#1E63B8', fontWeight: 'bold', marginRight: 20 },
  deleteButton: { color: '#dc3545', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: 'gray' },
});