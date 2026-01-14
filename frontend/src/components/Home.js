import React, { useState } from 'react';
import { createRoom, joinRoom } from '../services/api';

function Home({ navigateTo }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await createRoom(playerName.trim());
      localStorage.setItem('playerId', data.player.id);
      localStorage.setItem('playerName', data.player.player_name);
      localStorage.setItem('roomCode', data.room.room_code);
      localStorage.setItem('isHost', 'true');
      navigateTo('lobby');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 6) {
      setError('Please enter a valid 6-digit room code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await joinRoom(roomCode.trim(), playerName.trim());
      localStorage.setItem('playerId', data.player.id);
      localStorage.setItem('playerName', data.player.player_name);
      localStorage.setItem('roomCode', data.room.room_code);
      localStorage.setItem('isHost', 'false');
      navigateTo('lobby');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  if (mode === null) {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>Avalon Helper</h1>
            <p>Digital character reveal for The Resistance: Avalon</p>
          </div>

          <button
            className="button button-primary"
            onClick={() => setMode('create')}
          >
            Create Room
          </button>

          <button
            className="button button-secondary"
            onClick={() => setMode('join')}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>Create Room</h1>
            <p>Start a new Avalon game</p>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleCreateRoom}>
            <div className="input-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={100}
              />
            </div>

            <button
              type="submit"
              className={`button button-primary ${loading ? 'button-disabled' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => setMode(null)}
              disabled={loading}
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>Join Room</h1>
            <p>Enter the room code to join</p>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleJoinRoom}>
            <div className="input-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={100}
              />
            </div>

            <div className="input-group">
              <label htmlFor="roomCode">Room Code</label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                maxLength={6}
                inputMode="numeric"
              />
            </div>

            <button
              type="submit"
              className={`button button-primary ${loading ? 'button-disabled' : ''}`}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => setMode(null)}
              disabled={loading}
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }
}

export default Home;
