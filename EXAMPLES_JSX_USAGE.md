# OBIX JSX Usage Examples

## Setup

### TypeScript Configuration

Configure `tsconfig.json` to use the custom JSX factory:

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

### Package Installation

```bash
npm install @obinexusltd/obix-component-runtime
npm install @obinexusltd/obix-jsx-adapter
npm install @obinexusltd/obix-jsx-components
npm install @obinexusltd/obix-dop-adapter
```

---

## Example 1: Simple Button (JavaScript)

### JavaScript File: `button-example.js`

```javascript
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
import { obixButton } from '@obinexusltd/obix-jsx-components';

// Create a button using JSX
function SimpleButton() {
  return h(obixButton, {
    label: "Click me",
    variant: "primary",
    size: "md"
  });
}

// Get the component
const button = SimpleButton();

// Render it
const html = button.render(button.state);
console.log(html);
// Output: <button class="obix-button obix-button--primary obix-button--md">Click me</button>

// Attach to DOM
const app = document.getElementById('app');
app.innerHTML = html;

// Handle clicks
app.addEventListener('click', (e) => {
  if (e.target.closest('.obix-button')) {
    console.log('Button clicked!');
  }
});
```

---

## Example 2: Form with Inputs (TypeScript)

### TypeScript File: `login-form.tsx`

```typescript
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
import {
  obixForm,
  obixInput,
  obixButton,
  obixAlert
} from '@obinexusltd/obix-jsx-components';
import { ObixComponent } from '@obinexusltd/obix-jsx-adapter';

interface FormState {
  email: string;
  password: string;
  error: string | null;
}

/**
 * LoginForm component - demonstrates:
 * 1. Form composition
 * 2. Input fields with validation
 * 3. Error handling
 * 4. Conditional rendering
 */
function LoginForm(props: { initialEmail?: string }): ObixComponent {
  // JSX syntax - gets compiled to h() function calls
  return h(Fragment, null,
    // Conditional error alert
    h(obixAlert, {
      type: 'error',
      message: 'Invalid credentials. Please try again.',
      dismissible: true
    }),

    // Main login form
    h(obixForm, { label: 'Login' },
      h(obixInput, {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'you@example.com',
        value: props?.initialEmail || '',
        required: true,
        ariaDescribedBy: 'email-help'
      }),

      h(obixInput, {
        name: 'password',
        type: 'password',
        label: 'Password',
        placeholder: 'Enter password',
        required: true,
        minLength: 8
      }),

      h(obixButton, {
        label: 'Sign In',
        variant: 'primary',
        size: 'lg',
        type: 'submit'
      })
    )
  );
}

// Use the form
const form = LoginForm({ initialEmail: 'user@example.com' });

// Since h(Fragment, ...) returns an array of components,
// we need to handle multiple components
if (Array.isArray(form)) {
  const alert = form[0];
  const formComponent = form[1];
  
  console.log('Alert HTML:', alert.render(alert.state));
  console.log('Form HTML:', formComponent.render(formComponent.state));
} else {
  console.log('Form HTML:', form.render(form.state));
}
```

### Compiled JavaScript (what TypeScript produces)

The JSX code above compiles to:

```javascript
function LoginForm(props) {
  return h(Fragment, null,
    h(obixAlert, {
      type: 'error',
      message: 'Invalid credentials. Please try again.',
      dismissible: true
    }),
    h(obixForm, { label: 'Login' },
      h(obixInput, {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'you@example.com',
        value: props?.initialEmail || '',
        required: true,
        ariaDescribedBy: 'email-help'
      }),
      h(obixInput, {
        name: 'password',
        type: 'password',
        label: 'Password',
        placeholder: 'Enter password',
        required: true,
        minLength: 8
      }),
      h(obixButton, {
        label: 'Sign In',
        variant: 'primary',
        size: 'lg',
        type: 'submit'
      })
    )
  );
}
```

---

## Example 3: Dynamic List (TypeScript)

### TypeScript File: `todo-list.tsx`

```typescript
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
import { obixCard, obixCheckbox, obixButton } from '@obinexusltd/obix-jsx-components';
import { ObixComponent } from '@obinexusltd/obix-jsx-adapter';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * TodoList component - demonstrates:
 * 1. Array mapping with JSX
 * 2. Dynamic children
 * 3. Keys for list items
 */
function TodoList(props: { todos: Todo[] }): ObixComponent[] {
  // Map todos to card components
  return (props.todos || []).map((todo) =>
    h(obixCard, {
      title: todo.title,
      key: todo.id  // Key helps with diffing (not used in rendering, but good practice)
    },
      h(obixCheckbox, {
        checked: todo.completed,
        label: 'Mark as done'
      }),
      h(obixButton, {
        label: 'Delete',
        variant: 'danger',
        size: 'sm'
      })
    )
  );
}

// Usage
const todos: Todo[] = [
  { id: '1', title: 'Learn JSX with OBIX', completed: false },
  { id: '2', title: 'Build a form', completed: false },
  { id: '3', title: 'Deploy to production', completed: true }
];

const todoCards = TodoList({ todos });

// Render all cards
const html = todoCards
  .map((card) => card.render(card.state))
  .join('\n');

document.getElementById('app').innerHTML = html;
```

