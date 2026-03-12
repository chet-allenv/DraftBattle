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
  // TODO: loop through Object.values(votes) and count occurrences of each player ID
  //   Hint: use .reduce() or a simple for...of loop
  //   Return: { playerAVotes: number, playerBVotes: number }
}

// Returns the winner ID if one player has strictly more votes, otherwise null (tie)
export function getMatchupWinner(votes, playerAId, playerBId) {
  // TODO: call tallyVotes, compare counts, return winning ID or null
}

// Returns true when every player in the room has cast a vote for this matchup
export function hasAllVoted(votes, allPlayerIds) {
  // TODO: check that every ID in allPlayerIds appears as a key in votes
  //   Hint: allPlayerIds.every(id => votes && votes[id] !== undefined)
}
