import React, { useState, useCallback, useRef } from 'react';
import Home from './components/Home';
import Lobby from './components/Lobby';
import CharacterSelection from './components/CharacterSelection';
import Reveal from './components/Reveal';
import { leaveRoom } from './services/api';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [sessionData, setSessionData] = useState({
    playerId: null,
    playerName: null,
    roomCode: null,
    isHost: false
  });
  const sessionRef = useRef(sessionData);
  sessionRef.current = sessionData;

  const navigateTo = useCallback((page, data = {}) => {
    if (Object.keys(data).length > 0) {
      setSessionData(prev => ({ ...prev, ...data }));
    }
    setCurrentPage(page);
  }, []);

  const clearSession = useCallback(async () => {
    const { roomCode, playerId } = sessionRef.current;
    if (roomCode && playerId) {
      try {
        await leaveRoom(roomCode, playerId);
      } catch (err) {
        // Ignore errors - player may already be removed
      }
    }
    setSessionData({
      playerId: null,
      playerName: null,
      roomCode: null,
      isHost: false
    });
    setCurrentPage('home');
  }, []);

  switch (currentPage) {
    case 'home':
      return <Home navigateTo={navigateTo} />;
    case 'lobby':
      return <Lobby navigateTo={navigateTo} sessionData={sessionData} clearSession={clearSession} />;
    case 'characters':
      return <CharacterSelection navigateTo={navigateTo} sessionData={sessionData} clearSession={clearSession} />;
    case 'reveal':
      return <Reveal navigateTo={navigateTo} sessionData={sessionData} clearSession={clearSession} />;
    default:
      return <Home navigateTo={navigateTo} />;
  }
}

export default App;
