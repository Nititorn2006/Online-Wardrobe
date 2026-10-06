import { componentResources } from "./resources/components";
import { outfitScreenResources } from "./resources/outfit-screens";
import { sharedResources } from "./resources/shared";
import { tabResources } from "./resources/tabs";
import { wardrobeScreenResources } from "./resources/wardrobe-screens";

const en = {
  ...sharedResources.en,
  ...tabResources.en,
  ...componentResources.en,
  ...wardrobeScreenResources.en,
  ...outfitScreenResources.en,
} as const;

export default en;
