import { useState, useEffect, useRef } from 'react';
import { ref, update }                 from 'firebase/database';
import { db }                          from '../firebase';
import { useRoom }                     from '../hooks/useRoom';
import MatchupCard                     from './MatchupCard';
import { getMatchupWinner, hasAllVoted } from '../utils/matchupUtils';
import { buildNextRound }              from '../utils/bracketUtils';

// ── Tournament bracket visual (March Madness style) ──────────────────
function BracketMatchupBox({ matchup, players, isCurrent }) {
  const { playerA, playerB, winner } = matchup;
  const nameA = players?.[playerA]?.name || '?';
  const nameB = players?.[playerB]?.name;

  const rowStyle = (pid) => ({
    fontWeight: 700, fontSize: '0.8rem', padding: '4px 8px',
    color: winner === pid ? 'var(--success)'
         : winner && winner !== pid ? 'var(--text-dim)'
         : 'var(--white)',
    textDecoration: winner && winner !== pid ? 'line-through' : 'none',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px',
  });

  return (
    <div style={{
      border: `1px solid ${isCurrent ? 'var(--carolina)' : 'var(--border)'}`,
      borderRadius: '6px', background: 'var(--panel)', overflow: 'hidden', minWidth: '110px',
      boxShadow: isCurrent ? '0 0 12px rgba(75,156,211,0.3)' : 'none',
    }}>
      <div style={rowStyle(playerA)}>{nameA}</div>
      <div style={{ height: '1px', background: 'var(--border)' }} />
      <div style={rowStyle(playerB)}>
        {nameB || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.75rem' }}>Bye</span>}
      </div>
    </div>
  );
}

function TournamentBracket({ bracket, players, currentRoundIndex, currentMatchupIndex }) {
  if (!bracket?.rounds) return null;
  const roundKeys = Object.keys(bracket.rounds).sort((a, b) => Number(a) - Number(b));

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', width: '100%', overflowX: 'auto' }}>
      {roundKeys.map((rIdx) => {
        const matchups = Object.values(bracket.rounds[rIdx]);
        const isCur    = Number(rIdx) === Number(currentRoundIndex);
        const label    = matchups.length === 1 ? 'Final' : `Round ${Number(rIdx) + 1}`;

        return (
          <div key={rIdx} style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '130px' }}>
            <div style={{ textAlign: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem',
              letterSpacing: '1px', padding: '4px 0', color: isCur ? 'var(--carolina)' : 'var(--text-dim)' }}>
              {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-around', gap: '8px', padding: '4px 8px' }}>
              {Object.entries(bracket.rounds[rIdx]).map(([mIdx, m]) => (
                <BracketMatchupBox
                  key={mIdx}
                  matchup={m}
                  players={players}
                  isCurrent={isCur && Number(mIdx) === Number(currentMatchupIndex) && !m.winner && !!m.playerB}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Current matchup — big split display ──────────────────────────────
function CurrentMatchupDisplay({ matchup, players, picks, isDiscussing, presenterName, presenterIndex, presenterQueueLength, timeLeft, timerColor, votingOpen, votingTimeLeft, votingTimerColor }) {
  const { playerA, playerB } = matchup;
  const nameA  = players?.[playerA]?.name || '?';
  const nameB  = players?.[playerB]?.name || '?';
  const picksA = picks?.[playerA] || [];
  const picksB = picks?.[playerB] || [];
  const isPresentingA = isDiscussing && presenterName === nameA;
  const isPresentingB = isDiscussing && presenterName === nameB;

  const TeamCol = ({ name, teamPicks, isPresenting, align }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start', padding: '0 12px' }}>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '2px',
        color: isPresenting ? 'var(--carolina)' : 'var(--white)', marginBottom: '6px', textAlign: align }}>
        {name}
        {isPresenting && (
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--carolina)', fontFamily: 'Inter, sans-serif',
            fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Presenting ({presenterIndex + 1}/{presenterQueueLength})
          </span>
        )}
      </div>
      <ol style={{ margin: 0, padding: align === 'right' ? '0 16px 0 0' : '0 0 0 16px', listStyle: 'decimal' }}>
        {teamPicks.map((p, i) => (
          <li key={i} style={{ fontSize: '0.9rem', color: p === '(skipped)' ? 'var(--text-dim)' : 'var(--off-white)',
            fontStyle: p === '(skipped)' ? 'italic' : 'normal', lineHeight: '1.8', textAlign: align }}>
            {p === '(skipped)' ? '—' : p}
          </li>
        ))}
      </ol>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', maxWidth: '860px', alignSelf: 'center',
      background: 'var(--panel)', border: '1px solid var(--carolina)', borderRadius: '14px', padding: '16px 8px' }}>
      <TeamCol name={nameA} teamPicks={picksA} isPresenting={isPresentingA} align="left" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '90px', gap: '8px' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.6rem', color: 'var(--warning)', letterSpacing: '4px', lineHeight: 1 }}>VS</div>
        {timeLeft !== null && (
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: timerColor, lineHeight: 1 }}>{timeLeft}s</div>
        )}
        {votingOpen && (
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Voting Open!</div>
        )}
        {votingTimeLeft !== null && (
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: votingTimerColor, lineHeight: 1 }}>{votingTimeLeft}s</div>
        )}
      </div>
      <TeamCol name={nameB} teamPicks={picksB} isPresenting={isPresentingB} align="right" />
    </div>
  );
}

