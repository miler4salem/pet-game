export type SpeciesId =
  | 'dog'
  | 'cat'
  | 'parakeet'
  | 'frog'
  | 'bearded_dragon'
  | 'pygmy_goat';

export type NeedCategory = 'biological' | 'play';

export type Difficulty = 'Easy' | 'Moderate' | 'Specialist';

export type PetMood = 'thriving' | 'happy' | 'needs_care' | 'urgent';

export type ActionEffectType =
  | 'food'
  | 'water'
  | 'clean'
  | 'play'
  | 'love'
  | 'warmth'
  | 'music';

export interface NeedDefinition {
  id: string;
  label: string;
  category: NeedCategory;
  emoji: string;
  /** Points lost per simulated minute at 1x speed */
  decayPerSecond: number;
  /** Label for the button that satisfies this need */
  actionLabel: string;
  /** Short flavor text shown in activity log */
  actionMessage: string;
  /** Amount restored when the action is performed (0-100 scale) */
  restoreAmount: number;
  /** Secondary side effects on other needs (optional, e.g., walk slightly lowers hydration) */
  sideEffects?: Record<string, number>;
  /** Cooldown in seconds before the action can be clicked again */
  cooldownSeconds: number;
  /** Visual particle effect type */
  effectType: ActionEffectType;
  /** Real-world animal care fact explaining why this need matters */
  careTip: string;
}

export interface SpeciesProfile {
  id: SpeciesId;
  name: string;
  scientificName: string;
  tagline: string;
  habitatName: string;
  difficulty: Difficulty;
  accentColor: string;
  softBg: string;
  suggestedNames: string[];
  /** Fun biology/care summary shown in the Care Guide */
  overview: string;
  /** All biological and play needs dynamically loaded for this species */
  needs: NeedDefinition[];
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  emoji: string;
  message: string;
  category: NeedCategory | 'milestone';
}

export interface PetInstance {
  id: string;
  name: string;
  speciesId: SpeciesId;
  adoptedAt: number;
  /** Current value (0 to 100) for every need id defined by the pet's species */
  needs: Record<string, number>;
  /** Total care XP earned — drives bond level */
  bondXp: number;
  /** Total care actions completed */
  actionsCompleted: number;
  /** Simulated age in days */
  ageDays: number;
  /** Recent activity history */
  log: ActivityLogEntry[];
}
