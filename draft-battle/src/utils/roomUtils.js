/*

Purpose: Utility functions for managing draft rooms, such as generating room codes and shuffling player order.

Responsibilities:
- generateRoomCode(): creates a random 6-character uppercase string for room codes
- shufflePlayers(playerIds): takes an array of player IDs and returns a new array with the IDs in random order (for draft order)

Key members:
- generateRoomCode(): -> string
- shufflePlayers(playerIds): -> shuffled array of playerIds

*/

// Generate a random 6-character uppercase room code
// Excludes O, 0, I, 1 to avoid visual confusion
// Example output: 'XK92BT'
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Shuffle an array of player IDs into a random order
// This becomes the draft order
export function shufflePlayers(playerIds) {
    const arr = [...playerIds];

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
