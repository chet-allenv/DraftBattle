/*

Purpose: Pure functions for matchup vote tallying. No React, no Firebase, no side effects. Just input -> output.

Responsibilities:
- Count votes for each player in a matchup and determine the winner
- Determines if a matchup is over. Either all votes are in or a majority is reached (e.g. 3 votes in a 5 player matchup)
- Handles ties by declaring the player with the lower playerId as the winner (arbitrary but deterministic)

Key members:
- tallyVotes(votes): -> { playerAVotes, playerBVotes }
- getMatchupWinner(votes, playerAId, playerBId): -> playerId of winner or null if matchup not decided
- hasAllVoted(votes, playerIds): -> boolean

*/

// Count how many votes each player received
// votes shape: { uid-alice: 'uid-bob', uid-bob: 'uid-bob', uid-carol: 'uid-alice' }
export function tallyVotes(votes, playerAId, playerBId) {
  const vals = Object.values(votes || {});
  return { playerAVotes: vals.filter(v => v === playerAId).length,
           playerBVotes: vals.filter(v => v === playerBId).length };
}

// Returns the winner ID if one player has strictly more votes, or null on a tie (triggers re-vote)
export function getMatchupWinner(votes, playerAId, playerBId) {
  const { playerAVotes, playerBVotes } = tallyVotes(votes, playerAId, playerBId);
  if (playerAVotes > playerBVotes) return playerAId;
  if (playerBVotes > playerAVotes) return playerBId;
  return null; // tie — caller should clear votes and re-vote
}

// Returns true when every player in the room has cast a vote for this matchup
export function hasAllVoted(votes, allPlayerIds) {
    return allPlayerIds.every(id => votes && votes[id] !== undefined);
}