---

## Example 4: Stateful Component with DOP Adapter (TypeScript)

### TypeScript File: `counter-button.tsx`

```typescript
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h } from '@obinexusltd/obix-jsx-adapter';
import { obixButton } from '@obinexusltd/obix-jsx-components';
import { toFunctional, toOOP } from '@obinexusltd/obix-dop-adapter';

/**
 * CounterButton - demonstrates:
 * 1. Creating a button via JSX
 * 2. Adapting to functional paradigm
 * 3. State management through actions
 */

// Create button via JSX
const counterButton = h(obixButton, {
  label: 'Count: 0',
  variant: 'default'
});

// ============================================================================
// APPROACH 1: Functional Paradigm (with closures)
// ============================================================================

const functional = toFunctional(counterButton);

// State is held in closure
let count = 0;

function incrementCounter() {
  count++;
  
  // Dispatch action to update button label
  const newState = functional.dispatch('setLabel', `Count: ${count}`);
  
  // Re-render
  const html = counterButton.render(newState);
  document.getElementById('app').innerHTML = html;
}

// ============================================================================
// APPROACH 2: OOP Paradigm (with instance methods)
// ============================================================================

const oop = toOOP(counterButton);

let count2 = 0;

function incrementCounter2() {
  count2++;
  
  // Mutate instance state directly
  oop.instance.state.label = `Count: ${count2}`;
  
  // Or call bound methods
  // oop.instance.setLabel(`Count: ${count2}`);
  
  // Re-render
  const html = counterButton.render(oop.instance.state);
  document.getElementById('app').innerHTML = html;
}

// ============================================================================
// APPROACH 3: Reactive Paradigm (with subscriptions)
// ============================================================================

const reactive = toReactive(counterButton);

let count3 = 0;

// Subscribe to state changes
const unsubscribe = reactive.subscribe((newState) => {
  console.log('Button state changed:', newState);
  const html = counterButton.render(newState);
  document.getElementById('app').innerHTML = html;
});

function incrementCounter3() {
  count3++;
  
  // Update state (triggers subscription)
  reactive.dispatch('setLabel', `Count: ${count3}`);
}

// Later: unsubscribe()
```

---

## Example 5: Complex Form (TypeScript)

### TypeScript File: `signup-form.tsx`

```typescript
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h } from '@obinexusltd/obix-jsx-adapter';
import {
  obixForm,
  obixInput,
  obixCheckbox,
  obixSelect,
  obixButton,
  obixAlert
} from '@obinexusltd/obix-jsx-components';

/**
 * SignupForm - demonstrates:
 * 1. Multi-field form
 * 2. Different input types
 * 3. Form validation state
 * 4. Nested structure
 */
function SignupForm() {
  return h(obixForm, { label: 'Create Account' },
    // Text inputs
    h(obixInput, {
      name: 'firstName',
      label: 'First Name',
      required: true,
      validation: 'blur'
    }),

    h(obixInput, {
      name: 'lastName',
      label: 'Last Name',
      required: true,
      validation: 'blur'
    }),

    // Email with pattern validation
    h(obixInput, {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$',
      validation: 'blur'
    }),

    // Password with constraints
    h(obixInput, {
      name: 'password',
      type: 'password',
      label: 'Password',
      required: true,
      minLength: 12,
      hint: 'Must be at least 12 characters',
      validation: 'blur'
    }),

    // Country selection
    h(obixSelect, {
      name: 'country',
      label: 'Country',
      required: true,
      options: [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
        { value: 'au', label: 'Australia' }
      ]
    }),

    // Terms checkbox
    h(obixCheckbox, {
      name: 'terms',
      label: 'I agree to the Terms of Service and Privacy Policy',
      required: true
    }),

    h(obixCheckbox, {
      name: 'newsletter',
      label: 'Subscribe to our newsletter',
      value: true  // Pre-checked
    }),

    // Submit button
    h(obixButton, {
      label: 'Create Account',
      variant: 'primary',
      size: 'lg',
      type: 'submit'
    })
  );
}

// Render the form
const form = SignupForm();
const html = form.render(form.state);

// Render with children
let fullHtml = html;
if (form.children) {
  fullHtml = html + form.children
    .map((child) => child.render(child.state))
    .join('\n');
}

document.getElementById('app').innerHTML = fullHtml;
```

---

## Example 6: Server-Side Rendering (Node.js)

### TypeScript File: `ssr-example.ts`

