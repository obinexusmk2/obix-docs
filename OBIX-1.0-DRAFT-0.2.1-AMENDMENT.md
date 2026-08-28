# OBIX 1.0 — Draft 0.2.1 Amendment

**Architectural corrections to the DOP-Native Component Language Specification**

| Field | Value |
|---|---|
| Document | OBIX 1.0 DOP-Native Component Language Specification — Draft 0.2.1 Amendment |
| Date | 28 August 2026 |
| Author | OBINexus Computing — Nnamdi Michael Okpala |
| Amends | *OBIX 1.0 Native Component Syntax Proposal* (Draft 0.2, herein **[NCS]**) and *OBIX 1.0 DOP-Native Component Language Specification* (herein **[DOP]**) |
| Supersedes | Draft 0.1 (Kimi, `component Timer { state / action / view }`) — archived, not deleted |
| Scope | Corrections only. No new features. No compiler implementation. |
| Status | Candidate for grammar freeze |

---

## A. Disposition of the ten corrections

The review was written against **[NCS]**, which predates **[DOP]**. Six of the ten corrections were already delivered by [DOP]; four are live defects that survive in both documents. Recording this honestly matters, because it determines what actually changes in the frozen grammar.

| # | Correction | Status | Where |
|---|---|---|---|
| 1 | DOP IR as an explicit compiler stage | **Already delivered** in [DOP] §6, §24, §31 (stage 6 boundary). Restated and tightened below. | §1 |
| 2 | Formally specify `toData/toFunctional/toOOP/toReactive` | **Already delivered** in [DOP] §14–17, with complete ES6 implementations. Signatures updated by correction 4. | §2 |
| 3 | Adapter Equivalence invariant | **Already delivered** in [DOP] §18. Tightened: props enter the equivalence tuple. | §3 |
| 4 | Actions must consume read-only props; `Tick` must enforce `limitSeconds` | **LIVE DEFECT — corrected here.** The bug is real in both documents. | §4 |
| 5 | Runtime claim contradicts generated imports | **LIVE DEFECT — corrected here.** [NCS] preamble overclaims. | §5 |
| 6 | Column-0 section-scanner rule | **LIVE DEFECT — removed here.** [NCS] Rule S3. | §6 |
| 7 | HTML tokenisation vs strict EBNF | **LIVE DEFECT — resolved here.** Contradiction present in both. | §7 |
| 8 | Pipeline diagram with adapter/codegen targets | **Already delivered** in [DOP] §31. Revised to add the SSR target explicitly. | §8 |
| 9 | Exact generated `TimerDOP` artifact | **Already delivered** in [DOP] §24. Reproduced with the corrected action signature. | §9 |
| 10 | Prove `Start → Tick → Tick → Stop` through all four adapters | Specified in [DOP] §18.3; **now executed**, with real output. | §10 |

**The single most important line in this amendment:** correction 4 is a genuine specification bug that would have shipped. `limitSeconds` was declared as a prop, `atLimit` displayed "Maximum duration reached", and `Tick` kept incrementing forever because it could not see props. The reviewer found a defect the specification's own example demonstrated and neither document caught.

---

## 1. Canonical DOP IR as an explicit compiler stage — confirmed

[DOP] §31 already places the IR at stage 6 with the pipeline invariant:

> **Business logic reaches the DOP IR before any paradigm adaptation occurs.**

Two clarifications the review's wording asks for:

**AM-1.1 — The native DOM generator consumes the artifact, it does not bypass it.** [DOP] §28's `mount()` obtains its store from `new DOPAdapter(TimerDOP).toReactive()(options)` and reads `TimerDOP.derived.*` and `TimerDOP.template.bindings`. It contains no transition logic. This is now a **checkable build assertion**, not a convention:

```
AM-1.1  No emitter after pipeline stage 6 may reference an action body,
        construct a state object, or compute a derived value inline.
        Emitters may only read from the artifact.
```

`obixc check --pipeline-invariant` verifies this by AST inspection of the generated modules: any `mount`/`render` emitter containing an object literal whose keys match the state key set is a build failure (`OBIX-P001`).

**AM-1.2 — `toNative()` is the fifth projection, not a layer beneath the four.** Restated from [DOP] §17.3 because the review's concern about "generated runtime bindings" reads as a layering worry. The depth is: artifact → adapter → consumer. `toNative` sits beside `toOOP`, not below it.

---

## 2. Adapter specifications — confirmed, signatures updated

[DOP] §14–17 give complete ES6 implementations of all four. They are unchanged in structure. Correction 4 changes exactly one line in each — the call into `dop.actions` — and adds props threading. The revised bodies are in §B.4 below.

| Adapter | Contract | Holds current state? | Holds props? | Schedules effects? |
|---|---|---|---|---|
| `toData()` | frozen artifact, identity projection | no — caller threads it | no — caller passes it | no |
| `toFunctional()` | pure namespace + `create()` closure | namespace no; closure yes | yes (frozen) | no |
| `toOOP()` | generated class, private fields | yes | yes (frozen) | no |
| `toReactive()` | subscriber set + scheduler | yes | yes (frozen) | **yes** |
| `toNative(el)` | reactive + compiled binding table | yes | yes (frozen) | **yes** |

**AM-2.1.** `toData()` is the only projection that does not carry props, because it is the identity projection: the caller supplies `(state, payload, props)` explicitly. This is deliberate — it is the surface a polyglot binding or a server renderer consumes, and it must have no hidden context.

---

## 3. Adapter Equivalence — tightened

[DOP] §18 stands. One amendment, forced by correction 4:

**AM-3.1 — Props enter the equivalence tuple.** Now that actions consume props, two projections given different props can legitimately produce different states. The invariant is therefore stated over a fixed props object:

> Let `A` be a DOP artifact, `s₀` an initial state, `p` a **frozen props object**, and
> `T = [(a₁, payload₁), …, (aₙ, payloadₙ)]` a finite action trace.
>
> For every projection `P ∈ { Data, Functional, OOP, Reactive, Native }`:
>
> ```
> stateAfter(P, A, s₀, p, T)  ≡  fold(A.actions, s₀, p, T)
> ```
>
> and, for every prefix of `T`, `derived`, `render`, and `validate` agree.

