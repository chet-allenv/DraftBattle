// Lobby — first screen players see.
// Host creates the room (display-only, not a player).
// Players join with a name. Host starts the game.
import { useState }                        from 'react';
import { ref, set, update, get, remove }   from 'firebase/database';
import { db }                              from '../firebase';
import { useRoom }                         from '../hooks/useRoom';
import { useToast }                        from './Toast';
import { generateRoomCode }                from '../utils/roomUtils';

export default function Lobby({ setRoomCode, setPlayerId, initialRoomCode = '', initialPlayerId = '' }) {
  const [nameInput,     setNameInput]     = useState('');
  const [roomInput,     setRoomInput]     = useState('');
  const [currentRoom,   setCurrentRoom]   = useState(initialRoomCode);
  const [currentPlayer, setCurrentPlayer] = useState(initialPlayerId);


  const players = useRoom(currentRoom, 'players');
  const room    = useRoom(currentRoom);
  const toast   = useToast();

  // ── Create a new room (host is display-only, not added to players) ─
  const handleCreate = async () => {
    const code = generateRoomCode();
    const uid  = `host-${Date.now()}`;

    await set(ref(db, `rooms/${code}`), {
      phase:               'lobby',
      hostId:              uid,
      picksPerPlayer:      5,
      draftType:           'snake',
      pickTimerSeconds:    30,
      matchupTimerSeconds: 60,
      votingTimerSeconds:  30,
      players:             {},
    });

    setCurrentRoom(code);
    setCurrentPlayer(uid);
    setRoomCode(code);
    setPlayerId(uid);
  };

  // ── Join an existing room ─────────────────────────────────────────
  const handleJoin = async () => {
    if (!nameInput.trim() || !roomInput.trim()) return toast('Enter your name and a room code');

    const uid  = `player-${Date.now()}`;
    const code = roomInput.toUpperCase().trim();

    const snapshot = await get(ref(db, `rooms/${code}`));
    if (!snapshot.exists()) return toast('Room not found — check the code and try again');

    const existingNames = Object.values(snapshot.val().players || {}).map(p => p.name.toLowerCase());
    if (existingNames.includes(nameInput.trim().toLowerCase())) return toast('That name is taken — pick another');

    await set(ref(db, `rooms/${code}/players/${uid}`), { name: nameInput.trim() });

    setCurrentRoom(code);
    setCurrentPlayer(uid);
    setRoomCode(code);
    setPlayerId(uid);
  };

  // ── Start the game (host only) ────────────────────────────────────
  const handleStart = async () => {
    if (playerList.length < 2) return toast('Need at least 2 players to start');
    await update(ref(db, `rooms/${currentRoom}`), { phase: 'vote' });
  };

  // ── Update settings (host only) ───────────────────────────────────
  const handleSetting = async (key, value) => {
    await update(ref(db, `rooms/${currentRoom}`), { [key]: value });
  };

  // ── Close room / Leave room ───────────────────────────────────────
  const handleClose = async () => { await remove(ref(db, `rooms/${currentRoom}`)); };
  const handleLeave = async () => {
    await remove(ref(db, `rooms/${currentRoom}/players/${currentPlayer}`));
    setCurrentRoom(''); setCurrentPlayer(''); setRoomCode(''); setPlayerId('');
  };

  // ── Render: join/create form ──────────────────────────────────────
  if (!currentRoom) {
    return (
      <div className="screen" style={{ justifyContent: 'center' }}>
        <h1 className="game-title">DRAFT <span>BATTLE</span></h1>
        <p style={{ color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>
          Join at <span style={{ color: 'var(--carolina)' }}>draft-battle.web.app</span>
        </p>

        <div className="col" style={{ width: '100%', maxWidth: '320px' }}>
          {/* Host creates the room — no name needed */}
          <button className="btn btn--primary" onClick={handleCreate}>Create Room (Host)</button>

          <hr className="divider" />

          {/* Players join with a name */}
          <input
            className="input"
            placeholder="Your name"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
          />
          <input
            className="input"
            placeholder="Room code"
            value={roomInput}
            onChange={e => setRoomInput(e.target.value.toUpperCase())}
          />
          <button className="btn btn--secondary" onClick={handleJoin}>Join Room</button>
        </div>
      </div>
    );
  }

  // ── Render: waiting room ──────────────────────────────────────────
  const playerList          = players ? Object.entries(players) : [];
  const isHost              = room?.hostId === currentPlayer;
  const picksPerPlayer      = room?.picksPerPlayer      ?? 5;
  const draftType           = room?.draftType           ?? 'snake';
  const pickTimerSeconds    = room?.pickTimerSeconds    ?? 30;
  const matchupTimerSeconds = room?.matchupTimerSeconds ?? 60;
  const votingTimerSeconds  = room?.votingTimerSeconds  ?? 30;

  return (
    <div className="screen" style={{ gap: '12px' }}>
      <h2 style={{ color: 'var(--text-dim)', fontSize: '1.2rem', margin: 0 }}>Room Code</h2>
      <div className="room-code">{currentRoom}</div>
      <p style={{ color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
        Join at <span style={{ color: 'var(--carolina)' }}>draft-battle.web.app</span>
      </p>

      <h3 style={{ color: 'var(--carolina)', margin: 0 }}>Players ({playerList.length})</h3>
      <ul className="player-list">
        {playerList.map(([id, p]) => (
          <li key={id} className="player-list__item">{p.name}</li>
        ))}
      </ul>

      {isHost  && <button className="btn btn--success" onClick={handleStart}>Start Game!</button>}
      {!isHost && <p className="text-dim">Waiting for host to start...</p>}

      {/* Settings — host only */}
      {isHost && (
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <h4 style={{ margin: '0 0 18px', color: 'var(--carolina)', fontSize: '1.1rem' }}>Game Settings</h4>

          {/* Picks per player */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Picks per Player
            </label>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              How many items each player drafts before the battle round.
            </p>
            <div className="row" style={{ gap: '8px' }}>
              <button className="btn btn--ghost" style={{ padding: '6px 14px' }}
                onClick={() => handleSetting('picksPerPlayer', Math.max(1, picksPerPlayer - 1))}>−</button>
              <span style={{ fontWeight: 800, fontSize: '1.4rem', minWidth: '32px', textAlign: 'center' }}>{picksPerPlayer}</span>
              <button className="btn btn--ghost" style={{ padding: '6px 14px' }}
                onClick={() => handleSetting('picksPerPlayer', Math.min(10, picksPerPlayer + 1))}>+</button>
            </div>
          </div>

          {/* Draft type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Draft Order
            </label>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              {draftType === 'snake'
                ? 'Snake — order reverses each round (1-2-3-3-2-1). Fairer for all positions.'
                : 'Linear — same order every round (1-2-3-1-2-3). First pick always goes first.'}
            </p>
            <div className="row" style={{ gap: '8px' }}>
              {['snake', 'linear'].map(type => (
                <button key={type}
                  className={`btn ${draftType === type ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ padding: '7px 18px', fontSize: '0.85rem', flex: 1 }}
                  onClick={() => handleSetting('draftType', type)}>
                  {type === 'snake' ? 'Snake' : 'Linear'}
                </button>
              ))}
            </div>
          </div>

          {/* Pick timer */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Pick Timer
            </label>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              How long each player has to make a draft pick. Runs out → auto-skip.
            </p>
            <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
              {[0, 15, 30, 60].map(s => (
                <button key={s}
                  className={`btn ${pickTimerSeconds === s ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ padding: '7px 14px', fontSize: '0.82rem', flex: 1 }}
                  onClick={() => handleSetting('pickTimerSeconds', s)}>
                  {s === 0 ? 'Off' : `${s}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Matchup timer */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Presentation Timer
            </label>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Time each player gets to present their team during a battle. Both players present before voting opens.
            </p>
            <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
              {[0, 30, 60, 120].map(s => (
                <button key={s}
                  className={`btn ${matchupTimerSeconds === s ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ padding: '7px 14px', fontSize: '0.82rem', flex: 1 }}
                  onClick={() => handleSetting('matchupTimerSeconds', s)}>
                  {s === 0 ? 'Off' : `${s}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Voting timer */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Voting Timer
            </label>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              How long players have to cast their vote. Runs out → winner decided by votes so far (ties broken randomly).
            </p>
            <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
              {[0, 15, 30, 60].map(s => (
                <button key={s}
                  className={`btn ${votingTimerSeconds === s ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ padding: '7px 14px', fontSize: '0.82rem', flex: 1 }}
                  onClick={() => handleSetting('votingTimerSeconds', s)}>
                  {s === 0 ? 'Off' : `${s}s`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <hr className="divider" style={{ width: '100%', maxWidth: '400px' }} />
      {isHost
        ? <button className="btn btn--ghost" onClick={handleClose}>Close Room</button>
        : <button className="btn btn--ghost" onClick={handleLeave}>Leave Room</button>
      }
    </div>
  );
}
