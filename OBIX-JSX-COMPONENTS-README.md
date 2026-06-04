# @obinexusltd/obix-jsx-components

**JSX Factory Functions for 30 OBIX UI Components**

[![NPM Version](https://img.shields.io/npm/v/@obinexusltd/obix-jsx-components.svg)](https://www.npmjs.com/package/@obinexusltd/obix-jsx-components)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

---

## Overview

`@obinexusltd/obix-jsx-components` provides **30 production-ready JSX component factories** that compile to pure OBIX data objects. No virtual DOM. No framework dependencies. Just plain HTML/CSS/JS.

### Core Philosophy

**JSX is syntax sugar. Components are instantiated OBIX data objects.**

```tsx
// JSX authoring syntax
<obix-button label="Save" variant="primary" />

// ↓ (TypeScript compiler)

// Function Call (intermediate)
h(obixButton, { label: "Save", variant: "primary" })

// ↓ (@obinexusltd/obix-jsx-adapter)

// Data Object (OBIX runtime)
{
  name: 'Button',
  state: { label: 'Save', variant: 'primary', ... },
  actions: { setLabel, setDisabled, ... },
  render: (state) => '<button>Save</button>',
  aria: { ... }
}
```

---

## Features

### 30 Components Organized by Category

| Category | Components |
|----------|-----------|
| **Primitives** | button, card, image, video, link |
| **Forms** | input, checkbox, radio-group, select, textarea, form, date-picker, file-upload |
| **Navigation** | navigation, breadcrumb, pagination, tabs, stepper |
| **Overlays** | modal, dropdown, tooltip |
| **Feedback** | alert, toast, progress, loading |
| **Controls** | slider, switch |
| **Data** | table, accordion |
| **Search** | search, autocomplete |

### Benefits

✅ **Framework-Agnostic** — Works in vanilla JS, React, Vue, SSR, HTMX, Svelte  
✅ **Type-Safe** — Full TypeScript support with JSX compilation  
✅ **Accessibility First** — WCAG 2.1 AA compliant by default  
✅ **Immutable State** — Pure functions for predictable rendering  
✅ **Server-Renderable** — No DOM needed, just `.render(state)` → HTML string  
✅ **Non-Monolithic** — Paradigm-agnostic, works with Functional/OOP/Reactive adapters  
✅ **Zero Dependencies** — Only depends on `obix-component-runtime` and `obix-jsx-adapter`  
✅ **Tested** — Unit + render + integration tests for every component  

---

## Installation

```bash
npm install @obinexusltd/obix-jsx-components
npm install @obinexusltd/obix-jsx-adapter  # Required peer
npm install @obinexusltd/obix-component-runtime  # Required peer
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "target": "ES2020",
    "module": "ESNext",
    "strict": true
  }
}
```

---

## Quick Start

### 1. Vanilla JavaScript (No Build Step)

```html
<!DOCTYPE html>
<html>
<head>
  <title>OBIX JSX Demo</title>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { h } from '@obinexusltd/obix-jsx-adapter';
    import { obixButton } from '@obinexusltd/obix-jsx-components';

    const button = h(obixButton, { label: 'Click Me', variant: 'primary' });
    document.getElementById('app').innerHTML = button.render(button.state);
  </script>
</body>
</html>
```

### 2. TypeScript with JSX Syntax

```typescript
/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
import { obixForm, obixInput, obixButton } from '@obinexusltd/obix-jsx-components';

function LoginForm() {
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

const form = LoginForm();
document.getElementById('app').innerHTML = form.render(form.state);
```

### 3. Server-Side Rendering

OBIX supports string rendering on the server for components that do not depend on browser-only configuration or runtime objects.

```typescript
import express from 'express';
import { h } from '@obinexusltd/obix-jsx-adapter';
import { obixCard, obixButton } from '@obinexusltd/obix-jsx-components';

const app = express();

app.get('/', (req, res) => {
  const card = h(obixCard, { title: 'Dashboard' });
  const button = h(obixButton, { label: 'Get Started', variant: 'primary' });

  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        ${card.render(card.state)}
        ${button.render(button.state)}
      </body>
    </html>
  `;

  res.send(html);
});

