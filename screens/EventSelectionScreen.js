// frontend/screens/EventSelectionScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_URL } from '../config';




export default function EventSelectionScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Busca o evento já salvo, se houver
        const savedEvent = await AsyncStorage.getItem('activeEvent');
        if (savedEvent) {
          setSelectedEvent(savedEvent);
        }
        // Busca a lista de eventos da API
        const response = await axios.get(`${API_URL}/api/events`);
        setEvents(response.data);
      } catch (error) {
        alert('Não foi possível carregar a lista de eventos.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectEvent = async (event) => {
    try {
      await AsyncStorage.setItem('activeEvent', event);
      setSelectedEvent(event);
      // Navega para a próxima tela após salvar o evento
      navigation.replace('Selection');
    } catch (e) {
      alert('Não foi possível salvar a seleção do evento.');
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  // Se um evento já está selecionado, mostra qual é e dá a opção de continuar ou trocar
  if (selectedEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
            <Text style={styles.infoText}>Evento ativo:</Text>
            <Text style={styles.selectedEventText}>{selectedEvent}</Text>
            <View style={styles.buttonContainer}>
                <Button title="Continuar" onPress={() => navigation.replace('Selection')} />
            </View>
            <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                <Text style={styles.changeEventText}>Trocar evento</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Se nenhum evento foi selecionado, mostra a lista para escolha
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Selecione um Evento</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleSelectEvent(item)}>
            <Text style={styles.cardText}>{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.infoText}>Nenhum evento disponível.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3, marginBottom: 15, alignItems: 'center' },
  cardText: { fontSize: 18, fontWeight: 'bold' },
  infoText: { fontSize: 16, color: 'gray' },
  selectedEventText: { fontSize: 22, fontWeight: 'bold', marginVertical: 20, color: '#1E63B8' },
  buttonContainer: { width: '80%', marginVertical: 10 },
  changeEventText: { color: 'gray', marginTop: 20, textDecorationLine: 'underline' },
});