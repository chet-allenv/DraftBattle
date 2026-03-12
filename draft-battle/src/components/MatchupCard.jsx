// MatchupCard — displays a single bracket matchup.
// Discussion phase: shows picks with active presenter highlighted (host only).
// Voting phase: players see just names + vote buttons (including for own team).
// Ties trigger a re-vote with a TIEBREAKER label until a winner is found.
import { ref, set }   from 'firebase/database';
import { db }         from '../firebase';
import { tallyVotes } from '../utils/matchupUtils';

export default function MatchupCard({ roomCode, playerId, players, picks, matchup, roundIndex, matchupIndex, votingOpen, currentPresenterId, isHost }) {
  const { playerA, playerB, votes, winner, tiebreakerRound } = matchup;

  const nameA  = players?.[playerA]?.name || 'Player A';
  const nameB  = players?.[playerB]?.name || 'Player B';
  const picksA = picks?.[playerA] || [];
  const picksB = picks?.[playerB] || [];

  const { playerAVotes, playerBVotes } = tallyVotes(votes, playerA, playerB);
  const myVote   = votes?.[playerId];
  const hasVoted = !!myVote;

  // ── Cast / change a vote (own team allowed) ───────────────────────
  const handleVote = async (targetId) => {
    if (!votingOpen || winner || myVote === targetId) return;
    await set(
      ref(db, `rooms/${roomCode}/bracket/rounds/${roundIndex}/${matchupIndex}/votes/${playerId}`),
      targetId
    );
  };

  const PickList = ({ playerPicks, isPresenting }) => (
    <ul style={{ margin: '4px 0 0', padding: '0 0 0 14px', listStyle: 'decimal',
      background: isPresenting ? 'rgba(75,156,211,0.08)' : 'transparent',
      borderRadius: isPresenting ? '6px' : 0, paddingRight: isPresenting ? '6px' : 0 }}>
      {playerPicks.map((p, i) => (
        <li key={i} style={{ fontSize: '0.8rem', color: 'var(--off-white)', lineHeight: '1.6' }}>{p}</li>
      ))}
    </ul>
  );

  // ── Bye ───────────────────────────────────────────────────────────
  if (!playerB) {
    return (
      <div className="matchup">
        <span className="matchup__player-name">{nameA}</span>
        {isHost && <PickList playerPicks={picksA} />}
        <span className="matchup__bye">Bye — auto advance</span>
      </div>
    );
  }

  // ── Completed matchup ─────────────────────────────────────────────
  if (winner) {
    const winnerName = winner === playerA ? nameA : nameB;
    return (
      <div className="matchup matchup--done">
        <span className="matchup__winner-label">Winner: {winnerName}</span>
        <div className="matchup__player">
          <span className="matchup__player-name">{nameA}</span>
          {isHost && <PickList playerPicks={picksA} />}
          <span className="matchup__vote-count">{playerAVotes} vote{playerAVotes !== 1 ? 's' : ''}</span>
        </div>
        <div className="matchup__player">
          <span className="matchup__player-name">{nameB}</span>
          {isHost && <PickList playerPicks={picksB} />}
          <span className="matchup__vote-count">{playerBVotes} vote{playerBVotes !== 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  }

  // ── Active matchup ────────────────────────────────────────────────
  const isPresentingA = currentPresenterId === playerA;
  const isPresentingB = currentPresenterId === playerB;

  const VoteArea = ({ forPlayer, forName }) => {
    if (isHost) return null;
    if (!votingOpen) return null;

    const isOwnTeam      = playerId === forPlayer;
    const isVotedForThis = myVote === forPlayer;

    if (isVotedForThis) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {isOwnTeam && <span style={{ fontSize: '0.75rem', color: 'var(--carolina)', fontWeight: 700 }}>Your team</span>}
          <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 700 }}>✓ Your vote</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {isOwnTeam && <span style={{ fontSize: '0.75rem', color: 'var(--carolina)', fontWeight: 700 }}>Your team</span>}
        <button className="btn btn--vote" onClick={() => handleVote(forPlayer)}>
          {isOwnTeam ? 'Vote for yourself' : hasVoted ? `Switch to ${forName}` : `Vote ${forName}`}
        </button>
      </div>
    );
  };

  return (
    <div className="matchup">
      {tiebreakerRound > 0 && (
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: '#e05555', letterSpacing: '1px' }}>
          Tiebreaker! Round {tiebreakerRound + 1}
        </span>
      )}

      <div className="matchup__player" style={{ background: isPresentingA ? 'rgba(75,156,211,0.06)' : 'transparent', borderRadius: '6px', padding: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="matchup__player-name">{nameA}</span>
          {isPresentingA && <span style={{ fontSize: '0.75rem', color: 'var(--carolina)', fontWeight: 700, background: 'rgba(75,156,211,0.15)', padding: '2px 7px', borderRadius: '4px' }}>Presenting</span>}
        </div>
        {isHost && <PickList playerPicks={picksA} isPresenting={isPresentingA} />}
        {votingOpen && hasVoted && (
          <span className="matchup__vote-count">{playerAVotes} vote{playerAVotes !== 1 ? 's' : ''}</span>
        )}
        <VoteArea forPlayer={playerA} forName={nameA} />
      </div>

      <hr className="divider" />

      <div className="matchup__player" style={{ background: isPresentingB ? 'rgba(75,156,211,0.06)' : 'transparent', borderRadius: '6px', padding: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="matchup__player-name">{nameB}</span>
          {isPresentingB && <span style={{ fontSize: '0.75rem', color: 'var(--carolina)', fontWeight: 700, background: 'rgba(75,156,211,0.15)', padding: '2px 7px', borderRadius: '4px' }}>Presenting</span>}
        </div>
        {isHost && <PickList playerPicks={picksB} isPresenting={isPresentingB} />}
        {votingOpen && hasVoted && (
          <span className="matchup__vote-count">{playerBVotes} vote{playerBVotes !== 1 ? 's' : ''}</span>
        )}
        <VoteArea forPlayer={playerB} forName={nameB} />
      </div>

      {!votingOpen && (
        <p className="text-dim" style={{ margin: 0, fontSize: '0.82rem', textAlign: 'center' }}>
          Discussion phase...
        </p>
      )}
      {votingOpen && !hasVoted && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--success)', fontWeight: 700, textAlign: 'center' }}>
          Cast your vote!
        </p>
      )}
      {votingOpen && hasVoted && (
        <p className="text-dim" style={{ margin: 0, fontSize: '0.82rem' }}>
          Voted! Tap to switch.
        </p>
      )}
    </div>
  );
}