app.listen(3000);
```

SSR guidance:
- SSR-safe: components that only need serializable config and `.render(state)`
- Browser-enhanced: components that can render on the server but need browser APIs for interaction
- Browser-only: components whose config or lifecycle requires `HTMLElement`, `window`, or `document`

JSX in OBIX does not create deferred virtual nodes. `h()` instantiates component objects immediately, so JSX here is not a React runtime replacement.

---

## Component API

### Button

```typescript
import { obixButton } from '@obinexusltd/obix-jsx-components';

const button = h(obixButton, {
  label: 'Save',                          // string
  variant: 'primary',                     // 'default' | 'primary' | 'secondary' | 'danger'
  size: 'md',                             // 'sm' | 'md' | 'lg'
  disabled: false,                        // boolean
  loading: false,                         // boolean
  type: 'button',                         // 'button' | 'submit' | 'reset'
  ariaLabel: 'Save changes',              // string
  icon: 'save',                           // string
  className: 'custom-class'               // string
});
```

### Input

```typescript
import { obixInput } from '@obinexusltd/obix-jsx-components';

const input = h(obixInput, {
  name: 'email',                          // string
  type: 'email',                          // 'text' | 'email' | 'password' | 'number' | ...
  label: 'Email Address',                 // string
  placeholder: 'you@example.com',         // string
  value: '',                              // string
  required: true,                         // boolean
  disabled: false,                        // boolean
  minLength: 0,                           // number
  maxLength: 255,                         // number
  error: null,                            // string | null
  hint: 'We\'ll never share.',            // string
  validation: 'blur',                     // 'blur' | 'change' | 'submit'
  ariaLabel: 'Email',                     // string
  ariaDescribedBy: 'email-help'           // string
});
```

### Form

```typescript
import { obixForm } from '@obinexusltd/obix-jsx-components';

const form = h(obixForm, {
  label: 'Contact Us',                    // string
  legend: 'Send us a message',            // string
  noValidate: false,                      // boolean
  errorSummary: true,                     // boolean
  ariaLabel: 'Contact form'               // string
});

// Add children via h()
const emailInput = h(obixInput, { label: 'Email', type: 'email' });
const messageInput = h(obixInput, { label: 'Message' });
const submitBtn = h(obixButton, { label: 'Send' });

const completeForm = h(obixForm, { label: 'Contact' }, emailInput, messageInput, submitBtn);
```

### Alert

```typescript
import { obixAlert } from '@obinexusltd/obix-jsx-components';

const alert = h(obixAlert, {
  message: 'Operation successful!',       // string
  type: 'success',                        // 'info' | 'success' | 'warning' | 'error'
  title: 'Success',                       // string
  dismissible: true,                      // boolean
  ariaLive: 'polite'                      // 'polite' | 'assertive'
});
```

### All 30 Components

Full API reference available in [COMPONENT_API.md](./COMPONENT_API.md)

---

## Paradigm Usage

### Functional (Immutable)

```typescript
import { toJSXFunctional } from '@obinexusltd/obix-jsx-integration';

const button = h(obixButton, { label: 'Count: 0' });
const functional = toJSXFunctional(button);

let count = 0;

function increment() {
  count++;
  const newState = functional.dispatch('setLabel', `Count: ${count}`);
  const html = button.render(newState);
  document.getElementById('app').innerHTML = html;
}
```

### OOP (Mutable)

```typescript
import { toJSXOOP } from '@obinexusltd/obix-jsx-integration';

const button = h(obixButton, { label: 'Count: 0' });
const oop = toJSXOOP(button);

let count = 0;

function increment() {
  count++;
  oop.instance.label = `Count: ${count}`;
  const html = button.render(oop.instance);
  document.getElementById('app').innerHTML = html;
}
```

### Reactive (Observer)

```typescript
import { toJSXReactive } from '@obinexusltd/obix-jsx-integration';

const button = h(obixButton, { label: 'Count: 0' });
const reactive = toJSXReactive(button);

let count = 0;

