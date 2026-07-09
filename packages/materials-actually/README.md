# materials-actually

Pointer-local material interaction math, haptic patterns, and small
R3F-compatible helpers for feelable logo/card surfaces.

## Install

```sh
npm install @uqrealitylabs/materials-actually
```

The package is ESM and ships TypeScript declarations. React is a peer
dependency because the optional `PokeSurface` helpers return React elements.
The pure math and haptic helpers are framework-independent.

## Core Usage

```ts
import {
  applyPoke,
  createPokeState,
  getMaterialResponse,
  materialConfigs,
  stepPoke,
} from "@uqrealitylabs/materials-actually";

const state = createPokeState();
applyPoke(state, 0.5, 0.4, 0.8);
stepPoke(state, materialConfigs.rubber, 16.67);

const response = getMaterialResponse(materialConfigs.rubber, state);
```

Coordinates are normalized UV values from `0` to `1`. Pressure is clamped from
`0` to `1`, and recovery is delta-time based.

## Materials

| Material | Behaviour |
|---|---|
| `glass` | local stains, smear/wipe response, no mush deformation |
| `cloth` | local depression, creases, gather, fray threshold |
| `rubber` | inward squash, bulge, resistance, scratch threshold |
| `grass` | dense blade config, local bend, cut threshold, tennis-line outline |
| `mail` | springy bend/pop variant for mail logo surfaces |

## Haptics

```ts
import { triggerMaterialHaptic } from "@uqrealitylabs/materials-actually";

triggerMaterialHaptic("grass", "cut", 1, { navigator });
```

Haptics use `navigator.vibrate()` when available, no-op when unsupported, clamp
intensity, catch platform errors, and can be disabled with `reducedMotion`.

## R3F-Compatible Helpers

```tsx
import { PokeSurface } from "@uqrealitylabs/materials-actually";

<PokeSurface material="glass" underline>
  <planeGeometry args={[1, 1, 32, 32]} />
</PokeSurface>;
```

The helper exposes pointer handlers and keeps high-frequency poke values in the
controller state, not React render state.

## Development

```sh
npm run test -w @uqrealitylabs/materials-actually
npm run build -w @uqrealitylabs/materials-actually
npm pack --dry-run -w @uqrealitylabs/materials-actually
```

Package tests enforce 100% coverage for package source.
