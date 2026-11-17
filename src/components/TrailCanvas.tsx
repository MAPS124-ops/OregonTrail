import React, { useEffect, useRef } from 'react';
import { BiomeId, Landmark, Pace, WeatherKind } from '../types/game';

interface TrailCanvasProps {
  miles: number;
  biome: BiomeId;
  weather: WeatherKind;
  traveling: boolean;
  pace: Pace;
  oxenCount: number;
  nextLandmark: Landmark | null;
  wagonCondition: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: 'dust' | 'rain' | 'snow' | 'ember' | 'smoke';
}

const BIOME_PALETTES: Record<
  BiomeId,
  {
    skyTop: string;
    skyMid: string;
    skyHorizon: string;
    farPeak: string;
    midHill: string;
    groundTop: string;
    groundBottom: string;
    trailDirt: string;
    accent: string;
  }
> = {
  tallgrass: {
    skyTop: '#1D2B44',
    skyMid: '#5A738E',
    skyHorizon: '#E6B87D',
    farPeak: '#4C5F6E',
    midHill: '#576840',
    groundTop: '#6B7638',
    groundBottom: '#3D4420',
    trailDirt: '#7A5B3A',
    accent: '#8C9B48',
  },
  platte: {
    skyTop: '#1E2D48',
    skyMid: '#6E7F91',
    skyHorizon: '#EDBC78',
    farPeak: '#5E6873',
    midHill: '#7A7246',
    groundTop: '#8C7B45',
    groundBottom: '#4E4326',
    trailDirt: '#8B6843',
    accent: '#A89454',
  },
  badlands: {
    skyTop: '#242338',
    skyMid: '#8A6355',
    skyHorizon: '#F0AE6E',
    farPeak: '#7A4E40',
    midHill: '#8F5E44',
    groundTop: '#9A6F49',
    groundBottom: '#573B25',
    trailDirt: '#7D5132',
    accent: '#B87C4C',
  },
  rockies: {
    skyTop: '#142238',
    skyMid: '#4A688A',
    skyHorizon: '#D8B48A',
    farPeak: '#3D4F63',
    midHill: '#394D3E',
    groundTop: '#5B6244',
    groundBottom: '#313726',
    trailDirt: '#6E5844',
    accent: '#2D4533',
  },
  high_desert: {
    skyTop: '#232C42',
    skyMid: '#7D8291',
    skyHorizon: '#E8B884',
    farPeak: '#6E6663',
    midHill: '#867862',
    groundTop: '#998765',
    groundBottom: '#5A4D38',
    trailDirt: '#856B4E',
    accent: '#7D8468',
  },
  blue_mountains: {
    skyTop: '#111C2E',
    skyMid: '#3C546E',
    skyHorizon: '#C99E72',
    farPeak: '#2C3D4F',
    midHill: '#253D34',
    groundTop: '#3E5238',
    groundBottom: '#212D1F',
    trailDirt: '#5B4635',
    accent: '#1E3328',
  },
  columbia_gorge: {
    skyTop: '#152736',
    skyMid: '#456D78',
    skyHorizon: '#D4B88C',
    farPeak: '#324A52',
    midHill: '#2C4E3D',
    groundTop: '#416343',
    groundBottom: '#223626',
    trailDirt: '#5F4C39',
    accent: '#2C5C47',
  },
};

