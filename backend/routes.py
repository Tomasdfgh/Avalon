from flask import Blueprint, request, jsonify
import storage
from game_logic import get_character_reveals, validate_character_selection, get_available_characters

api = Blueprint('api', __name__)


@api.route('/rooms', methods=['POST'])
def create_room():
    """Create a new room."""
    try:
        data = request.json
        player_name = data.get('player_name')

        if not player_name:
            return jsonify({'error': 'Player name is required'}), 400

        room, player = storage.create_room(player_name)
        room_data = storage.get_room_with_players(room['room_code'])

        return jsonify({
            'room': room_data,
            'player': player
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/rooms/<room_code>/join', methods=['POST'])
def join_room(room_code):
    """Join an existing room."""
    try:
        data = request.json
        player_name = data.get('player_name')

        if not player_name:
            return jsonify({'error': 'Player name is required'}), 400

        room, player, error = storage.join_room(room_code, player_name)

        if error:
            status_code = 404 if error == 'Room not found' else 400
            return jsonify({'error': error}), status_code

        room_data = storage.get_room_with_players(room_code)

        return jsonify({
            'room': room_data,
            'player': player
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/rooms/<room_code>', methods=['GET'])
def get_room(room_code):
    """Get room details."""
    try:
        # Update heartbeat if player_id is provided
        player_id = request.args.get('player_id', type=int)
        if player_id:
            storage.update_player_heartbeat(player_id)

        room_data = storage.get_room_with_players(room_code)
        if not room_data:
            return jsonify({'error': 'Room not found'}), 404

        return jsonify({'room': room_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/rooms/<room_code>/configure', methods=['POST'])
def configure_room(room_code):
    """Configure optional characters for the room (host only)."""
    try:
        data = request.json
        player_id = data.get('player_id')
        optional_characters = data.get('optional_characters', [])

        room, error = storage.configure_room(room_code, player_id, optional_characters)

        if error:
            status_code = 404 if error == 'Room not found' else 403 if 'host' in error else 400
            return jsonify({'error': error}), status_code

        room_data = storage.get_room_with_players(room_code)
        return jsonify({'room': room_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/rooms/<room_code>/available-characters', methods=['GET'])
def get_available_characters_endpoint(room_code):
    """Get available characters for selection."""
    try:
        room = storage.get_room(room_code)
        if not room:
            return jsonify({'error': 'Room not found'}), 404

        if room['status'] == 'waiting':
            return jsonify({'error': 'Host must configure optional characters first'}), 400

        available = get_available_characters(room['player_count'], room['optional_characters'] or [])

        # Get already selected characters
        players_in_room = storage.get_players_in_room(room_code)
        selected_characters = [p['character_role'] for p in players_in_room if p['character_role']]

        return jsonify({
            'available_characters': available,
            'selected_characters': selected_characters
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/players/<int:player_id>/select-character', methods=['POST'])
def select_character(player_id):
    """Player selects their character."""
    try:
        data = request.json
        character = data.get('character')

        if not character:
            return jsonify({'error': 'Character is required'}), 400

        # Get player and room to validate character
        player = storage.get_player(player_id)
        if not player:
            return jsonify({'error': 'Player not found'}), 404

        room = storage.get_room_by_player_id(player_id)
        if not room:
            return jsonify({'error': 'Room not found'}), 404

        # Validate character is available
        available = get_available_characters(room['player_count'], room['optional_characters'] or [])
        all_available = available['good'] + available['evil']
        if character not in all_available:
            return jsonify({'error': 'Character not available for this game'}), 400

        player, error = storage.select_character(player_id, character)

        if error:
            return jsonify({'error': error}), 400

        return jsonify({'player': player}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/rooms/<room_code>/start', methods=['POST'])
def start_game(room_code):
    """Start the game (host only)."""
    try:
        data = request.json
        player_id = data.get('player_id')

        # Validate character selection before starting
        room = storage.get_room(room_code)
        if not room:
            return jsonify({'error': 'Room not found'}), 404

        players_in_room = storage.get_players_in_room(room_code)
        players_data = [{'character_role': p['character_role'], 'player_name': p['player_name']}
                        for p in players_in_room]

        is_valid, error = validate_character_selection(players_data, room['optional_characters'] or [])
        if not is_valid:
            return jsonify({'error': error}), 400

        room, error = storage.start_game(room_code, player_id)

        if error:
            status_code = 404 if error == 'Room not found' else 403 if 'host' in error else 400
            return jsonify({'error': error}), status_code

        room_data = storage.get_room_with_players(room_code)
        return jsonify({'room': room_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/players/<int:player_id>/reveal', methods=['GET'])
def get_player_reveal(player_id):
    """Get character reveal information for a player."""
    try:
        player = storage.get_player(player_id)
        if not player:
            return jsonify({'error': 'Player not found'}), 404

        room = storage.get_room_by_player_id(player_id)
        if not room:
            return jsonify({'error': 'Room not found'}), 404

        if room['status'] != 'started':
            return jsonify({'error': 'Game has not started yet'}), 400

        if not player['character_role']:
            return jsonify({'error': 'Player has not selected a character'}), 400

        # Get all players in the room
        players_in_room = storage.get_players_in_room(room['room_code'])
        all_players = [{'player_name': p['player_name'], 'character_role': p['character_role']}
                       for p in players_in_room]

        # Get reveal information
        reveals = get_character_reveals(player['character_role'], all_players)

        return jsonify({'reveals': reveals}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/rooms/<room_code>/reset', methods=['POST'])
def reset_game(room_code):
    """Reset game back to character selection (host only)."""
    try:
        data = request.json
        player_id = data.get('player_id')

        room, error = storage.reset_game(room_code, player_id)

        if error:
            status_code = 404 if error == 'Room not found' else 403
            return jsonify({'error': error}), status_code

        room_data = storage.get_room_with_players(room_code)
        return jsonify({'room': room_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'}), 200
