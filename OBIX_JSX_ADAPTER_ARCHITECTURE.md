# OBIX JSX Adapter Architecture

**Version**: 1.0  
**Date**: June 2026  
**Status**: Implemented architecture for the packages in `runtime/`

---

## Executive Summary

The OBIX JSX Adapter enables developers to write OBIX components using standard **JSX syntax** while maintaining the core data-oriented, accessibility-first philosophy. This document specifies how JSX compiles to OBIX component definitions and integrates with the existing `obix-dop-adapter` system.

### Key Design Principles

1. **JSX is Syntax Sugar** — JSX compiles to pure function calls, not virtual DOM
2. **Component Independence** — OBIX components remain framework-agnostic
3. **Paradigm Agnostic** — JSX components work with Functional, OOP, Reactive, and Data adapters
4. **JSX Syntax Compatibility** — Uses standard JSX compilation entry points while preserving OBIX's explicit render/data-object runtime
5. **Zero Runtime Overhead** — Compilation produces plain OBIX component definitions

---

## Architecture Overview

### Three-Layer Design

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: JSX Source Code (Developer API)                   │
│  ─────────────────────────────────────────────────────────  │
│  export default function LoginForm() {                       │
│    return (                                                  │
│      <obix-form label="Login">                              │
│        <obix-input type="email" label="Email" required />   │
│        <obix-button label="Sign In" variant="primary" />    │
│      </obix-form>                                           │
│    );                                                        │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                           ↓ (JSX Compilation)
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Function Calls (Intermediate Representation)      │
│  ─────────────────────────────────────────────────────────  │
│  h(obixForm, { label: 'Login' },                            │
│    h(obixInput, {                                           │
│      type: 'email',                                         │
│      label: 'Email',                                        │
│      required: true                                         │
│    }),                                                       │
│    h(obixButton, {                                          │
│      label: 'Sign In',                                      │
│      variant: 'primary'                                     │
│    })                                                        │
│  );                                                          │
└─────────────────────────────────────────────────────────────┘
                    ↓ (obix-jsx-factory)
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: OBIX Components (Runtime Objects)                 │
│  ─────────────────────────────────────────────────────────  │
│  {                                                           │
│    name: 'Form',                                            │
│    state: { ... },                                          │
│    actions: { ... },                                        │
│    render: (state) => '<form>...</form>',                   │
│    aria: { ... },                                           │
│    children: [                                              │
│      { name: 'Input', state: ..., actions: ..., ... },     │
│      { name: 'Button', state: ..., actions: ..., ... }     │
│    ]                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                    ↓ (obix-dop-adapter)
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Paradigm Adapters (Multiple APIs)                 │
│  ─────────────────────────────────────────────────────────  │
│  • Functional: state, dispatch, getState                    │
│  • OOP: instance.state, instance.click(), bind methods     │
│  • Reactive: instance.subscribe(listener)                   │
│  • Data: pure logic object                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Package Structure

### Implemented Packages

```
@obinexusltd/
├── obix-jsx-adapter/              [Core JSX factory and runtime]
│   ├── src/
│   │   ├── factory.ts             [h() hyperscript factory]
│   │   ├── component-wrapper.ts    [Wraps OBIX components for JSX]
│   │   ├── fragment.ts             [Fragment support]
│   │   ├── children.ts             [Child element processing]
│   │   └── index.ts                [Main exports]
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── obix-jsx-components/           [JSX factory functions for all 30 components]
│   ├── src/
│   │   ├── primitives/             [Button, Card, Image, Video, Link]
│   │   ├── forms/                  [Input, Checkbox, Radio, Select, etc.]
│   │   ├── navigation/             [Navigation, Breadcrumb, Tabs, etc.]
│   │   ├── overlays/               [Modal, Dropdown, Tooltip]
│   │   ├── feedback/               [Alert, Toast, Progress, Loading]
│   │   ├── controls/               [Slider, Switch]
│   │   ├── data/                   [Table, Accordion]
│   │   ├── search/                 [Search, Autocomplete]
│   │   └── index.ts                [Barrel exports]
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
└── obix-jsx-integration/          [DOP adapter + JSX bridge]
    ├── src/
    │   ├── jsx-to-dop.ts          [Convert JSX output to DOP paradigms]
    │   ├── functional-jsx.ts        [Functional paradigm helpers]
    │   ├── oop-jsx.ts              [OOP paradigm helpers]
    │   ├── reactive-jsx.ts         [Reactive paradigm helpers]
    │   └── index.ts
    ├── tsconfig.json
    ├── package.json
    └── README.md
```

---

## JSX Compilation Flow

### Input: JSX Syntax

```jsx
export default function TodoForm() {
  return (
    <obix-form label="New Todo">
      <obix-input 
        name="title" 
        label="Task" 
        required 
      />
      <obix-button label="Add" variant="primary" />
    </obix-form>
  );
}
```

### Intermediate: Function Calls

The TypeScript compiler (configured with `jsxFactory: "h"`) converts JSX to:

```typescript
h(
  obixForm,
  { label: "New Todo" },
  h(
    obixInput,
    { name: "title", label: "Task", required: true }
  ),
  h(
    obixButton,
    { label: "Add", variant: "primary" }
  )
);
```

### Output: OBIX Component Objects

```typescript
{
  name: 'Form',
  state: {
    label: 'New Todo',
    fields: [],
    valid: false
  },
  actions: { /* ... */ },
  render: (state) => string,
  children: [
    {
      name: 'Input',
      state: { name: 'title', label: 'Task', required: true, ... },
      actions: { /* ... */ },
      render: (state) => string
    },
    {
      name: 'Button',
      state: { label: 'Add', variant: 'primary', ... },
      actions: { /* ... */ },
      render: (state) => string
    }
  ]
}
```

---

## Core Concepts

### 1. JSX Elements vs OBIX Components

| Aspect | JSX Element | OBIX Component |
|--------|-----------|-----------------|
| **Syntax** | `<ComponentName prop="value" />` | JavaScript object |
| **Runtime** | Function call during JSX evaluation | Plain data structure |
| **Framework** | Generic (works with any JSX runtime) | OBIX-specific |
| **Rendering** | Delegated to runtime | Explicit function call |

### 2. Props → Component Config

JSX attributes map directly to OBIX component config:

```jsx
<obix-input 
  name="email" 
  type="email"
  label="Email Address"
  required
  disabled={false}
/>
```

Becomes:

```typescript
{
  name: 'email',
  type: 'email',
  label: 'Email Address',
  required: true,  // Boolean attribute
  disabled: false
}
```

### 3. Children Processing

JSX children are collected and passed to parent:

```jsx
<obix-form label="Login">
  <obix-input label="Email" />
  <obix-button label="Sign In" />
</obix-form>
```

The `h()` factory:
1. Creates the form component
2. Collects input and button components
3. Attaches them to `form.children` array
4. Returns the form component with children

### 4. Fragment Support

Unnamed wrappers using `<>...</>` syntax:

```jsx
return (
  <>
    <obix-input label="Name" />
    <obix-input label="Email" />
  </>
);
```

Compiles to:

```typescript
h(Fragment, null,
  h(obixInput, { label: "Name" }),
  h(obixInput, { label: "Email" })
);
```

Fragments return children directly (no wrapper component).

---

## Component Definition Pattern

### Standard OBIX Component Factory

```typescript
// Before JSX (existing pattern)
const emailInput = createInput({
  name: 'email',
  type: 'email',
  label: 'Email Address',
  required: true
});
```

### JSX Component Factory

```typescript
// After JSX (new pattern)
export const obixInput = (props: InputProps) => createInput(props);

// Usage
<obix-input 
  name="email" 
  type="email" 
  label="Email Address" 
  required 
/>
```

### Naming Convention

| Pattern | Usage | Example |
|---------|-------|---------|
| `obixButton` | JavaScript factory | `h(obixButton, { label: 'Save' })` |
| `<obix-button />` | JSX syntax | `<obix-button label="Save" />` |
| `createButton` | Original OBIX | `createButton({ label: 'Save' })` |

---

## JSX to OBIX Transformation Examples

### Example 1: Simple Button

**JSX:**
```jsx
<obix-button label="Click me" variant="primary" />
```

**Intermediate (h calls):**
```typescript
h(obixButton, { label: "Click me", variant: "primary" })
```

**OBIX Output:**
```typescript
createButton({
  label: "Click me",
  variant: "primary"
})
// Returns: {
//   name: 'Button',
//   state: { label: "Click me", variant: "primary", ... },
//   actions: { ... },
//   render: (state) => string,
//   aria: { ... }
// }
```

---

### Example 2: Form with Inputs

**JSX:**
```jsx
export function LoginForm() {
  return (
    <obix-form label="Login">
      <obix-input 
        name="email" 
        type="email" 
        label="Email" 
        required 
      />
      <obix-input 
        name="password" 
        type="password" 
        label="Password" 
        required 
      />
      <obix-button label="Sign In" variant="primary" />
    </obix-form>
  );
}
```

**Intermediate:**
```typescript
h(obixForm,
  { label: "Login" },
  h(obixInput, {
    name: "email",
    type: "email",
    label: "Email",
    required: true
  }),
  h(obixInput, {
    name: "password",
    type: "password",
    label: "Password",
    required: true
  }),
  h(obixButton, {
    label: "Sign In",
    variant: "primary"
  })
)
```

**OBIX Output:**
```typescript
{
  name: 'Form',
  state: { 
    label: "Login",
    fields: [],
    valid: false,
    // ... other form state
  },
  actions: { /* ... */ },
  render: (state) => string,
  children: [
    {
      name: 'Input',
      state: { name: 'email', type: 'email', ... },
      actions: { /* ... */ },
      render: (state) => string
    },
    {
      name: 'Input',
      state: { name: 'password', type: 'password', ... },
      actions: { /* ... */ },
      render: (state) => string
    },
    {
      name: 'Button',
      state: { label: "Sign In", variant: "primary", ... },
      actions: { /* ... */ },
      render: (state) => string
    }
  ]
}
```

---

## Integration with obix-dop-adapter

After JSX compilation produces OBIX components, they work seamlessly with the existing DOP adapter:

```typescript
import { h } from '@obinexusltd/obix-jsx-adapter';
import { obixButton } from '@obinexusltd/obix-jsx-components';
import { toFunctional, toOOP, toReactive } from '@obinexusltd/obix-dop-adapter';

// 1. Create via JSX
const button = h(obixButton, { label: "Save" });

// 2. Adapt to different paradigms

// Functional paradigm
const functional = toFunctional(button);
functional.dispatch('setLoading', true);
console.log(functional.getState());

// OOP paradigm
const oop = toOOP(button);
oop.instance.state.loading = true;
oop.instance.click();

// Reactive paradigm
const reactive = toReactive(button);
reactive.subscribe((newState) => {
  console.log('Button state changed:', newState);
});

// Data paradigm (raw logic)
const data = button; // Already data!
console.log(data.state, data.actions, data.render);
```

---

## TypeScript Configuration

### Root `tsconfig.json`

```json
{
  "extends": "@obinexusltd/obix-config-typescript",
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "target": "ES2020",
    "module": "ESNext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler"
  }
}
```

### Package-specific `tsconfig.json`

Each package extends the root config:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

---

## Design Decisions

### 1. Why Custom `h()` Instead of React?

**Reason**: OBIX components are already data objects. Using React's h() would:
- Add virtual DOM overhead
- Create React-specific dependencies
- Violate framework independence

**Solution**: Custom `h()` factory that directly returns OBIX component objects.

### 2. Why JSX Over Template Literals?

**Reason**: JSX provides:
- Better IDE support (IntelliSense, type checking)
- Familiar syntax for React developers
- Compile-time validation
- Cleaner nested component syntax

### 3. Children Processing Strategy

**Question**: How are form fields and overlay content handled?

**Answer**:
- Parent components get `.children` array
- Children inherit parent's FUD policies
- Rendering parent calls `render(state)` + combines child renders
- Event delegation through data attributes and listeners

### 4. State Management in JSX

**Question**: Where does component state live?

**Answer**:
- In the component object (`.state`)
- Actions transform state immutably (return new state)
- Parent components manage child state via prop drilling or context-like patterns
- DOP adapter enables functional closure state or reactive subscriptions

---

## API Design Summary

### `@obinexusltd/obix-jsx-adapter`

Core factory for creating components from JSX:

```typescript
/**
 * Hyperscript factory for JSX compilation
 * Converts JSX elements to OBIX component objects
 */
export function h<T extends ObixComponentType>(
  component: T | typeof Fragment,
  props: PropsFor<T> | null,
  ...children: (ObixComponent | string | null | undefined)[]
): ObixComponent<StateOf<T>>;

/**
 * Fragment marker for grouping children without wrapper
 */
export const Fragment: unique symbol;

/**
 * Type inference helpers
 */
export type PropsFor<T> = /* ... */;
export type StateOf<T> = /* ... */;
export type ObixComponent<S = unknown> = /* ... */;
```

### `@obinexusltd/obix-jsx-components`

Factory functions for each component:

```typescript
// Primitives
export const obixButton: ComponentFactory<ButtonConfig>;
export const obixCard: ComponentFactory<CardConfig>;
export const obixImage: ComponentFactory<ImageConfig>;
export const obixVideo: ComponentFactory<VideoConfig>;
export const obixLink: ComponentFactory<LinkConfig>;

// Forms
export const obixInput: ComponentFactory<InputConfig>;
export const obixCheckbox: ComponentFactory<CheckboxConfig>;
export const obixRadioGroup: ComponentFactory<RadioGroupConfig>;
export const obixSelect: ComponentFactory<SelectConfig>;
export const obixTextarea: ComponentFactory<TextareaConfig>;
export const obixForm: ComponentFactory<FormConfig>;
export const obixDatePicker: ComponentFactory<DatePickerConfig>;
export const obixFileUpload: ComponentFactory<FileUploadConfig>;

// ... and 22 more components
```

### `@obinexusltd/obix-jsx-integration`

Bridges JSX output to DOP adapters:

```typescript
/**
 * Convert JSX-created component to functional paradigm
 */
export function toJSXFunctional<S>(
  component: ObixComponent<S>,
  initialProps?: Partial<S>
): FunctionalComponent<S>;

/**
 * Convert to OOP paradigm
 */
export function toJSXOOP<S>(
  component: ObixComponent<S>,
  initialProps?: Partial<S>
): OOPComponent<S>;

/**
 * Convert to reactive paradigm
 */
export function toJSXReactive<S>(
  component: ObixComponent<S>,
  initialProps?: Partial<S>
): ReactiveComponent<S>;
```

---

## Next Steps

1. **Implementation**: Create `obix-jsx-adapter` with core `h()` factory
2. **Component Wrappers**: Create `obix-jsx-components` with 30 component factories
3. **Integration**: Build `obix-jsx-integration` bridge to DOP adapter
4. **Testing**: Write comprehensive test suites for JSX compilation
5. **Documentation**: Create JSX style guide and patterns
6. **Examples**: Build demo applications using JSX paradigm

---

## Benefits Summary

| Benefit | Description |
|---------|-------------|
| **Developer Experience** | Familiar JSX syntax for component composition |
| **Framework Independence** | Works in vanilla JS, React, Vue, SSR, HTMX |
| **Type Safety** | Full TypeScript support with IntelliSense |
| **Accessibility** | FUD policies still enforced automatically |
| **Paradigm Support** | Functional, OOP, Reactive through adapters |
| **Performance** | No virtual DOM, direct OBIX compilation |
| **Testability** | Pure functions and data structures |

---

## References

- OBIX Component Documentation
- ECMAScript 2020 Specification
- JSX Specification (https://facebook.github.io/jsx/)
- TypeScript JSX Configuration
- OBINexus DOP Adapter Documentation
