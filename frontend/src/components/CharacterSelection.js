import React, { useState, useEffect, useCallback } from 'react';
import { getRoom, getAvailableCharacters, selectCharacter, startGame } from '../services/api';

function CharacterSelection({ navigateTo, sessionData }) {
  const { roomCode, playerId, playerName, isHost } = sessionData;
  const [room, setRoom] = useState(null);
  const [availableCharacters, setAvailableCharacters] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [roomData, charsData] = await Promise.all([
        getRoom(roomCode),
        getAvailableCharacters(roomCode)
      ]);

      setRoom(roomData.room);
      setAvailableCharacters(charsData);

      // Find current player's character
      const currentPlayer = roomData.room.players.find(p => p.id === playerId);
      if (currentPlayer?.character_role) {
        setSelectedCharacter(currentPlayer.character_role);
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

  const handleSelectCharacter = async (character) => {
    setLoading(true);
    setError('');

    try {
      await selectCharacter(playerId, character);
      setSelectedCharacter(character);
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

  const isCharacterTaken = (character) => {
    return availableCharacters?.selected_characters?.includes(character) &&
           character !== selectedCharacter;
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
          <h2 className="section-title">Good Characters</h2>
          <p className="info-text">
            Need {availableCharacters?.available_characters?.good_count} Good players
          </p>
          <div className="character-grid">
            {goodChars.map((char) => (
              <button
                key={char}
                className={`character-button ${selectedCharacter === char ? 'selected' : ''}`}
                onClick={() => handleSelectCharacter(char)}
                disabled={isCharacterTaken(char) || loading}
              >
                <span className="character-name">{char}</span>
                <span className="character-allegiance">Good</span>
                {isCharacterTaken(char) && ' (Taken)'}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Evil Characters</h2>
          <p className="info-text">
            Need {availableCharacters?.available_characters?.evil_count} Evil players
          </p>
          <div className="character-grid">
            {evilChars.map((char) => (
              <button
                key={char}
                className={`character-button ${selectedCharacter === char ? 'selected' : ''}`}
                onClick={() => handleSelectCharacter(char)}
                disabled={isCharacterTaken(char) || loading}
              >
                <span className="character-name">{char}</span>
                <span className="character-allegiance">Evil</span>
                {isCharacterTaken(char) && ' (Taken)'}
              </button>
            ))}
          </div>
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
      </div>
    </div>
  );
}

export default CharacterSelection;
