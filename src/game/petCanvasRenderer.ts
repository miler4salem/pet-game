import { Facing, PetMood, SpeciesId } from '../types/pet';

export interface DrawPetParams {
  speciesId: SpeciesId;
  x: number;
  y: number;
  facing: Facing;
  walkPhase: number;
  mood: PetMood;
  happyTimer: number;
  thoughtEmoji?: string | null;
  time: number;
}

export function drawPetCharacter(ctx: CanvasRenderingContext2D, params: DrawPetParams): void {
  const { speciesId, x, y, facing, walkPhase, mood, happyTimer, thoughtEmoji, time } = params;

  const isMoving = walkPhase > 0;
  const isHappyBounce = happyTimer > 0;
  const bob = isHappyBounce
    ? Math.abs(Math.sin(time * 14)) * 9
    : isMoving
      ? Math.abs(Math.sin(walkPhase)) * (speciesId === 'frog' || speciesId === 'parakeet' ? 7 : 3.5)
      : Math.sin(time * 2.6) * 1.2;

  const flipX = facing === 'left' ? -1 : 1;
  const isJoyful = mood === 'thriving' || isHappyBounce;
  const isSad = mood === 'urgent';

  ctx.save();
  ctx.translate(x, y);

  // Soft ground shadow (45-degree diorama style)
  ctx.fillStyle = 'rgba(61, 44, 46, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 3, speciesId === 'parakeet' || speciesId === 'frog' ? 12 : 16, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(0, -bob);
  ctx.scale(flipX, 1);

  switch (speciesId) {
    case 'dog':
      drawDog(ctx, walkPhase, isJoyful, isSad, time);
      break;
    case 'cat':
      drawCat(ctx, walkPhase, isJoyful, isSad, time);
      break;
    case 'parakeet':
      drawParakeet(ctx, walkPhase, isJoyful, isSad, time);
      break;
    case 'frog':
      drawFrog(ctx, walkPhase, isJoyful, isSad);
      break;
    case 'bearded_dragon':
      drawBeardedDragon(ctx, walkPhase, isJoyful, isSad);
      break;
    case 'pygmy_goat':
      drawPygmyGoat(ctx, walkPhase, isJoyful, isSad, time);
      break;
  }

  ctx.restore();

  // Thought bubble when a need is getting low (slime-store style)
  if (thoughtEmoji) {
    const floatY = Math.sin(time * 3.5) * 2.5;
    ctx.save();
    ctx.translate(0, -48 + floatY);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = isSad ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -14, 36, 24, 11);
    ctx.fill();
    ctx.stroke();

    // Little speech tail dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 14, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '14px "Segoe UI Emoji", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(thoughtEmoji, 0, -1.5);
    ctx.restore();
  }

  ctx.restore();
}

