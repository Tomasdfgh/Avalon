"""
In-memory storage for rooms and players.
Data is lost when the server restarts.
"""
import random
import string
from datetime import datetime

# In-memory storage
rooms = {}  # room_code -> room dict
players = {}  # player_id -> player dict
player_id_counter = 0
room_id_counter = 0


def generate_room_code():
    """Generate a unique 6-digit room code."""
    while True:
        code = ''.join(random.choices(string.digits, k=6))
        if code not in rooms:
            return code


def create_room(player_name):
    """Create a new room and add the creator as host."""
    global room_id_counter, player_id_counter

    room_id_counter += 1
    player_id_counter += 1

    room_code = generate_room_code()

    player = {
        'id': player_id_counter,
        'room_id': room_id_counter,
        'player_name': player_name,
        'character_role': None,
        'is_host': True,
        'joined_at': datetime.utcnow().isoformat()
    }

    room = {
        'id': room_id_counter,
        'room_code': room_code,
        'host_player_id': player_id_counter,
        'status': 'waiting',
        'player_count': 1,
        'optional_characters': [],
        'created_at': datetime.utcnow().isoformat(),
        'player_ids': [player_id_counter]
    }

    rooms[room_code] = room
    players[player_id_counter] = player

    return room, player


def join_room(room_code, player_name):
    """Join an existing room."""
    global player_id_counter

    room = rooms.get(room_code)
    if not room:
        return None, None, 'Room not found'

    if room['status'] == 'started':
        return None, None, 'Game has already started'

    # Check if player name is already taken
    for pid in room['player_ids']:
        if players[pid]['player_name'] == player_name:
            return None, None, 'Player name already taken in this room'

    player_id_counter += 1

    player = {
        'id': player_id_counter,
        'room_id': room['id'],
        'player_name': player_name,
        'character_role': None,
        'is_host': False,
        'joined_at': datetime.utcnow().isoformat()
    }

    players[player_id_counter] = player
    room['player_ids'].append(player_id_counter)
    room['player_count'] = len(room['player_ids'])

    return room, player, None


def get_room(room_code):
    """Get room by code."""
    return rooms.get(room_code)


def get_room_with_players(room_code, cleanup=False):
    """Get room with full player list."""
    room = rooms.get(room_code)
    if not room:
        return None

    room_data = dict(room)
    room_data['players'] = [players[pid] for pid in room['player_ids']]
    return room_data


def get_player(player_id):
    """Get player by ID."""
    return players.get(player_id)


def configure_room(room_code, player_id, optional_characters):
    """Configure optional characters for a room."""
    room = rooms.get(room_code)
    if not room:
        return None, 'Room not found'

    if room['host_player_id'] != player_id:
        return None, 'Only the host can configure the room'

    if room['status'] != 'waiting':
        return None, 'Cannot configure room after character selection has started'

    room['optional_characters'] = optional_characters
    room['status'] = 'character_selection'

    return room, None


def select_character(player_id, character):
    """Player selects their character."""
    player = players.get(player_id)
    if not player:
        return None, 'Player not found'

    room = None
    for r in rooms.values():
        if r['id'] == player['room_id']:
            room = r
            break

    if not room:
        return None, 'Room not found'

    if room['status'] != 'character_selection':
        return None, 'Character selection is not active'

    # Filler roles can be selected by multiple players
    filler_roles = ['Loyal Servant', 'Minion of Mordred']

    # Check if character is already taken (only for unique/special characters)
    if character not in filler_roles:
        for pid in room['player_ids']:
            p = players[pid]
            if p['character_role'] == character and p['id'] != player_id:
                return None, 'Character already selected by another player'

    player['character_role'] = character
    return player, None


def start_game(room_code, player_id):
    """Start the game."""
    room = rooms.get(room_code)
    if not room:
        return None, 'Room not found'

    if room['host_player_id'] != player_id:
        return None, 'Only the host can start the game'

    if room['status'] != 'character_selection':
        return None, 'Cannot start game from current state'

    # Check all players have selected characters
    for pid in room['player_ids']:
        if players[pid]['character_role'] is None:
            return None, 'All players must select a character first'

    room['status'] = 'started'
    return room, None


def get_players_in_room(room_code):
    """Get all players in a room."""
    room = rooms.get(room_code)
    if not room:
        return []

    return [players[pid] for pid in room['player_ids']]


def get_room_by_player_id(player_id):
    """Get the room a player is in."""
    player = players.get(player_id)
    if not player:
        return None

    for room in rooms.values():
        if room['id'] == player['room_id']:
            return room
    return None


def reset_game(room_code, player_id):
    """Reset game back to character selection (host only)."""
    room = rooms.get(room_code)
    if not room:
        return None, 'Room not found'

    if room['host_player_id'] != player_id:
        return None, 'Only the host can reset the game'

    # Clear all player character selections
    for pid in room['player_ids']:
        players[pid]['character_role'] = None

    # Reset room status to character selection
    room['status'] = 'character_selection'

    return room, None


def kick_player(room_code, host_player_id, player_id_to_kick):
    """Kick a player from the room (host only)."""
    room = rooms.get(room_code)
    if not room:
        return None, 'Room not found'

    if room['host_player_id'] != host_player_id:
        return None, 'Only the host can kick players'

    if player_id_to_kick == host_player_id:
        return None, 'Cannot kick yourself'

    if player_id_to_kick not in room['player_ids']:
        return None, 'Player not in this room'

    # Remove player from room
    room['player_ids'].remove(player_id_to_kick)
    room['player_count'] = len(room['player_ids'])

    # Remove player data
    if player_id_to_kick in players:
        del players[player_id_to_kick]

    return room, None


def leave_room(room_code, player_id):
    """Player leaves the room. Reassigns host if needed."""
    room = rooms.get(room_code)
    if not room:
        return None, 'Room not found'

    if player_id not in room['player_ids']:
        return None, 'Player not in this room'

    # Remove player from room
    room['player_ids'].remove(player_id)
    room['player_count'] = len(room['player_ids'])

    # Remove player data
    if player_id in players:
        del players[player_id]

    # If host left, assign new host to first remaining player
    if room['host_player_id'] == player_id and room['player_ids']:
        new_host_id = room['player_ids'][0]
        room['host_player_id'] = new_host_id
        players[new_host_id]['is_host'] = True

    return room, None


def back_to_lobby(room_code, player_id):
    """Go back to lobby/waiting stage (host only)."""
    room = rooms.get(room_code)
    if not room:
        return None, 'Room not found'

    if room['host_player_id'] != player_id:
        return None, 'Only the host can change room status'

    # Clear all player character selections
    for pid in room['player_ids']:
        if pid in players:
            players[pid]['character_role'] = None

    # Reset room status to waiting
    room['status'] = 'waiting'

    return room, None