export const TrailCanvas: React.FC<TrailCanvasProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(props);
  stateRef.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let scrollOffset = 0;
    let wheelAngle = 0;
    let walkPhase = 0;
    let clock = 0;
    let lightningTimer = 2.8;
    let lightningFlash = 0;
    let lightningX = 0.5;

    // Pre-allocate particle pool
    const particles: Particle[] = [];
    for (let i = 0; i < 220; i++) {
      particles.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        vx: 0,
        vy: 0,
        life: Math.random(),
        maxLife: 1,
        size: 1.5 + (i % 4) * 0.6,
        kind: 'rain',
      });
    }

    const dustPool: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const drawLoop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      clock += dt;

      const s = stateRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(drawLoop);
        return;
      }

      const palette = BIOME_PALETTES[s.biome];
      const paceSpeed = s.pace === 'grueling' ? 115 : s.pace === 'strenuous' ? 85 : 58;
      const activeSpeed = s.traveling ? paceSpeed : 0;

      scrollOffset += activeSpeed * dt;
      if (s.traveling && s.oxenCount > 0) {
        wheelAngle += (activeSpeed * dt) / 22;
        walkPhase += dt * (s.pace === 'grueling' ? 9 : s.pace === 'strenuous' ? 7 : 5);
      }

      // Storm lightning timer
      if (s.weather === 'storm') {
        lightningTimer -= dt;
        lightningFlash = Math.max(0, lightningFlash - dt * 4.5);
        if (lightningTimer <= 0) {
          lightningFlash = 0.85;
          lightningX = 0.18 + Math.random() * 0.64;
          lightningTimer = 2.6 + Math.random() * 4.5;
        }
      } else {
        lightningFlash = 0;
      }

      // 1. Sky Gradient (responsive to weather & travel/camp state)
      const horizonY = h * 0.62;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      if (s.weather === 'storm') {
        skyGrad.addColorStop(0, '#0B0F17');
        skyGrad.addColorStop(0.55, '#1D2733');
        skyGrad.addColorStop(1, '#414C56');
      } else if (s.weather === 'rain') {
        skyGrad.addColorStop(0, '#16202C');
        skyGrad.addColorStop(0.6, '#364554');
        skyGrad.addColorStop(1, '#68747E');
      } else if (s.weather === 'snow') {
        skyGrad.addColorStop(0, '#1C2634');
        skyGrad.addColorStop(0.6, '#4D5C6E');
        skyGrad.addColorStop(1, '#8D9AA6');
      } else if (s.weather === 'cold') {
        skyGrad.addColorStop(0, s.traveling ? '#132238' : '#0B1424');
        skyGrad.addColorStop(0.6, '#3F5B78');
        skyGrad.addColorStop(1, '#A5B8C8');
      } else if (s.weather === 'hot') {
        skyGrad.addColorStop(0, s.traveling ? '#2A2334' : '#161322');
        skyGrad.addColorStop(0.55, '#995D42');
        skyGrad.addColorStop(1, '#F2AF63');
      } else if (!s.traveling) {
        // Clear camp dusk sky
        skyGrad.addColorStop(0, '#0D1321');
        skyGrad.addColorStop(0.55, '#2A334B');
        skyGrad.addColorStop(1, '#B36A43');
      } else {
        skyGrad.addColorStop(0, palette.skyTop);
        skyGrad.addColorStop(0.55, palette.skyMid);
        skyGrad.addColorStop(1, palette.skyHorizon);
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY + 10);

      // Lightning bolt & sky flash during storms
      if (s.weather === 'storm' && lightningFlash > 0.05) {
        ctx.fillStyle = `rgba(215, 232, 255, ${(lightningFlash * 0.28).toFixed(3)})`;
        ctx.fillRect(0, 0, w, horizonY + 10);

        if (lightningFlash > 0.45) {
          const lx = w * lightningX;
          ctx.strokeStyle = `rgba(235, 245, 255, ${lightningFlash.toFixed(2)})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(lx, 0);
          ctx.lineTo(lx - 14, horizonY * 0.28);
          ctx.lineTo(lx + 10, horizonY * 0.52);
          ctx.lineTo(lx - 8, horizonY * 0.88);
          ctx.stroke();
        }
      }

      // Stars when camped under clear skies, or sun glow during fair/warm/hot weather
      if (!s.traveling && (s.weather === 'fair' || s.weather === 'warm' || s.weather === 'cold')) {
        ctx.fillStyle = 'rgba(255, 244, 214, 0.65)';
        for (let i = 0; i < 42; i++) {
          const sx = (i * 197.3) % w;
          const sy = (i * 89.7) % (horizonY * 0.65);
          const twinkle = 0.4 + 0.6 * Math.sin(clock * 2 + i);
          ctx.globalAlpha = twinkle * 0.75;
          ctx.fillRect(sx, sy, 2, 2);
        }
        ctx.globalAlpha = 1;
      } else if (s.weather === 'fair' || s.weather === 'warm' || s.weather === 'hot') {
        const sunX = w * 0.78;
        const sunY = s.weather === 'hot' ? horizonY * 0.34 : horizonY * 0.42;
        const sunR = s.weather === 'hot' ? 175 : 130;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, sunR);
        sunGrad.addColorStop(
          0,
          s.weather === 'hot' ? 'rgba(255, 246, 200, 0.98)' : 'rgba(255, 236, 179, 0.95)'
        );
        sunGrad.addColorStop(
          0.25,
          s.weather === 'hot' ? 'rgba(251, 146, 60, 0.48)' : 'rgba(245, 179, 88, 0.35)'
        );
        sunGrad.addColorStop(1, 'rgba(245, 179, 88, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Drifting clouds (denser & darker in rain/storm/snow)
      const cloudCount =
        s.weather === 'storm' || s.weather === 'rain' || s.weather === 'snow' ? 10 : 6;
      const cloudSpeed = s.weather === 'storm' ? 32 : s.weather === 'rain' ? 18 : 8;
      ctx.fillStyle =
        s.weather === 'storm'
          ? 'rgba(22, 27, 34, 0.72)'
          : s.weather === 'rain'
          ? 'rgba(42, 52, 62, 0.55)'
          : s.weather === 'snow'
          ? 'rgba(185, 198, 212, 0.34)'
          : s.weather === 'cold'
          ? 'rgba(195, 212, 228, 0.22)'
          : 'rgba(255, 238, 215, 0.14)';
      for (let i = 0; i < cloudCount; i++) {
        const cx = ((i * 290 - scrollOffset * 0.08 - clock * cloudSpeed) % (w + 340)) + w + 170;
        const wrappedX = (((cx % (w + 340)) + (w + 340)) % (w + 340)) - 170;
        const cy = h * (0.1 + (i % 4) * 0.085);
        ctx.beginPath();
        ctx.ellipse(wrappedX, cy, 105 + (i % 3) * 32, 24 + (i % 2) * 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Parallax Far Mountains / Mesas
      ctx.fillStyle = palette.farPeak;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      const farStep = 90;
      for (let x = -farStep; x <= w + farStep; x += farStep) {
        const worldX = x + scrollOffset * 0.14;
        const idx = Math.floor(worldX / farStep);
        const frac = (worldX / farStep) - idx;
        const h1 =
          s.biome === 'rockies' || s.biome === 'blue_mountains'
            ? 45 + Math.abs(Math.sin(idx * 1.7)) * 110
            : s.biome === 'badlands'
            ? 28 + (idx % 4 === 0 ? 55 : 18)
            : 18 + Math.abs(Math.sin(idx * 0.9)) * 32;
        const h2 =
          s.biome === 'rockies' || s.biome === 'blue_mountains'
            ? 45 + Math.abs(Math.sin((idx + 1) * 1.7)) * 110
            : s.biome === 'badlands'
            ? 28 + ((idx + 1) % 4 === 0 ? 55 : 18)
            : 18 + Math.abs(Math.sin((idx + 1) * 0.9)) * 32;
        const peakY = horizonY - (h1 + (h2 - h1) * frac);
        ctx.lineTo(x, peakY);
      }
      ctx.lineTo(w, horizonY + 10);
      ctx.closePath();
      ctx.fill();

      // Approaching Landmark silhouette on horizon if within 60 miles
      if (s.nextLandmark) {
        const dist = s.nextLandmark.mile - s.miles;
        if (dist >= 0 && dist <= 65) {
          const proximity = 1 - dist / 65; // 0 -> 1
          const lx = w * (0.86 - proximity * 0.16);
          const scale = 0.45 + proximity * 0.75;
          drawLandmarkSilhouette(ctx, s.nextLandmark, lx, horizonY + 4, scale);
        }
      }

      // 3. Parallax Midground Hills & Trees
      ctx.fillStyle = palette.midHill;
      ctx.beginPath();
      ctx.moveTo(0, horizonY + 25);
      for (let x = 0; x <= w + 40; x += 40) {
        const worldX = x + scrollOffset * 0.34;
        const hillY =
          horizonY -
          8 -
          Math.sin(worldX * 0.004) * 16 -
          Math.cos(worldX * 0.011) * 8;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(w, horizonY + 35);
      ctx.closePath();
      ctx.fill();

      // Midground Pines / Sage / Cottonwoods
      const treeSpacing = s.biome === 'blue_mountains' || s.biome === 'columbia_gorge' ? 68 : 130;
      const firstTreeIdx = Math.floor((scrollOffset * 0.52) / treeSpacing) - 1;
      const numTrees = Math.ceil(w / treeSpacing) + 3;
      for (let i = 0; i < numTrees; i++) {
        const treeIdx = firstTreeIdx + i;
        const tx = treeIdx * treeSpacing - scrollOffset * 0.52;
        const hash = Math.abs(Math.sin(treeIdx * 12.9898) * 43758.5453) % 1;
        if (s.biome === 'tallgrass' && hash < 0.55) continue;
        if (s.biome === 'platte' && hash < 0.65) continue;
        const ty = horizonY + 10 + hash * 12;
        drawFlora(ctx, s.biome, tx, ty, 0.8 + hash * 0.5, palette.accent);
      }

      // 4. Foreground Prairie & Rutted Dirt Road
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      groundGrad.addColorStop(0, palette.groundTop);
      groundGrad.addColorStop(1, palette.groundBottom);
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      const roadY = h * 0.75;
      const roadH = h * 0.1;
      ctx.fillStyle = palette.trailDirt;
      ctx.fillRect(0, roadY, w, roadH);

      // Wagon wheel ruts & pebbles scrolling
      ctx.fillStyle = 'rgba(38, 24, 14, 0.35)';
      ctx.fillRect(0, roadY + roadH * 0.28, w, 4);
      ctx.fillRect(0, roadY + roadH * 0.72, w, 4);

      const pebbleSpacing = 55;
      const firstPebble = Math.floor(scrollOffset / pebbleSpacing) - 1;
      ctx.fillStyle = 'rgba(42, 28, 16, 0.4)';
      for (let i = 0; i < Math.ceil(w / pebbleSpacing) + 3; i++) {
        const idx = firstPebble + i;
        const px = idx * pebbleSpacing - scrollOffset;
        const ph = (Math.abs(Math.sin(idx * 4.3)) * 100) % 1;
        ctx.fillRect(px, roadY + 6 + ph * (roadH - 14), 6 + ph * 6, 2.5);
      }

      // 5. Wagon & Oxen Team centered nicely in lower-middle playfield
      const wagonCenterX = w * 0.42;
      const wagonGroundY = roadY + roadH * 0.55;
      const bounce = s.traveling ? Math.sin(walkPhase * 2) * 1.6 : 0;

      // Ground shadow under wagon & oxen
      ctx.fillStyle = 'rgba(15, 10, 6, 0.36)';
      ctx.beginPath();
      ctx.ellipse(wagonCenterX + 45, wagonGroundY + 4, 155, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Campfire if resting / stopped
      if (!s.traveling) {
        drawCampfire(ctx, wagonCenterX - 135, wagonGroundY + 8, clock);
      }

      // Draw Oxen Team (1 to 3 pairs visible ahead of wagon)
      const pairs = Math.max(1, Math.min(3, Math.ceil(s.oxenCount / 2)));
      if (s.oxenCount > 0) {
        for (let p = 0; p < pairs; p++) {
          const oxX = wagonCenterX + 86 + p * 64;
          const oxY = wagonGroundY + (p % 2 === 0 ? 1 : -2);
          drawOx(ctx, oxX, oxY, walkPhase + p * 0.9, p === 0);
        }
        // Wooden hitch tongue connecting wagon to oxen
        ctx.strokeStyle = '#3B2818';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(wagonCenterX + 35, wagonGroundY - 22 + bounce);
        ctx.lineTo(wagonCenterX + 86 + (pairs - 1) * 64 + 12, wagonGroundY - 22);
        ctx.stroke();
      }

      // Draw Covered Wagon
      drawWagon(ctx, wagonCenterX, wagonGroundY + bounce, wheelAngle, !s.traveling, s.wagonCondition);

      // Emit wheel dust when rolling
      if (s.traveling && s.weather !== 'rain' && s.weather !== 'storm' && Math.random() < 0.45) {
        dustPool.push({
          x: wagonCenterX - 38 + Math.random() * 14,
          y: wagonGroundY + 1,
          vx: -28 - Math.random() * 25,
          vy: -6 - Math.random() * 12,
          life: 0,
          maxLife: 0.7 + Math.random() * 0.5,
          size: 4 + Math.random() * 5,
          kind: 'dust',
        });
      }

      // Update & draw dust/campfire smoke
      for (let i = dustPool.length - 1; i >= 0; i--) {
        const pt = dustPool[i];
        pt.life += dt;
        if (pt.life >= pt.maxLife) {
          dustPool.splice(i, 1);
          continue;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        const alpha = (1 - pt.life / pt.maxLife) * 0.35;
        ctx.fillStyle = `rgba(186, 152, 112, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (1 + pt.life), 0, Math.PI * 2);
        ctx.fill();
      }

      // Foreground swaying grass tufts below road (bends harder in storm winds)
      const grassSpacing = 38;
      const firstGrass = Math.floor((scrollOffset * 1.25) / grassSpacing) - 1;
      const windLean = s.weather === 'storm' ? -9 : s.weather === 'rain' ? -4 : 0;
      const swayAmp = s.weather === 'storm' ? 7 : 4;
      ctx.strokeStyle =
        s.weather === 'snow' ? 'rgba(205, 215, 225, 0.45)' : 'rgba(28, 34, 18, 0.55)';
      ctx.lineWidth = 2;
      for (let i = 0; i < Math.ceil(w / grassSpacing) + 4; i++) {
        const idx = firstGrass + i;
        const gx = idx * grassSpacing - scrollOffset * 1.25;
        const gy = roadY + roadH + 12 + ((idx * 37) % Math.max(20, h - roadY - roadH - 18));
        const sway = windLean + Math.sin(clock * (s.weather === 'storm' ? 6 : 2.4) + idx) * swayAmp;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx - 4 + sway, gy - 14);
        ctx.moveTo(gx + 3, gy);
        ctx.lineTo(gx + 5 + sway, gy - 11);
        ctx.stroke();
      }

      // 6. Weather Atmosphere Tint & Particle Overlays
      if (s.weather === 'snow') {
        // Subtle frost sheen across the prairie and trail
        ctx.fillStyle = 'rgba(226, 236, 248, 0.14)';
        ctx.fillRect(0, horizonY, w, h - horizonY);
        ctx.fillStyle = 'rgba(240, 246, 255, 0.18)';
        ctx.fillRect(0, roadY - 3, w, 4);
        ctx.fillRect(0, roadY + roadH - 1, w, 4);

        // Multi-depth drifting snowflakes
        for (let i = 0; i < 160; i++) {
          const p = particles[i];
          const depthFactor = 0.6 + (i % 3) * 0.35;
          p.x -= (20 + (i % 18)) * depthFactor * dt;
          p.x += Math.sin(clock * 1.8 + i) * 14 * dt;
          p.y += (38 + (i % 24)) * depthFactor * dt;
          if (p.y > h) {
            p.y = -6;
            p.x = Math.random() * (w + 40);
          }
          if (p.x < -10) p.x = w + 10;
          ctx.fillStyle =
            i % 3 === 0 ? 'rgba(255, 255, 255, 0.88)' : 'rgba(226, 238, 252, 0.62)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.3 + (i % 3) * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (s.weather === 'rain' || s.weather === 'storm') {
        const isStorm = s.weather === 'storm';
        // Cool damp storm atmospheric wash + puddles on trail
        ctx.fillStyle = isStorm ? 'rgba(15, 23, 34, 0.24)' : 'rgba(24, 34, 46, 0.12)';
        ctx.fillRect(0, 0, w, h);

        // Wet sheen along the wagon road
        ctx.fillStyle = 'rgba(148, 174, 198, 0.12)';
        ctx.fillRect(0, roadY, w, roadH);

        const count = isStorm ? 210 : 120;
        const vx = isStorm ? -210 : -115;
        const vy = isStorm ? 640 : 490;
        const streakX = isStorm ? -9 : -4;
        const streakY = isStorm ? 22 : 16;

        ctx.strokeStyle = isStorm
          ? 'rgba(205, 224, 245, 0.52)'
          : 'rgba(195, 216, 238, 0.42)';
        ctx.lineWidth = isStorm ? 1.5 : 1.2;

        for (let i = 0; i < count; i++) {
          const p = particles[i];
          p.x += vx * dt;
          p.y += vy * dt;
          if (p.y > h) {
            p.y = -24;
            p.x = Math.random() * (w + 260);
          }
          if (p.x < -20) p.x = w + 40;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + streakX, p.y + streakY);
          ctx.stroke();

          // Tiny ground splash ripple for droplets hitting near the road
          if (i % 7 === 0 && p.y > roadY && p.y < roadY + roadH) {
            ctx.strokeStyle = 'rgba(215, 232, 248, 0.35)';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 4, 1.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = isStorm
              ? 'rgba(205, 224, 245, 0.52)'
              : 'rgba(195, 216, 238, 0.42)';
          }
        }
      } else if (s.weather === 'hot') {
        // Warm golden heat haze & shimmering dust motes
        const hazeGrad = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 80);
        hazeGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
        hazeGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.13)');
        hazeGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, horizonY - 40, w, 120);

        ctx.fillStyle = 'rgba(254, 226, 170, 0.35)';
        for (let i = 0; i < 45; i++) {
          const p = particles[i];
          p.x -= (24 + (i % 12)) * dt;
          p.y += Math.sin(clock * 2.2 + i) * 10 * dt;
          if (p.x < -10) {
            p.x = w + 10;
            p.y = horizonY * 0.5 + Math.random() * (h - horizonY * 0.5);
          }
          if (p.y < 0 || p.y > h) p.y = horizonY + Math.random() * 120;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (s.weather === 'cold') {
        // Crisp pale blue frost tint & slow icy air motes
        ctx.fillStyle = 'rgba(147, 197, 253, 0.08)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(224, 242, 254, 0.32)';
        for (let i = 0; i < 40; i++) {
          const p = particles[i];
          p.x -= 16 * dt;
          p.y += (8 + Math.sin(clock + i) * 4) * dt;
          if (p.y > h) p.y = 0;
          if (p.x < 0) p.x = w;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(drawLoop);
    };

    animId = requestAnimationFrame(drawLoop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#14100C]">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

function drawWagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  wheelAngle: number,
  lanternOn: boolean,
  condition: number
) {
  ctx.save();
  ctx.translate(cx, groundY);

  // Rear & Front Wheel positions
  const rearWheelX = -32;
  const frontWheelX = 32;
  const rearR = 20;
  const frontR = 16;

  // Wooden wagon bed
  ctx.fillStyle = '#5D3D23';
  ctx.strokeStyle = '#2B1B0E';
  ctx.lineWidth = 2;
  ctx.fillRect(-52, -40, 96, 18);
  ctx.strokeRect(-52, -40, 96, 18);

  // Side slats
  ctx.fillStyle = '#754F2F';
  ctx.fillRect(-50, -37, 92, 5);

  // Canvas hoop cover (Prairie Schooner)
  ctx.fillStyle = condition < 45 ? '#D8C7AE' : '#EDE2CE';
  ctx.strokeStyle = '#8F7E66';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-54, -40);
  ctx.lineTo(-58, -76);
  ctx.quadraticCurveTo(-5, -94, 48, -78);
  ctx.lineTo(43, -40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Canvas rib shading
  ctx.strokeStyle = 'rgba(105, 88, 66, 0.35)';
  ctx.lineWidth = 2;
  [-32, -8, 16].forEach((rx) => {
    ctx.beginPath();
    ctx.moveTo(rx, -41);
    ctx.quadraticCurveTo(rx - 2, -68, rx + 2, -83);
    ctx.stroke();
  });

  // Front opening & driver silhouette
  ctx.fillStyle = '#24180E';
  ctx.beginPath();
  ctx.ellipse(43, -59, 6, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Driver hat & coat on front bench
  ctx.fillStyle = '#3B2C20';
  ctx.fillRect(36, -53, 9, 13);
  ctx.fillStyle = '#291D14';
  ctx.beginPath();
  ctx.arc(40, -57, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(34, -59, 13, 2.5);

  // Lantern glow when stopped at camp
  if (lanternOn) {
    const glow = ctx.createRadialGradient(-56, -44, 2, -56, -44, 28);
    glow.addColorStop(0, 'rgba(255, 198, 92, 0.85)');
    glow.addColorStop(1, 'rgba(255, 170, 50, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(-56, -44, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(-58, -48, 4, 7);
  }

  // Draw spoked wheels
  drawSpokedWheel(ctx, rearWheelX, -rearR, rearR, wheelAngle);
  drawSpokedWheel(ctx, frontWheelX, -frontR, frontR, wheelAngle * 1.2);

  ctx.restore();
}

function drawSpokedWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Spokes
  ctx.strokeStyle = '#4A301A';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
    ctx.stroke();
  }

  // Rim
  ctx.strokeStyle = '#332011';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
  ctx.stroke();

  // Hub
  ctx.fillStyle = '#2B1B0E';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawOx(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  phase: number,
  isSpotted: boolean
) {
  ctx.save();
  ctx.translate(x, groundY);
  const bob = Math.abs(Math.sin(phase)) * 1.5;

  // Legs
  ctx.strokeStyle = '#4A2C1B';
  ctx.lineWidth = 3.5;
  const legSwing = Math.sin(phase) * 5;
  ctx.beginPath();
  ctx.moveTo(-12, -16);
  ctx.lineTo(-12 + legSwing, 0);
  ctx.moveTo(-6, -16);
  ctx.lineTo(-6 - legSwing, 0);
  ctx.moveTo(10, -16);
  ctx.lineTo(10 - legSwing, 0);
  ctx.moveTo(15, -16);
  ctx.lineTo(15 + legSwing, 0);
  ctx.stroke();

  // Body
  ctx.fillStyle = isSpotted ? '#7A4628' : '#5E341D';
  ctx.beginPath();
  ctx.roundRect(-17, -30 - bob, 36, 17, 5);
  ctx.fill();

  if (isSpotted) {
    ctx.fillStyle = '#EADBC8';
    ctx.beginPath();
    ctx.ellipse(-4, -22 - bob, 7, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head & Horns
  ctx.fillStyle = isSpotted ? '#6E3D22' : '#4E2A16';
  ctx.beginPath();
  ctx.roundRect(16, -32 - bob, 11, 11, 3);
  ctx.fill();

  ctx.strokeStyle = '#E5D8C0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(22, -31 - bob);
  ctx.quadraticCurveTo(26, -38 - bob, 20, -39 - bob);
  ctx.stroke();

  // Wooden Yoke
  ctx.fillStyle = '#382515';
  ctx.fillRect(11, -33 - bob, 4, 7);

  ctx.restore();
}

function drawCampfire(ctx: CanvasRenderingContext2D, x: number, y: number, clock: number) {
  ctx.save();
  ctx.translate(x, y);

  // Warm radial firelight
  const glow = ctx.createRadialGradient(0, -10, 4, 0, -10, 65);
  glow.addColorStop(0, 'rgba(255, 145, 45, 0.45)');
  glow.addColorStop(1, 'rgba(255, 100, 20, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -10, 65, 0, Math.PI * 2);
  ctx.fill();

  // Logs
  ctx.strokeStyle = '#362111';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(10, -6);
  ctx.moveTo(12, 0);
  ctx.lineTo(-10, -6);
  ctx.stroke();

  // Flickering flames
  const flicker = Math.sin(clock * 14) * 3;
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.moveTo(-7, -3);
  ctx.quadraticCurveTo(0, -24 + flicker, 7, -3);
  ctx.fill();

  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.moveTo(-4, -3);
  ctx.quadraticCurveTo(0, -15 - flicker * 0.5, 4, -3);
  ctx.fill();

  ctx.restore();
}

function drawFlora(
  ctx: CanvasRenderingContext2D,
  biome: BiomeId,
  x: number,
  y: number,
  scale: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (biome === 'rockies' || biome === 'blue_mountains' || biome === 'columbia_gorge') {
    // Pine tree
    ctx.fillStyle = '#332214';
    ctx.fillRect(-2, -10, 4, 12);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.lineTo(0, -34);
    ctx.lineTo(14, -8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-11, -20);
    ctx.lineTo(0, -44);
    ctx.lineTo(11, -20);
    ctx.closePath();
    ctx.fill();
  } else {
    // Frontier sagebrush / prairie shrub
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-6, -5, 6, 0, Math.PI * 2);
    ctx.arc(4, -6, 7, 0, Math.PI * 2);
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLandmarkSilhouette(
  ctx: CanvasRenderingContext2D,
  landmark: Landmark,
  x: number,
  y: number,
  scale: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (landmark.id === 'chimney_rock') {
    ctx.fillStyle = '#5D3C2E';
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(-10, -45);
    ctx.lineTo(-6, -125);
    ctx.lineTo(5, -125);
    ctx.lineTo(10, -45);
    ctx.lineTo(38, 0);
    ctx.closePath();
    ctx.fill();
  } else if (landmark.type === 'fort') {
    // Timber fort palisade
    ctx.fillStyle = '#3B281B';
    ctx.fillRect(-45, -24, 90, 24);
    ctx.fillStyle = '#4B3323';
    ctx.fillRect(-52, -34, 16, 34);
    ctx.fillRect(36, -34, 16, 34);
    // Flagpole
    ctx.strokeStyle = '#C9B396';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(0, -48);
    ctx.stroke();
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(0, -48, 12, 7);
  } else if (landmark.id === 'independence_rock') {
    ctx.fillStyle = '#4E4744';
    ctx.beginPath();
    ctx.moveTo(-75, 0);
    ctx.quadraticCurveTo(-15, -52, 75, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
