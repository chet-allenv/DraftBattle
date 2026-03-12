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

    // TODO 1: check if every matchup in currentRound already has a winner
    //   Hint: const allDone = matchups.every(m => m.winner !== null);

    // TODO 2: if allDone and more than 1 matchup (not the final), build next round
    //   const nextRound = buildNextRound(currentRound);
    //   const nextIndex = currentRoundIndex + 1;
    //   await update(ref(db, `rooms/${roomCode}/bracket/rounds`), { [nextIndex]: nextRound });

    // TODO 3: if allDone and only 1 matchup (the final), set the champion
    //   await update(ref(db, `rooms/${roomCode}`), {
    //     'bracket/champion': matchups[0].winner,
    //     phase: 'done'
    //   });

  }, [bracket]);

  // ── Watch votes and resolve matchups ─────────────────────────────
  useEffect(() => {
    if (!bracket || !isHost) return;

    const rounds = bracket.rounds;
    const currentRoundIndex = Object.keys(rounds).length - 1;
    const currentRound = rounds[currentRoundIndex];

    Object.entries(currentRound).forEach(async ([idx, matchup]) => {
      if (matchup.winner) return;  // already resolved
      if (!matchup.playerB) return; // bye — already handled in buildBracket

      // TODO 4: check if all players have voted on this matchup
      //   if (hasAllVoted(matchup.votes, allPlayerIds)) {
      //     const winner = getMatchupWinner(matchup.votes, matchup.playerA, matchup.playerB);
      //     if (winner) {
      //       await update(ref(db, `rooms/${roomCode}/bracket/rounds/${currentRoundIndex}/${idx}`), { winner });
      //     }
      //     // if winner is null it's a tie — reset votes so people vote again
      //     else {
      //       await update(ref(db, `rooms/${roomCode}/bracket/rounds/${currentRoundIndex}/${idx}`), { votes: {} });
      //     }
      //   }
    });
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
