// frontend/screens/LoginScreen.js (Versão com navegação para Módulos)

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, ActivityIndicator,
    Image, SafeAreaView, TouchableOpacity, KeyboardAvoidingView,
    ScrollView, Platform, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.15.34:3001';



// Funções de formatação (sem alterações)
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

export default function LoginScreen({ navigation }) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users`);
        setUsers(response.data);
      } catch (error) {
        alert('Erro ao carregar usuários. Verifique o backend e a planilha.');
      }
    };
    fetchUsers();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPassword = password.replace(/\D/g, '');

    const foundUser = users.find(user => 
        user.cpf.replace(/\D/g, '') === cleanCpf && 
        user.dob.replace(/\D/g, '') === cleanPassword
    );

    if (foundUser) {
      await AsyncStorage.setItem('loggedInUserCpf', foundUser.cpf);
      await AsyncStorage.setItem('loggedInUserName', foundUser.name);
      await AsyncStorage.setItem('userProfile', foundUser.profile);
      await AsyncStorage.setItem('userPermissions', foundUser.permissions);
      
      // << ALTERAÇÃO AQUI >>
      // Agora navega para a tela de seleção de módulos
      navigation.replace('ModuleSelection');
    } else {
      alert('CPF ou Data de Nascimento incorretos.');
    }
    setIsLoading(false);
  };

  if (isLoading && users.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" /><Text>Carregando usuários...</Text></View>;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            
            <View style={styles.headerContainer}>
                {/* << ALTERAÇÃO DA LOGO AQUI >> */}
                <Image source={require('../assets/logo2.png')} style={styles.logo} />
                <Text style={styles.appName}>Gestão de Informações</Text>
                <Text style={styles.subtitle}>FABINHO EVENTOS</Text>
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.label}>CPF:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={formatCpf(cpf)}
                    onChangeText={setCpf}
                    maxLength={14}
                />

                <Text style={styles.label}>Data de Nascimento:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    secureTextEntry={true}
                    value={formatDateOfBirth(password)}
                    onChangeText={setPassword}
                    maxLength={10}
                />

                <TouchableOpacity 
                    style={[styles.loginButton, isLoading && styles.disabledButton]} 
                    onPress={handleLogin} 
                    disabled={isLoading}
                >
                    <Text style={styles.loginButtonText}>{isLoading ? "ENTRANDO..." : "ENTRAR"}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Desenvolvido por Atair Lagares</Text>
            </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1B2A',
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logo: {
    width: 420,
    height: 210,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  formContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
  },
  label: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F0F4F8',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#DDE3EA',
    color: '#333',
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: '#1E63B8',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
      backgroundColor: '#a5d6a7',
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
});

