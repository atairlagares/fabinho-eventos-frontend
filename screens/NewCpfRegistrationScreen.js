// frontend/screens/NewCpfRegistrationScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import axios from 'axios';

const API_URL = 'http://192.168.15.34:3001';

export default function NewCpfRegistrationScreen({ route, navigation }) {
    const { itemToEdit } = route.params || {};

    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [contact, setContact] = useState('');
    const [plate, setPlate] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (itemToEdit) {
            setName(itemToEdit.name);
            setCpf(itemToEdit.doc);
            setContact(itemToEdit.contact);
            setPlate(itemToEdit.plate);
            setNotes(itemToEdit.notes);
        }
    }, [itemToEdit]);

    const handleSave = async () => {
        if (!name || !cpf || !contact) {
            Alert.alert("Erro", "Nome, CPF e Contato são obrigatórios.");
            return;
        }
        setIsSaving(true);
        try {
            const data = { type: 'CPF', name, doc: cpf, contact, plate, notes };
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
                <Text style={styles.title}>{itemToEdit ? "Editar Cadastro" : "Novo Cadastro"} - CPF</Text>
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Nome Completo*</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome do cadastrado" />
                    
                    <Text style={styles.label}>CPF*</Text>
                    <TextInput style={styles.input} value={cpf} onChangeText={setCpf} placeholder="000.000.000-00" keyboardType="numeric" />

                    <Text style={styles.label}>Contato*</Text>
                    <TextInput style={styles.input} value={contact} onChangeText={setContact} placeholder="(00) 00000-0000" keyboardType="phone-pad" />

                    <Text style={styles.label}>Placa do Veículo</Text>
                    <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="AAA-0000" autoCapitalize="characters" />

                    <Text style={styles.label}>Observações</Text>
                    <TextInput style={[styles.input, {height: 100}]} value={notes} onChangeText={setNotes} multiline placeholder="Detalhes adicionais" />

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