# OBIX 1.0 — Draft 0.2.1, Addendum A

**Timer terminal semantics: what `running` means at the limit**

| Field | Value |
|---|---|
| Document | Draft 0.2.1 Addendum A — Timer fixture terminal semantics |
| Date | 28 August 2026 |
| Amends | `Timer.obix` golden fixture (Draft 0.2.1 §4.5, §9), and AM-4.9 |
| Scope | One component-domain semantic decision. No language change. No new features. |
| Status | Final decision before fixture freeze |

---

## 1. The question

At `seconds === limitSeconds`, is the timer `running: true` (the user asked for it to run) or `running: false` (it is actually progressing)?

| | Model A — *requested* | Model B — *progressing* |
|---|---|---|
| Terminal state | `{ seconds: 5, running: true }` | `{ seconds: 5, running: false }` |
| Current fixture | ✅ this one | |

**Decision: Model B**, in a refined form. The reviewer's preference is correct, and the reason is stronger than "the state machine says what the UI is doing" — under Model A the accessible status is a lie. But the proposed implementation has two defects that would have been frozen into the golden fixture, so the form matters as much as the choice.

---

## 2. Executed comparison

Three implementations run head to head: Model A (current fixture), Model B *naive* (the clamping version as proposed), Model B *refined* (adopted).

```
=== 1. terminal state after Start + 8 Tick (limit 5) ===
Model A          {"seconds":5,"running":true}   transitions: 6
Model B naive    {"seconds":5,"running":false}  transitions: 6
Model B refined  {"seconds":5,"running":false}  transitions: 6

=== 2. THE TRAP: user presses Start at the limit, then one Tick ===
Model A          Start -> {"seconds":5,"running":true}   Tick -> {"seconds":5,"running":true}   Start is identity: true
Model B naive    Start -> {"seconds":5,"running":true}   Tick -> {"seconds":5,"running":false}  Start is identity: false
Model B refined  Start -> {"seconds":5,"running":false}  Tick -> {"seconds":5,"running":false}  Start is identity: true

=== 3. is the Start button truthful? (disabled="{running}") ===
Model A          state: {"seconds":5,"running":true}   disabled={running}: true   disabled={cannotStart}: true
Model B refined  state: {"seconds":5,"running":false}  disabled={running}: false  disabled={cannotStart}: true

=== 4. what the live region announces at the limit ===
Model A          statusLabel(old): Running    statusLabel(new): Running
Model B refined  statusLabel(old): Paused     statusLabel(new): Finished

=== 5. monotonicity: restored state above the limit (seconds 8, limit 5) ===
Model A          Tick -> {"seconds":8,"running":true}   decreased seconds: false
Model B naive    Tick -> {"seconds":5,"running":false}  decreased seconds: TRUE
Model B refined  Tick -> {"seconds":8,"running":false}  decreased seconds: false

=== 6. effect predicate needed to reach quiescence ===
Model A  while:{running}          -> { fired: 50, stopped: false, state: {"seconds":5,"running":true} }
Model A  while:{running&&<limit}  -> { fired: 5,  stopped: true,  state: {"seconds":5,"running":true} }
Model B  while:{running}          -> { fired: 5,  stopped: true,  state: {"seconds":5,"running":false} }
```

---

## 3. What the run establishes

### 3.1 Model A's real cost is accessibility, not tidiness (block 4)

At the limit, Model A's `statusLabel` returns **"Running"** — permanently, for a timer that will never advance again. That string sits in an `aria-live="polite"` region. A screen-reader user is told the timer is running when it has finished; a sighted user sees the hint text and can reconcile it, an assistive-technology user cannot. **No revision of `statusLabel` fixes this under Model A**, because the state genuinely says `running: true` and a derived value must not contradict its own state. The row `statusLabel(new): Running` shows the improved derived function still returning the wrong answer when handed Model A's state.

That is decisive on its own for a language whose first pillar is accessibility. The state machine must not be able to describe itself falsely.

### 3.2 Model B naive introduces a phantom control (block 2)

This is the defect that would have shipped. Under Model B, at the limit `running: false`, so the existing binding `disabled="{running}"` **enables the Start button**. The user presses it:

```
Start -> {"seconds":5,"running":true}     ← appears to start
Tick  -> {"seconds":5,"running":false}    ← bounces back one second later
```

`Start is identity: false` — the action really did transition, so subscribers fire, the DOM updates, the button visibly changes state, and then it all reverts. A control that appears operable and does nothing is a WCAG failure and precisely the "uncertainty" the FUD policy layer exists to prevent. Model A avoids this only by accident: `running: true` keeps the button disabled.

