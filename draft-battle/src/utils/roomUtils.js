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
// Example output: 'XK92BT'
export function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
