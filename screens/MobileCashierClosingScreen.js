// frontend/screens/MobileCashierClosingScreen.js (Versão Definitiva com Correção de Teclado)

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    ActivityIndicator,
    Switch,
    Button,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Modal,
    ScrollView
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../config';


function formatCurrency(value) {
  if (!value) return '';
  const cleanValue = String(value).replace(/\D/g, '');
  if (cleanValue === '') return '';
  const numberValue = parseInt(cleanValue, 10);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue / 100);
}

export default function MobileCashierClosingScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [dataToConfirm, setDataToConfirm] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [cpfInput, setCpfInput] = useState('');
  const [filteredCashiers, setFilteredCashiers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [numeroMaquina, setNumeroMaquina] = useState('');
  const [temTroco, setTemTroco] = useState(false);
  const [valorTroco, setValorTroco] = useState('');
  const [temEstorno, setTemEstorno] = useState(false);
  const [valorEstorno, setValorEstorno] = useState('');
  const [valorTotalVenda, setValorTotalVenda] = useState('');
  const [credito, setCredito] = useState('');
  const [debito, setDebito] = useState('');
  const [pix, setPix] = useState('');
  const [cashless, setCashless] = useState('');
  const [dinheiroFisico, setDinheiroFisico] = useState('');
  const [valorAcerto, setValorAcerto] = useState(0);
  const [diferenca, setDiferenca] = useState(0);
  
  useEffect(() => {
    const fetchCashiers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cashiers`);
        setCashiers(response.data);
      } catch (error) {
        alert("Não foi possível carregar a lista de caixas.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCashiers();
  }, []);
  
  useEffect(() => {
    const cleanCpfInput = cpfInput.replace(/\D/g, '');
    if (cleanCpfInput.length > 0 && !selectedCashier) {
      setFilteredCashiers(cashiers.filter(c => c.cpf?.toString().replace(/\D/g, '').startsWith(cleanCpfInput)));
    } else {
      setFilteredCashiers([]);
    }
  }, [cpfInput, cashiers, selectedCashier]);

  useEffect(() => {
    const numValorTotalVenda = (parseInt(String(valorTotalVenda).replace(/\D/g, '') || '0', 10)) / 100;
    const numValorTroco = (parseInt(String(valorTroco).replace(/\D/g, '') || '0', 10)) / 100;
    const numCredito = (parseInt(String(credito).replace(/\D/g, '') || '0', 10)) / 100;
    const numDebito = (parseInt(String(debito).replace(/\D/g, '') || '0', 10)) / 100;
    const numPix = (parseInt(String(pix).replace(/\D/g, '') || '0', 10)) / 100;
    const numCashless = (parseInt(String(cashless).replace(/\D/g, '') || '0', 10)) / 100;
    const numDinheiroFisico = (parseInt(String(dinheiroFisico).replace(/\D/g, '') || '0', 10)) / 100;
    const numValorEstorno = (parseInt(String(valorEstorno).replace(/\D/g, '') || '0', 10)) / 100;

    const acertoCalculado = (numValorTotalVenda + (temTroco ? numValorTroco : 0)) - (numCredito + numDebito + numPix + numCashless) - (temEstorno ? numValorEstorno : 0);
    setValorAcerto(acertoCalculado);

    const dif = numDinheiroFisico - acertoCalculado;
    setDiferenca(dif);
  }, [valorTotalVenda, valorTroco, credito, debito, pix, cashless, dinheiroFisico, temTroco, valorEstorno]);

  const handleSelectCashier = (cashier) => {
    setSelectedCashier(cashier);
    setCpfInput(cashier.cpf);
    setFilteredCashiers([]);
  };

  const handleConfirm = () => {
    if (!selectedCashier || !numeroMaquina) {
      alert('Por favor, selecione um caixa e preencha o número da máquina.');
      return;
    }
    const data = {
        cashierName: selectedCashier.name,
        valorTotalVenda: (parseInt(valorTotalVenda || '0', 10)) / 100,
        valorAcerto,
        dinheiroFisico: (parseInt(dinheiroFisico || '0', 10)) / 100,
        diferenca,
    };
    setDataToConfirm(data);
    setModalVisible(true);
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
        const eventName = await AsyncStorage.getItem('activeEvent');
        const operatorName = await AsyncStorage.getItem('loggedInUserName');
        if (!eventName || !operatorName) {
            alert('Erro: Evento ou usuário não encontrado.');
            return;
        }

        const closingData = {
            eventName, operatorName,
            cpf: selectedCashier.cpf,
            cashierName: selectedCashier.name,
            numeroMaquina, temTroco, temEstorno,
            valorTroco: (parseInt(String(valorTroco).replace(/\D/g, '') || '0', 10)) / 100,
            valorEstorno: (parseInt(String(valorEstorno).replace(/\D/g, '') || '0', 10)) / 100,
            valorTotalVenda: (parseInt(String(valorTotalVenda).replace(/\D/g, '') || '0', 10)) / 100,
            credito: (parseInt(String(credito).replace(/\D/g, '') || '0', 10)) / 100,
            debito: (parseInt(String(debito).replace(/\D/g, '') || '0', 10)) / 100,
            pix: (parseInt(String(pix).replace(/\D/g, '') || '0', 10)) / 100,
            cashless: (parseInt(String(cashless).replace(/\D/g, '') || '0', 10)) / 100,
            dinheiroFisico: (parseInt(String(dinheiroFisico).replace(/\D/g, '') || '0', 10)) / 100,
            valorAcerto, diferenca,
        };
        
        const response = await axios.post(`${API_URL}/api/closings/cashier`, closingData);
        alert(`Fechamento salvo com sucesso!\nProtocolo: ${response.data.protocol}\nCaixa: ${response.data.cashierName}`);
        
        navigation.goBack();
        
    } catch (error) {
        console.error("Erro ao salvar fechamento:", error);
        alert('Ocorreu um erro ao salvar o fechamento.');
    } finally {
        setIsSaving(false);
        setModalVisible(false);
    }
  };

  const getDiferencaColor = () => {
    if (diferenca < 0) return 'red';
    if (diferenca > 0) return 'green';
    return 'blue';
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /><Text>Carregando...</Text></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : "height"} style={{flex: 1}}>
        <SafeAreaView style={styles.container}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Fechamento Caixa Móvel</Text>
                
                <View style={styles.section}>
                    <Text style={styles.label}>CPF do Caixa</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Comece a digitar o CPF" 
                        value={cpfInput} 
                        onChangeText={(text) => {
                            setCpfInput(text);
                            setSelectedCashier(null);
                        }} 
                        keyboardType="numeric"
                    />
                </View>

                <FlatList
                    data={filteredCashiers}
                    keyExtractor={(item) => item.cpf}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectCashier(item)}>
                            <Text>{item.name} - {item.cpf}</Text>
                        </TouchableOpacity>
                    )}
                />
                
                {selectedCashier && <Text style={styles.waiterName}>Caixa: {selectedCashier.name}</Text>}

                <View style={styles.section}>
                    <Text style={styles.label}>Número da Máquina</Text>
                    <TextInput style={styles.input} placeholder="Digite o número da máquina" value={numeroMaquina} onChangeText={(text) => setNumeroMaquina(text.toUpperCase())} autoCapitalize="characters" />
                </View>

                <View style={styles.section}>
                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Recebeu Troco?</Text>
                        <Switch onValueChange={() => setTemTroco(v => !v)} value={temTroco} />
                    </View>
                    {temTroco && <TextInput style={[styles.input, styles.boldInput]} placeholder="Valor do Troco" value={formatCurrency(valorTroco)} onChangeText={text => setValorTroco(text.replace(/\D/g, ''))} keyboardType="numeric"/>}
                </View>

                <View style={styles.section}>
                    <View style={styles.switchContainer}>
                        <Text style={styles.label}>Houve Estorno Manual?</Text>
                        <Switch onValueChange={() => setTemEstorno(v => !v)} value={temEstorno} />
                    </View>
                    {temEstorno && <TextInput style={[styles.input, styles.boldInput]} placeholder="Valor do Estorno" value={formatCurrency(valorEstorno)} onChangeText={text => setValorEstorno(text.replace(/\D/g, ''))} keyboardType="numeric"/>}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Valor Total da Venda</Text>
                    <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(valorTotalVenda)} onChangeText={text => setValorTotalVenda(text.replace(/\D/g, ''))} keyboardType="numeric"/>
                    <Text style={styles.label}>Crédito</Text>
                    <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(credito)} onChangeText={text => setCredito(text.replace(/\D/g, ''))} keyboardType="numeric"/>
                    <Text style={styles.label}>Débito</Text>
                    <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(debito)} onChangeText={text => setDebito(text.replace(/\D/g, ''))} keyboardType="numeric"/>
                    <Text style={styles.label}>PIX</Text>
                    <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(pix)} onChangeText={text => setPix(text.replace(/\D/g, ''))} keyboardType="numeric"/>
                    <Text style={styles.label}>Cashless</Text>
                    <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(cashless)} onChangeText={text => setCashless(text.replace(/\D/g, ''))} keyboardType="numeric"/>
                </View>

                <View style={[styles.section, styles.resultsContainer]}>
                    <Text style={styles.resultLabel}>Dinheiro a ser apresentado:</Text>
                    <Text style={styles.resultValueFinal}>{valorAcerto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
                    <Text style={[styles.label, {marginTop: 20}]}>Total em Dinheiro Físico (Contado)</Text>
                    <TextInput style={[styles.input, styles.boldInput]} placeholder="Valor contado em dinheiro" value={formatCurrency(dinheiroFisico)} onChangeText={text => setDinheiroFisico(text.replace(/\D/g, ''))} keyboardType="numeric"/>
                    <Text style={styles.resultLabel}>Diferença:</Text>
                    <Text style={[styles.resultValueFinal, { color: getDiferencaColor() }]}>
                        {diferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                    <View style={styles.buttonContainer}>
                        <Button title={"Confirmar e Salvar"} onPress={handleConfirm} disabled={isSaving} color="#28a745" />
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>

        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalCenteredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Confirmar Fechamento</Text>
                    {dataToConfirm && (
                        <>
                            <Text style={styles.modalText}>Caixa: <Text style={styles.modalBold}>{dataToConfirm.cashierName}</Text></Text>
                            <Text style={styles.modalText}>Venda Total: <Text style={styles.modalBold}>{dataToConfirm.valorTotalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                            <Text style={styles.modalText}>Dinheiro a Apresentar: <Text style={styles.modalBold}>{dataToConfirm.valorAcerto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                            <Text style={styles.modalText}>Dinheiro Contado: <Text style={styles.modalBold}>{dataToConfirm.dinheiroFisico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                            <Text style={[styles.modalTextFinal, { color: getDiferencaColor() }]}>Diferença: <Text style={styles.modalBold}>{dataToConfirm.diferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                        </>
                    )}
                    <View style={styles.modalButtonContainer}>
                        <Button title="Cancelar" onPress={() => setModalVisible(false)} color="#6c757d"/>
                        <Button title={isSaving ? "Salvando..." : "Salvar"} onPress={handleFinalSave} disabled={isSaving} color="#1E63B8"/>
                    </View>
                </View>
            </View>
        </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0D1B2A', textAlign: 'center', marginVertical: 20 },
  section: { marginBottom: 15, paddingHorizontal: 20 },
  label: { fontSize: 18, color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 8, fontSize: 20, borderWidth: 1, borderColor: '#DDE3EA' },
  boldInput: { fontWeight: 'bold', fontSize: 22, },
  resultsContainer: { backgroundColor: '#e9ecef', padding: 15, borderRadius: 8, marginTop: 10 },
  resultLabel: { fontSize: 18, color: '#495057', marginBottom: 5, fontWeight: 'bold' },
  resultValueFinal: { fontSize: 24, fontWeight: 'bold', color: '#1E63B8', textAlign: 'center' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  suggestionItem: { 
    padding: 15, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    marginHorizontal: 20,
  },
  waiterName: { fontSize: 18, fontWeight: 'bold', color: 'green', marginVertical: 10, textAlign: 'center' },
  buttonContainer: { marginTop: 20 },
  modalCenteredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalView: { margin: 20, backgroundColor: "white", borderRadius: 20, padding: 35, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalText: { fontSize: 18, marginBottom: 10, textAlign: 'left', width: '100%' },
  modalTextFinal: { fontSize: 20, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  modalBold: { fontWeight: 'bold', },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 25, },
});

