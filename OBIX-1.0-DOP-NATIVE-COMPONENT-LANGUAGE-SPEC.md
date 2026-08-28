# OBIX 1.0 — DOP-Native Component Language Specification

**The Heart and Soul UI/UX Language**

| Field | Value |
|---|---|
| Document | OBIX 1.0 DOP-Native Component Language Specification |
| Status | Proposal — language design, pre-implementation |
| Date | 28 August 2026 |
| Author | OBINexus Computing — Nnamdi Michael Okpala |
| Companion | *OBIX 1.0 Native Component Syntax Proposal* (28 August 2026) — surface syntax |
| This document adds | The canonical DOP intermediate representation and the adapter layer between `.obix` source and every consuming paradigm |
| Grounded in | `DOPAdapter.js`, `ButtonLogic.js`, `renderFunc.js`, `renderOOP.js`, `main.js` (DOP Adapter prototype, v1.0.0) |

---

## 0. Grounding — what the prototype proved, and what it left open

The existing prototype is small and it is right about the thing that matters. `ButtonLogic.js` declares a component as data:

```js
{
  name: "Button",
  state: { clicked: false },
  actions: { toggle: (ctx) => { ctx.state.clicked = !ctx.state.clicked; } },
  render: (ctx) => `<button>${ctx.state.clicked ? "ON" : "OFF"}</button>`
}
```

`DOPAdapter.js` then derives two programming interfaces from that one declaration. No second `Button` is written. That architecture — **one declaration, many projections** — is the load-bearing insight of OBIX and this specification generalises it rather than replacing it.

### 0.1 What running the prototype actually shows

Executed as shipped (`node main.js`):

```
[Functional Render]: <button>OFF</button>
[OOP Render]: <button>OFF</button>
```

Probing further:

| Probe | Result |
|---|---|
| `new OOPComponent().toggle()` then `.render()` | `<button>ON</button>` — the OOP projection is fully operable |
| Two OOP instances, toggle one | `{clicked:true}` / `{clicked:false}` — correctly isolated |
| Source `logic.state` after toggling | `{clicked:false}` — the declaration is not corrupted |
| `toFunctional()()` called twice | `<button>OFF</button>` both times |
| Return type of `toFunctional()()` | `string` — no state handle, no dispatch |

**This is the finding the specification is built to fix.** The two adapters are not equivalent. The OOP projection exposes a live component; the functional projection exposes a one-shot string. A consumer choosing "functional" gets strictly less capability than a consumer choosing "OOP", which contradicts the whole premise that paradigm choice is a consumer preference and not an architectural fork. `README.md` records this honestly under Future Work — *"Implement interaction to actually toggle state"*.

The root cause is that the prototype has no formal statement of what the two projections must agree on. OBIX 1.0 supplies that statement and names it **Adapter Equivalence** (§18).

### 0.2 The second finding: mutation leaks into the adapter contract

`toOOP()` binds actions as `actions[key].bind(null, this)`, so `ctx` *is* the instance. `toFunctional()` builds `ctx = { state: currentState, ...actions }`, so `ctx` is a fresh object. The action body — `ctx.state.clicked = !ctx.state.clicked` — happens to work under both, but only because both context shapes expose `.state`. The adapters are therefore **coupled to mutation semantics**: each has to construct a context that the action can mutate, and each must know the mutation convention.

Under an immutable model the adapters need to know nothing about action bodies at all. They call `actions.Toggle(state)` and store what comes back. That is the difference between an adapter that translates and an adapter that participates in the component's behaviour, and it is why §8 makes the immutable model canonical while §32 keeps the old one working.

### 0.3 The architectural rule this document specifies

```
    Timer.obix
        │  parse
        ▼
    OBIX AST
        │  semantic lowering
        ▼
    DOP IR              ← canonical. paradigm-free. DOM-free.
        │
        ▼
    DOPAdapter
   ╱    │    │    ╲
Data Functional OOP Reactive          ← projections, not implementations
   ╲    │    │    ╱
        ▼
   toNative()
        │
        ▼
Native browser DOM (ES modules · addEventListener · CustomEvent · CSS)
```

**Data first. Paradigm second.** A component does not become functional, object-oriented, or reactive until after its DOP representation exists. There is one `Timer`. There are several ways to consume it.

The architecture is deliberately **shallow** (§27 of the mandate): DOP IR → adapter → consumer. The adapter is a translation layer, not a framework, and nothing sits between the adapter and the DOM except the binding table the compiler already computed.

---

## 1. `.obix` single-file component structure

### 1.1 The three sections

```html
<style lang="css" type="scoped">
    /* presentation — independent of paradigm */
</style>

<template>
    <!-- semantic projection of DOP state + derived -->
</template>

<script>
    // DOP declarations: props, state, actions, derived, validation, effects
</script>
```

Each section maps onto one native web primitive and one DOP concern:

| Section | Native | DOP concern | Enters the IR as |
|---|---|---|---|
| `<style>` | CSS | presentation | `styles` descriptor |
| `<template>` | HTML/DOM | representation | `template` + `events` + `accessibility` descriptors |
| `<script>` | ES module | data + behaviour | `initialState`, `actions`, `derived`, `validation`, `effects` |

The paradigm is **not** in the file. It is chosen by the consumer at adapter time. This is the concrete expression of the separation the mandate requires: data, behaviour, representation, and paradigm are four different things and only the first three live in `.obix`.

### 1.2 Section rules

**Rule S1 — Order is fixed:** `style`, `template`, `script`. (`OBIX-F010`.) A single forward-pass scanner with no backtracking; stable diffs; one shape to memorise.

**Rule S2 — Multiplicity:** `<style>` 0..n (a scoped block plus a global block is the common case); `<template>` exactly 1 (`OBIX-F011` / `OBIX-F012`); `<script>` 0..1 (`OBIX-F013`).

**Rule S3 — Top level only.** The scanner recognises section tags at depth 0. Nesting is not analysed.

**Rule S4 — Literal closing tags required:** `</style>`, `</template>`, `</script>`. Unclosed at EOF is `OBIX-F014`. Inside `<script>`, the byte sequence `</script>` terminates the section exactly as in HTML; if it appears inside a string, `OBIX-J037` advises `<\/script>`.

**Rule S5 — Attributes:** `lang` and `type` on `<style>` and `<script>`; none on `<template>` (`OBIX-F015`).

### 1.3 `lang` and `type`, defined once for both sections

- **`lang`** — the *language the section body is written in*. A build-time input dialect. Changing it changes which parser or preprocessor reads the body.
- **`type`** — the *kind of section this is*. A compile mode. Changing it changes what the compiler does with the parsed result.

MIME-shaped values (`text/css`, `text/javascript`, `module`) are rejected — `OBIX-S002` / `OBIX-J002` — with a message pointing at `lang`.

---

## 2. Filename rules

**Rule F1 — The filename is the component identity.** `Timer.obix` defines `Timer`. There is no `component Timer` declaration inside the file.

The mandate asks for a strong semantic reason before requiring a duplicate declaration. There isn't one. The path is already load-bearing — imports name it, the module resolver uses it, the CSS scope token derives from it, the DOP IR's `name` field derives from it, DevTools shows it. A second declaration would create the possibility of disagreeing with the first, and a class of bug that cannot occur if the declaration does not exist.

**Rule F2 — Stem must match `[A-Z][A-Za-z0-9]*`** with at least one lowercase letter, or be a single letter.

| Valid | Invalid | Code |
|---|---|---|
| `Timer.obix` | `timer.obix` | `OBIX-F001` |
| `LoginForm.obix` | `login-form.obix` | `OBIX-F002` |
| `WorldClock.obix` | `login_form.obix` | `OBIX-F002` |
| `A11yButton.obix` | `TIMER.obix` | `OBIX-F003` |

**Rule F3 — PascalCase is the disambiguation strategy.** A capitalised tag in a template can never collide with a native HTML element (lowercase by convention) or a custom element (hyphen required). `<Timer />` is unambiguously a component reference after one character of lookahead. This is why F2 is enforced rather than advisory.

**Rule F4 — Artifact family.**

| File | Kind | Purpose |
|---|---|---|
| `Timer.obix` | component | implementation |
| `Timer.test.obix` | behavioural specification | drives development; DOP-first; may be red during TDD |
| `Timer.obix.test` | conformance contract | gates publication; must pass to ship |

Mnemonic: **`.test.obix` is an OBIX file that tests**; **`.obix.test` is a test of an OBIX artifact**.

---

## 3. Style grammar

### 3.1 Form

```html
<style lang="css" type="scoped">
    .Timer {
        display: grid;
        gap: 1rem;
    }
</style>
```

`<style>` with no attributes is exactly `<style lang="css" type="scoped">`. **CSS is canonical and default. Scoped is default.** A developer who writes plain CSS and never learns either attribute gets correct behaviour.

### 3.2 `lang`

| Value | Meaning |
|---|---|
| `css` | **Default.** Native CSS, passed through, scoping applied. |
| `scss` | Compiled by an external adapter *before* scoping. |

**Rule S10.** Preprocessors are build-time adapters registered with the compiler, never part of the runtime. `obixc` ships knowing `css` and nothing else; a project with no SCSS adapter compiles every `lang="css"` file and fails only on files that ask for SCSS (`OBIX-S010`). Unknown `lang` is `OBIX-S001`, never a silent pass-through.

### 3.3 `type`

| Value | Status | Meaning |
|---|---|---|
| `scoped` | **default, shipping** | Selectors rewritten to match only elements owned by this component. |
| `global` | shipping | Emitted unchanged into the application stylesheet. |
| `module` | reserved, `OBIX-S003` | Hashed class names exposed as an importable map. |

`module` is reserved rather than shipped because attribute scoping already solves collision. Implementing it would add a fifth binding namespace (`styles.foo`) and a class-binding directive to solve a problem `scoped` has solved. Reserved so the keyword cannot be squatted; reopened only against a concrete failing case (§33, Q4).

**Rule S20.** At most one `scoped` and one `global` block per file (`OBIX-S004`).

**Rule S21.** `@keyframes`, `@font-face`, `@property`, `:root` inside a scoped block hoist to global with **name prefixing** (`spin` → `Timer-spin`) and intra-component references rewritten. Cross-component reference to a scoped keyframe is `OBIX-S021`.

### 3.4 Scoping mechanism

**Rule S30.** Every element originating in the component's own template carries `data-obix="<Token>"`, a **space-separated token list**. Selectors are rewritten with the `~=` attribute operator, appended to the **last compound selector**, after pseudo-classes and before pseudo-elements:

| Source | Output |
|---|---|
| `.Timer` | `.Timer[data-obix~="Timer"]` |
| `.Timer .Timer__button` | `.Timer .Timer__button[data-obix~="Timer"]` |
| `.Timer__button:hover` | `.Timer__button[data-obix~="Timer"]:hover` |
| `.Timer__display::after` | `.Timer__display[data-obix~="Timer"]::after` |
| `:global(.app-dark) .Timer` | `.app-dark .Timer[data-obix~="Timer"]` |

**Rule S31 — Child roots carry both tokens.** When `Timer` renders `<ClockDisplay />`, the child root gets `data-obix="ClockDisplay Timer"`. The child owns its internals; the parent may position the child's root. This is what `~=` buys and it removes the need for any deep-selector escape hatch.

**Rule S32 — Readable by default.** The token is the plain component name. Only when a build contains two same-named components from different paths do *both* receive a 4-character path-derived suffix (`Timer-a3f1`), with `OBIX-S030` naming both files. DevTools output stays legible.

**Rule S33 — Paradigm independence.** The stylesheet is emitted from the `styles` descriptor in the DOP IR and is byte-identical regardless of which adapter the consumer chooses. Switching functional → OOP cannot alter one character of CSS. This is a testable conformance assertion (§23).

No Shadow DOM is required or used.

---

## 4. Template grammar

### 4.1 The template is a projection, not state

```
DOP state  +  derived  +  props
                ↓
           template descriptor
                ↓
              DOM
```

The template holds no data of its own. It is a declarative description of how DOP data is represented. It compiles to a **descriptor in the IR** (nodes, bindings, events) — data, not code — from which both the DOM binder and the string renderer are generated.

### 4.2 What the parser distinguishes

Five constructs, and nothing else has meaning:

| Construct | Written as | Recognised by |
|---|---|---|
| Literal HTML element | `<section class="Timer">` | lowercase tag |
| Component reference | `<ClockDisplay />` | uppercase tag |
| Interpolation | `{formattedTime}` | `{` in text or attribute value |
| Event binding | `on:click="Start"` | attribute begins `on:` |
| Structural directive | `obix:if="running"` | attribute begins `obix:` |

Everything else is literal markup copied through verbatim.

### 4.3 The two prefixes

`on:` names something the **browser** already has (an event type for `addEventListener`). `obix:` names something only **OBIX** has (control flow). Reserved `obix:` attributes in 1.0 — no others permitted (`OBIX-T001`):

```
obix:if   obix:else-if   obix:else   obix:for   obix:key   obix:slot
```

### 4.4 Structure rules

**T1.** Multiple root nodes permitted; the compiler tracks a node list.
**T2.** Whitespace collapsed per HTML rules; preserved in `<pre>`, `<textarea>`.
**T3.** Void elements may be `<img>` or `<img />`; non-void elements require closing tags (`OBIX-T002`); component references may self-close.
**T4.** HTML comments stripped by default, kept with `--keep-comments`; never contain bindings.

### 4.5 Attributes

Four forms, no fifth:

```html
<button type="button">                                   <!-- literal -->
<div class="Timer__display Timer__display--{visualState}"><!-- mixed -->
<button disabled="{running}">                            <!-- boolean binding -->
<button on:click="Start" obix:if="ready">                <!-- directive -->
```

**T10 — Boolean attributes.** For HTML's boolean-attribute set (`disabled`, `checked`, `readonly`, `required`, `hidden`, `open`, `selected`, `multiple`, `autofocus`, `novalidate`, `inert`, `loop`, `muted`, `controls`, `playsinline`, `reversed`, `formnovalidate`, `allowfullscreen`, …), a whole-value binding means presence/absence. It never writes the string `"false"`. Binding a non-boolean is `OBIX-T011`.

**T11 — ARIA state attributes are string-valued.** `aria-expanded`, `aria-checked`, `aria-invalid`, `aria-pressed`, `aria-hidden`, `aria-busy`, `aria-selected`, `aria-disabled` require literal `"true"`/`"false"` in the DOM:

```html
<button aria-expanded="{open}">   <!-- open === false → aria-expanded="false" -->
<button disabled="{open}">        <!-- open === false → attribute removed -->
```

The compiler resolving this asymmetry by attribute name is one of the concrete arguments for the language existing; it is a common hand-written accessibility bug.

**T12.** A non-boolean attribute bound to `null`/`undefined` is removed; empty string renders `attr=""`.

**T13.** Attribute *names* are always literal (`OBIX-T012`). Prop spreading is not supported in 1.0 (§33, Q3).

### 4.6 Interpolation

```
{path}
```

A single pair of braces around a **path expression**. No calls, no operators, no ternaries, no template literals.

```html
{seconds}                 <!-- ok -->
{formattedTime}           <!-- ok — a derived value -->
{state.seconds}           <!-- ok — explicitly qualified -->
{alarm.label}             <!-- ok — loop variable member -->

{seconds + 1}             <!-- OBIX-T020 -->
{formattedTime(state)}    <!-- OBIX-T021 -->
{running ? "on" : "off"}  <!-- OBIX-T022 -->
```

