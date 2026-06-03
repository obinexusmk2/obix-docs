# OBIX Getting Started

> **Version**: 0.1.0  
> **Last Updated**: 3 June 2026  
> **Prerequisites**: Node.js 18+ (for build tools), or any modern browser (for zero-build HTML)

---

## Table of Contents

1. [The Dependency Problem (Read This First)](#1-the-dependency-problem-read-this-first)
2. [Zero-Build Quick Start (HTML File)](#2-zero-build-quick-start-html-file)
3. [JSX Quick Start (TypeScript/Vite)](#3-jsx-quick-start-typescriptvite)
4. [Separation of Concerns](#4-separation-of-concerns)
5. [Known Bottlenecks & Standard Mismatches](#5-known-bottlenecks--standard-mismatches)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. The Dependency Problem (Read This First)

OBIX is published as **multiple scoped packages** on npm. This creates confusion. Here is the **single source of truth**:

### Which package do I need?

| You want... | Install this | Size | Runtime |
|------------|-------------|------|---------|
| **Plain HTML/JS** (zero build) | `@obinexusltd/obix` | ~12KB | Browser |
| **JSX / TypeScript** | `@obinexusltd/obix-jsx-adapter` + `@obinexusltd/obix` | ~18KB | Browser |
| **Server-side rendering** | `@obinexusltd/obix` | ~12KB | Node.js |
| **Full SDK** (all 30 components) | `@obinexusltd/obix-component-runtime` | ~45KB | Browser |

### Packages to IGNORE (internal/deprecated)

| Package | Status | Why |
|---------|--------|-----|
| `@obinexusltd/obix-core` | ⚠️ Deprecated | Merged into `@obinexusltd/obix` v0.2.0 |
| `@obinexusltd/obix-sdk-core` | ⚠️ Empty repo | Do not use. Repository is empty. |
| `@obinexusltd/obix-jsx-components` | ⚠️ Internal | Used by jsx-adapter. Do not install directly. |

### The dependency hierarchy

```
@obinexusltd/obix                    # Core: state, actions, render, DOP
    └── (no dependencies)

@obinexusltd/obix-jsx-adapter        # JSX factory + runtime
    └── peerDependency: @obinexusltd/obix ^0.1.0

@obinexusltd/obix-component-runtime  # All 30 WCAG components
    └── dependency: @obinexusltd/obix ^0.1.0
```

**Rule**: Always install `@obinexusltd/obix` first. It is the foundation. Everything else is a layer on top.

---

## 2. Zero-Build Quick Start (HTML File)

This is the **simplest possible OBIX program**. No npm. No build. No TypeScript. Just a browser and a CDN.

### `hello-obix.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello OBIX</title>
  <!-- OBIX core from CDN (ES modules) -->
  <script type="importmap">
  {
    "imports": {
      "@obinexusltd/obix": "https://cdn.jsdelivr.net/npm/@obinexusltd/obix@0.1.0/dist/obix.esm.js"
    }
  }
  </script>
  <style>
    /* Minimal jfix styles (OBIX design tokens) */
    :root {
      --obix-primary: #0066cc;
      --obix-success: #28a745;
      --obix-danger: #dc3545;
      --obix-gray-50: #f9fafb;
      --obix-gray-900: #111827;
      --obix-touch-min: 48px;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 0 16px;
      background: var(--obix-gray-50);
      color: var(--obix-gray-900);
    }
    .obix-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: var(--obix-touch-min);
      min-height: var(--obix-touch-min);
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .obix-button:focus {
      outline: 2px solid var(--obix-primary);
      outline-offset: 2px;
    }
    .obix-button--primary {
      background: var(--obix-primary);
      color: white;
    }
    .obix-button--primary:hover {
      background: #0052a3;
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
    }
    .obix-button--danger {
      background: var(--obix-danger);
      color: white;
    }
    .obix-button--danger:hover {
      background: #bd2130;
    }
    .obix-button--ghost {
      background: transparent;
      color: var(--obix-primary);
      border: 1px solid var(--obix-primary);
    }
    .obix-button__spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: obix-spin 0.8s linear infinite;
      margin-right: 8px;
    }
    @keyframes obix-spin { to { transform: rotate(360deg); } }
    .obix-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 16px;
    }
    .obix-input {
      width: 100%;
      min-height: var(--obix-touch-min);
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    .obix-input:focus {
      outline: 2px solid var(--obix-primary);
      outline-offset: 2px;
      border-color: var(--obix-primary);
    }
    .obix-input[aria-invalid="true"] {
      border-color: var(--obix-danger);
    }
    .obix-error {
      color: var(--obix-danger);
      font-size: 0.875rem;
      margin-top: 4px;
    }
    .demo-section {
      margin-bottom: 32px;
    }
    .demo-section h2 {
      font-size: 1.25rem;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <h1>Hello OBIX 👋</h1>
  <p>Zero-build, data-oriented UI components. Open DevTools to inspect state.</p>

  <div id="app"></div>

  <script type="module">
    import { createButton, createInput, createCard } from '@obinexusltd/obix';

    // ============================================================
    // DEMO 1: Hello World Button
    // ============================================================
    const helloBtn = createButton({
      label: 'Hello OBIX',
      variant: 'primary',
      size: 'md'
    });

    // Initial render
    let btnState = helloBtn.state;

    // ============================================================
    // DEMO 2: Interactive Counter
    // ============================================================
    const counterBtn = createButton({
      label: 'Count: 0',
      variant: 'primary',
      size: 'md'
    });
    let count = 0;
    let counterState = counterBtn.state;

    // ============================================================
    // DEMO 3: Form Input with Validation
    // ============================================================
    const emailInput = createInput({
      name: 'email',
      type: 'email',
      label: 'Email Address',
      placeholder: 'you@example.com',
      required: true,
      validation: 'blur',
      pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$',
      ariaDescribedBy: 'email-error'
    });
    let emailState = emailInput.state;

    // ============================================================
    // DEMO 4: Loading State
    // ============================================================
    const loadingBtn = createButton({
      label: 'Save',
      variant: 'primary',
      loading: false
    });
    let loadingState = loadingBtn.state;

    // ============================================================
    // RENDER FUNCTION (the heart of OBIX)
    // state -> action -> new state -> render -> HTML
    // ============================================================
    function render() {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="demo-section">
          <h2>1. Hello World</h2>
          <div class="obix-card">
            ${helloBtn.render(btnState)}
          </div>
        </div>

        <div class="demo-section">
          <h2>2. Interactive Counter</h2>
          <div class="obix-card">
            ${counterBtn.render(counterState)}
            <p style="margin-top:8px; font-size:0.875rem; color:#6b7280;">
              Click the button. State is logged to console.
            </p>
          </div>
        </div>

        <div class="demo-section">
          <h2>3. Form Input with Validation</h2>
          <div class="obix-card">
            <label for="email" style="display:block; margin-bottom:4px; font-weight:500;">
              Email Address
            </label>
            ${emailInput.render(emailState)}
            <p id="email-error" class="obix-error" role="alert">
              ${emailState.error || ''}
            </p>
            <p style="margin-top:8px; font-size:0.875rem; color:#6b7280;">
              Type an invalid email, then click outside to trigger blur validation.
            </p>
          </div>
        </div>

        <div class="demo-section">
          <h2>4. Loading State</h2>
          <div class="obix-card">
            ${loadingBtn.render(loadingState)}
            <p style="margin-top:8px; font-size:0.875rem; color:#6b7280;">
              Click to simulate async save (2s loading).
            </p>
          </div>
        </div>

        <div class="demo-section">
          <h2>Current State (inspect in DevTools)</h2>
          <pre class="obix-card" style="font-size:0.75rem; overflow-x:auto;"><code>${JSON.stringify({
            hello: btnState,
            counter: { ...counterState, _count: count },
            email: emailState,
            loading: loadingState
          }, null, 2)}</code></pre>
        </div>
      `;

      // Attach event listeners after render
      attachListeners();
    }

    function attachListeners() {
      // Hello button click
      const helloEl = document.querySelector('[data-obix="hello-btn"]');
      if (helloEl) {
        helloEl.addEventListener('click', () => {
          console.log('Hello button clicked!');
          console.log('State:', btnState);
        });
      }

      // Counter button click
      const counterEl = document.querySelector('[data-obix="counter-btn"]');
      if (counterEl) {
        counterEl.addEventListener('click', () => {
          count++;
          counterState = counterBtn.actions.setLoading(counterState, false);
          // Manually update label (OBIX limitation: labels are static in config)
          // See "Bottleneck #1" below for why this is awkward
          counterEl.innerHTML = `<span>Count: ${count}</span>`;
          console.log('Count:', count);
        });
      }

      // Email input events
      const emailEl = document.getElementById('email');
      if (emailEl) {
        emailEl.addEventListener('input', (e) => {
          emailState = emailInput.actions.change(emailState, e.target.value);
          render(); // Re-render to update error state
        });
        emailEl.addEventListener('blur', () => {
          emailState = emailInput.actions.blur(emailState);
          render();
        });
      }

      // Loading button click
      const loadEl = document.querySelector('[data-obix="loading-btn"]');
      if (loadEl) {
        loadEl.addEventListener('click', () => {
          loadingState = loadingBtn.actions.setLoading(loadingState, true);
          render();

          // Simulate async operation
          setTimeout(() => {
            loadingState = loadingBtn.actions.setLoading(loadingState, false);
            render();
          }, 2000);
        });
      }
    }

    // Initial render
    render();

    // Expose to window for DevTools inspection
    window.OBIX = { helloBtn, counterBtn, emailInput, loadingBtn, btnState, counterState, emailState, loadingState };
    console.log('OBIX components exposed on window.OBIX');
    console.log('Try: OBIX.helloBtn.state');
  </script>
</body>
</html>
```

### How to run

```bash
# Option 1: Open directly in browser (file:// protocol works with importmap)
open hello-obix.html

# Option 2: Serve with any static server
npx serve .
# Then open http://localhost:3000/hello-obix.html
```

### What this demonstrates

| Feature | Code | OBIX Principle |
|---------|------|---------------|
| Component creation | `createButton({...})` | Factory function |
| State access | `helloBtn.state` | Explicit data |
| State transition | `counterBtn.actions.setLoading(state, true)` | Pure function |
| Render | `helloBtn.render(state)` | Deterministic HTML |
| Event handling | Manual DOM listeners | You control the flow |

---

## 3. JSX Quick Start (TypeScript/Vite)

### Step 1: Create project

```bash
npm create vite@latest my-obix-app -- --template vanilla-ts
cd my-obix-app
```

### Step 2: Install dependencies

```bash
# Install the TWO required packages
npm install @obinexusltd/obix @obinexusltd/obix-jsx-adapter

# Install dev dependencies for JSX
npm install -D typescript @vitejs/plugin-react
```

### Step 3: Configure TypeScript

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Critical**: `jsxFactory` must be `"h"`, not `"React.createElement"`.

### Step 4: Configure Vite

`vite.config.ts`:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';`
  }
});
```

### Step 5: Create the JSX component

`src/hello-world.tsx`:

```tsx
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
import { createButton, createInput, createCard } from '@obinexusltd/obix';

// ============================================================
// OBIX JSX PATTERN
// ============================================================
// In standard React: <Button /> creates a virtual DOM node.
// In OBIX JSX: <createButton /> calls createButton(props) immediately.
// The result is a COMPONENT INSTANCE, not a virtual node.
// You must call .render(state) to get HTML.
// ============================================================

export function HelloWorld() {
  // JSX creates the component INSTANCE (not a VNode)
  const btn = <createButton 
    label="Click Me" 
    variant="primary" 
    size="md" 
  />;

  // btn is now: { state, actions, render, lifecycle, ... }
  // NOT: { type: 'div', props: {}, children: [] }

  let btnState = btn.state;

  function handleClick() {
    btnState = btn.actions.click(btnState);
    console.log('Clicked! New state:', btnState);
    // YOU must trigger re-render. OBIX has no reactive system.
    renderApp();
  }

  function renderApp() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="obix-card">
        ${btn.render(btnState)}
      </div>
    `;

    // Attach event listener AFTER render
    const btnEl = app.querySelector('.obix-button');
    btnEl?.addEventListener('click', handleClick);
  }

  // Initial render
  renderApp();

  return null; // OBIX JSX components don't return VNodes
}

// ============================================================
// COMPLETE FORM EXAMPLE
// ============================================================
export function LoginForm() {
  const emailInput = <createInput
    name="email"
    type="email"
    label="Email"
    required
    validation="blur"
  />;

  const passwordInput = <createInput
    name="password"
    type="password"
    label="Password"
    required
    minLength={8}
  />;

  const submitBtn = <createButton
    label="Sign In"
    variant="primary"
  />;

  let emailState = emailInput.state;
  let passwordState = passwordInput.state;
  let submitState = submitBtn.state;

  function renderForm() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <form class="obix-card">
        <h2>Sign In</h2>
        <div style="margin-bottom:16px;">
          <label for="email">Email</label>
          ${emailInput.render(emailState)}
          ${emailState.error ? `<p class="obix-error">${emailState.error}</p>` : ''}
        </div>
        <div style="margin-bottom:16px;">
          <label for="password">Password</label>
          ${passwordInput.render(passwordState)}
        </div>
        ${submitBtn.render(submitState)}
      </form>
    `;

    // Attach listeners
    const emailEl = document.getElementById('email');
    emailEl?.addEventListener('input', (e) => {
      emailState = emailInput.actions.change(emailState, e.target.value);
      renderForm();
    });
    emailEl?.addEventListener('blur', () => {
      emailState = emailInput.actions.blur(emailState);
      renderForm();
    });

    const pwEl = document.getElementById('password');
    pwEl?.addEventListener('input', (e) => {
      passwordState = passwordInput.actions.change(passwordState, e.target.value);
      renderForm();
    });

    const submitEl = app.querySelector('.obix-button');
    submitEl?.addEventListener('click', (e) => {
      e.preventDefault();
      submitState = submitBtn.actions.setLoading(submitState, true);
      renderForm();

      setTimeout(() => {
        submitState = submitBtn.actions.setLoading(submitState, false);
        renderForm();
      }, 1500);
    });
  }

  renderForm();
  return null;
}
```

### Step 6: Entry point

`src/main.ts`:

```typescript
import { HelloWorld } from './hello-world';

// OBIX JSX "components" are imperative, not declarative.
// They execute side effects (DOM manipulation) immediately.
HelloWorld();
```

### Step 7: Run

```bash
npm run dev
```

---

## 4. Separation of Concerns

OBIX has **three layers**. Do not mix them.

### Layer 1: Core (`@obinexusltd/obix`)

**Responsibility**: Component factory, state management, render engine.

```typescript
import { createButton } from '@obinexusltd/obix';

const btn = createButton({ label: 'Save' });
// Returns: { state, actions, render, lifecycle, halt, resume, destroy, undo, revisions }
```

**What it does NOT do**:
- JSX transformation
- DOM event binding
- Reactive updates
- CSS-in-JS

### Layer 2: JSX Adapter (`@obinexusltd/obix-jsx-adapter`)

**Responsibility**: JSX factory function (`h`) and fragment support.

```typescript
import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';

// h(tag, props, ...children) -> calls tag(props) if tag is a function
// This is NOT React.createElement. It executes the factory immediately.
```

**What it does NOT do**:
- Virtual DOM diffing
- Component lifecycle management
- State reactivity

### Layer 3: Application (Your Code)

**Responsibility**: Event handling, state orchestration, re-rendering.

```typescript
// YOU write this:
function renderApp() {
  app.innerHTML = component.render(currentState);
  attachListeners();
}

// YOU call this when state changes:
buttonEl.addEventListener('click', () => {
  currentState = component.actions.click(currentState);
  renderApp(); // <-- YOU trigger re-render
});
```

### The Contract Between Layers

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: YOUR APPLICATION                                  │
│  - Event listeners                                          │
│  - State variables                                          │
│  - Render loop (you call it)                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ calls .render(state)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: JSX ADAPTER (optional)                            │
│  - h() factory function                                     │
│  - Fragment support                                         │
│  - Transforms <createButton /> → createButton(props)        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ calls createButton(props)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: OBIX CORE                                         │
│  - Factory functions (createButton, createInput, etc.)      │
│  - State objects (plain data)                               │
│  - Action functions (pure transforms)                       │
│  - Render functions (state → HTML string)                   │
│  - FUD policy enforcement                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Known Bottlenecks & Standard Mismatches

### Bottleneck #1: No Reactive System

**Problem**: OBIX does not re-render automatically when state changes.

```typescript
// React (automatic):
setCount(count + 1); // Component re-renders automatically

// OBIX (manual):
count++;
state = btn.actions.setLoading(state, false);
app.innerHTML = btn.render(state); // YOU must do this
attachListeners(); // YOU must re-attach listeners
```

**Impact**: Every interactive component requires boilerplate:
1. Store state in a variable
2. Attach event listener
3. In handler: call action, update variable, call render
4. In render: generate HTML, attach listeners again

**Workaround**: Build a thin wrapper:

```typescript
function createReactive(component, containerId) {
  let state = component.state;
  const container = document.getElementById(containerId);

  function render() {
    container.innerHTML = component.render(state);
    return container;
  }

  function dispatch(action, ...args) {
    state = component.actions[action](state, ...args);
    render();
    return state;
  }

  return { render, dispatch, getState: () => state };
}

// Usage:
const reactiveBtn = createReactive(createButton({ label: 'Click' }), 'app');
reactiveBtn.render();
document.querySelector('.obix-button').addEventListener('click', () => {
  reactiveBtn.dispatch('click');
});
```

---

### Bottleneck #2: JSX is Compile-Time, Not Render-Time

**Standard Violation**: OBIX JSX violates the JSX specification (RFC).

**Standard JSX** (React, Preact, Solid):
```tsx
// <Button label="x" /> compiles to:
React.createElement(Button, { label: "x" })
// Returns a VIRTUAL NODE (description of what to render)
// Component executes at RENDER time, not compile time
```

**OBIX JSX**:
```tsx
// <createButton label="x" /> compiles to:
h(createButton, { label: "x" })
// h() calls createButton({ label: "x" }) IMMEDIATELY
// Returns a COMPONENT INSTANCE (already executed)
// The "component" is a data object, not a function to call later
```

**Why this is a problem**:

1. **You cannot use JSX for conditional rendering**:
   ```tsx
   // This DOES NOT WORK as expected:
   const btn = condition ? <createButton label="A" /> : <createButton label="B" />;
   // Both buttons are created immediately at module load time,
   // not when the condition is evaluated at render time.
   ```

2. **You cannot pass components as props**:
   ```tsx
   // This DOES NOT WORK:
   function Wrapper({ child }) {
     return <div>{child.render(child.state)}</div>;
   }
   // child is already an instance, not a component type.
   ```

3. **JSX is syntactic sugar for immediate execution**:
   ```tsx
   // These are IDENTICAL in OBIX:
   const a = <createButton label="x" />;
   const b = createButton({ label: "x" });
   // a === b (both are component instances)
   // JSX adds zero value except visual familiarity.
   ```

**Standard Mismatch Severity**: HIGH. This is not "JSX-like authoring." This is "factory function calls with angle brackets." The mental model is fundamentally different from React/Preact/Solid.

**Correct mental model**:
```text
OBIX JSX is NOT:  <Component /> → VNode → render → DOM
OBIX JSX IS:      <factory />   → Instance (already created) → .render() → HTML string
```

---

### Bottleneck #3: Labels Are Config, Not State

**Problem**: The `label` property is set at creation time, not in state.

```typescript
const btn = createButton({ label: 'Save' });
console.log(btn.state);
// { label: 'Save', variant: 'primary', loading: false, ... }
// label IS in state, but there's no action to change it.

// There is NO:
btn.actions.setLabel(state, 'New Label');
// You must recreate the component:
const newBtn = createButton({ label: 'New Label' });
```

**Impact**: Dynamic text (counters, user names, translations) requires either:
- Recreating the component (loses state history)
- Manually mutating the DOM after render (breaks the DOP model)
- Using `dangerouslySetInnerHTML`-style content injection

**Standard Mismatch**: In React, props flow down and re-render updates text. In OBIX, config is frozen at creation.

---

### Bottleneck #4: Server-Side Rendering is Broken

**Problem**: Components reference browser APIs in their config types.

```typescript
// From the docs:
interface TooltipConfig {
  trigger: HTMLElement | string;  // HTMLElement does not exist in Node.js
}

// From the workspace:
// drivers/accessibility-tree references window, document
// drivers/animation-frame references requestAnimationFrame
// drivers/gpu-acceleration references WebGL
```

**Impact**: `createTooltip()`, `createNavigation()` with mobile menu, and any component using `HTMLElement` will throw `ReferenceError` in Node.js.

**Standard Mismatch**: The docs claim "Perfect for server-side rendering" but the component configs are not isomorphic.

**Workaround**: Use only these components on the server:
- `createButton`
- `createInput` (without validation that touches DOM)
- `createCard`
- `createTable`
- `createAlert`

Avoid on server:
- `createTooltip` (needs HTMLElement)
- `createModal` (needs focus trap, DOM queries)
- `createNavigation` (needs mobile menu, DOM measurements)
- `createDropdown` (needs positioning, DOM measurements)

---

### Bottleneck #5: FUD Policy Enforcement is Static

**Problem**: FUD policies run once at creation, not at render.

```typescript
const btn = createButton({ label: '', icon: 'save' });
// Policy auto-adds: ariaLabel: 'Save document'
// This happens ONCE when createButton is called.

// If you later render with different state:
const newState = { ...btn.state, icon: 'delete' };
// The ariaLabel still says 'Save document', not 'Delete document'
```

**Impact**: Policies can become stale if state evolves in ways the factory didn't anticipate.

**Standard Mismatch**: Accessibility should be computed at render time based on current state, not at creation time based on initial config.

---

### Bottleneck #6: 53 Repos, No Monorepo

**Problem**: The workspace clones 53 repositories for development.

**Impact on users**:
- Version drift between packages
- `obix-sdk-core` is literally empty (you saw the warning)
- `obix-legacy` has 927 commits but is called "legacy"
- 88 `package.json` files means 88 potential version conflicts

**Standard Mismatch**: Modern libraries use monorepos (Nx, Turborepo, pnpm workspaces) with atomic releases. OBIX uses a Python script to clone 53 git repos.

---

## 6. Troubleshooting

### "Cannot find module '@obinexusltd/obix/jsx-runtime'"

**Cause**: The docs reference a path that does not exist.

**Fix**: Install `@obinexusltd/obix-jsx-adapter` separately:

```bash
npm install @obinexusltd/obix-jsx-adapter
```

Then import from there:

```typescript
import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
```

---

### "h is not defined" in JSX files

**Cause**: Vite/TypeScript not configured with `jsxFactory: "h"`.

**Fix**: Add to `vite.config.ts`:

```typescript
export default {
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: `import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';`
  }
};
```

And to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

---

### "HTMLElement is not defined" in Node.js

**Cause**: Using a component that expects browser APIs on the server.

**Fix**: Use only server-safe components:

```typescript
// Safe for SSR:
import { createButton, createInput, createCard, createTable, createAlert } from '@obinexusltd/obix';

// NOT safe for SSR:
import { createTooltip, createModal, createNavigation, createDropdown } from '@obinexusltd/obix';
// These reference HTMLElement, window, document
```

---

### "My button doesn't update when I click it"

**Cause**: OBIX is not reactive. You must call `.render()` after every state change.

**Fix**: See "Bottleneck #1" workaround above for a reactive wrapper.

---

### "The JSX example in the docs doesn't work"

**Cause**: The docs show JSX usage but omit the required build configuration.

**Fix**: Follow Section 3 (JSX Quick Start) exactly. The docs' JSX examples assume you already have `tsconfig.json` and Vite configured, which is not stated clearly.

---

## Summary

| What OBIX does well | What OBIX struggles with |
|--------------------|--------------------------|
| ✅ Data-oriented, testable state | ❌ No reactive re-rendering |
| ✅ WCAG 2.1 AA compliance built-in | ❌ JSX is not standard JSX |
| ✅ Framework-agnostic (pure JS) | ❌ Server components are half-broken |
| ✅ Deterministic render output | ❌ 53-repo architecture is unmaintainable |
| ✅ Accessibility policy enforcement | ❌ Dynamic labels require DOM hacks |
| ✅ Zero virtual DOM overhead | ❌ Documentation mismatches npm reality |

**Recommendation for production**: Use OBIX for **static HTML generation** and **accessibility-first component libraries** where the DOP model shines. Do NOT use OBIX JSX for complex interactive SPAs until the reactive layer and server isomorphic fixes land.
