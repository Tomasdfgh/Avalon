import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createRoom = async (playerName) => {
  const response = await api.post('/rooms', { player_name: playerName });
  return response.data;
};

export const joinRoom = async (roomCode, playerName) => {
  const response = await api.post(`/rooms/${roomCode}/join`, { player_name: playerName });
  return response.data;
};

export const getRoom = async (roomCode) => {
  const response = await api.get(`/rooms/${roomCode}`);
  return response.data;
};

export const configureRoom = async (roomCode, playerId, optionalCharacters) => {
  const response = await api.post(`/rooms/${roomCode}/configure`, {
    player_id: playerId,
    optional_characters: optionalCharacters,
  });
  return response.data;
};

export const getAvailableCharacters = async (roomCode) => {
  const response = await api.get(`/rooms/${roomCode}/available-characters`);
  return response.data;
};

export const selectCharacter = async (playerId, character) => {
  const response = await api.post(`/players/${playerId}/select-character`, { character });
  return response.data;
};

export const startGame = async (roomCode, playerId) => {
  const response = await api.post(`/rooms/${roomCode}/start`, { player_id: playerId });
  return response.data;
};

export const getPlayerReveal = async (playerId) => {
  const response = await api.get(`/players/${playerId}/reveal`);
  return response.data;
};

export const resetGame = async (roomCode, playerId) => {
  const response = await api.post(`/rooms/${roomCode}/reset`, { player_id: playerId });
  return response.data;
};

export default api;