**AM-3.2 — Props are part of the conformance fixture.** `equivalence { … }` blocks in `Component.obix.test` must declare the props used, or the default props are assumed. A trace run under different props in different projections is a malformed test, not a failure (`OBIX-C010`).

**AM-3.3 — Equivalence is the first compiler acceptance test.** Per the review: before `obix:if`, loops, slots, hydration, or contracts, the compiler must pass the four-adapter equivalence check on `Timer.obix`. This is recorded in the freeze scope (§C).

---

## 4. Action semantics — `Action(state, payload, props)`

### 4.1 The defect

[DOP] §21 declares `limitSeconds` as a prop, derives `atLimit`, and renders a hint. But:

```js
Tick(state) {
  if (!state.running) return state;
  return { ...state, seconds: state.seconds + 1 };   // no access to limitSeconds
}
```

The timer displays "Maximum duration reached" and **keeps counting**. The `NeverPastLimit` validation rule in the same file would eventually fire on a state the component itself produced. A specification whose flagship example is internally inconsistent is not ready to freeze.

The cause: [DOP] J20 fixed the signature at `Action(state, ...args)`, with props reachable only by passing them explicitly at each call site (`on:click="Add(props.step)"`). That works for event-driven actions but not for **effect-driven** ones — `effects.tick` dispatches `Tick` with no template call site to thread props through.

### 4.2 Evaluating the candidates

| Candidate | Verdict |
|---|---|
| **(a)** Keep `Action(state, ...args)`; thread props at every call site, including `effects: { tick: { args: [props.limitSeconds] } }` | **Rejected.** Every action needing a prop must have every dispatch site updated, including ones the author does not write. A prop added to a component silently fails to reach an action until each call site is found. Action-at-a-distance in the worst place. |
| **(b)** `Action(state, ...args, props)` — props last after variadics | **Impossible.** A variadic list cannot be followed by a positional parameter. |
| **(c)** `Action(context)` where `context = { state, payload, props }` | **Rejected.** This is Model A's shape re-introduced under a new name. It re-couples adapters to context construction — the precise defect [DOP] §8.1 was written to remove — and breaks `ButtonLogic.js` compatibility in the opposite direction. |
| **(d)** `Action(state, payload, props)` — fixed 3-arity, single payload | **Adopted.** |

### 4.3 The decision

```
Action(state, payload, props) → nextState
```

- `state` — current state. Always first. Frozen.
- `payload` — a single value, or `undefined` when the dispatch carries none.
- `props` — the component's frozen, read-only props. Always last.

This composes with the derived signature under one rule:

> **State first. Props last. Payload between them, when there is one.**

```js
derived.formattedTime(state, props)       // no payload slot
actions.Tick(state, payload, props)       // payload slot present
validation.rules.X.when(state, props)     // no payload slot
```

**AM-4.1 — Props are read-only inside actions.** `props` is frozen at projection construction. Assignment is `OBIX-J039` at compile time and a `TypeError` at runtime in strict mode. An action reads props; it never writes them, and props never enter the returned state unless the author copies a value explicitly.

**AM-4.2 — Determinism is preserved.** `Action(state, payload, props)` remains a total pure function of three inputs. Adding a third input does not weaken purity, serializability, or replayability — it makes explicit a dependency that was previously being smuggled through call sites. Determinism (J24) is now asserted over the triple.

**AM-4.3 — Underscore convention for an unused payload.** `Tick(state, _payload, props)`. The compiler recognises a leading underscore and suppresses the unused-parameter advisory.

**AM-4.4 — Declaring fewer parameters is legal.** `Start(state)` is valid; JavaScript ignores extra arguments. The compiler records declared arity in `ActionDecl.arity` and emits `OBIX-J038` (advisory, not error) when a binding passes a payload to an action that declares none — advisory because `dispatch()` may also be called from host JavaScript.

### 4.4 Payload is one value — and what happens to multi-argument bindings

[DOP] §12–13 permitted up to four arguments in an event binding. Under a single `payload` slot that must be resolved. The rule:

**AM-4.5 — Single argument → payload is that value.**

```html
<input  on:input="SetEmail(event.value)">    <!-- payload = "a@b.c"     -->
<button on:click="Remove(alarm.id)">         <!-- payload = "alarm-17"  -->
<button on:click="Start">                    <!-- payload = undefined   -->
```

**AM-4.6 — Two or more arguments → payload is an object, keyed by name.** The key is the **accessor name** for event accessors and the **final path segment** for path arguments:

```html
<div on:pointerdown="Place(event.x, event.y)">
<!-- payload = { x: 412, y: 88 } -->

<li on:click="Select(alarm.id, event.index)">
<!-- payload = { id: "alarm-17", index: 3 } -->
```

This is not new syntax. It is a naming rule over the argument list [DOP] §13.3 already defines, and it works because every event accessor already has a canonical name.

**AM-4.7 — Constraints on the multi-argument form.** Duplicate derived keys are `OBIX-T095`. Bare literals are not permitted in the multi-argument form (`OBIX-T096`) because a literal has no name — a literal that needs a name is a constant the action should own, or a single-argument dispatch. Maximum four arguments is retained.

**AM-4.8 — Effects gain props for free.** `effects.tick` needs no `args` entry: `dispatch: "Tick"` calls `actions.Tick(state, undefined, props)`, and `Tick` reads `props.limitSeconds` directly. This is what corrections (a) could not do and is the decisive argument for the fixed signature.

### 4.5 The corrected `Tick`

```js
const actions = {
    Start(state) {
        if (state.running) return state;
        return { ...state, running: true };
    },

    Stop(state) {
        if (!state.running) return state;
        return { ...state, running: false };
    },

    Reset(state) {
        return { ...state, seconds: 0, running: false };
    },

    Tick(state, _payload, props) {
        if (!state.running) return state;
        if (state.seconds >= props.limitSeconds) return state;   // identity at the limit
        return { ...state, seconds: state.seconds + 1 };
    }
};
```