`\{` and `\}` escape a literal brace.

**T33 — Always text-safe.** Interpolated values are written with `textContent` / `setAttribute`, never `innerHTML`, and HTML-escaped in the string renderer. There is no raw-HTML directive in 1.0. XSS through interpolation is structurally impossible.

### 4.7 Conditionals

```html
<p obix:if="error">{error}</p>
<p obix:else-if="warning">{warning}</p>
<p obix:else>All good.</p>
```

**T40.** `obix:else-if` / `obix:else` must immediately follow (ignoring whitespace/comments) an `obix:if` / `obix:else-if` sibling (`OBIX-T040`).
**T41.** `obix:else` takes no value (`OBIX-T041`).
**T42.** Truthiness is JavaScript truthiness — the host language's rule, not a second rule to memorise. For "is this list empty", declare a derived boolean.
**T43.** No `!` in templates. Declare the polarity you mean in `derived`. One line in the script buys a template that never needs an expression parser.
**T44.** Compiles to a comment anchor (`<!--obix:if Timer#b6-->`) plus a controller that creates/removes the branch subtree. Only the taken branch is instantiated — the defect recorded as Bottleneck #2.1 in `BOTTLENECK_ANALYSIS.md`.
**T45.** `obix:if` on a component reference mounts/unmounts the child, driving the `CREATED → UPDATED → HALTED → DESTROYED` lifecycle.

### 4.8 Iteration

```html
<li obix:for="alarm of alarms" obix:key="alarm.id">
  {alarm.label}
</li>
```

With index: `obix:for="alarm, index of alarms"`.

**T50.** Keyword is `of`, matching ES6 `for…of`. `in` is rejected (`OBIX-T050`) because `for…in` means something else in JavaScript.
**T51.** `obix:key` is **required** on every `obix:for` (`OBIX-T051`). Stricter than most frameworks and deliberately so: an unkeyed list loses focus and misapplies ARIA state on reorder, which is a FUD violation, not a performance nit.
**T52.** Duplicate keys: runtime error in dev builds, diagnostic in production builds.
**T53.** Nested loops nest scopes; shadowing is `OBIX-T031`.
**T54.** Compiles to a keyed node map with list-local reconciliation — create, move via `insertBefore` on existing nodes, update in place, remove. Nodes are moved, never rebuilt, so focus and CSS transitions survive.
**T55.** `obix:for` and `obix:if` on the same element is `OBIX-T055`. Wrap one in the other rather than inventing a precedence rule.

### 4.9 Composition and slots

**T60.** PascalCase tags require an explicit ES import (`OBIX-T060`). No global registry — registries make templates unreadable without knowing registration order and break tree-shaking.
**T61.** Specifier must end `.obix` (`OBIX-T061`).
**T62.** The local binding name is the tag name; renaming on import works exactly as in JavaScript.
**T70.** Props must be declared in the child's `props` (`OBIX-T070`), checked at compile time when both files are in the compilation unit. Static prop validation, zero runtime cost, no type system required.
**T71.** Props are read-only in the child.
**T72.** A parent state change that alters a bound prop updates the child's prop and refreshes only the dependent child bindings. The child is not recreated.
**T74.** `on:` on a component tag attaches to the child's root element; native events bubble. Multi-root children make this `OBIX-T075`.
**T80.** **Slot content is owned by the parent** — compiled in the parent's binding namespace, carrying the parent's scope token, dispatching parent actions. The child chooses *where*; the parent owns *what*. One ownership rule, no ambiguity.
**T81.** One default slot, any number of named slots (`OBIX-T081` / `OBIX-T082`).
**T82.** `<slot>` fallback content is owned by the child.

---

## 5. Script grammar

### 5.1 Form

```html
<script lang="js" type="component">
  // imports
  const props      = { … };
  const state      = { … };
  const actions    = { … };
  const derived    = { … };
  const validation = { … };
  const effects    = { … };
  // module-private helpers
</script>
```

| Attribute | Values | Meaning |
|---|---|---|
| `lang` | `js` (default), `ts` | Source dialect. TypeScript types are erased and never required. |
| `type` | `component` (default), `test` | `test` is legal only in `.test.obix`. |

### 5.2 Ordinary ES6 declarations, or OBIX-specific syntax? — the decision

The mandate asks whether `const state` / `const actions` / `const derived` should be ordinary ES6 declarations with special OBIX meaning, or OBIX-specific constructs, and asks for minimal language invention.

**Decision: ordinary ES6 declarations, recognised by name.** Reasons, in order of weight:

1. **OBIX must not own a JavaScript parser.** With ES6 declarations the script body is handed to any standards-compliant ES parser and OBIX walks the resulting ESTree looking for six top-level bindings. A bespoke `state { … }` / `action Start(state) { … }` syntax makes every future JavaScript feature an OBIX maintenance burden.
2. **Every existing tool keeps working** — Prettier, ESLint, editor highlighting, the TypeScript language service, source maps, `node --inspect` — because the section *is* JavaScript.
3. **The prototype is already written this way.** `ButtonLogic.js` is a plain object literal with `state`, `actions`, `render`. Adopting bespoke syntax would break the continuity this specification is required to preserve. `.obix` script sections and hand-written DOP modules stay mutually intelligible.
4. **The declarative shorthand pays where the content is genuinely not JavaScript** — in `effects` (§8.6), `validation` (§10), and the test DSL (§20/§22). Inventing syntax there earns its keep; inventing it for `const state = {}` saves five characters and hides the fact that the result is an ordinary object.

### 5.3 The six recognised bindings

| Name | Required | Shape | IR field |
|---|---|---|---|
| `props` | no | object of defaults | `props` |
| `state` | yes, if the template has state bindings | object literal | `initialState` |
| `actions` | no | object of pure transitions | `actions` |
| `derived` | no | object of pure computations | `derived` |
| `validation` | no | descriptor object | `validation` |
| `effects` | no | descriptor object | `effects` |

Everything else at top level is a **module-private helper**: available to actions, derived values and effects; invisible to the template; not exported.

**J1 — `export` is not written.** The compiler synthesises the module's exports (`OBIX-J010`). The component is the export; one file, one component.
**J2 — Contract bindings must be `const`** (`OBIX-J011`). They are declarations, not variables.
**J3 — Declaration sites must be statically analysable literals** (`OBIX-J012`). `const state = buildState()` is rejected: the compiler needs the key set at build time to construct the binding dependency graph and the IR.

### 5.4 Imports and exports

**J60.** Imports are ordinary ES module imports, emitted unchanged, with `.obix` specifiers rewritten to compiled `.js`.
**J61.** A default import from a `.obix` specifier is a component and becomes a template tag; named imports from `.obix` are `OBIX-J060`.
**J62.** Imports from `.js`/`.ts` are available to actions, derived, effects and helpers — **not** to the template. Templates see only the four binding namespaces (§11).
**J70.** The generated module's default export is the **DOP artifact** (§6), not a framework component. Named exports mirror the IR fields for interop with hand-written DOP modules like `ButtonLogic.js`.

---

## 6. The canonical DOP model

### 6.1 The artifact

```js
ObixDOPComponent = {
  // ---- minimal core (the prototype's triad, preserved) ----
  name,            // string, from the filename stem
  initialState,    // plain serializable object
  actions,         // { [PascalName]: (state, ...args) => state }
  render,          // (state, props) => HTML string   — pure, DOM-free

  // ---- data-oriented extensions ----
  props,           // { [name]: defaultValue }
  derived,         // { [name]: (state, props) => value }
  validation,      // descriptor object (§10)
  effects,         // descriptor object (§8.6)

  // ---- descriptors (pure data, no functions) ----
  template,        // { nodes, bindings, deps }
  events,          // { [bindingId]: { type, action, args, modifiers } }
  styles,          // { scopeToken, css, rules }
  accessibility,   // A11yModel (§19)

  // ---- provenance ----
  metadata         // { obixVersion, source, compiledAt, checksum, actionModel }
};
```

### 6.2 Which fields belong in the IR — and the rule that decides

The mandate asks for this to be determined exactly rather than listed. The determining rule:

> **A field belongs in the DOP IR if and only if it is (a) plain data, or (b) a pure function of `(state, props)`. Nothing in the IR may reference the DOM, a timer handle, a socket, a network client, or a paradigm.**

Applying it:

| Field | In? | Why |
|---|---|---|
| `name` | ✅ | plain data; identity |
| `initialState` | ✅ | plain data; the component's data |
| `actions` | ✅ | pure `(state, …) → state` |
| `derived` | ✅ | pure `(state, props) → value` |
| `render` | ✅ | pure `(state, props) → string`; the prototype's third core member |
| `props` | ✅ | plain data (defaults) |
| `validation` | ✅ | descriptors + pure predicates; a **contract on data**, so it must precede paradigm choice |
| `template` | ✅ | descriptor data; the representation of the data |
| `events` | ✅ | descriptor data — *which action a DOM event maps to*, not the listener itself |
| `styles` | ✅ | descriptor data; presentation |
| `accessibility` | ✅ | descriptor data derived from the template |
| `effects` | ✅ **descriptor only** | the *declaration* (`every: 1000, dispatch: "Tick"`) is data; the timer handle it produces is not, and lives in the adapter |
| `metadata` | ✅ | plain data; provenance and the action-model marker used by §32 compatibility |
| DOM nodes, listeners, timer ids, subscribers, current state | ❌ | mutable runtime handles — they belong to a **projection**, never to the artifact |

**The minimal required core remains `{ state, actions, render }`** — exactly the prototype's shape. Everything else is compiler and runtime metadata arranged around that core, and an adapter that only understands the core can still consume an OBIX 1.0 artifact. This is what makes `ButtonLogic.js` and `Timer.obix` the same kind of thing.

### 6.3 Two halves: serializable and executable

```js
TimerDOP.toJSON()
// → { name, initialState, props, actionNames, derivedNames,
//     validation.descriptors, template, events, styles,
//     accessibility, metadata }
```

The **descriptor half** is fully JSON-serializable. The **executable half** (`actions`, `derived`, `render`, validation predicates, effect predicates) is JavaScript functions.

This split is not decoration. The descriptor half can cross a language boundary — it is the surface a polyglot binding, a telemetry collector, a design tool, or a static analyser consumes without executing anything. It is also what makes the conformance contract (§23) checkable against the artifact rather than against a running instance.

### 6.4 The artifact is frozen

`Object.freeze` is applied to the artifact and to `initialState` (deep) at construction. An adapter cannot modify the artifact; two adapters over the same artifact cannot interfere. The prototype already gets this right by accident — `logic.state` survives toggling because `toOOP` spreads into a fresh object — and OBIX 1.0 makes it a guarantee rather than a happy consequence.

### 6.5 What the DOP layer is *not*

The Data-Oriented Adapter is not another UI framework layer. Its job is:

```
normalise component data + behaviour  →  translate programming interface
```

```
        DOP                         NOT:   DOP
     ╱   │   ╲                              ↓
Functional OOP Reactive                 framework
                                            ↓
                                        framework
                                            ↓
                                           DOM
```

There is exactly one hop from artifact to consumer, and one more from consumer to DOM. If a proposed feature adds a third hop, it does not go in.

---

## 7. State semantics

### 7.1 Declaration

```js
const state = {
  seconds: 0,
  running: false,
  laps: [],
  label: null
};
```

Lowered to `TimerDOP.initialState`. The identifier `state` is used in source because it reads naturally; the IR name is `initialState` because that is what it is — the artifact never holds *current* state. Current state belongs to a projection.

**This is the sharpest line in the specification.** The artifact is a description; an instance is a projection holding a value. `TimerDOP.initialState` is the same object forever, in every consumer, in every tab.

### 7.2 Rules

**J10 — Serializable only.** Permitted in the initial literal: string, number, boolean, `null`, array, plain object. Prohibited: functions, DOM nodes, `Map`/`Set`, class instances, promises, sockets, timers (`OBIX-J020`).

This is what makes state checkpointable, transmissible, replayable, and assertable without a browser. It is also the precondition for the OBIX halting / state-hinging cache model — a session cannot be checkpointed and resumed if its state contains a socket handle.

**J11 — Non-deterministic initialisers warned.** `Date.now()`, `Math.random()`, `crypto.randomUUID()` in the initial literal produce `OBIX-J021`: the value differs between server render and client hydrate. Pass it as a prop or set it from an effect.

**J12 — The key set is closed.** Actions may not introduce keys absent from the initial literal (`OBIX-J022`) — statically where the returned literal is analysable, at runtime in dev builds otherwise. A closed key set is what makes shallow key-diffing a *complete* update strategy rather than a heuristic.

**J13 — Comparison is top-level identity.** After a transition, keys are compared with `Object.is`. Returning a new top-level object for a changed nested value updates correctly; mutating a nested object in place does not — and J21 makes that mutation an error anyway. Stated plainly rather than hidden.

**J14 — Adapters must not extend state.** No adapter may add a key, a hidden field, or a symbol to state. The OOP projection's instance state is `initialState`-shaped and nothing more. Violating this would break Adapter Equivalence (§18) by construction.

---

## 8. Action semantics

### 8.1 Model A vs Model B — the evaluation the mandate requires

**Model A — context mutation** (the current prototype):

```js
toggle: (ctx) => { ctx.state.clicked = !ctx.state.clicked; }
```

**Model B — immutable transition** (proposed canonical):

```js
Toggle(state) { return { ...state, clicked: !state.clicked }; }
```

| Criterion | Model A | Model B |
|---|---|---|
| Determinism | transition depends on context shape | `f(state, args) → state`, total and pure |
| Testability | must build a `ctx`, then inspect it | call the function, compare the result |
| Serialization | previous state is destroyed | previous state survives; every step snapshottable |
| Replay / time travel | impossible without a journal | free — states are values |
| Adapter coupling | **every adapter must construct a mutable context and know the mutation convention** | adapters call and store; they need no knowledge of action bodies |
| Concurrency / effects | two consumers of one context race | no shared mutable cell in the artifact |
| Equivalence proof (§18) | not provable — projections differ in their context shape | provable by construction |

The decisive row is adapter coupling. Under Model A the adapter participates in the component's behaviour: `toOOP` binds `actions[key].bind(null, this)` so that `ctx` is the instance, while `toFunctional` builds `ctx = { state, ...actions }`. Two different context shapes, two different mutation surfaces, and — as §0.1 measured — two projections that are not equivalent. Under Model B the adapter's entire responsibility is `next = dop.actions.Name(current, ...args)`. There is one place the behaviour can live and it is the artifact.

**Decision: Model B is canonical. Model A is supported through the compatibility layer (§32) and is never silently broken.**

### 8.2 Declaration

```js
const actions = {
  Start(state) {
    if (state.running) return state;
    return { ...state, running: true };
  },
  SetLabel(state, label) {
    return { ...state, label };
  },
  Remove(state, id) {
    return { ...state, laps: state.laps.filter((lap) => lap.id !== id) };
  }
};
```

**J20 — Signature:** `ActionName(state, ...args) → newState`. First parameter is always current state; arguments arrive from the event binding (§12–13) or from `dispatch()`.

**J22 — Action names are PascalCase** (`OBIX-J036`). This makes `on:click="Start"` visually a *dispatch* rather than a function call, and separates actions from camelCase module-private helpers at a glance.

**J23 — Identity return is the canonical no-op:**

```js
Tick(state) {
  if (!state.running) return state;      // identity → zero work downstream
  return { ...state, seconds: state.seconds + 1 };
}
```

