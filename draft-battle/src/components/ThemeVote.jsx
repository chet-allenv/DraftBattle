// ThemeVote — the theme submission and voting phase.
// Host (display screen): all themes, live vote counts, lock-in button.
// Players: submit theme, vote for any theme (including own).
import { useState }               from 'react';
import { ref, set, update }       from 'firebase/database';
import { db }                     from '../firebase';
import { useRoom }                from '../hooks/useRoom';

export default function ThemeVote({ roomCode, playerId }) {
  const [themeInput, setThemeInput] = useState('');

  const room    = useRoom(roomCode);
  const themes  = useRoom(roomCode, 'themes');
  const votes   = useRoom(roomCode, 'votes');
  const players = useRoom(roomCode, 'players');

  const isHost       = room?.hostId === playerId;
  const hasSubmitted = themes && themes[playerId];
  const hasVoted     = votes  && votes[playerId];

  const themeList  = themes ? Object.entries(themes) : [];
  const voteList   = votes  ? Object.values(votes)   : [];
  const playerCount = players ? Object.keys(players).length : 0;

  // ── Submit theme ──────────────────────────────────────────────────
  const handleSubmitTheme = async () => {
    if (!themeInput.trim()) return;
    await set(ref(db, `rooms/${roomCode}/themes/${playerId}`), themeInput.trim());
  };

  // ── Cast vote (any theme, including own) ──────────────────────────
  const handleVote = async (targetPlayerId) => {
    await set(ref(db, `rooms/${roomCode}/votes/${playerId}`), targetPlayerId);
  };

  // ── Advance to draft (host only) ──────────────────────────────────
  const handleAdvance = async () => {
    if (!votes || Object.keys(votes).length === 0) return;
    const tally = {};
    Object.values(votes).forEach(v => { tally[v] = (tally[v] || 0) + 1; });
    const winnerId     = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    const winningTheme = themes[winnerId];
    await update(ref(db, `rooms/${roomCode}`), { winningTheme, phase: 'draft' });
  };

  // ── HOST view ─────────────────────────────────────────────────────
  if (isHost) {
    return (
      <div className="screen">
        <h2 style={{ fontSize: '2.5rem', color: 'var(--warning)', margin: 0 }}>Vote on a Theme</h2>
        <p className="text-dim" style={{ margin: 0 }}>
          {themeList.length} / {playerCount} submitted
        </p>

        {themeList.length > 0 ? (
          <div className="theme-list">
            {themeList.map(([uid, theme]) => {
              const voteCount = voteList.filter(v => v === uid).length;
              return (
                <div key={uid} className="theme-row">
                  <span className="theme-row__text">{theme}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                    {players?.[uid]?.name}
                  </span>
                  <span className="theme-row__votes">
                    {voteCount} vote{voteCount !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-dim">Waiting for players to submit themes...</p>
        )}

        <button
          className="btn btn--success"
          style={{ marginTop: '8px' }}
          onClick={handleAdvance}
          disabled={!votes || Object.keys(votes).length === 0}
        >
          Lock In Theme &amp; Start Draft
        </button>
      </div>
    );
  }

  // ── PLAYER view ───────────────────────────────────────────────────
  return (
    <div className="screen">
      <h2 style={{ fontSize: '2rem', color: 'var(--warning)', margin: 0 }}>Vote on a Theme</h2>

      {/* Submission */}
      {!hasSubmitted ? (
        <div className="col" style={{ width: '100%', maxWidth: '400px', gap: '10px' }}>
          <input
            className="input"
            placeholder="Your theme idea..."
            value={themeInput}
            onChange={e => setThemeInput(e.target.value.slice(0, 100))}
          />
          <button className="btn btn--primary" onClick={handleSubmitTheme}>Submit Theme</button>
        </div>
      ) : (
        <p className="text-dim">Theme submitted! Vote below.</p>
      )}

      {/* Voting — only visible after submitting */}
      {hasSubmitted && themeList.length > 0 && (
        <>
          <h3 style={{ color: 'var(--carolina)', margin: '4px 0 0' }}>Submitted Themes</h3>
          <div className="theme-list">
            {themeList.map(([uid, theme]) => {
              const isMyVote  = votes?.[playerId] === uid;
              const voteCount = voteList.filter(v => v === uid).length;
              const isOwn     = uid === playerId;
              return (
                <div key={uid} className="theme-row" style={{ borderColor: isMyVote ? 'var(--success)' : undefined }}>
                  <span className="theme-row__text">
                    {theme}
                    {isOwn && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '6px' }}>(yours)</span>}
                  </span>
                  {hasVoted && (
                    <span className="theme-row__votes">{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                  )}
                  {isMyVote ? (
                    <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Voted</span>
                  ) : (
                    <button className="btn btn--vote" onClick={() => handleVote(uid)}>
                      {hasVoted ? 'Switch' : 'Vote'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {hasVoted
            ? <p className="text-dim">Voted! Tap another to switch.</p>
            : <p style={{ color: 'var(--success)', fontWeight: 700, margin: 0 }}>Cast your vote!</p>
          }
        </>
      )}

      {!hasSubmitted && <p className="text-dim" style={{ fontSize: '0.85rem' }}>Submit your theme to see others.</p>}
    </div>
  );
}
