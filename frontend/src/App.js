import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Lobby from './components/Lobby';
import CharacterSelection from './components/CharacterSelection';
import Reveal from './components/Reveal';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Clear session data on fresh page load
  useEffect(() => {
    localStorage.clear();
  }, []);

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  switch (currentPage) {
    case 'home':
      return <Home navigateTo={navigateTo} />;
    case 'lobby':
      return <Lobby navigateTo={navigateTo} />;
    case 'characters':
      return <CharacterSelection navigateTo={navigateTo} />;
    case 'reveal':
      return <Reveal navigateTo={navigateTo} />;
    default:
      return <Home navigateTo={navigateTo} />;
  }
}

export default App;
