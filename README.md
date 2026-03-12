# 🏆 Draft Battle

A real-time multiplayer draft game built with React and Firebase. Players join a shared room, vote on a theme, snake draft items against each other, and settle it in a player-voted single-elimination bracket.

---

## How It Works

1. **Lobby** — One player creates a room and shares the 6-character code. Everyone joins on their phone or browser.
2. **Theme Vote** — Each player submits a theme idea. Everyone votes. Most votes wins.
3. **Snake Draft** — Players take turns picking items that fit the theme. Turn order reverses each round (snake format).
4. **Bracket** — Single-elimination bracket. Everyone votes on each head-to-head matchup. One champion is crowned.

---

## Tech Stack

- **React** — UI and component logic
- **Firebase Realtime Database** — live game state synced across all players
- **JavaScript (ES6+)**

---

## Getting Started

### Prerequisites

- Node.js 18+ — [nodejs.org](https://nodejs.org)
- A Firebase account — [firebase.google.com](https://firebase.google.com) (free Spark plan)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/draft-battle.git
cd draft-battle
npm install
```

### Firebase Setup

1. Go to [firebase.google.com](https://firebase.google.com) and create a new project
2. Navigate to **Build → Realtime Database → Create Database**
3. Start in **test mode**
4. Go to **Project Settings → Your Apps → </> Web** and copy your config

### Environment Variables

Create a `.env` file in the root of the project:

```
REACT_APP_FIREBASE_API_KEY=your_value
REACT_APP_FIREBASE_AUTH_DOMAIN=your_value
REACT_APP_FIREBASE_DATABASE_URL=your_value
REACT_APP_FIREBASE_PROJECT_ID=your_value
REACT_APP_FIREBASE_STORAGE_BUCKET=your_value
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_value
REACT_APP_FIREBASE_APP_ID=your_value
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### Running Locally

```bash
npm start
```

Opens at `http://localhost:3000`. Open a second tab to simulate a second player.

---

## Project Structure

```
src/
  App.jsx                  # Root — reads phase, renders correct screen
  firebase.js              # Firebase init and db export
  hooks/
    useRoom.js             # Custom hook — live Firebase subscription
  components/
    Lobby.jsx              # Join/create room, player list, host start
    ThemeVote.jsx          # Theme submission and voting
    SnakeDraft.jsx         # Live draft board with turn enforcement
    Bracket.jsx            # Bracket viewer and vote resolution
    MatchupCard.jsx        # Single matchup card used inside Bracket
  utils/
    roomUtils.js           # generateRoomCode(), shufflePlayers()
    draftUtils.js          # getPickOwner(), getTotalPicks()
    bracketUtils.js        # buildBracket(), buildNextRound()
    matchupUtils.js        # tallyVotes(), getMatchupWinner(), hasAllVoted()
```

---

## Features

- 🔴 **Real-time sync** — all players see the same state instantly, no refresh needed
- 🐍 **Snake draft** — turn order reverses each round for fair picks
- 🗳️ **Player-voted bracket** — no AI, no host bias — the whole room decides
- 📱 **Mobile friendly** — designed to be played on phones
- ♻️ **Play again** — replay with the same room code without rejoining

---

## Stretch Goals (Planned)

- [ ] Play Again button — reset room without new code
- [ ] Jackbox display mode — big screen TV view + phone as controller
- [ ] Per-pick countdown timer
- [ ] Persistent win leaderboard across sessions

---

## License

MIT
