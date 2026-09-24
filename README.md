# MatchClothes

MatchClothes is a mobile-first Expo app for keeping a digital wardrobe and quickly building outfit ideas from clothes you already own.

## Included in this MVP

- Add clothes with the camera or photo library
- Store wardrobe data and copied photos on-device
- Browse, search, and filter by category
- Mark and filter favorite pieces
- View details and safely delete an item
- Generate a quick outfit match from saved categories
- Native iOS/Android tabs with a responsive web layout

## Run locally

```bash
npm install
npx expo start
```

Then open the project in Expo Go, an emulator, or the web preview. A physical device is required to test the camera.

## Quality checks

```bash
npx tsc --noEmit
npx expo lint --no-cache --max-warnings 0
npx expo-doctor
npx expo export --platform all
```
