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
import { useState } from 'react';
import { useRoom }  from './hooks/useRoom';
import Lobby        from './components/Lobby';
import ThemeVote    from './components/ThemeVote';
import SnakeDraft   from './components/SnakeDraft';
import Bracket      from './components/Bracket';

export default function App() {
  // These two values identify the current player and room
  // They are set in Lobby and passed down to all child components
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');

  // Subscribe to the phase — updates automatically when Firebase changes
  const phase = useRoom(roomCode, 'phase');

  if (!roomCode) return <Lobby setRoomCode={setRoomCode} setPlayerId={setPlayerId} />
  if (phase === 'vote') return <ThemeVote roomCode={roomCode} playerId={playerId} />
  if (phase === 'draft') return <SnakeDraft roomCode={roomCode} playerId={playerId} />
  if (phase === 'bracket') return <Bracket roomCode={roomCode} playerId={playerId} />
  if (phase === 'done') return <div><h1>Game Over!</h1></div>
  return <Lobby setRoomCode={setRoomCode} setPlayerId={setPlayerId} />
}