Note that the fix uses the **identity return** already canonical in J23: at the limit, `Tick` returns the same object, so no subscriber is notified, no DOM pass runs, and no transition is recorded. The limit is enforced by the state machine refusing to transition, not by a guard bolted on outside it.

**AM-4.9 — Effect quiescence is a consequence, not a special case.** Once `Tick` is identity at the limit, `effects.tick` keeps firing every second and costs one function call. If that is undesirable, the author tightens the effect's own predicate:

```js
const effects = {
    tick: {
        every: 1000,
        while: ({ running, seconds }, { limitSeconds }) => running && seconds < limitSeconds,
        dispatch: "Tick"
    }
};
```

`while` already receives `(state, props)`, so this needs no further change. Both spellings are correct; the second stops the timer entirely at the limit. **The action guard is mandatory** (it is the invariant); **the effect predicate is an optimisation**.

### 4.6 Ripple table — every affected rule

| Location | Was | Becomes |
|---|---|---|
| [DOP] J20 | `ActionName(state, ...args) → newState` | `ActionName(state, payload, props) → newState` |
| [DOP] J25 | arity = `fn.length`, checked against arg count | arity ∈ {1,2,3}; binding payload presence checked advisory (`OBIX-J038`) |
| [DOP] §12.2 pipeline | `dispatch(name, ...payload)` → `actions.Name(state, ...payload)` | `dispatch(name, payload)` → `actions.Name(state, payload, props)` |
| [DOP] §13 E20 | up to 4 positional args | 1 arg → value; 2–4 args → named object (AM-4.6) |
| [DOP] J52 effects | `dispatch` + optional `args: [...]` | `args` becomes a single optional `payload:`; props arrive automatically |
| [DOP] §15 functional | `reduce(state, actionName, ...args)` | `reduce(state, actionName, payload, props = dop.props)` |
| [DOP] §16 OOP | `dispatch(actionName, ...args)` | `dispatch(actionName, payload)`; props from `this.#props` |
| [DOP] §17 reactive | `dispatch(actionName, ...args)` | `dispatch(actionName, payload)`; props from closure |
| [DOP] §18 | equivalence over `(s₀, p, T)` | props explicitly part of the fixture (AM-3.1/3.2) |
| [DOP] §22 test DSL | `dispatch Name(arg, …)` | `dispatch Name(payload)`; `given props { … }` participates |
| [DOP] §32 legacy shim | `(state, ...args)` wrapper | `(state, payload, props)` wrapper; legacy `ctx` gains a frozen `ctx.props` |
| [DOP] §24 IR | `actions` as written | unchanged in shape; `Tick` body corrected |

---

## 5. Runtime claim — corrected, with output modes

### 5.1 The contradiction

[NCS] §0 states that the compiler emits ES modules *"that run in a browser with no framework runtime beneath them"*, while [NCS] §22's generated module opens with:

```js
import { createInstance, bindText, bindAttr, bindBool, bindClassPart,
         bindEvent, createIfBlock, mountEffects } from "@obinexusltd/obix-runtime";
```

Both cannot be true. The architecture is fine; the claim was imprecise.

### 5.2 The corrected claim

> **OBIX has no virtual-DOM and no framework runtime.** Generated components may link a small OBIX **binding runtime** — a set of binding constructors and a dispatch scheduler with no component model, no DOM abstraction, and no third-party dependencies. A standalone output mode emits components with no imports at all.

**AM-5.1 — What the binding runtime is permitted to contain.** Exhaustive:

| Permitted | Forbidden |
|---|---|
| binding constructors (`bindText`, `bindAttr`, `bindBool`, `bindClassPart`) | any component base class or component model |
| block controllers (`createIfBlock`, `createForBlock`) | any virtual DOM, tree, or diff algorithm |
| the dispatch/notify scheduler | any router, store, or dependency-injection container |
| effect start/stop helpers | any DOM abstraction layer or element wrapper |
| the four adapters (`toData`/`toFunctional`/`toOOP`/`toReactive`) | any third-party dependency |
| `createDOP` (freezing + shape validation) | any transition, state, or business logic |

**AM-5.2 — Budget.** The binding runtime is capped at **4 KB minified + gzipped** for the full surface, and it is tree-shakeable per binding kind. A component using only text bindings and events links roughly 1 KB. The cap is a conformance assertion in the runtime's own contract, not an aspiration.

**AM-5.3 — The runtime contains no business logic, by construction.** Every transition is `dop.actions.X(state, payload, props)`. The runtime never constructs a state object. This is the same assertion as AM-1.1, applied to the library rather than the emitters.

### 5.3 Output modes

```bash
obixc build src --out dist --runtime=linked      # default
obixc build src --out dist --runtime=inline      # standalone, zero imports
obixc build src --out dist --runtime=bare        # artifact only, no DOM code
```

| Mode | Emits | Imports | Use |
|---|---|---|---|
| `linked` | artifact + `mount` + adapters | `@obinexusltd/obix-runtime` | applications; one shared runtime across many components |
| `inline` | artifact + `mount` + only the binding constructors this component uses | **none** | a single-file drop-in, a CDN script, an embedded widget, an offline page |
| `bare` | artifact + `render` only | none | SSR, polyglot consumers, tests, static analysis |

**AM-5.4 — `inline` is a genuine no-import ES module.** It is what makes the "native browser output, no framework" claim literally demonstrable:

```html
<script type="module">
  import { mount } from "./Timer.js";     // no other imports anywhere
  mount(document.querySelector("#app"));
</script>
```

**AM-5.5 — Mode does not change semantics.** All three modes emit the same artifact and satisfy Adapter Equivalence. `inline` duplicates ~1 KB per component; that is the entire trade-off, and it is stated so nobody has to measure it to find out.

---

## 6. Section scanner — column-0 rule removed

### 6.1 The defect

