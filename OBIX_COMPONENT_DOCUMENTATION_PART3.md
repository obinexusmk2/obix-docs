# @obinexusltd/obix Components - Integration Patterns & Examples

**Version**: 0.1.0  
**Part 3 of 4**

---

## Table of Contents

1. [Building a Contact Form](#building-a-contact-form)
2. [Creating a User Dashboard](#creating-a-user-dashboard)
3. [Building a Product Grid](#building-a-product-grid)
4. [Landing Page with Hero](#landing-page-with-hero)
5. [Modal & Confirmation Patterns](#modal--confirmation-patterns)
6. [Server-Side Rendering](#server-side-rendering)
7. [State Management Patterns](#state-management-patterns)
8. [Error Handling & Validation](#error-handling--validation)
9. [Responsive Design](#responsive-design)
10. [Accessibility in Practice](#accessibility-in-practice)

---

## Building a Contact Form

### Basic Contact Form (DOP Pattern)

```typescript
import {
  createForm,
  createInput,
  createTextarea,
  createButton,
  createAlert
} from '@obinexusltd/obix-component-runtime';

// Component definitions
const emailInput = createInput({
  name: 'email',
  type: 'email',
  label: 'Email Address',
  placeholder: 'you@example.com',
  required: true,
  validation: 'blur',
  ariaDescribedBy: 'email-hint'
});

const nameInput = createInput({
  name: 'name',
  type: 'text',
  label: 'Full Name',
  placeholder: 'John Doe',
  required: true,
  minLength: 2,
  validation: 'blur'
});

const messageTextarea = createTextarea({
  name: 'message',
  label: 'Message',
  placeholder: 'Your message here...',
  required: true,
  minLength: 10,
  maxLength: 1000,
  rows: 6,
  showCharCount: true
});

const submitButton = createButton({
  label: 'Send Message',
  variant: 'primary',
  size: 'md'
});

const contactForm = createForm({
  name: 'contact',
  fields: [
    { name: 'name', required: true },
    { name: 'email', required: true },
    { name: 'message', required: true }
  ],
  showErrorSummary: true,
  errorSummaryPosition: 'top'
});

// Form state management
let formState = contactForm.state;
let nameState = nameInput.state;
let emailState = emailInput.state;
let messageState = messageTextarea.state;
let buttonState = submitButton.state;

// Handle name input change
function handleNameChange(value) {
  nameState = nameInput.actions.change(nameState, value);
  render();
}

// Handle email input change
function handleEmailChange(value) {
  emailState = emailInput.actions.change(emailState, value);
  render();
}

// Handle email blur (validation)
function handleEmailBlur() {
  emailState = emailInput.actions.blur(emailState);
  if (emailState.error) {
    formState = contactForm.actions.setFieldError(formState, 'email', emailState.error);
  }
  render();
}

// Handle message change
function handleMessageChange(value) {
  messageState = messageTextarea.actions.change(messageState, value);
  render();
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Validate all fields
  formState = contactForm.actions.validateAll(formState);
  
  if (formState.hasErrors) {
    console.error('Form has validation errors');
    return;
  }
  
  // Show loading state
  buttonState = submitButton.actions.setLoading(buttonState, true);
  render();
  
  try {
    // Submit to server
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameState.value,
        email: emailState.value,
        message: messageState.value
      })
    });
    
    if (!response.ok) throw new Error('Submission failed');
    
    // Success
    const successAlert = createAlert({
      message: 'Message sent successfully! We\'ll get back to you soon.',
      type: 'success',
      dismissible: true
    });
    
    console.log(successAlert.render(successAlert.state));
    
    // Reset form
    resetForm();
  } catch (error) {
    // Error handling
    formState = contactForm.actions.setFieldError(formState, 'email', error.message);
  } finally {
    buttonState = submitButton.actions.setLoading(buttonState, false);
    render();
  }
}

function resetForm() {
  formState = contactForm.actions.resetForm(formState);
  nameState = nameInput.actions.clear(nameState);
  emailState = emailInput.actions.clear(emailState);
  messageState = messageTextarea.actions.clear(messageState);
  render();
}

// Render function
function render() {
  const html = `
    <form class="contact-form" id="contact-form">
      ${contactForm.render(formState)}
      
      <div class="form-group">
        ${nameInput.render(nameState)}
      </div>
      
      <div class="form-group">
        ${emailInput.render(emailState)}
        <p id="email-hint" class="form-hint">We'll never share your email.</p>
      </div>
      
      <div class="form-group">
        ${messageTextarea.render(messageState)}
      </div>
      
      ${submitButton.render(buttonState)}
    </form>
  `;
  
  const container = document.getElementById('contact-container');
  container.innerHTML = html;
  
  // Attach event listeners
  document.getElementById('name-input')?.addEventListener('change', e => handleNameChange(e.target.value));
  document.getElementById('email-input')?.addEventListener('change', e => handleEmailChange(e.target.value));
  document.getElementById('email-input')?.addEventListener('blur', handleEmailBlur);
  document.getElementById('message-input')?.addEventListener('change', e => handleMessageChange(e.target.value));
  document.getElementById('contact-form')?.addEventListener('submit', handleFormSubmit);
}

// Initial render
render();
```

### JSX Version (React-like)

```tsx
/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Fragment */

import { h, Fragment } from '@obinexusltd/obix-component-runtime/jsx-runtime';
import {
  createForm,
  createInput,
  createTextarea,
  createButton,
  createAlert
} from '@obinexusltd/obix-component-runtime';

interface ContactFormState {
  name: { value: string; error?: string };
  email: { value: string; error?: string };
  message: { value: string; error?: string };
  submitting: boolean;
  success: boolean;
}

export function ContactForm() {
  const [state, setState] = useState<ContactFormState>({
    name: { value: '' },
    email: { value: '' },
    message: { value: '' },
    submitting: false,
    success: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(s => ({ ...s, submitting: true }));

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.name.value,
          email: state.email.value,
          message: state.message.value
        })
      });

      if (!res.ok) throw new Error('Failed to send message');

      setState(s => ({ ...s, success: true, submitting: false }));
      setTimeout(() => setState(s => ({ ...s, success: false })), 5000);
    } catch (error) {
      setState(s => ({
        ...s,
        email: { ...s.email, error: error.message },
        submitting: false
      }));
    }
  };

  const nameInput = <createInput
    name="name"
    type="text"
    label="Full Name"
    placeholder="John Doe"
    required
    minLength={2}
    value={state.name.value}
    onChange={e => setState(s => ({ ...s, name: { value: e.target.value } }))}
  />;

  const emailInput = <createInput
    name="email"
    type="email"
    label="Email Address"
    placeholder="you@example.com"
    required
    value={state.email.value}
    onChange={e => setState(s => ({ ...s, email: { value: e.target.value } }))}
    error={state.email.error}
  />;

  const messageTextarea = <createTextarea
    name="message"
    label="Message"
    placeholder="Your message..."
    required
    minLength={10}
    maxLength={1000}
    value={state.message.value}
    onChange={e => setState(s => ({ ...s, message: { value: e.target.value } }))}
    showCharCount
  />;

  const submitButton = <createButton
    label={state.submitting ? 'Sending...' : 'Send Message'}
    variant="primary"
    loading={state.submitting}
    disabled={state.submitting}
  />;

  return (
    <Fragment>
      {state.success && <createAlert
        message="Message sent! We'll be in touch soon."
        type="success"
        dismissible
      />}
      
      <form onSubmit={handleSubmit}>
        {nameInput.render(nameInput.state)}
        {emailInput.render(emailInput.state)}
        {messageTextarea.render(messageTextarea.state)}
        {submitButton.render(submitButton.state)}
      </form>
    </Fragment>
  );
}
```

---

## Creating a User Dashboard

### Dashboard Layout with Multiple Components

```typescript
import {
  createNavigation,
  createCard,
  createTable,
  createProgress,
  createAlert,
  createBreadcrumb,
  createButton
} from '@obinexusltd/obix-component-runtime';

// Navigation
const dashboard Nav = createNavigation({
  logo: { src: '/logo.svg', alt: 'OBINexus', href: '/' },
  items: [
    { label: 'Dashboard', href: '/dashboard', current: true },
    { label: 'Users', href: '/users' },
    { label: 'Settings', href: '/settings' },
    { label: 'Account', href: '/account', submenu: [
        { label: 'Profile', href: '/profile' },
        { label: 'Sign Out', href: '/logout' }
      ]
    }
  ],
  showSkipLink: true,
  skipLinkTarget: 'dashboard-content'
});

// Breadcrumb
const breadcrumb = createBreadcrumb({
  items: [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', current: true }
  ]
});

// Summary cards
const activeUsersCard = createCard({
  title: 'Active Users',
  content: '<p class="metric-value">1,234</p><p class="metric-change">+12% from last month</p>',
  width: '100%',
  height: '200px',
  interactive: true
});

const revenueCard = createCard({
  title: 'Revenue',
  content: '<p class="metric-value">$45,231</p><p class="metric-change">+8% from last month</p>',
  width: '100%',
  height: '200px',
  interactive: true
});

const conversionCard = createCard({
  title: 'Conversion Rate',
  content: '<p class="metric-value">3.24%</p><p class="metric-change">-0.5% from last month</p>',
  width: '100%',
  height: '200px',
  interactive: true
});

// Users table
const usersTable = createTable({
  caption: 'Recent Users',
  headers: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'joined', label: 'Joined', sortable: true }
  ],
  rows: [
    { name: 'Alice Johnson', email: 'alice@example.com', status: 'Active', joined: '2025-04-01' },
    { name: 'Bob Smith', email: 'bob@example.com', status: 'Active', joined: '2025-03-28' },
    { name: 'Carol Davis', email: 'carol@example.com', status: 'Inactive', joined: '2025-03-15' }
  ],
  striped: true,
  hoverable: true
});

// Server health progress
const serverHealthProgress = createProgress({
  value: 87,
  min: 0,
  max: 100,
  showLabel: true,
  ariaLabel: 'Server health',
  ariaValueText: 'Server health: 87% uptime'
});

// Alerts
const systemAlert = createAlert({
  message: 'Scheduled maintenance on Sunday, 2 AM - 4 AM UTC',
  type: 'warning',
  dismissible: false
});

// Render dashboard
function renderDashboard() {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Dashboard</title>
        <link rel="stylesheet" href="/obix-styles.css">
        <style>
          .dashboard-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            padding: 24px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 32px;
          }
          @media (max-width: 768px) {
            .metrics-grid {
              grid-template-columns: 1fr;
            }
          }
          .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin: 0;
          }
          .metric-change {
            margin: 8px 0 0 0;
            color: #6b7280;
            font-size: 0.875em;
          }
        </style>
      </head>
      <body>
        ${dashboardNav.render(dashboardNav.state)}
        
        <main id="dashboard-content">
          ${breadcrumb.render(breadcrumb.state)}
          
          <h1>Dashboard</h1>
          
          ${systemAlert.render(systemAlert.state)}
          
          <div class="metrics-grid">
            ${activeUsersCard.render(activeUsersCard.state)}
            ${revenueCard.render(revenueCard.state)}
            ${conversionCard.render(conversionCard.state)}
          </div>
          
          <section>
            <h2>Server Health</h2>
            ${serverHealthProgress.render(serverHealthProgress.state)}
          </section>
          
          <section>
            ${usersTable.render(usersTable.state)}
          </section>
        </main>
      </body>
    </html>
  `;
  
  return html;
}
```

---

## Building a Product Grid

### Responsive Product Grid

```typescript
import { createCard, createImage, createButton, createRating } from '@obinexusltd/obix-component-runtime';

const products = [
  {
    id: 1,
    name: 'OBIX SDK',
    price: '$99',
    image: '/obix-sdk.jpg',
    alt: 'OBIX Heart/Soul UI/UX SDK product image',
    rating: 4.8,
    reviews: 128,
    inStock: true
  },
  {
    id: 2,
    name: 'MMUKO OS',
    price: '$149',
    image: '/mmuko-os.jpg',
    alt: 'MMUKO OS product image',
    rating: 4.6,
    reviews: 92,
    inStock: true
  },
  {
    id: 3,
    name: 'libpolycall-v1',
    price: '$49',
    image: '/libpolycall.jpg',
    alt: 'libpolycall protocol library image',
    rating: 4.9,
    reviews: 156,
    inStock: false
  }
];

function createProductCard(product) {
  const productImage = createImage({
    src: product.image,
    alt: product.alt,
    width: 300,
    height: 200,
    aspectRatio: '3 / 2',
    loading: 'lazy'
  });

  const buyButton = createButton({
    label: product.inStock ? 'Add to Cart' : 'Out of Stock',
    variant: product.inStock ? 'primary' : 'ghost',
    disabled: !product.inStock,
    size: 'md'
  });

  const content = `
    ${productImage.render(productImage.state)}
    <h3>${product.name}</h3>
    <div class="product-rating">
      <span class="rating-stars" role="img" aria-label="${product.rating} out of 5 stars">★★★★☆</span>
      <span class="rating-text">${product.rating} (${product.reviews} reviews)</span>
    </div>
    <p class="product-price">${product.price}</p>
    ${buyButton.render(buyButton.state)}
  `;

  const card = createCard({
    title: product.name,
    content: content,
    width: '100%',
    height: 'auto',
    interactive: true
  });

  return card;
}

function renderProductGrid() {
  const productCards = products.map(p => createProductCard(p));

  const html = `
    <div class="product-grid" style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      padding: 24px;
    ">
      ${productCards.map(card => card.render(card.state)).join('')}
    </div>
  `;

  return html;
}

// Responsive styles
const styles = `
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    padding: 24px;
  }
  
  @media (max-width: 768px) {
    .product-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
      padding: 16px;
    }
  }
  
  @media (max-width: 480px) {
    .product-grid {
      grid-template-columns: 1fr;
    }
  }
  
  .product-rating {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
  }
  
  .rating-stars {
    font-size: 1.2em;
  }
  
  .rating-text {
    font-size: 0.875em;
    color: #6b7280;
  }
  
  .product-price {
    font-size: 1.5em;
    font-weight: bold;
    color: #0066cc;
    margin: 8px 0;
  }
`;
```

---

## Landing Page with Hero

### Complete Landing Page

```typescript
import {
  createNavigation,
  createButton,
  createImage,
  createCard,
  createFooter
} from '@obinexusltd/obix-component-runtime';

// Navigation
const navBar = createNavigation({
  logo: { src: '/logo.svg', alt: 'OBINexus', href: '/' },
  items: [
    { label: 'Home', href: '/', current: true },
    { label: 'Features', href: '#features' },
    { label: 'Docs', href: '/docs' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '#contact' }
  ]
});

// Hero section
const heroImage = createImage({
  src: '/hero.jpg',
  alt: 'Hero banner showing OBINexus platform in action',
  width: 1200,
  height: 600,
  aspectRatio: '2 / 1',
  loading: 'eager'
});

const cta Button = createButton({
  label: 'Get Started',
  variant: 'primary',
  size: 'lg'
});

// Feature cards
const accessibilityCard = createCard({
  title: 'Accessibility First',
  content: '<p>WCAG 2.1 AA compliant by default. Every component enforces touch targets, keyboard navigation, and ARIA attributes.</p>',
  width: '100%',
  height: 'auto'
});

const dopCard = createCard({
  title: 'Data-Oriented',
  content: '<p>Components are pure data structures. No virtual DOM, no framework lock-in. Works everywhere.</p>',
  width: '100%',
  height: 'auto'
});

const fudCard = createCard({
  title: 'FUD-Free',
  content: '<p>Fear, Uncertainty, and Doubt are eliminated through enforced policies. Focus, Undo, and Drag patterns built-in.</p>',
  width: '100%',
  height: 'auto'
});

function renderLandingPage() {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>OBINexus - Constitutional Computing Framework</title>
        <link rel="stylesheet" href="/obix-styles.css">
        <style>
          .hero {
            background: linear-gradient(135deg, #001427 0%, #5f634f 100%);
            color: white;
            padding: 80px 24px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 600px;
            flex-direction: column;
            gap: 32px;
          }
          
          .hero h1 {
            font-size: 3em;
            margin: 0;
            font-weight: bold;
          }
          
          .hero p {
            font-size: 1.25em;
            margin: 0;
            opacity: 0.9;
          }
          
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 32px;
            padding: 80px 24px;
            background: #f9fafb;
          }
          
          .features h2 {
            grid-column: 1 / -1;
            text-align: center;
            font-size: 2em;
            margin: 0 0 32px 0;
          }
          
          footer {
            background: #1f2937;
            color: white;
            padding: 40px 24px;
            text-align: center;
          }
          
          footer p {
            margin: 0;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        ${navBar.render(navBar.state)}
        
        <section class="hero" id="hero">
          <h1>The Heart of Your Software System</h1>
          <p>Build accessible, data-oriented interfaces with OBIX</p>
          <p>WCAG 2.1 AA compliant. FUD-free. Framework-agnostic.</p>
          ${cta Button.render(cta Button.state)}
        </section>
        
        <section class="features" id="features">
          <h2>Why Choose OBIX?</h2>
          ${accessibilityCard.render(accessibilityCard.state)}
          ${dopCard.render(dopCard.state)}
          ${fudCard.render(fudCard.state)}
        </section>
        
        <footer>
          <p>&copy; 2026 OBINexus Computing. Licensed under MIT.</p>
          <p>Made with ❤️ in London, UK</p>
        </footer>
      </body>
    </html>
  `;
  
  return html;
}
```

---

## Modal & Confirmation Patterns

### Confirmation Dialog Pattern

```typescript
import { createModal, createButton } from '@obinexusltd/obix-component-runtime';

function createConfirmationModal(options) {
  const { title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel } = options;

  const cancelBtn = createButton({
    label: cancelLabel,
    variant: 'secondary',
    size: 'md'
  });

  const confirmBtn = createButton({
    label: confirmLabel,
    variant: 'danger',
    size: 'md'
  });

  const modal = createModal({
    title: title,
    content: `<p>${message}</p>`,
    closeOnEscape: true,
    closeOnBackdropClick: false,
    size: 'md',
    centered: true,
    actions: [
      { label: cancelLabel, variant: 'secondary', onClick: onCancel },
      { label: confirmLabel, variant: 'danger', onClick: onConfirm }
    ]
  });

  return modal;
}

// Usage
function deleteItem(itemId) {
  const modal = createConfirmationModal({
    title: 'Delete Item',
    message: `Are you sure you want to delete this item? This action cannot be undone.`,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    onConfirm: () => {
      fetch(`/api/items/${itemId}`, { method: 'DELETE' })
        .then(() => {
          console.log('Item deleted');
          modal.actions.close(modal.state);
          // Refresh UI
        })
        .catch(err => console.error(err));
    },
    onCancel: () => {
      modal.actions.close(modal.state);
    }
  });

  const html = modal.render(modal.actions.open(modal.state));
  document.body.appendChild(document.createElement('div')).innerHTML = html;
}
```

---

## Server-Side Rendering

### Express.js Integration

```typescript
import express from 'express';
import {
  createButton,
  createCard,
  createTable,
  createAlert
} from '@obinexusltd/obix-component-runtime';

const app = express();

// Route: Render user list
app.get('/users', (req, res) => {
  const users = [
    { name: 'Alice', email: 'alice@example.com', status: 'Active', joined: '2025-01-15' },
    { name: 'Bob', email: 'bob@example.com', status: 'Active', joined: '2024-12-20' },
    { name: 'Carol', email: 'carol@example.com', status: 'Inactive', joined: '2025-02-03' }
  ];

  const usersTable = createTable({
    caption: 'All Users',
    headers: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'status', label: 'Status' },
      { key: 'joined', label: 'Joined', sortable: true }
    ],
    rows: users,
    striped: true,
    hoverable: true
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Users</title>
        <link rel="stylesheet" href="/obix-styles.css">
      </head>
      <body>
        <h1>Users</h1>
        ${usersTable.render(usersTable.state)}
      </body>
    </html>
  `;

  res.send(html);
});

// Route: Render dashboard with alerts
app.get('/dashboard', (req, res) => {
  const successAlert = createAlert({
    message: 'Welcome back!',
    type: 'success',
    dismissible: true
  });

  const summaryCard = createCard({
    title: 'Summary',
    content: '<p>Everything is running smoothly.</p>',
    width: '300px',
    height: '200px'
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dashboard</title>
        <link rel="stylesheet" href="/obix-styles.css">
      </head>
      <body>
        ${successAlert.render(successAlert.state)}
        ${summaryCard.render(summaryCard.state)}
      </body>
    </html>
  `;

  res.send(html);
});

app.listen(3000, () => console.log('Server running on :3000'));
```

### HTMX Partial Responses

```typescript
app.post('/modal/delete-confirmation', (req, res) => {
  const modal = createModal({
    title: 'Confirm Deletion',
    content: '<p>Are you sure? This cannot be undone.</p>',
    closeOnEscape: true,
    actions: [
      { label: 'Cancel', variant: 'secondary' },
      { label: 'Delete', variant: 'danger' }
    ]
  });

  // Return just the modal HTML for HTMX to swap
  res.send(modal.render(modal.state));
});
```

---

## State Management Patterns

### Context-based State with Revisions

```typescript
import { createButton } from '@obinexusltd/obix-component-runtime';

class FormStateManager {
  constructor() {
    this.fields = {};
    this.revisions = [];
    this.currentRevision = 0;
  }

  registerField(name, component) {
    this.fields[name] = {
      component,
      state: component.state
    };
  }

  updateField(name, action, ...args) {
    const field = this.fields[name];
    const newState = field.component.actions[action](field.state, ...args);
    
    // Track revision
    this.revisions.push({
      timestamp: Date.now(),
      field: name,
      action: action,
      before: field.state,
      after: newState
    });
    
    field.state = newState;
    this.currentRevision = this.revisions.length - 1;
    
    return newState;
  }

  undo() {
    if (this.currentRevision > 0) {
      this.currentRevision--;
      const revision = this.revisions[this.currentRevision];
      this.fields[revision.field].state = revision.before;
      return this.fields[revision.field].state;
    }
  }

  redo() {
    if (this.currentRevision < this.revisions.length - 1) {
      this.currentRevision++;
      const revision = this.revisions[this.currentRevision];
      this.fields[revision.field].state = revision.after;
      return this.fields[revision.field].state;
    }
  }

  getState() {
    const state = {};
    Object.entries(this.fields).forEach(([name, { state: fieldState }]) => {
      state[name] = fieldState.value;
    });
    return state;
  }
}

// Usage
const stateManager = new FormStateManager();

const nameInput = createInput({ name: 'name', label: 'Name' });
stateManager.registerField('name', nameInput);

// Update
stateManager.updateField('name', 'change', 'Alice');
console.log(stateManager.getState()); // { name: 'Alice' }

// Undo
stateManager.undo();
console.log(stateManager.getState()); // { name: '' }

// Redo
stateManager.redo();
console.log(stateManager.getState()); // { name: 'Alice' }
```

---

## Error Handling & Validation

### Comprehensive Validation Pattern

```typescript
import { createForm, createInput, createAlert } from '@obinexusltd/obix-component-runtime';

class FormValidator {
  constructor() {
    this.validators = {};
    this.errors = {};
  }

  addValidator(fieldName, validator) {
    this.validators[fieldName] = validator;
  }

  async validate(fieldName, value) {
    const validator = this.validators[fieldName];
    if (!validator) return null;

    try {
      const result = await validator(value);
      if (result === true) {
        delete this.errors[fieldName];
        return null;
      } else {
        this.errors[fieldName] = result;
        return result;
      }
    } catch (error) {
      this.errors[fieldName] = error.message;
      return error.message;
    }
  }

  validateAll(data) {
    return Promise.all(
      Object.entries(data).map(([field, value]) => this.validate(field, value))
    );
  }

  getErrors() {
    return this.errors;
  }

  hasErrors() {
    return Object.keys(this.errors).length > 0;
  }
}

// Usage
const validator = new FormValidator();

// Email validation
validator.addValidator('email', async (value) => {
  if (!value.includes('@')) return 'Invalid email address';
  
  // Server-side check
  const res = await fetch(`/api/check-email?email=${encodeURIComponent(value)}`);
  const { available } = await res.json();
  
  if (!available) return 'Email already in use';
  return true;
});

// Password validation
validator.addValidator('password', async (value) => {
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(value)) return 'Password must include uppercase letter';
  if (!/[0-9]/.test(value)) return 'Password must include number';
  return true;
});

// Username validation
validator.addValidator('username', async (value) => {
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, hyphens, underscores';
  
  // Server-side check
  const res = await fetch(`/api/check-username?username=${encodeURIComponent(value)}`);
  const { available } = await res.json();
  
  if (!available) return 'Username is taken';
  return true;
});

// Full form validation
async function handleSignUp(formData) {
  const errors = await validator.validateAll(formData);
  
  if (validator.hasErrors()) {
    const errorAlert = createAlert({
      message: 'Please fix the following errors before submitting:',
      type: 'error',
      dismissible: false
    });
    
    console.log(errorAlert.render(errorAlert.state));
    console.log(validator.getErrors());
    return;
  }
  
  // Submit form
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  if (!res.ok) {
    const successAlert = createAlert({
      message: 'Account created successfully!',
      type: 'success'
    });
    console.log(successAlert.render(successAlert.state));
  }
}
```

---

## Responsive Design

### Mobile-First Responsive Patterns

```typescript
// CSS with responsive breakpoints
const responsiveStyles = `
  /* Mobile first (default) */
  .container {
    padding: 12px;
  }
  
  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  /* Tablet (768px+) */
  @media (min-width: 768px) {
    .container {
      padding: 24px;
    }
    
    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
  }
  
  /* Desktop (1024px+) */
  @media (min-width: 1024px) {
    .container {
      padding: 32px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
  }
  
  /* Respect user motion preference */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    body {
      background: #1f2937;
      color: #f3f4f6;
    }
  }
`;

// Component with responsive image
const responsiveImage = createImage({
  src: '/image-lg.jpg',
  alt: 'Responsive image',
  srcSet: `
    /image-sm.jpg 480w,
    /image-md.jpg 768w,
    /image-lg.jpg 1200w
  `,
  sizes: `
    (max-width: 480px) 100vw,
    (max-width: 768px) 90vw,
    1200px
  `,
  aspectRatio: '16 / 9'
});

// Component with responsive layout
const responsiveNav = createNavigation({
  items: [
    { label: 'Home', href: '/', current: true },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ],
  mobileMenu: true,  // Shows hamburger on small screens
  responsive: true
});
```

---

## Accessibility in Practice

### ARIA Landmarks & Semantic HTML

```typescript
const semanticLayout = `
  <a href="#main" class="obix-skip-link">Skip to main content</a>
  
  <header role="banner">
    <nav role="navigation" aria-label="Main navigation">
      <!-- Navigation items -->
    </nav>
  </header>
  
  <main id="main" role="main">
    <h1>Page Title</h1>
    
    <section aria-labelledby="section-title">
      <h2 id="section-title">Section Title</h2>
      <!-- Section content -->
    </section>
    
    <article>
      <h2>Article Title</h2>
      <!-- Article content -->
    </article>
  </main>
  
  <aside role="complementary" aria-label="Sidebar">
    <!-- Sidebar content -->
  </aside>
  
  <footer role="contentinfo">
    <!-- Footer content -->
  </footer>
`;

// ARIA live regions for dynamic content
const liveRegion = createAlert({
  message: 'New message received',
  type: 'info',
  ariaLive: 'polite'  // Announces politely (doesn't interrupt screen reader)
});

const urgentAlert = createAlert({
  message: 'Critical error occurred',
  type: 'error',
  ariaLive: 'assertive'  // Interrupts screen reader immediately
});

// Color contrast compliance
const contrastSafeColors = {
  primary: '#0066cc',      // 7.5:1 contrast with white
  success: '#28a745',      // 5.4:1 contrast with white
  danger: '#dc3545',       // 6.3:1 contrast with white
  warning: '#ffc107',      // 10.5:1 contrast with black text (use black text)
  background: '#ffffff',
  text: '#111827'          // 16:1 contrast with white
};

// Icon alternative text
const iconButton = createButton({
  label: 'Save',
  icon: '💾',
  ariaLabel: 'Save document'  // Essential for icon-only buttons
});

// Form accessibility
const accessibleForm = `
  <form>
    <fieldset>
      <legend>Shipping Address</legend>
      
      <div class="form-group">
        <label for="address-1">Address Line 1</label>
        <input type="text" id="address-1" name="address1" required>
      </div>
      
      <div class="form-group">
        <label for="address-2">Address Line 2 (optional)</label>
        <input type="text" id="address-2" name="address2">
      </div>
    </fieldset>
  </form>
`;

// Table accessibility
const accessibleTable = createTable({
  caption: 'Sales by Region (Q1 2026)',
  headers: [
    { key: 'region', label: 'Region', sortable: true },
    { key: 'sales', label: 'Sales ($)', sortable: true },
    { key: 'growth', label: 'Growth (%)', sortable: true }
  ],
  rows: [
    { region: 'North America', sales: '$1,245,000', growth: '+12%' },
    { region: 'Europe', sales: '$987,000', growth: '+8%' },
    { region: 'Asia Pacific', sales: '$654,000', growth: '+18%' }
  ]
});
```

---

## Next Steps

- [Part 4: Accessibility & WCAG Compliance Guide](./OBIX_COMPONENT_DOCUMENTATION_PART4.md)
- [API Reference](./OBIX_COMPONENT_DOCUMENTATION_PART2.md)
- [GitHub: @obinexusltd/obix](https://github.com/obinexusmk2/obix)

