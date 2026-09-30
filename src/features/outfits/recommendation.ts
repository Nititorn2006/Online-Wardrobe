import {
  CATEGORIES,
  type ClothingCategory,
  type ClothingFormality,
  type ClothingItem,
} from '../wardrobe/types';
import type {
  OutfitOccasion,
  OutfitRecommendation,
  OutfitRequest,
} from './types';

const FORMALITY_RANK: Record<ClothingFormality, number> = {
  relaxed: 0,
  casual: 1,
  'smart-casual': 2,
  business: 3,
  formal: 4,
  'black-tie': 5,
};

const DRESS_FIRST_OCCASIONS = new Set<OutfitOccasion>([
  'date',
  'party',
  'wedding',
]);

const OUTERWEAR_OCCASIONS = new Set<OutfitOccasion>([
  'work',
  'wedding',
  'travel',
]);

const ACCESSORY_OCCASIONS = new Set<OutfitOccasion>([
  'date',
  'party',
  'wedding',
]);

const CATEGORY_SINGULAR: Record<ClothingCategory, string> = {
  tops: 'top',
  bottoms: 'bottom',
  dresses: 'dress',
  outerwear: 'outerwear',
  shoes: 'shoes',
  accessories: 'accessory',
};

function rankItems(
  items: readonly ClothingItem[],
  formality: ClothingFormality,
): ClothingItem[] {
  return [...items].sort((left, right) => {
    const leftDistance = Math.abs(
      FORMALITY_RANK[left.formality] - FORMALITY_RANK[formality],
    );
    const rightDistance = Math.abs(
      FORMALITY_RANK[right.formality] - FORMALITY_RANK[formality],
    );

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    if (left.isFavorite !== right.isFavorite) {
      return left.isFavorite ? -1 : 1;
    }

    return left.id.localeCompare(right.id);
  });
}

function preferredItems(
  items: readonly ClothingItem[],
  category: ClothingCategory,
  formality: ClothingFormality,
): ClothingItem[] {
  const ranked = rankItems(
    items.filter((item) => item.category === category),
    formality,
  );

  if (ranked.length === 0) {
    return [];
  }

  const nearestDistance = Math.abs(
    FORMALITY_RANK[ranked[0].formality] - FORMALITY_RANK[formality],
  );
  const compatible = ranked.filter(
    (item) =>
      Math.abs(FORMALITY_RANK[item.formality] - FORMALITY_RANK[formality]) <= 1,
  );

  if (compatible.length > 0) {
    return compatible;
  }

  return ranked.filter(
    (item) =>
      Math.abs(FORMALITY_RANK[item.formality] - FORMALITY_RANK[formality]) ===
      nearestDistance,
  );
}

function pickCategory(
  candidates: readonly ClothingItem[],
  turn: number,
): ClothingItem | undefined {
  if (candidates.length === 0) {
    return undefined;
  }

  return candidates[turn % candidates.length];
}

function addIfPresent(
  recommendation: ClothingItem[],
  item: ClothingItem | undefined,
) {
  if (item && !recommendation.some((candidate) => candidate.id === item.id)) {
    recommendation.push(item);
  }
}

export function recommendOutfit(
  items: readonly ClothingItem[],
  request: OutfitRequest,
): OutfitRecommendation {
  const turn = Math.abs(Math.trunc(request.seed));
  const recommendation: ClothingItem[] = [];
  const options = Object.fromEntries(
    CATEGORIES.map((category) => [
      category.value,
      preferredItems(items, category.value, request.formality),
    ]),
  ) as Record<ClothingCategory, ClothingItem[]>;

  const includeOuterwear =
    OUTERWEAR_OCCASIONS.has(request.occasion) ||
    FORMALITY_RANK[request.formality] >= FORMALITY_RANK.business;
  const includeAccessory = ACCESSORY_OCCASIONS.has(request.occasion);
  const hasSeparates = options.tops.length > 0 && options.bottoms.length > 0;
  const hasDressCompanion =
    options.shoes.length > 0 ||
    (includeOuterwear && options.outerwear.length > 0) ||
    (includeAccessory && options.accessories.length > 0);
  const hasCompleteDress = options.dresses.length > 0 && hasDressCompanion;
  const hasAlternativeStructure = hasSeparates && hasCompleteDress;
  const preferDress = DRESS_FIRST_OCCASIONS.has(request.occasion);

  let useDress = options.dresses.length > 0 && !hasSeparates;

  if (hasAlternativeStructure) {
    useDress = turn % 2 === 0 ? preferDress : !preferDress;
  } else if (hasCompleteDress && !hasSeparates) {
    useDress = true;
  } else if (hasSeparates) {
    useDress = false;
  }

  if (useDress) {
    addIfPresent(
      recommendation,
      pickCategory(options.dresses, turn),
    );
  } else {
    addIfPresent(
      recommendation,
      pickCategory(options.tops, turn),
    );
    addIfPresent(
      recommendation,
      pickCategory(options.bottoms, turn),
    );
  }

  addIfPresent(
    recommendation,
    pickCategory(options.shoes, turn),
  );

  if (includeOuterwear) {
    addIfPresent(
      recommendation,
      pickCategory(options.outerwear, turn),
    );
  }

  if (recommendation.length < 4 && includeAccessory) {
    addIfPresent(
      recommendation,
      pickCategory(options.accessories, turn),
    );
  }

  const finalItems = recommendation.slice(0, 4);
  const hasCore = finalItems.some((item) => item.category === 'dresses')
    ? finalItems.length >= 2
    : finalItems.some((item) => item.category === 'tops') &&
      finalItems.some((item) => item.category === 'bottoms');

  let missingMessage: string | null = null;

  if (!hasCore) {
    if (options.dresses.length === 0 && !hasSeparates) {
      missingMessage = 'Add a dress, or both a top and bottom, to build a complete look.';
    } else {
      missingMessage = 'Add one more piece to turn this into a complete look.';
    }
  }

  const selectedCategories = [...new Set(finalItems.map((item) => item.category))];
  const changeableCategories = selectedCategories.filter(
    (category) => options[category].length > 1,
  );
  const canTryAnother = hasAlternativeStructure || changeableCategories.length > 0;
  const onlyChangeableCategory =
    !hasAlternativeStructure && changeableCategories.length === 1
      ? changeableCategories[0]
      : null;
  const tryAnotherLabel = onlyChangeableCategory
    ? `Change ${CATEGORY_SINGULAR[onlyChangeableCategory]}`
    : canTryAnother
      ? 'Try another'
      : 'No other look yet';
  const variationMessage = onlyChangeableCategory
    ? `Only the ${CATEGORY_SINGULAR[onlyChangeableCategory]} has another option right now. Add more pieces in the other categories for a bigger change.`
    : !canTryAnother && hasCore
      ? 'This is the only complete combination for these choices. Add more pieces to create another look.'
      : null;

  return {
    items: finalItems,
    isComplete: hasCore,
    missingMessage,
    canTryAnother,
    tryAnotherLabel,
    variationMessage,
  };
}
