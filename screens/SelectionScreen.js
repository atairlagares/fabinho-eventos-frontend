// frontend/screens/SelectionScreen.js (ATUALIZADO)

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const DeveloperCreditFooter = () => (
    <Text style={styles.footerText}>
        Desenvolvido por Fabinho Eventos
    </Text>
);

export default function SelectionScreen({ navigation }) {
    <SafeAreaView style={styles.container}></SafeAreaView>
  const [activeEvent, setActiveEvent] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      const loadActiveEvent = async () => {
        const event = await AsyncStorage.getItem('activeEvent');
        setActiveEvent(event);
      };
      const loadLoggedInUser = async () => {
        const userName = await AsyncStorage.getItem('loggedInUserName');
        setLoggedInUser(userName);
      };
      loadActiveEvent();
      loadLoggedInUser();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      "Confirmar Saída",
      "Tem certeza que deseja deslogar do evento e do usuário?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Confirmar", 
          onPress: async () => {
            await AsyncStorage.removeItem('activeEvent');
            await AsyncStorage.removeItem('loggedInUserCpf');
            await AsyncStorage.removeItem('loggedInUserName');
            navigation.replace('Login');
          }
        }
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/logo1.png')} style={styles.logoSmall} />
        {loggedInUser && <Text style={styles.welcomeText}>Olá, <Text style={styles.eventHighlight}></Text>{loggedInUser}!</Text>}
        {activeEvent && <Text style={styles.eventText}>Evento Ativo: <Text style={styles.eventHighlight}>{activeEvent}</Text></Text>}
      </View>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WaiterClosing')}>
        <Text style={styles.cardText}>Fechamento Garçom</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WaiterClosing10')}>
        <Text style={styles.cardText}>Fechamento Garçom 10%</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MobileCashierClosing')}>
        <Text style={styles.cardText}>Fechamento Caixa Móvel</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('FixedCashierClosing')}>
        <Text style={styles.cardText}>Fechamento Caixa Fixo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ClosingHistory')}>
        <Text style={styles.cardText}>Consultar Fechamentos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Deslogar</Text>
      </TouchableOpacity>


      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  logoSmall: {
    width: 150,
    height: 75,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
    color: '#030303ff',
    marginBottom: 5,
  },
  eventText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
  },
  eventHighlight: {
    fontWeight: 'bold',
    color: '#1E63B8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 10,
    width: '90%',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
  },
  cardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D1B2A',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    marginTop: 30,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
      footerText: {
        fontSize: 12,
        color: 'gray',
        textAlign: 'center',
        padding: 10,
        },
  
});