Every adapter short-circuits on `Object.is(next, prev)`: no subscriber notification, no DOM pass, no transition recorded. This is state-machine minimisation applied at the component level — the same principle the OBIX tennis-tracker MVP demonstrated, where transitions that change nothing are not tracked and cost nothing.

### 8.3 Purity, enforced honestly

The compiler cannot prove purity in JavaScript. It enforces a checkable subset and says so:

| Check | Code | Level |
|---|---|---|
| Assignment to the state parameter or its members | `OBIX-J030` | error |
| Reference to `document`, `window`, `navigator`, `localStorage`, `fetch`, `XMLHttpRequest` | `OBIX-J031` | error |
| `setTimeout` / `setInterval` / `requestAnimationFrame` | `OBIX-J032` | error — use `effects` |
| `async` action, or returning a promise | `OBIX-J033` | error |
| Reference to a top-level `let`/`var` | `OBIX-J034` | warning — hidden mutable state |
| Missing return on some path | `OBIX-J035` | error |

These are diagnostics, not a sandbox. The compiler's job is to make the correct thing easy and the incorrect thing loud.

### 8.4 Determinism requirement

**J24.** For any state `s` and argument list `a`, `Name(s, a)` must return an equal value on every call. Non-determinism inside an action is unprovable statically, so it is asserted in the conformance contract (§23) by running each action twice on identical input and comparing.

### 8.5 Arity

**J25.** Declared arity is `fn.length` and is recorded in the IR. Event bindings and `dispatch()` calls are arity-checked at compile time where the call site is static (`OBIX-T093`), and at runtime in dev builds otherwise.

### 8.6 Effects — impure work, declared as data

Pure actions cannot make a clock tick. Rather than relaxing purity, the impure work is declared:

```js
const effects = {
  tick: {
    every: 1000,
    while: ({ running }) => running,
    dispatch: "Tick"
  }
};
```

| Key | Meaning | Compiles to |
|---|---|---|
| `every: <ms>` | recurring | `setInterval` / `clearInterval` |
| `after: <ms>` | one-shot | `setTimeout` / `clearTimeout` |
| `on: "<window\|document> <type>"` | global listener | `addEventListener` / `removeEventListener` |

**J50.** Three kinds in 1.0. Async data is out of scope (§33, Q2).
**J51.** `while` is a pure predicate over state (dependencies declared by destructuring, §9.2). Absent means "active while mounted". The effect starts when it becomes true and stops when it becomes false.
**J52.** `dispatch` names an action; optional `args: [...]` of literals or event accessors.
**J53 — Handles belong to the projection, never the artifact.** `effects` in the IR is a **descriptor**. The timer id it produces lives in the adapter instance and is cleared on unmount. This is exactly why `setInterval` inside an action is `OBIX-J032`: not because timers are bad, but because an untracked handle leaks and is unserializable.
**J54 — Effects are inert in the Data and Functional projections.** `toData()` and `toFunctional()` expose the descriptor without scheduling anything; `toReactive()` and `toNative()` schedule. This keeps the pure projections pure and is a stated part of the equivalence definition (§18.4).

---

## 9. Derived semantics

### 9.1 Declaration

```js
const derived = {
  formattedTime({ seconds }) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  },
  statusLabel({ running, seconds }, { idleText }) {
    if (running) return "Running";
    if (seconds > 0) return "Paused";
    return idleText;
  }
};
```

**J40 — Signature:** `name(state, props) → value`. Both parameters optional. Pure; same lint set as actions. **Derived values are never stored in state** — that would duplicate the source of truth and make state non-minimal.

### 9.2 Dependencies are declared by destructuring

This is the mechanism that gives fine-grained updates without proxies, without runtime tracking, and without a `deps` array to keep in sync:

```js
formattedTime({ seconds })              // → state.seconds
statusLabel({ running, seconds }, { idleText })  // → state.running, state.seconds; props.idleText
elapsedRatio(state)                     // parameter not destructured → depends on ALL state
```

A destructured parameter names its dependencies **syntactically**, in ordinary ES6 the developer would plausibly have written anyway. A non-destructured parameter is conservative and still correct — recomputed on any state change — and emits `OBIX-J041` (advisory) suggesting destructuring. Rest patterns fall back to the conservative set with the same advisory.

**J42 — Derived values may not reference other derived values** (`OBIX-J042`). Shared work goes in a module-private helper called from both. The dependency graph stays one level deep and acyclic by construction.

**J43 — Evaluation timing.** Computed when a binding that uses it needs a value: once at mount, thereafter only when its declared dependency set intersects the set of keys that actually changed. Memoised per update pass, so a derived value used by six bindings is computed once.

**J44 — Available in every projection.** `toData().derived.formattedTime(state)`, `instance.formattedTime` (OOP getter), `functional.derived.formattedTime(state)`, `reactive.derived.formattedTime`. Same function object in all four — they are references to the artifact's members, never copies.

---

## 10. Validation semantics

### 10.1 Validation is data, not a rendering concern

The uploaded `example.tsx` shows the pattern OBIX must beat: `withValidation` is a Higher-Order Component that wraps a React component, runs rules inside `useMemo`, and throws during render. The rules are *data* — `{ required: true, type: 'string', validator: … }` — but they are trapped inside a React-specific wrapper, execute inside the render path, and are unavailable to anyone who is not rendering.

OBIX makes the same rules a DOP descriptor:

```js
const validation = {
  props: {
    title:  { required: true, type: "string", minLength: 3,
              message: "Title must be at least 3 characters" },
    items:  { type: "array", maxLength: 10,
              message: "Maximum of 10 items allowed" },
    onItemClick: { type: "function" }
  },

  state: {
    seconds: { type: "number", min: 0 },
    running: { type: "boolean" }
  },

  rules: {
    NoHandlerWhenDisabled: {
      when: ({ disabled }, { onItemClick }) => disabled && Boolean(onItemClick),
      message: "Disabled components cannot have click handlers"
    }
  }
};
```

The same three rules from `example.tsx`, now:

- available **before** any paradigm is chosen — `adapter.validateProps(props)` works identically in Data, Functional, OOP and Reactive projections;
- available **without rendering** — no component tree, no DOM, no React;
- part of the **serializable descriptor half** (§6.3), so tooling and the conformance contract can read them;
- checkable **at compile time** wherever a parent passes literal props.

### 10.2 Rule vocabulary — closed

| Key | Applies to | Meaning |
|---|---|---|
| `required` | props | must be supplied by the parent |
| `type` | props, state | `string`, `number`, `boolean`, `array`, `object`, `function`, `null` |
| `min` / `max` | numbers | inclusive bounds |
| `minLength` / `maxLength` | strings, arrays | inclusive bounds |
| `pattern` | strings | regex source string |
| `oneOf` | any | array of permitted literals |
| `message` | any | diagnostic text |

Cross-field and conditional rules go in `rules`, each a **pure predicate** `(state, props) → boolean` returning `true` when the rule is **violated**, plus a message. Predicate dependencies are declared by destructuring, exactly as in `derived`.

**V1 — No arbitrary throwing validators.** The `example.tsx` pattern of `validator: (v) => { throw new Error(…) }` is replaced by predicate + message, because a thrown error is control flow and a violation is data. `adapter.validate(state, props)` returns a report:

```js
{ valid: false,
  violations: [ { scope: "props", target: "title", rule: "minLength",
                  message: "Title must be at least 3 characters" } ] }
```

**V2 — Validation never mutates.** Predicates are pure; a violation report is a value.

### 10.3 When validation runs

| Moment | Dev builds | Production builds |
|---|---|---|
| Compile time, literal props at a parent call site | error (`OBIX-V001`) | error |
| Adapter construction — artifact shape | error | error |
| Mount / prop update — `validation.props` | throw | report to the violation channel |
| After each transition — `validation.state` + `rules` | throw | skipped unless `{ validate: "strict" }` |

**V3 — Production default is report, not throw.** A validation violation in production is a defect signal, not a reason to blank the user's screen. Violations go to `adapter.onViolation(handler)` — the natural feed for the OBIX telemetry layer.

**V4 — Validation is paradigm-independent and is an equivalence subject.** Given identical state and props, all four projections must produce an identical violation report (§18.4).

---

## 11. Template binding semantics

### 11.1 The four binding namespaces

A component has exactly four, and a template sees only these:

| Namespace | Declared as | Qualified form |
|---|---|---|
| loop scope | `obix:for="alarm of alarms"` | *(unqualified only)* |
| props | `const props = { … }` | `props.label` |
| derived | `const derived = { … }` | `derived.formattedTime` |
| state | `const state = { … }` | `state.seconds` |

### 11.2 Static resolution — the answer to "what is `{formattedTime}`?"

**T30.** An unqualified path's head resolves at compile time in the order **loop scope → props → derived → state**.

**T31 — Collisions are errors, not precedence.** A head name present in more than one of props/derived/state makes the unqualified form `OBIX-T030`; the author qualifies it. A loop variable shadowing any of them is `OBIX-T031`. The ordering in T30 therefore never arbitrates between two live candidates — any ambiguity is reported.

**T32 — Unresolved names are errors** (`OBIX-T032`), with a did-you-mean suggestion. A misspelling cannot leak `undefined` into the DOM.

So `{formattedTime}` resolves to **`derived.formattedTime`**, and the binding calls `TimerDOP.derived.formattedTime(state, props)` when it needs a value. Not `state.formattedTime` — that would be an unresolved-name error, or a collision error if such a key existed. **The binding resolves through the DOP artifact**, which is what the mandate requires made explicit, and the compiler records the resolution in the IR so it is inspectable rather than inferred.

### 11.3 The binding record

Every binding is compiled to a record in `TimerDOP.template.bindings`:

```js
{
  id: "b1",
  kind: "text",                  // text | attr | bool | classPart | if | for | prop
  target: [0, 1],                // structural path from the template root
  read: { ns: "derived", name: "formattedTime" },
  stateDeps: ["seconds"],
  propDeps: []
}
```

`stateDeps` is computed at compile time by composing the binding's path with `derived` destructuring dependencies. It is the entire fine-grained update mechanism, and it is **data in the IR** — every projection reads the same table, so no projection can update differently from another.

### 11.4 Two emitters, one descriptor

```
template descriptor
   ├──► DOM binder      (toNative)   — createElement / textContent / setAttribute
   └──► string renderer (render)     — HTML string, DOM-free, SSR-safe
```

Both are generated from the same descriptor, so server output and client output cannot drift. This is the structural fix for the false SSR claims recorded in `BOTTLENECK_ANALYSIS.md` §3 — not a promise to keep them in sync, but a single source they are both generated from.

**T90.** `render` in the IR is `(state, props) → string` — pure, DOM-free, callable in Node with no shim. It is the third member of the prototype's minimal core and it keeps that role.

---

## 12. Event → action semantics

### 12.1 Form

```
on:<eventtype>[.modifier]* = "<ActionName>[(<arg>, …)]"
```

```html
<button on:click="Start">Start</button>
<input  on:input="SetEmail(event.value)">
<form   on:submit.prevent="Submit">
<button on:click="Remove(alarm.id)">Delete</button>
```

### 12.2 The pipeline

```
native DOM event
      ↓  event adapter (§13) — normalises to a serializable payload
   payload
      ↓  dispatch(actionName, ...payload)
   dop.actions.Start(currentState, ...payload)
      ↓
   nextState
      ↓  Object.is short-circuit
   changed keys → dirty bindings → DOM writes → subscribers notified
```

**E10 — The DOM handler contains no business logic.** The generated listener normalises the event and calls `dispatch`. Nothing else. All Timer behaviour lives in `dop.actions`. A reviewer can verify this by reading the generated module: the listener bodies are one line each (§28).

**E11 — Events are descriptors in the IR.** `TimerDOP.events` records *which action a DOM event maps to*, as data:

```js
{ e0: { bindingId: "e0", type: "click", action: "Start", args: [], modifiers: [] } }
```

The listener itself is created by the projection. This is what lets the conformance contract assert browser event mapping (§23) without a DOM, and what lets a non-DOM consumer — a test harness, a native shell, a polyglot binding — implement its own event source against the same map.

**E12 — Action must exist** (`OBIX-T092`); **arity must match** (`OBIX-T093`).

### 12.3 Modifiers

Exactly four, each mapping 1:1 onto something native:

| Modifier | Compiles to |
|---|---|
| `.prevent` | `event.preventDefault()` before dispatch |
| `.stop` | `event.stopPropagation()` before dispatch |
| `.once` | `addEventListener(…, { once: true })` |
| `.capture` | `addEventListener(…, { capture: true })` |

`.prevent` and `.stop` are DOM method calls that would otherwise force impurity into actions. `.once` and `.capture` are listener options. No `.self`, no `.debounce`, no key filters — key handling is `event.key` plus a branch in the action, where it is testable. Unknown modifiers are `OBIX-T094`.

### 12.4 Delegation

Inside `obix:for`, one delegated listener is attached to the loop container and the target row is resolved by key. A 500-row list attaches one listener, not 500. Recorded in the event descriptor as `delegated: true`.

---

## 13. Event payload normalization

### 13.1 Why a normalisation layer exists

A native `InputEvent` carries `target`, `currentTarget`, `view`, and a live reference into the DOM. None of that may reach an action, because §7 requires state to be serializable and §8 requires actions to be pure. So the pipeline needs a formal boundary:

```
native event   →   event adapter   →   payload (serializable)   →   action
```

The event adapter is a small pure function specified by the event descriptor, and it is the **only** place a DOM object is touched on the event path.

### 13.2 Syntax — evaluating the three candidates

| Candidate | Verdict |
|---|---|
| `on:input="SetValue"` with implicit payload | **Rejected as a default.** An implicit `event.target.value` is correct for text inputs, wrong for `click`, wrong for checkbox `change`, wrong for `keydown`. A default that is right a quarter of the time is worse than no default. Retained only in its literal meaning: no payload. |
| `on:input="SetValue(value)"` | **Rejected.** A bare `value` collides with the binding namespaces — a state key named `value` is common, and the reader cannot tell whether the argument is state or event data. |
| `on:input="SetValue($value)"` | **Rejected.** Introduces a third sigil alongside `{}` and `on:`/`obix:`, for no gain over qualification. |
| `on:input="SetValue(event.value)"` | **Adopted.** Qualified, unambiguous, reads as English, and `event` is an already-understood word. It cannot collide with a state or derived name because `event` is reserved in the argument position and nowhere else. |

### 13.3 The accessor table — closed

| Accessor | Normalises to | Payload type |
|---|---|---|
| `event.value` | `event.target.value` | string |
| `event.checked` | `event.target.checked` | boolean |
| `event.key` | `event.key` | string |
| `event.files` | `Array.from(event.target.files)` | File[] — **transient; must not be stored in state** |
| `event.detail` | `event.detail` | any (CustomEvent) |
| `event.x` / `event.y` | `event.clientX` / `event.clientY` | number |
| `event.index` | loop index at the binding site | number |

Anything outside the table is `OBIX-T090`. **The raw `Event` object is not reachable from a template** — deliberately. Every legitimate need is either in the table or belongs in an effect.

**E20.** Other argument forms: literals (string in single quotes, number, boolean, `null`) and paths resolvable in the binding namespace — which is how `Remove(alarm.id)` passes a loop value. Maximum four arguments (`OBIX-T091`); more suggests the action is doing too much.

**E21 — Payloads are asserted serializable in dev builds.** `event.files` is the one exception and is flagged: it may be passed to an action that hands it to an effect, but storing it in state is `OBIX-J020` at compile time where analysable and a dev-build error otherwise.

