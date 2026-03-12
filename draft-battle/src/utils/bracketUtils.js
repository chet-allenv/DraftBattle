/*
Purpose: Pure functions for bracket generation and progression.
Responsibilities:
- buildBracket: distributes byes so no two nulls are paired (no null-null matchups), byes randomly assigned
- buildNextRound: sorts bye-winners first so they get paired, preventing back-to-back byes
*/

// Shuffle helper
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build initial bracket — only 1 bye when player count is odd.
// Never pads to the next power of 2, so 5 players = 2 real matchups + 1 bye,
// not 1 real matchup + 3 byes.
// The bye is placed first so that player faces a real opponent in round 2.
export function buildBracket(playerIds) {
  const players = shuffled(playerIds);
  const matchups = {};
  let matchupIdx = 0;
  let playerIdx  = 0;

  // If odd count, exactly one player gets a bye (placed first)
  if (players.length % 2 !== 0) {
    const p = players[playerIdx++];
    matchups[matchupIdx++] = { playerA: p, playerB: null, votes: {}, winner: p };
  }

  // All remaining players paired into real matchups
  while (playerIdx < players.length) {
    matchups[matchupIdx++] = {
      playerA: players[playerIdx++],
      playerB: players[playerIdx++],
      votes:   {},
      winner:  null,
    };
  }

  return { rounds: { 0: matchups }, champion: null, roundStartedAt: Date.now() };
}

// Returns ordered list of player IDs who need to present this round (excludes byes/resolved)
export function buildPresenterQueue(matchups) {
  const queue = [];
  Object.values(matchups).forEach(m => {
    if (!m.playerB || m.winner) return;
    queue.push(m.playerA, m.playerB);
  });
  return queue;
}

// Build next round — bye-winners sorted first so they get paired, preventing back-to-back byes
export function buildNextRound(completedMatchups) {
  const matchupsArr = Object.values(completedMatchups);

  const byeWinners = new Set(
    matchupsArr.filter(m => m.playerB === null).map(m => m.winner)
  );

  const winners = matchupsArr.map(m => m.winner);

  // If odd count, sort bye-winners first → they pair up, non-bye player gets the new bye
  if (winners.length % 2 !== 0) {
    winners.sort((a, b) => (byeWinners.has(a) ? 0 : 1) - (byeWinners.has(b) ? 0 : 1));
  }

  const nextRound = {};
  for (let i = 0; i < winners.length; i += 2) {
    const pA = winners[i];
    const pB = winners[i + 1] || null;
    nextRound[i / 2] = { playerA: pA, playerB: pB, votes: {}, winner: pB ? null : pA };
  }
  return nextRound;
}
