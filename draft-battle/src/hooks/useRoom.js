/*

Purpose: Custom React hook. Subscribes to a specific path in the Firebase Realtime Database and returns the current value at that path.
 Automatically updates the value when it changes in the database.

Responsibilities:
- Accepts roomCode and optional subPath as parameters
- Uses onValue() to subscribe, fires immediately with current data and then every change
- Calls off() to unsubscribe when the component unmounts or when roomCode/subPath changes
- Returns the live value (or null while loading)

Key Members:
- useRoom(roomCode): -> full room object
- useRoom(roomCode, 'phase'): -> current phase of the game
- useRoom(roomCode, 'picks'): -> current picks object

*/

import { useState, useEffect } from 'react';
import { ref, onValue }        from 'firebase/database';
import { db }                  from '../firebase';

export function useRoom(roomCode, subPath = '') {
  const [data, setData] = useState(null);

  useEffect(() => {
    // TODO 1: return early if roomCode is empty or null

    // TODO 2: build the Firebase path string
    //   if subPath is provided: 'rooms/{roomCode}/{subPath}'
    //   if not:                 'rooms/{roomCode}'
    //   Hint: use a ternary — subPath ? `rooms/...` : `rooms/...`

    // TODO 3: create a Firebase ref using ref(db, yourPath)

    // TODO 4: call onValue(yourRef, (snapshot) => { ... })
    //   inside the callback: check snapshot.exists()
    //   if it exists: call setData(snapshot.val())
    //   if not:       call setData(null)

    // TODO 5: return a cleanup function that calls unsubscribe()
    //   this prevents memory leaks when the component unmounts

  }, [roomCode, subPath]);

  return data;
}