[NCS] Rule S3 required section tags at *"column 0 of a line at depth 0."* Under that rule this file is invalid:

```html
  <template>
    <p>Hello</p>
  </template>
```

Indentation is not syntax. A formatter, a here-doc, a templating step, or a developer aligning a file inside a larger document would silently break compilation.

### 6.2 The replacement

**AM-6.1 — Rule S3 is deleted.** Replacement:

> **Rule S3 (revised).** A `.obix` file is a sequence of top-level sections separated by optional whitespace and comments. The scanner skips whitespace, reads a section opening tag, then consumes raw characters up to that section's literal closing tag. Leading whitespace before any opening or closing tag is legal and insignificant.

**AM-6.2 — Scanner algorithm, normative.** Sections do not nest, so no depth tracking is required:

```
loop:
  skip whitespace and HTML comments
  if EOF: stop
  expect one of "<style" | "<template" | "<script"        else OBIX-F016
  read section attributes up to ">"                        else OBIX-F017
  record body start
  scan forward for the literal closing tag
      "</style>" | "</template>" | "</script>"             else OBIX-F014 (unclosed)
  record body end, emit section, continue
```

**AM-6.3 — The closing tag is matched literally, without parsing the body.** This is how HTML treats `<script>` and `<style>` and it is why the body may contain `<` freely. `</script>` inside a JavaScript string terminates the section; `OBIX-J037` advises `<\/script>`. Inside `<template>`, a literal `</template>` in text is `OBIX-F018` — escape it as `&lt;/template&gt;`.

**AM-6.4 — Indentation of section content is preserved verbatim** for the style and script bodies (source maps depend on it) and normalised per HTML whitespace rules inside the template ([DOP] T2).

---

## 7. Template syntax — a strict HTML-compatible subset, stated explicitly

### 7.1 The contradiction

[DOP] §4.1 says the template body is *"parsed with HTML tokenisation rules for tags, attributes, comments and text"*, while [DOP] §29.2's EBNF requires paired closing tags for every non-void element and quoted attribute values. HTML5 tokenisation permits `<li>a<li>b`, `<p>` without `</p>`, unquoted attribute values, and implied `<tbody>`. The grammar and the prose disagree.

### 7.2 The resolution

**AM-7.1 — The normative statement:**

> **OBIX Template Syntax = the semantic HTML vocabulary + a strict OBIX grammar.**
>
> OBIX templates use HTML's element and attribute vocabulary, its ARIA semantics, and its content model. They are **not** parsed with the HTML5 tokenisation algorithm. `obixc` implements the grammar in §29.2, which accepts a strict, unambiguous subset of well-formed HTML. **Generated output is ordinary HTML that browsers parse with full HTML5 semantics** — the strictness applies at authoring time only.

The `<template>` body is neither "HTML" nor "XML". It is an HTML-compatible input language whose grammar is small enough to be implemented correctly by a hand-written parser and analysed statically for bindings and accessibility. Claiming full HTML5 parsing would promise error-recovery behaviour, insertion modes, and foster-parenting that `obixc` will not implement — and that no author of a component should be relying on.

### 7.3 Where OBIX is stricter than HTML5 — exhaustive

| HTML5 permits | OBIX requires | Code |
|---|---|---|
| `<li>a<li>b` (implied end tags) | explicit `</li>` on every non-void element | `OBIX-T002` |
| `<p>` closed by a following block | explicit `</p>` | `OBIX-T002` |
| `<table><tr>` (implied `<tbody>`) | write `<tbody>` explicitly; nothing is inferred | `OBIX-T003` |
| `class=Timer` (unquoted values) | double-quoted attribute values always | `OBIX-T004` |
| `<DIV>` / `<Input>` (case-insensitive tags) | lowercase native tags; capitalised = component reference | `OBIX-F001`-adjacent, `OBIX-T060` |
| `CLASS="x"` (case-insensitive attributes) | lowercase attribute names, except SVG camelCase (`viewBox`) | `OBIX-T005` |
| bare `<` in text | `&lt;` | `OBIX-T006` |
| ~2,200 named character references | numeric refs plus `&amp; &lt; &gt; &quot; &apos; &nbsp;`; others → use the Unicode character | `OBIX-T007` |
| duplicate attributes (first wins) | duplicates are an error | `OBIX-T008` |
| error recovery on mismatched tags | mismatched closing tag is an error | `OBIX-T009` |

**AM-7.2 — Void elements** follow the HTML5 void list exactly and may be written `<img>` or `<img />`. Self-closing syntax on a **non-void** native element (`<div />`) is `OBIX-T010` — it is valid XML and a well-known HTML footgun.

**AM-7.3 — SVG and MathML** are supported as foreign content with case-sensitive attribute names, so `viewBox` and `preserveAspectRatio` work. Only their real casing is accepted; HTML's case-insensitive fixups are not implemented.

**AM-7.4 — The output is unaffected.** Emitted HTML is standard and browsers parse it normally. A stricter input grammar changes what an author may write, never what a browser receives.

**AM-7.5 — Prose corrections.** [DOP] §4.1 sentence *"parsed with HTML tokenisation rules"* is replaced by AM-7.1. [NCS] §7.1's equivalent sentence is replaced identically.

---

## 8. Compiler pipeline — revised

