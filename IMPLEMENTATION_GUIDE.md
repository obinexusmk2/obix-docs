# OBIX JSX Adapter - Implementation Guide

## Project Structure

This guide covers implementing the three new packages for OBIX JSX support within the monorepo.

### Directory Layout

```
obix/ (root monorepo)
├── ...existing packages...
└── adapters/
    ├── obix-jsx-adapter/              ← New package 1
    ├── obix-jsx-components/           ← New package 2
    └── obix-jsx-integration/          ← New package 3
```

---

## Package 1: @obinexusltd/obix-jsx-adapter

**Purpose**: Core hyperscript factory and JSX runtime

### Directory Structure

```
obix-jsx-adapter/
├── src/
│   ├── factory.ts              [h() function and core logic]
│   ├── types.ts                [TypeScript type definitions]
│   ├── fragment.ts             [Fragment implementation]
│   ├── index.ts                [Barrel export]
│   └── __tests__/
│       ├── factory.test.ts
│       └── fragment.test.ts
├── dist/                        [Compiled output]
│   ├── index.js
│   ├── index.d.ts
│   └── ...
├── package.json
├── tsconfig.json
└── README.md
```

### package.json

```json
{
  "name": "@obinexusltd/obix-jsx-adapter",
  "version": "0.1.0",
  "description": "JSX factory and runtime for OBIX components",
  "license": "MIT",
  "author": "OBINexus",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "src",
    "README.md"
  ],
  "scripts": {
    "build:ts": "tsc",
    "build": "npm run build:ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "~5.4.0",
    "@types/node": "^20.0.0",
    "vitest": "^1.0.0",
    "eslint": "*"
  },
  "keywords": [
    "obix",
    "jsx",
    "adapter",
    "hyperscript",
    "components",
    "ui",
    "accessibility",
    "wcag"
  ]
}
```

### tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
```

### src/index.ts (Barrel Export)

```typescript
export { h, Fragment } from './factory';
export type {
  ObixComponent,
  ComponentFactory,
  ComponentPropsOf,
  ComponentStateOf,
  ComponentActionsOf
} from './factory';
export { JSX_PRAGMA_COMMENT } from './types';
```

---

## Package 2: @obinexusltd/obix-jsx-components

**Purpose**: Factory functions for all 30 OBIX components

### Directory Structure

```
obix-jsx-components/
├── src/
│   ├── primitives/
│   │   ├── button.ts
│   │   ├── card.ts
│   │   ├── image.ts
│   │   ├── video.ts
│   │   ├── link.ts
│   │   └── index.ts
│   ├── forms/
│   │   ├── input.ts
│   │   ├── checkbox.ts
│   │   ├── radio-group.ts
│   │   ├── select.ts
│   │   ├── textarea.ts
│   │   ├── form.ts
│   │   ├── date-picker.ts
│   │   ├── file-upload.ts
│   │   └── index.ts
│   ├── navigation/
│   │   ├── navigation.ts
│   │   ├── breadcrumb.ts
│   │   ├── pagination.ts
│   │   ├── tabs.ts
│   │   ├── stepper.ts
│   │   └── index.ts
│   ├── overlays/
│   │   ├── modal.ts
│   │   ├── dropdown.ts
│   │   ├── tooltip.ts
│   │   └── index.ts
│   ├── feedback/
│   │   ├── alert.ts
│   │   ├── toast.ts
│   │   ├── progress.ts
│   │   ├── loading.ts
│   │   └── index.ts
│   ├── controls/
│   │   ├── slider.ts
│   │   ├── switch.ts
│   │   └── index.ts
│   ├── data/
│   │   ├── table.ts
│   │   ├── accordion.ts
│   │   └── index.ts
│   ├── search/
│   │   ├── search.ts
│   │   ├── autocomplete.ts
│   │   └── index.ts
│   ├── index.ts                [Barrel export - all components]
│   └── __tests__/
│       ├── button.test.ts
│       └── ...
├── dist/
├── package.json
├── tsconfig.json
└── README.md
```

### package.json

```json
{
  "name": "@obinexusltd/obix-jsx-components",
  "version": "0.1.0",
  "description": "JSX factory functions for all 30 OBIX components",
  "license": "MIT",
  "author": "OBINexus",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./primitives": {
      "import": "./dist/primitives/index.js",
      "require": "./dist/primitives/index.js",
      "types": "./dist/primitives/index.d.ts"
    },
    "./forms": {
      "import": "./dist/forms/index.js",
      "require": "./dist/forms/index.js",
      "types": "./dist/forms/index.d.ts"
    },
    "./navigation": {
      "import": "./dist/navigation/index.js",
      "require": "./dist/navigation/index.js",
      "types": "./dist/navigation/index.d.ts"
    },
    "./overlays": {
      "import": "./dist/overlays/index.js",
      "require": "./dist/overlays/index.js",
      "types": "./dist/overlays/index.d.ts"
    },
    "./feedback": {
      "import": "./dist/feedback/index.js",
      "require": "./dist/feedback/index.js",
      "types": "./dist/feedback/index.d.ts"
    },
    "./controls": {
      "import": "./dist/controls/index.js",
      "require": "./dist/controls/index.js",
      "types": "./dist/controls/index.d.ts"
    },
    "./data": {
      "import": "./dist/data/index.js",
      "require": "./dist/data/index.js",
      "types": "./dist/data/index.d.ts"
    },
    "./search": {
      "import": "./dist/search/index.js",
      "require": "./dist/search/index.js",
      "types": "./dist/search/index.d.ts"
    }
  },
  "files": [
    "dist",
    "src",
    "README.md"
  ],
  "scripts": {
    "build:ts": "tsc",
    "build": "npm run build:ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@obinexusltd/obix-component-runtime": "*",
    "@obinexusltd/obix-jsx-adapter": "*"
  },
  "devDependencies": {
    "typescript": "~5.4.0",
    "@types/node": "^20.0.0",
    "vitest": "^1.0.0"
  },
  "keywords": [
    "obix",
    "jsx",
    "components",
    "ui",
    "button",
    "form",
    "input",
    "accessibility"
  ]
}
```

### src/primitives/button.ts (Example)

```typescript
import { createButton } from '@obinexusltd/obix-component-runtime';
import { ComponentFactory } from '@obinexusltd/obix-jsx-adapter';

