# Avalon Helper

A digital character reveal application for The Resistance: Avalon board game. This mobile-first web application helps players manage the character reveal phase of the game, preventing confusion and mistakes during the setup.

## Features

- **Room Management**: Create or join game rooms with unique 6-digit codes
- **Character Selection**: Players self-select their characters from available roles
- **Automated Reveals**: Each player sees only the information their character should know
- **Optional Characters**: Host can configure which optional characters to include (Percival, Mordred, Oberon, Morgana)
- **Mobile-First Design**: Optimized for vertical phone displays
- **Real-time Updates**: Players see live updates as others join and select characters

## Game Rules Implemented

The app follows the official Avalon rules:

- **Merlin** sees all evil players (except Mordred if present)
- **Percival** sees Merlin (and Morgana if present)
- **Evil players** (Minions of Mordred) know each other (except Oberon)
- **Oberon** doesn't know other evil players, and they don't know him
- **Mordred's** identity is hidden from Merlin
- **Morgana** appears as Merlin to Percival
- **Loyal Servants** have no special knowledge

## Tech Stack

- **Frontend**: React 18 with React Router
- **Backend**: Python Flask with Flask-SQLAlchemy
- **Database**: MySQL 8.0
- **Orchestration**: Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system

### Installation & Running

1. Clone the repository:
```bash
cd avalon_helper
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Stopping the Application

```bash
docker-compose down
```

To remove all data including the database:
```bash
docker-compose down -v
```

## How to Use

1. **Create a Room**:
   - One player (the host) clicks "Create Room"
   - Enter your name and get a 6-digit room code
   - Share the code with other players

2. **Join a Room**:
   - Other players click "Join Room"
   - Enter your name and the 6-digit room code

3. **Configure Characters** (Host only):
   - Select which optional characters to include
   - Click "Start Character Selection"

4. **Select Characters**:
   - Each player selects their character from available roles
   - The app ensures proper team distribution (Good vs Evil)

5. **Begin Game** (Host only):
   - Once all players have selected characters, host clicks "Begin Game"

6. **View Your Character**:
   - Each player privately views their character and related information
   - Keep your screen private from other players!

7. **Play the Board Game**:
   - Now proceed with the physical board game
   - All players know their roles and the information they should have

## Project Structure

```
avalon_helper/
├── backend/
│   ├── app.py              # Flask application entry point
│   ├── models.py           # Database models
│   ├── routes.py           # API endpoints
│   ├── game_logic.py       # Avalon game rules
│   ├── init.sql            # Database initialization
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.js
│   │   │   ├── Lobby.js
│   │   │   ├── CharacterSelection.js
│   │   │   └── Reveal.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## API Endpoints

- `POST /api/rooms` - Create a new room
- `POST /api/rooms/{code}/join` - Join a room
- `GET /api/rooms/{code}` - Get room details
- `POST /api/rooms/{code}/configure` - Configure optional characters (host only)
- `GET /api/rooms/{code}/available-characters` - Get available characters
- `POST /api/players/{id}/select-character` - Select a character
- `POST /api/rooms/{code}/start` - Start the game (host only)
- `GET /api/players/{id}/reveal` - Get character reveal information

## Player Count Configurations

| Players | Good | Evil |
|---------|------|------|
| 5       | 3    | 2    |
| 6       | 4    | 2    |
| 7       | 4    | 3    |
| 8       | 5    | 3    |
| 9       | 6    | 3    |
| 10      | 6    | 4    |

## Development

### Backend Development

The backend uses Flask with hot-reload enabled. Changes to Python files will automatically restart the server.

### Frontend Development

The frontend uses React with hot-reload. Changes to React components will automatically update in the browser.

### Database

MySQL runs in a Docker container with persistent storage. The database is automatically initialized with the schema from `backend/init.sql`.

## License

This project is for educational and personal use only. The Resistance: Avalon is a trademark of Indie Boards & Cards.

## Credits

Game Design: Don Eskridge
This application is a fan-made tool to assist with gameplay and is not officially affiliated with the game.
