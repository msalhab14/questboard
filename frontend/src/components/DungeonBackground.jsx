import React, { useEffect, useRef } from 'react';

const TORCH_X = 58; // px from edge — matches .torch-wrap left/right
const TORCH_Y = 70; // px from top — roughly centre of flame

export default function DungeonBackground() {
  const canvasRef = useRef(null);
  const partsRef  = useRef([]);
  const animIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function spawnEmbers() {
      const w = canvas.width;
      [[TORCH_X, TORCH_Y], [w - TORCH_X, TORCH_Y]].forEach(([tx, ty]) => {
        if (Math.random() < 0.14) {
          partsRef.current.push({
            x:     tx + (Math.random() - 0.5) * 14,
            y:     ty,
            vx:    (Math.random() - 0.5) * 0.7,
            vy:    -(0.8 + Math.random() * 1.2),
            life:  1.0,
            decay: 0.018 + Math.random() * 0.02,
            size:  1.2 + Math.random() * 1.5,
          });
        }
      });
    }

    function drawFrame() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Deep dungeon vignette — nearly black edges
      const cx = w / 2, cy = h / 2;
      const r  = Math.max(w, h) * 0.68;
      const vignette = ctx.createRadialGradient(cx, cy, r * 0.08, cx, cy, r);
      vignette.addColorStop(0,   'rgba(6,5,10,0)');
      vignette.addColorStop(0.5, 'rgba(6,5,10,0.45)');
      vignette.addColorStop(0.8, 'rgba(4,3,8,0.78)');
      vignette.addColorStop(1,   'rgba(2,1,5,0.97)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // Hard side wall darkness
      const wallW = 160;
      ['left', 'right'].forEach(side => {
        const g = ctx.createLinearGradient(
          side === 'left' ? 0 : w, 0,
          side === 'left' ? wallW : w - wallW, 0
        );
        g.addColorStop(0, 'rgba(2,1,5,0.92)');
        g.addColorStop(1, 'rgba(2,1,5,0)');
        ctx.fillStyle = g;
        ctx.fillRect(side === 'left' ? 0 : w - wallW, 0, wallW, h);
      });

      // Torch ambient glow
      [[TORCH_X, TORCH_Y], [w - TORCH_X, TORCH_Y]].forEach(([tx, ty]) => {
        const gr = ctx.createRadialGradient(tx, ty, 0, tx, ty, Math.min(w, h) * 0.42);
        gr.addColorStop(0, 'rgba(255,140,30,0.08)');
        gr.addColorStop(0.35, 'rgba(200,90,10,0.03)');
        gr.addColorStop(1, 'rgba(255,140,30,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, w, h);
      });

      // Ember particles
      spawnEmbers();
      const parts = partsRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x   += p.vx + (Math.random() - 0.5) * 0.18;
        p.y   += p.vy;
        p.vy  *= 0.98;
        p.life -= p.decay;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * 0.8;
        ctx.fillStyle   = p.life > 0.55 ? '#ffd060' : p.life > 0.25 ? '#ff8020' : '#cc3000';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * Math.sqrt(p.life), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animIdRef.current = requestAnimationFrame(drawFrame);
    }

    resize();
    drawFrame();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animIdRef.current);
    };
  }, []);

  return (
    <>
      {/* Solid near-black dungeon base */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#06050a',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      {/* Stone texture — very dark, barely visible, just enough to feel like stone */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: "url('/sprites/dungeon_floor.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: '384px 192px',
        imageRendering: 'pixelated',
        opacity: 0.18,
        filter: 'brightness(0.5) saturate(0.4)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      {/* Canvas for vignette, torch glow, and ember particles */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
