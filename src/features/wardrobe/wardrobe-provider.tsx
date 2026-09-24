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
import {
  isClothingCategory,
  type AddClothingInput,
  type ClothingItem,
} from './types';

export type WardrobeContextValue = {
  items: ClothingItem[];
  isHydrated: boolean;
  addItem: (input: AddClothingInput) => Promise<ClothingItem>;
  toggleFavorite: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

function createItemId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function validateInput(input: AddClothingInput): AddClothingInput {
  const name = input.name.trim();
  const color = input.color.trim();
  const sourceUri = input.sourceUri.trim();

  if (!name) {
    throw new Error('Please enter a name for this clothing item.');
  }
  if (!isClothingCategory(input.category)) {
    throw new Error('Please choose a valid clothing category.');
  }
  if (!color) {
    throw new Error('Please choose a color for this clothing item.');
  }
  if (!sourceUri) {
    throw new Error('Please choose a clothing photo.');
  }

  return { name, category: input.category, color, sourceUri };
}

export function WardrobeProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const itemsRef = useRef<ClothingItem[]>([]);
  const isHydratedRef = useRef(false);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let isActive = true;

    void loadWardrobeItems()
      .then((savedItems) => {
        if (!isActive) {
          return;
        }

        itemsRef.current = savedItems;
        setItems(savedItems);
      })
      .catch((error: unknown) => {
        console.error(error);
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
        await saveWardrobeItems(nextItems);

        itemsRef.current = nextItems;
        setItems(nextItems);

        try {
          await removeWardrobeImage(item.imageUri);
        } catch (error) {
          console.warn(error);
        }
      }),
    [runMutation],
  );

  const value = useMemo<WardrobeContextValue>(
    () => ({ items, isHydrated, addItem, toggleFavorite, deleteItem }),
    [addItem, deleteItem, isHydrated, items, toggleFavorite],
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
