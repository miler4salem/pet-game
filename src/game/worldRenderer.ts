import {
  Facing,
  PetMood,
  PlayerGender,
  SpeciesProfile,
  StationVisualKind,
} from '../types/pet';
import { WORLD, WorldStation } from './worldConfig';
import { drawPetCharacter } from './petCanvasRenderer';

export interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface RenderWorldState {
  time: number;
  species: SpeciesProfile;
  petName: string;
  needsValues: Record<string, number>;
  stations: WorldStation[];
  player: {
    x: number;
    y: number;
    facing: Facing;
    walkPhase: number;
    gender: PlayerGender;
  };
  pet: {
    x: number;
    y: number;
    facing: Facing;
    walkPhase: number;
    mood: PetMood;
    happyTimer: number;
    thoughtEmoji: string | null;
  };
  hoverSlotId: string | null;
  nearbySlotId: string | null;
  sparkles: Sparkle[];
  floatingTexts: FloatingText[];
}

export function getWorldTransform(canvasWidth: number, canvasHeight: number) {
  const pad = 14;
  const scale = Math.min(
    (canvasWidth - pad * 2) / WORLD.width,
    (canvasHeight - pad * 2) / WORLD.height
  );
  const offsetX = (canvasWidth - WORLD.width * scale) / 2;
  const offsetY = (canvasHeight - WORLD.height * scale) / 2;
  return { scale, offsetX, offsetY };
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  state: RenderWorldState
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Warm outer backdrop around the 45-degree diorama (slime-store cue)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  bgGrad.addColorStop(0, '#f3e5d8');
  bgGrad.addColorStop(1, '#e4d1be');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const { scale, offsetX, offsetY } = getWorldTransform(canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Drop shadow under the entire house + yard floorplate
  ctx.fillStyle = 'rgba(61, 44, 46, 0.14)';
  ctx.beginPath();
  ctx.roundRect(12, 16, WORLD.width - 10, WORLD.height - 6, 20);
  ctx.fill();

  drawHouseAndYardShell(ctx, state);

  // Build Y-sorted drawables (stations, player, pet)
  const drawables: Array<{ sortY: number; draw: () => void }> = [];

  for (const station of state.stations) {
    const val = Math.round(state.needsValues[station.need.id] ?? 100);
    const isHighlighted =
      state.hoverSlotId === station.slotId || state.nearbySlotId === station.slotId;
    drawables.push({
      sortY: station.y + station.h,
      draw: () => drawStation(ctx, station, val, isHighlighted, state.time),
    });
  }

  // Player character
  drawables.push({
    sortY: state.player.y,
    draw: () => drawPlayerCharacter(ctx, state.player),
  });

  // Following pet character
  drawables.push({
    sortY: state.pet.y,
    draw: () =>
      drawPetCharacter(ctx, {
        speciesId: state.species.id,
        x: state.pet.x,
        y: state.pet.y,
        facing: state.pet.facing,
        walkPhase: state.pet.walkPhase,
        mood: state.pet.mood,
        happyTimer: state.pet.happyTimer,
        thoughtEmoji: state.pet.thoughtEmoji,
        time: state.time,
      }),
  });

  drawables.sort((a, b) => a.sortY - b.sortY);
  for (const d of drawables) {
    d.draw();
  }

  // Lower front lip frame
  drawFrontLipFrame(ctx);

  // Sparkles & floating popups
  drawEffects(ctx, state.sparkles, state.floatingTexts);

  ctx.restore();
}

function drawHouseAndYardShell(ctx: CanvasRenderingContext2D, state: RenderWorldState) {
  const {
    width,
    height,
    wallTop,
    wallBottom,
    wallLeft,
    wallRight,
    dividerX,
    dividerW,
    patioDoorTop,
    patioDoorBottom,
  } = WORLD;
  const yardLeft = dividerX + dividerW;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 18);
  ctx.clip();

  // ================= INDOOR HOUSE FLOOR =================
  ctx.fillStyle = '#fff9f0';
  ctx.fillRect(0, wallTop, dividerX + 4, height - wallTop);

  // 45-degree foreshortened checkerboard tiles (slime-store signature)
  const tileW = 54;
  const tileH = 42;
  for (let row = 0; row * tileH < wallBottom - wallTop + tileH; row++) {
    for (let col = 0; col * tileW < dividerX - wallLeft + tileW; col++) {
      const tx = wallLeft + col * tileW;
      const ty = wallTop + row * tileH;
      ctx.fillStyle = (row + col) % 2 === 0 ? '#fff7eb' : '#f8ead8';
      ctx.fillRect(tx, ty, tileW, tileH);
    }
  }

  // Subtle floor grid lines
  ctx.strokeStyle = 'rgba(184, 150, 118, 0.14)';
  ctx.lineWidth = 1;
  for (let y = wallTop; y <= wallBottom; y += tileH) {
    ctx.beginPath();
    ctx.moveTo(wallLeft, y);
    ctx.lineTo(dividerX, y);
    ctx.stroke();
  }
  for (let x = wallLeft; x <= dividerX; x += tileW) {
    ctx.beginPath();
    ctx.moveTo(x, wallTop);
    ctx.lineTo(x, wallBottom);
    ctx.stroke();
  }

  // Cozy center living room rug (accented to species!)
  ctx.save();
  ctx.fillStyle = state.species.softBg;
  ctx.strokeStyle = state.species.accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(246, 280, 232, 134, 24);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.roundRect(256, 290, 212, 114, 18);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ================= OUTDOOR BACKYARD LAWN =================
  const yardW = wallRight - yardLeft;
  const grassH = 44;
  for (let row = 0; row * grassH < wallBottom - wallTop + grassH; row++) {
    ctx.fillStyle = row % 2 === 0 ? '#b7e49e' : '#a8db8d';
    ctx.fillRect(yardLeft, wallTop + row * grassH, yardW + 40, grassH);
  }

  // Stepping stones leading from patio door into the backyard
  const stones = [
    { x: yardLeft + 26, y: 366, rx: 18, ry: 12 },
    { x: yardLeft + 68, y: 356, rx: 16, ry: 11 },
    { x: yardLeft + 114, y: 364, rx: 17, ry: 11 },
    { x: yardLeft + 152, y: 320, rx: 14, ry: 10 },
    { x: yardLeft + 152, y: 408, rx: 14, ry: 10 },
  ];
  for (const st of stones) {
    ctx.fillStyle = '#e7dfd3';
    ctx.strokeStyle = '#c9bba8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(st.x, st.y, st.rx, st.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Cute backyard wildflowers
  const flowers = [
    { x: 760, y: 274, c: '#ff8fab' },
    { x: 966, y: 266, c: '#ffe066' },
    { x: 974, y: 392, c: '#c77dff' },
    { x: 758, y: 452, c: '#ffe066' },
    { x: 966, y: 562, c: '#ff8fab' },
  ];
  for (const f of flowers) {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(f.x, f.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // ================= INDOOR BACK WALL (45-deg elevation) =================
  const wallGrad = ctx.createLinearGradient(0, 0, 0, wallTop);
  wallGrad.addColorStop(0, '#ffe6ef');
  wallGrad.addColorStop(0.7, '#fff2f6');
  wallGrad.addColorStop(1, '#f3d9c6');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, dividerX + dividerW / 2, wallTop);

  // Subtle pastel wallpaper stripes
  ctx.fillStyle = 'rgba(255, 196, 217, 0.22)';
  for (let sx = 0; sx < dividerX; sx += 34) {
    ctx.fillRect(sx, 0, 17, wallTop - 18);
  }

  // Wainscoting & wooden baseboard
  ctx.fillStyle = '#ebd2bc';
  ctx.fillRect(0, wallTop - 20, dividerX + dividerW / 2, 20);
  ctx.fillStyle = '#d3b296';
  ctx.fillRect(0, wallTop - 22, dividerX + dividerW / 2, 3);
  ctx.fillRect(0, wallTop - 3, dividerX + dividerW / 2, 3);

  // Back wall sky windows
  drawBackWindow(ctx, 114, 22, 82, 60);
  drawBackWindow(ctx, 540, 22, 82, 60);

  // Cozy house banner sign
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ff8fab';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(244, 16, 248, 44, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#5c2d3e';
  ctx.font = '800 16px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🐾 ${state.petName.toUpperCase()}'S HOME 🐾`, 368, 39);
  ctx.restore();

  // Festive pastel bunting flags
  const flagColors = ['#ff8fab', '#72efdd', '#ffe066', '#c77dff', '#74c0fc'];
  for (let i = 0; i < 6; i++) {
    drawPennant(ctx, 46 + i * 32, 13, flagColors[i % flagColors.length]);
    drawPennant(ctx, 514 + i * 32, 13, flagColors[(i + 2) % flagColors.length]);
  }

  // ================= OUTDOOR BACK SKY & WHITE PICKET FENCE =================
  const skyGrad = ctx.createLinearGradient(0, 0, 0, wallTop);
  skyGrad.addColorStop(0, '#7dd3fc');
  skyGrad.addColorStop(1, '#dcfce7');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(dividerX + dividerW / 2, 0, width - dividerX, wallTop);

  // Warm sun in upper right corner
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(964, 34, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(253, 224, 71, 0.28)';
  ctx.beginPath();
  ctx.arc(964, 34, 34, 0, Math.PI * 2);
  ctx.fill();

  // Soft outdoor cloud
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.arc(816, 36, 14, 0, Math.PI * 2);
  ctx.arc(834, 32, 17, 0, Math.PI * 2);
  ctx.arc(852, 36, 13, 0, Math.PI * 2);
  ctx.fill();

  // Cute white picket fence across backyard top edge
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(yardLeft - 4, wallTop - 32, yardW + 30, 6);
  ctx.fillRect(yardLeft - 4, wallTop - 14, yardW + 30, 6);
  for (let fx = yardLeft + 4; fx < width - 10; fx += 22) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fx, wallTop);
    ctx.lineTo(fx, wallTop - 42);
    ctx.lineTo(fx + 7, wallTop - 50);
    ctx.lineTo(fx + 14, wallTop - 42);
    ctx.lineTo(fx + 14, wallTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Outdoor yard sign badge
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.strokeStyle = '#86efac';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(806, 62, 114, 26, 999);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#166534';
  ctx.font = '800 11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌿 BACKYARD', 863, 75);
  ctx.restore();

  // ================= SIDE WALLS & HOUSE/YARD PARTITION =================
  // Left interior wall
  ctx.fillStyle = '#f2dcc7';
  ctx.fillRect(0, wallTop, wallLeft, height - wallTop);
  ctx.fillStyle = '#d9bc9f';
  ctx.fillRect(wallLeft - 5, wallTop, 5, wallBottom - wallTop);

  // Right backyard border fence strip
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(wallRight, wallTop, width - wallRight, height - wallTop);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(wallRight, wallTop, 4, wallBottom - wallTop);

  // Partition wall between Indoor House and Outdoor Backyard (with patio doorway gap!)
  ctx.fillStyle = '#ebd2bc';
  ctx.fillRect(dividerX, 0, dividerW, patioDoorTop);
  ctx.fillRect(dividerX, patioDoorBottom, dividerW, height - patioDoorBottom);

  ctx.fillStyle = '#cfa987';
  ctx.fillRect(dividerX, 0, 4, patioDoorTop);
  ctx.fillRect(dividerX + dividerW - 4, 0, 4, patioDoorTop);
  ctx.fillRect(dividerX, patioDoorBottom, 4, height - patioDoorBottom);
  ctx.fillRect(dividerX + dividerW - 4, patioDoorBottom, 4, height - patioDoorBottom);

  // Patio doorway wood threshold & welcome mat
  ctx.fillStyle = '#d9bc9f';
  ctx.fillRect(dividerX, patioDoorTop, dividerW, patioDoorBottom - patioDoorTop);
  ctx.fillStyle = '#a47551';
  ctx.fillRect(dividerX - 2, patioDoorTop - 6, dividerW + 4, 8);
  ctx.fillRect(dividerX - 2, patioDoorBottom - 2, dividerW + 4, 8);

  // Patio mat on indoor side of doorway
  ctx.fillStyle = '#ff8fab';
  ctx.beginPath();
  ctx.roundRect(dividerX - 38, (patioDoorTop + patioDoorBottom) / 2 - 42, 32, 84, 8);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(dividerX - 34, (patioDoorTop + patioDoorBottom) / 2 - 38, 24, 76);
  ctx.setLineDash([]);

  // Soft floor shadow along back wall
  const shadowTop = ctx.createLinearGradient(0, wallTop, 0, wallTop + 22);
  shadowTop.addColorStop(0, 'rgba(61, 44, 46, 0.14)');
  shadowTop.addColorStop(1, 'rgba(61, 44, 46, 0)');
  ctx.fillStyle = shadowTop;
  ctx.fillRect(wallLeft, wallTop, dividerX - wallLeft, 22);

  ctx.restore();

  // Outer diorama frame border
  ctx.strokeStyle = '#cfa987';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(2, 2, width - 4, height - 4, 18);
  ctx.stroke();
}

function drawBackWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, '#bae6fd');
  sky.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = sky;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x + 26, y + 24, 9, 0, Math.PI * 2);
  ctx.arc(x + 38, y + 22, 11, 0, Math.PI * 2);
  ctx.arc(x + 50, y + 25, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  ctx.restore();
}

function drawPennant(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 9, y);
  ctx.lineTo(x + 9, y);
  ctx.lineTo(x, y + 13);
  ctx.closePath();
  ctx.fill();
}

function drawFrontLipFrame(ctx: CanvasRenderingContext2D) {
  const { width, height, wallBottom, dividerX, dividerW } = WORLD;
  ctx.fillStyle = '#e8cfb8';
  ctx.fillRect(0, wallBottom, dividerX + dividerW, height - wallBottom);
  ctx.fillStyle = '#cfa987';
  ctx.fillRect(0, wallBottom, dividerX + dividerW, 5);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(dividerX + dividerW, wallBottom, width - (dividerX + dividerW), height - wallBottom);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(dividerX + dividerW, wallBottom, width - (dividerX + dividerW), 4);
}

function drawStation(
  ctx: CanvasRenderingContext2D,
  station: WorldStation,
  needValue: number,
  isHighlighted: boolean,
  time: number
) {
  const { x, y, w, h, depthHeight, accent, area, need } = station;
  const isUrgent = needValue < 35;

  // Ground shadow (45-deg light offset)
  ctx.fillStyle = 'rgba(61, 44, 46, 0.16)';
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 8, w, h + 4, 14);
  ctx.fill();

  const topY = y - depthHeight * 0.45;
  const frontY = topY + h * 0.62;
  const frontH = y + h - frontY;

  // Front vertical cabinet/base face
  ctx.fillStyle = area === 'outdoor' ? '#b08968' : '#e5c1a1';
  ctx.beginPath();
  ctx.roundRect(x, frontY, w, frontH, [4, 4, 12, 12]);
  ctx.fill();

  // Pastel accent panel on front face
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(x + 8, frontY + 5, w - 16, Math.max(8, frontH - 10), 6);
  ctx.fill();

  // Top 45-degree surface
  ctx.fillStyle = area === 'outdoor' ? '#ecfccb' : '#fffdf9';
  ctx.strokeStyle = isHighlighted ? '#ff6b9d' : isUrgent ? '#ef4444' : '#d6b89c';
  ctx.lineWidth = isHighlighted ? 3.5 : isUrgent ? 2.8 : 2;
  ctx.beginPath();
  ctx.roundRect(x, topY, w, h * 0.72, 12);
  ctx.fill();
  ctx.stroke();

  // Subtle glow ring when hovered or nearby
  if (isHighlighted) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 107, 157, 0.45)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(x - 3, topY - 3, w + 6, h * 0.72 + frontH * 0.4 + 6, 15);
    ctx.stroke();
    ctx.restore();
  }

  // Draw custom visual props on the station top
  drawStationProp(ctx, need.stationVisual, x + w / 2, topY + h * 0.36, need.emoji);

  // Station title pill
  ctx.save();
  ctx.fillStyle = 'rgba(61, 44, 46, 0.86)';
  ctx.beginPath();
  ctx.roundRect(x + 10, y + h - 18, w - 20, 20, 999);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 10.5px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(need.stationTitle, x + w / 2, y + h - 8);
  ctx.restore();

  // Live Need Progress Bar right above the station
  const barW = w - 26;
  const barX = x + 13;
  const barY = topY - 12;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = '#d6c2ae';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 8, 999);
  ctx.fill();
  ctx.stroke();

  const fillColor = needValue >= 65 ? '#16a34a' : needValue >= 35 ? '#f59e0b' : '#ef4444';
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.roundRect(barX + 1.5, barY + 1.5, Math.max(4, ((barW - 3) * needValue) / 100), 5, 999);
  ctx.fill();

  // Urgent pulsing alert badge if low!
  if (isUrgent) {
    const pulse = 1 + Math.sin(time * 8) * 0.12;
    ctx.save();
    ctx.translate(x + w - 10, topY - 8);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 0.5);
    ctx.restore();
  }
}

function drawStationProp(
  ctx: CanvasRenderingContext2D,
  kind: StationVisualKind,
  cx: number,
  cy: number,
  emoji: string
) {
  ctx.save();
  // Soft tinted mat/base under the prop
  const tintMap: Partial<Record<StationVisualKind, string>> = {
    food_bowl: '#ffedd5',
    water_bowl: '#dbeafe',
    fountain: '#bae6fd',
    mist_terrarium: '#dcfce7',
    uvb_lamp: '#fef08a',
    soak_pool: '#cffafe',
    potty_lawn: '#bbf7d0',
    climb_play: '#fde68a',
    cozy_rug: '#fce7f3',
  };
  ctx.fillStyle = tintMap[kind] || '#f5ebe0';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 34, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '24px "Segoe UI Emoji", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, cx, cy);
  ctx.restore();
}

function drawPlayerCharacter(
  ctx: CanvasRenderingContext2D,
  player: RenderWorldState['player']
) {
  const { x, y, facing, walkPhase, gender } = player;
  const bob = Math.abs(Math.sin(walkPhase)) * 3.2;
  const stride = Math.sin(walkPhase) * 3.5;
  const facingBack = facing === 'up';

  const colors =
    gender === 'female'
      ? {
          hair: '#5c3a21',
          skin: '#ffd7ba',
          outfit: '#ff6b9d',
          apron: '#ffffff',
          pants: '#4a4e69',
          accent: '#ff8fab',
        }
      : {
          hair: '#3b2820',
          skin: '#f6c8a8',
          outfit: '#2ec4b6',
          apron: '#ffffff',
          pants: '#3d405b',
          accent: '#56cfe1',
        };

  ctx.save();
  ctx.translate(x, y);

  // Soft ground shadow
  ctx.fillStyle = 'rgba(61, 44, 46, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Player indicator ring (slime-store cue!)
  ctx.strokeStyle = 'rgba(255, 107, 157, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 2, 20, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.translate(0, -bob);

  // Shoes
  ctx.fillStyle = '#3d2c2e';
  ctx.beginPath();
  ctx.ellipse(-5.5, -1 + stride * 0.4, 4.5, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(5.5, -1 - stride * 0.4, 4.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = colors.pants;
  ctx.fillRect(-8, -11, 6, 10);
  ctx.fillRect(2, -11, 6, 10);

  // Torso
  ctx.fillStyle = colors.outfit;
  ctx.strokeStyle = 'rgba(61, 44, 46, 0.35)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (gender === 'female') {
    ctx.moveTo(-10, -29);
    ctx.lineTo(10, -29);
    ctx.lineTo(13, -9);
    ctx.lineTo(-13, -9);
    ctx.closePath();
  } else {
    ctx.roundRect(-11, -29, 22, 20, 6);
  }
  ctx.fill();
  ctx.stroke();

  // Cute Caregiver Apron / Pocket
  if (!facingBack) {
    ctx.fillStyle = colors.apron;
    ctx.beginPath();
    ctx.roundRect(-7, -25, 14, 15, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(61, 44, 46, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.strokeStyle = colors.apron;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(10, -18);
    ctx.stroke();
  }

  // Hands
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(-13, -20, 3.6, 0, Math.PI * 2);
  ctx.arc(13, -20, 3.6, 0, Math.PI * 2);
  ctx.fill();

  if (facingBack) {
    // Rear-view head & hair (slime-store style)
    ctx.fillStyle = colors.hair;
    ctx.strokeStyle = 'rgba(61, 44, 46, 0.34)';
    ctx.lineWidth = 1.6;
    if (gender === 'female') {
      ctx.beginPath();
      ctx.arc(0, -40, 15, Math.PI, Math.PI * 2);
      ctx.lineTo(15, -27);
      ctx.quadraticCurveTo(0, -24, -15, -27);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -35, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.ellipse(-4.5, -42, 5, 3, -0.25, 0, Math.PI * 2);
      ctx.ellipse(4.5, -42, 5, 3, 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, -41, 14.5, Math.PI * 0.85, Math.PI * 2.15);
      ctx.lineTo(11, -30);
      ctx.quadraticCurveTo(0, -28.5, -11, -30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(0, -44, 14, Math.PI * 0.96, Math.PI * 2.04);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    if (gender === 'female') {
      ctx.fillStyle = colors.hair;
      ctx.beginPath();
      ctx.ellipse(0, -37, 17, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      const ponyX = facing === 'left' ? 15 : facing === 'right' ? -15 : 15;
      ctx.beginPath();
      ctx.arc(ponyX, -36, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head
    ctx.fillStyle = colors.skin;
    ctx.strokeStyle = 'rgba(61, 44, 46, 0.32)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -40, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair top
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.arc(0, -43, 14.2, Math.PI, Math.PI * 2);
    ctx.lineTo(13, -38);
    ctx.quadraticCurveTo(0, -42, -13, -38);
    ctx.closePath();
    ctx.fill();

    if (gender === 'female') {
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.ellipse(-6, -53, 5, 3.2, -0.3, 0, Math.PI * 2);
      ctx.ellipse(2, -53, 5, 3.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(0, -46, 13.5, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d7874';
      const brimShift = facing === 'left' ? -4 : 4;
      ctx.beginPath();
      ctx.ellipse(brimShift, -46, 13, 3.5, 0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyes, rosy cheeks & happy smile
    const eyeShiftX = facing === 'left' ? -3 : facing === 'right' ? 3 : 0;
    ctx.fillStyle = '#3d2c2e';
    ctx.beginPath();
    ctx.arc(-4.5 + eyeShiftX, -38.5, 1.9, 0, Math.PI * 2);
    ctx.arc(4.5 + eyeShiftX, -38.5, 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 117, 143, 0.38)';
    ctx.beginPath();
    ctx.ellipse(-7.5 + eyeShiftX, -35.5, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.ellipse(7.5 + eyeShiftX, -35.5, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3d2c2e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(eyeShiftX, -35.5, 2.8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEffects(
  ctx: CanvasRenderingContext2D,
  sparkles: Sparkle[],
  floatingTexts: FloatingText[]
) {
  for (const s of sparkles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const ft of floatingTexts) {
    const alpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '800 15px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}
