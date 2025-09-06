// frontend/screens/NewCnpjRegistrationScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import axios from 'axios';

import { API_URL } from '../config';


export default function NewCnpjRegistrationScreen({ route, navigation }) {
    const { itemToEdit } = route.params || {};

    const [companyName, setCompanyName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [responsibleName, setResponsibleName] = useState('');
    const [contact, setContact] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (itemToEdit) {
            setCompanyName(itemToEdit.name);
            setCnpj(itemToEdit.doc);
            setResponsibleName(itemToEdit.responsibleName);
            setContact(itemToEdit.contact);
            setNotes(itemToEdit.notes);
        }
    }, [itemToEdit]);

    const handleSave = async () => {
        if (!companyName || !cnpj || !responsibleName || !contact) {
            Alert.alert("Erro", "Todos os campos com * são obrigatórios.");
            return;
        }
        setIsSaving(true);
        try {
            const data = { type: 'CNPJ', name: companyName, doc: cnpj, contact, responsibleName, notes };
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
                <Text style={styles.title}>{itemToEdit ? "Editar Cadastro" : "Novo Cadastro"} - CNPJ</Text>
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Razão Social*</Text>
                    <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="Nome da empresa" />
                    
                    <Text style={styles.label}>CNPJ*</Text>
                    <TextInput style={styles.input} value={cnpj} onChangeText={setCnpj} placeholder="00.000.000/0000-00" keyboardType="numeric" />

                    <Text style={styles.label}>Nome do Responsável*</Text>
                    <TextInput style={styles.input} value={responsibleName} onChangeText={setResponsibleName} placeholder="Nome do contato" />

                    <Text style={styles.label}>Contato*</Text>
                    <TextInput style={styles.input} value={contact} onChangeText={setContact} placeholder="(00) 00000-0000" keyboardType="phone-pad" />

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