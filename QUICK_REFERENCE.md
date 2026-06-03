# OBIX JSX Adapter - Quick Reference

## Installation

```bash
npm install @obinexusltd/obix-jsx-adapter
npm install @obinexusltd/obix-jsx-components
npm install @obinexusltd/obix-dop-adapter
```

## TypeScript Setup

### tsconfig.json
```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

## Basic Usage

### Import
```typescript
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
import { obixButton, obixInput } from '@obinexusltd/obix-jsx-components';
```

### Create Component
```typescript
const button = h(obixButton, { label: 'Click' });
const input = h(obixInput, { name: 'email', type: 'email' });
```

### Render
```typescript
const html = button.render(button.state);
document.getElementById('app').innerHTML = html;
```

## Syntax Patterns

### Simple Element
```jsx
<obix-button label="Save" />
// → h(obixButton, { label: 'Save' })
```

### With Props
```jsx
<obix-input 
  name="email" 
  type="email" 
  label="Email" 
  required 
/>
// → h(obixInput, { name: 'email', type: 'email', label: 'Email', required: true })
```

### Parent-Child
```jsx
<obix-form label="Login">
  <obix-input name="email" label="Email" />
  <obix-button label="Sign In" />
</obix-form>
// → h(obixForm, { label: 'Login' },
//     h(obixInput, { name: 'email', label: 'Email' }),
//     h(obixButton, { label: 'Sign In' })
//   )
```

### Fragment (No Wrapper)
```jsx
<>
  <obix-input name="first" label="First" />
  <obix-input name="last" label="Last" />
</>
// → h(Fragment, null,
//     h(obixInput, ...),
//     h(obixInput, ...)
//   )
```

### Conditional
```jsx
{error && <obix-alert type="error" message={error} />}
// → error ? h(obixAlert, { type: 'error', message: error }) : null
```

### List
```jsx
{items.map(item => (
  <obix-card key={item.id} title={item.title} />
))}
// → items.map(item => h(obixCard, { title: item.title }))
```

## Component Categories

| Category | Components |
|----------|------------|
| **Primitives** | button, card, image, video, link |
| **Forms** | input, checkbox, radio, select, textarea, form, datepicker, fileupload |
| **Navigation** | navigation, breadcrumb, pagination, tabs, stepper |
| **Overlays** | modal, dropdown, tooltip |
| **Feedback** | alert, toast, progress, loading |
| **Controls** | slider, switch |
| **Data** | table, accordion |
| **Search** | search, autocomplete |

## Common Props

### All Components
- `className` / `class` — CSS classes
- `aria*` — ARIA attributes (ariaLabel, ariaDescribedBy, etc.)

### Form Inputs
- `name` — Field identifier
- `type` — Input type (text, email, password, etc.)
- `label` — Field label
- `required` — Mark as required
- `disabled` — Disable field
- `value` — Current value
- `error` — Error message
- `placeholder` — Placeholder text
- `validation` — When to validate ('blur' or 'change')

### Buttons
- `label` — Button text
- `variant` — Style (primary, secondary, danger, etc.)
- `size` — Size (sm, md, lg)
- `disabled` — Disable button
- `loading` — Show loading state
- `type` — Button type (button, submit, reset)
- `icon` — Icon name

### Forms
- `label` / `legend` — Form title
- `noValidate` — Skip validation
- `errorSummary` — Show error summary

## Paradigm Usage

### Functional (Closure-based)
```typescript
import { toFunctional } from '@obinexusltd/obix-dop-adapter';

const button = h(obixButton, { label: 'Count: 0' });
const functional = toFunctional(button);

let count = 0;
function increment() {
  count++;
  const newState = functional.dispatch('setLabel', `Count: ${count}`);
  const html = button.render(newState);
  document.getElementById('app').innerHTML = html;
}
```

### OOP (Instance-based)
```typescript
import { toOOP } from '@obinexusltd/obix-dop-adapter';

const button = h(obixButton, { label: 'Count: 0' });
const oop = toOOP(button);

let count = 0;
function increment() {
  count++;
  oop.instance.state.label = `Count: ${count}`;
  const html = button.render(oop.instance.state);
  document.getElementById('app').innerHTML = html;
}
```

### Reactive (Observer pattern)
```typescript
import { toReactive } from '@obinexusltd/obix-dop-adapter';

const button = h(obixButton, { label: 'Count: 0' });
const reactive = toReactive(button);

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

## Type Inference

### Component Props
```typescript
import { ComponentPropsOf } from '@obinexusltd/obix-jsx-adapter';

type ButtonProps = ComponentPropsOf<typeof obixButton>;
// Automatically typed from obixButton factory
```

### Component State
```typescript
import { ComponentStateOf } from '@obinexusltd/obix-jsx-adapter';

type ButtonState = ComponentStateOf<typeof obixButton>;
// Automatically typed from createButton's state
```

## Best Practices

### ✅ DO

```typescript
// Type component functions
function LoginForm(): ObixComponent {
  return h(obixForm, { label: 'Login' });
}

// Provide labels
h(obixInput, {
  label: 'Email',
  ariaLabel: 'Email address',
  required: true
})

// Compose smaller functions
function EmailField() {
  return h(obixInput, { type: 'email', label: 'Email' });
}

function LoginForm() {
  return h(obixForm, null, EmailField());
}

// Handle rendering at boundaries
const form = LoginForm();
document.getElementById('app').innerHTML = form.render(form.state);
```

### ❌ DON'T

