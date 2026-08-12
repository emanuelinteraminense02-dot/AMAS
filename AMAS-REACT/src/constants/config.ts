// ─────────────────────────────────────────────────────────────────
// Endereço da API Spring Boot.
//
// No navegador (frontend/js/config.js) o "localhost" funciona porque o
// navegador roda na mesma máquina do backend. No celular físico isso
// NÃO funciona — troque o IP abaixo pelo IP da sua máquina na rede
// (rode "ipconfig" no Windows ou "ifconfig" no Mac/Linux e procure
// por algo como 192.168.0.X). O celular e o computador precisam estar
// na mesma rede Wi-Fi.
//
// - Emulador Android: costuma funcionar com 10.0.2.2 no lugar do IP.
// - Simulador iOS / navegador (expo start, tecla w): localhost funciona.
// - Celular físico com Expo Go: use o IP da rede local.
// ─────────────────────────────────────────────────────────────────

// Default API host for development. Use 'localhost' for web/emulator
// or replace with your machine IP when testing on a physical device.
const LOCAL_NETWORK_IP = 'localhost'; // <-- 'localhost' works for expo web / simulator

export const API_BASE = `http://${LOCAL_NETWORK_IP}:8080/api`;

export const SESSION_STORAGE_KEY = 'amas_sessao';
