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
    if (!roomCode) return;

    const path = subPath ? `rooms/${roomCode}/${subPath}` : `rooms/${roomCode}`;

    const dbRef = ref(db, path);

    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      } else {
        setData(null);
      }
    });

    return () => { unsubscribe(); };

  }, [roomCode, subPath]);

  return data;
}
