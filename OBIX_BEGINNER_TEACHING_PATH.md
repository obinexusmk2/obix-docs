# OBIX Beginner Teaching Path

This guide teaches OBIX as a data-first UI model for beginners. The central idea is:

```text
state -> action -> render
```

OBIX components are easiest to understand when you treat the interface as plain data. A component has state, actions transform that state, and render turns the current state into HTML.

The examples below follow the documented OBIX component shape from `@obinexusltd/obix-component-runtime`: component factory functions return `state`, `actions`, and `render`. They are meant for learning the model first. In a real project, confirm the installed package version and import paths before copying code directly.

## Lesson 1: What OBIX Is

### Goal

Understand OBIX as an accessibility-first, data-oriented UI runtime.

### The Idea

In many UI frameworks, a component can feel like a small machine with hidden internal behavior. OBIX starts from a simpler mental model:

```text
state:  plain data describing the UI
action: a pure function that returns the next state
render: a deterministic function that turns state into HTML
```

That means a button is not mainly an object with secrets. It is data:

```typescript
{
  label: "Save",
  variant: "primary",
  disabled: false,
  loading: false
}
```

When the user does something, an action returns new data:

```text
old button state -> setLoading(true) -> new button state
```

Then render produces output:

```text
new button state -> render -> accessible HTML
```

### Why Accessibility Fits Here

Accessibility is easier to enforce when the UI is explicit data. OBIX can inspect state and add required behavior such as:

- labels for form fields
- `aria-invalid` for invalid inputs
- `aria-describedby` for connected error messages
- `aria-live` for status and error announcements
- minimum touch target sizing for buttons

The lesson: OBIX does not treat accessibility as decoration added at the end. Accessibility is part of how component state becomes markup.

### Checkpoint

Say this out loud in your own words:

> OBIX components are data plus actions plus render. The UI changes when actions return new state, then render turns that state into HTML.

## Lesson 2: Hello World

### Goal

Render your first OBIX-style component.

### Example

```typescript
import { createButton } from "@obinexusltd/obix-component-runtime";

const helloButton = createButton({
  label: "Hello World",
  variant: "primary",
  size: "md"
});

const html = helloButton.render(helloButton.state);

document.getElementById("app").innerHTML = html;
```

### What Happened

The button factory created a component with three important pieces:

```typescript
helloButton.state;
helloButton.actions;
helloButton.render;
```

The state is the data:

```typescript
{
  label: "Hello World",
  variant: "primary",
  size: "md"
}
```

The render function turns that data into HTML:

```typescript
helloButton.render(helloButton.state);
```

The beginner lesson is not "OBIX magically made a button." The lesson is sharper:

```text
explicit state -> deterministic HTML
```

### Try It

Change the state you pass into `createButton`:

```typescript
const helloButton = createButton({
  label: "Start",
  variant: "secondary",
  size: "lg"
});
```

Then render again. The output changes because the data changed.

### Checkpoint

Answer these:

- Where is the label stored before rendering?
- What function turns the label into visible HTML?
- Why is this easier to inspect than hidden component state?

## Lesson 3: State And Actions

### Goal

Understand how user interaction changes UI through explicit state transforms.

### Example

```typescript
import { createButton } from "@obinexusltd/obix-component-runtime";

const saveButton = createButton({
  label: "Save",
  variant: "primary",
  loading: false,
  disabled: false
});

let buttonState = saveButton.state;

function render() {
  document.getElementById("app").innerHTML = saveButton.render(buttonState);
}

function startSaving() {
  buttonState = saveButton.actions.setLoading(buttonState, true);
  render();
}

render();

document.getElementById("app").addEventListener("click", (event) => {
  const target = event.target as Element | null;

  if (target?.closest(".obix-button")) {
    startSaving();
  }
});
```

### What Happened

The important line is:

```typescript
buttonState = saveButton.actions.setLoading(buttonState, true);
```

That line does not need to mutate the old state in-place. It asks OBIX for the next state. Then the page renders from that next state.

The flow is:

```text
initial state
-> user clicks
-> setLoading(state, true)
-> loading state
-> render loading state
```

### Why Beginners Should Care

When something looks wrong, you can inspect the data:

```typescript
console.log(buttonState);
```

If the state says `loading: true`, the rendered UI should look loading. If it does not, the problem is probably in rendering or styling. If the state still says `loading: false`, the problem is probably in the action or event handler.

That makes debugging less mysterious.

### Checkpoint

Fill in the blanks:

```text
An action receives old ______ and returns new ______.
Render receives current ______ and returns ______.
```

Expected answer:

```text
state, state, state, HTML
```

## Lesson 4: Handling UI Errors

### Goal

Learn that an error is data first, then accessible markup.

### Example

```typescript
import {
  createAlert,
  createInput
} from "@obinexusltd/obix-component-runtime";

const emailInput = createInput({
  name: "email",
  type: "email",
  label: "Email Address",
  placeholder: "you@example.com",
  required: true,
  validation: "blur",
  pattern: "^[\\w.-]+@[\\w.-]+\\.\\w+$",
  ariaDescribedBy: "email-error"
});

let emailState = emailInput.state;

function render() {
  const errorSummary = emailState.error
    ? createAlert({
        message: "Please correct the email address.",
        type: "error",
        ariaLive: "assertive"
      })
    : null;

  document.getElementById("app").innerHTML = `
    ${emailInput.render(emailState)}
    ${
      emailState.error
        ? `<p id="email-error" role="alert">${emailState.error}</p>`
        : ""
    }
    ${errorSummary ? errorSummary.render(errorSummary.state) : ""}
  `;
}

function handleEmailBlur(value) {
  emailState = emailInput.actions.change(emailState, value);
  emailState = emailInput.actions.blur(emailState);
  render();
}
```