/**
 * JSX factory for Button component
 * 
 * Usage:
 *   import { obixButton } from '@obinexusltd/obix-jsx-components/primitives';
 *   
 *   <obix-button label="Save" variant="primary" />
 */
export const obixButton: ComponentFactory = (props: any) => {
  return createButton({
    label: props?.label,
    variant: props?.variant || 'default',
    size: props?.size || 'md',
    disabled: props?.disabled || false,
    loading: props?.loading || false,
    type: props?.type || 'button',
    ariaLabel: props?.ariaLabel,
    icon: props?.icon,
  });
};
```

### src/index.ts (Main Export)

```typescript
// Primitives
export { obixButton } from './primitives/button';
export { obixCard } from './primitives/card';
export { obixImage } from './primitives/image';
export { obixVideo } from './primitives/video';
export { obixLink } from './primitives/link';

// Forms
export { obixInput } from './forms/input';
export { obixCheckbox } from './forms/checkbox';
export { obixRadioGroup } from './forms/radio-group';
export { obixSelect } from './forms/select';
export { obixTextarea } from './forms/textarea';
export { obixForm } from './forms/form';
export { obixDatePicker } from './forms/date-picker';
export { obixFileUpload } from './forms/file-upload';

// Navigation
export { obixNavigation } from './navigation/navigation';
export { obixBreadcrumb } from './navigation/breadcrumb';
export { obixPagination } from './navigation/pagination';
export { obixTabs } from './navigation/tabs';
export { obixStepper } from './navigation/stepper';

// Overlays
export { obixModal } from './overlays/modal';
export { obixDropdown } from './overlays/dropdown';
export { obixTooltip } from './overlays/tooltip';

// Feedback
export { obixAlert } from './feedback/alert';
export { obixToast } from './feedback/toast';
export { obixProgress } from './feedback/progress';
export { obixLoading } from './feedback/loading';

// Controls
export { obixSlider } from './controls/slider';
export { obixSwitch } from './controls/switch';

// Data
export { obixTable } from './data/table';
export { obixAccordion } from './data/accordion';

// Search
export { obixSearch } from './search/search';
export { obixAutocomplete } from './search/autocomplete';
```

---

## Package 3: @obinexusltd/obix-jsx-integration

**Purpose**: Bridge JSX output to DOP adapters

### Directory Structure

```
obix-jsx-integration/
├── src/
│   ├── functional.ts            [Functional paradigm helpers]
│   ├── oop.ts                   [OOP paradigm helpers]
│   ├── reactive.ts              [Reactive paradigm helpers]
│   ├── index.ts                 [Barrel export]
│   └── __tests__/
│       ├── functional.test.ts
│       └── ...
├── dist/
├── package.json
├── tsconfig.json
└── README.md
```

### package.json

```json
{
  "name": "@obinexusltd/obix-jsx-integration",
  "version": "0.1.0",
  "description": "Integration layer between JSX and DOP adapter paradigms",
  "license": "MIT",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "src", "README.md"],
  "scripts": {
    "build:ts": "tsc",
    "build": "npm run build:ts",
    "test": "vitest run",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@obinexusltd/obix-jsx-adapter": "*",
    "@obinexusltd/obix-dop-adapter": "*"
  },
  "devDependencies": {
    "typescript": "~5.4.0",
    "vitest": "^1.0.0"
  },
  "keywords": [
    "obix",
    "jsx",
    "dop",
    "adapter",
    "paradigm",
    "functional",
    "reactive"
  ]
}
```

### src/index.ts

```typescript
/**
 * Re-export DOP adapters with JSX convenience naming
 */
