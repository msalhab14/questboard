import React, { useState, useEffect } from 'react';

// LPC Animated Torch: 288×64px, 9 frames horizontally, each 32×32px
const FRAMES  = 9;
const FRAME_W = 32;
const FRAME_H = 64;
const SCALE   = 3;
const DISPLAY_W = FRAME_W * SCALE; // 96px
const DISPLAY_H = FRAME_H * SCALE; // 192px

function TorchSprite() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % FRAMES), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      width:  DISPLAY_W,
      height: DISPLAY_H,
      backgroundImage: "url('/sprites/torch_anim.png')",
      backgroundSize: `${FRAME_W * FRAMES * SCALE}px ${FRAME_H * SCALE}px`,
      backgroundPosition: `${-(frame * DISPLAY_W)}px 0px`,
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
      filter: 'drop-shadow(0 0 5px rgba(255,140,0,0.6)) drop-shadow(0 0 12px rgba(255,80,0,0.35))',
    }} />
  );
}

export default function Torches() {
  return (
    <>
      <div className="torch-wrap torch-left"><TorchSprite /></div>
      <div className="torch-wrap torch-right"><TorchSprite /></div>
    </>
  );
}