```typescript
// Don't skip labels
h(obixInput, { type: 'email' })

// Don't mix JSX and h() calls inconsistently
h(obixForm, null,
  // OK
  h(obixInput, { label: 'Email' }),
  // Don't—confusing mix
  ('<obix-button label="Save" />')
)

// Don't render inside factory
function BadForm() {
  const form = h(obixForm, null);
  // ❌ WRONG - Don't render in factory
  document.getElementById('app').innerHTML = form.render(form.state);
  return form;
}
```

## Accessibility Checklist

- [ ] All inputs have `label` prop
- [ ] Forms have `label` or `legend`
- [ ] Buttons have descriptive `label`
- [ ] Icon buttons have `ariaLabel`
- [ ] Errors use `ariaDescribedBy` pointing to error element
- [ ] Modals have `title` for accessibility
- [ ] Links are actual `<obix-link>` not styled buttons
- [ ] Touch targets are at least 44×44 px (automatic with OBIX)

## Server-Side Rendering

```typescript
// Create components
const button = h(obixButton, { label: 'Save' });
const form = h(obixForm, null, button);

// Render to HTML string
const html = form.render(form.state);

// Embed in template
const page = `
  <!DOCTYPE html>
  <html>
    <body>
      ${html}
    </body>
  </html>
`;

// Send to client (no JavaScript bundle needed!)
response.send(page);
```

## Testing

### Unit Test (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { h } from '@obinexusltd/obix-jsx-adapter';
import { obixButton } from '@obinexusltd/obix-jsx-components';

describe('Button', () => {
  it('renders with label', () => {
    const button = h(obixButton, { label: 'Save' });
    const html = button.render(button.state);
    expect(html).toContain('Save');
  });

  it('dispatches action on click', () => {
    const button = h(obixButton, { label: 'Save' });
    const nextState = button.actions.setLoading(button.state, true);
    expect(nextState.loading).toBe(true);
  });
});
```

## Common Errors

### "h is not defined"
**Fix**: Import h and Fragment
```typescript
import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
```

### JSX not compiling
**Fix**: Check tsconfig.json has:
```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

### Missing children in render
**Fix**: Render parent with children
```typescript
const form = h(obixForm, null,
  h(obixInput, { label: 'Email' })
);

// If form has children, render them too
const html = form.render(form.state) + 
  (form.children?.map(c => c.render(c.state)).join('') || '');
```

### Type errors on props
**Fix**: Check prop names match component config
```typescript
// ❌ Wrong prop name
h(obixButton, { title: 'Save' })

// ✅ Correct
h(obixButton, { label: 'Save' })
```

## Performance Tips

1. **Reuse components**: Create once, render many
```typescript
const button = h(obixButton, { label: 'Save' });
// Render multiple times
for (let i = 0; i < 100; i++) {
  console.log(button.render(button.state));
}
```

2. **Batch state updates**: Combine actions
```typescript
let state = form.state;
state = form.actions.setField(state, 'email', 'user@example.com');
state = form.actions.setField(state, 'password', 'secret');
// Single render
const html = form.render(state);
```

3. **Lazy render**: Create components when needed
```typescript
// Don't create all components upfront
// Create only visible ones
if (showDetails) {
  const details = h(obixCard, { title: 'Details' });
  // ...render details...
}
```

## Integration Diagram

```
┌─────────────────────────────────────────┐
│  Your JSX Code (TypeScript/JavaScript)  │
│  <obix-button label="Save" />           │
└──────────────────┬──────────────────────┘
                   │ (TypeScript Compiler)
┌──────────────────▼──────────────────────┐
│  h() Function Calls                     │
│  h(obixButton, { label: "Save" })       │
└──────────────────┬──────────────────────┘
                   │ (@obinexusltd/obix-jsx-adapter)
┌──────────────────▼──────────────────────┐
│  OBIX Component Objects                 │
│  {                                       │
│    name: 'Button',                      │
│    state: {...},                        │
│    actions: {...},                      │
│    render: (state) => string            │
│  }                                       │
└──────────────────┬──────────────────────┘
                   │ (@obinexusltd/obix-dop-adapter)
├──────────────────┼──────────────────────┬──────────────┐
│                  │                      │              │
▼                  ▼                      ▼              ▼
Functional    OOP              Reactive           Data
(Closures)    (Instances)      (Observers)        (Raw)
```

## Glossary

| Term | Definition |
|------|-----------|
| **h()** | Hyperscript factory; converts JSX to OBIX components |
| **Fragment** | Grouping wrapper with no DOM representation |
| **OBIX Component** | Plain data object with state, actions, render |
| **DOP** | Data-Oriented Programming paradigm |
| **FUD** | Fear, Uncertainty, Doubt; OBIX policy system |
| **Paradigm** | Programming pattern (Functional, OOP, Reactive, Data) |
| **Action** | Pure function transforming component state |
| **Render** | Function converting state to HTML string |

## Links

- **Architecture**: OBIX_JSX_ADAPTER_ARCHITECTURE.md
- **Examples**: EXAMPLES_JSX_USAGE.md
- **Implementation**: IMPLEMENTATION_GUIDE.md
- **OBIX Docs**: https://obinexus.org/docs
- **TypeScript JSX**: https://www.typescriptlang.org/docs/handbook/jsx.html

## Support

- **Issues**: File issues in the main OBINexus repository
- **Discussions**: Use OBINexus community forums
- **Examples**: Check `/demos/obix-jsx-examples` in the monorepo
