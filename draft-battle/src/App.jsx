/*
Purpose: Root component of the application. Sets up routing and renders the appropriate components based on the URL path. Zero game logic.

Responsibilities:
- Subscribes to rooms/{roomcode}/phase
- renders <Lobby />, <ThemeVote />, <SnakeDraft />, <Bracket />, or <Results /> based on the phase
- Passes roomCode and playerId as props to the rendered component

Key members:
- const phase = useRoom(roomCode, 'phase'): subscribes to the current phase of the game from Firebase
if (phase === 'lobby') render <Lobby /> etc


*/
import { useState, useEffect } from 'react';
import { ref, remove }         from 'firebase/database';
import { db }                  from './firebase';
import { useRoom }             from './hooks/useRoom';
import Lobby                   from './components/Lobby';
import ThemeVote               from './components/ThemeVote';
import SnakeDraft              from './components/SnakeDraft';
import Bracket                 from './components/Bracket';
import Results                 from './components/Results';

export default function App() {
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');

  const phase   = useRoom(roomCode, 'phase');
  const room    = useRoom(roomCode);
  const players = useRoom(roomCode, 'players');

  const playerName = players?.[playerId]?.name;
  const isHost     = room?.hostId === playerId;

  // ── Auto-kick when host closes the room ──────────────────────────
  // phase === null means the room was deleted (useRoom returns null for missing data)
  useEffect(() => {
    if (roomCode && phase === null) {
      setRoomCode('');
      setPlayerId('');
    }
  }, [roomCode, phase]);

  // ── Close / Leave game ───────────────────────────────────────────
  const handleClose = async () => {
    await remove(ref(db, `rooms/${roomCode}`));
    // auto-kick effect above will reset state for the host too
  };

  const handleLeave = async () => {
    await remove(ref(db, `rooms/${roomCode}/players/${playerId}`));
    setRoomCode('');
    setPlayerId('');
  };

  if (!roomCode) return <Lobby setRoomCode={setRoomCode} setPlayerId={setPlayerId} />

  // Still loading — don't flash the wrong screen
  if (phase === undefined) return null;

  const header = (
    <div className="player-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{playerName ? `Playing as: ${playerName}` : ''}</span>
      {isHost
        ? <button className="btn btn--ghost" style={{ padding: '4px 14px', fontSize: '0.8rem' }} onClick={handleClose}>Close Game</button>
        : <button className="btn btn--ghost" style={{ padding: '4px 14px', fontSize: '0.8rem' }} onClick={handleLeave}>Leave Game</button>
      }
    </div>
  );

  if (phase === 'lobby')   return <Lobby setRoomCode={setRoomCode} setPlayerId={setPlayerId} initialRoomCode={roomCode} initialPlayerId={playerId} />
  if (phase === 'vote')    return <>{header}<ThemeVote roomCode={roomCode} playerId={playerId} /></>
  if (phase === 'draft')   return <>{header}<SnakeDraft roomCode={roomCode} playerId={playerId} /></>
  if (phase === 'bracket') return <>{header}<Bracket roomCode={roomCode} playerId={playerId} /></>
  if (phase === 'done')    return <>{header}<Results roomCode={roomCode} playerId={playerId} /></>
}
