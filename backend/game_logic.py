"""
Avalon game logic for character reveals based on the official rules.

Character reveal rules:
- All evil players (Minions of Mordred) know each other, except Oberon
- Oberon doesn't know other evil players, and they don't know him
- Merlin knows all evil players, except Mordred
- Percival knows Merlin (and Morgana if she's in the game)
- Mordred's identity is not revealed to Merlin
- Morgana appears as Merlin to Percival
"""

# Character definitions
GOOD_CHARACTERS = ['Merlin', 'Percival', 'Loyal Servant']
EVIL_CHARACTERS = ['Assassin', 'Mordred', 'Oberon', 'Morgana', 'Minion of Mordred']

# Player count configurations (from rules)
PLAYER_CONFIGURATIONS = {
    5: {'good': 3, 'evil': 2},
    6: {'good': 4, 'evil': 2},
    7: {'good': 4, 'evil': 3},
    8: {'good': 5, 'evil': 3},
    9: {'good': 6, 'evil': 3},
    10: {'good': 6, 'evil': 4}
}

def is_good_character(character):
    """Check if a character is on the Good side."""
    return character in GOOD_CHARACTERS

def is_evil_character(character):
    """Check if a character is on the Evil side."""
    return character in EVIL_CHARACTERS

def get_character_reveals(player_character, all_players):
    """
    Get the information that should be revealed to a player based on their character.

    Args:
        player_character: The character of the player requesting reveals
        all_players: List of dicts with 'player_name' and 'character_role' keys

    Returns:
        Dict with revelation information for the player
    """
    reveals = {
        'your_character': player_character,
        'your_allegiance': 'Good' if is_good_character(player_character) else 'Evil',
        'revealed_players': [],
        'message': ''
    }

    # Get all evil players (excluding Oberon for most purposes)
    evil_players = [p for p in all_players if is_evil_character(p['character_role'])]
    evil_players_except_oberon = [p for p in evil_players if p['character_role'] != 'Oberon']

    if player_character == 'Merlin':
        # Merlin sees all evil players except Mordred
        visible_evil = [p for p in evil_players if p['character_role'] != 'Mordred']
        reveals['revealed_players'] = [p['player_name'] for p in visible_evil]
        reveals['message'] = 'You are Merlin. You know the agents of Evil (except Mordred if present).'

    elif player_character == 'Percival':
        # Percival sees Merlin and Morgana (if present)
        merlin_and_morgana = [p for p in all_players if p['character_role'] in ['Merlin', 'Morgana']]
        reveals['revealed_players'] = [p['player_name'] for p in merlin_and_morgana]
        reveals['message'] = 'You are Percival. You see Merlin (and Morgana if present), but you must discern which is which.'

    elif player_character == 'Loyal Servant':
        reveals['message'] = 'You are a Loyal Servant of Arthur. You have no special knowledge, but you fight for Good!'

    elif player_character == 'Oberon':
        # Oberon knows he's evil but doesn't know other evil players
        reveals['message'] = 'You are Oberon, a Minion of Mordred. You do not know your fellow agents of Evil, nor do they know you.'

    elif player_character in ['Assassin', 'Mordred', 'Morgana', 'Minion of Mordred']:
        # All other evil players know each other (except Oberon)
        allies = [p for p in evil_players_except_oberon if p['character_role'] != player_character]
        reveals['revealed_players'] = [p['player_name'] for p in allies]

        if player_character == 'Assassin':
            reveals['message'] = 'You are the Assassin, a Minion of Mordred. You know your fellow agents of Evil (except Oberon). If Good wins, you can assassinate Merlin to win the game!'
        elif player_character == 'Mordred':
            reveals['message'] = 'You are Mordred, a Minion of Mordred. You know your fellow agents of Evil (except Oberon). Your identity is hidden from Merlin!'
        elif player_character == 'Morgana':
            reveals['message'] = 'You are Morgana, a Minion of Mordred. You know your fellow agents of Evil (except Oberon). You appear as Merlin to Percival!'
        else:
            reveals['message'] = 'You are a Minion of Mordred. You know your fellow agents of Evil (except Oberon).'

    return reveals

def validate_character_selection(players, optional_characters):
    """
    Validate that the character selection follows Avalon rules.

    Args:
        players: List of player dicts with character_role
        optional_characters: List of optional characters enabled for this game

    Returns:
        Tuple of (is_valid: bool, error_message: str or None)
    """
    player_count = len(players)

    # Check if player count is valid
    if player_count < 5 or player_count > 10:
        return False, f"Invalid player count: {player_count}. Must be between 5 and 10."

    config = PLAYER_CONFIGURATIONS[player_count]

    # Count good and evil players
    good_count = sum(1 for p in players if is_good_character(p['character_role']))
    evil_count = sum(1 for p in players if is_evil_character(p['character_role']))

    if good_count != config['good'] or evil_count != config['evil']:
        return False, f"Invalid team distribution. Need {config['good']} Good and {config['evil']} Evil players."

    # Check for required characters
    characters = [p['character_role'] for p in players]
    if 'Merlin' not in characters:
        return False, "Merlin is required in all games."
    if 'Assassin' not in characters:
        return False, "Assassin is required in all games."

    # Check for duplicate special characters
    special_chars = ['Merlin', 'Percival', 'Assassin', 'Mordred', 'Oberon', 'Morgana']
    for char in special_chars:
        if characters.count(char) > 1:
            return False, f"Cannot have multiple {char} characters."

    # Check that optional characters are only used if enabled
    for char in characters:
        if char in ['Percival', 'Mordred', 'Oberon', 'Morgana'] and char not in optional_characters:
            return False, f"{char} is not enabled for this game."

    return True, None

def get_available_characters(player_count, optional_characters):
    """
    Get the list of available characters based on player count and optional characters.

    Args:
        player_count: Number of players in the game
        optional_characters: List of optional characters enabled

    Returns:
        Dict with 'good' and 'evil' character lists
    """
    if player_count not in PLAYER_CONFIGURATIONS:
        return {'good': [], 'evil': []}

    config = PLAYER_CONFIGURATIONS[player_count]

    # Required characters
    good_chars = ['Merlin'] + ['Loyal Servant'] * (config['good'] - 1)
    evil_chars = ['Assassin'] + ['Minion of Mordred'] * (config['evil'] - 1)

    # Add optional characters to the pool
    available_good = ['Merlin', 'Loyal Servant']
    available_evil = ['Assassin', 'Minion of Mordred']

    if 'Percival' in optional_characters:
        available_good.append('Percival')
    if 'Mordred' in optional_characters:
        available_evil.append('Mordred')
    if 'Oberon' in optional_characters:
        available_evil.append('Oberon')
    if 'Morgana' in optional_characters:
        available_evil.append('Morgana')

    return {
        'good': available_good,
        'evil': available_evil,
        'good_count': config['good'],
        'evil_count': config['evil']
    }
