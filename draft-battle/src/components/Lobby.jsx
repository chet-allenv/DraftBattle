// Lobby — first screen players see.
// Handles room creation, joining, and starting the game.
// Once the host starts, updates phase to 'vote' which triggers App.jsx to switch screens.
import { useState }                  from 'react';
import { ref, set, update, get }     from 'firebase/database';
import { db }                        from '../firebase';
import { useRoom }                   from '../hooks/useRoom';
import { generateRoomCode }          from '../utils/roomUtils';

export default function Lobby({ setRoomCode, setPlayerId }) {
  const [nameInput,     setNameInput]     = useState('');
  const [roomInput,     setRoomInput]     = useState('');
  const [currentRoom,   setCurrentRoom]   = useState('');
  const [currentPlayer, setCurrentPlayer] = useState('');

  // Subscribe to player list and room data once inside a room
  const players = useRoom(currentRoom, 'players');
  const room    = useRoom(currentRoom);

  // ── Create a new room ────────────────────────────────────────────
  const handleCreate = async () => {
    if (!nameInput.trim()) return alert('Enter your name first');

    const code = generateRoomCode();
    const uid  = `player-${Date.now()}`;

    // Initialize the room with this player as host
    await set(ref(db, `rooms/${code}`), {
      phase:          'lobby',
      hostId:         uid,
      picksPerPlayer: 5,
      players:        { [uid]: { name: nameInput } },
    });

    setCurrentRoom(code);
    setCurrentPlayer(uid);
    setRoomCode(code);
    setPlayerId(uid);
  };

  // ── Join an existing room ────────────────────────────────────────
  const handleJoin = async () => {
    if (!nameInput.trim() || !roomInput.trim()) return alert('Enter name and room code');

    const uid  = `player-${Date.now()}`;
    const code = roomInput.toUpperCase().trim();

    const snapshot = await get(ref(db, `rooms/${code}`));
    if (!snapshot.exists) return alert('Room not found');

    // Add this player to the existing room
    await set(ref(db, `rooms/${code}/players/${uid}`), { name: nameInput });

    setCurrentRoom(code);
    setCurrentPlayer(uid);
    setRoomCode(code);
    setPlayerId(uid);
  };

  // ── Start the game (host only) ───────────────────────────────────
  const handleStart = async () => {
    if (playerList.length < 2) return alert('Need at least 2 players to start.');

    await update(ref(db, `rooms/${currentRoom}`), { phase: 'vote' });
  };

  // ── Render ───────────────────────────────────────────────────────
  // If not in a room yet, show join/create form
  if (!currentRoom) {
    return (
      <div>
        <h1>Draft Battle</h1>
        <input placeholder='Your name'  value={nameInput}  onChange={e => setNameInput(e.target.value)} />
        <button onClick={handleCreate}>Create Room</button>
        <input placeholder='Room code'  value={roomInput}  onChange={e => setRoomInput(e.target.value)} />
        <button onClick={handleJoin}>Join Room</button>
      </div>
    );
  }

  // Once in a room, show lobby with player list and start button for host
  const playerList = players ? Object.entries(players) : [];
  const isHost     = room?.hostId === currentPlayer;

  return (
    <div>
      <h2>Room: {currentRoom}</h2>
      <h3>Players ({playerList.length}):</h3>
      {playerList.map(([id, p]) => <div key={id}>{p.name}</div>)}
      {isHost  && <button onClick={handleStart}>Start Game</button>}
      {!isHost && <p>Waiting for host to start...</p>}
    </div>
  );
}
