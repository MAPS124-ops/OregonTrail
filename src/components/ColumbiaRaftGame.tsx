import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface ColumbiaRaftGameProps {
  onComplete: (hullRemaining: number, foodBonus: number) => void;
}

interface RiverObstacle {
  id: number;
  x: number;
  y: number;
  radius: number;
  kind: 'rock' | 'whirlpool' | 'crate';
  spin: number;
}

export const ColumbiaRaftGame: React.FC<ColumbiaRaftGameProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hull, setHull] = useState(100);
  const [distanceLeft, setDistanceLeft] = useState(115);
  const [foodBonus, setFoodBonus] = useState(0);
  const [finished, setFinished] = useState<'none' | 'arrived' | 'capsized'>('none');

  const simRef = useRef({
    raftX: 0.5, // normalized 0..1 inside river channel
    raftVx: 0,
    hull: 100,
    distance: 115,
    foodBonus: 0,
    shake: 0,
    hitFlash: 0,
    keys: new Set<string>(),
    steerDir: 0,
    obstacles: [] as RiverObstacle[],
    spawnTimer: 0.5,
    nextId: 1,
    finished: false,
    scroll: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      simRef.current.keys.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      simRef.current.keys.delete(e.code);
    };

    const onBlur = () => {
      simRef.current.keys.clear();
      simRef.current.steerDir = 0;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let animId = 0;
    let lastTime = performance.now();
    let distTimer = 0;

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const s = simRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      const bankWidth = Math.max(48, w * 0.16);
      const riverLeft = bankWidth;
      const riverWidth = w - bankWidth * 2;
      const raftPxX = riverLeft + s.raftX * riverWidth;
      const raftPxY = h * 0.74;

      if (!s.finished) {
        s.scroll += 235 * dt;
        s.shake = Math.max(0, s.shake - dt * 30);
        s.hitFlash = Math.max(0, s.hitFlash - dt);

        let inputX = s.steerDir;
        if (s.keys.has('ArrowLeft') || s.keys.has('KeyA')) inputX -= 1;
        if (s.keys.has('ArrowRight') || s.keys.has('KeyD')) inputX += 1;

        s.raftVx += inputX * 1.65 * dt;
        s.raftVx *= Math.pow(0.08, dt);
        s.raftX = Math.max(0.08, Math.min(0.92, s.raftX + s.raftVx * dt));

        // Distance countdown (~32 seconds total)
        distTimer += dt;
        if (distTimer >= 0.28) {
          distTimer -= 0.28;
          s.distance = Math.max(0, s.distance - 1);
          setDistanceLeft(s.distance);
          if (s.distance === 0) {
            s.finished = true;
            setFinished('arrived');
            soundEngine.playVictory();
          }
        }

        // Spawn boulders, whirlpools, crates
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          const r = Math.random();
          const kind: RiverObstacle['kind'] =
            r < 0.62 ? 'rock' : r < 0.84 ? 'whirlpool' : 'crate';
          s.obstacles.push({
            id: s.nextId++,
            x: 0.1 + Math.random() * 0.8,
            y: -45,
            radius: kind === 'rock' ? 24 + Math.random() * 12 : kind === 'whirlpool' ? 28 : 18,
            kind,
            spin: 0,
          });
          s.spawnTimer = 0.42 + Math.random() * 0.42;
        }

        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const ob = s.obstacles[i];
          ob.y += 245 * dt;
          ob.spin += dt * 3.5;

          const ox = riverLeft + ob.x * riverWidth;
          const dist = Math.hypot(ox - raftPxX, ob.y - raftPxY);
          if (dist < ob.radius + 22) {
            if (ob.kind === 'crate') {
              s.foodBonus += 25;
              setFoodBonus(s.foodBonus);
              soundEngine.playPurchase();
              s.obstacles.splice(i, 1);
              continue;
            } else {
              const dmg = ob.kind === 'rock' ? 20 : 12;
              s.hull = Math.max(0, s.hull - dmg);
              setHull(s.hull);
              s.shake = 10;
              s.hitFlash = 0.18;
              soundEngine.playSplash();
              s.obstacles.splice(i, 1);
              if (s.hull <= 0) {
                s.finished = true;
                setFinished('capsized');
                soundEngine.playAlert('danger');
              }
              continue;
            }
          }

          if (ob.y > h + 60) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // Draw Columbia Gorge River
      ctx.save();
      if (s.shake > 0) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      }

      // River water
      const waterGrad = ctx.createLinearGradient(riverLeft, 0, riverLeft + riverWidth, 0);
      waterGrad.addColorStop(0, '#13313D');
      waterGrad.addColorStop(0.5, '#1D4D5E');
      waterGrad.addColorStop(1, '#13313D');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(riverLeft, 0, riverWidth, h);

      // Rushing current foam lines
      ctx.strokeStyle = 'rgba(195, 232, 240, 0.22)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 18; i++) {
        const lx = riverLeft + ((i * 73 + 20) % Math.max(60, riverWidth - 20));
        const ly = ((i * 110 + s.scroll) % (h + 90)) - 45;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, ly + 38);
        ctx.stroke();
      }

      // Basalt Canyon Banks
      ctx.fillStyle = '#2A382B';
      ctx.fillRect(0, 0, riverLeft, h);
      ctx.fillRect(riverLeft + riverWidth, 0, bankWidth, h);

      ctx.fillStyle = '#3E3329';
      ctx.fillRect(riverLeft - 14, 0, 14, h);
      ctx.fillRect(riverLeft + riverWidth, 0, 14, h);

      // Obstacles
      for (const ob of s.obstacles) {
        const ox = riverLeft + ob.x * riverWidth;
        if (ob.kind === 'rock') {
          ctx.fillStyle = '#4A433D';
          ctx.beginPath();
          ctx.arc(ox, ob.y, ob.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(220, 242, 248, 0.55)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(ox, ob.y - 3, ob.radius + 4, Math.PI * 0.9, Math.PI * 2.1);
          ctx.stroke();
        } else if (ob.kind === 'whirlpool') {
          ctx.save();
          ctx.translate(ox, ob.y);
          ctx.rotate(ob.spin);
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
          ctx.lineWidth = 2.5;
          for (let r = 8; r <= ob.radius; r += 8) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 1.45);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          // Floating Supply Crate
          ctx.fillStyle = '#B4783A';
          ctx.strokeStyle = '#5C3A18';
          ctx.lineWidth = 2;
          ctx.fillRect(ox - 14, ob.y - 14, 28, 28);
          ctx.strokeRect(ox - 14, ob.y - 14, 28, 28);
          ctx.fillStyle = '#FEF3C7';
          ctx.font = 'bold 12px "IBM Plex Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('+', ox, ob.y + 4);
        }
      }

      // Draw Player Wagon-Raft
      ctx.save();
      ctx.translate(raftPxX, raftPxY);
      ctx.rotate(s.raftVx * 0.25);

      // Log raft base
      ctx.fillStyle = s.hitFlash > 0 ? '#FCA5A5' : '#6E4726';
      ctx.strokeStyle = '#2E1B0C';
      ctx.lineWidth = 2;
      ctx.fillRect(-24, -30, 48, 60);
      ctx.strokeRect(-24, -30, 48, 60);

      // Wagon canvas box lashed on raft
      ctx.fillStyle = s.hitFlash > 0 ? '#FFFFFF' : '#EDE2CE';
      ctx.fillRect(-16, -20, 32, 40);
      ctx.strokeStyle = '#8F7E66';
      ctx.strokeRect(-16, -20, 32, 40);
      ctx.restore();

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-[#14100C] select-none">
      {/* Top Rafting HUD */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4">
        <div className="pointer-events-auto flex items-center gap-5 bg-[#1B1510]/90 border border-amber-200/20 px-4 py-2 rounded-lg text-sm">
          <span className="font-display font-semibold text-amber-200">
            Columbia River Gorge
          </span>
          <span className="text-amber-200/40" aria-hidden="true">·</span>
          <span className="font-mono-tabular text-stone-200">
            Raft Hull:{' '}
            <strong className={hull > 45 ? 'text-emerald-300' : 'text-red-400'}>{hull}%</strong>
          </span>
          <span className="text-amber-200/40" aria-hidden="true">·</span>
          <span className="font-mono-tabular text-stone-200">
            Oregon City: <strong className="text-amber-300">{distanceLeft} mi</strong>
          </span>
          {foodBonus > 0 && (
            <>
              <span className="text-amber-200/40" aria-hidden="true">·</span>
              <span className="font-mono-tabular text-emerald-300">+{foodBonus} lbs salvaged</span>
            </>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* Touch / Mouse Steer Controls + Hint */}
      {finished === 'none' && (
        <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-40 flex flex-col items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-3 md:hidden">
            <button
              onPointerDown={() => (simRef.current.steerDir = -1)}
              onPointerUp={() => (simRef.current.steerDir = 0)}
              onPointerLeave={() => (simRef.current.steerDir = 0)}
              className="px-6 py-3 rounded-lg bg-[#1B1510]/90 border border-amber-200/30 text-amber-100 font-semibold"
            >
              Steer Left
            </button>
            <button
              onPointerDown={() => (simRef.current.steerDir = 1)}
              onPointerUp={() => (simRef.current.steerDir = 0)}
              onPointerLeave={() => (simRef.current.steerDir = 0)}
              className="px-6 py-3 rounded-lg bg-[#1B1510]/90 border border-amber-200/30 text-amber-100 font-semibold"
            >
              Steer Right
            </button>
          </div>
          <div className="text-xs text-amber-100/80 bg-[#14100C]/80 px-4 py-1.5 rounded-md border border-amber-200/15">
            Steer with A / D or Left / Right Arrows · Dodge boulders & whirlpools · Catch floating crates
          </div>
        </div>
      )}

      {finished !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6">
          <div className="w-full max-w-md rounded-xl bg-[#221B15] border border-amber-200/25 p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-semibold text-amber-100">
              {finished === 'arrived' ? 'Cleared the Columbia Rapids!' : 'Wagon Capsized in the Rapids'}
            </h2>
            <p className="mt-2 text-sm text-stone-300 leading-relaxed">
              {finished === 'arrived'
                ? 'With steady oars and grit, you guided the raft past the basalt narrows into the lush Willamette Valley!'
                : 'Your raft broke apart against the canyon boulders. The survivors swam ashore battered and drenched, losing half your remaining supplies before walking the final miles to Oregon City.'}
            </p>
            <button
              onClick={() => onComplete(hull, foodBonus)}
              className="mt-6 w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              Arrive at Oregon City
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
