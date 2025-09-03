// frontend/screens/FixedCashierClosingScreen.js (Versão Definitiva com Correção de Teclado)

import React, { useState, useEffect, useCallback } from 'react';
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
    Modal
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.15.34:3001';



// Função para formatar moeda (R$)
function formatCurrency(value) {
  if (!value) return '';
  const cleanValue = String(value).replace(/\D/g, '');
  if (cleanValue === '') return '';
  const numberValue = parseInt(cleanValue, 10);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue / 100);
}

// Componente separado para o formulário de troco
const TrocoForm = ({ valorTroco, setValorTroco }) => {
    return (
        <>
            <Text style={styles.screenTitle}>Fechamento Caixa Fixo</Text>
            <View style={styles.section}>
                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Recebeu Troco (para o grupo)?</Text>
                    <Switch
                        onValueChange={(value) => setValorTroco(value ? '0' : '')}
                        value={valorTroco !== ''}
                    />
                </View>
                {valorTroco !== '' && (
                    <TextInput
                        style={[styles.input, styles.boldInput]}
                        placeholder="Valor do Troco"
                        value={formatCurrency(valorTroco)}
                        onChangeText={text => setValorTroco(text.replace(/\D/g, ''))}
                        keyboardType="numeric"
                    />
                )}
            </View>
        </>
    );
};

