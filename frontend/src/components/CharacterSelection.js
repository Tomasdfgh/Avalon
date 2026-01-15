import React, { useState, useEffect, useCallback } from 'react';
import { getRoom, getAvailableCharacters, selectCharacter, startGame } from '../services/api';

function CharacterSelection({ navigateTo, sessionData, clearSession }) {
  const { roomCode, playerId, playerName, isHost } = sessionData;
  const [room, setRoom] = useState(null);
  const [availableCharacters, setAvailableCharacters] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [pickerValue, setPickerValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [roomData, charsData] = await Promise.all([
        getRoom(roomCode, playerId),
        getAvailableCharacters(roomCode)
      ]);

      setRoom(roomData.room);
      setAvailableCharacters(charsData);

      // Find current player's character
      const currentPlayer = roomData.room.players.find(p => p.id === playerId);
      if (currentPlayer?.character_role) {
        setSelectedCharacter(currentPlayer.character_role);
        setPickerValue(currentPlayer.character_role);

        // Set the index to the current character
        const goodChars = charsData?.available_characters?.good || [];
        const evilChars = charsData?.available_characters?.evil || [];
        const allChars = [
          ...goodChars.map(c => ({ name: c, allegiance: 'Good' })),
          ...evilChars.map(c => ({ name: c, allegiance: 'Evil' }))
        ];
        const charIndex = allChars.findIndex(c => c.name === currentPlayer.character_role);
        if (charIndex >= 0) {
          setCurrentIndex(charIndex);
        }
      }

      // Navigate to reveal if game started
      if (roomData.room.status === 'started') {
        navigateTo('reveal');
      }

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
      setLoading(false);
    }
  }, [roomCode, playerId, navigateTo]);

  useEffect(() => {
    if (!roomCode) {
      navigateTo('home');
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [roomCode, navigateTo, fetchData]);

  // Initialize picker value when characters load and no selection has been made
  useEffect(() => {
    if (availableCharacters && !pickerValue && !selectedCharacter) {
      const goodChars = availableCharacters?.available_characters?.good || [];
      const evilChars = availableCharacters?.available_characters?.evil || [];
      const allChars = [
        ...goodChars.map(c => ({ name: c, allegiance: 'Good' })),
        ...evilChars.map(c => ({ name: c, allegiance: 'Evil' }))
      ];
      if (allChars.length > 0) {
        setPickerValue(allChars[0].name);
      }
    }
  }, [availableCharacters, pickerValue, selectedCharacter]);

  const handleConfirmSelection = async () => {
    if (!pickerValue) {
      setError('Please select a character');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await selectCharacter(playerId, pickerValue);
      setSelectedCharacter(pickerValue);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to select character');
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    setLoading(true);
    setError('');

    try {
      await startGame(roomCode, playerId);
      navigateTo('reveal');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start game');
      setLoading(false);
    }
  };

  const allPlayersReady = () => {
    return room?.players?.every(p => p.character_role !== null);
  };

  if (loading && !room) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  const goodChars = availableCharacters?.available_characters?.good || [];
  const evilChars = availableCharacters?.available_characters?.evil || [];

  // Combine all characters with their allegiance
  const allCharacters = [
    ...goodChars.map(c => ({ name: c, allegiance: 'Good' })),
    ...evilChars.map(c => ({ name: c, allegiance: 'Evil' }))
  ];

  const currentChar = allCharacters[currentIndex] || { name: '', allegiance: '' };

  const handlePrev = () => {
    setCurrentIndex(prev => {
      const newIndex = prev <= 0 ? allCharacters.length - 1 : prev - 1;
      const char = allCharacters[newIndex];
      setPickerValue(char.name);
      return newIndex;
    });
  };

  const handleNext = () => {
    setCurrentIndex(prev => {
      const newIndex = prev >= allCharacters.length - 1 ? 0 : prev + 1;
      const char = allCharacters[newIndex];
      setPickerValue(char.name);
      return newIndex;
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Character Selection</h1>
          <p>Choose your character, {playerName}</p>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="card">
          <h2 className="section-title">Players Ready</h2>
          <ul className="player-list">
            {room?.players?.map((player) => (
              <li key={player.id} className="player-item">
                <span className="player-name">{player.player_name}</span>
                {player.character_role && (
                  <span className="character-badge">Ready</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <p className="info-text">
            Need {availableCharacters?.available_characters?.good_count} Good, {availableCharacters?.available_characters?.evil_count} Evil
          </p>

          <div className="wheel-picker-container">
            <div className="wheel-picker-row">
              <div
                className="wheel-window"
                tabIndex={0}
                role="spinbutton"
                aria-valuenow={currentIndex + 1}
                aria-valuemin={1}
                aria-valuemax={allCharacters.length}
                aria-valuetext={currentChar.name}
                onWheel={handleWheel}
                onKeyDown={handleKeyDown}
              >
                <div className="wheel-window-content">
                  <span className="picker-character-name">{currentChar.name}</span>
                  <span className={`picker-allegiance ${currentChar.allegiance.toLowerCase()}`}>
                    {currentChar.allegiance}
                  </span>
                </div>
                <div className="wheel-scroll-track">
                  <button
                    type="button"
                    className="wheel-scroll-btn"
                    onClick={handlePrev}
                    aria-label="Previous character"
                  >
                    <svg className="wheel-scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="wheel-scroll-btn"
                    onClick={handleNext}
                    aria-label="Next character"
                  >
                    <svg className="wheel-scroll-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedCharacter && (
            <div className="current-selection">
              Current: <strong>{selectedCharacter}</strong>
            </div>
          )}

          <button
            className={`button button-primary ${(!pickerValue || loading) ? 'button-disabled' : ''}`}
            onClick={handleConfirmSelection}
            disabled={!pickerValue || loading}
          >
            {loading ? 'Selecting...' : 'Confirm Selection'}
          </button>
        </div>

        {isHost && (
          <button
            className={`button button-success ${
              (!allPlayersReady() || loading) ? 'button-disabled' : ''
            }`}
            onClick={handleStartGame}
            disabled={!allPlayersReady() || loading}
          >
            {loading ? 'Starting...' : 'Begin Game'}
          </button>
        )}

        {!isHost && !allPlayersReady() && (
          <p className="info-text">
            Waiting for all players to select characters...
          </p>
        )}

        {!isHost && allPlayersReady() && (
          <p className="info-text">
            Waiting for host to start the game...
          </p>
        )}

        <button
          className="button button-secondary"
          onClick={clearSession}
          style={{ marginTop: '20px' }}
        >
          Exit Room
        </button>
      </div>
    </div>
  );
}

export default CharacterSelection;
