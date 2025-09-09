// frontend/screens/WaiterClosingScreen.js (Versão com Modal Atualizado)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, Button, ScrollView, Modal, Switch } from 'react-native';
import { API_URL } from '../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

function formatCurrency(value) {
    if (!value) return '';
    const cleanValue = String(value).replace(/\D/g, '');
    if (cleanValue === '') return '';
    const numberValue = parseInt(cleanValue, 10);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue / 100);
}

export default function WaiterClosingScreen({ navigation }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [dataToConfirm, setDataToConfirm] = useState(null);
    const [waiters, setWaiters] = useState([]);
    const [cpfInput, setCpfInput] = useState('');
    const [filteredWaiters, setFilteredWaiters] = useState([]);
    const [selectedWaiter, setSelectedWaiter] = useState(null);
    const [numeroCamiseta, setNumeroCamiseta] = useState('');
    const [numeroMaquina, setNumeroMaquina] = useState('');
    const [temEstorno, setTemEstorno] = useState(false);
    const [valorEstorno, setValorEstorno] = useState('');
    const [valorTotal, setValorTotal] = useState('');
    const [credito, setCredito] = useState('');
    const [debito, setDebito] = useState('');
    const [pix, setPix] = useState('');
    const [cashless, setCashless] = useState('');
    const [comissao8, setComissao8] = useState(0);
    const [comissao4, setComissao4] = useState(0);
    const [comissaoTotal, setComissaoTotal] = useState(0);
    const [valorAcerto, setValorAcerto] = useState(0);
    const [acertoLabel, setAcertoLabel] = useState('Aguardando valores...');

    useEffect(() => {
        const fetchWaiters = async () => {
          try {
            const response = await axios.get(`${API_URL}/api/waiters`);
            setWaiters(response.data);
          } catch (error) {
            alert("Não foi possível carregar a lista de garçons.");
          } finally {
            setIsLoading(false);
          }
        };
        fetchWaiters();
    }, []);

    useEffect(() => {
        const cleanCpfInput = cpfInput.replace(/\D/g, '');
        if (cleanCpfInput.length > 0 && !selectedWaiter) {
            setFilteredWaiters(waiters.filter(w => w.cpf?.toString().replace(/\D/g, '').startsWith(cleanCpfInput)));
        } else {
            setFilteredWaiters([]);
        }
    }, [cpfInput, waiters, selectedWaiter]);
    
    useEffect(() => {
        const numValorTotal = (parseInt(String(valorTotal).replace(/\D/g, '') || '0', 10)) / 100;
        const numCredito = (parseInt(String(credito).replace(/\D/g, '') || '0', 10)) / 100;
        const numDebito = (parseInt(String(debito).replace(/\D/g, '') || '0', 10)) / 100;
        const numPix = (parseInt(String(pix).replace(/\D/g, '') || '0', 10)) / 100;
        const numCashless = (parseInt(String(cashless).replace(/\D/g, '') || '0', 10)) / 100;
        const numValorEstorno = (parseInt(String(valorEstorno).replace(/\D/g, '') || '0', 10)) / 100;

        const baseComissao8 = numCashless > 0 ? numValorTotal - numCashless : numValorTotal;
        const c8 = baseComissao8 * 0.08;
        setComissao8(c8);

        const c4 = numCashless * 0.04;
        setComissao4(c4);

        const cTotal = c8 + c4;
        setComissaoTotal(cTotal);

        const valorDinheiro = numValorTotal - (numCredito + numDebito + numPix + numCashless);
        const valorDinheiroAjustado = valorDinheiro - (temEstorno ? numValorEstorno : 0);

        if (valorDinheiroAjustado < cTotal) {
          setAcertoLabel('Pagar ao Garçom:');
          setValorAcerto(cTotal - valorDinheiroAjustado);
        } else {
          setAcertoLabel('Receber do Garçom:');
          setValorAcerto(valorDinheiroAjustado - cTotal);
        }
    }, [valorTotal, credito, debito, pix, cashless, valorEstorno, temEstorno]);

    const handleSelectWaiter = (waiter) => {
        setSelectedWaiter(waiter);
        setCpfInput(waiter.cpf);
        setFilteredWaiters([]);
    };
    
    const handleConfirm = async () => {
        if (!selectedWaiter || !numeroMaquina) {
            alert('Por favor, selecione um garçom e preencha o número da máquina.');
            return;
        }
        const eventName = await AsyncStorage.getItem('activeEvent');
        const data = {
            eventName,
            waiterName: selectedWaiter.name,
            numeroCamiseta,
            valorTotal: (parseInt(String(valorTotal).replace(/\D/g, '') || '0', 10)) / 100,
            comissao8,
            comissao4,
            comissaoTotal,
            acertoLabel,
            valorAcerto,
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
                alert('Erro: Evento ou usuário não encontrado. Por favor, reinicie o app.');
                setIsSaving(false);
                setModalVisible(false);
                return;
            }

            const closingData = {
                eventName,
                operatorName,
                cpf: selectedWaiter.cpf,
                waiterName: selectedWaiter.name,
                numeroCamiseta,
                numeroMaquina,
                valorTotal: (parseInt(String(valorTotal).replace(/\D/g, '') || '0', 10)) / 100,
                credito: (parseInt(String(credito).replace(/\D/g, '') || '0', 10)) / 100,
                debito: (parseInt(String(debito).replace(/\D/g, '') || '0', 10)) / 100,
                pix: (parseInt(String(pix).replace(/\D/g, '') || '0', 10)) / 100,
                cashless: (parseInt(String(cashless).replace(/\D/g, '') || '0', 10)) / 100,
                temEstorno,
                valorEstorno: (parseInt(String(valorEstorno).replace(/\D/g, '') || '0', 10)) / 100,
                comissaoTotal,
                acertoLabel,
                valorAcerto,
            };
            const response = await axios.post(`${API_URL}/api/closings/waiter`, closingData);
            alert(`Fechamento salvo com sucesso!\nANOTE O Nº DE PROTOCOLO NA FICHA DO GARÇOM.\nProtocolo: ${response.data.protocol}\nGarçom: ${response.data.waiterName}`);
            
            navigation.goBack();

        } catch (error) {
            alert('Ocorreu um erro ao salvar o fechamento.');
        } finally {
            setIsSaving(false);
            setModalVisible(false);
        }
    };
    
    if (isLoading) {
        return <View style={styles.center}><ActivityIndicator size="large" /><Text>Carregando...</Text></View>;
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : "height"} style={{flex: 1}}>
            <SafeAreaView style={styles.container}>
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>Fechamento Garçom</Text>
                    <View style={styles.section}>
                        <Text style={styles.label}>CPF do Garçom</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Comece a digitar o CPF" 
                            value={cpfInput} 
                            onChangeText={(text) => {
                                setCpfInput(text);
                                setSelectedWaiter(null);
                            }} 
                            keyboardType="numeric"
                        />
                        {filteredWaiters.map(item => (
                            <TouchableOpacity key={item.cpf} style={styles.suggestionItem} onPress={() => handleSelectWaiter(item)}>
                                <Text>{item.name} - {item.cpf}</Text>
                            </TouchableOpacity>
                        ))}
                        
                        {selectedWaiter && <Text style={styles.waiterName}>Garçom: {selectedWaiter.name}</Text>}
                        
                        <Text style={styles.label}>Número da Camiseta</Text>
                        <TextInput style={styles.input} placeholder="Digite o número da camiseta" value={numeroCamiseta} onChangeText={setNumeroCamiseta} keyboardType="numeric"/>
                        
                        <Text style={styles.label}>Número da Máquina</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Digite o número da máquina"
                            value={numeroMaquina}
                            onChangeText={(text) => setNumeroMaquina(text.toUpperCase())}
                            autoCapitalize="characters" />
                    </View>
                    
                    <View style={styles.section}>
                        <View style={styles.switchContainer}>
                            <Text style={styles.label}>Houve Estorno Manual?</Text>
                            <Switch onValueChange={() => setTemEstorno(v => !v)} value={temEstorno} />
                        </View>
                        {temEstorno && <TextInput style={[styles.input, styles.boldInput]} placeholder="Valor do Estorno" value={formatCurrency(valorEstorno)} onChangeText={text => setValorEstorno(text.replace(/\D/g, ''))} keyboardType="numeric"/>}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Valor Total (Venda)</Text>
                        <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(valorTotal)} onChangeText={text => setValorTotal(text.replace(/\D/g, ''))} keyboardType="numeric"/>
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
                        <Text style={styles.resultLabel}>Venda Total (8%): <Text style={styles.resultValue}>{comissao8.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                        <Text style={styles.resultLabel}>Venda Total (4%): <Text style={styles.resultValue}>{comissao4.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                        <Text style={styles.resultLabelTotal}>Comissão Total: <Text style={styles.resultValue}>{comissaoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                        <Text style={styles.resultLabelTotal}>{acertoLabel} <Text style={styles.resultValueFinal}>{valorAcerto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                        
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
                                <Text style={styles.modalText}>Evento: <Text style={styles.modalBold}>{dataToConfirm.eventName}</Text></Text>
                                <Text style={styles.modalText}>Garçom: <Text style={styles.modalBold}>{dataToConfirm.waiterName}</Text></Text>
                                <Text style={styles.modalText}>Nº Camisa: <Text style={styles.modalBold}>{dataToConfirm.numeroCamiseta}</Text></Text>
                                <View style={styles.separator} />
                                <Text style={styles.modalText}>Venda Total (8%): <Text style={styles.modalBold}>{dataToConfirm.comissao8.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                                <Text style={styles.modalText}>Venda Total (4%): <Text style={styles.modalBold}>{dataToConfirm.comissao4.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                                <Text style={styles.modalText}>Comissão Total: <Text style={styles.modalBold}>{dataToConfirm.comissaoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
                                <View style={styles.separator} />
                                <Text style={styles.modalTextFinal}>{dataToConfirm.acertoLabel} <Text style={styles.modalBold}>{dataToConfirm.valorAcerto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></Text>
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
    boldInput: { fontWeight: 'bold', fontSize: 22 },
    waiterName: { fontSize: 18, fontWeight: 'bold', color: 'green', marginTop: 10, textAlign: 'center' },
    resultsContainer: { backgroundColor: '#e9ecef', padding: 15, borderRadius: 8, marginTop: 10 },
    resultLabel: { fontSize: 18, color: '#495057', marginBottom: 5 },
    resultLabelTotal: { fontSize: 20, color: '#212929', marginTop: 10, fontWeight: 'bold' },
    resultValue: { fontWeight: 'bold' },
    resultValueFinal: { fontWeight: 'bold', color: '#1E63B8' },
    suggestionItem: { padding: 15, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#eee', borderColor: '#ddd', borderWidth: 1, borderRadius: 8 },
    buttonContainer: { marginTop: 10 },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 10 },
    modalCenteredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalView: { margin: 20, backgroundColor: "white", borderRadius: 20, padding: 35, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalText: { fontSize: 18, marginBottom: 10, textAlign: 'left', width: '100%' },
    modalTextFinal: { fontSize: 20, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
    modalBold: { fontWeight: 'bold' },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 25, },
    separator: { height: 1, width: '100%', backgroundColor: '#eee', marginVertical: 10, },
});