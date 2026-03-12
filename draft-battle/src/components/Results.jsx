// Results — shown when phase is 'done'.
// Displays the bracket champion (big, yellow) and each player's full pick list.
import { ref, update } from 'firebase/database';
import { db }          from '../firebase';
import { useRoom }     from '../hooks/useRoom';

export default function Results({ roomCode, playerId }) {
  const room    = useRoom(roomCode);
  const players = useRoom(roomCode, 'players');
  const picks   = useRoom(roomCode, 'picks');
  const bracket = useRoom(roomCode, 'bracket');

  const isHost = room?.hostId === playerId;

  const handlePlayAgain = async () => {
    await update(ref(db, `rooms/${roomCode}`), {
      phase:            'lobby',
      picks:            null,
      bracket:          null,
      themes:           null,
      votes:            null,
      draftOrder:       null,
      currentPickIndex: null,
      turnStartedAt:    null,
      winningTheme:     null,
    });
  };

  const champion     = bracket?.champion;
  const championName = players?.[champion]?.name;

  return (
    <div className="screen">
      {/* Winner — big and yellow, shown first */}
      {championName && (
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: 'var(--warning)', letterSpacing: '4px', margin: 0, textAlign: 'center', textShadow: '0 0 40px rgba(240,180,41,0.6)' }}>
          {championName} Wins!
        </h1>
      )}

      <h2 style={{ fontSize: '1.5rem', color: 'var(--text-dim)', margin: 0 }}>Game Over</h2>

      {room?.winningTheme && (
        <p style={{ color: 'var(--text-dim)', fontWeight: 700, margin: 0 }}>
          Theme: <span style={{ color: 'var(--carolina)' }}>{room.winningTheme}</span>
        </p>
      )}

      {isHost && (
        <button className="btn btn--primary" onClick={handlePlayAgain}>Play Again</button>
      )}
      {!isHost && <p className="text-dim">Waiting for host to start a new game...</p>}

      <h3 style={{ color: 'var(--warning)', marginBottom: 0 }}>Draft Picks</h3>
      <div className="results-board">
        {players && Object.entries(players).map(([uid, player]) => (
          <div
            key={uid}
            className={`draft-column${uid === champion ? ' card--winner' : ''}`}
          >
            <div className="draft-column__header text-center">
              {player.name}{uid === champion ? ' 🏆' : ''}
            </div>
            {(picks?.[uid] || []).map((pick, i) => (
              <div key={i} className="draft-pick">{i + 1}. {pick}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