**E22 — The normaliser is generated from the descriptor**, so a non-DOM event source (a test harness, a polyglot host) can produce the same payload shape without a DOM. `dispatch("SetEmail", "a@b.c")` and a real `input` event are indistinguishable to the action — which is what makes §20's behavioural tests meaningful.

---

## 14. Raw data adapter — `toData()`

### 14.1 Contract

```js
import { DOPAdapter } from "@obinexusltd/obix-dop";
import Timer from "./dist/Timer.js";

const adapter  = new DOPAdapter(Timer);
const TimerData = adapter.toData();

TimerData.name             // "Timer"
TimerData.initialState     // { seconds: 0, running: false }  (frozen)
TimerData.actions.Start    // (state) => state
TimerData.derived.formattedTime  // (state, props) => string
TimerData.render           // (state, props) => string
TimerData.template         // descriptor
TimerData.events           // descriptor
TimerData.styles           // descriptor
TimerData.accessibility    // descriptor
TimerData.validation       // descriptor
TimerData.toJSON()         // serializable half (§6.3)
```

**D1 — Zero transformation.** `toData()` returns the frozen artifact itself. It is the identity projection and the canonical low-level OBIX interface. Every other adapter is defined in terms of it.

**D2 — No instance, no current state, no lifecycle.** Consumers of the data projection hold state themselves:

```js
let s = TimerData.initialState;
s = TimerData.actions.Start(s);
s = TimerData.actions.Tick(s);
console.log(TimerData.render(s));   // "<section class=\"Timer\" …>00:01…"
```

**D3 — This is the interoperability surface.** A polyglot binding, a server renderer, a static analyser, a design tool, or a test harness consumes `toData()`. `toJSON()` crosses a process or language boundary; the executable half stays in JavaScript.

---

## 15. Functional adapter — `toFunctional()`

### 15.1 Evaluating the two models the mandate raises

**Model 1 — pure namespace:**

```js
TimerFunctional.initialState
TimerFunctional.actions.Start(state)
TimerFunctional.render(state)
```

**Model 2 — closure instance:**

```js
const timer = TimerFunctional();
timer.getState(); timer.dispatch("Start"); timer.render();
```

Model 1 is honest but forces every consumer to hand-roll state threading. Model 2 is ergonomic but the prototype's version of it is exactly where the defect lives: `toFunctional()` returns a function that builds a local `ctx`, calls `render`, and throws the state away — measured in §0.1 as a one-shot string with no dispatch.

**Decision: both, layered, with the pure model as the base.**

```js
const F = adapter.toFunctional();   // Model 1 — pure namespace
const t = F.create();               // Model 2 — closure instance built FROM the namespace
```

`create()` is defined *in terms of* the namespace, so it cannot diverge from it. The mandate's requirement — *"do not hide mutation inside the functional adapter"* — is met precisely: the closure holds one `let current`, reassigns it to the value returned by a pure action, and returns that value from `dispatch`. Reassignment of a local binding is not mutation of state; no state object is ever modified, and every intermediate state remains a valid value the caller can keep.

### 15.2 Implementation (ordinary ES6, complete)

```js
export function toFunctional(dop) {
  const reduce = (state, actionName, ...args) => {
    const action = dop.actions[actionName];
    if (!action) throw new TypeError(`[OBIX] unknown action "${actionName}" on ${dop.name}`);
    return action(state, ...args);
  };

  const namespace = {
    name: dop.name,
    initialState: dop.initialState,
    props: dop.props,
    actions: dop.actions,          // same function objects as the artifact
    derived: dop.derived,
    validate: dop.validate,
    render: dop.render,

    // fold an action trace into a final state — pure
    reduce,
    replay: (trace, from = dop.initialState) =>
      trace.reduce((s, [name, ...args]) => reduce(s, name, ...args), from),

    create(options = {}) {
      let current = options.state ?? dop.initialState;
      const props = Object.freeze({ ...dop.props, ...(options.props || {}) });
      return {
        getState: () => current,
        getProps: () => props,
        dispatch(actionName, ...args) {
          current = reduce(current, actionName, ...args);   // local rebind, not mutation
          return current;                                   // caller keeps the value
        },
        derived: (name) => dop.derived[name](current, props),
        validate: () => dop.validate(current, props),
        render: () => dop.render(current, props)
      };
    }
  };

  return Object.freeze(namespace);
}
```

**F1.** `namespace.actions` holds the **same function objects** as the artifact — not wrappers, not copies. There is no second `Start`.
**F2.** `create()` never schedules effects (J54). The functional projection is inert; a consumer who wants effects uses `toReactive()` or `toNative()`.
**F3.** `replay(trace)` is the functional projection's participation in Adapter Equivalence (§18) and is what the test runner calls.

---

## 16. OOP adapter — `toOOP()`

### 16.1 Contract

```js
const TimerClass = adapter.toOOP();
const timer = new TimerClass();

timer.state           // { seconds: 0, running: false }   (frozen)
timer.Start();        // → new state
timer.Tick();
timer.formattedTime;  // derived, as a getter
timer.render();
```

### 16.2 Implementation (ordinary ES6, complete)

```js
export function toOOP(dop) {
  class ObixComponent {
    #state;
    #props;

    constructor(options = {}) {
      this.#state = options.state ?? dop.initialState;
      this.#props = Object.freeze({ ...dop.props, ...(options.props || {}) });
    }

    get name()  { return dop.name; }
    get state() { return this.#state; }
    get props() { return this.#props; }

    set state(_) {
      throw new TypeError(
        `[OBIX] ${dop.name}.state is read-only — dispatch an action instead`);
    }

    dispatch(actionName, ...args) {
      const action = dop.actions[actionName];
      if (!action) throw new TypeError(`[OBIX] unknown action "${actionName}" on ${dop.name}`);
      this.#state = action(this.#state, ...args);   // THE one implementation
      return this.#state;
    }

    validate() { return dop.validate(this.#state, this.#props); }
    render()   { return dop.render(this.#state, this.#props); }
    toJSON()   { return this.#state; }

    replay(trace) {
      for (const [name, ...args] of trace) this.dispatch(name, ...args);
      return this.#state;
    }
  }

  // action methods — thin delegations, generated from the artifact
  for (const actionName of Object.keys(dop.actions)) {
    Object.defineProperty(ObixComponent.prototype, actionName, {
      value(...args) { return this.dispatch(actionName, ...args); },
      writable: false, enumerable: false, configurable: false
    });
  }

  // derived values — getters, generated from the artifact
  for (const derivedName of Object.keys(dop.derived)) {
    Object.defineProperty(ObixComponent.prototype, derivedName, {
      get() { return dop.derived[derivedName](this.state, this.props); },
      enumerable: false, configurable: false
    });
  }

  Object.defineProperty(ObixComponent, "name", { value: dop.name });
  return ObixComponent;
}
```

**O1 — There is no second implementation of `Start`.** `timer.Start()` is a three-token delegation to `dispatch`, which calls `dop.actions.Start`. The class contributes *encapsulation and naming*, never behaviour. This is verifiable mechanically: every action method body is identical.

**O2 — `state` is a read-only getter with a throwing setter.** The prototype's OOP projection exposed a public mutable `this.state`; assigning to it would desynchronise the instance from the artifact's transition rules. OBIX 1.0 closes that hole loudly rather than silently.

**O3 — Instances are isolated.** Private fields per instance; the artifact is frozen. The prototype already achieves isolation by spreading into a fresh object (measured in §0.1); here it is structural.

**O4 — The class is generated, not written.** Adding an action to `Timer.obix` adds a method to every OOP consumer with no further work and no chance of drift.

---

## 17. Reactive adapter — `toReactive()`

### 17.1 Contract

```js
const TimerReactive = adapter.toReactive();
const timer = TimerReactive();

const stop = timer.subscribe((next, prev, meta) => {
  // meta = { action, args, changedKeys }
});

timer.dispatch("Start");
timer.dispatch("Tick");
timer.state;         // current
stop();              // unsubscribe
timer.destroy();     // stop effects, drop subscribers
```

### 17.2 Implementation (ordinary ES6, complete)

```js
export function toReactive(dop) {
  return function createReactive(options = {}) {
    let current = options.state ?? dop.initialState;
    const props = Object.freeze({ ...dop.props, ...(options.props || {}) });
    const subscribers = new Set();
    const scheduled = new Map();          // effect name → handle
    let destroyed = false;

    const changedKeys = (a, b) =>
      Object.keys(dop.initialState).filter((k) => !Object.is(a[k], b[k]));

    function dispatch(actionName, ...args) {
      if (destroyed) throw new Error(`[OBIX] ${dop.name} instance destroyed`);
      const action = dop.actions[actionName];
      if (!action) throw new TypeError(`[OBIX] unknown action "${actionName}" on ${dop.name}`);

      const prev = current;
      const next = action(prev, ...args);        // THE one implementation

      if (Object.is(next, prev)) return prev;    // identity short-circuit (J23)

      current = next;
      const meta = { action: actionName, args, changedKeys: changedKeys(prev, next) };
      for (const fn of subscribers) fn(next, prev, meta);
      syncEffects();
      return next;
    }

    function syncEffects() {
      for (const [name, spec] of Object.entries(dop.effects || {})) {
        const shouldRun = spec.while ? Boolean(spec.while(current, props)) : true;
        const running = scheduled.has(name);
        if (shouldRun && !running)  scheduled.set(name, startEffect(spec, dispatch));
        if (!shouldRun && running) { stopEffect(scheduled.get(name)); scheduled.delete(name); }
      }
    }

    syncEffects();

    return {
      name: dop.name,
      get state() { return current; },
      get props() { return props; },
      derived: new Proxy({}, {                 // read-only façade over dop.derived
        get: (_, key) => dop.derived[key](current, props)
      }),
      dispatch,
      replay(trace) { for (const [n, ...a] of trace) dispatch(n, ...a); return current; },
      subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
      validate() { return dop.validate(current, props); },
      render()   { return dop.render(current, props); },
      destroy()  { for (const h of scheduled.values()) stopEffect(h);
                   scheduled.clear(); subscribers.clear(); destroyed = true; }
    };
  };
}
```

**R1 — Reactive means *observation of DOP state transitions*.** Nothing more. No hooks, no virtual DOM, no scheduler heuristics, no separate reactive business logic. The reactive projection adds a subscriber set and effect scheduling on top of the same `dop.actions` call every other projection makes.

**R2 — Notification is post-transition and synchronous**, with `(next, prev, meta)`. `meta.changedKeys` is computed once and reused by the DOM binder, so the native projection does not recompute it.

**R3 — Identity return notifies nobody** (J23). A `Tick` on a stopped timer costs one function call and stops.

**R4 — Effects live here, not in the artifact.** `scheduled` is the projection's private handle map, cleared by `destroy()`. This is J53 in code.

**R5 — The `derived` façade is a read-through Proxy**, not a cache — `timer.derived.formattedTime` always reflects the current state. The Proxy is a convenience over `dop.derived`, never a second implementation.

### 17.3 `toNative()` — and why it is an adapter, not a framework

```js
const instance = adapter.toNative(document.querySelector("#app"), { props });
```

**N1.** `toNative()` is `toReactive()` plus the compiled binding table. It subscribes once, and on each notification maps `meta.changedKeys` through `template.bindings` to a minimal set of DOM writes.

**N2 — This keeps the architecture shallow (§6.5).** The DOM is a consumer interface like any other paradigm; modelling it as a fifth projection means there is still exactly one hop from artifact to consumer. Making it a separate "runtime layer" beneath the adapters would add the extra hop the mandate forbids.

**N3.** `toNative()` is the only projection permitted to touch the DOM. That single sentence is why the other four run unmodified in Node.

---

## 18. Adapter Equivalence — the core invariant

### 18.1 Name

The invariant is called **Adapter Equivalence**, written `≅`. It generalises the functional ↔ OOP bijection already proven in the OBIX DOP pipeline (25/25) to a four-way equivalence over Data, Functional, OOP and Reactive projections.

*Considered and rejected:* "Paradigm Equivalence" (equivalence is a property of the adapters, not of the paradigms — the paradigms remain genuinely different to program in); "DOP Bijection" (bijection is too strong once four projections and non-invertible views such as a Proxy façade are involved — equivalence of observable state is the honest claim).

### 18.2 Statement

> Let `A` be a DOP artifact, `s₀` its initial state, `p` a props object, and
> `T = [(a₁, args₁), (a₂, args₂), …, (aₙ, argsₙ)]` a finite action trace.
>
> For every projection `P ∈ { Data, Functional, OOP, Reactive }`:
>
> ```
> stateAfter(P, A, s₀, p, T)  ≡  fold(A.actions, s₀, T)
> ```
>
> and for every derived name `d` and every prefix of `T`:
>
> ```
> derivedOf(P, d)  ≡  A.derived[d](stateAfter(…), p)
> render(P)        ≡  A.render(stateAfter(…), p)
> validate(P)      ≡  A.validate(stateAfter(…), p)
> ```
>
> where `≡` is deep structural equality.

### 18.3 The worked case from the mandate

```
initial:  { seconds: 0, running: false }
trace:    Start → Tick → Tick → Stop
expected: { seconds: 2, running: false }
```

```js
// Data
let s = D.initialState;
for (const [n] of trace) s = D.actions[n](s);
s;                                    // { seconds: 2, running: false }

// Functional
F.replay(trace);                      // { seconds: 2, running: false }

// Functional (closure instance)
const fi = F.create();
for (const [n] of trace) fi.dispatch(n);
fi.getState();                        // { seconds: 2, running: false }

// OOP
new (adapter.toOOP())().replay(trace) // { seconds: 2, running: false }

// Reactive
adapter.toReactive()().replay(trace)  // { seconds: 2, running: false }
```

All five call `TimerDOP.actions.Start`, `.Tick`, `.Stop`. None implements `Start`.

### 18.4 Scope — what equivalence covers, and what it deliberately does not

| Observable | In scope | Note |
|---|---|---|
| Final state after a trace | ✅ | the primary claim |
| State after every prefix of a trace | ✅ | checked step-wise, so divergence is localised |
| Derived values | ✅ | same functions, so equality is by construction |
| `render(state, props)` output | ✅ | string equality |
| Validation report | ✅ | V4 |
| Identity short-circuit behaviour | ✅ | a no-op is a no-op in every projection |
| **Effect scheduling** | ⚠️ **partial** | Data and Functional are inert (J54). Equivalence is asserted over *explicit* traces only; effect-driven traces are compared between Reactive and Native, which are the two scheduling projections. |
| Subscriber notifications | ❌ | only Reactive and Native have subscribers; this is a projection-specific capability, not a divergence in state |
| DOM output | ❌ for non-Native | Native's DOM must match `render()`'s string, which is asserted separately in the conformance contract (§23) |

Stating the partial and out-of-scope rows is what makes the invariant honest and therefore testable. An invariant that claimed effect timing across inert projections would be false on its first run.

### 18.5 Enforcement

**AE1.** `obixc verify --equivalence` runs every trace from `Timer.test.obix` through all four projections and compares state after every step.
**AE2.** Additionally, traces are generated automatically: all sequences of declared actions up to a configured depth (default 3), with argument values drawn from the validation descriptors' type and bound information. For Timer that is 4³ = 64 traces, checked in milliseconds.
**AE3.** A single divergence fails the build and reports the trace prefix, the two projections, and the two states.
**AE4.** Equivalence is asserted in the conformance contract (§23) and is therefore a **publication gate**.