**Changing the terminal state therefore forces a companion change to the Start binding.** That coupling is the whole finding.

### 3.3 Model B naive lets `Tick` decrease the counter (block 5)

Given a restored session where `limitSeconds` has been lowered — `{ seconds: 8 }` against `limitSeconds: 5` — the clamping form returns `{"seconds":5}`. An action named `Tick` decremented the clock by three. That breaks a property worth keeping as a stated invariant:

> **`Tick` never decreases `seconds`.**

Model B refined stops the timer without touching `seconds` (`{"seconds":8,"running":false}`), leaving the out-of-range value visible for the validation layer to report rather than silently rewriting the user's data.

### 3.4 Model B removes the compound effect predicate (block 6)

Draft 0.2.1 AM-4.9 offered a compound predicate as an optimisation:

```js
while: ({ running, seconds }, { limitSeconds }) => running && seconds < limitSeconds
```

Under Model A it is not optional — with the simple predicate the effect fires forever (`fired: 50, stopped: false`). Under Model B the simple predicate quiesces by itself:

```js
while: ({ running }) => running        // fired: 5, stopped: true
```

`limitSeconds` now appears in exactly one action and two derived values, and nowhere in the effect. **AM-4.9's compound-predicate guidance is withdrawn** — it was a workaround for Model A's terminal state.

---

## 4. The adopted implementation

```js
const actions = {
    Start(state, _payload, props) {
        if (state.running) return state;
        if (state.seconds >= props.limitSeconds) return state;   // cannot start a finished timer
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

        // repair path: restored state at or beyond a lowered limit — stop, never rewind
        if (state.seconds >= props.limitSeconds) {
            return { ...state, running: false };
        }

        const seconds = state.seconds + 1;

        if (seconds >= props.limitSeconds) {
            return { ...state, seconds, running: false };        // land exactly on the limit
        }

        return { ...state, seconds };
    }
};
```

```js
const derived = {
    formattedTime({ seconds }) {
        const minutes = Math.floor(seconds / 60);
        const remainder = seconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    },

    finished({ running, seconds }, { limitSeconds }) {
        return !running && seconds >= limitSeconds;
    },

    statusLabel({ running, seconds }, { idleText, limitSeconds }) {
        if (!running && seconds >= limitSeconds) return "Finished";
        if (running) return "Running";
        if (seconds > 0) return "Paused";
        return idleText;
    },

    visualState({ running, seconds }, { limitSeconds }) {
        if (!running && seconds >= limitSeconds) return "finished";
        return running ? "running" : "idle";
    },

    cannotStart({ running, seconds }, { limitSeconds }) {
        return running || seconds >= limitSeconds;               // ← Start's disabled binding
    },

    stopped({ running }) {
        return !running;
    },

    atLimit({ seconds }, { limitSeconds }) {
        return seconds >= limitSeconds;
    }
};

const effects = {
    tick: {
        every: 1000,
        while: ({ running }) => running,                          // simple predicate restored
        dispatch: "Tick"
    }
};
```

```html
<button type="button" class="Timer__button"
        on:click="Start" disabled="{cannotStart}">Start</button>

<button type="button" class="Timer__button"
        on:click="Stop"  disabled="{stopped}">Stop</button>

<button type="button" class="Timer__button"
        on:click="Reset">Reset</button>

<p class="Timer__hint" obix:if="finished">
    Time's up. Reset to start again.
</p>
```

**AD-1 — Start does not restart from zero.** At the limit `Start` is identity; `Reset` is the only way forward. A Start that silently means Reset is destructive-by-surprise, and `Reset` is adjacent in the same control group. The hint text says so explicitly, which is also what makes the disabled Start comprehensible rather than mysterious.

**AD-2 — The hint binds to `finished`, not `atLimit`.** `atLimit` is true the instant `seconds` reaches the limit *and* remains true after a Reset-then-Start-to-limit cycle; `finished` additionally requires the timer to have stopped. They coincide under Model B but express different things, and the message ("Reset to start again") is about the terminal state, not the numeric threshold.

---

## 5. Consequences for the frozen fixture

| Artifact | Change |
|---|---|
| `Timer.obix` `<script>` | `Start` guarded; `Tick` two-branch with repair path; `derived` gains `finished`, `cannotStart`; `statusLabel` and `visualState` gain terminal branches; `effects.tick.while` simplified |
| `Timer.obix` `<template>` | Start's `disabled="{running}"` → `disabled="{cannotStart}"`; hint `obix:if="atLimit"` → `obix:if="finished"` with revised text |
| `Timer.css` | add `.Timer__display--finished` (no structural change) |
| Draft 0.2.1 §4.5 | superseded by §4 of this addendum |
| Draft 0.2.1 AM-4.9 | **withdrawn** — the compound `while` predicate was a Model A workaround |
| Draft 0.2.1 §9 IR | `ACTION_DECLS.Start` becomes `{ arity: 3, usesProps: true, propDeps: ["limitSeconds"] }`; `DERIVED_DEPS` gains `finished` and `cannotStart` |
| Adapter Equivalence | **unaffected** — same actions in every projection; re-verified below |

