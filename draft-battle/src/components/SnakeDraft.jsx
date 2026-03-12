// SnakeDraft — the pick phase.
// Players take turns picking items in snake order (forward, then reverse, then forward...).
// The host initializes the draft order on first load.
// On the final pick, the bracket is built and the phase advances to 'bracket'.
import { useState, useEffect }  from 'react';
import { ref, update }          from 'firebase/database';
import { db }                   from '../firebase';
import { useRoom }              from '../hooks/useRoom';
import { getPickOwner, getTotalPicks } from '../utils/draftUtils';
import { shufflePlayers }       from '../utils/roomUtils';
import { buildBracket }         from '../utils/bracketUtils';

export default function SnakeDraft({ roomCode, playerId }) {
  const [pickInput, setPickInput] = useState('');

  const room       = useRoom(roomCode);
  const players    = useRoom(roomCode, 'players');
  const picks      = useRoom(roomCode, 'picks');           // { uid: ['pick1', 'pick2', ...] }
  const draftOrder = useRoom(roomCode, 'draftOrder');      // ['uid1', 'uid2', 'uid3']
  const pickIndex  = useRoom(roomCode, 'currentPickIndex') ?? 0;

  const playerIds      = players ? Object.keys(players) : [];
  const picksPerPlayer = room?.picksPerPlayer || 3;
  const totalPicks     = getTotalPicks(playerIds.length, picksPerPlayer);
  const draftDone      = pickIndex >= totalPicks;

  // ── Set up draft order on first load (host only) ──────────────────
  // Runs once when players load and draftOrder doesn't exist yet
  useEffect(() => {
    if (!draftOrder && room?.hostId === playerId && playerIds.length > 0) {
      const shuffled = shufflePlayers(playerIds);
      update(ref(db, `rooms/${roomCode}`), { draftOrder: shuffled, currentPickIndex: 0 });
    }
  }, [draftOrder, room?.hostId, playerId, playerIds, roomCode]);

  // ── Whose turn is it? ────────────────────────────────────────────
  const currentTurnId   = draftOrder ? getPickOwner(pickIndex, draftOrder) : null;
  const isMyTurn        = currentTurnId === playerId;

  // ── Submit a pick ─────────────────────────────────────────────────
  const handlePick = async () => {
    if (!isMyTurn || !pickInput.trim()) return;

    // Prevent duplicate picks across all players
    const allPicks = picks ? Object.values(picks).flat() : [];
    if (allPicks.includes(pickInput.trim())) return alert("Already picked!");

    const currentPicks = picks?.[playerId] || [];
    const newPicks     = [...currentPicks, pickInput.trim()];
    const newIndex     = pickIndex + 1;
    const isLastPick   = newIndex >= totalPicks;

    if (isLastPick) {
      // Draft complete — build bracket and advance phase
      const bracket = buildBracket(playerIds);
      await update(ref(db, `rooms/${roomCode}`), {
        [`picks/${playerId}`]: newPicks,
        currentPickIndex:      newIndex,
        bracket,
        phase:                 'bracket',
      });
    } else {
      await update(ref(db, `rooms/${roomCode}`), {
        [`picks/${playerId}`]: newPicks,
        currentPickIndex:      newIndex,
      });
    }

    setPickInput('');
  };

  // ── Render ────────────────────────────────────────────────────────
  const currentTurnName = players?.[currentTurnId]?.name || '...';

  return (
    <div>
      <h2>Draft — Theme: {room?.winningTheme}</h2>
      <p>Pick {pickIndex + 1} of {totalPicks} — {isMyTurn ? 'YOUR TURN' : `${currentTurnName}'s turn`}</p>

      {/* Draft board — one column per player, highlight the active drafter */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {playerIds.map(uid => (
          <div key={uid} style={{ border: uid === currentTurnId ? '2px solid blue' : '1px solid gray', padding: '10px' }}>
            <h4>{players[uid]?.name}</h4>
            {(picks?.[uid] || []).map((pick, i) => <div key={i}>{pick}</div>)}
          </div>
        ))}
      </div>

      {/* Pick input — only shown on your turn */}
      {isMyTurn && !draftDone && (
        <div>
          <input placeholder='Type your pick...' value={pickInput}
            onChange={e => setPickInput(e.target.value)} />
          <button onClick={handlePick}>Pick</button>
        </div>
      )}
    </div>
  );
}
