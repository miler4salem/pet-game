import { NeedDefinition, SpeciesProfile, StationSlotId } from '../types/pet';

export const WORLD = {
  width: 1040,
  height: 640,
  wallTop: 118,
  wallBottom: 604,
  wallLeft: 38,
  wallRight: 1002,
  /** Partition wall between indoor house (left) and outdoor backyard (right) */
  dividerX: 706,
  dividerW: 18,
  /** Open patio doorway gap in the divider wall */
  patioDoorTop: 296,
  patioDoorBottom: 438,
};

export interface StationSlotLayout {
  slotId: StationSlotId;
  area: 'indoor' | 'outdoor';
  x: number;
  y: number;
  w: number;
  h: number;
  depthHeight: number;
  accent: string;
  interactOffset: { x: number; y: number };
}

export const STATION_SLOTS: Record<StationSlotId, StationSlotLayout> = {
  indoor_food: {
    slotId: 'indoor_food',
    area: 'indoor',
    x: 80,
    y: 124,
    w: 152,
    h: 58,
    depthHeight: 36,
    accent: '#ffd6a5',
    interactOffset: { x: 76, y: 84 },
  },
  indoor_water: {
    slotId: 'indoor_water',
    area: 'indoor',
    x: 294,
    y: 124,
    w: 152,
    h: 58,
    depthHeight: 36,
    accent: '#bde0fe',
    interactOffset: { x: 76, y: 84 },
  },
  indoor_care: {
    slotId: 'indoor_care',
    area: 'indoor',
    x: 508,
    y: 124,
    w: 152,
    h: 58,
    depthHeight: 36,
    accent: '#e2d4ff',
    interactOffset: { x: 76, y: 84 },
  },
  indoor_hygiene: {
    slotId: 'indoor_hygiene',
    area: 'indoor',
    x: 92,
    y: 492,
    w: 162,
    h: 64,
    depthHeight: 30,
    accent: '#c8f7f0',
    interactOffset: { x: 81, y: -26 },
  },
  indoor_play: {
    slotId: 'indoor_play',
    area: 'indoor',
    x: 454,
    y: 492,
    w: 168,
    h: 64,
    depthHeight: 30,
    accent: '#ffc8dd',
    interactOffset: { x: 84, y: -26 },
  },
  outdoor_1: {
    slotId: 'outdoor_1',
    area: 'outdoor',
    x: 774,
    y: 152,
    w: 176,
    h: 72,
    depthHeight: 24,
    accent: '#caffbf',
    interactOffset: { x: 88, y: 98 },
  },
  outdoor_2: {
    slotId: 'outdoor_2',
    area: 'outdoor',
    x: 774,
    y: 472,
    w: 176,
    h: 74,
    depthHeight: 24,
    accent: '#fde68a',
    interactOffset: { x: 88, y: -26 },
  },
};

export interface WorldStation extends StationSlotLayout {
  need: NeedDefinition;
}

export function buildWorldStations(species: SpeciesProfile): WorldStation[] {
  return species.needs.map((need) => {
    const slot = STATION_SLOTS[need.stationSlot];
    return {
      ...slot,
      need,
    };
  });
}

export function getStationInteractPoint(station: WorldStation): { x: number; y: number } {
  return {
    x: station.x + station.interactOffset.x,
    y: station.y + station.interactOffset.y,
  };
}
