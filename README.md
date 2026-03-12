# Draft Battle

A real-time multiplayer party game built with React and Firebase. Players join a shared room, vote on a theme, snake draft items against each other, and settle it in a player-voted single-elimination bracket.

Live at **[draft-battle.web.app](https://draft-battle.web.app)**

---

## The Story

Back in college, my friends and I had a go-to game that needed nothing more than a whiteboard and a group of people with strong opinions.

Someone would shout out a category, *best action movie villains*, *worst foods to eat before a flight*, *things you'd bring to a deserted island*, and we'd take turns drafting our picks, snake-style, until everyone had a team. Then came the real fun: head-to-head debates in front of the whole room, with everyone voting on who made the better case. Losers got crossed off the bracket. One champion walked away with bragging rights.

It was loud, it was chaotic, and it was one of the best ways to kill an afternoon.

Draft Battle is that whiteboard game, rebuilt as a proper video game. Same concept, same energy, now playable from anywhere, with real timers, a live bracket, and no dry-erase markers required.

---

## How It Works

1. **Lobby** — The host creates a room and shares the 6-character code. Players join on their phones. The host screen acts as the shared TV display (Jackbox-style).
2. **Theme Vote** — Everyone submits a theme idea. Everyone votes. Most votes wins.
3. **Snake Draft** — Players take turns picking items that fit the theme. Turn order reverses each round. Optional per-pick timer keeps things moving.
4. **Battle Bracket** — Single-elimination tournament. Each matchup is played one at a time, both players present their case, then everyone votes. One champion is crowned.

---

## Tech Stack

- **React** — UI and component logic
- **Firebase Realtime Database** — live game state synced across all devices
- **Firebase Hosting** — deployment
- **JavaScript (ES6+)**

## Project Structure

```
src/
  App.jsx              # Root — reads phase from Firebase, renders correct screen
  firebase.js          # Firebase init and db export
  index.css            # Global styles and design tokens
  hooks/
    useRoom.js         # Custom hook — live Firebase subscription
  components/
    Lobby.jsx          # Join/create room, player list, host settings, start game
    ThemeVote.jsx      # Theme submission and voting
    SnakeDraft.jsx     # Live draft board with turn enforcement and auto-skip timer
    Bracket.jsx        # Sequential matchup flow, presentation timers, vote resolution
    MatchupCard.jsx    # Single matchup card used inside Bracket
    Results.jsx        # Champion display and full pick list
    Toast.jsx          # Lightweight toast notification system
  utils/
    roomUtils.js       # generateRoomCode()
    draftUtils.js      # getPickOwner(), getTotalPicks()
    bracketUtils.js    # buildBracket(), buildNextRound(), buildPresenterQueue()
```

---

## Features

- **Real-time sync** — all players see the same state instantly across any device
- **Jackbox-style host model** — host screen is the shared display; players use their phones as controllers
- **Snake or linear draft** — configurable turn order, reverses each round in snake mode
- **Sequential bracket battles** — matchups play out one at a time with presentation time for both players
- **Presentation timer** — each player gets a countdown to make their case; they can end early with a button
- **Pick and voting timers** — configurable per-game; auto-resolves on expiry
- **Player-voted results** — no host bias, the whole room decides every matchup
- **Odd-player bracket support** — minimum byes assigned (one bye max when player count is odd)
- **Mobile friendly** — designed to be played on phones; no app install needed
- **Play Again** — host resets the room without anyone needing to rejoin

---

## License

MIT