---

## 19. Accessibility model

Accessibility is part of the DOP artifact, not the rendering path. `TimerDOP.accessibility` is a descriptor computed from the template at compile time.

### 19.1 What the compiler computes per element

| Property | Source |
|---|---|
| `role` | explicit `role`, else the tag's implicit ARIA role |
| `name` | accessible name per ACCNAME: `aria-label`, `aria-labelledby`, associated `<label>`, content, `alt`, `title` |
| `description` | `aria-describedby` target |
| `focusable` | interactive tag, or `tabindex >= 0` |
| `liveRegion` | `aria-live`, or implicit from `role="alert" \| "status" \| "timer"` |
| `states` | bound `aria-*` state attributes and the DOP path each reads |
| `keyboard` | `on:keydown` bindings and the actions they dispatch |
| `minBox` | computed from scoped CSS, for touch-target checking |

This computation is possible **because template expressions are restricted** (§4.6). A template containing arbitrary JavaScript could not be checked this way. That is the payoff for the restriction.

### 19.2 Compile-time diagnostics

| Rule | Code | Level |
|---|---|---|
| Interactive element with no accessible name | `OBIX-A001` | error |
| `<img>` without `alt` (empty `alt=""` valid for decorative) | `OBIX-A002` | error |
| Form control with no label or `aria-label` | `OBIX-A003` | error |
| `<div>`/`<span>` with `on:click` and no role + tabindex + keyboard binding | `OBIX-A004` | error |
| `aria-*` invalid for the element's role | `OBIX-A005` | error |
| `aria-describedby` / `aria-labelledby` targeting an absent id | `OBIX-A006` | error |
| More than one `autofocus` | `OBIX-A012` | error |
| Heading level skipped within a component | `OBIX-A007` | warning |
| Bound error text not connected via `aria-describedby` | `OBIX-A008` | warning |
| Interactive element below 44×44 CSS px in scoped CSS | `OBIX-A009` | warning |
| Live-region role with no `aria-live` and no implicit semantics | `OBIX-A010` | warning |
| Positive `tabindex` | `OBIX-A011` | warning |
| Drag-only interaction with no keyboard path | `OBIX-A013` | warning |

### 19.3 FUD policies as compiler passes

The FUD triad moves from runtime decorators — where `BOTTLENECK_ANALYSIS.md` recorded them as *"runs once, not at render"*, i.e. stale — into compilation, where staleness is impossible:

| Policy | Compile-time expression |
|---|---|
| **Focus** | DOM-order focus (positive `tabindex` warned); `:focus-visible` presence checked in scoped CSS for interactive elements; focus preservation guaranteed by keyed reconciliation (T54) rather than left to the developer |
| **Undo** | Every transition is a pure function with the prior state still a live value, so an undo stack is a projection option (`toReactive()({ history: n })`), not a component concern. The language neither blocks it nor requires it. |
| **Drag** | `on:pointerdown` / `on:dragstart` with no non-drag path to the same action is `OBIX-A013` |

### 19.4 Paradigm independence

**A20.** The accessibility descriptor is identical across all four projections because it lives in the artifact. Choosing OOP over functional cannot change a role, a name, or a live region. This is asserted in the conformance contract.

---

## 20. TDD model

### 20.1 Four layers, in dependency order

| Layer | Subject | Artifact | Needs a DOM |
|---|---|---|---|
| **0 — DOP transition** | `initialState`, `actions`, `derived`, `validation` | `Timer.test.obix` | no |
| **1 — Adapter equivalence** | all four projections agree | **generated** from Layer 0 | no |
| **2 — Render** | `render(state, props)` output | `Timer.test.obix` | no |
| **3 — Conformance** | DOM, ARIA, keyboard, contract | `Timer.obix.test` | yes |

**Layer 0 is written first and by hand.** It is the canonical DOP transition test the mandate specifies:

```
initial   seconds = 0, running = false
when      Start, Tick, Tick, Stop
expect    seconds == 2, running == false
```

**Layer 1 is never written by hand.** Every Layer 0 trace is replayed automatically through Data, Functional, OOP and Reactive by the runner (AE1), plus generated traces (AE2). Hand-writing "the same test but for the OOP adapter" is exactly the duplication the mandate forbids, and it is also the weakest form of the check — a human writes four cases, the runner checks sixty-four.

**T-1.** A test author may pin a case to one projection with `test Name through oop { … }` when the point of the test *is* a projection-specific capability (subscriber notification, effect scheduling). Pinned tests are excluded from Layer 1 and the runner reports how many were excluded, so the exclusion is visible rather than silent.

### 20.2 Virtual time

`advance 3000ms` steps the effect scheduler, not `Date`. `every: 1000` under `advance 3000ms` dispatches exactly three times, in order, with state settling between each. Effect tests are deterministic and instant, in Node, with no DOM.

### 20.3 Compilation target

`obixc` compiles a test suite to a plain ES module exporting a manifest of named test functions, runnable by the small `obix-test` runner (TAP + JSON report) or importable by any host. **No Jest, no Vitest, no injected globals.** A thin adapter can expose the manifest to Vitest for teams that want one dashboard — that is an adapter, not a dependency.

---

## 21. `Timer.obix` — complete

```html
<style lang="css" type="scoped">
    .Timer {
        display: grid;
        gap: 1rem;
        justify-items: center;
    }

    .Timer__display {
        font-variant-numeric: tabular-nums;
        font-size: 3rem;
        line-height: 1;
    }

    .Timer__display--running {
        color: var(--obix-color-accent, #0b7285);
    }

    .Timer__controls {
        display: flex;
        gap: 0.5rem;
    }

    .Timer__button {
        min-inline-size: 3rem;
        min-block-size: 3rem;
        padding: 0.75rem 1.25rem;
    }

    .Timer__button:focus-visible {
        outline: 3px solid currentColor;
        outline-offset: 2px;
    }
</style>

<template>
    <section class="Timer" aria-labelledby="Timer-heading">
        <h2 id="Timer-heading" class="Timer__heading">{label}</h2>

        <output
            class="Timer__display Timer__display--{visualState}"
            role="timer"
            aria-live="polite"
            aria-atomic="true">
            {formattedTime}
        </output>

        <p class="Timer__status" aria-live="polite">{statusLabel}</p>

        <div class="Timer__controls">
            <button
                type="button"
                class="Timer__button"
                on:click="Start"
                disabled="{running}">
                Start
            </button>

            <button
                type="button"
                class="Timer__button"
                on:click="Stop"
                disabled="{stopped}">
                Stop
            </button>

            <button
                type="button"
                class="Timer__button"
                on:click="Reset">
                Reset
            </button>
        </div>

        <p class="Timer__hint" obix:if="atLimit">
            Maximum duration reached.
        </p>
    </section>
</template>

<script>
    const props = {
        label: "Timer",
        limitSeconds: 3600,
        idleText: "Ready"
    };

    const state = {
        seconds: 0,
        running: false
    };

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

        Tick(state) {
            if (!state.running) return state;
            return { ...state, seconds: state.seconds + 1 };
        }
    };

    const derived = {
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

        visualState({ running }) {
            return running ? "running" : "idle";
        },

        stopped({ running }) {
            return !running;
        },

        atLimit({ seconds }, { limitSeconds }) {
            return seconds >= limitSeconds;
        }
    };

    const validation = {
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

    const effects = {
        tick: {
            every: 1000,
            while: ({ running }) => running,
            dispatch: "Tick"
        }
    };
</script>
```

### 21.1 Improvements over the shape in the mandate, and why

| Mandate's shape | Specified | Reason |
|---|---|---|
| no mechanism for `Tick` | `const effects` | pure actions cannot advance a clock; the alternative is impurity in an action |
| `formattedTime(state)` | `formattedTime({ seconds })` | destructuring declares the dependency set, enabling fine-grained updates with no proxy (§9.2) |
| Stop always enabled | `disabled="{stopped}"` | a Stop button on a stopped timer is a defect; a derived boolean fixes it declaratively |
| bare `<output aria-live>` | + `role="timer"`, `aria-atomic`, heading, `aria-labelledby` | partial announcements without `aria-atomic` read as fragments |
| hard-coded label | `props.label` | reusable across the OBIXverse clock suite without editing the component |
| no validation | `const validation` | contracts on data belong in the artifact, before paradigm choice (§10) |

---

## 22. `Timer.test.obix` — behavioural specification

```html
<template>
    <Timer label="Session timer" limitSeconds="5" />
</template>

<script type="test">
    import Timer from "./Timer.obix";

    suite Timer {

        /* ---- Layer 0: canonical DOP transitions ---- */

        test InitialState {
            expect state.seconds is 0
            expect state.running is false
            expect derived.formattedTime is "00:00"
            expect derived.statusLabel is "Ready"
        }

        test CanonicalTrace {
            dispatch Start
            dispatch Tick
            dispatch Tick
            dispatch Stop
            expect state.seconds is 2
            expect state.running is false
        }

        test StartIsIdempotent {
            dispatch Start
            dispatch Start
            expect state.running is true
            expect transitions is 1
        }

        test TickRequiresRunning {
            dispatch Tick
            expect state.seconds is 0
            expect transitions is 0
        }

        test ResetReturnsToInitial {
            dispatch Start
            dispatch Tick
            dispatch Reset
            expect state is initial
        }

        test ActionsDoNotMutate {
            given state { seconds: 10, running: true }
            dispatch Stop
            expect no mutation
        }

        test StateIsSerializable {
            dispatch Start
            dispatch Tick
            expect state is serializable
        }

        /* ---- derived ---- */

        test FormattingCrossesMinuteBoundary {
            given state { seconds: 61, running: false }
            expect derived.formattedTime is "01:01"
        }

        test StatusReflectsPausedRun {
            given state { seconds: 3, running: false }
            expect derived.statusLabel is "Paused"
        }

        /* ---- validation ---- */

        test LimitViolationIsReported {
            given state { seconds: 9, running: true }
            expect validation.valid is false
            expect validation.violations contains "NeverPastLimit"
        }

        test ValidStateReportsClean {
            dispatch Start
            expect validation.valid is true
        }

        /* ---- effects, on virtual time ---- */

        test EffectDrivesTick {
            dispatch Start
            advance 3000ms
            expect state.seconds is 3
        }

        test EffectStopsWhenPaused {
            dispatch Start
            advance 2000ms
            dispatch Stop
            advance 5000ms
            expect state.seconds is 2
        }

        /* ---- Layer 2: render ---- */

        test RendersLimitHint {
            given state { seconds: 5, running: true }
            expect derived.atLimit is true
            expect render contains "Maximum duration reached"
        }

        test RendersAccessibleTimerRole {
            expect render contains "role=\"timer\""
            expect render contains "aria-live=\"polite\""
        }

        /* ---- projection-specific: pinned, excluded from Layer 1 ---- */

        test SubscriberSeesChangedKeys through reactive {
            subscribe
            dispatch Start
            expect notification.changedKeys is ["running"]
        }

        test IdentityReturnNotifiesNobody through reactive {
            subscribe
            dispatch Tick
            expect notifications is 0
        }

        test StateSetterIsRejected through oop {
            expect assigning state throws
        }
    }
</script>
```

### 22.1 Semantics

**X1 — Fresh instance per `test`.** Initial state from `Timer.obix`, props from the `<template>` fixture, virtual clock at zero. No shared fixture, no `beforeEach`, no ordering dependence.
**X2 — The `<template>` is the fixture.** Exactly one component reference with literal props. This is why the behavioural test uses the OBIX shape: the thing under test is declared the way it is used.
**X3 — Unpinned tests run through all four projections** (Layer 1, automatic). `CanonicalTrace` alone yields four assertions of the same expectation across Data, Functional, OOP and Reactive, plus a comparison of every intermediate state — none of it hand-written.
**X4 — Headless.** No DOM. `expect render` calls `dop.render`.
**X5 — Pinned tests** (`through reactive`, `through oop`, `through functional`, `through data`) are excluded from Layer 1, and the runner reports the exclusion count.

---

## 23. `Timer.obix.test` — conformance contract

`.obix.test` is **not** a three-section file. It is not a component; giving it the component shape would imply it can render. It is a flat contract document about an artifact.

```
contract Timer from "./Timer.obix"

/* ---- 1. DOP shape ---- */

dop {
    prop  label: string = "Timer"
    prop  limitSeconds: number = 3600
    prop  idleText: string = "Ready"

    state seconds: number = 0
    state running: boolean = false

    action Start arity 1
    action Stop  arity 1
    action Reset arity 1
    action Tick  arity 1

    derived formattedTime: string
    derived statusLabel: string
    derived visualState: string
    derived stopped: boolean
    derived atLimit: boolean

    effect tick every 1000 dispatches Tick

    expect core { state, actions, render }
    expect artifact frozen
    expect initialState frozen
}

/* ---- 2. serializability ---- */

serialization {
    expect initialState is serializable
    for any state: expect state is serializable
    expect roundtrip json                       // JSON.parse(JSON.stringify(s)) ≡ s
    expect descriptors serializable             // toJSON() half, §6.3
}

/* ---- 3. action determinism ---- */

determinism {
    for any action, any state: expect twice-identical
    for any action, any state: expect no mutation of input
    expect Tick identity when running false
    expect Start identity when running true
    expect Stop  identity when running false
}

/* ---- 4. adapter equivalence ---- */

equivalence {
    adapters [data, functional, oop, reactive]
    trace [Start, Tick, Tick, Stop] expect state { seconds: 2, running: false }
    generate traces depth 3
    expect state equivalent after every step
    expect derived equivalent
    expect render equivalent
    expect validation equivalent
}

/* ---- 5. template validity ---- */

template {
    expect single-root
    expect all bindings resolved
    expect no unresolved names
    expect render matches dom                  // toNative output ≡ render() string
    expect scoped styles unchanged across adapters
}

/* ---- 6. browser event mapping ---- */

events {
    expect click on StartButton dispatches Start
    expect click on StopButton  dispatches Stop
    expect click on ResetButton dispatches Reset
    expect no payload leaks dom                // no Event/Node reaches an action
    expect listeners removed on unmount
}

/* ---- 7. accessibility ---- */

element Display {
    select role "timer"
    expect aria-live "polite"
    expect aria-atomic "true"
    expect text matches "^[0-9]{2}:[0-9]{2}$"
}

element StartButton {
    select role "button" name "Start"
    expect focusable
    expect focus-visible
    expect touch-target 44x44
    expect keyboard Enter dispatches Start
    expect keyboard Space dispatches Start
}

element StopButton {
    select role "button" name "Stop"
    given state { running: false } expect disabled true
    given state { running: true }  expect disabled false
}

element ResetButton {
    select role "button" name "Reset"
    expect focusable
    expect touch-target 44x44
}

region Component {
    expect heading-order valid
    expect no positive-tabindex
    expect tab-order [StartButton, StopButton, ResetButton]
    expect contrast 4.5
}

announce {
    given state { running: false, seconds: 0 }
    dispatch Start
    advance 1000ms
    expect live-region Display announces "00:01"
}
```

### 23.1 Selection is by accessibility tree, never CSS

**C1.** `select role "button" name "Start"` resolves against the computed accessibility tree of the mounted component. Zero matches or more than one is a contract failure — **ambiguity in the accessibility tree is itself the defect**.

