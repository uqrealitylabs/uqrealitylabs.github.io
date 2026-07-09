# eyslie

Clean-room TypeScript helpers for xeyes-style cartoon eye tracking, constrained
pupils, hide-radius behaviour, organic wink timing, and simple expressions.

## Install

```sh
npm install @uqrealitylabs/eyslie
```

The package is ESM and ships TypeScript declarations. React is a peer
dependency because the optional `Eye`/`EyePair` helpers return React elements.
The tracking math is framework-independent.

## License Note

`eyslie` is inspired by the classic xeyes "follow the mouse" behaviour, but it
does not copy xeyes source or algorithm text. See `NOTICE.md` for the upstream
licence note reviewed for this clean-room implementation.

## Core Usage

```ts
import {
  computePupilPosition,
  createWinkSchedule,
  isInsideHideRadius,
} from "@uqrealitylabs/eyslie";

const pupil = computePupilPosition(
  { width: 24, height: 18 },
  { x: 100, y: -30 },
  { pupilRadius: 3 },
);

const hidden = isInsideHideRadius({ x: 50, y: 50 }, { x: 60, y: 50 }, 20);
const nextWinkMs = createWinkSchedule(42)(0);
```

## React Helpers

```tsx
import { EyePair, useEyeTracking } from "@uqrealitylabs/eyslie";

const tracking = useEyeTracking({
  eyeBounds: { width: 24, height: 18 },
  pointer: { x: 10, y: 4 },
  reducedMotion,
});

<EyePair label="JOIN US" rightShape="u" expression="happy" />;
```

Split-letter text should keep its own accessible label. The rendered eye
helpers label themselves as decorative by default.

## Expressions

`getExpressionState()` supports:

| Expression | Signals |
|---|---|
| `idle` | normal pupil scale |
| `happy` | smile signal and larger pupil |
| `sad` | tear signal and smaller pupil |

Reduced motion callers can disable wink scheduling and keep pupils centred.

## Development

```sh
npm run test -w @uqrealitylabs/eyslie
npm run build -w @uqrealitylabs/eyslie
npm pack --dry-run -w @uqrealitylabs/eyslie
```

Package tests enforce 100% coverage for package source.
