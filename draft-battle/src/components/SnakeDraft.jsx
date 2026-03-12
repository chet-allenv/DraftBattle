// SnakeDraft — the pick phase.
// Host sees the full draft board (display screen).
// Players see only their own picks + input when it's their turn.
// Double-skip fix: auto-skip uses setTimeout keyed to turnStartedAt, NOT timeLeft state.
// timeLeft state is purely visual; it cannot trigger a skip.
import { useState, useEffect, useRef } from 'react';
import { ref, update }                 from 'firebase/database';
import { db }                          from '../firebase';
import { useRoom }                     from '../hooks/useRoom';
import { useToast }                    from './Toast';
import { getPickOwner, getTotalPicks } from '../utils/draftUtils';
import { shufflePlayers }              from '../utils/roomUtils';
import { buildBracket } from '../utils/bracketUtils';

export default function SnakeDraft({ roomCode, playerId }) {
  const [pickInput, setPickInput] = useState('');
  const [timeLeft,  setTimeLeft]  = useState(null);
  const timerRef       = useRef(null);
  const skipTimeoutRef = useRef(null);
  const lastSkippedIndexRef = useRef(-1);
  const toast = useToast();

  const room       = useRoom(roomCode);
  const players    = useRoom(roomCode, 'players');
  const picks      = useRoom(roomCode, 'picks');
  const draftOrder = useRoom(roomCode, 'draftOrder');

  // Both read from the same room subscription so they always arrive together,
  // eliminating the race condition that caused double-skips.
  const pickIndex     = room?.currentPickIndex ?? 0;
  const turnStartedAt = room?.turnStartedAt;

  const playerIds           = players ? Object.keys(players) : [];
  const picksPerPlayer      = room?.picksPerPlayer    || 5;
  const draftType           = room?.draftType         || 'snake';
  const pickTimerSeconds    = room?.pickTimerSeconds  ?? 0;
  const matchupTimerSeconds = room?.matchupTimerSeconds ?? 0;
  const totalPicks          = getTotalPicks(playerIds.length, picksPerPlayer);
  const draftDone           = pickIndex >= totalPicks;
  const isHost              = room?.hostId === playerId;

  // ── Set up draft order on first load (host only) ──────────────────
  useEffect(() => {
    if (!draftOrder && room?.hostId === playerId && playerIds.length > 0) {
      const shuffled = shufflePlayers(playerIds);
      update(ref(db, `rooms/${roomCode}`), {
        draftOrder:       shuffled,
        currentPickIndex: 0,
        turnStartedAt:    Date.now(),
      });
    }
  }, [draftOrder, room?.hostId, playerId, playerIds, roomCode]);

  // ── Visual countdown (display only — never triggers skip) ─────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!pickTimerSeconds || !turnStartedAt) { setTimeLeft(null); return; }

    const tick = () => setTimeLeft(Math.max(0, Math.round(
      (turnStartedAt + pickTimerSeconds * 1000 - Date.now()) / 1000
    )));
    tick();
    timerRef.current = setInterval(tick, 500);
    return () => clearInterval(timerRef.current);
  }, [turnStartedAt, pickTimerSeconds]);

  // ── Whose turn is it? ─────────────────────────────────────────────
  const currentTurnId   = draftOrder ? getPickOwner(pickIndex, draftOrder, draftType) : null;
  const isMyTurn        = currentTurnId === playerId;
  const currentTurnName = players?.[currentTurnId]?.name || '...';

  const toTitleCase = s => s.trim().replace(/\b\w/g, c => c.toUpperCase());

  // ── Submit a pick ─────────────────────────────────────────────────
  const submitPick = async (rawValue) => {
    const display    = rawValue === '(skipped)' ? '(skipped)' : toTitleCase(rawValue);
    const normalized = display.toLowerCase();
    const allPicks   = picks ? Object.values(picks).flat().filter(p => p !== '(skipped)') : [];

    if (rawValue !== '(skipped)' && allPicks.some(p => p.toLowerCase() === normalized))
      return toast('Already picked — choose something else!');

    const currentPicks = picks?.[playerId] || [];
    const newPicks     = [...currentPicks, display];
    const newIndex     = pickIndex + 1;
    const isLastPick   = newIndex >= totalPicks;

    if (isLastPick) {
      const votingTimerSeconds = room?.votingTimerSeconds ?? 0;
      const bracket = buildBracket(playerIds);

      // Find first real matchup (skip byes) — matches are played one at a time
      const round0 = bracket.rounds[0];
      const firstRealEntry = Object.entries(round0).find(([, m]) => m.playerB);
      const firstRealIdx   = firstRealEntry ? Number(firstRealEntry[0]) : 0;
      bracket.currentMatchupIndex = firstRealIdx;

      bracket.votingOpen = matchupTimerSeconds === 0;
      if (matchupTimerSeconds === 0 && votingTimerSeconds > 0) {
        bracket.votingStartedAt = Date.now();
      }
      if (matchupTimerSeconds > 0 && firstRealEntry) {
        const m = firstRealEntry[1];
        bracket.presenterQueue = [m.playerA, m.playerB];
        bracket.presenterIndex = 0;
      }
      await update(ref(db, `rooms/${roomCode}`), {
        [`picks/${playerId}`]: newPicks,
        currentPickIndex:      newIndex,
        bracket,
        phase:                 'bracket',
      });
    } else {
      await update(ref(db, `rooms/${roomCode}`), {
        [`picks/${playerId}`]: newPicks,
        currentPickIndex:      newIndex,
        turnStartedAt:         Date.now(),
      });
    }
    setPickInput('');
  };

  const handlePick    = async () => { if (!isMyTurn || !pickInput.trim()) return; await submitPick(pickInput); };
  const handleKeyDown = (e)       => { if (e.key === 'Enter') handlePick(); };

  // ── Auto-skip: wall-clock setTimeout, NOT timeLeft state ──────────
  // Root cause of double-skip: timeLeft is local state. When player A skips,
  // Firebase writes new pickIndex + turnStartedAt atomically. Player B's device
  // sees isMyTurn=true in the SAME render where timeLeft is still 0 (state hasn't
  // updated yet). Fixing this by using setTimeout keyed to the actual deadline.
  // When B becomes active, turnStartedAt is fresh, so deadline is ~30s away.
  useEffect(() => {
    if (skipTimeoutRef.current) { clearTimeout(skipTimeoutRef.current); skipTimeoutRef.current = null; }
    if (!isMyTurn || draftDone || !pickTimerSeconds || !turnStartedAt) return;

    const deadline = turnStartedAt + pickTimerSeconds * 1000;
    const delay    = deadline - Date.now();
    if (delay <= 0) return; // Fresh turn should always be > 0

    skipTimeoutRef.current = setTimeout(() => {
      if (lastSkippedIndexRef.current === pickIndex) return;
      lastSkippedIndexRef.current = pickIndex;
      submitPick('(skipped)');
    }, delay + 200); // +200ms buffer so visual timer hits 0 first

    return () => { if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current); };
  }, [isMyTurn, pickIndex, turnStartedAt, pickTimerSeconds, draftDone]);

  const timerColor = timeLeft === null ? null
    : timeLeft > pickTimerSeconds * 0.5  ? 'var(--success)'
    : timeLeft > pickTimerSeconds * 0.25 ? 'var(--warning)'
    : '#e05555';

  const TurnBanner = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', textAlign: 'center' }}>
        Pick {pickIndex + 1} of {totalPicks} —{' '}
        {isMyTurn
          ? <span style={{ color: 'var(--success)' }}>YOUR TURN!</span>
          : <span className="text-dim">{currentTurnName}'s turn</span>
        }
      </p>
      {timeLeft !== null && (
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: timerColor, minWidth: '40px', textAlign: 'center' }}>
          {timeLeft}s
        </span>
      )}
    </div>
  );

  // ── HOST view: full draft board ───────────────────────────────────
  if (isHost) {
    return (
      <div className="screen--top">
        <h2 style={{ fontSize: '1.6rem', color: 'var(--warning)', margin: 0, textAlign: 'center' }}>
          Draft — <span style={{ color: 'var(--carolina)' }}>{room?.winningTheme}</span>
        </h2>
        <TurnBanner />
        <div className="draft-board">
          {(draftOrder || playerIds).map(uid => (
            <div key={uid} className={`draft-column${uid === currentTurnId ? ' draft-column--active' : ''}`}>
              <div className="draft-column__header">{players?.[uid]?.name}</div>
              {(picks?.[uid] || []).map((pick, i) => (
                <div key={i} className={`draft-pick${pick === '(skipped)' ? ' draft-pick--skipped' : ''}`}>
                  {pick === '(skipped)' ? `${i + 1}. —` : `${i + 1}. ${pick}`}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── PLAYER view: own picks + input only ───────────────────────────
  const myPicks = picks?.[playerId] || [];

  return (
    <div className="screen">
      <h2 style={{ fontSize: '1.4rem', color: 'var(--warning)', margin: 0, textAlign: 'center' }}>
        Draft — <span style={{ color: 'var(--carolina)' }}>{room?.winningTheme}</span>
      </h2>
      <TurnBanner />

      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h4 style={{ color: 'var(--carolina)', margin: '0 0 10px' }}>Your Picks</h4>
        {myPicks.length === 0
          ? <p className="text-dim" style={{ margin: 0, fontSize: '0.9rem' }}>No picks yet</p>
          : myPicks.map((pick, i) => (
              <div key={i} className={`draft-pick${pick === '(skipped)' ? ' draft-pick--skipped' : ''}`}>
                {pick === '(skipped)' ? `${i + 1}. —` : `${i + 1}. ${pick}`}
              </div>
            ))
        }
      </div>

      {isMyTurn && !draftDone && (
        <div className="row" style={{ width: '100%', maxWidth: '400px' }}>
          <input
            className="input"
            placeholder="Type your pick..."
            value={pickInput}
            onChange={e => setPickInput(e.target.value.slice(0, 100))}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="btn btn--primary" onClick={handlePick}>Pick!</button>
        </div>
      )}
      {!isMyTurn && !draftDone && (
        <p className="text-dim" style={{ margin: 0 }}>Waiting for {currentTurnName}...</p>
      )}
    </div>
  );
}
