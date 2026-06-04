# OBIX Interactive UI Guide

This is the canonical guide for building interactive UI with the current OBIX architecture.

## Core contract

Every OBIX component factory returns a plain object:

```typescript
{
  state,
  actions,
  render,
  ...
}
```

Rendering is explicit. OBIX does not introduce a virtual DOM or implicit render loop in the core contract.

## Option 1: Plain DOP usage

Use this when you want the lowest-level, most explicit model.

```typescript
import { h } from '@obinexusltd/obix-jsx-adapter';
import { obixButton } from '@obinexusltd/obix-jsx-components';

const button = h(obixButton, { label: 'Count: 0' });
let state = button.state;

function increment() {
  state = button.actions.setLabel(state, `Count: ${Date.now()}`);
  document.getElementById('app')!.innerHTML = button.render(state);
}
```

## Option 2: Reactive wrapper

Use this when you want subscription-based state changes but still control DOM updates yourself.

```typescript
import { toJSXReactive } from '@obinexusltd/obix-jsx-integration';

const reactive = toJSXReactive(button);

reactive.subscribe((state) => {
  document.getElementById('app')!.innerHTML = button.render(state);
});

reactive.dispatch('setLabel', 'Updated');
```

Reactive in OBIX means observable state propagation. It does not mean automatic DOM reconciliation by itself.

## Option 3: Optional DOM mount helper

Use this when you want a first-party helper for render wiring, delegated events, and cleanup.

```typescript
import { mount } from '@obinexusltd/obix-jsx-integration';

const mounted = mount(button, document.getElementById('app')!, {
  events: [
    {
      event: 'click',
      selector: '.obix-button',
      action: 'setLabel',
      args: ['Clicked']
    }
  ]
});
```

`mount()` handles:
- initial render
- subscription-driven re-render
- delegated DOM events
- `unmount()` cleanup

`mount()` currently uses full-container re-rendering. That is an ergonomics helper, not a DOM diffing runtime.

## SSR boundaries

- SSR-safe: components that render from serializable state/config only
- Browser-enhanced: components that can be string-rendered on the server but need browser APIs for interaction
- Browser-only: components that require `HTMLElement`, `window`, or `document`

When in doubt, treat OBIX as string-render-friendly rather than universally SSR-safe.