A CSS-selector test asserts that a class name exists. `.obix-button--primary` passing tells you nothing about whether a screen-reader user can find and press the control. `role "button" name "Start"` tells you exactly that. A refactor that renames classes does not break these tests; a refactor that breaks the accessible name does — which is precisely the sensitivity wanted.

### 23.2 Publication gate

**C2.** `obixc verify` runs the contract. A component whose `.obix.test` fails is not publishable, and the failure is a hard stop in the `nlink → polybuild` release path. Behavioural tests may be red during development; a conformance failure means the artifact does not advance. That difference in failure semantics is the whole reason for two test artifacts.

---

## 24. Generated DOP IR

`obixc` lowers `Timer.obix` to this artifact before any paradigm exists. This is the intermediate representation the mandate requires be shown explicitly — the compiler does not jump from `.obix` to DOM code.

```js
// dist/Timer.js — generated by obixc 1.0.0 — @generated

import { createDOP } from "@obinexusltd/obix-dop";

/* ---------- executable half: verbatim from <script> ---------- */

export const props = { label: "Timer", limitSeconds: 3600, idleText: "Ready" };

export const initialState = Object.freeze({ seconds: 0, running: false });

export const actions = {
  Start(state) { if (state.running) return state; return { ...state, running: true }; },
  Stop(state)  { if (!state.running) return state; return { ...state, running: false }; },
  Reset(state) { return { ...state, seconds: 0, running: false }; },
  Tick(state)  { if (!state.running) return state;
                 return { ...state, seconds: state.seconds + 1 }; }
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
    limitSeconds: { type: "number", min: 1, message: "limitSeconds must be a positive number" },
    idleText:     { type: "string" }
  },
  state: { seconds: { type: "number", min: 0 }, running: { type: "boolean" } },
  rules: {
    NeverPastLimit: {
      when: ({ seconds }, { limitSeconds }) => seconds > limitSeconds,
      message: "seconds exceeded limitSeconds"
    }
  }
};

export const effects = {
  tick: { every: 1000, while: ({ running }) => running, dispatch: "Tick" }
};

/* ---------- compile-time dependency analysis ---------- */

const DERIVED_DEPS = {
  formattedTime: { state: ["seconds"],             props: [] },
  statusLabel:   { state: ["running", "seconds"],  props: ["idleText"] },
  visualState:   { state: ["running"],             props: [] },
  stopped:       { state: ["running"],             props: [] },
  atLimit:       { state: ["seconds"],             props: ["limitSeconds"] }
};

/* ---------- descriptor half: pure data, JSON-serializable ---------- */

export const template = {
  root: "section",
  html: '<section class="Timer" data-obix="Timer" aria-labelledby="Timer-heading">…</section>',
  bindings: [
    { id: "b0", kind: "text",      target: [0],       read: { ns: "props",   name: "label" },
      stateDeps: [],                    propDeps: ["label"] },
    { id: "b1", kind: "text",      target: [1],       read: { ns: "derived", name: "formattedTime" },
      stateDeps: ["seconds"],           propDeps: [] },
    { id: "b2", kind: "classPart", target: [1],       read: { ns: "derived", name: "visualState" },
      prefix: "Timer__display--",
      stateDeps: ["running"],           propDeps: [] },
    { id: "b3", kind: "text",      target: [2],       read: { ns: "derived", name: "statusLabel" },
      stateDeps: ["running", "seconds"], propDeps: ["idleText"] },
    { id: "b4", kind: "bool",      target: [3, 0],    attr: "disabled",
      read: { ns: "state",   name: "running" },
      stateDeps: ["running"],           propDeps: [] },
    { id: "b5", kind: "bool",      target: [3, 1],    attr: "disabled",
      read: { ns: "derived", name: "stopped" },
      stateDeps: ["running"],           propDeps: [] },
    { id: "b6", kind: "if",        target: [4],       read: { ns: "derived", name: "atLimit" },
      stateDeps: ["seconds"],           propDeps: ["limitSeconds"] }
  ]
};

export const events = {
  e0: { bindingId: "e0", target: [3, 0], type: "click", action: "Start",
        args: [], modifiers: [], delegated: false },
  e1: { bindingId: "e1", target: [3, 1], type: "click", action: "Stop",
        args: [], modifiers: [], delegated: false },
  e2: { bindingId: "e2", target: [3, 2], type: "click", action: "Reset",
        args: [], modifiers: [], delegated: false }
};

export const styles = {
  scopeToken: "Timer",
  href: "./Timer.css",
  rules: [
    { selector: '.Timer[data-obix~="Timer"]', minBox: null },
    { selector: '.Timer__button[data-obix~="Timer"]', minBox: { width: 48, height: 48 } }
  ]
};

export const accessibility = {
  nodes: [
    { nodeId: "n1", role: "heading", level: 2,
      name: { source: "content", read: { ns: "props", name: "label" } }, focusable: false },
    { nodeId: "n2", role: "timer", roleImplicit: false,
      liveRegion: { politeness: "polite", atomic: true },
      name: { source: "content", read: { ns: "derived", name: "formattedTime" } } },
    { nodeId: "n4", role: "button", name: { text: "Start", source: "content" },
      focusable: true, keyboard: [ { key: "Enter", action: "Start" },
                                   { key: "Space", action: "Start" } ],
      states: [ { attribute: "disabled", read: { ns: "state", name: "running" } } ],
      minBox: { width: 48, height: 48 } }
    /* … */
  ],
  tabOrder: ["n4", "n5", "n6"],
  headings: [ { level: 2, nodeId: "n1" } ],
  liveRegions: [ { nodeId: "n2", politeness: "polite", atomic: true },
                 { nodeId: "n3", politeness: "polite", atomic: false } ],
  idRefs: [ { from: "n0", attribute: "aria-labelledby", to: "Timer-heading", resolved: true } ]
};

export const metadata = {
  obixVersion: "1.0.0",
  source: "src/Timer.obix",
  compiledAt: "2026-08-28T00:00:00Z",
  checksum: "sha256-…",
  actionModel: "immutable"        // §32: "immutable" | "context" | "mixed"
};

/* ---------- render: pure, DOM-free, generated from `template` ---------- */

export function render(state = initialState, componentProps = props) { /* §28 */ }

/* ---------- THE canonical artifact ---------- */

export const TimerDOP = createDOP({
  name: "Timer",
  initialState, props, actions, derived, validation, effects,
  render, template, events, styles, accessibility, metadata,
  deps: { derived: DERIVED_DEPS }
});

export default TimerDOP;
```

**Nothing in this module is functional, object-oriented, or reactive.** It is data and pure functions. The paradigm arrives in the next section.

---

## 25. Generated functional API

```js
import { DOPAdapter } from "@obinexusltd/obix-dop";
import TimerDOP from "./dist/Timer.js";

const Timer = new DOPAdapter(TimerDOP).toFunctional();
```

**Pure namespace (Model 1):**

```js
Timer.initialState                          // { seconds: 0, running: false }
Timer.actions.Start(Timer.initialState)     // { seconds: 0, running: true }
Timer.derived.formattedTime({ seconds: 61 })// "01:01"
Timer.render(state, props)                  // HTML string
Timer.reduce(state, "Tick")                 // next state
Timer.replay([["Start"], ["Tick"], ["Tick"], ["Stop"]])
// → { seconds: 2, running: false }
```

**Closure instance (Model 2), built from the namespace:**

```js
const timer = Timer.create({ props: { label: "Session timer" } });

timer.getState();                 // { seconds: 0, running: false }
timer.dispatch("Start");          // → { seconds: 0, running: true }   (returned, not hidden)
timer.dispatch("Tick");           // → { seconds: 1, running: true }
timer.derived("formattedTime");   // "00:01"
timer.validate();                 // { valid: true, violations: [] }
timer.render();                   // HTML string
```

Every transition above is `TimerDOP.actions.X(state)`. `create()` holds one `let`, reassigns it to the returned value, and returns that value to the caller — stated openly rather than hidden, and every intermediate state remains a usable value.

---

## 26. Generated OOP API

```js
const Timer = new DOPAdapter(TimerDOP).toOOP();
const timer = new Timer({ props: { label: "Session timer" } });

timer.state;              // { seconds: 0, running: false }   (frozen, read-only)
timer.Start();            // → { seconds: 0, running: true }
timer.Tick();             // → { seconds: 1, running: true }
timer.Tick();
timer.Stop();             // → { seconds: 2, running: false }

timer.formattedTime;      // "00:02"   (derived getter)
timer.statusLabel;        // "Paused"
timer.validate();         // { valid: true, violations: [] }
timer.render();           // HTML string
timer.toJSON();           // { seconds: 2, running: false }

timer.state = { seconds: 99 };
// TypeError: [OBIX] Timer.state is read-only — dispatch an action instead
```

Every method body is the same three tokens:

```js
Start(...args) { return this.dispatch("Start", ...args); }
Stop(...args)  { return this.dispatch("Stop",  ...args); }
```

and `dispatch` calls `TimerDOP.actions[name]`. **There is no second implementation of `Start`.** Adding an action to `Timer.obix` adds a method here with no further work and no possibility of drift.

---

## 27. Generated reactive API

```js
const Timer = new DOPAdapter(TimerDOP).toReactive();
const timer = Timer({ props: { label: "Session timer" } });

const stop = timer.subscribe((next, prev, meta) => {
  console.log(meta.action, meta.changedKeys, next);
});

timer.dispatch("Start");
// "Start" ["running"] { seconds: 0, running: true }
// effect `tick` starts — `while: ({running}) => running` became true

// …one second of real time, or `advance 1000ms` under virtual time…
// "Tick" ["seconds"] { seconds: 1, running: true }

timer.dispatch("Stop");
// "Stop" ["running"] { seconds: 1, running: false }
// effect `tick` stops

timer.dispatch("Tick");
// (nothing — identity return, no notification, no DOM pass)

timer.derived.formattedTime;   // "00:01"
stop();                        // unsubscribe
timer.destroy();               // clear effects and subscribers
```

Reactive means **observation of DOP state transitions**. The subscriber set and the effect scheduler are the only things this projection adds. There is no hook system, no virtual DOM, no separate reactive business logic, and no re-implementation of `Start`.

---

## 28. Generated native DOM code

`toNative()` is the reactive projection plus the compiled binding table. Native ES6, native DOM APIs, no framework.

```js
// dist/Timer.js (continued) — generated

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML =
  '<section class="Timer" data-obix="Timer" aria-labelledby="Timer-heading">' +
    '<h2 id="Timer-heading" class="Timer__heading" data-obix="Timer"></h2>' +
    '<output class="Timer__display" role="timer" aria-live="polite" aria-atomic="true" ' +
            'data-obix="Timer"></output>' +
    '<p class="Timer__status" aria-live="polite" data-obix="Timer"></p>' +
    '<div class="Timer__controls" data-obix="Timer">' +
      '<button type="button" class="Timer__button" data-obix="Timer">Start</button>' +
      '<button type="button" class="Timer__button" data-obix="Timer">Stop</button>' +
      '<button type="button" class="Timer__button" data-obix="Timer">Reset</button>' +
    '</div>' +
    '<!--obix:if Timer#b6-->' +
  '</section>';

const IF_B6 = document.createElement("template");
IF_B6.innerHTML = '<p class="Timer__hint" data-obix="Timer">Maximum duration reached.</p>';

export function mount(target, options = {}) {
  const store = new DOPAdapter(TimerDOP).toReactive()(options);   // ← same reactive projection

  const frag     = TEMPLATE.content.cloneNode(true);
  const section  = frag.firstElementChild;
  const heading  = section.children[0];
  const display  = section.children[1];
  const status   = section.children[2];
  const controls = section.children[3];
  const [startBtn, stopBtn, resetBtn] = controls.children;
  const ifAnchor = section.lastChild;

  // ---- event wiring: normalise, then dispatch. No business logic here. ----
  startBtn.addEventListener("click", () => store.dispatch("Start"));
  stopBtn .addEventListener("click", () => store.dispatch("Stop"));
  resetBtn.addEventListener("click", () => store.dispatch("Reset"));

  // ---- binding writers, generated from template.bindings ----
  let ifNode = null;
  const writers = {
    b0: (s, p) => { heading.textContent = p.label; },
    b1: (s, p) => { display.textContent = TimerDOP.derived.formattedTime(s, p); },
    b2: (s, p) => { display.classList.remove("Timer__display--running",
                                             "Timer__display--idle");
                    display.classList.add(
                      "Timer__display--" + TimerDOP.derived.visualState(s, p)); },
    b3: (s, p) => { status.textContent = TimerDOP.derived.statusLabel(s, p); },
    b4: (s)    => { startBtn.disabled = s.running; },
    b5: (s, p) => { stopBtn.disabled  = TimerDOP.derived.stopped(s, p); },
    b6: (s, p) => {
      const shouldShow = TimerDOP.derived.atLimit(s, p);
      if (shouldShow && !ifNode) {
        ifNode = IF_B6.content.cloneNode(true).firstElementChild;
        ifAnchor.parentNode.insertBefore(ifNode, ifAnchor);
      } else if (!shouldShow && ifNode) {
        ifNode.remove();
        ifNode = null;
      }
    }
  };

  const DEPS = Object.fromEntries(
    TimerDOP.template.bindings.map((b) => [b.id, b.stateDeps]));

  function flush(ids, state, props) {
    for (const id of ids) writers[id](state, props);
  }

  flush(Object.keys(writers), store.state, store.props);          // CREATED
  target.appendChild(frag);

  const unsubscribe = store.subscribe((next, _prev, meta) => {    // UPDATED
    const dirty = Object.keys(writers)
      .filter((id) => DEPS[id].some((k) => meta.changedKeys.includes(k)));
    flush(dirty, next, store.props);
  });

  return {
    element: section,
    get state() { return store.state; },
    dispatch: store.dispatch,
    subscribe: store.subscribe,
    derived: store.derived,
    render: store.render,
    unmount() {                                                   // HALTED → DESTROYED
      unsubscribe();
      store.destroy();
      section.remove();
    }
  };
}

export function hydrate(element, options = {}) { /* adopt existing DOM, bind, no re-render */ }
```

### 28.1 The update path

```
click
  → store.dispatch("Tick")
  → next = TimerDOP.actions.Tick(prev)
  → Object.is(next, prev) ? stop : continue
  → meta.changedKeys = ["seconds"]
  → dirty = bindings whose stateDeps intersect ["seconds"]  →  b1, b6
  → writers.b1(next, props);  writers.b6(next, props)
```

Three consequences:

- **No virtual DOM.** Nothing is diffed. The binding table came from the IR; `changedKeys` indexes straight into it.
- **No listener re-attachment.** DOM nodes are never destroyed by an update, so listeners, focus, scroll position, text selection, and CSS transitions all survive. This is the exact failure mode of `innerHTML` re-rendering recorded as Bottleneck #1.
- **Minimal work.** A `Tick` touches one text node. `statusLabel`, `visualState`, and both `disabled` writers are not consulted because `running` did not change.

### 28.2 Usage

```html
<link rel="stylesheet" href="./dist/Timer.css">
<div id="app"></div>
<script type="module">
  import { mount } from "./dist/Timer.js";
  const timer = mount(document.querySelector("#app"), {
    props: { label: "Session timer", limitSeconds: 1800 }
  });
</script>
```

ES modules, DOM APIs, `addEventListener`, CSS, semantic HTML. No React, no Vue, no Svelte runtime, no Node at runtime.

---

## 29. EBNF