```
Timer.obix
    │
    ▼
[1]  section scanner                → sections + spans (AM-6.2, whitespace-tolerant)
    │
    ▼
[2]  section AST                    → raw bodies typed by section, not yet analysed
    │
    ▼
[3]  parallel parse
     ├── style parser               → CssRule[]
     ├── template parser            → TemplateNode[]   (strict grammar, AM-7.1)
     └── script parser              → ESTree Program   (standard ES parser)
    │
    ▼
[4]  semantic AST                   → ObixComponent; names resolved, namespaces assigned
     ├── name resolution                            OBIX-T030/031/032
     ├── serializable state                         OBIX-J020/021
     ├── purity lint + props read-only              OBIX-J030..039
     ├── closed key set                             OBIX-J022
     ├── action existence / arity / payload         OBIX-T092/093, OBIX-J038
     └── validation descriptor well-formedness      OBIX-V0xx
    │
    ▼
[5]  ═══════ CANONICAL DOP IR ═══════   ← business logic complete; paradigm-free, DOM-free, frozen
    │        { name, initialState, props, actions, derived, validation,
    │          effects, render, template, events, styles, accessibility, metadata }
    │
    ├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
    ▼              ▼              ▼              ▼              ▼              ▼
  Data        Functional        OOP         Reactive       Native DOM        SSR
 toData()   toFunctional()   toOOP()     toReactive()     toNative()    renderToString()
    │              │              │              │              │              │
    └──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
                                   │
                                   ▼
              dist/Timer.js   dist/Timer.css   [Timer.d.ts]   [*.map]
```

**AM-8.1 — Stage 5 is the freeze boundary.** Stages 6+ are pure projections. No projection may introduce, alter, or specialise behaviour (AM-1.1, mechanically checked).

**AM-8.2 — SSR is a sibling target, not a mode of the DOM target.** `renderToString` is generated from the same `template` descriptor as `toNative`, so server and client markup cannot drift. Listing it as a peer makes that explicit in the diagram, which the previous version left implicit.

**AM-8.3 — Dependency analysis and accessibility analysis sit inside stage 5**, producing IR fields (`template.bindings[].stateDeps`, `accessibility`), rather than being post-IR stages. They describe the artifact; they do not transform it.

---

## 9. The exact generated `TimerDOP` artifact

With the corrected action signature. This is what `obixc build --runtime=bare src/Timer.obix` emits, abridged only in the descriptor bodies marked `/* … */`.

```js
// dist/Timer.js — generated by obixc 1.0.0 from src/Timer.obix — @generated

import { createDOP } from "@obinexusltd/obix-runtime";   // omitted under --runtime=inline

export const props = Object.freeze({
  label: "Timer",
  limitSeconds: 3600,
  idleText: "Ready"
});

export const initialState = Object.freeze({
  seconds: 0,
  running: false
});

export const actions = {
  Start(state) {
    if (state.running) return state;
    return { ...state, running: true };
  },
  Stop(state) {
    if (!state.running) return state;
    return { ...state, running: false };
  },
  Reset(state) {
    return { ...state, seconds: 0, running: false };
  },
  Tick(state, _payload, props) {
    if (!state.running) return state;
    if (state.seconds >= props.limitSeconds) return state;
    return { ...state, seconds: state.seconds + 1 };
  }
};

export const derived = {
  formattedTime({ seconds }) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  },
  statusLabel({ running, seconds }, { idleText }) {
    if (running) return "Running";
    if (seconds > 0) return "Paused";
    return idleText;
  },
  visualState({ running }) { return running ? "running" : "idle"; },
  stopped({ running }) { return !running; },
  atLimit({ seconds }, { limitSeconds }) { return seconds >= limitSeconds; }
};

export const validation = {
  props: {
    label:        { required: true, type: "string", minLength: 1,
                    message: "Timer needs a label for its accessible heading" },
    limitSeconds: { type: "number", min: 1,
                    message: "limitSeconds must be a positive number" },
    idleText:     { type: "string" }
  },
  state: {
    seconds: { type: "number", min: 0 },
    running: { type: "boolean" }
  },
  rules: {
    NeverPastLimit: {
      when: ({ seconds }, { limitSeconds }) => seconds > limitSeconds,
      message: "seconds exceeded limitSeconds"
    }
  }
};

export const effects = {
  tick: {
    every: 1000,
    while: ({ running, seconds }, { limitSeconds }) => running && seconds < limitSeconds,
    dispatch: "Tick"
  }
};

/* ---- compile-time analysis, stage 5 ---- */

const DERIVED_DEPS = {
  formattedTime: { state: ["seconds"],            props: [] },
  statusLabel:   { state: ["running", "seconds"], props: ["idleText"] },
  visualState:   { state: ["running"],            props: [] },
  stopped:       { state: ["running"],            props: [] },
  atLimit:       { state: ["seconds"],            props: ["limitSeconds"] }
};

const ACTION_DECLS = {
  Start: { arity: 1, usesPayload: false, usesProps: false },
  Stop:  { arity: 1, usesPayload: false, usesProps: false },
  Reset: { arity: 1, usesPayload: false, usesProps: false },
  Tick:  { arity: 3, usesPayload: false, usesProps: true, propDeps: ["limitSeconds"] }
};

/* ---- descriptor half: pure data, JSON-serializable ---- */

export const template = {
  root: "section",
  html: '<section class="Timer" data-obix="Timer" aria-labelledby="Timer-heading">…</section>',
  bindings: [
    { id: "b0", kind: "text",      target: [0],    read: { ns: "props",   name: "label" },
      stateDeps: [],                     propDeps: ["label"] },
    { id: "b1", kind: "text",      target: [1],    read: { ns: "derived", name: "formattedTime" },
      stateDeps: ["seconds"],            propDeps: [] },
    { id: "b2", kind: "classPart", target: [1],    read: { ns: "derived", name: "visualState" },
      prefix: "Timer__display--",
      stateDeps: ["running"],            propDeps: [] },
    { id: "b3", kind: "text",      target: [2],    read: { ns: "derived", name: "statusLabel" },
      stateDeps: ["running", "seconds"], propDeps: ["idleText"] },
    { id: "b4", kind: "bool",      target: [3, 0], attr: "disabled",
      read: { ns: "state",   name: "running" },
      stateDeps: ["running"],            propDeps: [] },
    { id: "b5", kind: "bool",      target: [3, 1], attr: "disabled",
      read: { ns: "derived", name: "stopped" },
      stateDeps: ["running"],            propDeps: [] },
    { id: "b6", kind: "if",        target: [4],    read: { ns: "derived", name: "atLimit" },
      stateDeps: ["seconds"],            propDeps: ["limitSeconds"] }
  ]
};

export const events = {
  e0: { target: [3, 0], type: "click", action: "Start", payload: null, modifiers: [] },
  e1: { target: [3, 1], type: "click", action: "Stop",  payload: null, modifiers: [] },
  e2: { target: [3, 2], type: "click", action: "Reset", payload: null, modifiers: [] }
};

export const styles = {
  scopeToken: "Timer",
  href: "./Timer.css",
  rules: [ /* … selector + minBox records … */ ]
};

export const accessibility = { /* … A11yModel … */ };

export const metadata = {
  obixVersion: "1.0.0",
  draft: "0.2.1",
  source: "src/Timer.obix",
  compiledAt: "2026-08-28T00:00:00Z",
  checksum: "sha256-…",
  actionModel: "immutable",
  actionSignature: "(state, payload, props)",
  runtimeMode: "bare"
};

export function render(state = initialState, componentProps = props) { /* generated */ }
export const renderToString = render;

export const TimerDOP = createDOP({
  name: "Timer",
  initialState, props, actions, derived, validation, effects,
  render, template, events, styles, accessibility, metadata,
  decls: { derived: DERIVED_DEPS, actions: ACTION_DECLS }
});

export default TimerDOP;
```

