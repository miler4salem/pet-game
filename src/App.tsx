import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PawPrint, Plus } from 'lucide-react';
import { SPECIES_MAP } from './data/species';
import {
  ActionEffectType,
  NeedDefinition,
  PetInstance,
  SpeciesId,
} from './types/pet';
import { AdoptionScreen } from './components/AdoptionScreen';
import { CareDashboard } from './components/CareDashboard';

const STORAGE_KEY = 'paws_claws_sanctuary_v1';

interface SavedState {
  pets: PetInstance[];
  activePetId: string | null;
}

function loadSavedState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { pets: [], activePetId: null };
    const parsed = JSON.parse(raw) as SavedState;
    if (!Array.isArray(parsed.pets)) return { pets: [], activePetId: null };
    // Filter out any invalid species just in case
    const validPets = parsed.pets.filter((p) => Boolean(SPECIES_MAP[p.speciesId]));
    const activeId =
      validPets.find((p) => p.id === parsed.activePetId)?.id ?? validPets[0]?.id ?? null;
    return { pets: validPets, activePetId: activeId };
  } catch {
    return { pets: [], activePetId: null };
  }
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

export const App: React.FC = () => {
  const initial = loadSavedState();
  const [pets, setPets] = useState<PetInstance[]>(initial.pets);
  const [activePetId, setActivePetId] = useState<string | null>(initial.activePetId);
  const [isAdopting, setIsAdopting] = useState<boolean>(initial.pets.length === 0);
  const [simSpeed, setSimSpeed] = useState<0 | 1 | 2>(1);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [activeEffect, setActiveEffect] = useState<{
    id: number;
    type: ActionEffectType;
    emoji: string;
  } | null>(null);

  const effectTimerRef = useRef<number | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      const payload: SavedState = { pets, activePetId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [pets, activePetId]);

  // Trigger visual reaction burst on the pet stage
  const triggerEffect = useCallback((type: ActionEffectType, emoji: string) => {
    if (effectTimerRef.current) {
      window.clearTimeout(effectTimerRef.current);
    }
    setActiveEffect({ id: Date.now(), type, emoji });
    effectTimerRef.current = window.setTimeout(() => {
      setActiveEffect(null);
    }, 950);
  }, []);

  // Simulation loop: 1-second tick for needs decay & cooldowns
  useEffect(() => {
    const interval = window.setInterval(() => {
      // Always tick cooldowns down
      setCooldowns((prev) => {
        const keys = Object.keys(prev);
        if (keys.length === 0) return prev;
        const next: Record<string, number> = {};
        let changed = false;
        for (const k of keys) {
          const remaining = prev[k] - 1;
          if (remaining > 0) {
            next[k] = remaining;
          }
          changed = true;
        }
        return changed ? next : prev;
      });

      if (simSpeed === 0 || isAdopting) return;

      setPets((prevPets) =>
        prevPets.map((pet) => {
          const species = SPECIES_MAP[pet.speciesId];
          if (!species) return pet;
          // Active pet decays at selected speed; background sanctuary pets decay gently (0.25x)
          const factor = pet.id === activePetId ? simSpeed : simSpeed * 0.25;
          const nextNeeds: Record<string, number> = { ...pet.needs };
          for (const needDef of species.needs) {
            const current = nextNeeds[needDef.id] ?? 100;
            nextNeeds[needDef.id] = clamp(current - needDef.decayPerSecond * factor);
          }
          return {
            ...pet,
            needs: nextNeeds,
            ageDays: pet.ageDays + (0.008 * factor),
          };
        })
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [simSpeed, activePetId, isAdopting]);

  const handleAdopt = (speciesId: SpeciesId, name: string) => {
    const species = SPECIES_MAP[speciesId];
    if (!species) return;

    // Initialize all species-specific needs between 74% and 92% so the player has immediate fun things to try
    const startingNeeds: Record<string, number> = {};
    species.needs.forEach((n, idx) => {
      startingNeeds[n.id] = 74 + ((idx * 7) % 19);
    });

    const newPet: PetInstance = {
      id: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      speciesId,
      adoptedAt: Date.now(),
      needs: startingNeeds,
      bondXp: 10,
      actionsCompleted: 0,
      ageDays: 0,
      log: [
        {
          id: `log_${Date.now()}`,
          timestamp: Date.now(),
          emoji: '🏡',
          message: `Welcomed ${name} the ${species.name} to the ${species.habitatName}!`,
          category: 'milestone',
        },
      ],
    };

    setPets((prev) => [...prev, newPet]);
    setActivePetId(newPet.id);
    setIsAdopting(false);
    setCooldowns({});
  };

  const handlePerformAction = (need: NeedDefinition) => {
    if (!activePetId) return;
    if ((cooldowns[need.id] ?? 0) > 0) return;

    setCooldowns((prev) => ({ ...prev, [need.id]: need.cooldownSeconds }));
    triggerEffect(need.effectType, need.emoji);

    setPets((prevPets) =>
      prevPets.map((pet) => {
        if (pet.id !== activePetId) return pet;
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

        const xpGain = before < 50 ? 18 : 12;
        const newLogEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          timestamp: Date.now(),
          emoji: need.emoji,
          message: `${pet.name} ${need.actionMessage}`,
          category: need.category,
        };

        return {
          ...pet,
          needs: nextNeeds,
          bondXp: pet.bondXp + xpGain,
          actionsCompleted: pet.actionsCompleted + 1,
          log: [newLogEntry, ...pet.log].slice(0, 20),
        };
      })
    );
  };

  const handlePetClick = () => {
    if (!activePetId) return;
    triggerEffect('love', '❤️');

    setPets((prevPets) =>
      prevPets.map((pet) => {
        if (pet.id !== activePetId) return pet;
        const species = SPECIES_MAP[pet.speciesId];
        if (!species) return pet;
        // Boost the last play need (usually social/affection) slightly
        const playNeeds = species.needs.filter((n) => n.category === 'play');
        const socialNeed = playNeeds[playNeeds.length - 1];
        const nextNeeds = { ...pet.needs };
        if (socialNeed) {
          nextNeeds[socialNeed.id] = clamp((nextNeeds[socialNeed.id] ?? 50) + 5);
        }
        return {
          ...pet,
          needs: nextNeeds,
          bondXp: pet.bondXp + 3,
        };
      })
    );
  };

  const handleReleasePet = (petId: string) => {
    setPets((prev) => {
      const remaining = prev.filter((p) => p.id !== petId);
      if (remaining.length === 0) {
        setActivePetId(null);
        setIsAdopting(true);
      } else if (activePetId === petId) {
        setActivePetId(remaining[0].id);
      }
      return remaining;
    });
  };

  const activePet = pets.find((p) => p.id === activePetId) ?? null;
  const activeSpecies = activePet ? SPECIES_MAP[activePet.speciesId] : null;

  return (
    <div className="app-shell">
      {!isAdopting && activePet && activeSpecies && (
        <nav className="top-nav" aria-label="Sanctuary Navigation">
          <div className="brand">
            <div className="brand-icon">
              <PawPrint size={20} />
            </div>
            <span>Paws &amp; Claws</span>
          </div>

          <div className="pet-switcher">
            {pets.map((p) => {
              const sp = SPECIES_MAP[p.speciesId];
              const isCurrent = p.id === activePet.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`pet-tab ${isCurrent ? 'active' : ''}`}
                  style={{ '--accent': sp?.accentColor ?? '#10b981' } as React.CSSProperties}
                  onClick={() => {
                    setActivePetId(p.id);
                    setCooldowns({});
                  }}
                >
                  <span className="pet-tab-dot" />
                  <span>{p.name}</span>
                  <small>{sp?.name.split(' ').pop()}</small>
                </button>
              );
            })}

            <button
              type="button"
              className="btn-adopt-another"
              onClick={() => setIsAdopting(true)}
            >
              <Plus size={16} />
              Adopt Pet
            </button>
          </div>
        </nav>
      )}

      <main className="main-content">
        {isAdopting || !activePet || !activeSpecies ? (
          <AdoptionScreen
            onAdopt={handleAdopt}
            canCancel={pets.length > 0}
            onCancel={() => setIsAdopting(false)}
          />
        ) : (
          <CareDashboard
            pet={activePet}
            species={activeSpecies}
            simSpeed={simSpeed}
            onChangeSimSpeed={setSimSpeed}
            cooldowns={cooldowns}
            onPerformAction={handlePerformAction}
            onPetClick={handlePetClick}
            onReleasePet={handleReleasePet}
            activeEffect={activeEffect}
          />
        )}
      </main>
    </div>
  );
};

export default App;