export default function FixedCashierClosingScreen({ navigation }) {
    const [cashiers, setCashiers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [dataToConfirm, setDataToConfirm] = useState(null);
    const [valorTroco, setValorTroco] = useState('');
    const [caixasDoGrupo, setCaixasDoGrupo] = useState([
        {
            id: 1, cpf: '', name: '', numeroMaquina: '', temEstorno: false, valorEstorno: '',
            valorTotalVenda: '', credito: '', debito: '', pix: '', cashless: '', dinheiroFisico: '',
        }
    ]);

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

    const handleInputChange = (caixaId, field, value) => {
        setCaixasDoGrupo(prevCaixas =>
            prevCaixas.map(caixa =>
                caixa.id === caixaId ? { ...caixa, [field]: value } : caixa
            )
        );
    };

    const handleSelectCashier = (caixaId, cashier) => {
        handleInputChange(caixaId, 'cpf', cashier.cpf);
        handleInputChange(caixaId, 'name', cashier.name);
    };

    const handleAddCaixa = () => {
        const newId = caixasDoGrupo.length > 0 ? Math.max(...caixasDoGrupo.map(c => c.id)) + 1 : 1;
        setCaixasDoGrupo([...caixasDoGrupo, {
            id: newId, cpf: '', name: '', numeroMaquina: '', temEstorno: false, valorEstorno: '',
            valorTotalVenda: '', credito: '', debito: '', pix: '', cashless: '', dinheiroFisico: '',
        }]);
    };
    
    const getDiferencaColor = (diff) => {
        if (diff < 0) return 'red';
        if (diff > 0) return 'green';
        return 'blue';
    };

    const getFinalDiferenca = () => {
        const numValorTrocoGrupo = (parseInt(String(valorTroco).replace(/\D/g, '') || '0', 10)) / 100;
        let totalDinheiroFisico = 0;
        let totalAcerto = 0;

        caixasDoGrupo.forEach(caixa => {
            const numValorTotalVenda = (parseInt(String(caixa.valorTotalVenda).replace(/\D/g, '') || '0', 10)) / 100;
            const numValorEstorno = (parseInt(String(caixa.valorEstorno).replace(/\D/g, '') || '0', 10)) / 100;
            const numCredito = (parseInt(String(caixa.credito).replace(/\D/g, '') || '0', 10)) / 100;
            const numDebito = (parseInt(String(caixa.debito).replace(/\D/g, '') || '0', 10)) / 100;
            const numPix = (parseInt(String(caixa.pix).replace(/\D/g, '') || '0', 10)) / 100;
            const numCashless = (parseInt(String(caixa.cashless).replace(/\D/g, '') || '0', 10)) / 100;
            
            totalDinheiroFisico += (parseInt(String(caixa.dinheiroFisico).replace(/\D/g, '') || '0', 10)) / 100;
            totalAcerto += (numValorTotalVenda - (numCredito + numDebito + numPix + numCashless) - (caixa.temEstorno ? numValorEstorno : 0));
        });

        return totalDinheiroFisico - (totalAcerto + numValorTrocoGrupo);
    };

    const handleConfirm = () => {
        if (caixasDoGrupo.some(caixa => !caixa.name || !caixa.numeroMaquina)) {
            alert('Por favor, preencha o nome e o número da máquina para todos os caixas do grupo.');
            return;
        }
        const totalDiferenca = getFinalDiferenca();
        // << ALTERAÇÃO AQUI: Captura os nomes dos caixas >>
        const cashierNames = caixasDoGrupo.map(caixa => caixa.name);
        setDataToConfirm({ totalDiferenca, cashierNames });
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
                eventName,
                operatorName,
                valorTroco: (parseInt(String(valorTroco).replace(/\D/g, '') || '0', 10)) / 100,
                caixas: caixasDoGrupo.map(caixa => ({
                    cpf: caixa.cpf,
                    cashierName: caixa.name,
                    numeroMaquina: caixa.numeroMaquina,
                    temEstorno: caixa.temEstorno,
                    valorEstorno: (parseInt(String(caixa.valorEstorno).replace(/\D/g, '') || '0', 10)) / 100,
                    valorTotalVenda: (parseInt(String(caixa.valorTotalVenda).replace(/\D/g, '') || '0', 10)) / 100,
                    credito: (parseInt(String(caixa.credito).replace(/\D/g, '') || '0', 10)) / 100,
                    debito: (parseInt(String(caixa.debito).replace(/\D/g, '') || '0', 10)) / 100,
                    pix: (parseInt(String(caixa.pix).replace(/\D/g, '') || '0', 10)) / 100,
                    cashless: (parseInt(String(caixa.cashless).replace(/\D/g, '') || '0', 10)) / 100,
                    dinheiroFisico: (parseInt(String(caixa.dinheiroFisico).replace(/\D/g, '') || '0', 10)) / 100,
                }))
            };
    
            const response = await axios.post(`${API_URL}/api/closings/fixed`, closingData);
            alert(`Fechamento de grupo salvo com sucesso!\nProtocolo: ${response.data.protocol}`);
            navigation.goBack();
            
        } catch (error) {
            console.error("Erro ao salvar fechamento:", error.response?.data || error.message);
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : "height"} style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <TrocoForm valorTroco={valorTroco} setValorTroco={setValorTroco} />

                <FlatList
                    data={caixasDoGrupo}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => (
                        <CaixaFormItem
                            item={item}
                            index={index}
                            handleInputChange={handleInputChange}
                            handleSelectCashier={handleSelectCashier}
                            cashiers={cashiers}
                            getDiferencaColor={getDiferencaColor}
                        />
                    )}
                    ListFooterComponent={() => (
                        <>
                            <View style={styles.buttonContainer}>
                                <Button title="Adicionar Novo Caixa" onPress={handleAddCaixa} color="#1E63B8" />
                            </View>
                            <View style={styles.resultsContainer}>
                                <Text style={styles.label}>Diferença Final do Grupo</Text>
                                <Text style={[styles.resultValueFinal, { color: getDiferencaColor(getFinalDiferenca()) }]}>
                                    {getFinalDiferenca().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </Text>
                                <View style={styles.buttonContainer}>
                                    <Button title="Confirmar e Salvar Grupo" onPress={handleConfirm} disabled={isSaving} color="#28a745" />
                                </View>
                            </View>
                        </>
                    )}
                    contentContainerStyle={{ paddingBottom: 50 }}
                    keyboardShouldPersistTaps="handled"
                />
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
                                {/* << ALTERAÇÃO AQUI: Mostra os nomes dos caixas >> */}
                                <Text style={styles.modalText}>Caixas do Grupo:</Text>
                                {dataToConfirm.cashierNames.map(name => (
                                    <Text key={name} style={styles.modalListItem}>- {name}</Text>
                                ))}
                                <Text style={styles.modalTextFinal}>Diferença Total:
                                    <Text style={[styles.modalBold, { color: getDiferencaColor(dataToConfirm.totalDiferenca) }]}>
                                        {dataToConfirm.totalDiferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </Text>
                                </Text>
                            </>
                        )}
                        <View style={styles.modalButtonContainer}>
                            <Button title="Cancelar" onPress={() => setModalVisible(false)} color="#6c757d" />
                            <Button title={isSaving ? "Salvando..." : "Salvar"} onPress={handleFinalSave} disabled={isSaving} color="#1E63B8" />
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const CaixaFormItem = React.memo(({ item, index, handleInputChange, handleSelectCashier, cashiers, getDiferencaColor }) => {
    const [filteredCashiers, setFilteredCashiers] = useState([]);

    const onCpfChange = (text) => {
        handleInputChange(item.id, 'cpf', text);
        const cleanCpf = text.replace(/\D/g, '');
        if (cleanCpf.length > 0) {
            setFilteredCashiers(cashiers.filter(c => c.cpf?.toString().startsWith(cleanCpf)));
        } else {
            setFilteredCashiers([]);
        }
    };

    const onSelectCashier = (cashier) => {
        handleSelectCashier(item.id, cashier);
        setFilteredCashiers([]);
    };

    const numValorTotalVenda = (parseInt(String(item.valorTotalVenda).replace(/\D/g, '') || '0', 10)) / 100;
    const numValorEstorno = (parseInt(String(item.valorEstorno).replace(/\D/g, '') || '0', 10)) / 100;
    const numCredito = (parseInt(String(item.credito).replace(/\D/g, '') || '0', 10)) / 100;
    const numDebito = (parseInt(String(item.debito).replace(/\D/g, '') || '0', 10)) / 100;
    const numPix = (parseInt(String(item.pix).replace(/\D/g, '') || '0', 10)) / 100;
    const numCashless = (parseInt(String(item.cashless).replace(/\D/g, '') || '0', 10)) / 100;
    const numDinheiroFisico = (parseInt(String(item.dinheiroFisico).replace(/\D/g, '') || '0', 10)) / 100;

    const valorAcertoCalculado = numValorTotalVenda - (numCredito + numDebito + numPix + numCashless) - (item.temEstorno ? numValorEstorno : 0);
    const diferencaCalculada = numDinheiroFisico - valorAcertoCalculado;

    return (
        <View style={styles.caixaContainer}>
            <Text style={styles.caixaTitle}>Caixa {index + 1}</Text>
            <Text style={styles.label}>CPF do Caixa</Text>
            <TextInput style={styles.input} placeholder="Comece a digitar o CPF" value={item.cpf} onChangeText={onCpfChange} keyboardType="numeric" />
            
            {item.cpf.length > 0 && !item.name && (
                <FlatList
                    data={filteredCashiers}
                    keyExtractor={(c) => c.cpf}
                    renderItem={({ item: cashier }) => (
                        <TouchableOpacity style={styles.suggestionItem} onPress={() => onSelectCashier(cashier)}>
                            <Text>{cashier.name} - {cashier.cpf}</Text>
                        </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                />
            )}
            {!!item.name && <Text style={styles.waiterName}>Caixa: {item.name}</Text>}
            
            <Text style={styles.label}>Número da Máquina</Text>
            <TextInput
                style={styles.input}
                placeholder="Digite o número da máquina"
                value={item.numeroMaquina}
                onChangeText={(text) => handleInputChange(item.id, 'numeroMaquina', text.toUpperCase())}
                autoCapitalize="characters"/>
            
            <View style={styles.switchContainer}><Text style={styles.label}>Houve Estorno Manual?</Text><Switch onValueChange={(value) => handleInputChange(item.id, 'temEstorno', value)} value={item.temEstorno} /></View>
            {item.temEstorno && <TextInput style={[styles.input, styles.boldInput]} placeholder="Valor do Estorno" value={formatCurrency(item.valorEstorno)} onChangeText={text => handleInputChange(item.id, 'valorEstorno', text.replace(/\D/g, ''))} keyboardType="numeric"/>}
            <Text style={styles.label}>Valor Total da Venda</Text>
            <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(item.valorTotalVenda)} onChangeText={text => handleInputChange(item.id, 'valorTotalVenda', text.replace(/\D/g, ''))} keyboardType="numeric"/>
            <Text style={styles.label}>Crédito</Text>
            <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(item.credito)} onChangeText={text => handleInputChange(item.id, 'credito', text.replace(/\D/g, ''))} keyboardType="numeric"/>
            <Text style={styles.label}>Débito</Text>
            <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(item.debito)} onChangeText={text => handleInputChange(item.id, 'debito', text.replace(/\D/g, ''))} keyboardType="numeric"/>
            <Text style={styles.label}>PIX</Text>
            <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(item.pix)} onChangeText={text => handleInputChange(item.id, 'pix', text.replace(/\D/g, ''))} keyboardType="numeric"/>
            <Text style={styles.label}>Cashless</Text>
            <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(item.cashless)} onChangeText={text => handleInputChange(item.id, 'cashless', text.replace(/\D/g, ''))} keyboardType="numeric"/>
            <Text style={[styles.label, {marginTop: 20}]}>Dinheiro Físico (Contado)</Text>
            <TextInput style={[styles.input, styles.boldInput]} placeholder="R$ 0,00" value={formatCurrency(item.dinheiroFisico)} onChangeText={text => handleInputChange(item.id, 'dinheiroFisico', text.replace(/\D/g, ''))} keyboardType="numeric"/>
            <Text style={styles.resultLabel}>Diferença Individual:</Text>
            <Text style={[styles.resultValueFinal, { color: getDiferencaColor(diferencaCalculada) }]}>
                {diferencaCalculada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
        </View>
    );
});


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    screenTitle: { fontSize: 28, fontWeight: 'bold', color: '#0D1B2A', textAlign: 'center', marginTop: 20, marginBottom: 10 },
    section: { marginBottom: 15, paddingHorizontal: 20 },
    label: { fontSize: 18, color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 8, fontSize: 20, borderWidth: 1, borderColor: '#DDE3EA' },
    boldInput: { fontWeight: 'bold', fontSize: 22 },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
    caixaContainer: {
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#FFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    caixaTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE', color: '#1E63B8' },
    resultsContainer: { backgroundColor: '#e9ecef', padding: 20, borderRadius: 8, marginTop: 10, marginHorizontal: 20 },
    resultLabel: { fontSize: 18, color: '#495057', marginBottom: 5, fontWeight: 'bold' },
    resultValueFinal: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    buttonContainer: {
        marginTop: 20,
    },
    suggestionItem: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    waiterName: { fontSize: 18, fontWeight: 'bold', color: 'green', marginVertical: 10, textAlign: 'center' },
    modalCenteredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalView: { margin: 20, backgroundColor: "white", borderRadius: 20, padding: 35, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'left', width: '100%' },
    modalListItem: { fontSize: 16, textAlign: 'left', width: '100%', marginLeft: 10, marginBottom: 5 },
    modalTextFinal: { fontSize: 20, fontWeight: 'bold', marginTop: 15, textAlign: 'center' },
    modalBold: { fontWeight: 'bold' },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 25, },
});

