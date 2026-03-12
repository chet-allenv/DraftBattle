import { useEffect }              from 'react';
import { ref, update }            from 'firebase/database';
import { db }                     from '../firebase';
import { useRoom }                from '../hooks/useRoom';
import MatchupCard                from './MatchupCard';
import { getMatchupWinner, hasAllVoted } from '../utils/matchupUtils';
import { buildNextRound }         from '../utils/bracketUtils';

export default function Bracket({ roomCode, playerId }) {
  const room    = useRoom(roomCode);
  const bracket = useRoom(roomCode, 'bracket');
  const players = useRoom(roomCode, 'players');

  const allPlayerIds = players ? Object.keys(players) : [];
  const isHost       = room?.hostId === playerId;

  // ── Watch for completed matchups and auto-advance ─────────────────
  useEffect(() => {
    if (!bracket || !isHost) return;

    const rounds = bracket.rounds;
    const roundKeys = Object.keys(rounds).map(Number).sort((a,b) => a-b);
    const currentRoundIndex = roundKeys[roundKeys.length - 1];
    const currentRound = rounds[currentRoundIndex];
    const matchups = Object.values(currentRound);

    const allDone = matchups.every(m => m.winner !== null);
    if (!allDone) return;

    async function advance() {
      if (matchups.length > 1) {
        const nextRound = buildNextRound(currentRound);
        const nextIndex = currentRoundIndex + 1;
        await update(ref(db, `rooms/${roomCode}/bracket/rounds`), { [nextIndex]: nextRound });
      } else {
        await update(ref(db, `rooms/${roomCode}`), {
          'bracket/champion': matchups[0].winner,
          phase: 'done'
        });
      }
    }
    advance();

  }, [bracket]);

  // ── Watch votes and resolve matchups ─────────────────────────────
  useEffect(() => {
    if (!bracket || !isHost) return;

    const rounds = bracket.rounds;
    const currentRoundIndex = Object.keys(rounds).length - 1;
    const currentRound = rounds[currentRoundIndex];

    async function resolveMatchups() {
      for (const [idx, matchup] of Object.entries(currentRound)) {
        if (matchup.winner) continue;  // already resolved
        if (!matchup.playerB) continue; // bye — already handled in buildBracket

        if (hasAllVoted(matchup.votes, allPlayerIds)) {
          const winner = getMatchupWinner(matchup.votes, matchup.playerA, matchup.playerB);
          if (winner) {
            await update(ref(db, `rooms/${roomCode}/bracket/rounds/${currentRoundIndex}/${idx}`), { winner });
          } else {
            // tie — reset votes so people vote again
            await update(ref(db, `rooms/${roomCode}/bracket/rounds/${currentRoundIndex}/${idx}`), { votes: {} });
          }
        }
      }
    }
    resolveMatchups();
  }, [bracket]);

  if (!bracket) return <div>Loading bracket...</div>;

  const rounds = bracket.rounds;

  return (
    <div>
      <h2>Bracket — Theme: {room?.winningTheme}</h2>
      {bracket.champion && <h1>Champion: {players?.[bracket.champion]?.name}</h1>}

      {/* Render each round as a column */}
      <div style={{ display: 'flex', gap: '30px' }}>
        {Object.entries(rounds).map(([roundIdx, round]) => (
          <div key={roundIdx}>
            <h3>Round {Number(roundIdx) + 1}</h3>
            {Object.entries(round).map(([matchupIdx, matchup]) => (
              <MatchupCard
                key={matchupIdx}
                roomCode={roomCode}
                playerId={playerId}
                players={players}
                matchup={matchup}
                roundIndex={roundIdx}
                matchupIndex={matchupIdx}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
