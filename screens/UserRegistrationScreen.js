// frontend/screens/UserRegistrationScreen.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { API_URL } from '../config'; // Importa a URL correta
import axios from 'axios';

// Funções de formatação (copiadas de LoginScreen para melhor UX)
const formatCpf = (text) => {
  const cleanText = text.replace(/\D/g, '');
  if (cleanText.length <= 3) return cleanText;
  if (cleanText.length <= 6) return `${cleanText.slice(0, 3)}.${cleanText.slice(3)}`;
  if (cleanText.length <= 9) return `${cleanText.slice(0, 3)}.${cleanText.slice(3, 6)}.${cleanText.slice(6)}`;
  return `${cleanText.slice(0, 3)}.${cleanText.slice(3, 6)}.${cleanText.slice(6, 9)}-${cleanText.slice(9, 11)}`;
};
const formatDateOfBirth = (text) => {
    const cleanText = text.replace(/\D/g, '');
    if (cleanText.length <= 2) return cleanText;
    if (cleanText.length <= 4) return `${cleanText.slice(0, 2)}/${cleanText.slice(2)}`;
    return `${cleanText.slice(0, 2)}/${cleanText.slice(2, 4)}/${cleanText.slice(4, 8)}`;
};

export default function UserRegistrationScreen({ navigation }) {
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [dob, setDob] = useState('');
    const [profile, setProfile] = useState('');
    const [permissions, setPermissions] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name || !cpf || !dob || !profile) {
            Alert.alert("Erro", "Nome, CPF, Data de Nascimento e Perfil são obrigatórios.");
            return;
        }
        setIsSaving(true);
        try {
            const userData = { 
                name, 
                cpf: formatCpf(cpf), // Envia formatado
                dob: formatDateOfBirth(dob), // Envia formatado
                profile, 
                permissions 
            };
            await axios.post(`${API_URL}/api/users`, userData);
            Alert.alert("Sucesso", `Usuário "${name}" salvo!`);
            navigation.goBack();
        } catch (error) {
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível salvar o cadastro.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Text style={styles.title}>Novo Cadastro de Usuário</Text>
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Nome Completo*</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome do usuário" />
                    
                    <Text style={styles.label}>CPF*</Text>
                    <TextInput style={styles.input} value={formatCpf(cpf)} onChangeText={setCpf} placeholder="000.000.000-00" keyboardType="numeric" maxLength={14} />

                    <Text style={styles.label}>Data de Nascimento (Senha)*</Text>
                    <TextInput style={styles.input} value={formatDateOfBirth(dob)} onChangeText={setDob} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} />

                    <Text style={styles.label}>Perfil*</Text>
                    <TextInput style={styles.input} value={profile} onChangeText={setProfile} placeholder="Ex: Admin, Operador, Caixa" />
                    
                    <Text style={styles.label}>Permissões (Opcional)</Text>
                    <TextInput style={styles.input} value={permissions} onChangeText={setPermissions} placeholder="Ex: financeiro, estoque" />

                    <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
                        <Text style={styles.saveButtonText}>{isSaving ? "SALVANDO..." : "SALVAR USUÁRIO"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos (semelhantes às outras telas de cadastro)
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