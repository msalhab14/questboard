import React, { useEffect, useRef } from 'react';

const NEAR_IMG_SIZE = 224; // near.png original px (square)

// Scroll distances = exact multiples of tile-width at 1080px for seamless looping
const KEYFRAMES = `
  @keyframes scroll-back       { from{background-position-x:0} to{background-position-x:-15400px} }
  @keyframes scroll-far        { from{background-position-x:0} to{background-position-x:-15400px} }
  @keyframes scroll-middle     { from{background-position-x:0} to{background-position-x:-38600px} }
  @keyframes scroll-near       { from{background-position-x:0} to{background-position-x:-108000px} }
  @keyframes scroll-foreground { from{background-position-x:0} to{background-position-x:-108000px} }
`;

const LAYERS = [
  { name: 'back',       duration: '2400s', opacity: 1.00, filter: 'hue-rotate(150deg) saturate(0.9) brightness(0.30)' },
  { name: 'far',        duration: '1060s', opacity: 1.00, filter: 'hue-rotate(150deg) saturate(0.9) brightness(0.30)' },
  { name: 'middle',     duration: '1375s', opacity: 1.00, filter: 'hue-rotate(150deg) saturate(0.9) brightness(0.35)' },
  { name: 'near',       duration: '2070s', opacity: 1.00, filter: 'saturate(0.8) brightness(0.38)'                    },
  { name: 'foreground', duration: '1225s', opacity: 1.00, filter: 'hue-rotate(150deg) saturate(0.4) brightness(0.10)' },
];

// Derive near scroll speed from the LAYERS entry so they always stay in sync
const NEAR_SCROLL_PX = 108000;
const NEAR_SPEED     = NEAR_SCROLL_PX / parseInt(LAYERS.find(l => l.name === 'near').duration);

const TORCH_CX_ORIG   = 146;
const TORCH_TY_ORIG   =  86;
const TORCH_SPRITE_PX = 32;
const TORCH_FRAMES    = 4;
const TORCH_FPS       = 6;

const APP_TORCH_Y = 70;
const APP_TORCH_DX = 58; // distance from each edge

function layerStyle({ name, duration, opacity, filter }) {
  return {
    position: 'fixed', inset: 0,
    backgroundImage: `url('/sprites/layers/${name}.png')`,
    backgroundRepeat: 'repeat-x',
    backgroundSize: 'auto 100%',
    backgroundPosition: '0 0',
    imageRendering: 'pixelated',
    filter, opacity,
    animation: `scroll-${name} ${duration} linear infinite`,
    zIndex: 0, pointerEvents: 'none',
  };
}

