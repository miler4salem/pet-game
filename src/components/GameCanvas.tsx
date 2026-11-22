import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Facing,
  NeedDefinition,
  PetInstance,
  PetMood,
  PlayerGender,
  SpeciesProfile,
  StationSlotId,
} from '../types/pet';
import {
  WORLD,
  WorldStation,
  buildWorldStations,
  getStationInteractPoint,
} from '../game/worldConfig';
import {
  FloatingText,
  Sparkle,
  getWorldTransform,
  renderWorld,
} from '../game/worldRenderer';

export interface GameCanvasHandle {
  walkToStation: (slotId: StationSlotId) => void;
}

interface GameCanvasProps {
  pet: PetInstance;
  species: SpeciesProfile;
  gender: PlayerGender;
  disabled: boolean;
  onPerformNeedAction: (need: NeedDefinition) => boolean;
  onPetAffection: () => void;
}

const PLAYER_SPEED = 235;
const PET_SPEED = 185;
const PLAYER_RADIUS = 16;
const PET_RADIUS = 14;

function updateFacing(dx: number, dy: number, fallback: Facing): Facing {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return fallback;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left' : 'right';
  }
  return dy < 0 ? 'up' : 'down';
}

function resolveEntityCollision(
  entity: { x: number; y: number },
  radius: number,
  stations: WorldStation[]
) {
  // Outer bounds
  entity.x = Math.max(WORLD.wallLeft + radius, Math.min(WORLD.wallRight - radius, entity.x));
  entity.y = Math.max(WORLD.wallTop + radius, Math.min(WORLD.wallBottom - radius, entity.y));

  // Partition wall between indoor house and backyard (solid except in patio doorway)
  const inDoorGap =
    entity.y >= WORLD.patioDoorTop + radius * 0.5 &&
    entity.y <= WORLD.patioDoorBottom - radius * 0.5;

  if (!inDoorGap) {
    const wallLeft = WORLD.dividerX;
    const wallRight = WORLD.dividerX + WORLD.dividerW;
    if (entity.x + radius > wallLeft && entity.x - radius < wallRight) {
      const distToLeft = Math.abs(entity.x - wallLeft);
      const distToRight = Math.abs(entity.x - wallRight);
      if (distToLeft < distToRight) {
        entity.x = wallLeft - radius;
      } else {
        entity.x = wallRight + radius;
      }
    }
  }

  // Push out of station rectangles
  for (const s of stations) {
    const padYTop = s.y + 4;
    const padYBot = s.y + s.h;
    const closestX = Math.max(s.x, Math.min(entity.x, s.x + s.w));
    const closestY = Math.max(padYTop, Math.min(entity.y, padYBot));
    const dx = entity.x - closestX;
    const dy = entity.y - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = radius - dist;
      entity.x += (dx / dist) * overlap;
      entity.y += (dy / dist) * overlap;
    }
  }
}

function buildWaypoints(fromX: number, _fromY: number, toX: number, toY: number) {
  const doorMidX = WORLD.dividerX + WORLD.dividerW / 2;
  const doorMidY = (WORLD.patioDoorTop + WORLD.patioDoorBottom) / 2;
  const fromIndoor = fromX < doorMidX;
  const toIndoor = toX < doorMidX;

  if (fromIndoor !== toIndoor) {
    // Route cleanly through the patio doorway!
    return [
      { x: fromIndoor ? WORLD.dividerX - 24 : WORLD.dividerX + WORLD.dividerW + 24, y: doorMidY },
      { x: toIndoor ? WORLD.dividerX - 24 : WORLD.dividerX + WORLD.dividerW + 24, y: doorMidY },
      { x: toX, y: toY },
    ];
  }
  return [{ x: toX, y: toY }];
}

