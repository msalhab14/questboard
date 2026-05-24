import React, { useState } from 'react';
import TileSprite from './TileSprite';

const TYPE_TILE = {
  chore:   118,
  gold:     55,
  penalty: 123,
  reward:   41,
};

export default function HistoryTab({ history, players }) {
  const [filter, setFilter] = useState(null);

  const all = [...history].reverse().slice(0, 100);
  const hist = filter ? all.filter(h => h.player === filter) : all.slice(0, 40);

  return (
    <>
      <div className="section-label">Recent activity</div>
      <div className="history-filters">
        <button
          className={`history-filter-btn${filter === null ? ' active' : ''}`}
          onClick={() => setFilter(null)}
        >
          All
        </button>
        {(players ?? []).map(p => (
          <button
            key={p.id}
            className={`history-filter-btn${filter === p.name ? ' active' : ''}`}
            onClick={() => setFilter(prev => prev === p.name ? null : p.name)}
          >
            {p.name}
          </button>
        ))}
      </div>
      {hist.length === 0 ? (
        <div className="empty">No activity yet.</div>
      ) : (
        <div className="redeemed-list">
          {hist.map((h, i) => {
            const tile = TYPE_TILE[h.type] ?? 118;
            const action = h.type === 'chore' ? 'completed' : h.type === 'penalty' ? 'attacked by' : h.type === 'gold' ? 'slew' : 'redeemed';
            const pts = h.type === 'chore' ? `(+${h.pts} dmg)` : h.type === 'penalty' ? `(-${h.pts} gold)` : h.type === 'gold' ? `(+${h.pts} gold)` : `(-${h.pts} gold)`;
            return (
              <div key={i} className="redeemed-item">
                <TileSprite tile={tile} display={14} />
                <span>
                  <span className="redeemed-name">{h.player}</span> {action}{' '}
                  <span className="redeemed-name">{h.name}</span> {pts}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