function drawDog(
  ctx: CanvasRenderingContext2D,
  walkPhase: number,
  isJoyful: boolean,
  isSad: boolean,
  time: number
) {
  const stride = Math.sin(walkPhase) * 3;
  const wag = isSad ? 0 : Math.sin(time * 12) * 0.35;

  // Tail
  ctx.save();
  ctx.translate(-14, -14);
  ctx.rotate(-0.4 + wag);
  ctx.strokeStyle = '#d99536';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, -8, -4, -14);
  ctx.stroke();
  ctx.restore();

  // Legs
  ctx.fillStyle = '#d99536';
  ctx.beginPath();
  ctx.roundRect(-11 + stride * 0.5, -7, 5, 9, 2.5);
  ctx.roundRect(5 - stride * 0.5, -7, 5, 9, 2.5);
  ctx.fill();

  // Body
  ctx.fillStyle = '#f2b857';
  ctx.strokeStyle = 'rgba(61, 44, 46, 0.38)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(-2, -13, 15, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Red collar + gold tag
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(4, -20);
  ctx.lineTo(12, -15);
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(11, -13, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#f5c26b';
  ctx.strokeStyle = 'rgba(61, 44, 46, 0.38)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(9, -24, 11.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Floppy ear
  ctx.fillStyle = '#d48c2c';
  ctx.beginPath();
  ctx.ellipse(2, -22, 4.5, 8.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout + nose
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.ellipse(17, -21, 5.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d2c2e';
  ctx.beginPath();
  ctx.ellipse(20.5, -22.5, 2.6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  if (isJoyful) {
    ctx.strokeStyle = '#3d2c2e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(13, -26, 2.5, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#3d2c2e';
    ctx.beginPath();
    ctx.arc(13, -26, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Happy tongue
  if (isJoyful) {
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(18, -17, 2.2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCat(
  ctx: CanvasRenderingContext2D,
  walkPhase: number,
  isJoyful: boolean,
  isSad: boolean,
  time: number
) {
  const stride = Math.sin(walkPhase) * 2.5;
  const sway = isSad ? 0 : Math.sin(time * 5) * 0.25;

  // Tail
  ctx.save();
  ctx.translate(-13, -13);
  ctx.rotate(sway);
  ctx.strokeStyle = '#ea7c31';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10, -10, -4, -20);
  ctx.stroke();
  ctx.restore();

  // Paws
  ctx.fillStyle = '#fff0df';
  ctx.beginPath();
  ctx.roundRect(-10 + stride * 0.5, -6, 4.5, 8, 2);
  ctx.roundRect(5 - stride * 0.5, -6, 4.5, 8, 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#f59247';
  ctx.strokeStyle = 'rgba(61, 44, 46, 0.36)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-1, -12, 13.5, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ears
  ctx.fillStyle = '#f59247';
  ctx.beginPath();
  ctx.moveTo(2, -29);
  ctx.lineTo(4, -39);
  ctx.lineTo(10, -31);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(11, -31);
  ctx.lineTo(17, -38);
  ctx.lineTo(18, -28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(10, -23, 10.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tabby stripes
  ctx.strokeStyle = '#c2571a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(8, -32);
  ctx.lineTo(9, -29);
  ctx.moveTo(12, -32);
  ctx.lineTo(12, -29);
  ctx.stroke();

  // Eye & pink nose
  if (isJoyful) {
    ctx.strokeStyle = '#3d2c2e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(13.5, -24, 2.2, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(13.5, -24, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(13.8, -24, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(19, -21.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawParakeet(
  ctx: CanvasRenderingContext2D,
  walkPhase: number,
  isJoyful: boolean,
  _isSad: boolean,
  time: number
) {
  const flutter = walkPhase > 0 || isJoyful ? Math.sin(time * 22) * 4 : 0;

  // Tail feathers
  ctx.fillStyle = '#0369a1';
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.lineTo(-19, -4);
  ctx.lineTo(-15, -1);
  ctx.lineTo(-3, -8);
  ctx.closePath();
  ctx.fill();

  // Feet
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, -6);
  ctx.lineTo(-2, 1);
  ctx.moveTo(4, -6);
  ctx.lineTo(4, 1);
  ctx.stroke();

  // Body
  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = 'rgba(61, 44, 46, 0.36)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(1, -15, 10, 12, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wing
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.ellipse(-2, -15 - flutter * 0.3, 6.5, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Yellow Head
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(6, -27, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Beak
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(13, -27);
  ctx.lineTo(19, -24);
  ctx.lineTo(13, -22);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(9, -28, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrog(
  ctx: CanvasRenderingContext2D,
  walkPhase: number,
  isJoyful: boolean,
  isSad: boolean
) {
  const stretch = walkPhase > 0 ? 1.08 : 1;

  ctx.save();
  ctx.scale(stretch, 1 / stretch);

  // Back leg
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.ellipse(-8, -7, 7, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Round green body
  ctx.fillStyle = '#4ade80';
  ctx.strokeStyle = 'rgba(20, 83, 45, 0.45)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -11, 13, 10.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belly highlight
  ctx.fillStyle = '#dcfce7';
  ctx.beginPath();
  ctx.ellipse(2, -8, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Golden bulging frog eyes
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(-4, -21, 5.5, 0, Math.PI * 2);
  ctx.arc(7, -21, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(-4, -21, 3.8, 0, Math.PI * 2);
  ctx.arc(7, -21, 3.8, 0, Math.PI * 2);
  ctx.fill();

  if (isJoyful) {
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-4, -20.5, 2, Math.PI, Math.PI * 2);
    ctx.arc(7, -20.5, 2, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-3.5, -21, 2, 0, Math.PI * 2);
    ctx.arc(7.5, -21, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smile
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (isSad) {
    ctx.arc(4, -12, 4, Math.PI * 1.15, Math.PI * 1.85);
  } else {
    ctx.arc(4, -15, 4.5, 0.15 * Math.PI, 0.85 * Math.PI);
  }
  ctx.stroke();

  // Yellow toe pads
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(9, -2, 2.2, 0, Math.PI * 2);
  ctx.arc(-9, -2, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBeardedDragon(
  ctx: CanvasRenderingContext2D,
  walkPhase: number,
  isJoyful: boolean,
  isSad: boolean
) {
  const wiggle = Math.sin(walkPhase) * 2.5;

  // Tail
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.quadraticCurveTo(-24, -7 + wiggle, -28, -11);
  ctx.stroke();

  // Legs
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(-9, 1);
  ctx.moveTo(6, -6);
  ctx.lineTo(10, 1);
  ctx.stroke();

  // Pancake body
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = 'rgba(69, 26, 3, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-1, -10, 15, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Beard (darkens when stressed!)
  ctx.fillStyle = isSad ? '#44403c' : '#fb923c';
  ctx.beginPath();
  ctx.ellipse(12, -13, 6, 4.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Triangular head
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(6, -22);
  ctx.lineTo(22, -17);
  ctx.lineTo(14, -10);
  ctx.lineTo(5, -13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eye
  if (isJoyful) {
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(13, -17.5, 2, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(13, -17.5, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(13.5, -17.5, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPygmyGoat(
  ctx: CanvasRenderingContext2D,
  walkPhase: number,
  isJoyful: boolean,
  isSad: boolean,
  time: number
) {
  const stride = Math.sin(walkPhase) * 3;
  const wag = isSad ? 0 : Math.sin(time * 13) * 0.35;

  // Little upright tail
  ctx.save();
  ctx.translate(-14, -17);
  ctx.rotate(wag);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-4, -8);
  ctx.stroke();
  ctx.restore();

  // Legs + dark hooves
  ctx.fillStyle = '#f5e6d3';
  ctx.fillRect(-10 + stride * 0.5, -9, 4.5, 8);
  ctx.fillRect(5 - stride * 0.5, -9, 4.5, 8);
  ctx.fillStyle = '#292524';
  ctx.fillRect(-10 + stride * 0.5, -3, 4.5, 4);
  ctx.fillRect(5 - stride * 0.5, -3, 4.5, 4);

  // Body
  ctx.fillStyle = '#d6b48e';
  ctx.strokeStyle = 'rgba(61, 44, 46, 0.38)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(-1, -15, 14.5, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Caramel saddle patch
  ctx.fillStyle = 'rgba(161, 98, 7, 0.55)';
  ctx.beginPath();
  ctx.ellipse(-3, -17, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Horns
  ctx.strokeStyle = '#78716c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(7, -33);
  ctx.quadraticCurveTo(3, -41, 0, -40);
  ctx.moveTo(11, -33);
  ctx.quadraticCurveTo(10, -41, 7, -41);
  ctx.stroke();

  // Head
  ctx.fillStyle = '#f5e6d3';
  ctx.beginPath();
  ctx.arc(10, -25, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Goatee
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(13, -16);
  ctx.lineTo(18, -16);
  ctx.lineTo(15.5, -10);
  ctx.closePath();
  ctx.fill();

  // Perky ear
  ctx.fillStyle = '#a16207';
  ctx.beginPath();
  ctx.ellipse(2, -28, 5, 2.5, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Pink snout
  ctx.fillStyle = '#fecdd3';
  ctx.beginPath();
  ctx.ellipse(18, -22, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  if (isJoyful) {
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(13, -26.5, 2, Math.PI, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(13, -26.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(11.3, -27.2, 3.4, 1.4);
  }
}