ISO-style EBNF. `=` defines, `,` concatenates, `|` alternates, `{ }` zero-or-more, `[ ]` optional, `( )` groups, `-` excludes, terminals quoted. LL(1) at every decision point after tokenisation; implementable by hand-written recursive descent.

### 29.1 File and sections

```ebnf
ObixFile            = { WS }, { StyleSection, { WS } },
                      TemplateSection, { WS },
                      [ ScriptSection ], { WS }, EOF ;

StyleSection        = "<style",    { SectionAttribute }, ">", StyleBody,    "</style>" ;
TemplateSection     = "<template", ">",                      TemplateBody, "</template>" ;
ScriptSection       = "<script",   { SectionAttribute }, ">", ScriptBody,   "</script>" ;

SectionAttribute    = WS+, AttrName, "=", '"', AttrValue, '"' ;

StyleBody           = { AnyChar - "</style>" } ;     (* delegated to a CSS parser  *)
ScriptBody          = { AnyChar - "</script>" } ;    (* delegated to an ES parser  *)
TemplateBody        = { TemplateNode } ;
```

### 29.2 Template nodes

```ebnf
TemplateNode        = Element | ComponentReference | SlotElement | TextRun | Comment ;

Element             = "<", ElementName, { WS+, Attribute }, { WS },
                      ( "/>" | ">", { TemplateNode }, "</", ElementName, ">" ) ;

ComponentReference  = "<", ComponentName, { WS+, Attribute }, { WS },
                      ( "/>" | ">", { TemplateNode }, "</", ComponentName, ">" ) ;

SlotElement         = "<slot", [ WS+, "name", "=", '"', Identifier, '"' ], { WS },
                      ( "/>" | ">", { TemplateNode }, "</slot>" ) ;

ElementName         = LowerLetter, { LowerLetter | Digit | "-" } ;
ComponentName       = UpperLetter, { Letter | Digit } ;
Comment             = "<!--", { AnyChar - "-->" }, "-->" ;

TextRun             = TextChunk, { TextChunk } ;
TextChunk           = Interpolation | LiteralText ;
LiteralText         = ( AnyChar - "<" - "{" | EscapedBrace )+ ;
EscapedBrace        = "\{" | "\}" ;
```

### 29.3 Attributes, bindings, directives

```ebnf
Attribute           = EventBinding | StructuralDirective | NormalAttribute ;

NormalAttribute     = AttrName, [ "=", '"', AttributeValue, '"' ] ;
AttrName            = ( Letter | "_" ), { Letter | Digit | "-" | "_" | ":" } ;
AttributeValue      = { AttrChunk } ;
AttrChunk           = Interpolation | AttrLiteral ;
AttrLiteral         = ( AnyChar - '"' - "{" | EscapedBrace )+ ;

Interpolation       = "{", { WS }, Path, { WS }, "}" ;

Path                = [ Namespace, "." ], Identifier, { PathSegment } ;
Namespace           = "state" | "props" | "derived" ;
PathSegment         = ".", Identifier | ".", DigitSequence | "[", DigitSequence, "]" ;

EventBinding        = "on:", EventType, { ".", Modifier }, "=", '"', ActionCall, '"' ;
EventType           = LowerLetter, { LowerLetter | Digit | "-" } ;
Modifier            = "prevent" | "stop" | "once" | "capture" ;

ActionCall          = ActionName, [ { WS }, "(", { WS }, [ ArgumentList ], { WS }, ")" ] ;
ActionName          = UpperLetter, { Letter | Digit } ;
ArgumentList        = Argument, { { WS }, ",", { WS }, Argument } ;
Argument            = EventAccessor | Path | Literal ;
EventAccessor       = "event.", ( "value" | "checked" | "key" | "files"
                                | "detail" | "x" | "y" | "index" ) ;

StructuralDirective = ConditionalDirective | IterationDirective
                    | KeyDirective | SlotDirective ;

ConditionalDirective= "obix:if",      "=", '"', Path, '"'
                    | "obix:else-if", "=", '"', Path, '"'
                    | "obix:else" ;
IterationDirective  = "obix:for", "=", '"', LoopHeader, '"' ;
LoopHeader          = Identifier, [ { WS }, ",", { WS }, Identifier ], WS+, "of", WS+, Path ;
KeyDirective        = "obix:key",  "=", '"', Path, '"' ;
SlotDirective       = "obix:slot", "=", '"', Identifier, '"' ;
```

### 29.4 Lexical

```ebnf
Identifier          = ( Letter | "_" ), { Letter | Digit | "_" } ;
Letter              = UpperLetter | LowerLetter ;
UpperLetter         = "A" | … | "Z" ;
LowerLetter         = "a" | … | "z" ;
Digit               = "0" | … | "9" ;
DigitSequence       = Digit, { Digit } ;
WS                  = " " | "\t" | "\r" | "\n" ;

Literal             = StringLiteral | NumberLiteral | BooleanLiteral | NullLiteral ;
StringLiteral       = "'", { AnyChar - "'" }, "'" ;
NumberLiteral       = [ "-" ], DigitSequence, [ ".", DigitSequence ] ;
BooleanLiteral      = "true" | "false" ;
NullLiteral         = "null" ;
```

String literals in attribute values use single quotes because the attribute is double-quoted: `on:click="SetMode('dark')"`.

### 29.5 Behavioural test DSL — `Component.test.obix`

```ebnf
TestSuite           = { ImportStatement }, "suite", ComponentName, "{", { TestBlock }, "}" ;

TestBlock           = "test", Identifier, [ "through", Projection ],
                      "{", { TestStatement }, "}" ;
Projection          = "data" | "functional" | "oop" | "reactive" ;

TestStatement       = GivenStatement | DispatchStatement | AdvanceStatement
                    | SubscribeStatement | ExpectStatement ;

GivenStatement      = "given", ( "state" | "props" ), ObjectLiteral ;
DispatchStatement   = "dispatch", ActionName, [ "(", [ ArgumentList ], ")" ] ;
AdvanceStatement    = "advance", DigitSequence, "ms" ;
SubscribeStatement  = "subscribe" ;

ExpectStatement     = "expect", Subject, Predicate
                    | "expect", "no", "mutation"
                    | "expect", "render", "contains", StringLiteral
                    | "expect", "assigning", "state", "throws" ;

Subject             = "state", { PathSegment }
                    | "derived", ".", Identifier
                    | "props",   ".", Identifier
                    | "validation", [ ".", Identifier ]
                    | "notification", ".", Identifier
                    | "notifications" | "transitions" | "render" ;

Predicate           = "is", ( Literal | ObjectLiteral | ArrayLiteral
                            | "initial" | "serializable" | "unchanged" )
                    | "is", ( "greater" | "less" ), "than", NumberLiteral
                    | "contains", ( StringLiteral | Identifier )
                    | "is", "empty"
                    | "has", "length", DigitSequence ;
```

### 29.6 Conformance contract DSL — `Component.obix.test`

```ebnf
ContractFile        = "contract", ComponentName, "from", StringLiteral, { ContractBlock } ;

ContractBlock       = DopBlock | SerializationBlock | DeterminismBlock | EquivalenceBlock
                    | TemplateBlock | EventsBlock | ElementBlock | RegionBlock
                    | AnnounceBlock ;

DopBlock            = "dop", "{", { DopDecl }, "}" ;
DopDecl             = "prop",    Identifier, ":", TypeName, [ "=", Literal ]
                    | "state",   Identifier, ":", TypeName, [ "=", Literal ]
                    | "action",  ActionName, [ "arity", DigitSequence ]
                    | "derived", Identifier, ":", TypeName
                    | "effect",  Identifier, EffectSpec
                    | "expect",  "core", "{", "state", ",", "actions", ",", "render", "}"
                    | "expect",  ( "artifact" | "initialState" ), "frozen" ;
EffectSpec          = ( "every" | "after" ), DigitSequence, "dispatches", ActionName
                    | "on", StringLiteral, "dispatches", ActionName ;
TypeName            = "string" | "number" | "boolean" | "array" | "object"
                    | "function" | "null" ;

SerializationBlock  = "serialization", "{", { SerializationStatement }, "}" ;
SerializationStatement
                    = [ "for", "any", "state", ":" ], "expect", Subject, "is", "serializable"
                    | "expect", "roundtrip", "json"
                    | "expect", "descriptors", "serializable" ;

DeterminismBlock    = "determinism", "{", { DeterminismStatement }, "}" ;
DeterminismStatement= "for", "any", "action", ",", "any", "state", ":",
                      "expect", ( "twice-identical" | "no", "mutation", "of", "input" )
                    | "expect", ActionName, "identity", "when", Identifier, BooleanLiteral ;

EquivalenceBlock    = "equivalence", "{",
                        "adapters", "[", Projection, { ",", Projection }, "]",
                        { EquivalenceStatement },
                      "}" ;
EquivalenceStatement= "trace", "[", ActionName, { ",", ActionName }, "]",
                        "expect", "state", ObjectLiteral
                    | "generate", "traces", "depth", DigitSequence
                    | "expect", ( "state" | "derived" | "render" | "validation" ),
                      "equivalent", [ "after", "every", "step" ] ;

TemplateBlock       = "template", "{", { TemplateStatement }, "}" ;
TemplateStatement   = "expect", "single-root"
                    | "expect", "all", "bindings", "resolved"
                    | "expect", "no", "unresolved", "names"
                    | "expect", "render", "matches", "dom"
                    | "expect", "scoped", "styles", "unchanged", "across", "adapters" ;

EventsBlock         = "events", "{", { EventStatement }, "}" ;
EventStatement      = "expect", EventType, "on", Identifier, "dispatches", ActionName
                    | "expect", "no", "payload", "leaks", "dom"
                    | "expect", "listeners", "removed", "on", "unmount" ;

ElementBlock        = "element", Identifier, "{", SelectStatement,
                      { ContractStatement | TestStatement }, "}" ;
SelectStatement     = "select", "role", StringLiteral, [ "name", StringLiteral ] ;

ContractStatement   = "expect", "aria-", Identifier, StringLiteral
                    | "expect", "name", ( "from", NameSource | StringLiteral )
                    | "expect", [ "not" ], "focusable"
                    | "expect", "focus-visible"
                    | "expect", "disabled", BooleanLiteral
                    | "expect", "touch-target", DigitSequence, "x", DigitSequence
                    | "expect", "contrast", NumberLiteral
                    | "expect", "text", [ "matches" ], StringLiteral
                    | "expect", "keyboard", KeyName, "dispatches", ActionName
                    | "expect", "keyboard", KeyName, "moves-focus-to", Identifier ;
NameSource          = "content" | "label" | "aria" ;
KeyName             = "Enter" | "Space" | "Escape" | "Tab" | "Home" | "End"
                    | "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | Identifier ;

RegionBlock         = "region", Identifier, "{", { RegionStatement }, "}" ;
RegionStatement     = "expect", "tab-order", "[", Identifier, { ",", Identifier }, "]"
                    | "expect", "heading-order", "valid"
                    | "expect", "no", "positive-tabindex"
                    | "expect", "landmark", BooleanLiteral
                    | "expect", "contrast", NumberLiteral ;

AnnounceBlock       = "announce", "{", { TestStatement },
                      "expect", "live-region", Identifier, "announces", StringLiteral, "}" ;
```

### 29.7 Grammar properties

- **Element vs component**: decided by the first character after `<`. One character of lookahead.
- **Literal text vs binding**: decided by `{`, escaped as `\{`. One character of lookahead.
- **No expression grammar in templates**: `Path` is a straight-line production with no recursion into operators. There is no precedence table because there are no operators. This is what makes static accessibility analysis, dependency graphing, and DOM-free rendering possible.
- **JavaScript is never forked**: `ScriptBody` is delegated to a standard ES parser.

---

## 30. AST schema

```
ObixComponent {
  name            : string                  // filename stem
  filename        : string
  scopeToken      : string                  // "Timer" | "Timer-a3f1"

  style : StyleSection[] {
    lang          : "css" | "scss"
    type          : "scoped" | "global"
    source        : string
    rules         : CssRule[]               // selector granularity + computed minBox
    span          : Span
  }

  template : TemplateSection {
    nodes         : TemplateNode[]          // multiple roots permitted
    bindings      : BindingRecord[]         // flattened, id-addressed
    events        : EventBinding[]
    span          : Span
  }

  dop : DopSection {
    initialState  : StateDecl[]
    actions       : ActionDecl[]
    derived       : DerivedDecl[]
    validation    : ValidationDecl
    effects       : EffectDecl[]
    props         : PropDecl[]
  }

  contracts : ContractSection | null        // parsed Component.obix.test, if present
  imports   : ImportDecl[]
  accessibility : A11yModel
  metadata  : { obixVersion, source, compiledAt, checksum, actionModel }
  diagnostics : Diagnostic[]
  sourceMap : SourceMapIndex
}
```

The separation the mandate requires is visible in the shape: **`style` is presentation, `template` is representation, `dop` is data and behaviour, and no node anywhere names a paradigm.**

### 30.1 Template node types

```
TemplateNode = Element | Component | Text | Interpolation
             | Conditional | Loop | Slot | Comment

Element      { kind, tag, attributes, events, children, selfClosing, a11y, span }
Component    { kind, tag, resolvedFrom, props, events, slotContent, span }
Text         { kind, value, span }
Interpolation{ kind, path, bindingId, span }
Conditional  { kind, branches : [ { test : Path|null, node } ], anchorId, span }
Loop         { kind, itemName, indexName, source : Path, key : Path,
               node, anchorId, scope, span }
Slot         { kind, name, fallback, span }

Attribute    { kind, name, value : AttributeValue, isBoolean, isAria, span }
AttributeValue = LiteralValue { text }
               | BoundValue   { path, bindingId }
               | MixedValue   { parts, bindingId }

EventBinding { kind, event, modifiers, action, args : EventArg[], delegated, span }
EventArg     = EventAccessor { accessor } | PathArg { path } | LiteralArg { value }

Path         { head, segments, namespace : "loop"|"props"|"derived"|"state",
               qualified, span }
```

### 30.2 DOP declaration nodes

```
PropDecl       { name, defaultValue, inferredType, span }
StateDecl      { name, initialValue, valueType, serializable : boolean, span }
ActionDecl     { name, arity, paramNames, purity : PurityReport, identityPaths, span }
DerivedDecl    { name, stateDeps : string[] | "*", propDeps : string[] | "*", span }
EffectDecl     { name, kind : "every"|"after"|"on", value,
                 whileDeps : string[] | null, dispatch, args, span }
ValidationDecl { props : RuleMap, state : RuleMap,
                 rules : { [name]: { deps, message, span } } }
ImportDecl     { local, source, isObixComponent : boolean, span }

BindingRecord  { id, kind, target : NodePath,
                 read : { ns, name } , stateDeps, propDeps }
```

### 30.3 Accessibility model

```
A11yModel {
  nodes       : A11yNode[]
  tabOrder    : string[]
  headings    : { level, nodeId }[]
  liveRegions : { nodeId, politeness, atomic }[]
  idRefs      : { from, attribute, to, resolved }[]
}

A11yNode {
  nodeId, role, roleImplicit,
  name        : { text : string | Path | null, source },
  description, focusable, tabindex,
  states      : { attribute, read : { ns, name } }[],
  keyboard    : { key, action }[],
  minBox      : { width, height } | null
}
```

**The AST can produce the neutral DOP artifact directly**: `dop` + `template.bindings` + `events` + `style.rules` + `accessibility` + `metadata` is exactly §24's artifact, with no paradigm information anywhere in the tree.

---

