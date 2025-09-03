// App.js (Corrigido com Stack.Group)

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Telas
import LoginScreen from './screens/LoginScreen';
import ModuleSelectionScreen from './screens/ModuleSelectionScreen';

// Telas do Módulo Financeiro
import EventSelectionScreen from './screens/EventSelectionScreen';
import SelectionScreen from './screens/SelectionScreen';
import WaiterClosingScreen from './screens/WaiterClosingScreen';
import WaiterClosing10Screen from './screens/WaiterClosing10Screen';
import MobileCashierClosingScreen from './screens/MobileCashierClosingScreen';
import ClosingHistoryScreen from './screens/ClosingHistoryScreen';
import FixedCashierClosingScreen from './screens/FixedCashierClosingScreen';

// Telas do Módulo de Estoque
import StockDashboardScreen from './screens/StockDashboardScreen';
import CurrentStockScreen from './screens/CurrentStockScreen';
import StockMovementsScreen from './screens/StockMovementsScreen';
import ReturnsScreen from './screens/ReturnsScreen';
import StockRegistrationsScreen from './screens/StockRegistrationsScreen';
import InventoryScreen from './screens/InventoryScreen';
import AuditScreen from './screens/AuditScreen';
import ReportsScreen from './screens/ReportsScreen';
import ReturnReportScreen from './screens/ReturnReportScreen';
import NewCpfRegistrationScreen from './screens/NewCpfRegistrationScreen';
import NewCnpjRegistrationScreen from './screens/NewCnpjRegistrationScreen';
import NewEventRegistrationScreen from './screens/NewEventRegistrationScreen';
import TransactionReportScreen from './screens/TransactionReportScreen';
import TransactionEntryScreen from './screens/TransactionEntryScreen';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userCpf = await AsyncStorage.getItem('loggedInUserCpf');
        if (userCpf) setInitialRoute('ModuleSelection');
        else setInitialRoute('Login');
      } catch (e) {
        setInitialRoute('Login');
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  if (isLoading) {
    return ( <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View> );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: '#1E63B8' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {/* Telas de Autenticação e Seleção de Módulo */}
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ModuleSelection" component={ModuleSelectionScreen} options={{ title: 'Seleção de Módulo' }} />
        </Stack.Group>

        {/* Grupo de telas do Módulo Financeiro */}
        <Stack.Group>
          <Stack.Screen name="EventSelection" component={EventSelectionScreen} options={{ title: 'Seleção de Evento' }} />
          <Stack.Screen name="Selection" component={SelectionScreen} options={{ title: 'Tipo de Fechamento' }} />
          <Stack.Screen name="WaiterClosing" component={WaiterClosingScreen} options={{ title: 'Fechamento Garçom' }} />
          <Stack.Screen name="WaiterClosing10" component={WaiterClosing10Screen} options={{ title: 'Fechamento Garçom 10%' }} />
          <Stack.Screen name="MobileCashierClosing" component={MobileCashierClosingScreen} options={{ title: 'Fechamento Caixa Móvel' }} />
          <Stack.Screen name="FixedCashierClosing" component={FixedCashierClosingScreen} options={{ title: 'Fechamento Caixa Fixo' }} />
          <Stack.Screen name="ClosingHistory" component={ClosingHistoryScreen} options={{ title: 'Histórico de Fechamentos' }} />
        </Stack.Group>
        
        {/* Grupo de telas do Módulo de Estoque */}
        <Stack.Group>
          <Stack.Screen name="StockDashboard" component={StockDashboardScreen} options={{ title: 'Dashboard de Estoque' }} />
          <Stack.Screen name="CurrentStock" component={CurrentStockScreen} options={{ title: 'Estoque Atual' }} />
          <Stack.Screen name="StockMovements" component={StockMovementsScreen} options={{ title: 'Entradas e Saídas' }} />
          <Stack.Screen name="Returns" component={ReturnsScreen} options={{ title: 'Devoluções' }} />
          <Stack.Screen name="StockRegistrations" component={StockRegistrationsScreen} options={{ title: 'Cadastros' }} />
          <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventário' }} />
          <Stack.Screen name="Audit" component={AuditScreen} options={{ title: 'Auditoria' }} />
          <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Relatórios de Estoque' }} />
          <Stack.Screen name="ReturnReport" component={ReturnReportScreen} options={{ title: 'Comprovante de Devolução' }} />
          <Stack.Screen name="NewCpfRegistration" component={NewCpfRegistrationScreen} options={{ title: 'Novo Cadastro CPF' }} />
          <Stack.Screen name="NewCnpjRegistration" component={NewCnpjRegistrationScreen} options={{ title: 'Novo Cadastro CNPJ' }} />
          <Stack.Screen name="NewEventRegistration" component={NewEventRegistrationScreen} options={{ title: 'Novo Cadastro Evento' }} />
          <Stack.Screen name="TransactionReport" component={TransactionReportScreen} options={{ title: 'Comprovante' }} />
          <Stack.Screen name="TransactionEntry" component={TransactionEntryScreen} options={({ route }) => ({ title: route.params.title })} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}