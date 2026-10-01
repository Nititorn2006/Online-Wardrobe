import {
  FORMALITY_LEVELS,
  type ClothingCategory,
  type ClothingFormality,
  type ClothingItem,
} from '../wardrobe/types';
import type { OutfitOccasion } from './types';

export type OutfitMode = 'separates' | 'dress';
export type OutfitSlot =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'accessory';

export const SLOT_CATEGORY: Record<OutfitSlot, ClothingCategory> = {
  top: 'tops',
  bottom: 'bottoms',
  dress: 'dresses',
  outerwear: 'outerwear',
  shoes: 'shoes',
  accessory: 'accessories',
};

const CATEGORY_SLOT: Record<ClothingCategory, OutfitSlot> = {
  tops: 'top',
  bottoms: 'bottom',
  dresses: 'dress',
  outerwear: 'outerwear',
  shoes: 'shoes',
  accessories: 'accessory',
};

export const ACTIVE_SLOTS: Record<OutfitMode, OutfitSlot[]> = {
  separates: ['top', 'bottom', 'shoes', 'outerwear', 'accessory'],
  dress: ['dress', 'shoes', 'outerwear', 'accessory'],
};

const OPTIONAL_SLOTS = new Set<OutfitSlot>(['outerwear', 'accessory']);

export type SlotPools = Record<OutfitSlot, ClothingItem[]>;
export type SlotSelections = Record<OutfitSlot, string | null>;
export type SlotLocks = Record<OutfitSlot, boolean>;

export type MixMatchDraft = {
  mode: OutfitMode;
  selected: SlotSelections;
  locked: SlotLocks;
  shuffleStep: number;
};

const EMPTY_SELECTIONS: SlotSelections = {
  top: null,
  bottom: null,
  dress: null,
  outerwear: null,
  shoes: null,
  accessory: null,
};

const EMPTY_LOCKS: SlotLocks = {
  top: false,
  bottom: false,
  dress: false,
  outerwear: false,
  shoes: false,
  accessory: false,
};

function sortPool(items: readonly ClothingItem[]) {
  return [...items].sort((left, right) => {
    if (left.isFavorite !== right.isFavorite) {
      return left.isFavorite ? -1 : 1;
    }

    const createdDifference =
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();

    return createdDifference || left.id.localeCompare(right.id);
  });
}

export function buildSlotPools(items: readonly ClothingItem[]): SlotPools {
  return Object.fromEntries(
    Object.entries(SLOT_CATEGORY).map(([slot, category]) => [
      slot,
      sortPool(items.filter((item) => item.category === category)),
    ]),
  ) as SlotPools;
}

export function createMixMatchDraft(
  items: readonly ClothingItem[],
  initialItemIds: readonly string[] = [],
): MixMatchDraft {
  const pools = buildSlotPools(items);
  const selected = { ...EMPTY_SELECTIONS };

  for (const itemId of initialItemIds) {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) continue;

    selected[CATEGORY_SLOT[item.category]] = item.id;
  }

  const hasInitialItems = Object.values(selected).some(Boolean);
  const mode: OutfitMode = selected.dress
    ? 'dress'
    : selected.top || selected.bottom
      ? 'separates'
      : pools.top.length > 0 && pools.bottom.length > 0
        ? 'separates'
        : pools.dress.length > 0
          ? 'dress'
          : 'separates';

  if (!hasInitialItems) {
    if (mode === 'separates') {
      selected.top = pools.top[0]?.id ?? null;
      selected.bottom = pools.bottom[0]?.id ?? null;
    } else {
      selected.dress = pools.dress[0]!.id;
    }
    selected.shoes = pools.shoes[0]?.id ?? null;
  }

  return {
    mode,
    selected,
    locked: { ...EMPTY_LOCKS },
    shuffleStep: 0,
  };
}

export function getSlotOptions(
  slot: OutfitSlot,
  pools: SlotPools,
): (string | null)[] {
  const ids = pools[slot].map((item) => item.id);

  if (OPTIONAL_SLOTS.has(slot)) {
    return [null, ...ids];
  }

  return ids.length > 0 ? ids : [null];
}

