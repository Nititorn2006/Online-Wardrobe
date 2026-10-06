import { componentResources } from "./resources/components";
import { outfitScreenResources } from "./resources/outfit-screens";
import { sharedResources } from "./resources/shared";
import { tabResources } from "./resources/tabs";
import { wardrobeScreenResources } from "./resources/wardrobe-screens";

const th = {
  ...sharedResources.th,
  ...tabResources.th,
  ...componentResources.th,
  ...wardrobeScreenResources.th,
  ...outfitScreenResources.th,
} as const;

export default th;
