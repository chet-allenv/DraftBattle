import { ref, set }  from 'firebase/database';
import { db }        from '../firebase';
import { tallyVotes } from '../utils/matchupUtils';

export default function MatchupCard({ roomCode, playerId, matchup, roundIndex, matchupIndex }) {
  const { playerA, playerB, votes, winner } = matchup;

  // TODO 1: get player names from a 'players' prop or pass them in
  //   Add players as a prop: export default function MatchupCard({ ..., players })
  //   Then: const nameA = players?.[playerA]?.name || 'Player A';
  //         const nameB = players?.[playerB]?.name || 'Player B';

  const { playerAVotes, playerBVotes } = tallyVotes(votes, playerA, playerB);
  const hasVoted = votes && votes[playerId];

  // ── Cast a vote ───────────────────────────────────────────────────
  const handleVote = async (targetId) => {
    if (hasVoted || winner) return;
    // TODO 2: write vote to Firebase
    //   path:  `rooms/${roomCode}/bracket/rounds/${roundIndex}/${matchupIndex}/votes/${playerId}`
    //   value: targetId
    //   use set()
  };

  // ── Render ────────────────────────────────────────────────────────
  if (winner) {
    // TODO 3: render a 'completed' view showing winner highlighted
    return (
      <div style={{ border: '1px solid green', padding: '10px' }}>
        <p>Winner: {winner === playerA ? 'TODO: nameA' : 'TODO: nameB'}</p>
        <p>Final: {playerAVotes} vs {playerBVotes}</p>
      </div>
    );
  }

  if (!playerB) {
    return <div><p>Bye — auto advance</p></div>;
  }

  return (
    <div style={{ border: '1px solid gray', padding: '10px' }}>
      <div>
        <strong>TODO: nameA</strong>
        <p>{playerAVotes} votes</p>
        {!hasVoted && <button onClick={() => handleVote(playerA)}>Vote A</button>}
      </div>
      <div>
        <strong>TODO: nameB</strong>
        <p>{playerBVotes} votes</p>
        {!hasVoted && <button onClick={() => handleVote(playerB)}>Vote B</button>}
      </div>
      {hasVoted && <p>Vote cast! Waiting for others...</p>}
    </div>
  );
}
