// ThemeVote — the theme submission and voting phase.
// Every player submits a theme idea, then votes for their favourite (can't vote for their own).
// The host locks in the winning theme and advances to the draft phase.
import { useState }               from 'react';
import { ref, set, update }       from 'firebase/database';
import { db }                     from '../firebase';
import { useRoom }                from '../hooks/useRoom';

export default function ThemeVote({ roomCode, playerId }) {
  const [themeInput, setThemeInput] = useState('');

  const room    = useRoom(roomCode);
  const themes  = useRoom(roomCode, 'themes');   // { uid: 'theme text' }
  const votes   = useRoom(roomCode, 'votes');    // { uid: 'voted-for-uid' }
  const players = useRoom(roomCode, 'players');

  const isHost       = room?.hostId === playerId;
  const hasSubmitted = themes && themes[playerId];
  const hasVoted     = votes  && votes[playerId];

  // ── Submit theme ─────────────────────────────────────────────────
  const handleSubmitTheme = async () => {
    if (!themeInput.trim()) return;
    await set(ref(db, `rooms/${roomCode}/themes/${playerId}`), themeInput);
  };

  // ── Cast vote ────────────────────────────────────────────────────
  const handleVote = async (targetPlayerId) => {
    await set(ref(db, `rooms/${roomCode}/votes/${playerId}`), targetPlayerId);
  };

  // ── Advance to draft (host only) ─────────────────────────────────
  // Tallies votes, picks the theme with the most votes, saves it, and advances phase
  const handleAdvance = async () => {
    const tally = {};
    Object.values(votes).forEach(v => { tally[v] = (tally[v] || 0) + 1; });
    const winnerId     = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    const winningTheme = themes[winnerId];

    await update(ref(db, `rooms/${roomCode}`), { winningTheme, phase: 'draft' });
  };

  const themeList = themes ? Object.entries(themes) : [];
  const voteList  = votes  ? Object.values(votes)   : [];

  return (
    <div>
      <h2>Vote on a Theme</h2>

      {/* Theme submission — hidden once the player has submitted */}
      {!hasSubmitted && (
        <div>
          <input placeholder='Your theme idea' value={themeInput}
            onChange={e => setThemeInput(e.target.value)} />
          <button onClick={handleSubmitTheme}>Submit Theme</button>
        </div>
      )}

      {/* List all submitted themes with vote counts and vote buttons */}
      <h3>Submitted Themes:</h3>
      {themeList.map(([uid, theme]) => (
        <div key={uid}>
          <span>{theme}</span>
          {/* Can't vote for your own theme or vote twice */}
          {!hasVoted && uid !== playerId && (
            <button onClick={() => handleVote(uid)}>Vote</button>
          )}
          <span> ({voteList.filter(v => v === uid).length} votes)</span>
        </div>
      ))}

      {/* Host locks in the theme when ready */}
      {isHost && <button onClick={handleAdvance}>Lock In Theme & Start Draft</button>}
    </div>
  );
}
