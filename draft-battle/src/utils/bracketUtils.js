/*

Purpose: Pure functions for bracket generation and progression. Builds a bracket from player list and advances winners. No React, no Firebase, no side effects. Just input -> output.

Responsibilities:
- Accepts an array of playerIds and returns a bracket object, matching the structure in Firebase.
- Pads to next power of 2 with byes if necessary (e.g. 6 players -> 8 player bracket with 2 byes, 9 players -> 16 player bracket with 7 byes)
- Given completed matchups in a round, generates the next round's matchups until a winner is determined
- Determines if there is a champion (only 1 player left) and returns their playerId

Key members:
- buildBracket(playerIds): -> bracket object with rounds and matchups
- getNextRound(completedRound): -> next round object with matchups
- getRoundCount(playerCount): -> number of rounds needed for given player count
    // (Math.ceil(Math.log2(playerCount)))
- hasBye(matchup): -> boolean

*/

// Pad playerIds up to the next power of 2 with null (byes)
// Example: 3 players → [uid1, uid2, uid3, null]
function padToPowerOfTwo(playerIds) {
  let size = 1;

  while (size < playerIds.length) size *= 2;

  return [...playerIds, ...Array(size - playerIds.length).fill(null)];
}

// Build the initial bracket object from a list of player IDs
// Returns an object shaped for Firebase: { rounds: { 0: { 0: {playerA, playerB, votes:{}, winner:null} } } }
export function buildBracket(playerIds) {
  const seeded = padToPowerOfTwo(shuffled(playerIds));
  const matchups = {};
  for (let i = 0; i < seeded.length; i += 2) {
    matchups[i / 2] = {
      playerA: seeded[i],
      playerB: seeded[i + 1],  // null = bye
      votes:   {},
      winner:  seeded[i + 1] === null ? seeded[i] : null, // auto-advance byes
    };
  }
  return { rounds: { 0: matchups }, champion: null };
}

// Given a completed round's matchups, build the next round
export function buildNextRound(completedMatchups) {
    const winners = Object.values(completedMatchups).map(m => m.winner);
    const nextRound = {};
    for (let i = 0; i < winners.length; i += 2) {
        nextRound[i / 2] = {
            playerA: winners[i],
            playerB: winners[i + 1] || null, // handle odd number of winners
            votes: {},
            winner: winners[i + 1] ? null : winners[i], // auto-advance if bye
        };
    }
    return nextRound;
}

// Helper — shuffle without importing roomUtils
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