**Nothing in this module is functional, object-oriented, or reactive.** It is data plus pure functions. `ACTION_DECLS.Tick.propDeps` is new in 0.2.1 — the compiler records which props each action reads, by the same destructuring/member analysis used for derived values, so a prop change can be traced to the actions it affects.

---

## 10. Executed proof — `Start → Tick → Tick → Stop` through all four adapters

Not asserted — **run**. The artifact from §9 (with `limitSeconds: 5` for the limit case), the four adapters from [DOP] §14–17 with the corrected signature, executed on Node with no dependencies:

```
=== Adapter Equivalence: Start -> Tick -> Tick -> Stop ===
data                 {"seconds":2,"running":false}
functional           {"seconds":2,"running":false}
functional.create    {"seconds":2,"running":false}
oop                  {"seconds":2,"running":false}
reactive             {"seconds":2,"running":false}
all equivalent      : true
expected            : {"seconds":2,"running":false}
matches expectation : true

render equivalent   : true
validation equal    : true
step-wise equivalent: true

=== limitSeconds = 5 enforced through props (correction 4) ===
after Start + 8 Tick: {"seconds":5,"running":true}
atLimit             : true
validation          : {"valid":true,"violations":[]}
render tail         : ng</p><p class="Timer__hint">Maximum duration reached.</p>
oop / reactive / fn : {"seconds":5,"running":true} {"seconds":5,"running":true} {"seconds":5,"running":true}

=== payload (single value) ===
SetLabelSeconds(42) : {"seconds":42,"running":false}
```

Five results because the functional projection is checked twice — pure namespace (`replay`) and closure instance (`create().dispatch`) — since [DOP] §15 specifies both and they must not diverge from each other either.

**What the run establishes:**

| Claim | Evidence |
|---|---|
| Final state identical across Data, Functional (×2), OOP, Reactive | `all equivalent : true` |
| Matches the mandated expectation | `{"seconds":2,"running":false}` |
| Equivalence holds after **every step**, not just at the end | `step-wise equivalent: true` |
| `render` output identical across projections | `render equivalent : true` |
| Validation reports identical across projections | `validation equal : true` |
| Correction 4 works: props reach actions and the limit binds | 8 Ticks → `seconds: 5`, not 8 |
| The limit holds in every projection, not just Data | all three report `{"seconds":5,"running":true}` |
| At the limit the component is consistent | `atLimit: true`, hint rendered, **zero validation violations** |
| Single-value payload path works | `SetLabelSeconds(42)` → `{"seconds":42,…}` |

The validation line is the one worth pausing on. Before correction 4, `Start` + 8 `Tick` produced `seconds: 8` against `limitSeconds: 5`, which would have tripped the component's own `NeverPastLimit` rule — a component violating a contract it declared in the same file. After the fix, `valid: true`. The specification is now internally consistent, and that consistency is demonstrated rather than claimed.

---

## B. Revised affected sections

Replacement text for the rules that change. Everything not listed is unchanged.

### B.1 [DOP] §8.2 — J20 (action signature)

> **J20 — Signature:** `ActionName(state, payload, props) → newState`.
> `state` is the current state (frozen, first). `payload` is a single value or `undefined` (second). `props` is the component's frozen props (third, read-only).
> Parameters may be omitted from the right: `Start(state)` and `SetLabel(state, label)` are both valid. Use `_payload` when only props are needed.
> **State first, props last, payload between them when present** — the same rule that governs `derived(state, props)` and `validation.rules[].when(state, props)`, which have no payload slot.

### B.2 [DOP] §8.3 — purity lint, one row added

| Check | Code | Level |
|---|---|---|
| Assignment to the `props` parameter or its members | `OBIX-J039` | error |

### B.3 [DOP] §12.2 / §13 — the event pipeline

```
native DOM event
      ↓  event adapter — normalise to a serializable payload
   payload            (1 arg → value;  2–4 args → object keyed by name, AM-4.6)
      ↓  dispatch(actionName, payload)
   dop.actions.Name(currentState, payload, props)
      ↓
   nextState
      ↓  Object.is short-circuit
   changed keys → dirty bindings → DOM writes → subscribers notified
```

**E1 (revised).** `on:click="Start"` compiles to `dispatch("Start")`, calling `actions.Start(state, undefined, props)`. There is still no implicit event payload. **Props are always supplied by the projection** — they are the component's own configuration, not event data, and never travel through the template.

### B.4 [DOP] §15–17 — adapter deltas

Structure unchanged; the call into `dop.actions` and props threading change.

