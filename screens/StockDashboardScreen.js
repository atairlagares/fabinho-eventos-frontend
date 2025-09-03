// frontend/screens/StockDashboardScreen.js

import React, { useState, useCallback } from 'react'; // << LINHA CORRIGIDA
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Componente de botão reutilizável
const MenuButton = ({ onPress, title, description }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <Text style={styles.cardText}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
    </TouchableOpacity>
);

// Componente de rodapé com os créditos
const DeveloperCreditFooter = () => (
    <Text style={styles.footerText}>
        Desenvolvido por Atair Lagares
    </Text>
);

export default function StockDashboardScreen({ navigation }) {
    // Estado para armazenar o nome do usuário
    const [userName, setUserName] = useState('');

    // Efeito para buscar o nome do usuário sempre que a tela for focada
    useFocusEffect(
        useCallback(() => { // 'React.' removido para usar o hook importado
            const fetchUserName = async () => {
                const name = await AsyncStorage.getItem('loggedInUserName');
                setUserName(name || 'Usuário');
            };
            fetchUserName();
        }, [])
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
            <Image source={require('../assets/logo1.png')} style={styles.logoSmall} />

            <Text style={styles.welcomeText}>
                Olá, <Text style={styles.userNameText}>{userName}</Text>
            </Text>

            <Text style={styles.title}>Operação Estoque Matriz</Text>
        </View>

        <MenuButton 
            title="Estoque Atual" 
            description="Visualize os produtos e quantidades disponíveis."
            onPress={() => navigation.navigate('CurrentStock')} 
        />
        <MenuButton 
            title="Entradas / Saídas" 
            description="Registre movimentações de produtos."
            onPress={() => navigation.navigate('StockMovements')} 
        />
        <MenuButton 
            title="Devoluções" 
            description="Gerencie devoluções e gere relatórios."
            onPress={() => navigation.navigate('Returns')} 
        />
        <MenuButton 
            title="Cadastros" 
            description="Cadastre clientes, fornecedores e produtos."
            onPress={() => navigation.navigate('StockRegistrations')} 
        />
        <MenuButton 
            title="Inventário" 
            description="Realize a contagem e ajuste do estoque."
            onPress={() => navigation.navigate('Inventory')} 
        />
                <MenuButton 
            title="Relatórios" 
            description="Exporte o inventário em PDF ou Excel."
            onPress={() => navigation.navigate('Reports')} 
        />
        <MenuButton 
            title="Auditoria" 
            description="Consulte o histórico de alterações."
            onPress={() => navigation.navigate('Audit')} 
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoSmall: {
    width: 300,
    height: 150,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 20,
    color: '#333',
    marginTop: 15,
  },
  userNameText: {
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginTop: 5,
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