```typescript
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h } from '@obinexusltd/obix-jsx-adapter';
import {
  obixCard,
  obixButton,
  obixInput
} from '@obinexusltd/obix-jsx-components';

/**
 * Server-side rendering example - demonstrates:
 * 1. Creating OBIX components via JSX
 * 2. Converting to HTML strings
 * 3. Embedding in server template
 */

// Server handler (Express.js example)
function renderProductPage(productId: string) {
  // Create product card via JSX
  const productCard = h(obixCard, {
    title: `Product #${productId}`,
    subtitle: 'High-quality item',
    variant: 'elevated'
  });

  // Create action buttons
  const addToCartBtn = h(obixButton, {
    label: 'Add to Cart',
    variant: 'primary',
    size: 'lg'
  });

  const wishlistBtn = h(obixButton, {
    label: 'Save for Later',
    variant: 'secondary'
  });

  // Render all components to HTML strings
  const productHtml = productCard.render(productCard.state);
  const addToCartHtml = addToCartBtn.render(addToCartBtn.state);
  const wishlistHtml = wishlistBtn.render(wishlistBtn.state);

  // Build complete HTML page
  const pageHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Product ${productId}</title>
      <link rel="stylesheet" href="/obix-styles.css">
    </head>
    <body>
      <main class="container">
        ${productHtml}
        <div class="actions">
          ${addToCartHtml}
          ${wishlistHtml}
        </div>
      </main>
    </body>
    </html>
  `;

  return pageHtml;
}

// Usage in server route
// app.get('/product/:id', (req, res) => {
//   const html = renderProductPage(req.params.id);
//   res.send(html);
// });
```

---

## Example 7: Custom Component Composition (TypeScript)

### TypeScript File: `custom-components.tsx`

```typescript
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from '@obinexusltd/obix-jsx-adapter';
import { obixCard, obixButton, obixInput } from '@obinexusltd/obix-jsx-components';
import { ObixComponent } from '@obinexusltd/obix-jsx-adapter';

/**
 * Custom component composition - demonstrates:
 * 1. Creating reusable component functions
 * 2. Wrapping OBIX components
 * 3. Building component hierarchies
 */

// Custom: Form section with title
function FormSection(props: {
  title: string;
  children?: ObixComponent[];
}): ObixComponent {
  return h(obixCard, {
    title: props.title,
    variant: 'flat'
  });
}

// Custom: Input group with label
function InputGroup(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}): ObixComponent {
  return h(obixInput, {
    name: props.name,
    label: props.label,
    type: props.type || 'text',
    required: props.required || false
  });
}

// Custom: Button group
function ButtonGroup(props: {
  actions: Array<{ label: string; variant: string }>;
}): ObixComponent[] {
  return (props.actions || []).map((action) =>
    h(obixButton, {
      label: action.label,
      variant: action.variant
    })
  );
}

// Use custom components
function SettingsPage() {
  return h(Fragment, null,
    FormSection({ title: 'Account Settings' }),
    InputGroup({
      label: 'Display Name',
      name: 'displayName',
      required: true
    }),
    InputGroup({
      label: 'Email',
      name: 'email',
      type: 'email',
      required: true
    }),
    ...ButtonGroup({
      actions: [
        { label: 'Save', variant: 'primary' },
        { label: 'Cancel', variant: 'secondary' }
      ]
    })
  );
}
```

---

## Best Practices

### 1. Type Safety

Always annotate component functions with return types:

```typescript
function MyForm(): ObixComponent {
  return h(obixForm, { label: 'My Form' });
}

function MyList(): ObixComponent[] {
  return items.map((item) => h(obixCard, { title: item.title }));
}
```

### 2. Component Composition

Break complex UIs into smaller functions:

```typescript
// ✅ Good
function EmailInput() {
  return h(obixInput, { type: 'email', label: 'Email' });
}

function LoginForm() {
  return h(obixForm, { label: 'Login' },
    EmailInput(),  // Reuse
    PasswordInput()
  );
}

// ❌ Avoid
function LoginForm() {
  return h(obixForm, { label: 'Login' },
    h(obixInput, { type: 'email', label: 'Email' }),
    h(obixInput, { type: 'password', label: 'Password' }),
    h(obixInput, { type: 'email', label: 'Email' }),
    h(obixInput, { type: 'password', label: 'Password' })
  );
}
```

### 3. Render at the Boundary

Keep JSX code creating components; handle rendering at boundaries:

```typescript
// Component creation (JSX)
function LoginForm(): ObixComponent {
  return h(obixForm, { label: 'Login' }, /* ... */);
}

// Rendering (at entry point)
const form = LoginForm();
document.getElementById('app').innerHTML = form.render(form.state);
```

### 4. Accessibility

Always provide labels and ARIA attributes:

```typescript
// ✅ Good
h(obixInput, {
  name: 'email',
  label: 'Email Address',
  type: 'email',
  required: true,
  ariaDescribedBy: 'email-help'
})

// ❌ Avoid
h(obixInput, {
  type: 'email'
})
```

---

## Differences from React JSX

| Aspect | OBIX JSX | React JSX |
|--------|----------|-----------|
| **Compilation** | To OBIX components (data objects) | To React.createElement calls |
| **Virtual DOM** | None | Virtual DOM tree |
| **Rendering** | `.render(state)` → HTML string | React runtime renders to DOM |
| **State Management** | Explicit actions | useState, useReducer hooks |
| **Framework** | Framework-agnostic | React-specific |
| **Bundle Size** | Smaller (no DOM diffing) | Larger (React runtime) |
