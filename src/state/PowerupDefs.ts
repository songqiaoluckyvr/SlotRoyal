export type PowerupType =
  | 'free_spins'
  | 'extra_row'
  | 'extra_column'
  | 'symbol_value_up'
  | 'symbol_chance_up'
  | 'red_pocket';

export type Rarity = 'common' | 'uncommon' | 'rare';

export type PowerupTier = 'bronze' | 'silver' | 'gold' | 'rainbow';

export const TIER_LABELS: Record<PowerupTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  rainbow: 'Rainbow',
};

export const TIER_COLORS: Record<PowerupTier, number> = {
  bronze: 0xcd7f32,
  silver: 0xc0c0c0,
  gold: 0xffd700,
  rainbow: 0xff44ff,
};

/** Tier selection weights by progress threshold */
export const TIER_WEIGHTS_BY_THRESHOLD: Record<number, Record<PowerupTier, number>> = {
  0.25: { bronze: 50, silver: 25, gold: 15, rainbow: 10 },
  0.50: { bronze: 25, silver: 50, gold: 15, rainbow: 10 },
  0.75: { bronze: 10, silver: 25, gold: 50, rainbow: 15 },
  1.00: { bronze: 5, silver: 15, gold: 25, rainbow: 45 },  // missed opportunity: was 55
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
};

export const RARITY_COLORS: Record<Rarity, number> = {
  common: 0x888888,
  uncommon: 0x44aaff,
  rare: 0xff8844,
};

export interface Powerup {
  id: string;
  type: PowerupType;
  name: string;
  description: string;
  color: number;
  /** For rarity-based powerups */
  targetRarity?: Rarity;
  /** Legacy — kept for compatibility */
  targetSymbolId?: string;
  /** Numeric value (e.g., free spin count, payout multiplier bonus, weight bonus) */
  value: number;
  /** Whether this powerup is consumed on use vs persistent */
  consumable: boolean;
  /** Current merge level (starts at 1, increases on merge) */
  level: number;
}

export function createPowerup(type: PowerupType, targetRarity?: Rarity): Powerup {
  switch (type) {
    case 'free_spins':
      return {
        id: `${type}_${Date.now()}`, type, name: 'Free Spins',
        description: '+5 free spins', color: 0x44ff44,
        value: 5, consumable: true, level: 1,
      };
    case 'extra_row':
      return {
        id: `${type}_${Date.now()}`, type, name: 'Extra Row',
        description: '+1 row (more paylines)', color: 0xff8844,
        value: 1, consumable: false, level: 1,
      };
    case 'extra_column':
      return {
        id: `${type}_${Date.now()}`, type, name: 'Extra Column',
        description: '+1 column (longer matches)', color: 0x44aaff,
        value: 1, consumable: false, level: 1,
      };
    case 'symbol_value_up': {
      const label = targetRarity ? RARITY_LABELS[targetRarity] : '?';
      return {
        id: `${type}_${targetRarity}_${Date.now()}`, type, name: `${label} Value Up`,
        description: `+2x payout for ${label} symbols`, color: 0xffcc00,
        targetRarity, value: 2, consumable: false, level: 1,
      };
    }
    case 'symbol_chance_up': {
      const label = targetRarity ? RARITY_LABELS[targetRarity] : '?';
      return {
        id: `${type}_${targetRarity}_${Date.now()}`, type, name: `${label} Chance Up`,
        description: `+5 weight for ${label} symbols`, color: 0xcc44ff,
        targetRarity, value: 5, consumable: false, level: 1,
      };
    }
    case 'red_pocket':
      return {
        id: `${type}_${Date.now()}`, type, name: 'Red Pocket',
        description: 'Instant cash reward', color: 0xff2222,
        value: 0, consumable: true, level: 1,
      };
  }
}

/** Check if two powerups can merge (same type + same rarity if applicable) */
export function canMerge(a: Powerup, b: Powerup): boolean {
  if (a.type !== b.type) return false;
  if (a.targetRarity && a.targetRarity !== b.targetRarity) return false;
  return true;
}

/** Merge b into a (mutates a, returns a) */
export function mergePowerup(existing: Powerup, incoming: Powerup): Powerup {
  existing.level += 1;
  existing.value += incoming.value;
  existing.description = `${existing.name} Lv.${existing.level}`;
  return existing;
}
