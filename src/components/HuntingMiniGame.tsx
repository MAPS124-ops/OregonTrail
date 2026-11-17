import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface HuntingMiniGameProps {
  initialAmmo: number;
  biomeName: string;
  onComplete: (meatGained: number, ammoUsed: number) => void;
}

type AnimalKind = 'rabbit' | 'deer' | 'elk' | 'buffalo';

interface Animal {
  id: number;
  kind: AnimalKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  meatLbs: number;
  hp: number;
  hitFlash: number;
  bobPhase: number;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export const HuntingMiniGame: React.FC<HuntingMiniGameProps> = ({
  initialAmmo,
  biomeName,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ammoLeft, setAmmoLeft] = useState(initialAmmo);
  const [meatHaul, setMeatHaul] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [finished, setFinished] = useState(false);

  const gameRef = useRef({
    ammo: initialAmmo,
    meat: 0,
    timeLeft: 40,
    finished: false,
    reticleX: 480,
    reticleY: 300,
    keys: new Set<string>(),
    cooldown: 0,
    hitstop: 0,
    shake: 0,
    muzzleFlash: 0,
    animals: [] as Animal[],
    particles: [] as BurstParticle[],
    popups: [] as FloatingText[],
    spawnTimer: 0.6,
    nextId: 1,
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
      gameRef.current.reticleX = canvas.clientWidth / 2;
      gameRef.current.reticleY = canvas.clientHeight / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnAnimal = (w: number, h: number) => {
      const g = gameRef.current;
      const roll = Math.random();
      let kind: AnimalKind = 'deer';
      if (roll < 0.34) kind = 'rabbit';
      else if (roll < 0.68) kind = 'deer';
      else if (roll < 0.88) kind = 'elk';
      else kind = 'buffalo';

      const fromLeft = Math.random() < 0.5;
      const spec: Record<
        AnimalKind,
        { w: number; h: number; speed: number; meat: number; hp: number }
      > = {
        rabbit: { w: 34, h: 24, speed: 185, meat: 8, hp: 1 },
        deer: { w: 62, h: 48, speed: 145, meat: 35, hp: 1 },
        elk: { w: 76, h: 62, speed: 120, meat: 55, hp: 1 },
        buffalo: { w: 105, h: 74, speed: 88, meat: 100, hp: 2 },
      };
      const cfg = spec[kind];
      const minY = h * 0.36;
      const maxY = h * 0.82;
      const y = minY + Math.random() * (maxY - minY);

      g.animals.push({
        id: g.nextId++,
        kind,
        x: fromLeft ? -cfg.w : w + cfg.w,
        y,
        vx: (fromLeft ? 1 : -1) * (cfg.speed + Math.random() * 28),
        vy: (Math.random() - 0.5) * 18,
        width: cfg.w,
        height: cfg.h,
        meatLbs: cfg.meat,
        hp: cfg.hp,
        hitFlash: 0,
        bobPhase: Math.random() * Math.PI * 2,
      });
    };

    const fireShot = () => {
      const g = gameRef.current;
      if (g.finished || g.cooldown > 0) return;
      if (g.ammo <= 0) {
        soundEngine.playAlert('warn');
        g.popups.push({
          x: g.reticleX,
          y: g.reticleY - 18,
          text: 'Out of ammo!',
          life: 0.9,
          color: '#EF4444',
        });
        g.cooldown = 0.35;
        return;
      }

      g.ammo -= 1;
      setAmmoLeft(g.ammo);
      g.cooldown = 0.38;
      g.muzzleFlash = 0.08;
      g.shake = 7;
      soundEngine.playGunshot();

      // Check hit against animals (reverse order so foreground hits first)
      let hitAny = false;
      for (let i = g.animals.length - 1; i >= 0; i--) {
        const a = g.animals[i];
        const halfW = a.width * 0.55;
        const halfH = a.height * 0.55;
        if (
          Math.abs(g.reticleX - a.x) <= halfW &&
          Math.abs(g.reticleY - a.y) <= halfH
        ) {
          hitAny = true;
          a.hp -= 1;
          a.hitFlash = 0.14;
          g.hitstop = 0.045; // 45ms hitstop on impact

          for (let p = 0; p < 14; p++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 40 + Math.random() * 140;
            g.particles.push({
              x: g.reticleX,
              y: g.reticleY,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              life: 0,
              maxLife: 0.35 + Math.random() * 0.25,
              color: a.hp <= 0 ? '#F59E0B' : '#E7D8C0',
              size: 2.5 + Math.random() * 3,
            });
          }

          if (a.hp <= 0) {
            soundEngine.playHitConfirm();
            const remainingCapacity = Math.max(0, 100 - g.meat);
            const gained = Math.min(a.meatLbs, remainingCapacity);
            g.meat += gained;
            setMeatHaul(g.meat);
            g.popups.push({
              x: a.x,
              y: a.y - 24,
              text: gained > 0 ? `+${gained} lbs` : 'Wagon pack full (100 lb limit)',
              life: 1.25,
              color: gained > 0 ? '#FBBF24' : '#E5E7EB',
            });
            g.animals.splice(i, 1);
          } else {
            // Startled buffalo speeds up!
            a.vx *= 1.55;
            g.popups.push({
              x: a.x,
              y: a.y - 28,
              text: 'Wounded! Fire again',
              life: 0.85,
              color: '#FDBA74',
            });
          }
          break;
        }
      }

      if (!hitAny) {
        // Dirt puff at miss point
        for (let p = 0; p < 6; p++) {
          g.particles.push({
            x: g.reticleX,
            y: g.reticleY,
            vx: (Math.random() - 0.5) * 60,
            vy: -20 - Math.random() * 40,
            life: 0,
            maxLife: 0.3,
            color: '#9C8262',
            size: 2.5,
          });
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameRef.current.reticleX = e.clientX - rect.left;
      gameRef.current.reticleY = e.clientY - rect.top;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      gameRef.current.reticleX = e.clientX - rect.left;
      gameRef.current.reticleY = e.clientY - rect.top;
      fireShot();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      gameRef.current.keys.add(e.code);
      if (e.code === 'Space') {
        fireShot();
      } else if (e.code === 'Escape') {
        gameRef.current.finished = true;
        setFinished(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys.delete(e.code);
    };

    const onBlur = () => {
      gameRef.current.keys.clear();
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let animId = 0;
    let lastTime = performance.now();
    let timerAccum = 0;

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const g = gameRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (!g.finished) {
        if (g.hitstop > 0) {
          g.hitstop -= dt;
        } else {
          // Move reticle with keyboard
          const moveSpeed = 390;
          if (g.keys.has('KeyW') || g.keys.has('ArrowUp')) g.reticleY -= moveSpeed * dt;
          if (g.keys.has('KeyS') || g.keys.has('ArrowDown')) g.reticleY += moveSpeed * dt;
          if (g.keys.has('KeyA') || g.keys.has('ArrowLeft')) g.reticleX -= moveSpeed * dt;
          if (g.keys.has('KeyD') || g.keys.has('ArrowRight')) g.reticleX += moveSpeed * dt;
          g.reticleX = Math.max(20, Math.min(w - 20, g.reticleX));
          g.reticleY = Math.max(20, Math.min(h - 20, g.reticleY));

          g.cooldown = Math.max(0, g.cooldown - dt);
          g.muzzleFlash = Math.max(0, g.muzzleFlash - dt);
          g.shake = Math.max(0, g.shake - dt * 28);

          // Countdown
          timerAccum += dt;
          if (timerAccum >= 1) {
            timerAccum -= 1;
            g.timeLeft = Math.max(0, g.timeLeft - 1);
            setTimeLeft(g.timeLeft);
            if (g.timeLeft === 0 || g.meat >= 100) {
              g.finished = true;
              setFinished(true);
            }
          }

          // Spawn animals
          g.spawnTimer -= dt;
          if (g.spawnTimer <= 0 && g.animals.length < 6) {
            spawnAnimal(w, h);
            g.spawnTimer = 0.85 + Math.random() * 1.1;
          }

          // Update animals
          for (let i = g.animals.length - 1; i >= 0; i--) {
            const a = g.animals[i];
            a.x += a.vx * dt;
            a.y += a.vy * dt;
            a.bobPhase += dt * 10;
            a.hitFlash = Math.max(0, a.hitFlash - dt);
            if (a.y < h * 0.34 || a.y > h * 0.86) a.vy *= -1;
            if (a.x < -150 || a.x > w + 150) {
              g.animals.splice(i, 1);
            }
          }

          // Update particles & popups
          for (let i = g.particles.length - 1; i >= 0; i--) {
            const p = g.particles[i];
            p.life += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 180 * dt;
            if (p.life >= p.maxLife) g.particles.splice(i, 1);
          }

          for (let i = g.popups.length - 1; i >= 0; i--) {
            const pop = g.popups[i];
            pop.life -= dt;
            pop.y -= 28 * dt;
            if (pop.life <= 0) g.popups.splice(i, 1);
          }
        }
      }

      // Render hunting meadow
      ctx.save();
      if (g.shake > 0) {
        ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
      }

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.36);
      sky.addColorStop(0, '#1B2D45');
      sky.addColorStop(1, '#DFAA6E');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.36);

      // Meadow ground
      const meadow = ctx.createLinearGradient(0, h * 0.34, 0, h);
      meadow.addColorStop(0, '#6F7A42');
      meadow.addColorStop(1, '#3A4322');
      ctx.fillStyle = meadow;
      ctx.fillRect(0, h * 0.34, w, h * 0.66);

      // Distant trees/rocks for depth
      ctx.fillStyle = '#313F28';
      for (let i = 0; i < 12; i++) {
        const tx = (i * w) / 11 + 25;
        const ty = h * 0.35;
        ctx.beginPath();
        ctx.moveTo(tx - 18, ty);
        ctx.lineTo(tx, ty - 42 - (i % 3) * 14);
        ctx.lineTo(tx + 18, ty);
        ctx.closePath();
        ctx.fill();
      }

      // Animals sorted by y for painter's order
      const sorted = [...g.animals].sort((a, b) => a.y - b.y);
      for (const a of sorted) {
        drawAnimal(ctx, a);
      }

      // Particles
      for (const p of g.particles) {
        const alpha = 1 - p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Floating meat popups
      ctx.font = '600 15px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      for (const pop of g.popups) {
        ctx.globalAlpha = Math.min(1, pop.life * 1.4);
        ctx.fillStyle = '#14100C';
        ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, pop.x, pop.y);
      }
      ctx.globalAlpha = 1;

      // Muzzle flash overlay
      if (g.muzzleFlash > 0) {
        ctx.fillStyle = `rgba(255, 224, 140, ${(g.muzzleFlash * 2.5).toFixed(2)})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Rifle Reticle
      drawReticle(ctx, g.reticleX, g.reticleY, g.cooldown > 0);
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const ammoUsed = initialAmmo - ammoLeft;

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-[#14100C] select-none">
      {/* Unobtrusive Top Hunting Bar */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4">
        <div className="pointer-events-auto flex items-center gap-5 bg-[#1B1510]/90 border border-amber-200/20 px-4 py-2 rounded-lg text-sm">
          <span className="font-display font-semibold text-amber-200">
            Prairie Hunt · {biomeName}
          </span>
          <span className="text-amber-200/40" aria-hidden="true">·</span>
          <span className="font-mono-tabular text-stone-200">
            Ammo: <strong className="text-amber-300">{ammoLeft}</strong>
          </span>
          <span className="text-amber-200/40" aria-hidden="true">·</span>
          <span className="font-mono-tabular text-stone-200">
            Pack: <strong className="text-emerald-300">{meatHaul}/100 lbs</strong>
          </span>
          <span className="text-amber-200/40" aria-hidden="true">·</span>
          <span className="font-mono-tabular text-stone-200">
            Daylight: <strong className="text-amber-100">{timeLeft}s</strong>
          </span>
        </div>

        <button
          onClick={() => {
            gameRef.current.finished = true;
            setFinished(true);
          }}
          className="pointer-events-auto px-4 py-2 text-sm font-medium bg-[#1B1510]/90 hover:bg-[#2B2118] text-amber-100 border border-amber-200/25 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Return to Wagon
        </button>
      </div>

      {/* Playable Hunting Canvas */}
      <canvas ref={canvasRef} className="block h-full w-full cursor-crosshair" />

      {/* Bottom control hint */}
      {!finished && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-amber-100/80 bg-[#14100C]/80 px-4 py-1.5 rounded-md border border-amber-200/15 whitespace-nowrap">
          Aim with Mouse or WASD/Arrows · Click or Space to Fire · Max 100 lbs carried per hunt
        </div>
      )}

      {/* Hunt Summary Overlay */}
      {finished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-xl bg-[#221B15] border border-amber-200/25 p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-semibold text-amber-100">
              Hunt Concluded
            </h2>
            <p className="mt-1 text-sm text-stone-300">
              {meatHaul >= 100
                ? 'Your party packed back the full 100-pound wagon carrying limit.'
                : meatHaul > 0
                ? 'You dressed the fresh meat and hauled it back to the wagon before dusk.'
                : 'No game was brought back to camp this time.'}
            </p>

            <div className="mt-5 space-y-2 border-y border-amber-200/15 py-4 text-sm font-mono-tabular">
              <div className="flex justify-between">
                <span className="text-stone-400">Meat Carried to Wagon</span>
                <span className="text-emerald-300 font-semibold">+{meatHaul} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Rounds Expended</span>
                <span className="text-amber-200">{ammoUsed} bullets</span>
              </div>
            </div>

            <button
              onClick={() => onComplete(meatHaul, ammoUsed)}
              className="mt-5 w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              Pack Meat & Continue Trail
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function drawAnimal(ctx: CanvasRenderingContext2D, a: Animal) {
  ctx.save();
  const hop = Math.abs(Math.sin(a.bobPhase)) * (a.kind === 'rabbit' ? 7 : 3);
  ctx.translate(a.x, a.y - hop);
  if (a.vx < 0) ctx.scale(-1, 1);

  const flash = a.hitFlash > 0;

  if (a.kind === 'rabbit') {
    ctx.fillStyle = flash ? '#FFFFFF' : '#A68E74';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.beginPath();
    ctx.ellipse(9, -13, 2.5, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.fillStyle = '#F5F5F4';
    ctx.beginPath();
    ctx.arc(-14, -2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (a.kind === 'deer') {
    ctx.strokeStyle = flash ? '#FFFFFF' : '#734B2D';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, 6);
    ctx.lineTo(-16, 22);
    ctx.moveTo(14, 6);
    ctx.lineTo(16, 22);
    ctx.stroke();

    ctx.fillStyle = flash ? '#FFFFFF' : '#9E6B43';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Neck & head
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.lineTo(24, -18);
    ctx.lineTo(31, -15);
    ctx.lineTo(22, 2);
    ctx.closePath();
    ctx.fill();
    // Antlers
    ctx.strokeStyle = '#E5D3B3';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(23, -19);
    ctx.lineTo(20, -29);
    ctx.moveTo(22, -24);
    ctx.lineTo(27, -27);
    ctx.stroke();
  } else if (a.kind === 'elk') {
    ctx.strokeStyle = flash ? '#FFFFFF' : '#573924';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-18, 8);
    ctx.lineTo(-20, 28);
    ctx.moveTo(16, 8);
    ctx.lineTo(18, 28);
    ctx.stroke();

    ctx.fillStyle = flash ? '#FFFFFF' : '#855836';
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    // Dark mane
    ctx.fillStyle = flash ? '#FFFFFF' : '#422918';
    ctx.beginPath();
    ctx.ellipse(18, -8, 10, 14, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = flash ? '#FFFFFF' : '#5E3B22';
    ctx.beginPath();
    ctx.ellipse(29, -16, 9, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Wide rack
    ctx.strokeStyle = '#E8D8BA';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(25, -21);
    ctx.quadraticCurveTo(10, -38, 2, -34);
    ctx.moveTo(14, -31);
    ctx.lineTo(16, -39);
    ctx.stroke();
  } else {
    // Buffalo
    ctx.strokeStyle = flash ? '#FFFFFF' : '#332116';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-24, 12);
    ctx.lineTo(-25, 32);
    ctx.moveTo(22, 12);
    ctx.lineTo(23, 32);
    ctx.stroke();

    // Rear body
    ctx.fillStyle = flash ? '#FFFFFF' : '#543826';
    ctx.beginPath();
    ctx.ellipse(-8, 2, 32, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shaggy shoulder hump
    ctx.fillStyle = flash ? '#FFFFFF' : '#362215';
    ctx.beginPath();
    ctx.arc(16, -4, 24, 0, Math.PI * 2);
    ctx.fill();
    // Head & horns
    ctx.fillStyle = flash ? '#FFFFFF' : '#26170E';
    ctx.beginPath();
    ctx.arc(36, 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D6C7B2';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(35, -7);
    ctx.quadraticCurveTo(42, -16, 34, -17);
    ctx.stroke();
  }

  ctx.restore();
}

function drawReticle(ctx: CanvasRenderingContext2D, x: number, y: number, cooling: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = cooling ? 'rgba(245, 158, 11, 0.55)' : 'rgba(254, 243, 199, 0.92)';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.stroke();

  const gaps = 6;
  const len = 24;
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(-gaps, 0);
  ctx.moveTo(gaps, 0);
  ctx.lineTo(len, 0);
  ctx.moveTo(0, -len);
  ctx.lineTo(0, -gaps);
  ctx.moveTo(0, gaps);
  ctx.lineTo(0, len);
  ctx.stroke();

  ctx.fillStyle = cooling ? '#F59E0B' : '#EF4444';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
