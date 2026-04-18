# @obinexusltd/obix Component Library Documentation

**Version**: 0.1.0  
**Author**: Nnamdi Okpalan / OBINexus Computing  
**License**: MIT  
**Last Updated**: April 2026

---

## Table of Contents

1. [Philosophy & Core Principles](#philosophy--core-principles)
2. [Installation & Setup](#installation--setup)
3. [Three Usage Paradigms](#three-usage-paradigms)
4. [The 30 Components Overview](#the-30-components-overview)
5. [FUD Policy System](#fud-policy-system)
6. [jfix.scss Design System](#jfixscss-design-system)
7. [Component Lifecycle](#component-lifecycle)
8. [Data-Oriented Programming Model](#data-oriented-programming-model)

---

## Philosophy & Core Principles

OBIX stands for **OBINexus Interface Experience**. The name derives from **Obi** (*Igbo*: heart and soul), reflecting the foundational belief that **the user interface is the heart of any software system**.

### Three Pillars

#### 1. **Accessibility First**
- Every component is **WCAG 2.1 AA** compliant by default
- Minimum touch targets: **48×48 pixels** (WCAG 2.5.5)
- Full keyboard operability (no mouse-only interactions)
- Comprehensive ARIA attributes (roles, states, properties)
- Screen reader support built-in
- Focus management automatic and explicit

#### 2. **Data-Oriented Programming (DOP)**
Components are **pure data structures**, not class instances:
- **State**: plain object describing current data
- **Actions**: pure functions that transform state
- **Render**: deterministic HTML generation from state

Benefits:
- No virtual DOM overhead
- Framework-agnostic (works in React, Vue, Vanilla JS, server-side rendering)
- Testable (state transitions are deterministic)
- Serializable (state can be saved/restored)

#### 3. **FUD Mitigation**
Prevents **Fear, Uncertainty, and Doubt** through enforced policies:
- **Focus Policy**: Visible focus indicators, proper tab order
- **Undo Policy**: State revisions tracked, undo capability provided
- **Drag Policy**: Touch-friendly (no drag-only patterns)

Policies apply **automatically** at component creation—no configuration needed.

---

## Installation & Setup

### Step 1: Install the Main Package

```bash
npm install @obinexusltd/obix-component-runtime
```

Or install individual component categories:

```bash
npm install @obinexusltd/obix-component-runtime/primitives
npm install @obinexusltd/obix-component-runtime/forms
npm install @obinexusltd/obix-component-runtime/navigation
npm install @obinexusltd/obix-component-runtime/overlays
npm install @obinexusltd/obix-component-runtime/feedback
npm install @obinexusltd/obix-component-runtime/controls
npm install @obinexusltd/obix-component-runtime/data
npm install @obinexusltd/obix-component-runtime/search
```

### Step 2: Import Styles

```typescript
// Global styles (once per app)
import '@obinexusltd/obix-component-runtime/styles';
```

Optional: Use SCSS source for customization:

```typescript
import '@obinexusltd/obix-component-runtime/styles/scss';
```

### Step 3: Verify Installation

```bash
npm list @obinexusltd/obix-component-runtime
```

Expected output: `@obinexusltd/obix-component-runtime@0.1.0`

---

## Three Usage Paradigms

OBIX components work across **three different coding styles**. Choose the one that fits your project.

### Paradigm 1: Data-Oriented (Pure Functions)

**Best for**: Server-side rendering, HTMX, vanilla JavaScript, testing

```typescript
import { createButton, createInput, createCard } from '@obinexusltd/obix-component-runtime';

// Create a button component
const saveBtn = createButton({
  label: 'Save',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
});

// Access the state
console.log(saveBtn.state); // { label: 'Save', variant: 'primary', ... }

// Dispatch an action to create new state
const loadingState = saveBtn.actions.setLoading(saveBtn.state, true);

// Render to HTML string
const html = saveBtn.render(loadingState);
// → <button type="button" class="obix-button obix-button--primary obix-button--md" 
//     aria-busy="true" aria-disabled="true">
//     <span aria-hidden="true" class="obix-button__spinner"></span>Save
//   </button>

// Attach to DOM
document.getElementById('actions').innerHTML = html;

// Handle interactions via data attributes and event listeners
document.querySelector('.obix-button')?.addEventListener('click', () => {
  const nextState = saveBtn.actions.click(loadingState);
  console.log('Button clicked, new state:', nextState);
});
```

**Key Points:**
- Components are **factory functions** returning state + actions + render
- State is **immutable** (actions return new state, don't modify)
- **Render** is a pure function: `(state) => HTML string`
- Perfect for server-side rendering, static HTML generation

---

### Paradigm 2: JSX (React-like)

**Best for**: Single-page applications, React developers, component composition

Configure `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "target": "ES2020",
    "module": "ESNext"
  }
}
```

Usage:

```typescript
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */
import { h, Fragment } from '@obinexusltd/obix-component-runtime/jsx-runtime';
import { createButton, createInput, createForm } from '@obinexusltd/obix-component-runtime';

// JSX compiles to h() function calls
function LoginForm() {
  const emailInput = <createInput 
    type="email" 
    placeholder="Enter email" 
    ariaLabel="Email address"
  />;
  
  const passwordInput = <createInput 
    type="password" 
    placeholder="Enter password"
    ariaLabel="Password"
  />;
  
  const submitBtn = <createButton 
    label="Sign In" 
    variant="primary"
  />;

  return (
    <Fragment>
      <h1>Login</h1>
      <form>
        {emailInput.render(emailInput.state)}
        {passwordInput.render(passwordInput.state)}
        {submitBtn.render(submitBtn.state)}
      </form>
    </Fragment>
  );
}

// Render to HTML
const app = document.getElementById('app');
app.innerHTML = LoginForm();
```

**Key Points:**
- JSX compiles to `h()` function calls
- Each component instance is independent
- Props map to component config options
- `.render(state)` produces HTML

---

### Paradigm 3: Template Insertion (Server/HTMX)

**Best for**: Server-side frameworks (Express, Django, PHP), HTMX, HTML templates

```typescript
// Express.js example
import { createAlert, createModal, createTable } from '@obinexusltd/obix-component-runtime';

app.get('/dashboard', (req, res) => {
  // Create components
  const successAlert = createAlert({
    message: 'Welcome back, ' + req.user.name,
    type: 'success'
  });

  const userTable = createTable({
    caption: 'Active Users',
    headers: ['Name', 'Email', 'Status'],
    rows: [
      { name: 'Alice', email: 'alice@example.com', status: 'Online' },
      { name: 'Bob', email: 'bob@example.com', status: 'Away' }
    ]
  });

  // Render to HTML strings and embed in template
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dashboard</title>
        <link rel="stylesheet" href="/obix-styles.css">
      </head>
      <body>
        <div id="alerts">
          ${successAlert.render(successAlert.state)}
        </div>
        
        <main>
          ${userTable.render(userTable.state)}
        </main>
      </body>
    </html>
  `;

  res.send(html);
});

// HTMX partial response
app.post('/modal/confirm', (req, res) => {
  const modal = createModal({
    title: 'Confirm Action',
    content: 'Are you sure you want to delete?',
    closeOnEscape: true
  });

  res.send(modal.render(modal.state));
});
```

**Key Points:**
- Components render to **HTML strings** (not React components)
- Perfect for **server-side rendering** (no JavaScript needed on client)
- Works with **HTMX**, **Alpine.js**, vanilla event listeners
- Minimal bandwidth (HTML only, no bundle)

---

## The 30 Components Overview

OBIX provides **30 WCAG 2.1 AA accessible components** organized into 8 categories.

### Category 1: Primitives (5 components)

Core building blocks—images, media, simple content containers.

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ObixButton** | Clickable action trigger | Loading states, toggle mode, all sizes (sm/md/lg) |
| **ObixCard** | Content container | Explicit dimensions (CLS prevention), loading skeleton |
| **ObixImage** | Responsive images | Alt text enforced, lazy loading, aspect-ratio |
| **ObixVideo** | Media playback | Caption tracks, transcript link, keyboard controls |
| **ObixLink** | Navigation anchor | Proper ARIA, visited states, external link indicators |

**When to use:**
- Buttons for forms and CTAs
- Cards for product grids, blog posts, portfolios
- Images/Video for media-rich content

---

### Category 2: Forms (8 components)

User input capture with validation and accessibility.

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ObixInput** | Text/email/password/URL input | Validation timing (blur/change), autocomplete attributes, error states |
| **ObixCheckbox** | Single boolean toggle | Three states (checked/unchecked/indeterminate), group aria-label |
| **ObixRadioGroup** | Single choice from many | Fieldset wrapper, arrow key navigation, aria-checked |
| **ObixSelect** | Dropdown list selection | Native select + custom styling, optgroup support, aria-expanded |
| **ObixTextarea** | Multi-line text input | Character counter (aria-live), auto-expand, resize constraints |
| **ObixForm** | Form container + orchestration | Fieldset/legend grouping, error summary, field validation |
| **ObixDatePicker** | Date selection | Native input type="date" fallback, calendar grid, today highlight |
| **ObixFileUpload** | File selection/upload | Drag-drop (aria-label), file list with delete, progress per file |

**When to use:**
- Inputs for email, passwords, URLs, text
- Checkboxes for multi-select options
- Radio groups for single-choice questions
- Select for long option lists (10+)
- Forms to orchestrate validation across multiple fields

---

### Category 3: Navigation (5 components)

Help users understand their location and move through the app.

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ObixNavigation** | Top-level site/app navigation | Skip links, aria-current for active page, hamburger (aria-controls) |
| **ObixBreadcrumb** | Hierarchical location trail | nav landmark, aria-label="Breadcrumb", aria-current for last |
| **ObixPagination** | Multi-page dataset navigation | aria-label navigation, aria-current page, prev/next disabled states |
| **ObixTabs** | Grouped content panels | tablist role, aria-selected, arrow navigation, panel aria-labelledby |
| **ObixStepper** | Multi-step form/wizard | aria-current step, progress indication, clickable completed steps |

**When to use:**
- Navigation for site header/footer
- Breadcrumbs for hierarchical content (category > subcategory > page)
- Pagination for large datasets (100+ items)
- Tabs for grouped content (details, reviews, related)
- Steppers for multi-step processes (checkout, onboarding)

---

### Category 4: Overlays (3 components)

Content displayed on top of other content.

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ObixModal** | Dialog with focus trap | aria-modal, role="dialog", escape key handling, backdrop click config |
| **ObixDropdown** | Context menu or picker | Transform-based hover (no CLS), keyboard navigation, aria-expanded |
| **ObixTooltip** | Hover information | aria-describedby trigger, hover/focus activation, escape to close |

**When to use:**
- Modals for critical confirmations (delete, sign out)
- Dropdowns for secondary actions (more options, user menu)
- Tooltips for help text (never primary information)

---

### Category 5: Feedback (4 components)

Communicate system status and results to the user.

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ObixAlert** | Important message | role="alert"/"status", aria-live polite/assertive, dismissible with focus return |
| **ObixToast** | Temporary notification | aria-live region, pause on hover, timeout control, stacked management |
| **ObixProgress** | Task progress indication | role="progressbar", aria-valuenow/min/max, determinate/indeterminate |
| **ObixLoading** | Loading indicator | aria-busy region, skeleton screen with aria-hidden, reduced motion support |

**When to use:**
- Alerts for validation errors, warnings, success messages
- Toasts for transient notifications (file uploaded, copied to clipboard)
- Progress bars for long operations (file upload, form save)
- Loading skeletons while data fetches

---

### Category 6: Controls (2 components)

Interactive controls for adjusting values.

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ObixSlider** | Range input | aria-valuenow, arrow key increments, label association, value announcements |
| **ObixSwitch** | Boolean toggle | role="switch", aria-checked, distinct from checkbox visually/semantically |

**When to use:**
- Sliders for ranges (volume, brightness, price filter)
- Switches for on/off toggles (theme mode, notifications)

---

### Category 7: Data (2 components)

Display and organize structured data.

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ObixTable** | Tabular data display | caption element, th scope/colgroup, aria-sort for sortable, responsive wrapper |
| **ObixAccordion** | Collapsible sections | aria-expanded per panel, heading hierarchy preserved, optional multi-expand |

**When to use:**
- Tables for structured data (users, products, transactions)
- Accordions for FAQs, detailed specs, expandable sections

---

### Category 8: Search (2 components)

Help users find information.

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **ObixSearch** | Search input field | role="search", aria-label, clear button, results announcement (aria-live) |
| **ObixAutocomplete** | Search with suggestions | aria-expanded, aria-activedescendant, listbox role, selection announcement |

**When to use:**
- Search input for simple query entry
- Autocomplete for fast discovery (users, tags, locations)

---

## FUD Policy System

**FUD** = Fear, Uncertainty, Doubt. The policy system **prevents inaccessible patterns from reaching users**.

Every component runs **`applyAllFudPolicies()`** automatically at creation. No configuration needed.

### The Five Core Policies

#### 1. **Accessibility Policy** (`applyAccessibilityPolicy`)

**What it enforces:**
- ✅ ARIA `role` attribute present and correct
- ✅ `aria-label` on icon-only buttons
- ✅ `aria-expanded` on collapsible elements
- ✅ `aria-disabled` on disabled elements
- ✅ Screen reader text for hidden decorative content

**Example violation caught:**
```typescript
// BEFORE POLICY: Button without aria-label
{ label: '', icon: 'save' } // ❌ Icon-only, no label

// AFTER POLICY: Auto-fixed
{ label: '', icon: 'save', ariaLabel: 'Save document' } // ✅ Added
```

#### 2. **Touch Target Policy** (`applyTouchTargetPolicy`)

**What it enforces:**
- ✅ Minimum **48×48 pixels** for all interactive elements (WCAG 2.5.5)
- ✅ Proper spacing between touch targets

**Example violation caught:**
```typescript
// BEFORE POLICY: Tiny button
{ size: 'xs', width: '24px', height: '24px' } // ❌ Too small

// AFTER POLICY: Auto-enforced
{ size: 'sm', minWidth: '48px', minHeight: '48px' } // ✅ WCAG compliant
```

#### 3. **Focus Policy** (`applyFocusPolicy`)

**What it enforces:**
- ✅ Visible focus indicator (never `outline: none`)
- ✅ Logical tab order (`tabindex` managed)
- ✅ Focus traps in modals
- ✅ Return-focus on modal close

**Example violation caught:**
```typescript
// BEFORE POLICY: No focus visible
{ outline: 'none' } // ❌ Keyboard user can't see focus

// AFTER POLICY: Auto-restored
{ outline: '2px solid #0066cc', outlineOffset: '2px' } // ✅ Visible
```

#### 4. **Reduced Motion Policy** (`applyReducedMotionPolicy`)

**What it enforces:**
- ✅ Respects `prefers-reduced-motion: reduce` media query
- ✅ Instant transitions for users with motion sensitivity

**Example violation caught:**
```typescript
// BEFORE POLICY: Always animates
{ transition: 'all 0.3s ease-in-out' } // ❌ Ignores user preference

// AFTER POLICY: Conditional
{
  transition: '@media (prefers-reduced-motion: no-preference) ? 
    "all 0.3s ease-in-out" : "none"'
} // ✅ Respects preference
```

#### 5. **Loading Policy** (`applyLoadingPolicy`)

**What it enforces:**
- ✅ `aria-busy` set correctly during loading
- ✅ Explicit dimensions on skeleton loaders (prevents CLS—Cumulative Layout Shift)
- ✅ Skeleton content dimensions preserved

**Example violation caught:**
```typescript
// BEFORE POLICY: Skeleton without dimensions
{ loading: true, height: 'auto' } // ❌ Layout shifts when content loads

// AFTER POLICY: Explicit dimensions
{ loading: true, height: '24px', width: '200px' } // ✅ No CLS
```

### Manual Policy Validation

Check policy compliance manually:

```typescript
import { validateFudCompliance, applyAllFudPolicies } from '@obinexusltd/obix-component-runtime';

const myButton = createButton({ label: 'Delete', size: 'xs' });

// Validate compliance
const result = validateFudCompliance(myButton);

if (!result.valid) {
  console.warn('FUD violations detected:');
  result.violations.forEach(v => {
    console.log(`  - ${v.policy}: ${v.message}`);
  });
  // Output:
  // - touchTargetPolicy: Button is 32x32px, minimum is 48x48px
}

// Manually apply policies
const fixed = applyAllFudPolicies(myButton);
console.log('Component now compliant:', validateFudCompliance(fixed).valid); // true
```

---

## jfix.scss Design System

**jfix** is the OBIX design system providing:
- Semantic color tokens (primary, success, danger, warning)
- Typography scale (xs, sm, md, lg, xl)
- Spacing scale (4px, 8px, 12px, 16px, 24px, ...)
- Consistent hover/focus states
- CLS-safe animation strategies

### Design Tokens

```scss
// Colors
$primary: #0066cc;
$success: #28a745;
$danger: #dc3545;
$warning: #ffc107;
$info: #17a2b8;

// Neutral scale (a11y-tested contrast)
$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-500: #6b7280;
$gray-900: #111827;

// Typography
$font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
$font-size-sm: 0.875rem;   // 14px
$font-size-base: 1rem;     // 16px
$font-size-lg: 1.125rem;   // 18px
$line-height-base: 1.5;    // For readability

// Spacing
$space-1: 0.25rem;  // 4px
$space-2: 0.5rem;   // 8px
$space-3: 0.75rem;  // 12px
$space-4: 1rem;     // 16px
$space-6: 1.5rem;   // 24px

// Touch targets
$touch-target-min: 48px; // WCAG 2.5.5
$touch-target-padding: 8px;
```

### Hover Strategies

Three CSS strategies for hover effects (no layout shift):

#### Strategy 1: Transform Scale (Smooth)

```scss
.obix-button:hover {
  transform: scale(1.02); // Scales from center, no layout shift
  transition: transform 0.2s ease-out;
}
```

#### Strategy 2: Box Shadow (Elevation)

```scss
.obix-button {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.obix-button:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); // Deeper shadow = elevated
  transition: box-shadow 0.2s ease-out;
}
```

#### Strategy 3: Color Shift (Accessible)

```scss
.obix-button {
  background: #0066cc;
  color: white;
}

.obix-button:hover {
  background: #0052a3; // 10% darker
  color: white;
  transition: background-color 0.2s ease-out;
}
```

### Applying jfix in Components

```typescript
import '@obinexusltd/obix-component-runtime/styles'; // Includes jfix

const btn = createButton({
  label: 'Click me',
  variant: 'primary',
  // variant maps to jfix $primary token automatically
  // hover/focus states applied via jfix mixins
});

// Render uses jfix classes
console.log(btn.render(btn.state));
// → <button class="obix-button obix-button--primary" ...>Click me</button>
```

The CSS classes (`obix-button--primary`) automatically map to jfix tokens and strategies.

---

## Component Lifecycle

Every OBIX component follows a **four-state lifecycle**:

```
CREATED → UPDATED → HALTED → DESTROYED
```

### State 1: CREATED

Triggered when component is instantiated.

```typescript
const btn = createButton({ label: 'Click' });
// Component is now in CREATED state
// All FUD policies have been applied
// Revision counter = 0
```

### State 2: UPDATED

Triggered when an action is dispatched.

```typescript
const nextState = btn.actions.setLoading(btn.state, true);
// Component transitioned to UPDATED state
// Revision counter incremented
// Old state is preserved (for undo capability)
```

### State 3: HALTED

Triggered when component stabilizes (optional, for optimization).

```typescript
// Manual halt
btn.halt();

// Component is now HALTED
// No further updates until resumed
// State is locked (read-only)
```

### State 4: DESTROYED

Triggered when component is removed from DOM.

```typescript
btn.destroy();

// Component is now DESTROYED
// All event listeners removed
// Memory freed
```

### Optional: ObixRuntime for Lifecycle Management

For managed lifecycle tracking, use `@obinexusltd/obix-sdk-core`:

```bash
npm install @obinexusltd/obix-sdk-core
```

```typescript
import { ObixRuntime } from '@obinexusltd/obix-sdk-core';
import { createButton } from '@obinexusltd/obix-component-runtime';

const runtime = new ObixRuntime({
  maxRevisions: 50,           // Keep last 50 state revisions
  stabilityThreshold: 3       // Halt after 3 no-op updates
});

// Register component definition
runtime.register({
  name: 'SaveButton',
  state: { label: 'Save', loading: false, disabled: false },
  actions: { setLoading: ... },
  render: createButton({ label: 'Save' }).render
});

// Create instance
const instance = runtime.create('SaveButton');

// Update state
runtime.update(instance.id, 'setLoading', true);

// Check lifecycle
console.log(instance.lifecycle); // UPDATED

// Halt when done
runtime.halt(instance.id);

// Destroy
runtime.destroy(instance.id);
```

---

## Data-Oriented Programming Model

### Core Concept: State + Actions + Render

Every component is a **pure data object**:

```typescript
interface ObixComponent<S, A> {
  // Current state
  state: S;
  
  // Action creators (pure functions)
  actions: {
    [actionName: string]: (state: S, ...args: any[]) => S
  };
  
  // Render function (deterministic)
  render: (state: S) => string; // HTML
  
  // Lifecycle
  lifecycle: 'CREATED' | 'UPDATED' | 'HALTED' | 'DESTROYED';
  revisions: S[]; // State history
  
  // Helpers
  halt: () => void;
  resume: () => void;
  destroy: () => void;
  undo: () => void;
}
```

### Example: Building State Transitions

```typescript
import { createButton } from '@obinexusltd/obix-component-runtime';

// Create button
const btn = createButton({
  label: 'Save',
  variant: 'primary',
  disabled: false,
  loading: false
});

console.log('Initial state:', btn.state);
// {
//   label: 'Save',
//   variant: 'primary',
//   disabled: false,
//   loading: false,
//   touched: false,
//   ariaLabel: 'Save',
//   ariaPressed: false
// }

// Dispatch setLoading action
const loadingState = btn.actions.setLoading(btn.state, true);
console.log('After setLoading(true):', loadingState);
// { ...same, loading: true, disabled: true, aria-busy: true }

// Original state unchanged (immutable)
console.log('Original state:', btn.state);
// { ...same, loading: false, disabled: false }

// Render both states
console.log(btn.render(btn.state));
// <button ...>Save</button>

console.log(btn.render(loadingState));
// <button ... aria-busy="true" aria-disabled="true">
//   <span aria-hidden="true" class="obix-button__spinner"></span>Save
// </button>
```

### Why DOP?

1. **Testable**: State transitions are deterministic
   ```typescript
   test('setLoading disables button', () => {
     const state1 = btn.state;
     const state2 = btn.actions.setLoading(state1, true);
     expect(state2.disabled).toBe(true);
     expect(state1.disabled).toBe(false); // Original unchanged
   });
   ```

2. **Time-travel**: Full state history for undo/redo
   ```typescript
   console.log(btn.revisions); // [initialState, state1, state2, ...]
   btn.undo(); // Reverts to previous revision
   ```

3. **Serializable**: Save/restore state from storage
   ```typescript
   const savedState = JSON.stringify(btn.state);
   localStorage.setItem('button', savedState);
   
   const restored = JSON.parse(localStorage.getItem('button'));
   const html = btn.render(restored);
   ```

4. **Framework-agnostic**: Works everywhere
   - Vanilla JS
   - React
   - Vue
   - Svelte
   - Server-side rendering
   - HTMX

---

## Next Steps

- [Part 2: Component API Reference](./OBIX_COMPONENT_DOCUMENTATION_PART2.md) — Detailed specifications for all 30 components
- [Part 3: Integration Patterns](./OBIX_COMPONENT_DOCUMENTATION_PART3.md) — Real-world usage examples
- [Part 4: Accessibility Guide](./OBIX_COMPONENT_DOCUMENTATION_PART4.md) — WCAG compliance details

