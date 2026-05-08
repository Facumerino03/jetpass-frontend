# Expo SDK 55 Initialization Design

## Goal

Initialize a clean Expo SDK 55 project in the repository root. The project should use the Expo app folder structure recommended by Expo, NativeWind for styling, and React Native Reusables for UI components.

## Structure

Use `src/app` for Expo Router routes so application source is separated from root configuration files.

```txt
assets/
src/
  app/
    _layout.tsx
    index.tsx
  screens/
    home/
      index.tsx
  components/
    ui/
      button.tsx
      card.tsx
      text.tsx
  lib/
    utils.ts
  global.css
app.json
metro.config.js
tailwind.config.js
babel.config.js
package.json
tsconfig.json
```

## Routing

`src/app/_layout.tsx` defines the root Expo Router stack. `src/app/index.tsx` remains thin and renders `src/screens/home/index.tsx`.

## Styling

NativeWind is configured for Expo and Tailwind utilities. The home screen uses `className` styles so it is obvious NativeWind is active.

## Components

React Native Reusables provides the initial UI components under `src/components/ui`. The home screen uses a `Card`, `Text`, and `Button` to verify the component library is installed and wired correctly.

## Verification

After setup, run available non-interactive validation commands such as dependency installation checks, TypeScript checks if available, and Expo CLI config/start help commands to confirm the project is structurally valid.