export default function DungeonBackground() {
  const torchRef = useRef(null);
  const fxRef    = useRef(null);
  const stateRef = useRef({
    parts: [], rafId: null, torchImg: null, startTime: null,
    // Cached FX gradients — rebuilt on resize, reused every frame
    vignette: null, wallL: null, wallR: null, glowL: null, glowR: null,
  });

  useEffect(() => {
    const s      = stateRef.current;
    const tCanvas = torchRef.current;
    const fCanvas = fxRef.current;
    const tCtx    = tCanvas.getContext('2d');
    const fCtx    = fCanvas.getContext('2d');

    function buildGradients() {
      const w = fCanvas.width;
      const h = fCanvas.height;
      const cx = w / 2, cy = h / 2;
      const r  = Math.max(w, h) * 0.68;

      const vig = fCtx.createRadialGradient(cx, cy, r * 0.08, cx, cy, r);
      vig.addColorStop(0,   'rgba(6,5,10,0)');
      vig.addColorStop(0.5, 'rgba(6,5,10,0.45)');
      vig.addColorStop(0.8, 'rgba(4,3,8,0.78)');
      vig.addColorStop(1,   'rgba(2,1,5,0.97)');
      s.vignette = vig;

      const wallW = 160;
      const gL = fCtx.createLinearGradient(0, 0, wallW, 0);
      gL.addColorStop(0, 'rgba(2,1,5,0.92)'); gL.addColorStop(1, 'rgba(2,1,5,0)');
      s.wallL = { g: gL, x: 0 };

      const gR = fCtx.createLinearGradient(w, 0, w - wallW, 0);
      gR.addColorStop(0, 'rgba(2,1,5,0.92)'); gR.addColorStop(1, 'rgba(2,1,5,0)');
      s.wallR = { g: gR, x: w - wallW };

      const glowR = Math.min(w, h) * 0.42;
      const gGL = fCtx.createRadialGradient(APP_TORCH_DX, APP_TORCH_Y, 0, APP_TORCH_DX, APP_TORCH_Y, glowR);
      gGL.addColorStop(0, 'rgba(255,140,30,0.08)'); gGL.addColorStop(0.35, 'rgba(200,90,10,0.03)'); gGL.addColorStop(1, 'rgba(255,140,30,0)');
      s.glowL = gGL;

      const rxT = w - APP_TORCH_DX;
      const gGR = fCtx.createRadialGradient(rxT, APP_TORCH_Y, 0, rxT, APP_TORCH_Y, glowR);
      gGR.addColorStop(0, 'rgba(255,140,30,0.08)'); gGR.addColorStop(0.35, 'rgba(200,90,10,0.03)'); gGR.addColorStop(1, 'rgba(255,140,30,0)');
      s.glowR = gGR;

      s.wallW = wallW;
    }

    function resize() {
      tCanvas.width = fCanvas.width  = window.innerWidth;
      tCanvas.height = fCanvas.height = window.innerHeight;
      buildGradients();
    }

    function draw(ts) {
      if (!s.startTime) s.startTime = ts;
      const elapsed = (ts - s.startTime) / 1000;
      const w = fCanvas.width;
      const h = fCanvas.height;

      // ── Torch canvas ──────────────────────────────────────────────────
      tCtx.imageSmoothingEnabled = false; // must re-set each frame; resize() resets context state
      tCtx.clearRect(0, 0, w, h);

      if (s.torchImg) {
        const scale    = h / NEAR_IMG_SIZE;
        const tileW    = NEAR_IMG_SIZE * scale; // = h (square asset)
        const offset   = (elapsed * NEAR_SPEED) % tileW;
        const frameIdx = Math.floor(elapsed * TORCH_FPS) % TORCH_FRAMES;
        const dw       = TORCH_SPRITE_PX * scale;
        const dh       = TORCH_SPRITE_PX * scale;
        const tx       = TORCH_CX_ORIG * scale - dw / 2;
        const ty       = TORCH_TY_ORIG * scale;
        for (let n = -1; n <= Math.ceil(w / tileW) + 1; n++) {
          tCtx.drawImage(s.torchImg, frameIdx * 32, 0, 32, 32,
            Math.floor(n * tileW + tx - offset), Math.floor(ty),
            Math.ceil(dw), Math.ceil(dh));
        }
      }

      // ── FX canvas (vignette + embers) — uses cached gradients ─────────
      fCtx.clearRect(0, 0, w, h);

      if (s.vignette) {
        fCtx.fillStyle = s.vignette;  fCtx.fillRect(0, 0, w, h);
        fCtx.fillStyle = s.wallL.g;   fCtx.fillRect(s.wallL.x, 0, s.wallW, h);
        fCtx.fillStyle = s.wallR.g;   fCtx.fillRect(s.wallR.x, 0, s.wallW, h);
        fCtx.fillStyle = s.glowL;     fCtx.fillRect(0, 0, w, h);
        fCtx.fillStyle = s.glowR;     fCtx.fillRect(0, 0, w, h);
      }

      // Embers
      const torchXL = APP_TORCH_DX;
      const torchXR = w - APP_TORCH_DX;
      for (const torchX of [torchXL, torchXR]) {
        if (Math.random() < 0.14) {
          s.parts.push({
            x: torchX + (Math.random() - 0.5) * 14, y: APP_TORCH_Y,
            vx: (Math.random() - 0.5) * 0.7,
            vy: -(0.8 + Math.random() * 1.2),
            life: 1.0,
            decay: 0.018 + Math.random() * 0.02,
            size: 1.2 + Math.random() * 1.5,
          });
        }
      }
      for (let i = s.parts.length - 1; i >= 0; i--) {
        const p = s.parts[i];
        p.x += p.vx + (Math.random() - 0.5) * 0.18;
        p.y += p.vy;
        p.vy *= 0.98;
        p.life -= p.decay;
        if (p.life <= 0) { s.parts.splice(i, 1); continue; }
        fCtx.globalAlpha = p.life * 0.8;
        fCtx.fillStyle   = p.life > 0.55 ? '#ffd060' : p.life > 0.25 ? '#ff8020' : '#cc3000';
        fCtx.beginPath();
        fCtx.arc(p.x, p.y, p.size * Math.sqrt(p.life), 0, Math.PI * 2);
        fCtx.fill();
      }
      fCtx.globalAlpha = 1;

      s.rafId = requestAnimationFrame(draw);
    }

    resize();
    s.rafId = requestAnimationFrame(draw);

    const img = new window.Image();
    img.src = '/sprites/layers/torch-sheet.png';
    img.onload  = () => { s.torchImg = img; };
    img.onerror = () => console.warn('DungeonBackground: torch-sheet failed to load');

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(s.rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ position:'fixed', inset:0, backgroundColor:'#06050a', zIndex:0, pointerEvents:'none' }} />
      {LAYERS.slice(0, 4).map(l => <div key={l.name} style={layerStyle(l)} />)}
      <canvas ref={torchRef} style={{
        position:'fixed', inset:0, width:'100%', height:'100%',
        zIndex:0, pointerEvents:'none', imageRendering:'pixelated',
      }} />
      {LAYERS.slice(4).map(l => <div key={l.name} style={layerStyle(l)} />)}
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.35)', zIndex:0, pointerEvents:'none' }} />
      <canvas ref={fxRef} style={{
        position:'fixed', inset:0, width:'100%', height:'100%',
        zIndex:1, pointerEvents:'none',
      }} />
    </>
  );
}