export {
  toFunctional as toJSXFunctional,
  toOOP as toJSXOOP,
  toReactive as toJSXReactive,
  toData as toJSXData
} from '@obinexusltd/obix-dop-adapter';

// Re-export OBIX component types
export type { ObixComponent } from '@obinexusltd/obix-jsx-adapter';
```

---

## Integration with Root Monorepo

### Update Root package.json

Add the new workspaces:

```json
{
  "name": "obix-monorepo",
  "private": true,
  "workspaces": [
    "adapters/obix-jsx-adapter",
    "adapters/obix-jsx-components",
    "adapters/obix-jsx-integration",
    "..."
  ]
}
```

### Root tsconfig.json

Ensure JSX is properly configured:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

---

## Build & Test Strategy

### Incremental Build

```bash
# Build all JSX packages
npm run build --workspaces --if-present

# Or individually
cd adapters/obix-jsx-adapter && npm run build
cd adapters/obix-jsx-components && npm run build
cd adapters/obix-jsx-integration && npm run build
```

### Testing

```bash
# Test all
npm test --workspaces --if-present

# Or individually
npm run test -w @obinexusltd/obix-jsx-adapter
npm run test -w @obinexusltd/obix-jsx-components
```

### Type Checking

```bash
# Check all
npm run typecheck --workspaces --if-present
```

---

## Integration with Existing Packages

The new JSX packages integrate with existing OBIX infrastructure:

```typescript
// Import from existing runtime
import { createButton, createInput } from '@obinexusltd/obix-component-runtime';

// Use JSX adapters
import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
import { obixButton, obixInput } from '@obinexusltd/obix-jsx-components';

// Bridge to DOP adapters
import { toFunctional, toReactive } from '@obinexusltd/obix-dop-adapter';
// OR (convenience imports)
import { toJSXFunctional, toJSXReactive } from '@obinexusltd/obix-jsx-integration';
```

---

## Example Implementation: Single Component

Here's the minimal code needed to implement one component factory:

### Step 1: Create Factory File

**File**: `adapters/obix-jsx-components/src/primitives/button.ts`

```typescript
import { createButton } from '@obinexusltd/obix-component-runtime';
import { ComponentFactory } from '@obinexusltd/obix-jsx-adapter';

export const obixButton: ComponentFactory = (props: any) => {
  return createButton({
    label: props?.label,
    variant: props?.variant || 'default',
    size: props?.size || 'md',
    disabled: props?.disabled || false,
    loading: props?.loading || false,
    type: props?.type || 'button',
    ariaLabel: props?.ariaLabel,
  });
};
```

### Step 2: Export from Category

**File**: `adapters/obix-jsx-components/src/primitives/index.ts`

```typescript
export { obixButton } from './button';
export { obixCard } from './card';
// ... other primitives
```

### Step 3: Export from Main

**File**: `adapters/obix-jsx-components/src/index.ts`

```typescript
export { obixButton, obixCard /* ... */ } from './primitives';
// ... other categories
```

### Step 4: Use in JSX

```typescript
import { h } from '@obinexusltd/obix-jsx-adapter';
import { obixButton } from '@obinexusltd/obix-jsx-components';

const btn = h(obixButton, { label: 'Click me', variant: 'primary' });
console.log(btn.render(btn.state));
```

---

## Performance Considerations

### Bundle Size

- **obix-jsx-adapter**: ~3-5 KB (just h() factory)
- **obix-jsx-components**: ~2-3 KB (wrapper functions)
- **obix-jsx-integration**: ~1 KB (re-exports)

All components still use underlying runtime (no duplication).

### Compilation Time

- JSX compilation by TypeScript: negligible overhead
- No runtime JSX parsing or evaluation

### Runtime Performance

- JSX creates components (objects) directly
- No virtual DOM diffing
- Same performance as calling `createButton()` directly

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: OBIX JSX Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run typecheck --workspaces --if-present
      - run: npm run lint --workspaces --if-present
      - run: npm run build --workspaces --if-present
      - run: npm test --workspaces --if-present
```

---

## Next Steps for Implementation

1. **Create directories** under `adapters/`
2. **Implement obix-jsx-adapter** first (h() factory)
3. **Implement obix-jsx-components** second (all 30 component factories)
4. **Implement obix-jsx-integration** third (DOP bridge)
5. **Write tests** for each package
6. **Update monorepo documentation**
7. **Create example applications** using JSX

---

## References

- Root OBIX Architecture
- TypeScript JSX Configuration Docs
- NPM Workspaces Guide
- ECMAScript 2020+ Specification