```js
// §15 functional
const reduce = (state, actionName, payload, props = dop.props) => {
  const action = dop.actions[actionName];
  if (!action) throw new TypeError(`[OBIX] unknown action "${actionName}" on ${dop.name}`);
  return action(state, payload, props);
};
// create(): dispatch(actionName, payload) { current = reduce(current, actionName, payload, props);
//                                           return current; }

// §16 OOP
dispatch(actionName, payload) {
  const action = dop.actions[actionName];
  if (!action) throw new TypeError(`[OBIX] unknown action "${actionName}" on ${dop.name}`);
  this.#state = action(this.#state, payload, this.#props);
  return this.#state;
}
// generated methods:  Start(payload) { return this.dispatch("Start", payload); }

// §17 reactive
const next = action(prev, payload, props);
// meta becomes { action, payload, changedKeys }
```

**AM-B.1.** `toData()` alone does not thread props — the caller passes all three arguments explicitly. It is the identity projection and must carry no hidden context (AM-2.1).

### B.5 [DOP] §22 — test DSL

```ebnf
DispatchStatement = "dispatch", ActionName, [ "(", PayloadLiteral, ")" ] ;
PayloadLiteral    = Literal | ObjectLiteral | ArrayLiteral ;
```

A single payload, matching AM-4.5. `given props { … }` now materially affects action results and is part of the equivalence fixture (AM-3.2). New Timer cases:

```
test LimitIsEnforcedThroughProps {
    given props { limitSeconds: 5 }
    dispatch Start
    advance 8000ms
    expect state.seconds is 5
    expect derived.atLimit is true
    expect validation.valid is true
}

test TickAtLimitIsIdentity {
    given props { limitSeconds: 5 }
    given state { seconds: 5, running: true }
    dispatch Tick
    expect transitions is 0
}
```

### B.6 [DOP] §23 — conformance contract

```
dop {
    action Tick arity 3 reads props [limitSeconds]
    effect tick every 1000 dispatches Tick
}

equivalence {
    adapters [data, functional, oop, reactive]
    props { limitSeconds: 5 }
    trace [Start, Tick, Tick, Stop] expect state { seconds: 2, running: false }
    generate traces depth 3
    expect state equivalent after every step
}

invariant LimitIsBinding {
    given props { limitSeconds: 5 }
    for any state: expect state.seconds is less than 6
}
```

`reads props [...]` is a contract assertion over `ACTION_DECLS[].propDeps`: an action silently gaining or losing a prop dependency is surface drift and fails `obixc verify` (`OBIX-C002`).

### B.7 [DOP] §32 — legacy shim

```js
actions[Pascal] = (state, payload, props) => {
  const ctx = { state: clone(state), props: Object.freeze(props) };   // ctx.props added
  for (const sibling of Object.keys(logic.actions)) {
    ctx[sibling] = (...a) => logic.actions[sibling](ctx, ...a);
  }
  const returned = fn(ctx, payload);
  return Object.freeze(returned && typeof returned === "object" ? returned : ctx.state);
};
```

**AM-B.2.** Legacy actions gain read-only `ctx.props`; those that ignore it behave exactly as before. `ButtonLogic.js` still runs unmodified — verified in [DOP] §32.2 and unaffected by this change, since its `toggle` reads only `ctx.state`.

### B.8 Diagnostics added or changed in 0.2.1

| Code | Meaning | Level |
|---|---|---|
| `OBIX-J038` | payload passed to an action that declares none | advisory |
| `OBIX-J039` | assignment to the `props` parameter | error |
| `OBIX-T095` | duplicate derived key in a multi-argument payload | error |
| `OBIX-T096` | bare literal in a multi-argument binding (no name to key on) | error |
| `OBIX-T003` | implied element required explicitly (e.g. `<tbody>`) | error |
| `OBIX-T004` | unquoted attribute value | error |
| `OBIX-T005` | uppercase attribute name outside SVG/MathML | error |
| `OBIX-T006` | bare `<` in template text | error |
| `OBIX-T007` | unsupported named character reference | error |
| `OBIX-T008` | duplicate attribute | error |
| `OBIX-T009` | mismatched closing tag | error |
| `OBIX-T010` | self-closing syntax on a non-void native element | error |
| `OBIX-F016` | expected a section opening tag | error |
| `OBIX-F017` | malformed section attributes | error |
| `OBIX-F018` | literal `</template>` in template text | error |
| `OBIX-C002` | action prop-dependency drift vs contract | error |
| `OBIX-C010` | equivalence block runs projections under differing props | error |
| `OBIX-P001` | post-IR emitter contains transition logic | error |
| *removed* | ~~column-0 section rule~~ | — |

---

## C. Freeze scope — what the first compiler must and must not do

The review's sixth point: freeze the DOP contract before the large surface. This scopes the first executable milestone. It removes surface; it adds nothing.

### C.1 Level 0 — the vertical slice to be frozen and built

```
Timer.obix
     ↓  sections (AM-6.2)
     ↓  AST
     ↓  DOP IR
     ↓  ES6
     ↓  Data / Functional / OOP / Reactive equivalence     ← first acceptance test
     ↓  native mount
```

| In Level 0 | Out of Level 0 |
|---|---|
| three sections, whitespace-tolerant scanner | `obix:if`, `obix:else-if`, `obix:else` |
| text and attribute interpolation (`{path}`) | `obix:for`, `obix:key` |
| boolean and ARIA attribute rules (T10/T11) | slots |
| `on:` events, single payload, four modifiers | component composition and imports |
| `props`, `state`, `actions`, `derived` | `validation` enforcement (descriptor parsed, not enforced) |
| `effects` — `every` only | `after`, `on`, hydration, SSR |
| scoped CSS via `data-obix~=` | `lang="scss"`, `type="module"` |
| all four adapters + equivalence | `.obix.test` conformance runner |
| `.test.obix` Layers 0–2 | accessibility compiler pass (diagnostics deferred to Level 1) |
| `--runtime=linked` and `--runtime=bare` | `--runtime=inline` |

**AM-C.1 — The acceptance test for Level 0 is Adapter Equivalence on `Timer.obix`**, not a rendered pixel. If `Start → Tick → Tick → Stop` yields `{ seconds: 2, running: false }` through all four projections from a compiled `.obix` file, Level 0 is complete.