export const GameCanvas = React.forwardRef<GameCanvasHandle, GameCanvasProps>(
  ({ pet, species, gender, disabled, onPerformNeedAction, onPetAffection }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [nearbyStation, setNearbyStation] = useState<WorldStation | null>(null);

    const stations = useMemo(() => buildWorldStations(species), [species]);

    // Mutable simulation state stored in ref for 60fps loop without React re-render churn
    const simRef = useRef({
      time: 0,
      player: {
        x: 368,
        y: 344,
        facing: 'down' as Facing,
        walkPhase: 0,
        waypoints: [] as Array<{ x: number; y: number }>,
        pendingSlotId: null as StationSlotId | null,
      },
      pet: {
        x: 316,
        y: 356,
        facing: 'right' as Facing,
        walkPhase: 0,
        happyTimer: 0,
      },
      hoverSlotId: null as string | null,
      nearbySlotId: null as string | null,
      sparkles: [] as Sparkle[],
      floatingTexts: [] as FloatingText[],
      keys: new Set<string>(),
    });

    // Latest props in ref so animation loop always reads fresh values
    const propsRef = useRef({
      pet,
      species,
      gender,
      disabled,
      stations,
      onPerformNeedAction,
      onPetAffection,
    });
    propsRef.current = {
      pet,
      species,
      gender,
      disabled,
      stations,
      onPerformNeedAction,
      onPetAffection,
    };

    const spawnSparkles = (x: number, y: number, count = 12) => {
      const colors = ['#ff8fab', '#72efdd', '#ffe066', '#c77dff', '#4ade80'];
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const spd = 35 + Math.random() * 60;
        simRef.current.sparkles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 24,
          r: 2.5 + Math.random() * 2.5,
          color: colors[i % colors.length],
          life: 0.7 + Math.random() * 0.35,
          maxLife: 1.0,
        });
      }
    };

    const spawnFloatingText = (x: number, y: number, text: string, color = '#16a34a') => {
      simRef.current.floatingTexts.push({
        x,
        y,
        text,
        color,
        life: 1.45,
        maxLife: 1.45,
      });
    };

    const triggerStationCare = (station: WorldStation) => {
      const didCare = propsRef.current.onPerformNeedAction(station.need);
      if (didCare) {
        simRef.current.pet.happyTimer = 1.1;
        spawnSparkles(station.x + station.w / 2, station.y + 12, 14);
        spawnSparkles(simRef.current.pet.x, simRef.current.pet.y - 20, 8);
        spawnFloatingText(
          station.x + station.w / 2,
          station.y - 16,
          `${station.need.emoji} +${station.need.restoreAmount}% ${station.need.label}`,
          '#15803d'
        );
      } else {
        spawnFloatingText(
          station.x + station.w / 2,
          station.y - 16,
          'Just a moment...',
          '#b45309'
        );
      }
    };

    const triggerPetAffection = () => {
      propsRef.current.onPetAffection();
      simRef.current.pet.happyTimer = 1.0;
      spawnSparkles(simRef.current.pet.x, simRef.current.pet.y - 24, 10);
      spawnFloatingText(
        simRef.current.pet.x,
        simRef.current.pet.y - 44,
        '❤️ Loved!',
        '#e05283'
      );
    };

    useImperativeHandle(ref, () => ({
      walkToStation(slotId: StationSlotId) {
        const target = propsRef.current.stations.find((s) => s.slotId === slotId);
        if (!target) return;
        const pt = getStationInteractPoint(target);
        const p = simRef.current.player;
        p.waypoints = buildWaypoints(p.x, p.y, pt.x, pt.y);
        p.pendingSlotId = slotId;
      },
    }));

    // Reset pet position cleanly when switching pets
    useEffect(() => {
      simRef.current.player.waypoints = [];
      simRef.current.player.pendingSlotId = null;
      simRef.current.pet.x = Math.max(80, simRef.current.player.x - 48);
      simRef.current.pet.y = simRef.current.player.y + 12;
      simRef.current.pet.happyTimer = 0.7;
    }, [pet.id]);

    // Keyboard listeners
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (propsRef.current.disabled) return;
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if (
          ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
            e.code
          )
        ) {
          e.preventDefault();
          simRef.current.keys.add(e.code);
        } else if (e.code === 'KeyE') {
          const nearId = simRef.current.nearbySlotId;
          if (nearId) {
            const st = propsRef.current.stations.find((s) => s.slotId === nearId);
            if (st) triggerStationCare(st);
          }
        } else if (e.code === 'Space') {
          e.preventDefault();
          triggerPetAffection();
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        simRef.current.keys.delete(e.code);
      };

      const handleBlur = () => {
        simRef.current.keys.clear();
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleBlur);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleBlur);
      };
    }, []);

    // Main 60fps simulation & render loop
    useEffect(() => {
      let rafId = 0;
      let lastTime = performance.now();

      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        const sim = simRef.current;
        const {
          pet: currentPet,
          species: currentSpecies,
          gender: currentGender,
          disabled: isDisabled,
          stations: currentStations,
        } = propsRef.current;

        sim.time += dt;
        if (sim.pet.happyTimer > 0) {
          sim.pet.happyTimer = Math.max(0, sim.pet.happyTimer - dt);
        }

        // ---- 1. Update Player Movement ----
        const p = sim.player;
        let dx = 0;
        let dy = 0;
        if (!isDisabled) {
          if (sim.keys.has('KeyW') || sim.keys.has('ArrowUp')) dy -= 1;
          if (sim.keys.has('KeyS') || sim.keys.has('ArrowDown')) dy += 1;
          if (sim.keys.has('KeyA') || sim.keys.has('ArrowLeft')) dx -= 1;
          if (sim.keys.has('KeyD') || sim.keys.has('ArrowRight')) dx += 1;
        }

        if (dx !== 0 || dy !== 0) {
          p.waypoints = [];
          p.pendingSlotId = null;
          const len = Math.hypot(dx, dy);
          dx /= len;
          dy /= len;
          p.x += dx * PLAYER_SPEED * dt;
          p.y += dy * PLAYER_SPEED * dt;
          p.walkPhase += dt * 11;
          p.facing = updateFacing(dx, dy, p.facing);
        } else if (p.waypoints.length > 0 && !isDisabled) {
          const wp = p.waypoints[0];
          const tdx = wp.x - p.x;
          const tdy = wp.y - p.y;
          const dist = Math.hypot(tdx, tdy);
          if (dist < 10) {
            p.waypoints.shift();
            if (p.waypoints.length === 0) {
              p.walkPhase = 0;
              if (p.pendingSlotId) {
                const slotId = p.pendingSlotId;
                p.pendingSlotId = null;
                const st = currentStations.find((s) => s.slotId === slotId);
                if (st) triggerStationCare(st);
              }
            }
          } else {
            const mx = tdx / dist;
            const my = tdy / dist;
            p.x += mx * PLAYER_SPEED * dt;
            p.y += my * PLAYER_SPEED * dt;
            p.walkPhase += dt * 11;
            p.facing = updateFacing(mx, my, p.facing);
          }
        } else {
          p.walkPhase = 0;
        }

        resolveEntityCollision(p, PLAYER_RADIUS, currentStations);

        // ---- 2. Update Pet Following AI ----
        const petEntity = sim.pet;
        const doorMidX = WORLD.dividerX + WORLD.dividerW / 2;
        const doorMidY = (WORLD.patioDoorTop + WORLD.patioDoorBottom) / 2;
        const playerIndoor = p.x < doorMidX;
        const petIndoor = petEntity.x < doorMidX;

        // If player and pet are on opposite sides of the patio wall, guide pet through the doorway
        let followX = p.x;
        let followY = p.y;
        const followStopDist = playerIndoor !== petIndoor ? 10 : 52;
        if (playerIndoor !== petIndoor) {
          followX = playerIndoor ? WORLD.dividerX - 18 : WORLD.dividerX + WORLD.dividerW + 18;
          followY = doorMidY;
        }

        const pdx = followX - petEntity.x;
        const pdy = followY - petEntity.y;
        const pdist = Math.hypot(pdx, pdy);

        if (pdist > followStopDist) {
          const speedBoost = pdist > 160 ? 1.28 : 1;
          const mx = pdx / pdist;
          const my = pdy / pdist;
          petEntity.x += mx * PET_SPEED * speedBoost * dt;
          petEntity.y += my * PET_SPEED * speedBoost * dt;
          petEntity.walkPhase += dt * 10;
          petEntity.facing = updateFacing(mx, my, petEntity.facing);
        } else {
          petEntity.walkPhase = 0;
        }

        resolveEntityCollision(petEntity, PET_RADIUS, currentStations);

        // ---- 3. Detect Closest Nearby Station ----
        let nearest: WorldStation | null = null;
        let nearestDist = 80;
        for (const st of currentStations) {
          const cx = Math.max(st.x, Math.min(p.x, st.x + st.w));
          const cy = Math.max(st.y, Math.min(p.y, st.y + st.h));
          const d = Math.hypot(p.x - cx, p.y - cy);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = st;
          }
        }
        const nextNearbyId = nearest ? nearest.slotId : null;
        if (nextNearbyId !== sim.nearbySlotId) {
          sim.nearbySlotId = nextNearbyId;
          setNearbyStation(nearest);
        }

        // ---- 4. Update Particles & Floating Texts ----
        for (let i = sim.sparkles.length - 1; i >= 0; i--) {
          const s = sim.sparkles[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 65 * dt;
          s.life -= dt;
          if (s.life <= 0) sim.sparkles.splice(i, 1);
        }
        for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
          const ft = sim.floatingTexts[i];
          ft.y -= 28 * dt;
          ft.life -= dt;
          if (ft.life <= 0) sim.floatingTexts.splice(i, 1);
        }

        // ---- 5. Compute Pet Mood & Thought Bubble ----
        const vals = currentSpecies.needs.map((n) => ({
          def: n,
          val: currentPet.needs[n.id] ?? 100,
        }));
        const avg = vals.reduce((acc, v) => acc + v.val, 0) / vals.length;
        const lowest = [...vals].sort((a, b) => a.val - b.val)[0];

        let mood: PetMood = 'happy';
        if (lowest.val < 25 || avg < 40) mood = 'urgent';
        else if (lowest.val < 48 || avg < 62) mood = 'needs_care';
        else if (avg >= 82) mood = 'thriving';

        const thoughtEmoji = lowest && lowest.val < 50 ? lowest.def.emoji : null;

        // ---- 6. Render 45-deg Diorama to High-DPI Canvas ----
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          const targetW = Math.max(1, Math.round(rect.width * dpr));
          const targetH = Math.max(1, Math.round(rect.height * dpr));
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.scale(dpr, dpr);
            renderWorld(ctx, rect.width, rect.height, {
              time: sim.time,
              species: currentSpecies,
              petName: currentPet.name,
              needsValues: currentPet.needs,
              stations: currentStations,
              player: {
                x: p.x,
                y: p.y,
                facing: p.facing,
                walkPhase: p.walkPhase,
                gender: currentGender,
              },
              pet: {
                x: petEntity.x,
                y: petEntity.y,
                facing: petEntity.facing,
                walkPhase: petEntity.walkPhase,
                mood,
                happyTimer: petEntity.happyTimer,
                thoughtEmoji,
              },
              hoverSlotId: sim.hoverSlotId,
              nearbySlotId: sim.nearbySlotId,
              sparkles: sim.sparkles,
              floatingTexts: sim.floatingTexts,
            });
            ctx.restore();
          }
        }

        rafId = window.requestAnimationFrame(loop);
      };

      rafId = window.requestAnimationFrame(loop);
      return () => window.cancelAnimationFrame(rafId);
    }, []);

    // Convert client pointer coordinates -> WORLD coordinates
    const clientToWorld = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const { scale, offsetX, offsetY } = getWorldTransform(rect.width, rect.height);
      const wx = (clientX - rect.left - offsetX) / scale;
      const wy = (clientY - rect.top - offsetY) / scale;
      return { wx, wy };
    };

    const findStationAt = (wx: number, wy: number) => {
      for (const s of stations) {
        if (wx >= s.x - 4 && wx <= s.x + s.w + 4 && wy >= s.y - 26 && wy <= s.y + s.h + 6) {
          return s;
        }
      }
      return null;
    };

    const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pt = clientToWorld(e.clientX, e.clientY);
      if (!pt) return;
      const hit = findStationAt(pt.wx, pt.wy);
      simRef.current.hoverSlotId = hit ? hit.slotId : null;
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      const pt = clientToWorld(e.clientX, e.clientY);
      if (!pt) return;

      // Did user click directly on their pet? Give affection!
      const petPos = simRef.current.pet;
      if (Math.hypot(pt.wx - petPos.x, pt.wy - (petPos.y - 14)) < 28) {
        triggerPetAffection();
        return;
      }

      // Did user click on a care station? Walk there and care!
      const hitStation = findStationAt(pt.wx, pt.wy);
      const p = simRef.current.player;
      if (hitStation) {
        const interactPt = getStationInteractPoint(hitStation);
        p.waypoints = buildWaypoints(p.x, p.y, interactPt.x, interactPt.y);
        p.pendingSlotId = hitStation.slotId;
        return;
      }

      // Otherwise walk to clicked floor/yard spot
      const clampedX = Math.max(WORLD.wallLeft + 20, Math.min(WORLD.wallRight - 20, pt.wx));
      const clampedY = Math.max(WORLD.wallTop + 20, Math.min(WORLD.wallBottom - 20, pt.wy));
      p.waypoints = buildWaypoints(p.x, p.y, clampedX, clampedY);
      p.pendingSlotId = null;
    };

    return (
      <div className="viewport-wrap">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          onMouseMove={handlePointerMove}
          onMouseLeave={() => {
            simRef.current.hoverSlotId = null;
          }}
          onClick={handleCanvasClick}
        />

        {nearbyStation && (
          <div className="interact-hint">
            Press <kbd>E</kbd> or Click to <strong>{nearbyStation.need.actionLabel}</strong>{' '}
            ({nearbyStation.need.emoji} {nearbyStation.need.stationTitle})
          </div>
        )}

        <div className="controls-bar">
          <span>
            <kbd>WASD</kbd> / <kbd>Arrows</kbd> Move
          </span>
          <span>•</span>
          <span>Click Station or Need: Walk &amp; Care</span>
          <span>•</span>
          <span>
            <kbd>E</kbd> Use Station
          </span>
          <span>•</span>
          <span>
            <kbd>Space</kbd> Pet {pet.name}
          </span>
        </div>
      </div>
    );
  }
);

GameCanvas.displayName = 'GameCanvas';
