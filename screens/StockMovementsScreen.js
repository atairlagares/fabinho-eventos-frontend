// frontend/screens/StockMovementsScreen.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

// Este componente MenuButton é o correto para esta tela, para os botões de ação
const MenuButton = ({ onPress, title, description, icon }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View>
            <Text style={styles.cardText}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </View>
    </TouchableOpacity>
);

export default function StockMovementsScreen({ navigation }) {

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Entradas e Saídas</Text>
        
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>SAÍDAS (Seu estoque diminui)</Text>
            <MenuButton
                title="Venda Direta"
                icon="💸"
                description="Registrar uma venda para cliente."
                onPress={() => navigation.navigate('TransactionEntry', { type: 'VENDA_DIRETA', title: 'Venda Direta' })}
            />
            <MenuButton
                title="Saída para Evento"
                icon="🚚"
                description="Enviar material para um evento."
                onPress={() => navigation.navigate('TransactionEntry', { type: 'SAIDA_EVENTO', title: 'Saída para Evento' })}
            />
            {/* << BOTÃO ADICIONADO AQUI >> */}
            <MenuButton
                title="Aluguel de Material"
                icon="🤝"
                description="Registrar saída de material para aluguel."
                onPress={() => navigation.navigate('TransactionEntry', { type: 'ALUGUEL_MATERIAL', title: 'Aluguel de Material' })}
            />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>ENTRADAS (Seu estoque aumenta)</Text>
            <MenuButton
                title="Compra de Fornecedor"
                icon="📦"
                description="Registrar entrada de novos produtos."
                onPress={() => navigation.navigate('TransactionEntry', { type: 'COMPRA_FORNECEDOR', title: 'Compra de Fornecedor' })}
            />
            <MenuButton
                title="Retorno de Evento"
                icon="↩️"
                description="Receber material de volta de um evento."
                onPress={() => navigation.navigate('TransactionEntry', { type: 'RETORNO_EVENTO', title: 'Retorno de Evento' })}
            />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#6c757d', marginHorizontal: 20, marginBottom: 10, textTransform: 'uppercase' },
  card: { backgroundColor: '#FFFFFF', padding: 20, marginHorizontal: 15, borderRadius: 10, marginBottom: 10, elevation: 3, flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 24, marginRight: 15 },
  cardText: { fontSize: 18, fontWeight: 'bold', color: '#1E63B8' },
  cardDescription: { fontSize: 14, color: '#555', marginTop: 4 },
});