**AM-C.2 — The three golden fixtures freeze at Level 0**: `Timer.obix`, `Timer.test.obix`, `Timer.obix.test`. Grammar changes after the freeze require an amendment, not an edit.

**AM-C.3 — Everything in the Out column is already specified** in [DOP] and stays specified. Deferring implementation is not deferring design; the point is that the grammar for those features is settled and can wait for a parser that already works end to end.

### C.2 Level 1 and beyond (order of addition)

1. `obix:if` / `obix:else-if` / `obix:else`
2. `obix:for` + keyed reconciliation
3. accessibility compiler pass + `.obix.test` runner
4. component composition, imports, slots
5. remaining effect kinds, hydration, SSR
6. `--runtime=inline`, `lang="scss"`
7. legacy `fromLegacy` shim and the 30-component migration
8. OBIXverse (app suites, reverse-domain identity, Gradle)

---

## D. Migration tables

### D.1 Draft 0.1 (Kimi) → Draft 0.2.1

| Draft 0.1 construct | Draft 0.2.1 construct |
|---|---|
| `component Timer { … }` | filename `Timer.obix` — identity from the path, no declaration |
| `state { seconds: 0 }` | `<script> const state = { seconds: 0 };` |
| `action Start { … }` | `<script> const actions = { Start(state, payload, props) { … } };` |
| `view { … }` | `<template> … </template>` |
| *(styles unspecified)* | `<style lang="css" type="scoped"> … </style>` |
| *(derived unspecified)* | `<script> const derived = { … };` with destructured dependencies |
| `Timer.test.obix` behavioural tests | **kept**, extended with Layer 1 generated adapter-equivalence |
| `Timer.obix.test` conformance tests | **kept**, extended with `dop {}`, `equivalence {}`, `serialization {}`, `determinism {}` |
| serializable state | **kept unchanged** |
| pure transitions | **kept**, formalised as Model B with a legacy compatibility shim |
| deterministic rendering | **kept**, formalised as `render(state, props) → string` |
| accessibility as a contract | **kept**, promoted to a compile-time pass plus accessibility-tree selection in contracts |
| native browser events | **kept**, formalised as the `on:` family with a closed accessor table |
| ES6-native output, no VDOM, no runtime Node | **kept**, claim made precise in §5 |
| *(no IR)* | **canonical DOP IR** between AST and every target |
| *(two adapters, in the prototype only)* | **five projections** with a proven equivalence invariant |

### D.2 Draft 0.2 → Draft 0.2.1

| Draft 0.2 | Draft 0.2.1 | Reason |
|---|---|---|
| `Action(state, ...args)` | `Action(state, payload, props)` | props unreachable from effect-dispatched actions; `limitSeconds` was unenforceable |
| up to 4 positional args | 1 arg → value; 2–4 → object keyed by name | one payload slot |
| `effects: { tick: { args: [...] } }` | `payload:` optional; props automatic | AM-4.8 |
| "no framework runtime beneath it" | "no virtual-DOM/framework runtime; a ≤4 KB binding runtime is permitted" + `--runtime=inline` | claim contradicted the generated imports |
| section tags at column 0 | leading whitespace legal at top level | indentation is not syntax |
| "HTML tokenisation rules" | "semantic HTML vocabulary + strict OBIX grammar" | prose and EBNF disagreed |
| pipeline implied SSR | SSR listed as a peer codegen target | make the shared descriptor explicit |
| equivalence over `(s₀, T)` | equivalence over `(s₀, p, T)` | actions now read props |
| *(none)* | `ACTION_DECLS[].propDeps` in the IR | trace a prop change to affected actions |

---

## E. Unresolved questions — updated

Carried forward from [DOP] §33 with three additions and one closure.

**Closed by this amendment:** the action/props question (was implicit in Q1's neighbourhood) is now settled by AM-4.

**Q12 — Should multi-argument payload keys be author-controlled?** AM-4.6 derives keys from accessor names and final path segments. A named-argument syntax (`Place(x: event.x, y: event.y)`) would be explicit but is new surface. **Blocking:** whether the derived-key rule produces a confusing key in real use. Deliberately not added here.

**Q13 — Should `propDeps` drive prop-change granularity?** The compiler now records which props each action reads. That could, in principle, let a projection skip re-validation or re-derivation when an unrelated prop changes. **Blocking:** measurement — prop updates are rare enough that this may never pay.

**Q14 — Does `--runtime=inline` need a shared-chunk mode?** Inline duplicates ~1 KB per component; a page with 30 inline components pays 30×. An intermediate mode emitting one inlined runtime chunk plus thin components is possible but is a bundler concern, not a language concern. **Blocking:** whether anyone ships more than a handful of inline components on one page.

Unchanged and still open: Q1 (child→parent semantic events), Q2 (async data), Q3 (prop spreading), Q4 (`type="module"` styles), Q5 (two-way binding sugar), Q6 (nested state granularity), Q7 (equivalence under effects), Q8 (fifth paradigm adapters), Q9 (contract inheritance), Q10 (legacy interop, reverse direction), Q11 (cross-language DOP artifacts).

---

## F. Recommendation

**Freeze the grammar at Draft 0.2.1**, with these caveats:

1. The four corrections in this amendment (§4–7) are the ones that would have caused real problems. Corrections 1–3 and 8–10 confirm work already done and cost nothing to restate.
2. **Do not implement beyond Level 0** (§C.1). The specified surface is large; the buildable surface should not be.
3. **Adapter Equivalence is the first acceptance test.** It is executable today against a hand-written artifact (§10) — which means the compiler has a passing target before a single line of parser exists.
4. Archive Draft 0.1 at `docs/spec/archive/OBIX_1.0_TDD_SYNTAX_DRAFT_0.1.md`. Its decisions on test artifact naming, accessibility-as-contract, and behavioural-versus-conformance separation survive intact into 0.2.1 and deserve the provenance.

---

*Amendment only. No new features. No compiler implementation.*

**OBINexus Computing — Nnamdi Michael Okpala — 28 August 2026**