// ── Helper: find first unplayed real matchup at or after startIdx ─────
function findNextRealMatchup(matchups, startIdx) {
  return Object.entries(matchups)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .find(([i, m]) => Number(i) >= startIdx && m.playerB && !m.winner) || null;
}

// ─────────────────────────────────────────────────────────────────────
export default function Bracket({ roomCode, playerId }) {
  const [timeLeft,       setTimeLeft]       = useState(null);
  const [votingTimeLeft, setVotingTimeLeft] = useState(null);
  const timerRef          = useRef(null);
  const votingTimerRef    = useRef(null);
  const advancedRef       = useRef(false);
  const votingAdvancedRef = useRef(false);

  const room    = useRoom(roomCode);
  const bracket = useRoom(roomCode, 'bracket');
  const players = useRoom(roomCode, 'players');
  const picks   = useRoom(roomCode, 'picks');

  const allPlayerIds        = players ? Object.keys(players) : [];
  const isHost              = room?.hostId === playerId;
  const matchupTimerSeconds = room?.matchupTimerSeconds ?? 0;
  const votingTimerSeconds  = room?.votingTimerSeconds  ?? 0;
  const votingOpen          = bracket?.votingOpen ?? (matchupTimerSeconds === 0);

  const rawQueue       = bracket?.presenterQueue;
  const presenterQueue = rawQueue
    ? (Array.isArray(rawQueue) ? rawQueue : Object.values(rawQueue))
    : [];
  const presenterIndex   = bracket?.presenterIndex ?? 0;
  const currentPresenter = presenterQueue[presenterIndex] ?? null;

  const getCurrentRound = (b) => {
    if (!b?.rounds) return null;
    const idx = Object.keys(b.rounds).length - 1;
    return { index: idx, matchups: b.rounds[idx] };
  };

  // ── Helper: set up next matchup within same round ──────────────────
  const advanceToMatchup = async (nextIdx, nextMatchup) => {
    const queue = matchupTimerSeconds > 0 ? [nextMatchup.playerA, nextMatchup.playerB] : null;
    await update(ref(db, `rooms/${roomCode}/bracket`), {
      currentMatchupIndex: nextIdx,
      roundStartedAt:      matchupTimerSeconds > 0 ? Date.now() : null,
      votingOpen:          matchupTimerSeconds === 0,
      votingStartedAt:     matchupTimerSeconds === 0 && votingTimerSeconds > 0 ? Date.now() : null,
      presenterQueue:      queue,
      presenterIndex:      0,
    });
  };

  // ── Helper: advance to next round or crown champion ────────────────
  const advanceRound = async (roundIndex, matchups) => {
    const matchupList = Object.values(matchups);
    if (matchupList.length > 1) {
      const nextRound      = buildNextRound(matchups);
      const firstRealEntry = Object.entries(nextRound).find(([, m]) => m.playerB);
      const firstRealIdx   = firstRealEntry ? Number(firstRealEntry[0]) : 0;
      const firstReal      = firstRealEntry?.[1];
      const queue          = matchupTimerSeconds > 0 && firstReal ? [firstReal.playerA, firstReal.playerB] : null;
      await update(ref(db, `rooms/${roomCode}`), {
        [`bracket/rounds/${roundIndex + 1}`]: nextRound,
        'bracket/currentMatchupIndex':        firstRealIdx,
        'bracket/roundStartedAt':             matchupTimerSeconds > 0 ? Date.now() : null,
        'bracket/votingOpen':                 matchupTimerSeconds === 0,
        'bracket/votingStartedAt':            matchupTimerSeconds === 0 && votingTimerSeconds > 0 ? Date.now() : null,
        'bracket/presenterQueue':             queue,
        'bracket/presenterIndex':             0,
      });
    } else {
      const champion = matchupList[0].winner || matchupList[0].playerA;
      await update(ref(db, `rooms/${roomCode}`), {
        'bracket/champion':       champion,
        'bracket/roundStartedAt': null,
        'bracket/votingOpen':     false,
        'bracket/presenterQueue': null,
        phase:                    'done',
      });
    }
  };

  // ── Watch bracket: advance matchup or round when current is done ───
  useEffect(() => {
    if (!bracket || !isHost) return;
    const { index, matchups } = getCurrentRound(bracket) || {};
    if (!matchups) return;

    const cmi     = bracket.currentMatchupIndex ?? 0;
    const current = matchups[cmi];

    // Current matchup is done when: it's a bye (no playerB) OR it has a winner
    const currentDone = !current?.playerB || !!current?.winner;
    if (!currentDone) return;

    // Find next unplayed real matchup after current
    const nextEntry = findNextRealMatchup(matchups, cmi + 1);
    if (nextEntry) {
      advanceToMatchup(Number(nextEntry[0]), nextEntry[1]);
      return;
    }

    // All real matchups done — check byes too, then advance round
    const allDone = Object.values(matchups).every(m => !m.playerB || !!m.winner);
    if (allDone) advanceRound(index, matchups);
  }, [bracket]);

  // ── Resolve votes for the current matchup only ────────────────────
  useEffect(() => {
    if (!bracket || !isHost || !votingOpen) return;
    const { index, matchups } = getCurrentRound(bracket) || {};
    if (!matchups) return;

    const cmi     = bracket.currentMatchupIndex ?? 0;
    const matchup = matchups[cmi];
    if (!matchup || matchup.winner || !matchup.playerB) return;
    if (!hasAllVoted(matchup.votes, allPlayerIds)) return;

    const winner = getMatchupWinner(matchup.votes, matchup.playerA, matchup.playerB);
    if (winner) {
      update(ref(db, `rooms/${roomCode}/bracket/rounds/${index}/${cmi}`), { winner });
    } else {
      update(ref(db, `rooms/${roomCode}/bracket/rounds/${index}/${cmi}`), {
        votes:           {},
        tiebreakerRound: (matchup.tiebreakerRound || 0) + 1,
      });
    }
  }, [bracket, votingOpen]);

  // ── Presentation countdown ────────────────────────────────────────
  const roundStartedAt = bracket?.roundStartedAt;
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    advancedRef.current = false;
    if (!matchupTimerSeconds || !roundStartedAt || votingOpen) { setTimeLeft(null); return; }
    const tick = () => setTimeLeft(Math.max(0, Math.round(
      (roundStartedAt + matchupTimerSeconds * 1000 - Date.now()) / 1000
    )));
    tick();
    timerRef.current = setInterval(tick, 500);
    return () => clearInterval(timerRef.current);
  }, [roundStartedAt, matchupTimerSeconds, votingOpen]);

  // ── Advance presenter / open voting when presentation timer hits 0 ─
  useEffect(() => {
    if (timeLeft !== 0 || !isHost || !bracket || votingOpen) return;
    if (!roundStartedAt || !matchupTimerSeconds) return;
    if (Date.now() < roundStartedAt + matchupTimerSeconds * 1000 - 1000) return;
    if (advancedRef.current) return;
    advancedRef.current = true;

    if (presenterIndex + 1 < presenterQueue.length) {
      update(ref(db, `rooms/${roomCode}/bracket`), {
        presenterIndex: presenterIndex + 1,
        roundStartedAt: Date.now(),
      });
    } else {
      update(ref(db, `rooms/${roomCode}/bracket`), {
        votingOpen:      true,
        presenterQueue:  null,
        votingStartedAt: votingTimerSeconds > 0 ? Date.now() : null,
      });
    }
  }, [timeLeft, isHost, bracket, votingOpen, presenterIndex, presenterQueue.length, roundStartedAt, matchupTimerSeconds]);

  // ── Voting countdown ──────────────────────────────────────────────
  const votingStartedAt = bracket?.votingStartedAt;
  useEffect(() => {
    if (votingTimerRef.current) clearInterval(votingTimerRef.current);
    votingAdvancedRef.current = false;
    if (!votingTimerSeconds || !votingStartedAt || !votingOpen) { setVotingTimeLeft(null); return; }
    const tick = () => setVotingTimeLeft(Math.max(0, Math.round(
      (votingStartedAt + votingTimerSeconds * 1000 - Date.now()) / 1000
    )));
    tick();
    votingTimerRef.current = setInterval(tick, 500);
    return () => clearInterval(votingTimerRef.current);
  }, [votingStartedAt, votingTimerSeconds, votingOpen]);

  // ── Force-resolve current matchup when voting timer expires ───────
  useEffect(() => {
    if (votingTimeLeft !== 0 || !isHost || !bracket || !votingOpen) return;
    if (!votingStartedAt || !votingTimerSeconds) return;
    if (Date.now() < votingStartedAt + votingTimerSeconds * 1000 - 1000) return;
    if (votingAdvancedRef.current) return;
    votingAdvancedRef.current = true;

    const { index, matchups } = getCurrentRound(bracket) || {};
    if (!matchups) return;
    const cmi     = bracket.currentMatchupIndex ?? 0;
    const matchup = matchups[cmi];
    if (!matchup || matchup.winner || !matchup.playerB) return;

    let winner = getMatchupWinner(matchup.votes, matchup.playerA, matchup.playerB);
    if (!winner) winner = Math.random() < 0.5 ? matchup.playerA : matchup.playerB;
    update(ref(db, `rooms/${roomCode}/bracket/rounds/${index}/${cmi}`), { winner });
  }, [votingTimeLeft, isHost, bracket, votingOpen, votingStartedAt, votingTimerSeconds]);

  if (!bracket) return <div className="screen"><p>Loading bracket...</p></div>;

  const isDiscussing    = matchupTimerSeconds > 0 && !votingOpen && !bracket.champion;
  const presenterName   = players?.[currentPresenter]?.name;
  const timerColor      = timeLeft === null ? null
    : timeLeft > matchupTimerSeconds * 0.5  ? 'var(--success)'
    : timeLeft > matchupTimerSeconds * 0.25 ? 'var(--warning)' : '#e05555';
  const votingTimerColor = votingTimeLeft === null ? null
    : votingTimeLeft > votingTimerSeconds * 0.5  ? 'var(--success)'
    : votingTimeLeft > votingTimerSeconds * 0.25 ? 'var(--warning)' : '#e05555';

  const { index: currentRoundIndex, matchups: currentMatchups } = getCurrentRound(bracket) || {};
  const currentMatchupIndex = bracket.currentMatchupIndex ?? 0;
  const activeMatchup       = currentMatchups?.[currentMatchupIndex];

  // ── End presentation early (presenter's phone) ────────────────────
  const isPresenting = currentPresenter === playerId;
  const handleEndPresentation = async () => {
    if (presenterIndex + 1 < presenterQueue.length) {
      await update(ref(db, `rooms/${roomCode}/bracket`), {
        presenterIndex: presenterIndex + 1,
        roundStartedAt: Date.now(),
      });
    } else {
      await update(ref(db, `rooms/${roomCode}/bracket`), {
        votingOpen:      true,
        presenterQueue:  null,
        votingStartedAt: votingTimerSeconds > 0 ? Date.now() : null,
      });
    }
  };

  // ── HOST view ─────────────────────────────────────────────────────
  if (isHost) {
    return (
      <div className="screen--top" style={{ gap: '10px' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--warning)', margin: 0, textAlign: 'center' }}>
          Bracket — <span style={{ color: 'var(--carolina)' }}>{room?.winningTheme}</span>
        </h2>

        {bracket.champion ? (
          <h1 className="champion-banner">Champion: {players?.[bracket.champion]?.name}</h1>
        ) : (
          <>
            {activeMatchup?.playerB && (
              <CurrentMatchupDisplay
                matchup={activeMatchup}
                players={players}
                picks={picks}
                isDiscussing={isDiscussing}
                presenterName={presenterName}
                presenterIndex={presenterIndex}
                presenterQueueLength={presenterQueue.length}
                timeLeft={timeLeft}
                timerColor={timerColor}
                votingOpen={votingOpen}
                votingTimeLeft={votingTimeLeft}
                votingTimerColor={votingTimerColor}
              />
            )}
            <div style={{ width: '100%', flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto', paddingBottom: '8px' }}>
              <TournamentBracket
                bracket={bracket}
                players={players}
                currentRoundIndex={currentRoundIndex}
                currentMatchupIndex={currentMatchupIndex}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // ── PLAYER view ───────────────────────────────────────────────────
  return (
    <div className="screen" style={{ justifyContent: 'flex-start' }}>
      <h2 style={{ fontSize: '1.4rem', color: 'var(--warning)', margin: 0, textAlign: 'center' }}>
        Bracket — <span style={{ color: 'var(--carolina)' }}>{room?.winningTheme}</span>
      </h2>

      {bracket.champion && (
        <h1 className="champion-banner">{players?.[bracket.champion]?.name} Wins!</h1>
      )}

      {!bracket.champion && isDiscussing && (
        isPresenting ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '8px 0' }}>
            <p style={{ margin: 0, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: 'var(--carolina)', letterSpacing: '2px', textAlign: 'center' }}>
              YOU are presenting!
            </p>
            {timeLeft !== null && (
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem', color: timerColor, lineHeight: 1 }}>
                {timeLeft}s
              </span>
            )}
            <p className="text-dim" style={{ margin: 0, textAlign: 'center', fontSize: '0.9rem' }}>
              Make your case — sell your team!
            </p>
            <button className="btn btn--secondary" onClick={handleEndPresentation}>Done Presenting</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              {presenterName && (
                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', textAlign: 'center' }}>
                  <span style={{ color: 'var(--carolina)' }}>{presenterName}</span>
                  <span style={{ color: 'var(--text-dim)' }}> is presenting</span>
                </p>
              )}
              {timeLeft !== null && (
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: timerColor }}>{timeLeft}s</span>
              )}
            </div>
            <p className="text-dim" style={{ margin: 0, textAlign: 'center', fontSize: '0.9rem' }}>
              Listen up — voting opens after all presentations.
            </p>
          </div>
        )
      )}

      {!bracket.champion && votingOpen && activeMatchup?.playerB && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <p style={{ margin: 0, textAlign: 'center', color: 'var(--success)', fontWeight: 700 }}>Voting is open!</p>
            {votingTimeLeft !== null && (
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.6rem', color: votingTimerColor }}>{votingTimeLeft}s</span>
            )}
          </div>
          <MatchupCard
            roomCode={roomCode}
            playerId={playerId}
            players={players}
            picks={null}
            matchup={activeMatchup}
            roundIndex={currentRoundIndex}
            matchupIndex={currentMatchupIndex}
            votingOpen={votingOpen}
            currentPresenterId={currentPresenter}
            isHost={false}
          />
        </>
      )}
    </div>
  );
}
