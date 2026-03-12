/*

Purpose: Pure functions for snake draft logic. No React, no Firebase, no side effects. Just input -> output.

Responsibilities:
- Given a pick index and player count, returns the index of the player who is picking and whether the pick is in a "forward" or "reverse" round
- Snake order round 0: 0 -> N Round 1: N -> 0 Round 2: 0 -> N etc
- All functions are pure, smae input always produces same output

Key members:
- getPickOwner(pickIndex, draftOrder): -> playerId
    // pickIndex=0 -> draftOrder[0], pickIndex=1 -> draftOrder[1] etc until end of round 0, then reverse order for round 1
- isRoundReversed(pickIndex, playerCount): -> boolean
- getTurnPosition(pickIndex, playerCount): -> 0 to playerCount-1, resets each round

*/

// Snake draft: round 0 goes forward, round 1 goes backward, etc.
// Example with 3 players [A, B, C] and 9 total picks:
//   Index: 0  1  2  3  4  5  6  7  8
//   Player: A  B  C  C  B  A  A  B  C

export function getPickOwner(pickIndex, draftOrder) {
  const n = draftOrder.length;

  // TODO 1: calculate which round we are in
  //   Hint: const round = Math.floor(pickIndex / n);

  // TODO 2: calculate position within the current round
  //   Hint: const position = pickIndex % n;

  // TODO 3: if round is odd (reversed), count from the end
  //   Hint: if (round % 2 === 1) return draftOrder[n - 1 - position];
  //         else                 return draftOrder[position];
}

// Returns total picks needed to end the draft
export function getTotalPicks(playerCount, picksPerPlayer) {
  return playerCount * picksPerPlayer;
}
