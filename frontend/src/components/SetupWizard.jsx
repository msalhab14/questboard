import React, { useState } from 'react';
import { ALL_CHORES, REWARDS } from '../data';
import TileSprite from './TileSprite';

const CLASSES = [
  { id: 'warrior', label: 'Warrior', tile: 87 },
  { id: 'mage',    label: 'Mage',    tile: 84 },
  { id: 'witch',   label: 'Witch',   tile: 99 },
  { id: 'rogue',   label: 'Rogue',   tile: 96 },
  { id: 'paladin', label: 'Paladin', tile: 88 },
  { id: 'ranger',  label: 'Ranger',  tile: 82 },
];

const PLAYER_COLORS = [
  { color: '#1a3a5c', textColor: '#7ab8f5' },
  { color: '#4a1a2e', textColor: '#f5a0c0' },
  { color: '#1e3a10', textColor: '#8dc447' },
  { color: '#2d1a4a', textColor: '#c4a0f5' },
  { color: '#3a2a0a', textColor: '#f5c870' },
  { color: '#0a3a3a', textColor: '#70f5e8' },
];

function makePlayer(idx) {
  return {
    id: `player_${idx}`,
    name: '',
    mode: idx === 0 ? 'adults' : 'adults',
    class: CLASSES[idx % CLASSES.length].id,
    color: PLAYER_COLORS[idx % PLAYER_COLORS.length].color,
    textColor: PLAYER_COLORS[idx % PLAYER_COLORS.length].textColor,
  };
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(5,5,18,0.97)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, fontFamily: 'inherit',
  },
  card: {
    background: '#13132a', border: '2px solid #3a3a6e',
    borderRadius: 4, width: '100%', maxWidth: 560,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
  },
  header: {
    padding: '16px 20px 12px', borderBottom: '1px solid #2a2a4a',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { color: '#f5c870', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  stepIndicator: { color: '#5a5a8a', fontSize: 11 },
  body: { flex: 1, overflowY: 'auto', padding: '20px' },
  footer: {
    padding: '12px 20px', borderTop: '1px solid #2a2a4a',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  btn: {
    background: '#2a2a4e', border: '1px solid #4a4a7e', color: '#c8d0e0',
    padding: '8px 20px', cursor: 'pointer', fontSize: 12, letterSpacing: 1,
  },
  btnPrimary: {
    background: '#4a3a0a', border: '1px solid #f5c870', color: '#f5c870',
    padding: '8px 20px', cursor: 'pointer', fontSize: 12, letterSpacing: 1,
  },
  btnDisabled: {
    background: '#1a1a2e', border: '1px solid #3a3a5e', color: '#4a4a7a',
    padding: '8px 20px', cursor: 'default', fontSize: 12, letterSpacing: 1,
  },
  input: {
    background: '#0d0d20', border: '1px solid #3a3a6e', color: '#c8d0e0',
    padding: '8px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box',
  },
  label: { color: '#8a8aaa', fontSize: 11, marginBottom: 6, display: 'block', letterSpacing: 1 },
  h2: { color: '#c8d0e0', fontSize: 16, margin: '0 0 16px', fontWeight: 'bold' },
  p: { color: '#7a7a9a', fontSize: 12, lineHeight: 1.6, margin: '0 0 16px' },
};

// ── Step 0: Welcome ───────────────────────────────────────────────────────────
function StepWelcome({ onNext }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>⚔</div>
      <div style={{ color: '#f5c870', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>QUESTBOARD</div>
      <p style={{ ...S.p, maxWidth: 360, margin: '0 auto 24px' }}>
        Turn household chores into a pixel art RPG adventure. Each family member gets a hero and fights a monster every day — complete chores to deal damage and earn gold.
      </p>
      <button style={S.btnPrimary} onClick={onNext}>Start Setup →</button>
    </div>
  );
}

// ── Step 1: Player count ──────────────────────────────────────────────────────
function StepPlayerCount({ onSelect }) {
  return (
    <div>
      <div style={S.h2}>How many heroes?</div>
      <p style={S.p}>Each player gets their own character, monster, and gold.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <button
            key={n}
            style={{ ...S.btnPrimary, flex: '1 1 60px', fontSize: 20, padding: '16px 8px' }}
            onClick={() => onSelect(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Per-player setup ──────────────────────────────────────────────────
function StepPlayerSetup({ player, playerIdx, total, onChange, onNext, onBack, onDone }) {
  const canAdvance = player.name.trim().length > 0;

  return (
    <div>
      <div style={S.h2}>
        Hero {playerIdx + 1} of {total}
        {player.name && <span style={{ color: '#f5c870' }}> — {player.name}</span>}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>NAME</label>
        <input
          style={S.input}
          placeholder="Enter a name…"
          value={player.name}
          onChange={e => onChange('name', e.target.value)}
          autoFocus
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>DIFFICULTY</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { val: 'adults', label: 'Hard', desc: 'Adults' },
            { val: 'kids',   label: 'Easy', desc: 'Kids'   },
          ].map(opt => (
            <button
              key={opt.val}
              style={{
                ...(player.mode === opt.val ? S.btnPrimary : S.btn),
                flex: 1, padding: '10px 8px',
              }}
              onClick={() => onChange('mode', opt.val)}
            >
              <div style={{ fontSize: 14, fontWeight: 'bold' }}>{opt.label}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>CLASS</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CLASSES.map(cls => (
            <button
              key={cls.id}
              style={{
                ...(player.class === cls.id ? S.btnPrimary : S.btn),
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '10px 12px', gap: 4, flex: '1 1 70px',
              }}
              onClick={() => onChange('class', cls.id)}
            >
              <TileSprite tile={cls.tile} scale={3} />
              <span style={{ fontSize: 10 }}>{cls.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>COLOR</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {PLAYER_COLORS.map((c, i) => (
            <button
              key={i}
              style={{
                width: 36, height: 36, background: c.color,
                border: player.color === c.color ? `2px solid ${c.textColor}` : '2px solid #3a3a6e',
                cursor: 'pointer',
              }}
              onClick={() => { onChange('color', c.color); onChange('textColor', c.textColor); }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
        <button style={S.btn} onClick={onBack}>← Back</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {playerIdx > 0 && playerIdx + 1 < total && (
            <button style={S.btn} onClick={onDone}>Done adding heroes</button>
          )}
          <button
            style={canAdvance ? S.btnPrimary : S.btnDisabled}
            onClick={canAdvance ? onNext : undefined}
          >
            {playerIdx + 1 < total ? 'Next Hero →' : 'Choose Chores →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Chore selection ───────────────────────────────────────────────────
const WHO_CYCLE = ['all', 'adults', 'kids'];
const WHO_LABEL = { all: 'everyone', adults: 'adults', kids: 'kids' };

function StepChoreSelect({ players, enabledChores, onToggle, choreOverrides, onOverride, customChores, onAddCustom, onBack, onLaunch }) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '⭐', pts: 2, who: 'all', freq: 'daily' });

  const modes = new Set(players.map(p => p.mode));
  const daily   = ALL_CHORES.filter(c => c.freq === 'daily');
  const weekly  = ALL_CHORES.filter(c => c.freq === 'weekly');
  const monthly = ALL_CHORES.filter(c => c.freq === 'monthly');

  function isRelevant(who) {
    if (who === 'all') return true;
    return modes.has(who);
  }

  function submitCustom() {
    if (!form.name.trim()) return;
    onAddCustom({ ...form, id: `custom_${Date.now()}`, name: form.name.trim() });
    setForm({ name: '', icon: '⭐', pts: 2, who: 'all', freq: 'daily' });
    setAddingCustom(false);
  }

  function ChoreRow({ chore }) {
    const ov = choreOverrides[chore.id] || {};
    const who = ov.who ?? chore.who;
    const pts = ov.pts ?? chore.pts;
    const dim = !isRelevant(who);

    function cycleWho(e) {
      e.stopPropagation();
      const next = WHO_CYCLE[(WHO_CYCLE.indexOf(who) + 1) % WHO_CYCLE.length];
      onOverride(chore.id, { ...ov, who: next });
    }

    function cyclePts(e) {
      e.stopPropagation();
      onOverride(chore.id, { ...ov, pts: pts >= 6 ? 1 : pts + 1 });
    }

    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
          borderBottom: '1px solid #1e1e3a', opacity: dim ? 0.4 : 1,
          cursor: 'pointer',
        }}
        onClick={() => onToggle(chore.id)}
      >
        <input
          type="checkbox"
          checked={enabledChores.has(chore.id)}
          onChange={() => {}}
          style={{ accentColor: '#f5c870', width: 14, height: 14, pointerEvents: 'none' }}
        />
        <span style={{ fontSize: 16 }}>{chore.icon}</span>
        <span style={{ color: '#c8d0e0', fontSize: 12, flex: 1 }}>{chore.name}</span>
        <button
          onClick={cycleWho}
          style={{ background: 'none', border: '1px solid #3a3a5e', color: '#7ab8f5', fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}
          title="Click to change who this applies to"
        >
          {WHO_LABEL[who]}
        </button>
        <button
          onClick={cyclePts}
          style={{ background: 'none', border: '1px solid #3a3a5e', color: '#f5c870', fontSize: 10, padding: '2px 6px', cursor: 'pointer', minWidth: 36 }}
          title="Click to change point value"
        >
          {pts}pts
        </button>
      </div>
    );
  }

  function Section({ title, chores }) {
    const allOn = chores.every(c => enabledChores.has(c.id));
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#f5c870', fontSize: 11, letterSpacing: 1 }}>{title}</span>
          <button
            style={{ ...S.btn, padding: '2px 8px', fontSize: 10 }}
            onClick={() => {
              if (allOn) chores.filter(c => enabledChores.has(c.id)).forEach(c => onToggle(c.id));
              else chores.filter(c => !enabledChores.has(c.id)).forEach(c => onToggle(c.id));
            }}
          >
            {allOn ? 'none' : 'all'}
          </button>
        </div>
        {chores.map(c => <ChoreRow key={c.id} chore={c} />)}
      </div>
    );
  }

  return (
    <div>
      <div style={S.h2}>Choose your quests</div>
      <p style={S.p}>Select the chores that apply to your family. Dimmed chores don't match any player's difficulty setting.</p>

      <Section title="DAILY" chores={daily} />
      <Section title="WEEKLY" chores={weekly} />
      <Section title="MONTHLY" chores={monthly} />

      {customChores.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <span style={{ color: '#f5c870', fontSize: 11, letterSpacing: 1 }}>CUSTOM</span>
          {customChores.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #1e1e3a' }}>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span style={{ color: '#c8d0e0', fontSize: 12, flex: 1 }}>{c.name}</span>
              <span style={{ color: '#5a5a7a', fontSize: 10 }}>{whoLabel(c.who)} · {c.freq}</span>
            </div>
          ))}
        </div>
      )}

      {addingCustom ? (
        <div style={{ background: '#0d0d20', border: '1px solid #3a3a6e', padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input style={{ ...S.input, flex: 3 }} placeholder="Chore name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <input style={{ ...S.input, flex: 1, textAlign: 'center' }} placeholder="Icon" value={form.icon} maxLength={2} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={{ ...S.input, flex: 1 }} value={form.pts} onChange={e => setForm(f => ({ ...f, pts: +e.target.value }))}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} pts</option>)}
            </select>
            <select style={{ ...S.input, flex: 1 }} value={form.who} onChange={e => setForm(f => ({ ...f, who: e.target.value }))}>
              <option value="all">Everyone</option>
              <option value="adults">Adults</option>
              <option value="kids">Kids</option>
            </select>
            <select style={{ ...S.input, flex: 1 }} value={form.freq} onChange={e => setForm(f => ({ ...f, freq: e.target.value }))}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button style={S.btnPrimary} onClick={submitCustom}>Add</button>
            <button style={S.btn} onClick={() => setAddingCustom(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button style={{ ...S.btn, width: '100%', marginBottom: 16 }} onClick={() => setAddingCustom(true)}>
          + Add custom chore
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <button style={S.btn} onClick={onBack}>← Back</button>
        <button style={S.btnPrimary} onClick={onNext}>Next: Rewards →</button>
      </div>
    </div>
  );
}

// ── Step 4: Reward selection ──────────────────────────────────────────────────
const REWARD_TIERS = [
  { label: 'QUICK',  max: 15  },
  { label: 'MID',    max: 30  },
  { label: 'BIG',    max: 65  },
  { label: 'DREAM',  max: 999 },
];

function StepRewardSelect({ players, enabledRewards, onToggle, rewardOverrides, onOverride, onBack, onLaunch }) {
  const modes = new Set(players.map(p => p.mode));

  function isRelevant(who) {
    if (who === 'all') return true;
    return modes.has(who);
  }

  function RewardRow({ reward }) {
    const ov = rewardOverrides[reward.id] || {};
    const who = ov.who ?? reward.who;
    const cost = ov.cost ?? reward.cost;
    const dim = !isRelevant(who);

    function cycleWho(e) {
      e.stopPropagation();
      const next = WHO_CYCLE[(WHO_CYCLE.indexOf(who) + 1) % WHO_CYCLE.length];
      onOverride(reward.id, { ...ov, who: next });
    }

    function changeCost(e) {
      e.stopPropagation();
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val > 0) onOverride(reward.id, { ...ov, cost: val });
    }

    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
          borderBottom: '1px solid #1e1e3a', opacity: dim ? 0.4 : 1, cursor: 'pointer',
        }}
        onClick={() => onToggle(reward.id)}
      >
        <input
          type="checkbox"
          checked={enabledRewards.has(reward.id)}
          onChange={() => {}}
          style={{ accentColor: '#f5c870', width: 14, height: 14, pointerEvents: 'none' }}
        />
        <span style={{ fontSize: 16 }}>{reward.icon}</span>
        <span style={{ color: '#c8d0e0', fontSize: 12, flex: 1 }}>{reward.name}</span>
        <button
          onClick={cycleWho}
          style={{ background: 'none', border: '1px solid #3a3a5e', color: '#7ab8f5', fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}
        >
          {WHO_LABEL[who]}
        </button>
        <input
          type="number"
          value={cost}
          min={1} max={999}
          onClick={e => e.stopPropagation()}
          onChange={changeCost}
          style={{ ...S.input, width: 52, padding: '2px 4px', fontSize: 11, textAlign: 'center', color: '#f5c870' }}
        />
        <span style={{ color: '#7a6a3a', fontSize: 10 }}>gold</span>
      </div>
    );
  }

  function TierSection({ label, max, prev }) {
    const tier = REWARDS.filter(r => r.cost <= max && r.cost > (prev || 0));
    if (!tier.length) return null;
    const allOn = tier.every(r => enabledRewards.has(r.id));
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#f5c870', fontSize: 11, letterSpacing: 1 }}>{label}</span>
          <button
            style={{ ...S.btn, padding: '2px 8px', fontSize: 10 }}
            onClick={() => {
              if (allOn) tier.filter(r => enabledRewards.has(r.id)).forEach(r => onToggle(r.id));
              else tier.filter(r => !enabledRewards.has(r.id)).forEach(r => onToggle(r.id));
            }}
          >
            {allOn ? 'none' : 'all'}
          </button>
        </div>
        {tier.map(r => <RewardRow key={r.id} reward={r} />)}
      </div>
    );
  }

  return (
    <div>
      <div style={S.h2}>Choose your rewards</div>
      <p style={S.p}>Select rewards available to your family. Click the gold cost to edit it — set prices that feel right for your household.</p>
      {REWARD_TIERS.map((t, i) => (
        <TierSection key={t.label} label={t.label} max={t.max} prev={REWARD_TIERS[i - 1]?.max} />
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <button style={S.btn} onClick={onBack}>← Back</button>
        <button style={S.btnPrimary} onClick={onLaunch}>Launch the Adventure! ⚔</button>
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [players, setPlayers] = useState([makePlayer(0), makePlayer(1)]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [enabledChores, setEnabledChores] = useState(() => new Set(ALL_CHORES.map(c => c.id)));
  const [choreOverrides, setChoreOverrides] = useState({});
  const [customChores, setCustomChores] = useState([]);
  const [enabledRewards, setEnabledRewards] = useState(() => new Set(REWARDS.map(r => r.id)));
  const [rewardOverrides, setRewardOverrides] = useState({});
  const [launching, setLaunching] = useState(false);

  function handlePlayerCount(n) {
    setPlayers(Array.from({ length: n }, (_, i) => makePlayer(i)));
    setPlayerIdx(0);
    setStep(2);
  }

  function updatePlayer(key, val) {
    setPlayers(prev => prev.map((p, i) => i === playerIdx ? { ...p, [key]: val } : p));
  }

  function nextPlayer() {
    if (playerIdx + 1 < players.length) {
      setPlayerIdx(playerIdx + 1);
    } else {
      setStep(3);
    }
  }

  function doneAddingPlayers() {
    setPlayers(prev => prev.slice(0, playerIdx + 1));
    setStep(3);
  }

  function prevPlayer() {
    if (playerIdx > 0) {
      setPlayerIdx(playerIdx - 1);
    } else {
      setStep(1);
    }
  }

  function toggleChore(id) {
    setEnabledChores(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function addCustomChore(chore) {
    setCustomChores(prev => [...prev, chore]);
  }

  function overrideChore(id, override) {
    setChoreOverrides(prev => ({ ...prev, [id]: override }));
  }

  function toggleReward(id) {
    setEnabledRewards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function overrideReward(id, override) {
    setRewardOverrides(prev => ({ ...prev, [id]: override }));
  }

  async function handleLaunch() {
    setLaunching(true);
    const config = {
      players,
      enabledChores: [...enabledChores],
      choreOverrides,
      customChores,
      enabledRewards: [...enabledRewards],
      rewardOverrides,
    };
    await onComplete(config);
  }

  const stepNum = step === 2 ? 3 : step === 4 ? 5 : step + 1;
  const totalSteps = 5;

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        {step > 0 && (
          <div style={S.header}>
            <span style={S.title}>⚔ QUESTBOARD SETUP</span>
            <span style={S.stepIndicator}>Step {stepNum} of {totalSteps}</span>
          </div>
        )}

        <div style={S.body}>
          {launching ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#c8d0e0' }}>
              Preparing your adventure…
            </div>
          ) : step === 0 ? (
            <StepWelcome onNext={() => setStep(1)} />
          ) : step === 1 ? (
            <StepPlayerCount onSelect={handlePlayerCount} />
          ) : step === 2 ? (
            <StepPlayerSetup
              player={players[playerIdx]}
              playerIdx={playerIdx}
              total={players.length}
              onChange={updatePlayer}
              onNext={nextPlayer}
              onBack={prevPlayer}
              onDone={doneAddingPlayers}
            />
          ) : step === 3 ? (
            <StepChoreSelect
              players={players}
              enabledChores={enabledChores}
              onToggle={toggleChore}
              choreOverrides={choreOverrides}
              onOverride={overrideChore}
              customChores={customChores}
              onAddCustom={addCustomChore}
              onBack={() => { setPlayerIdx(players.length - 1); setStep(2); }}
              onNext={() => setStep(4)}
            />
          ) : (
            <StepRewardSelect
              players={players}
              enabledRewards={enabledRewards}
              onToggle={toggleReward}
              rewardOverrides={rewardOverrides}
              onOverride={overrideReward}
              onBack={() => setStep(3)}
              onLaunch={handleLaunch}
            />
          )}
        </div>

        {step === 1 && (
          <div style={S.footer}>
            <button style={S.btn} onClick={() => setStep(0)}>← Back</button>
            <span style={{ color: '#5a5a8a', fontSize: 11 }}>tap a number above</span>
          </div>
        )}
      </div>
    </div>
  );
}