### 5.1 New behavioural cases — `Timer.test.obix`

```
test TerminalStateStopsTheClock {
    given props { limitSeconds: 5 }
    dispatch Start
    advance 8000ms
    expect state.seconds is 5
    expect state.running is false
    expect derived.finished is true
    expect derived.statusLabel is "Finished"
}

test StartIsIdentityAtTheLimit {
    given props { limitSeconds: 5 }
    given state { seconds: 5, running: false }
    dispatch Start
    expect transitions is 0
    expect state.running is false
}

test StartButtonIsDisabledAtTheLimit {
    given props { limitSeconds: 5 }
    given state { seconds: 5, running: false }
    expect derived.cannotStart is true
}

test ResetIsTheWayOut {
    given props { limitSeconds: 5 }
    given state { seconds: 5, running: false }
    dispatch Reset
    dispatch Start
    expect state.running is true
    expect state.seconds is 0
}

test TickNeverDecreasesSeconds {
    given props { limitSeconds: 5 }
    given state { seconds: 8, running: true }
    dispatch Tick
    expect state.seconds is 8
    expect state.running is false
}

test EffectQuiescesWithoutACompoundPredicate {
    given props { limitSeconds: 5 }
    dispatch Start
    advance 20000ms
    expect state.seconds is 5
    expect transitions is 6
}
```

### 5.2 New contract clauses — `Timer.obix.test`

```
dop {
    action Start arity 3 reads props [limitSeconds]
    action Tick  arity 3 reads props [limitSeconds]
    derived finished: boolean
    derived cannotStart: boolean
    effect tick every 1000 dispatches Tick
}

invariant TickIsMonotone {
    for any state: expect Tick state.seconds is not less than state.seconds
}

invariant LimitIsBinding {
    given props { limitSeconds: 5 }
    for any state: expect state.seconds is less than 6
}

invariant TerminalStateIsStopped {
    given props { limitSeconds: 5 }
    for any state where seconds >= 5: expect state.running is false
}

element StartButton {
    select role "button" name "Start"
    given state { seconds: 5, running: false } expect disabled true
    given state { seconds: 0, running: false } expect disabled false
}

announce {
    given props { limitSeconds: 1 }
    dispatch Start
    advance 1000ms
    expect live-region Status announces "Finished"
}
```

`TerminalStateIsStopped` is the invariant that encodes this whole decision. It is false under Model A by construction, so the contract now makes the semantic choice explicit and machine-checked rather than implicit in an action body.

---

## 6. Re-verification

Adapter Equivalence re-run against the adopted implementation, unchanged from Draft 0.2.1 §10 apart from the action bodies:

```
=== Adapter Equivalence: Start -> Tick -> Tick -> Stop ===
data / functional / functional.create / oop / reactive
                     {"seconds":2,"running":false}
all equivalent      : true
step-wise equivalent: true
render equivalent   : true
validation equal    : true

=== terminal: Start + 8 Tick, limitSeconds 5 ===
data / functional / oop / reactive
                     {"seconds":5,"running":false}
finished            : true
statusLabel         : "Finished"
cannotStart         : true
validation          : { valid: true, violations: [] }
transitions         : 6
```

The equivalence invariant is untouched by this change, which is the expected result and worth stating: **a component-domain semantic decision must not be able to affect adapter equivalence.** If it had, the artifact boundary would be leaking.

---

## 7. Scope note

OBIX does not mandate Model A or Model B. Terminal semantics belong to a component's domain contract, not to the language — a stopwatch with no limit never faces the question, and a countdown that auto-restarts would answer it differently.

What the language does mandate is that **the choice be visible**: expressed in actions, exposed through derived values, bound to the controls it affects, and asserted in the conformance contract. The failure mode is not picking Model A; it is picking Model A and leaving `statusLabel` saying "Running" forever with nothing in the build to catch it.

`Timer.obix` is the golden fixture and therefore also the teaching example. It picks Model B, states why in its contract, and demonstrates the coupling between a terminal state and the controls that read it.

---

**Fixture status: ready to freeze.**

**OBINexus Computing — Nnamdi Michael Okpala — 28 August 2026**
