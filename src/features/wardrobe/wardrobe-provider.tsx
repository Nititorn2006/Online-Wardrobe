import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { persistWardrobeImage, removeWardrobeImage } from './image-store';
import { loadWardrobeItems, saveWardrobeItems } from './storage';
import { isDateValue } from '../outfits/outfit-schema';
import {
  buildOutfitName,
  removeItemFromSavedOutfits,
} from '../outfits/saved-outfit-utils';
import {
  loadSavedOutfits,
  saveSavedOutfits,
} from '../outfits/storage';
import {
  isOutfitOccasion,
  type SavedOutfit,
  type SaveOutfitInput,
} from '../outfits/types';
import { normalizeClothingColor } from './color-palette';
import {
  isClothingCategory,
  isClothingFormality,
  type AddClothingInput,
  type ClothingItem,
  type UpdateClothingDetailsInput,
} from './types';

export type WardrobeContextValue = {
  items: ClothingItem[];
  outfits: SavedOutfit[];
  isHydrated: boolean;
  addItem: (input: AddClothingInput) => Promise<ClothingItem>;
  updateItemDetails: (
    id: string,
    input: UpdateClothingDetailsInput,
  ) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  saveOutfit: (input: SaveOutfitInput) => Promise<SavedOutfit>;
  deleteOutfit: (id: string) => Promise<void>;
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

function createItemId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createOutfitId(): string {
  return `outfit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function validateInput(input: AddClothingInput): AddClothingInput {
  const name = input.name.trim();
  const color = normalizeClothingColor(input.color);
  const sourceUri = input.sourceUri.trim();

  if (!name) {
    throw new Error('Please enter a name for this clothing item.');
  }
  if (!isClothingCategory(input.category)) {
    throw new Error('Please choose a valid clothing category.');
  }
  if (!isClothingFormality(input.formality)) {
    throw new Error('Please choose a valid dress code.');
  }
  if (!color) {
    throw new Error('Please choose a color for this clothing item.');
  }
  if (!sourceUri) {
    throw new Error('Please choose a clothing photo.');
  }

  return {
    name,
    category: input.category,
    formality: input.formality,
    color,
    sourceUri,
  };
}

export function WardrobeProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const itemsRef = useRef<ClothingItem[]>([]);
  const outfitsRef = useRef<SavedOutfit[]>([]);
  const isHydratedRef = useRef(false);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isActive = true;

    void Promise.allSettled([loadWardrobeItems(), loadSavedOutfits()])
      .then(([wardrobeResult, outfitResult]) => {
        if (!isActive) {
          return;
        }

        if (wardrobeResult.status === 'fulfilled') {
          itemsRef.current = wardrobeResult.value;
          setItems(wardrobeResult.value);
        } else {
          console.error(wardrobeResult.reason);
        }

        if (outfitResult.status === 'fulfilled') {
          outfitsRef.current = outfitResult.value;
          setOutfits(outfitResult.value);
        } else {
          console.error(outfitResult.reason);
        }
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        isHydratedRef.current = true;
        setIsHydrated(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const runMutation = useCallback(
    <Result,>(operation: () => Promise<Result>): Promise<Result> => {
      const result = mutationQueueRef.current.then(operation, operation);
      mutationQueueRef.current = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
    [],
  );

  const addItem = useCallback(
    (input: AddClothingInput) =>
      runMutation(async () => {
        if (!isHydratedRef.current) {
          throw new Error('Your wardrobe is still loading. Please try again in a moment.');
        }

        const validatedInput = validateInput(input);
        const id = createItemId();
        const imageUri = await persistWardrobeImage(validatedInput.sourceUri, id);
        const item: ClothingItem = {
          id,
          name: validatedInput.name,
          category: validatedInput.category,
          formality: validatedInput.formality,
          color: validatedInput.color,
          imageUri,
          isFavorite: false,
          createdAt: new Date().toISOString(),
        };
        const nextItems = [item, ...itemsRef.current];

        try {
          await saveWardrobeItems(nextItems);
        } catch (error) {
          try {
            await removeWardrobeImage(imageUri);
          } catch (cleanupError) {
            console.warn(cleanupError);
          }
          throw error;
        }

        itemsRef.current = nextItems;
        setItems(nextItems);
        return item;
      }),
    [runMutation],
  );

  const updateItemDetails = useCallback(
    (id: string, input: UpdateClothingDetailsInput) =>
      runMutation(async () => {
        if (!isHydratedRef.current) {
          throw new Error('Your wardrobe is still loading. Please try again in a moment.');
        }
        if (!isClothingCategory(input.category)) {
          throw new Error('Please choose a valid clothing category.');
        }
        if (!isClothingFormality(input.formality)) {
          throw new Error('Please choose a valid dress code.');
        }
        const color = normalizeClothingColor(input.color);
        if (!color) {
          throw new Error('Please choose a valid color.');
        }

        const itemIndex = itemsRef.current.findIndex((item) => item.id === id);
        if (itemIndex === -1) {
          throw new Error('This clothing item could not be found.');
        }

        const nextItems = itemsRef.current.map((item, index) =>
          index === itemIndex
            ? {
                ...item,
                category: input.category,
                formality: input.formality,
                color,
              }
            : item,
        );

        await saveWardrobeItems(nextItems);
        itemsRef.current = nextItems;
        setItems(nextItems);
      }),
    [runMutation],
  );

  const toggleFavorite = useCallback(
    (id: string) =>
      runMutation(async () => {
        if (!isHydratedRef.current) {
          throw new Error('Your wardrobe is still loading. Please try again in a moment.');
        }

        const itemIndex = itemsRef.current.findIndex((item) => item.id === id);
        if (itemIndex === -1) {
          throw new Error('This clothing item could not be found.');
        }

        const nextItems = itemsRef.current.map((item, index) =>
          index === itemIndex ? { ...item, isFavorite: !item.isFavorite } : item,
        );

        await saveWardrobeItems(nextItems);
        itemsRef.current = nextItems;
        setItems(nextItems);
      }),
    [runMutation],
  );

  const saveOutfit = useCallback(
    (input: SaveOutfitInput) =>
      runMutation(async () => {
        if (!isHydratedRef.current) {
          throw new Error('Your wardrobe is still loading. Please try again in a moment.');
        }

        const itemIds = [...new Set(input.itemIds)];

        if (itemIds.length < 2) {
          throw new Error('Choose at least two clothing items before saving an outfit.');
        }
        if (!itemIds.every((id) => itemsRef.current.some((item) => item.id === id))) {
          throw new Error('One or more pieces in this outfit are no longer in your closet.');
        }
        if (!isClothingFormality(input.formality)) {
          throw new Error('Please choose a valid dress code.');
        }
        if (!isOutfitOccasion(input.occasion)) {
          throw new Error('Please choose a valid occasion.');
        }
        if (!isDateValue(input.plannedFor)) {
          throw new Error('Please choose a valid date.');
        }

        const outfit: SavedOutfit = {
          id: createOutfitId(),
          name: buildOutfitName(input.formality, input.occasion),
          itemIds,
          formality: input.formality,
          occasion: input.occasion,
          plannedFor: input.plannedFor,
          createdAt: new Date().toISOString(),
        };
        const nextOutfits = [outfit, ...outfitsRef.current];

        await saveSavedOutfits(nextOutfits);
        outfitsRef.current = nextOutfits;
        setOutfits(nextOutfits);

        return outfit;
      }),
    [runMutation],
  );

  const deleteOutfit = useCallback(
    (id: string) =>
      runMutation(async () => {
        if (!isHydratedRef.current) {
          throw new Error('Your wardrobe is still loading. Please try again in a moment.');
        }
        if (!outfitsRef.current.some((outfit) => outfit.id === id)) {
          throw new Error('This saved outfit could not be found.');
        }

        const nextOutfits = outfitsRef.current.filter((outfit) => outfit.id !== id);

        await saveSavedOutfits(nextOutfits);
        outfitsRef.current = nextOutfits;
        setOutfits(nextOutfits);
      }),
    [runMutation],
  );

  const deleteItem = useCallback(
    (id: string) =>
      runMutation(async () => {
        if (!isHydratedRef.current) {
          throw new Error('Your wardrobe is still loading. Please try again in a moment.');
        }

        const item = itemsRef.current.find((candidate) => candidate.id === id);
        if (!item) {
          throw new Error('This clothing item could not be found.');
        }

        const nextItems = itemsRef.current.filter((candidate) => candidate.id !== id);
        const nextOutfits = removeItemFromSavedOutfits(outfitsRef.current, id);
        await Promise.all([
          saveWardrobeItems(nextItems),
          saveSavedOutfits(nextOutfits),
        ]);

        itemsRef.current = nextItems;
        setItems(nextItems);
        outfitsRef.current = nextOutfits;
        setOutfits(nextOutfits);

        try {
          await removeWardrobeImage(item.imageUri);
        } catch (error) {
          console.warn(error);
        }
      }),
    [runMutation],
  );

  const value = useMemo<WardrobeContextValue>(
    () => ({
      items,
      outfits,
      isHydrated,
      addItem,
      updateItemDetails,
      toggleFavorite,
      deleteItem,
      saveOutfit,
      deleteOutfit,
    }),
    [
      addItem,
      deleteItem,
      deleteOutfit,
      isHydrated,
      items,
      outfits,
      saveOutfit,
      toggleFavorite,
      updateItemDetails,
    ],
  );

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe(): WardrobeContextValue {
  const context = useContext(WardrobeContext);

  if (!context) {
    throw new Error('useWardrobe must be used within a WardrobeProvider.');
  }

  return context;
}
