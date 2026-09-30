import { FORMALITY_LEVELS } from '../wardrobe/types';
import { OUTFIT_OCCASIONS, type SavedOutfit } from './types';

export function buildOutfitName(
  formality: SavedOutfit['formality'],
  occasion: SavedOutfit['occasion'],
): string {
  const formalityLabel = FORMALITY_LEVELS.find(
    (option) => option.value === formality,
  )?.label;
  const occasionLabel = OUTFIT_OCCASIONS.find(
    (option) => option.value === occasion,
  )?.label;

  return `${formalityLabel ?? 'Styled'} ${occasionLabel?.toLocaleLowerCase() ?? 'outfit'} look`;
}

export function removeItemFromSavedOutfits(
  outfits: readonly SavedOutfit[],
  itemId: string,
): SavedOutfit[] {
  return outfits
    .map((outfit) => ({
      ...outfit,
      itemIds: outfit.itemIds.filter((candidate) => candidate !== itemId),
    }))
    .filter((outfit) => outfit.itemIds.length >= 2);
}

export function sortSavedOutfits(
  outfits: readonly SavedOutfit[],
  today: string,
): SavedOutfit[] {
  return [...outfits].sort((left, right) => {
    const leftUpcoming = left.plannedFor >= today;
    const rightUpcoming = right.plannedFor >= today;

    if (leftUpcoming !== rightUpcoming) {
      return leftUpcoming ? -1 : 1;
    }
    if (leftUpcoming && left.plannedFor !== right.plannedFor) {
      return left.plannedFor.localeCompare(right.plannedFor);
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}
