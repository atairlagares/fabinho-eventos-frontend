// frontend/screens/ModuleSelectionScreen.js

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert } from 'react-native';
// AsyncStorage para limpar os dados de login
import AsyncStorage from '@react-native-async-storage/async-storage';

// Componente de botão reutilizável com ícone, título e descrição
const MenuButton = ({ onPress, title, description, icon }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardContent}>
            <Text style={styles.cardText}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </View>
    </TouchableOpacity>
);

// Componente de rodapé com os créditos atualizados
const DeveloperCreditFooter = () => (
    <Text style={styles.footerText}>
        Desenvolvido por Atair Lagares
    </Text>
);

export default function ModuleSelectionScreen({ navigation }) {
    
    // Função de Logout
    const handleLogout = () => {
        Alert.alert(
            "Confirmar Saída",
            "Tem certeza que deseja deslogar do aplicativo?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sair",
                    style: "destructive",
                    onPress: async () => {
                        // Limpa os dados de login
                        await AsyncStorage.clear();
                        // Reseta a navegação para a tela de Login
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }
            ]
        );
    };

    // Efeito para adicionar o botão de Sair no cabeçalho da tela
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Sair</Text>
                </TouchableOpacity>
            ),
            headerLeft: null, // Remove o botão de voltar nesta tela
        });
    }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
            <Image source={require('../assets/logo1.png')} style={styles.logo} />
            <Text style={styles.title}>Seleção de Módulo</Text>
        </View>

        <MenuButton 
            title="Módulo Financeiro" 
            icon="💰"
            description="Gestão de fechamentos de caixas e garçons."
            onPress={() => navigation.navigate('EventSelection')} 
        />
        <MenuButton 
            title="Módulo de Estoque" 
            icon="📦"
            description="Controle de inventário, entradas, saídas e relatórios."
            onPress={() => navigation.navigate('StockDashboard')} 
        />
        
      </ScrollView>
      <DeveloperCreditFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 300,
    height: 150,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E63B8',
  },
  cardDescription: {
      fontSize: 14,
      color: '#555',
      marginTop: 5,
  },
  footerText: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
    padding: 10,
  },
});