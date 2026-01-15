import React, { useState, useEffect, useCallback } from 'react';
import { getPlayerReveal, resetGame, getRoom } from '../services/api';

function Reveal({ navigateTo, sessionData, clearSession }) {
  const { playerId, playerName, roomCode, isHost } = sessionData;
  const [reveals, setReveals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);

  const fetchReveal = useCallback(async () => {
    try {
      const data = await getPlayerReveal(playerId);
      setReveals(data.reveals);
      setLoading(false);
    } catch (err) {
      // If game was reset, redirect to character selection
      if (err.response?.data?.error === 'Game has not started yet') {
        navigateTo('characters');
        return;
      }
      setError(err.response?.data?.error || 'Failed to fetch reveal information');
      setLoading(false);
    }
  }, [playerId, navigateTo]);

  // Poll for game reset (non-host players)
  const checkGameStatus = useCallback(async () => {
    try {
      const data = await getRoom(roomCode);
      if (data.room.status === 'character_selection') {
        navigateTo('characters');
      }
    } catch (err) {
      // Ignore errors
    }
  }, [roomCode, navigateTo]);

  useEffect(() => {
    if (!playerId) {
      navigateTo('home');
      return;
    }
    fetchReveal();

    // Poll for game reset every 2 seconds
    const interval = setInterval(checkGameStatus, 2000);
    return () => clearInterval(interval);
  }, [playerId, navigateTo, fetchReveal, checkGameStatus]);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleBackToHome = () => {
    clearSession();
  };

  const handleNewGame = async () => {
    setLoading(true);
    try {
      await resetGame(roomCode, playerId);
      navigateTo('characters');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset game');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading">Loading your character information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="container">
          <div className="error">{error}</div>
          <button className="button button-primary" onClick={handleBackToHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isRevealed) {
    return (
      <div className="app">
        <div className="reveal-container">
          <div className="header">
            <h1>{playerName}</h1>
            <p>Ready to see your character?</p>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '30px', lineHeight: '1.8' }}>
              Make sure no one else can see your screen before revealing your character.
            </p>
            <button
              className="button button-primary"
              onClick={handleReveal}
              style={{ fontSize: '1.3rem', padding: '20px' }}
            >
              Reveal My Character
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="reveal-container">
        <div className="header">
          <h1>{playerName}</h1>
        </div>

        <div className={`reveal-card ${reveals.your_allegiance.toLowerCase()}`}>
          <div className="reveal-character">{reveals.your_character}</div>
          <div className="reveal-allegiance">Allegiance: {reveals.your_allegiance}</div>
          <div className="reveal-message">{reveals.message}</div>

          {reveals.revealed_players && reveals.revealed_players.length > 0 && (
            <div className="revealed-players">
              <h3>You know these players:</h3>
              {reveals.revealed_players.map((name, index) => (
                <div key={index} className="revealed-player">
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            Keep this information secret! The physical board game can now begin.
          </p>

          {isHost && (
            <button
              className="button button-primary"
              onClick={handleNewGame}
              style={{ marginBottom: '10px' }}
            >
              New Game
            </button>
          )}

          <button
            className="button button-secondary"
            onClick={handleBackToHome}
          >
            Exit to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reveal;