export function cycleSlot(
  draft: MixMatchDraft,
  slot: OutfitSlot,
  direction: -1 | 1,
  pools: SlotPools,
): MixMatchDraft {
  const options = getSlotOptions(slot, pools);
  const currentIndex = options.indexOf(draft.selected[slot]);
  const nextIndex =
    currentIndex === -1
      ? direction === 1
        ? 0
        : options.length - 1
      : (currentIndex + direction + options.length) % options.length;

  return {
    ...draft,
    selected: {
      ...draft.selected,
      [slot]: options[nextIndex],
    },
  };
}

export function toggleSlotLock(
  draft: MixMatchDraft,
  slot: OutfitSlot,
): MixMatchDraft {
  return {
    ...draft,
    locked: {
      ...draft.locked,
      [slot]: !draft.locked[slot],
    },
  };
}

export function canShuffle(draft: MixMatchDraft, pools: SlotPools): boolean {
  return ACTIVE_SLOTS[draft.mode].some(
    (slot) =>
      !draft.locked[slot] &&
      getSlotOptions(slot, pools).some(
        (option) => option !== draft.selected[slot],
      ),
  );
}

export function shuffleUnlocked(
  draft: MixMatchDraft,
  pools: SlotPools,
): MixMatchDraft {
  const nextStep = draft.shuffleStep + 1;
  const selected = { ...draft.selected };

  ACTIVE_SLOTS[draft.mode].forEach((slot, slotIndex) => {
    if (draft.locked[slot]) return;

    const options = getSlotOptions(slot, pools);
    const alternatives = options.filter((option) => option !== selected[slot]);
    if (alternatives.length === 0) return;

    selected[slot] = alternatives[(nextStep + slotIndex) % alternatives.length];
  });

  return {
    ...draft,
    selected,
    shuffleStep: nextStep,
  };
}

export function reconcileMixMatchDraft(
  draft: MixMatchDraft,
  pools: SlotPools,
): MixMatchDraft {
  const selected = { ...draft.selected };
  const locked = { ...draft.locked };

  (Object.keys(SLOT_CATEGORY) as OutfitSlot[]).forEach((slot) => {
    const selectedId = selected[slot];
    if (selectedId && !pools[slot].some((item) => item.id === selectedId)) {
      selected[slot] = null;
      locked[slot] = false;
    }
  });

  return { ...draft, selected, locked };
}

export function getSelectedItemIds(draft: MixMatchDraft): string[] {
  return ACTIVE_SLOTS[draft.mode]
    .map((slot) => draft.selected[slot])
    .filter((id): id is string => id !== null);
}

export function getMixMatchReadiness(draft: MixMatchDraft) {
  const itemIds = getSelectedItemIds(draft);
  const hasCore =
    draft.mode === 'dress'
      ? Boolean(draft.selected.dress)
      : Boolean(draft.selected.top && draft.selected.bottom);

  if (!hasCore) {
    return {
      canSave: false,
      message:
        draft.mode === 'dress'
          ? 'Choose a dress to complete the main look.'
          : 'Choose both a top and bottom to complete the main look.',
    };
  }

  if (itemIds.length < 2) {
    return {
      canSave: false,
      message: 'Add shoes, outerwear, or an accessory before saving this outfit.',
    };
  }

  return { canSave: true, message: null };
}

export function getSuggestedFormality(
  items: readonly ClothingItem[],
  itemIds: readonly string[],
): ClothingFormality {
  const counts = new Map<ClothingFormality, number>();

  itemIds.forEach((id) => {
    const formality = items.find((item) => item.id === id)?.formality;
    if (formality) counts.set(formality, (counts.get(formality) ?? 0) + 1);
  });

  let suggested: ClothingFormality = 'casual';
  let highestCount = 0;

  FORMALITY_LEVELS.forEach((option) => {
    const count = counts.get(option.value) ?? 0;
    if (count > highestCount) {
      suggested = option.value;
      highestCount = count;
    }
  });

  return suggested;
}

export function createMixMatchSignature(
  draft: MixMatchDraft,
  details: {
    occasion: OutfitOccasion;
    formality: ClothingFormality;
    plannedFor: string;
  },
): string {
  return [
    draft.mode,
    ...ACTIVE_SLOTS[draft.mode].map((slot) => draft.selected[slot] ?? '-'),
    details.occasion,
    details.formality,
    details.plannedFor,
  ].join(':');
}