reactive.subscribe((newState) => {
  const html = button.render(newState);
  document.getElementById('app').innerHTML = html;
});

function increment() {
  count++;
  reactive.dispatch('setLabel', `Count: ${count}`);
}
```

---

## Testing

### Run Tests

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Test Structure

Each component has **three test layers**:

1. **Unit Test** — Factory creates correct object shape
2. **Render Test** — `.render(state)` produces valid HTML
3. **Integration Test** — Works with `h()` factory and paradigms

Example:

```typescript
describe('obixButton', () => {
  it('creates component with correct shape', () => {
    const button = obixButton({ label: 'Save' });
    expect(button).toHaveProperty('state');
    expect(button).toHaveProperty('actions');
    expect(button).toHaveProperty('render');
  });

  it('renders HTML string from state', () => {
    const button = obixButton({ label: 'Save' });
    const html = button.render(button.state);
    expect(html).toContain('Save');
  });

  it('works with h() factory', () => {
    const button = h(obixButton, { label: 'Save' });
    expect(button.render(button.state)).toContain('Save');
  });
});
```

---

## Examples

### Vanilla JS + HTML/CSS
See: `examples/vanilla-js/`

### Server-Side Rendering
See: `examples/server-side/`

### Functional Paradigm
See: `examples/functional-paradigm/`

---

## CSS Classes & Styles

All components use consistent **BEM naming convention**:

```
.obix-[component]
.obix-[component]__[element]
.obix-[component]--[modifier]
```

Examples:
- `.obix-button`
- `.obix-button--primary`
- `.obix-button--disabled`
- `.obix-input-group`
- `.obix-input__label`
- `.obix-input--error`
- `.obix-form__legend`

Styles are not included in this package. Import from `@obinexusltd/obix-component-runtime`:

```typescript
import '@obinexusltd/obix-component-runtime/styles';
```

---

## Accessibility

All components follow **WCAG 2.1 AA** standards:

✅ **ARIA Attributes** — Roles, labels, descriptions, live regions  
✅ **Keyboard Navigation** — Fully operable without mouse  
✅ **Touch Targets** — Minimum 48×48 pixels  
✅ **Contrast** — 4.5:1 minimum for text  
✅ **Focus Indicators** — Always visible  
✅ **Semantic HTML** — Proper fieldsets, legends, labels  

Example:

```typescript
const input = h(obixInput, {
  label: 'Email Address',              // Associated label
  required: true,                      // aria-required
  ariaDescribedBy: 'email-help',       // aria-describedby
  error: 'Invalid email',              // aria-invalid
  hint: 'We\'ll never share'           // Accessible hint
});
```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Node.js (SSR) | 18+ |

---

## Publishing

This package is published to NPM:

```bash
npm install @obinexusltd/obix-jsx-components
```

### Version History

- **0.1.0** (2026-06-03) — Initial release with 30 components, full test suite, examples

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new components
4. Ensure all tests pass
5. Submit a pull request

---

## Support

- **Documentation**: [docs.obinexus.org](https://docs.obinexus.org)
- **Issues**: [github.com/OBINexus/obix-jsx-components/issues](https://github.com/OBINexus/obix-jsx-components/issues)
- **Community**: [community.obinexus.org](https://community.obinexus.org)

---

## License

MIT © 2026 Nnamdi Okpalan / OBINexus Computing

---

## Related Packages

- [`@obinexusltd/obix-jsx-adapter`](https://www.npmjs.com/package/@obinexusltd/obix-jsx-adapter) — JSX hyperscript factory
- [`@obinexusltd/obix-jsx-integration`](https://www.npmjs.com/package/@obinexusltd/obix-jsx-integration) — DOP paradigm bridge
- [`@obinexusltd/obix-component-runtime`](https://www.npmjs.com/package/@obinexusltd/obix-component-runtime) — Core OBIX runtime
- [`@obinexusltd/obix-dop-adapter`](https://www.npmjs.com/package/@obinexusltd/obix-dop-adapter) — Functional/OOP/Reactive adapters

---

**Built with ❤️ for accessibility-first UI development**
