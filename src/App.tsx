import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, FastForward, Pause, Play, Plus, User } from 'lucide-react';
import { SPECIES_MAP } from './data/species';
import {
  NeedDefinition,
  PetInstance,
  PlayerGender,
  SpeciesId,
} from './types/pet';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { AdoptionScreen } from './components/AdoptionScreen';
import { CareGuideModal } from './components/CareGuideModal';

const STORAGE_KEY = 'paws_claws_home_v2';

interface SavedState {
  pets: PetInstance[];
  activePetId: string | null;
  gender: PlayerGender;
}

interface ToastItem {
  id: number;
  text: string;
  tone: 'default' | 'success' | 'warn';
}

function loadSavedState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('paws_claws_sanctuary_v1');
    if (!raw) return { pets: [], activePetId: null, gender: 'female' };
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    const validPets = Array.isArray(parsed.pets)
      ? parsed.pets.filter((p) => Boolean(SPECIES_MAP[p.speciesId]))
      : [];
    const activeId =
      validPets.find((p) => p.id === parsed.activePetId)?.id ?? validPets[0]?.id ?? null;
    const gender: PlayerGender = parsed.gender === 'male' ? 'male' : 'female';
    return { pets: validPets, activePetId: activeId, gender };
  } catch {
    return { pets: [], activePetId: null, gender: 'female' };
  }
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

function getBondLevel(xp: number): { level: number; title: string } {
  const tiers = [
    { min: 0, title: 'New Pal' },
    { min: 60, title: 'Buddy' },
    { min: 160, title: 'Close Friend' },
    { min: 320, title: 'Best Friend' },
    { min: 520, title: 'Soulmate' },
  ];
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (xp >= tiers[i].min) idx = i;
  }
  return { level: idx + 1, title: tiers[idx].title };
}

