// MatchupCard — displays a single bracket matchup.
// Shows both players, their vote counts, and lets the current player cast a vote.
// Once a winner is set (by Bracket.jsx), it switches to a completed view.
import { ref, set }     from 'firebase/database';
import { db }           from '../firebase';
import { tallyVotes }   from '../utils/matchupUtils';

export default function MatchupCard({ roomCode, playerId, players, matchup, roundIndex, matchupIndex }) {
  const { playerA, playerB, votes, winner } = matchup;

  // Resolve display names from the players map (falls back gracefully if missing)
  const nameA = players?.[playerA]?.name || 'Player A';
  const nameB = players?.[playerB]?.name || 'Player B';

  const { playerAVotes, playerBVotes } = tallyVotes(votes, playerA, playerB);
  const hasVoted = votes && votes[playerId];

  // ── Cast a vote ───────────────────────────────────────────────────
  const handleVote = async (targetId) => {
    if (hasVoted || winner) return;
    await set(
      ref(db, `rooms/${roomCode}/bracket/rounds/${roundIndex}/${matchupIndex}/votes/${playerId}`),
      targetId
    );
  };

  // ── Completed matchup ─────────────────────────────────────────────
  if (winner) {
    return (
      <div style={{ border: '1px solid green', padding: '10px' }}>
        <p>Winner: {winner === playerA ? nameA : nameB}</p>
        <p>Final: {playerAVotes} vs {playerBVotes}</p>
      </div>
    );
  }

  // ── Bye (only one player) ─────────────────────────────────────────
  if (!playerB) {
    return <div><p>{nameA} — Bye (auto advance)</p></div>;
  }

  // ── Active matchup ────────────────────────────────────────────────
  return (
    <div style={{ border: '1px solid gray', padding: '10px' }}>
      <div>
        <strong>{nameA}</strong>
        <p>{playerAVotes} votes</p>
        {!hasVoted && <button onClick={() => handleVote(playerA)}>Vote {nameA}</button>}
      </div>
      <div>
        <strong>{nameB}</strong>
        <p>{playerBVotes} votes</p>
        {!hasVoted && <button onClick={() => handleVote(playerB)}>Vote {nameB}</button>}
      </div>
      {hasVoted && <p>Vote cast! Waiting for others...</p>}
    </div>
  );
}
