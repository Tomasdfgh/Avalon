import React, { useState, useEffect } from 'react';
import { getPlayerReveal } from '../services/api';

function Reveal({ navigateTo }) {
  const playerId = localStorage.getItem('playerId');
  const [reveals, setReveals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const playerName = localStorage.getItem('playerName');

  useEffect(() => {
    if (!playerId || playerId === 'null') {
      navigateTo('home');
      return;
    }
    fetchReveal();
  }, [playerId]);

  const fetchReveal = async () => {
    try {
      const data = await getPlayerReveal(playerId);
      setReveals(data.reveals);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch reveal information');
      setLoading(false);
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleBackToHome = () => {
    localStorage.clear();
    navigateTo('home');
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
              {reveals.revealed_players.map((playerName, index) => (
                <div key={index} className="revealed-player">
                  {playerName}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
            Keep this information secret! The physical board game can now begin.
          </p>
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