export const App: React.FC = () => {
  const initial = loadSavedState();
  const [pets, setPets] = useState<PetInstance[]>(initial.pets);
  const [activePetId, setActivePetId] = useState<string | null>(initial.activePetId);
  const [gender, setGender] = useState<PlayerGender>(initial.gender);
  const [isAdopting, setIsAdopting] = useState<boolean>(initial.pets.length === 0);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<0 | 1 | 2>(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [needsCollapsed, setNeedsCollapsed] = useState<boolean>(false);

  const canvasHandleRef = useRef<GameCanvasHandle | null>(null);
  const cooldownsRef = useRef<Record<string, number>>({});

  // Persist state
  useEffect(() => {
    try {
      const payload: SavedState = { pets, activePetId, gender };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [pets, activePetId, gender]);

  const pushToast = useCallback((text: string, tone: ToastItem['tone'] = 'default') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // 1-second simulation tick for species-specific needs decay
  useEffect(() => {
    const timer = window.setInterval(() => {
      // Tick cooldowns
      const cds = cooldownsRef.current;
      for (const k of Object.keys(cds)) {
        cds[k] -= 1;
        if (cds[k] <= 0) delete cds[k];
      }

      if (simSpeed === 0 || isAdopting || showGuide) return;

      setPets((prev) =>
        prev.map((pet) => {
          const sp = SPECIES_MAP[pet.speciesId];
          if (!sp) return pet;
          const factor = pet.id === activePetId ? simSpeed : simSpeed * 0.2;
          const nextNeeds: Record<string, number> = { ...pet.needs };
          for (const n of sp.needs) {
            const cur = nextNeeds[n.id] ?? 100;
            nextNeeds[n.id] = clamp(cur - n.decayPerSecond * factor);
          }
          return {
            ...pet,
            needs: nextNeeds,
            ageDays: pet.ageDays + 0.008 * factor,
          };
        })
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [simSpeed, activePetId, isAdopting, showGuide]);

  const handleAdopt = (speciesId: SpeciesId, name: string) => {
    const species = SPECIES_MAP[speciesId];
    if (!species) return;

    const startingNeeds: Record<string, number> = {};
    species.needs.forEach((n, idx) => {
      startingNeeds[n.id] = 68 + ((idx * 7) % 21);
    });

    const newPet: PetInstance = {
      id: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      speciesId,
      adoptedAt: Date.now(),
      needs: startingNeeds,
      bondXp: 10,
      actionsCompleted: 0,
      ageDays: 0,
      log: [],
    };

    setPets((prev) => [...prev, newPet]);
    setActivePetId(newPet.id);
    setIsAdopting(false);
    cooldownsRef.current = {};
    pushToast(`🏡 Welcome home, ${name} the ${species.name}!`, 'success');
  };

  const handlePerformNeedAction = useCallback(
    (need: NeedDefinition): boolean => {
      if (!activePetId) return false;
      if ((cooldownsRef.current[need.id] ?? 0) > 0) return false;

      cooldownsRef.current[need.id] = need.cooldownSeconds;

      let petNameForToast = '';
      setPets((prev) =>
        prev.map((pet) => {
          if (pet.id !== activePetId) return pet;
          petNameForToast = pet.name;
          const nextNeeds: Record<string, number> = { ...pet.needs };
          const before = nextNeeds[need.id] ?? 50;
          nextNeeds[need.id] = clamp(before + need.restoreAmount);

          if (need.sideEffects) {
            for (const [targetId, delta] of Object.entries(need.sideEffects)) {
              if (targetId in nextNeeds) {
                nextNeeds[targetId] = clamp(nextNeeds[targetId] + delta);
              }
            }
          }

          return {
            ...pet,
            needs: nextNeeds,
            bondXp: pet.bondXp + (before < 50 ? 18 : 12),
            actionsCompleted: pet.actionsCompleted + 1,
          };
        })
      );

      if (petNameForToast) {
        pushToast(`${need.emoji} ${petNameForToast} ${need.actionMessage}`, 'success');
      }
      return true;
    },
    [activePetId, pushToast]
  );

  const handlePetAffection = useCallback(() => {
    if (!activePetId) return;
    setPets((prev) =>
      prev.map((pet) => {
        if (pet.id !== activePetId) return pet;
        const sp = SPECIES_MAP[pet.speciesId];
        if (!sp) return pet;
        const playNeeds = sp.needs.filter((n) => n.category === 'play');
        const social = playNeeds[playNeeds.length - 1];
        const nextNeeds = { ...pet.needs };
        if (social) {
          nextNeeds[social.id] = clamp((nextNeeds[social.id] ?? 50) + 6);
        }
        return {
          ...pet,
          needs: nextNeeds,
          bondXp: pet.bondXp + 4,
        };
      })
    );
  }, [activePetId]);

  const activePet = pets.find((p) => p.id === activePetId) ?? null;
  const activeSpecies = activePet ? SPECIES_MAP[activePet.speciesId] : null;

  const wellness = useMemo(() => {
    if (!activePet || !activeSpecies) return 100;
    const sum = activeSpecies.needs.reduce((acc, n) => acc + (activePet.needs[n.id] ?? 100), 0);
    return Math.round(sum / activeSpecies.needs.length);
  }, [activePet, activeSpecies]);

  const bond = useMemo(
    () => getBondLevel(activePet?.bondXp ?? 0),
    [activePet?.bondXp]
  );

  const cycleSpeed = () => {
    setSimSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 0 : 1));
  };

  return (
    <div id="app">
      {/* Top 60px HUD Bar (slime-store design language) */}
      <header id="hud">
        <div className="hud-left">
          <div className="brand-badge">
            <span className="brand-dot" />
            <span className="brand-title">Paws &amp; Claws</span>
          </div>

          {pets.length > 0 && (
            <div className="pet-pills">
              {pets.map((p) => {
                const sp = SPECIES_MAP[p.speciesId];
                const isCur = p.id === activePetId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`hud-btn pet-switch-btn ${isCur ? 'active-pet' : ''}`}
                    onClick={() => {
                      setActivePetId(p.id);
                      cooldownsRef.current = {};
                    }}
                  >
                    {p.name} <small>({sp?.name.split(' ').pop()})</small>
                  </button>
                );
              })}
            </div>
          )}

          {activePet && (
            <>
              <div className="stat-pill">
                <span className="stat-label">Wellness</span>
                <span
                  className="stat-value"
                  style={{ color: wellness >= 65 ? '#15803d' : wellness >= 35 ? '#b45309' : '#dc2626' }}
                >
                  {wellness}%
                </span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Bond</span>
                <span className="stat-value">
                  Lv.{bond.level} {bond.title}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="hud-right">
          {activeSpecies && (
            <button
              type="button"
              className="hud-btn"
              onClick={() => setShowGuide(true)}
            >
              <BookOpen size={14} /> Care Guide
            </button>
          )}

          <button
            type="button"
            className="hud-btn"
            onClick={cycleSpeed}
            title="Toggle simulation speed"
          >
            {simSpeed === 0 ? (
              <>
                <Pause size={14} /> Paused
              </>
            ) : simSpeed === 1 ? (
              <>
                <Play size={14} /> 1x
              </>
            ) : (
              <>
                <FastForward size={14} /> 2x
              </>
            )}
          </button>

          <button
            type="button"
            className="hud-btn"
            onClick={() => setGender((g) => (g === 'female' ? 'male' : 'female'))}
            title="Switch Caregiver Character"
          >
            <User size={14} /> {gender === 'female' ? 'Girl' : 'Boy'}
          </button>

          <button
            type="button"
            className="hud-btn primary-btn"
            onClick={() => setIsAdopting(true)}
          >
            <Plus size={14} /> Adopt Pet
          </button>
        </div>
      </header>

      {/* Full-Screen 45-Degree World Viewport */}
      <div className="world-stage-shell">
        {activePet && activeSpecies ? (
          <>
            <GameCanvas
              ref={canvasHandleRef}
              pet={activePet}
              species={activeSpecies}
              gender={gender}
              disabled={isAdopting || showGuide}
              onPerformNeedAction={handlePerformNeedAction}
              onPetAffection={handlePetAffection}
            />

            {/* Floating Compact Needs Dock (Click any need to walk right to its station!) */}
            <aside className={`needs-dock ${needsCollapsed ? 'collapsed' : ''}`}>
              <button
                type="button"
                className="needs-dock-header"
                onClick={() => setNeedsCollapsed((c) => !c)}
              >
                <span>
                  {activeSpecies.name} Needs ({activeSpecies.needs.length})
                </span>
                <span className="dock-toggle">{needsCollapsed ? '▸' : '▾'}</span>
              </button>

              {!needsCollapsed && (
                <div className="needs-dock-list">
                  {activeSpecies.needs.map((need) => {
                    const val = Math.round(activePet.needs[need.id] ?? 100);
                    const color = val >= 65 ? '#16a34a' : val >= 35 ? '#f59e0b' : '#ef4444';
                    return (
                      <button
                        key={need.id}
                        type="button"
                        className={`dock-need-row ${val < 35 ? 'urgent' : ''}`}
                        onClick={() => canvasHandleRef.current?.walkToStation(need.stationSlot)}
                        title={`Walk to ${need.stationTitle}`}
                      >
                        <span className="dock-emoji">{need.emoji}</span>
                        <div className="dock-info">
                          <div className="dock-label-line">
                            <span>{need.label}</span>
                            <strong style={{ color }}>{val}%</strong>
                          </div>
                          <div className="dock-bar">
                            <div style={{ width: `${Math.max(3, val)}%`, background: color }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>
          </>
        ) : (
          <div className="empty-backdrop" />
        )}

        {/* Top-Right Floating Toasts (slime-store cue) */}
        <div id="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.tone}`}>
              {t.text}
            </div>
          ))}
        </div>
      </div>

      {/* Adoption Modal */}
      {isAdopting && (
        <AdoptionScreen
          gender={gender}
          onChangeGender={setGender}
          onAdopt={handleAdopt}
          canCancel={pets.length > 0}
          onCancel={() => setIsAdopting(false)}
        />
      )}

      {/* Care Guide Modal */}
      {showGuide && activeSpecies && (
        <CareGuideModal species={activeSpecies} onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
};

export default App;
