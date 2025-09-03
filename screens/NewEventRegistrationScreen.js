// frontend/screens/NewEventRegistrationScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import axios from 'axios';

const API_URL = 'http://192.168.15.34:3001';

export default function NewEventRegistrationScreen({ route, navigation }) {
    const { itemToEdit } = route.params || {};

    const [eventName, setEventName] = useState('');
    const [city, setCity] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (itemToEdit) {
            setEventName(itemToEdit.name);
            setCity(itemToEdit.city);
        }
    }, [itemToEdit]);

    const handleSave = async () => {
        if (!eventName || !city) {
            Alert.alert("Erro", "Nome do Evento e Cidade são obrigatórios.");
            return;
        }
        setIsSaving(true);
        try {
            const data = { type: 'EVENTO', name: eventName, city };
            if (itemToEdit) {
                await axios.put(`${API_URL}/api/stock/registrations/${itemToEdit.id}`, data);
                Alert.alert("Sucesso", "Cadastro atualizado!");
            } else {
                await axios.post(`${API_URL}/api/stock/registrations`, data);
                Alert.alert("Sucesso", "Cadastro salvo!");
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert("Erro", "Não foi possível salvar o cadastro.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Text style={styles.title}>{itemToEdit ? "Editar Cadastro" : "Novo Cadastro"} - Evento</Text>
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Nome do Evento*</Text>
                    <TextInput style={styles.input} value={eventName} onChangeText={setEventName} placeholder="Ex: Festa do Peão de Boiadeiro" />
                    
                    <Text style={styles.label}>Cidade do Evento*</Text>
                    <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Ex: Barretos - SP" />

                    <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
                        <Text style={styles.saveButtonText}>{isSaving ? "SALVANDO..." : "SALVAR"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    formContainer: { padding: 20 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#DDE3EA', marginBottom: 15 },
    saveButton: { backgroundColor: '#1E63B8', padding: 18, borderRadius: 10, alignItems: 'center' },
    disabledButton: { backgroundColor: '#a5d6a7' },
    saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});