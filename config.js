// frontend/config.js

// A variável global __DEV__ é verdadeira quando você está rodando o app localmente
// no modo de desenvolvimento (com Expo Go). Ela é falsa quando você gera o APK final.
const isDevelopment = __DEV__;

export const API_URL = isDevelopment 
  ? 'http://192.168.15.34:3001' // Seu IP local para testes no Expo Go
  : 'https://fabinho-eventos-backend.onrender.com'; // Sua URL pública do servidor na Render