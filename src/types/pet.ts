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

export type PlayerGender = 'female' | 'male';

export type Facing = 'up' | 'down' | 'left' | 'right';

export type StationSlotId =
  | 'indoor_food'
  | 'indoor_water'
  | 'indoor_care'
  | 'indoor_hygiene'
  | 'indoor_play'
  | 'outdoor_1'
  | 'outdoor_2';

export type StationVisualKind =
  | 'food_bowl'
  | 'water_bowl'
  | 'fountain'
  | 'mist_terrarium'
  | 'uvb_lamp'
  | 'grooming_table'
  | 'litter_box'
  | 'soak_pool'
  | 'hay_rack'
  | 'cozy_rug'
  | 'bird_perch'
  | 'potty_lawn'
  | 'walk_fetch'
  | 'scratch_post'
  | 'climb_play'
  | 'ball_yard';

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
  stationSlot: StationSlotId;
  stationTitle: string;
  stationVisual: StationVisualKind;
  /** Points lost per simulated second at 1x speed */
  decayPerSecond: number;
  /** Label for the action that satisfies this need */
  actionLabel: string;
  /** Short flavor text shown in toast/log */
  actionMessage: string;
  /** Amount restored when the action is performed (0-100 scale) */
  restoreAmount: number;
  /** Secondary side effects on other needs */
  sideEffects?: Record<string, number>;
  /** Cooldown in seconds before the action can be performed again */
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
  overview: string;
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
  needs: Record<string, number>;
  bondXp: number;
  actionsCompleted: number;
  ageDays: number;
  log: ActivityLogEntry[];
}