## 31. Compiler pipeline

```
PascalCase.obix
    │
    ▼
[1]  section scanner              → raw sections, spans, attributes
    │                               OBIX-F0xx (order, count, unclosed)
    ▼
[2]  parallel parse
     ├── style parser             → CssRule[]
     ├── template parser          → TemplateNode[]      (recursive descent, §29)
     └── script parser            → ESTree Program      (standard ES parser)
    │
    ▼
[3]  declaration extraction       → props, state, actions, derived,
    │                               validation, effects, imports
    │                               OBIX-J0xx (export, let, non-literal)
    ▼
[4]  unified OBIX AST             → ObixComponent (§30)
    │
    ▼
[5]  DOP semantic analysis
     ├── name resolution          → every Path assigned a namespace   OBIX-T030/031/032
     ├── serializable state                                            OBIX-J020/021
     ├── purity lint (actions, derived, predicates)                    OBIX-J030..036
     ├── closed key set                                                OBIX-J022
     ├── action existence + arity                                      OBIX-T092/093
     ├── validation descriptor well-formedness                         OBIX-V0xx
     └── cross-file prop checking                                      OBIX-T070
    │
    ▼
[6]  CANONICAL DOP IR             ← ***business logic is complete here***
    │                               paradigm-free, DOM-free, frozen
    ▼
[7]  dependency analysis          → DERIVED_DEPS, binding stateDeps/propDeps
    │                               destructuring-based (§9.2)
    ▼
[8]  template binding compilation → static markup + BindingRecord[] + event descriptors
    │
    ▼
[9]  accessibility analysis       → A11yModel                          OBIX-A0xx
    │
    ▼
[10] contract validation          → Component.obix.test `dop {}` vs the real IR
    │                               OBIX-C0xx (surface drift)
    ▼
[11] code generation
     ├── DOP artifact module      (§24)
     ├── string renderer          (pure, from template descriptor)
     ├── native DOM binder        (§28, from the same descriptor)
     ├── adapter generation       (toData / toFunctional / toOOP / toReactive / toNative)
     └── scoped CSS               (§3.4)
    │
    ▼
dist/Timer.js    dist/Timer.css    [dist/Timer.d.ts]    [*.map]
```

### 31.1 The pipeline invariant

> **Business logic reaches the DOP IR before any paradigm adaptation occurs.**

Stage 6 is the boundary. Everything before it is about *what the component is*; everything after it is about *how a consumer sees it*. No stage after 6 may introduce, alter, or specialise behaviour. This is checkable mechanically: stages 7–11 never write to `actions`, `derived`, or `initialState`.

### 31.2 Notes

**Two-phase build.** Files parse and extract independently (stages 1–4); validation and generation need sibling ASTs for cross-file prop checks and contract validation. This is what makes an unknown prop a compile error rather than a runtime warning.

**Stage 7 is where the performance claim is earned.** By the end of it the compiler knows, for every state key, the exact set of DOM operations it can cause. Nothing is discovered at runtime. This is the tennis-tracker state-minimisation principle applied to rendering: enumerate only the transitions that exist and never pay for a path that cannot be taken.

**Two emitters, one descriptor.** The string renderer and the DOM binder are generated from the same `template` descriptor and therefore cannot drift.

**Adapters are generated once, not per component.** `toFunctional`, `toOOP`, `toReactive` are library functions parameterised by the artifact (§15–17). Stage 11 emits a `mount` that wires the binding table; it does not emit four copies of the component.

### 31.3 CLI

```bash
obixc build src --out dist                 # compile to DOP artifact + adapters + CSS
obixc build src --out dist --css=inline    # inline stylesheet in the JS module
obixc test src                             # *.test.obix — Layers 0–2, headless, virtual clock
obixc verify src                           # *.obix.test — Layer 3 + equivalence — RELEASE GATE
obixc verify src --equivalence             # equivalence only, generated traces
obixc check src                            # diagnostics only, no emit
obixc migrate src --from-legacy            # codemod, §32
obixc explain OBIX-T030                    # long-form diagnostic docs
```

`nlink → polybuild` orchestration invokes `build` then `verify`; a failing contract stops the artifact from advancing.

---

## 32. Compatibility strategy for the existing DOPAdapter prototype

**The prototype must not break.** `ButtonLogic.js` and any component written against it stay consumable.

### 32.1 The shim

```js
import { fromLegacy } from "@obinexusltd/obix-dop";
import ButtonLogic from "./components/ButtonLogic.js";

const ButtonDOP = fromLegacy(ButtonLogic);   // → a full OBIX 1.0 DOP artifact
```

```js
export function fromLegacy(logic, options = {}) {
  const clone = options.clone ?? ((v) => structuredClone(v));
  const actions = {};

  for (const [name, fn] of Object.entries(logic.actions || {})) {
    const Pascal = name[0].toUpperCase() + name.slice(1);

    actions[Pascal] = (state, ...args) => {
      const ctx = { state: clone(state) };            // isolated mutable context
      for (const sibling of Object.keys(logic.actions)) {
        ctx[sibling] = (...a) => logic.actions[sibling](ctx, ...a);
      }
      const returned = fn(ctx, ...args);

      // dual-mode detection, per call:
      //   Model B → returns a state object      → use it
      //   Model A → returns undefined, mutated  → use the mutated clone
      return Object.freeze(
        returned && typeof returned === "object" ? returned : ctx.state);
    };
  }

  return createDOP({
    name: logic.name,
    initialState: Object.freeze(clone(logic.state)),
    actions,
    derived: logic.derived ?? {},
    render: (state, props) => logic.render({ state, props }),  // ctx → state
    props: logic.props ?? {},
    validation: logic.validation ?? { props: {}, state: {}, rules: {} },
    metadata: { actionModel: "context", legacy: true, source: logic.name }
  });
}
```

### 32.2 Verified against the real prototype

Run against the uploaded `ButtonLogic.js` unmodified:

```
initial      : {"clicked":false}  <button>OFF</button>
after Toggle : {"clicked":true}   <button>ON</button>
prev intact  : {"clicked":false}          ← immutability recovered
source intact: {"clicked":false}          ← declaration never corrupted
trace result : {"clicked":true}   <button>ON</button>
```

A Model A component now satisfies Model B semantics — previous states survive, transitions are values, and the artifact is safe to hand to all four adapters. **The functional projection gains the capability §0.1 measured it as lacking**, without editing one line of `ButtonLogic.js`.

### 32.3 Rules

**L1 — Dual-mode detection is per call, not per component.** An action that returns a state object is treated as Model B; one that returns `undefined` after mutating `ctx.state` is treated as Model A. A component may mix the two during migration; `metadata.actionModel` records `"immutable"`, `"context"`, or `"mixed"`.

**L2 — Legacy context is isolated per call.** The clone means a Model A action can never reach the caller's state object. The mutation-coupling described in §0.2 stops at the shim boundary; nothing above it knows the action mutated anything.

**L3 — Sibling actions still work.** Legacy actions that call each other through `ctx` keep working: the context exposes bound siblings that share the same clone.

**L4 — Legacy render signature is adapted.** `render(ctx)` becomes `render(state, props)` by passing `{ state, props }`. Existing render bodies reading `ctx.state.x` are unchanged.

**L5 — Name normalisation.** camelCase legacy action names are exposed as PascalCase (`toggle` → `Toggle`) to satisfy J22, and the original name is kept as an alias so existing call sites keep working. Aliases are recorded in `metadata.aliases`.

**L6 — Diagnostics, not silence.** `OBIX-L001` (info): "component uses the context-mutation action model; run `obixc migrate` to convert." `OBIX-L002` (warning): the shim's structural clone costs a copy per dispatch, which is fine for a button and measurable for a large list.

**L7 — Support window.** Model A is supported throughout OBIX 1.x. It is not the canonical model and does not participate in compile-time purity analysis — the shim guarantees *isolation*, not purity, and a legacy action calling `fetch` is still a legacy action calling `fetch`. Adapter Equivalence still holds for shimmed artifacts because all four projections consume the same wrapped actions.

**L8 — Codemod.** `obixc migrate --from-legacy` rewrites the mechanical cases:

```js
// before
toggle: (ctx) => { ctx.state.clicked = !ctx.state.clicked; }
// after
Toggle(state) { return { ...state, clicked: !state.clicked }; }
```

Single-assignment mutations convert automatically; multi-statement bodies, loops, and conditional mutation are flagged for review rather than guessed at.

### 32.4 What the prototype contributed, kept intact

| Prototype idea | Status in OBIX 1.0 |
|---|---|
| Component logic is declarative data | **Canonical.** The DOP artifact. |
| `{ name, state, actions, render }` | **Canonical.** The minimal required core (§6.2). |
| One declaration, many projections | **Canonical**, extended from 2 to 5 projections. |
| `new DOPAdapter(logic)` | **Preserved** as the adapter's constructor signature. |
| `toFunctional()` / `toOOP()` | **Preserved by name**, made equivalent (§18). |
| Separation of data from paradigm | **Canonical**, and now enforced by the pipeline invariant (§31.1). |
| `ctx` mutation | **Superseded**, shimmed, never broken. |
| Functional projection as a one-shot string | **Fixed** — §15's namespace + closure model. |

---

## 33. Unresolved design questions

**Q1 — Child → parent semantic events.** Native bubbling covers `click` reaching a parent; it does not cover "the child finished loading". A pure action cannot dispatch a `CustomEvent`. Candidates: (a) actions return `[nextState, emissions]` — expressive, but complicates every signature, every test assertion, and the equivalence statement; (b) a declarative `const emits = { done: { when: ({ finished }) => finished } }`, where the projection dispatches a `CustomEvent` on a predicate transition, leaving actions untouched. (b) matches the `effects` model already adopted and is the front-runner. **Blocking:** whether emissions need payloads richer than a state snapshot.

**Q2 — Asynchronous data.** A `request` effect kind needs pending/success/error states, cancellation on unmount, and race resolution. **Blocking:** whether OBIX should own request lifecycle at all, or whether data belongs above the component in an OBIXverse application shell. Deciding this wrongly puts a network stack inside a UI language.

**Q3 — Prop spreading.** `<Child {...config} />` is convenient and defeats static prop checking (T70). Options: forbid (current position), or permit only where the spread source is a statically analysable literal. **Blocking:** real usage data.

**Q4 — `type="module"` styles.** Reserved (§3.3). Reopens only if attribute scoping proves insufficient — most plausibly for dynamic class selection from state, which a `class:name="{path}"` directive might address without CSS Modules at all. **Blocking:** a concrete failing case.

**Q5 — Two-way binding sugar.** `bind:value="email"` would compile to exactly `value="{email}" on:input="SetEmail(event.value)"`. Pure sugar, no new semantics — but a third directive prefix, and a name that in other frameworks implies mutation, which OBIX does not have. **Blocking:** naming, and whether the verbosity is a real problem.

**Q6 — Nested state granularity.** J13 compares top-level keys. For deep state (`settings.audio.volume`), any change re-runs every binding under `settings`. Options: path-level diffing at declared depth, or a flat-state convention. **Blocking:** measurement — this may never cost anything.

**Q7 — Equivalence under effects.** §18.4 scopes equivalence to explicit traces because Data and Functional are inert. An alternative is a *virtual scheduler in every projection*, making effect-driven traces equivalent across all four. That would make the invariant stronger and the pure projections less pure. **Blocking:** whether anyone needs effect equivalence outside the two scheduling projections.

**Q8 — Adapter for a fifth paradigm.** Signals, streams (RxJS-style), and actor mailboxes are all expressible over the same artifact. Adding `toStream()` or `toSignal()` costs nothing architecturally — the question is whether shipping them invites the "another framework layer" drift §6.5 forbids. **Blocking:** demand.

**Q9 — Contract inheritance.** Should `AccessibleButton.obix.test` `extends "./BaseButton.obix.test"` so a component family shares one accessibility contract? Attractive for the existing 30-component library; adds a resolution order to the contract format. **Blocking:** whether those 30 components genuinely share contract shape or only appear to.

**Q10 — Legacy interop, the other direction.** A compiled `.obix` artifact is shape-compatible with hand-written DOP modules, so `.obix` output drops into today's runtime. The reverse — using a legacy component as a `<Tag />` in a template — needs a declared prop surface the old components lack. Candidate: generate a `dop {}` contract block per legacy component, which would also retrofit the contract layer onto the existing library. **Blocking:** effort estimate across 30 components.

**Q11 — Cross-language DOP artifacts.** The descriptor half (§6.3) is JSON; the executable half is JavaScript. A polyglot binding could consume descriptors today but would need actions in its own language, which raises the question of whether action semantics should have a language-neutral definition (a small transition IR) or stay JavaScript. **Blocking:** whether a non-JS consumer actually needs to *execute* transitions rather than observe them.

---

## Appendix A — Summary of decisions

| Question | Decision |
|---|---|
| Canonical representation | The **DOP IR**. Paradigm-free, DOM-free, frozen. |
| Minimal core | `{ state, actions, render }` — the prototype's triad, unchanged. |
| What belongs in the IR | Plain data, or pure functions of `(state, props)`. Nothing else. |
| Component identity | Filename only. No `component Timer` declaration. |
| Section order | Fixed: style, template, script. |
| Script syntax | Ordinary ES6 `const` declarations recognised by name. No bespoke JS syntax, ever. |
| Recognised bindings | `props`, `state`, `actions`, `derived`, `validation`, `effects`. |
| Action model | **Model B (immutable)** canonical; Model A shimmed and never broken. |
| Impure work | Declarative `effects` descriptors; handles live in the projection, never the artifact. |
| Derived dependencies | Declared by destructuring the state/props parameters. |
| `{formattedTime}` | Resolves through the artifact to `derived.formattedTime(state, props)`, statically, collisions as errors. |
| Validation | A DOP descriptor with a closed rule vocabulary + pure predicates. Available before paradigm choice. |
| Event payload | `on:input="SetValue(event.value)"` — a closed accessor table; the raw `Event` is unreachable from templates. |
| Projections | `toData`, `toFunctional`, `toOOP`, `toReactive`, `toNative`. |
| Functional model | Pure namespace, plus `create()` closure defined in terms of it. |
| OOP model | Generated class; every method a three-token delegation to `dispatch`. |
| Reactive model | Subscriber set + effect scheduler over the same `dop.actions` call. |
| Core invariant | **Adapter Equivalence** (`≅`) — four projections, identical state after every step of any trace. |
| Rendering | Compiler-generated direct DOM bindings from the IR's binding table. No virtual DOM. |
| Tests | Layer 0 DOP transitions (hand-written) → Layer 1 equivalence (**generated**) → Layer 2 render → Layer 3 conformance. |
| Test artifacts | `.test.obix` behavioural (may be red); `.obix.test` conformance (publication gate). |
| Accessibility | A DOP descriptor; compile-time diagnostics; FUD policies become compiler passes. |
| Architecture depth | artifact → adapter → consumer. One hop. No third layer. |

## Appendix B — The invariant, in one line

```
Timer.obix  →  TimerDOP  →  { Data | Functional | OOP | Reactive }  →  DOM
```

There is one `Timer`. There are several ways to consume it. A component does not become functional, object-oriented, or reactive until after its DOP representation exists — and once it does, every projection is provably the same component.

**Data first. Paradigm second.**

---

*OBIX — Obi, the heart. The interface is the heart of the system, and the heart does not change shape depending on who is looking at it.*

**OBINexus Computing — Nnamdi Michael Okpala — 28 August 2026**
