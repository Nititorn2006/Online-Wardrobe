import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

export type TextSizeOption =
  | 'small'
  | 'default'
  | 'large'
  | 'extraLarge';

type TextSizeContextValue = {
  textSize: TextSizeOption;
  scale: number;
  setTextSize: (value: TextSizeOption) => void;
};

const STORAGE_KEY = '@onlinewardrobe/text-size';

const TEXT_SIZE_SCALE: Record<TextSizeOption, number> = {
  small: 0.9,
  default: 1,
  large: 1.15,
  extraLarge: 1.3,
};

const TextSizeContext =
  createContext<TextSizeContextValue | null>(null);

export function TextSizeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [textSize, setTextSizeState] =
    useState<TextSizeOption>('default');

  useEffect(() => {
    const loadTextSize = async () => {
      try {
        const savedValue =
          await AsyncStorage.getItem(STORAGE_KEY);

        if (
          savedValue === 'small' ||
          savedValue === 'default' ||
          savedValue === 'large' ||
          savedValue === 'extraLarge'
        ) {
          setTextSizeState(savedValue);
        }
      } catch {
        // Keep default value if loading fails.
      }
    };

    void loadTextSize();
  }, []);

  const setTextSize = (value: TextSizeOption) => {
    setTextSizeState(value);

    void AsyncStorage.setItem(
      STORAGE_KEY,
      value,
    );
  };

  return (
    <TextSizeContext.Provider
      value={{
        textSize,
        scale: TEXT_SIZE_SCALE[textSize],
        setTextSize,
      }}
    >
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize() {
  const context = useContext(TextSizeContext);

  if (!context) {
    throw new Error(
      'useTextSize must be used inside TextSizeProvider',
    );
  }

  return context;
}