### What Happened

The error is not only a paragraph on the page. It is part of state:

```typescript
{
  value: "not-an-email",
  error: "Invalid email address",
  valid: false,
  ariaInvalid: true,
  ariaDescribedBy: "email-error"
}
```

Then render can produce accessible output such as:

```html
<input
  type="email"
  name="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error" role="alert">Invalid email address</p>
```

The flow is:

```text
user types invalid email
-> change action records the value
-> blur action validates the state
-> state contains the error
-> render connects the input to the error message
```

### Why This Matters

A visual-only error helps some users. A state-driven accessible error can help more users because it can connect:

- the invalid field with `aria-invalid`
- the field to its message with `aria-describedby`
- the message to assistive technology with `role="alert"` or `aria-live`

### Checkpoint

Answer these:

- Is the error first stored in HTML or in state?
- Which attribute marks the field invalid?
- Which attribute connects the input to the error message?
- Why should serious errors use an assertive live region?

## Lesson 5: OBIX Compared To React

### Goal

Compare OBIX with React practically, without turning the lesson into a framework argument.

### React Mental Model

In React, a typical input error uses component state:

```tsx
function EmailInput() {
  const [error, setError] = useState<string | null>(null);

  function validate(value: string) {
    if (!value.includes("@")) {
      setError("Invalid email address");
    } else {
      setError(null);
    }
  }

  return (
    <>
      <input onBlur={(event) => validate(event.currentTarget.value)} />
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}
```

The flow is:

```text
event -> setState -> React re-renders JSX
```

### OBIX Mental Model

In OBIX, the same idea is more explicit:

```text
event -> action(oldState) -> newState -> render(newState)
```

The difference is not that one is good and one is bad. The difference is where the update pipeline lives.

React gives you a framework-managed render cycle. OBIX asks you to look directly at the data pipeline.

### Practical Comparison

| Concept | React | OBIX |
| --- | --- | --- |
| UI data | Hook state, props, context | Plain component state |
| Update | `setState` or reducer dispatch | Action returns next state |
| Render | JSX through React runtime | `render(state)` to HTML |
| Error handling | Developer wires state and ARIA | Error state can drive ARIA policies |
| Debugging | Inspect component tree/state | Inspect plain state objects |
| Portability | Usually React app runtime | Vanilla JS, SSR, JSX-style, tests |

### Checkpoint

Explain this difference:

```text
React hides more of the render pipeline.
OBIX exposes more of the render pipeline.
```

That sentence is not an insult to React. It is a design distinction.

## Lesson 6: Why This Matters

### Goal

Understand what OBIX is trying to prove.

### Predictability

If the same state always renders the same HTML, bugs become easier to isolate.

```text
same state -> same render output
```

### Serialization

Plain state can be saved, restored, logged, replayed, or tested:

```typescript
localStorage.setItem("button-state", JSON.stringify(buttonState));
```

That matters for systems where traceability is important.

### Testing

Actions are easier to test when they are plain transformations:

```typescript
const nextState = saveButton.actions.setLoading(saveButton.state, true);

console.assert(nextState.loading === true);
```

Render is easier to test when output depends on state:

```typescript
const html = saveButton.render(nextState);

console.assert(html.includes("aria-busy"));
```

### Accessibility Policy Enforcement

OBIX can enforce policies before rendering:

```text
component config
-> policy checks
-> accessible state
-> accessible HTML
```

That is the architectural reason accessibility fits OBIX well. The system can catch missing labels, invalid ARIA connections, tiny touch targets, and inaccessible interaction patterns closer to the component model.

### Framework Independence

Because the core model is data-oriented, OBIX can be used in more than one style:

- plain JavaScript
- server-rendered HTML
- HTMX-style pages
- JSX-like authoring
- tests without a browser framework

The center of gravity stays the same:

```text
state -> action -> render
```

## Final Beginner Exercise

Build the smallest possible OBIX-style signup field:

1. Create an email input with `createInput`.
2. Store its state in a variable.
3. On blur, call `change`, then `blur`.
4. Render the input.
5. If state contains an error, render an error message.
6. Make sure the invalid input uses `aria-invalid`.
7. Make sure the input points to the error message with `aria-describedby`.

### Success Criteria

You understand this guide when you can:

- explain `state -> action -> render` without notes
- describe a component as plain data
- explain why actions return new state
- explain how an email error becomes accessible markup
- compare OBIX and React without saying OBIX is just another React clone
- describe why accessibility belongs in the component policy layer

## Teaching Notes

For a beginner, do not start with all 30 components. Start with one button and one input. The aim is to make the pipeline obvious:

```text
What is the current state?
What action happened?
What is the next state?
What did render output?
```

Once that rhythm is clear, the rest of OBIX becomes much easier to learn.
