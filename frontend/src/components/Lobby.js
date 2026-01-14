import React, { useState, useEffect } from 'react';
import { getRoom, configureRoom } from '../services/api';

function Lobby({ navigateTo }) {
  const roomCode = localStorage.getItem('roomCode');
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [optionalCharacters, setOptionalCharacters] = useState([]);
  const playerId = parseInt(localStorage.getItem('playerId'));
  const isHost = localStorage.getItem('isHost') === 'true';

  const optionalCharactersList = [
    { name: 'Percival', description: 'Knows who Merlin is (Good)' },
    { name: 'Mordred', description: 'Hidden from Merlin (Evil)' },
    { name: 'Oberon', description: 'Isolated evil player (Evil)' },
    { name: 'Morgana', description: 'Appears as Merlin to Percival (Evil)' }
  ];

  useEffect(() => {
    if (!roomCode) {
      navigateTo('home');
      return;
    }
    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const fetchRoom = async () => {
    try {
      const data = await getRoom(roomCode);
      setRoom(data.room);
      setLoading(false);

      // Navigate to character selection if status changed
      if (data.room.status === 'character_selection') {
        navigateTo('characters');
      } else if (data.room.status === 'started') {
        navigateTo('reveal');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch room');
      setLoading(false);
    }
  };

  const handleToggleCharacter = (characterName) => {
    setOptionalCharacters(prev =>
      prev.includes(characterName)
        ? prev.filter(c => c !== characterName)
        : [...prev, characterName]
    );
  };

  const handleConfigure = async () => {
    if (room.player_count < 5 || room.player_count > 10) {
      setError('Need 5-10 players to start');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await configureRoom(roomCode, playerId, optionalCharacters);
      fetchRoom();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to configure room');
      setLoading(false);
    }
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

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Game Lobby</h1>
          <p>Waiting for players to join</p>
        </div>

        <div className="room-code">
          <div className="room-code-label">Room Code</div>
          <div className="room-code-value">{roomCode}</div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="card">
          <h2 className="section-title">
            Players ({room?.player_count || 0}/10)
          </h2>
          {room?.player_count < 5 && (
            <p className="info-text">Need at least 5 players to start</p>
          )}
          <ul className="player-list">
            {room?.players?.map((player) => (
              <li key={player.id} className="player-item">
                <span className="player-name">{player.player_name}</span>
                {player.is_host && <span className="host-badge">Host</span>}
              </li>
            ))}
          </ul>
        </div>

        {isHost && (
          <>
            <div className="card">
              <h2 className="section-title">Optional Characters</h2>
              <p className="info-text">
                Select optional characters to include in the game
              </p>
              <div className="checkbox-group">
                {optionalCharactersList.map((char) => (
                  <label key={char.name}>
                    <input
                      type="checkbox"
                      checked={optionalCharacters.includes(char.name)}
                      onChange={() => handleToggleCharacter(char.name)}
                    />
                    <strong>{char.name}</strong> - {char.description}
                  </label>
                ))}
              </div>
            </div>

            <button
              className={`button button-success ${
                (room?.player_count < 5 || room?.player_count > 10 || loading)
                  ? 'button-disabled'
                  : ''
              }`}
              onClick={handleConfigure}
              disabled={room?.player_count < 5 || room?.player_count > 10 || loading}
            >
              {loading ? 'Starting...' : 'Start Character Selection'}
            </button>
          </>
        )}

        {!isHost && (
          <p className="info-text">
            Waiting for host to configure the game...
          </p>
        )}
      </div>
    </div>
  );
}

export default Lobby;
