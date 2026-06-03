# OBIX JSX Adapters

**Non-monolithic separation of concerns for OBIX component architecture.**

This directory contains three independent packages that enable JSX syntax for OBIX components while maintaining strict paradigm separation and zero framework lock-in.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: JSX CONTRACT (Syntax)                             │
│  @obinexusltd/obix-jsx-adapter                              │
│  ─────────────────────────────────────────────────────────  │
│  • h() factory + Fragment                                     │
│  • Type definitions (ObixComponent, ComponentFactory)         │
│  • Zero dependencies                                          │
│  • 3-5 KB bundle                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: COMPONENT DNA (Data Objects)                        │
│  @obinexusltd/obix-jsx-components                           │
│  ─────────────────────────────────────────────────────────  │
│  • 30 factory functions (obixButton, obixInput, etc.)       │
│  • Wraps @obinexusltd/obix-component-runtime                │
│  • Returns plain objects: { state, actions, render, aria }   │
│  • No DOM, no framework, no virtual tree                      │
│  • 2-3 KB wrappers + runtime                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: PARADIGM CONSTITUTION (DOP Adapter)               │
│  @obinexusltd/obix-jsx-integration                          │
│  ─────────────────────────────────────────────────────────  │
│  • Bridges Layer 2 output to Functional / OOP / Reactive      │
│  • Re-exports obix-dop-adapter with JSX naming              │
│  • Constitutional enforcement: no paradigm leaks upward       │
│  • 1 KB bridge                                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: TARGET COMPLIANCE (HTML/CSS/JS)                     │
│  Browser / Node / HTMX / React / Vue / SSR                  │
│  ─────────────────────────────────────────────────────────  │
│  • .render(state) → HTML string                               │
│  • CSS classes: obix-button--primary, obix-input--error     │
│  • ARIA attributes injected automatically                     │
│  • Event delegation via data-obix-id (no framework lock)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Packages

### 1. `obix-jsx-adapter` — Core Factory

**Responsibility**: Convert JSX syntax to OBIX data objects.

**Constraint**: Must NOT import from `obix-component-runtime` or `obix-dop-adapter`.

```typescript
import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';

// JSX compiles to this:
const button = h(obixButton, { label: 'Save', variant: 'primary' });

// Returns: { name: 'Button', state: {...}, actions: {...}, render: (...) => string }
```

### 2. `obix-jsx-components` — Component DNA

**Responsibility**: Map JSX props to `obix-component-runtime` config.

**Constraint**: Returns plain data objects. No paradigm claims.

```typescript
import { obixButton, obixInput, obixForm } from '@obinexusltd/obix-jsx-components';

// Or by category:
import { obixButton } from '@obinexusltd/obix-jsx-components/primitives';
import { obixInput } from '@obinexusltd/obix-jsx-components/forms';
```

### 3. `obix-jsx-integration` — Paradigm Bridge

**Responsibility**: Bridge JSX output to Functional, OOP, and Reactive paradigms.

**Constraint**: The ONLY package that touches DOP adapters.

```typescript
import { toJSXFunctional, toJSXOOP, toJSXReactive } from '@obinexusltd/obix-jsx-integration';

const button = h(obixButton, { label: 'Count: 0' });

// Functional (immutable)
const functional = toJSXFunctional(button);
const newState = functional.dispatch('setLabel', 'Count: 1');

// OOP (mutable)
const oop = toJSXOOP(button);
oop.instance.label = 'Count: 1';

// Reactive (observer)
const reactive = toJSXReactive(button);
reactive.subscribe((state) => console.log(state));
reactive.dispatch('setLabel', 'Count: 1');
```

---

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

---

## React Specification → HTML/CSS/JS Compliance

| Aspect | React JSX | OBIX JSX |
|--------|-----------|----------|
| **Compilation** | To React.createElement | To h() → OBIX component object |
| **Virtual DOM** | Yes | No |
| **Rendering** | React runtime | `.render(state)` → HTML string |
| **State** | useState, useReducer | Explicit actions (pure functions) |
| **Framework** | React-specific | Framework-agnostic |
| **Bundle Size** | ~40 KB (React) | ~3-5 KB (h() factory) |

---

## Installation

```bash
# Install all three packages
npm install @obinexusltd/obix-jsx-adapter
npm install @obinexusltd/obix-jsx-components
npm install @obinexusltd/obix-jsx-integration

# Or install obix (umbrella package) which includes everything
npm install @obinexusltd/obix
```

---

## Build

```bash
# Build all packages
cd obix-jsx-adapter && npm run build
cd ../obix-jsx-components && npm run build
cd ../obix-jsx-integration && npm run build

# Or from root monorepo
npm run build --workspaces --if-present
```

---

## Testing

```bash
# Test all packages
cd obix-jsx-integration && npm test

# Or individually
npm test -w @obinexusltd/obix-jsx-adapter
npm test -w @obinexusltd/obix-jsx-components
npm test -w @obinexusltd/obix-jsx-integration
```

---

## License

MIT — OBINexus Computing
