OBIX 1.0 — TDD Native Web Component Syntax
Language Specification (Draft 0.1)
1. Language Philosophy
OBIX is a data-oriented, accessibility-first, test-driven component language for the native web. It compiles to ordinary ECMAScript modules that execute directly in the browser without any framework runtime, virtual DOM, or Node.js dependency in production.
Core Principles
Table
Principle	Meaning
State is plain data	Every component's state is a serializable object. No hidden references, no proxies, no observers.
Actions are pure transitions	Actions take state and return new state. Immutability is guaranteed by the language semantics, not by convention.
Render is deterministic	The same state always produces the same output. Render outputs HTML strings or DOM instructions.
Accessibility is contractual	ARIA roles, labels, keyboard behavior, and focus management are part of the component contract, not afterthoughts.
Tests are source artifacts	Test files are not external scripts. They are first-class artifacts with defined relationships to their components.
Events are web-native	Event syntax maps directly to addEventListener. No synthetic event system.
What OBIX is NOT
Not a JavaScript dialect with a different extension
Not JSX, React, Vue, Svelte, or Angular
Not a framework with a runtime
Not a server-side-only templating language
Not dependent on Node.js, npm, or a bundler in production
2. Lexical Rules
2.1 Character Set
OBIX source files are UTF-8 encoded.
2.2 Tokens
plain
Identifier      = [A-Z] [A-Za-z0-9]*          (* PascalCase for components *)
                | [a-z] [A-Za-z0-9]*          (* camelCase for members *)

Number          = [0-9]+
                | [0-9]+ "." [0-9]+

String          = '"' [^"]* '"'
                | "'" [^']* "'"

Boolean         = "true" | "false"

Keyword         = "component" | "state" | "action" | "view" | "test"
                | "given" | "when" | "expect" | "invariant" | "contract"
                | "pre" | "post" | "unchanged" | "render" | "event"
                | "on" | "appsuite" | "app" | "domain" | "host" | "id"
                | "role" | "label" | "keyboard" | "focusable" | "aria"
                | "function" | "return" | "if" | "else" | "choose"
                | "typeof" | "old" | "or" | "and" | "not"

Operator        = "->" | "<-" | "==" | "!=" | "<=" | ">=" | "<" | ">"
                | "=" | "+" | "-" | "*" | "/" | "%" | "?" | ":"

Punctuation     = "{" | "}" | "(" | ")" | "[" | "]" | "," | "." | ";"

Comment         = "//" [^\n]* "\n"             (* line comment *)
                | "/*" .*? "*/"               (* block comment *)

Whitespace      = " " | "\t" | "\n" | "\r"
2.3 Naming Conventions
Table
Artifact	Convention	Example
Component file	PascalCase.obix	Timer.obix
Component name	PascalCase	Timer
State property	camelCase	seconds, isRunning
Action name	PascalCase	Start, Tick, Reset
View element id	camelCase	timerDisplay, startButton
Helper function	camelCase	formatTime
2.4 File Extensions
Table
Extension	Meaning
.obix	Component source
.test.obix	Behavioral test specification (TDD)
.obix.test	Contract / conformance specification
.obix.lib	Shared library / helper module (optional)
3. Component Syntax (PascalCase.obix)
3.1 Structure
plain
component ComponentName {
    state { ... }
    action ActionName { ... }
    view { ... }
    function helperName(...) { ... }
}
A component has exactly one name, one state block, one view block, zero or more action blocks, and zero or more function blocks.
3.2 State Block
plain
state {
    propertyName: Type = initialValue
    propertyName = initialValue          (* type inferred *)
}
Supported types: number, string, boolean, array, object. Types are optional; the compiler infers from the initial value.
plain
state {
    seconds: number = 0
    running: boolean = false
    label: string = "Timer"
}
3.3 Action Block
Actions declare state transitions using the -> operator.
plain
action ActionName {
    [when condition]
    propertyName -> expression
    propertyName -> expression
}
The when guard is optional. If present, the action is a no-op when the condition is false.
Expressions are limited to:
Arithmetic: +, -, *, /, %
Comparison: ==, !=, <, >, <=, >=
Logical: and, or, not
Ternary: choose(condition, trueExpr, falseExpr)
Property access: propertyName
Literal values
Helper function calls: helperName(args)
plain
action Start {
    running -> true
}

action Stop {
    running -> false
}

action Tick {
    when running
    seconds -> seconds + 1
}

action Reset {
    seconds -> 0
    running -> false
}
3.4 View Block
The view block declares the component's visual structure using a declarative element syntax.
plain
view {
    elementName [identifier] {
        attribute = expression
        attribute = expression
        childElement { ... }
        text = expression
    }
}
Element names are HTML tag names or OBIX semantic element names. The optional identifier creates a reference for event binding and testing.
plain
view {
    section {
        h1 { text = "Timer" }
        
        div timerDisplay {
            role = "timer"
            aria-live = "polite"
            text = formatTime(seconds)
        }
        
        div controls {
            button startStop {
                label = choose(running, "Stop", "Start")
                aria-label = choose(running, "Stop timer", "Start timer")
                on click = choose(running, Stop, Start)
            }
            
            button resetBtn {
                label = "Reset"
                aria-label = "Reset timer"
                on click = Reset
            }
        }
    }
}
View Binding Rules
Table
Syntax	Compiles To
text = expr	Text content interpolation
attribute = expr	HTML attribute
aria-* = expr	ARIA attribute
on event = Action	Event listener mapping
on event "key" = Action	Keyboard event with key filter
3.5 Function Block
Helper functions are pure. They cannot access state directly; state must be passed as arguments.
plain
function formatTime(totalSeconds: number): string {
    minutes = floorDiv(totalSeconds, 60)
    seconds = mod(totalSeconds, 60)
    return padLeft(minutes, 2) + ":" + padLeft(seconds, 2)
}
Functions compile to ordinary JavaScript functions in the module scope.
4. Test Syntax
4.1 Two Test Artifacts: The Distinction
OBIX defines two distinct test artifacts for every component. They are not aliases.
Component.test.obix — Behavioral Specification
Purpose: Developer-facing TDD specification. Describes behavior from the user's perspective.
Audience: Component authors, reviewers, future maintainers.
Content: Given-when-expect scenarios, state transitions, render assertions.
Lifecycle: Written before or alongside the component. Evolves with requirements.
Execution: Run by the OBIX test runner as part of obix test.
Component.obix.test — Contract / Conformance Specification
Purpose: Machine-verifiable contract attached to the component artifact. Describes invariants and contractual guarantees.
Audience: Consumers of the component, tooling, CI/CD pipelines.
Content: Invariants, preconditions, postconditions, accessibility contracts, render contracts.
Lifecycle: Generated from the component and optionally hand-curated. Acts as a portable verification suite.
Execution: Run by the OBIX contract validator. Can be exported and run against any implementation claiming to be Component.
Relationship
plain
Timer.obix          ←── source of truth (component)
    │
    ├── Timer.test.obix      ←── behavioral spec (human-driven TDD)
    │
    └── Timer.obix.test      ←── contract spec (artifact-driven conformance)
Both can coexist. Execution order:
Contract validation (*.obix.test) runs first — fast, static, no browser needed for state tests.
Behavioral tests (*.test.obix) run second — may require browser environment for render and integration tests.
If a component has only one test file, the compiler infers:
.test.obix without .obix.test → behavioral tests only, contract inferred from source
.obix.test without .test.obix → contract tests only, behavior inferred from contract
4.2 Behavioral Test Syntax (*.test.obix)
plain
test ComponentName "description" {
    [layer state|render|integration]
    
    given {
        property = value
        ...
    }
    
    [when ActionName]
    [when event ...]
    
    expect {
        property == value
        property != value
        ...
    }
    
    [expect render { ... }]
}
The optional layer keyword declares the test level. If omitted, the compiler infers from the test body.
State Layer Tests
plain
test Timer "starts from zero" {
    layer state
    
    given {
        seconds = 0
        running = false
    }
    
    when Start
    
    expect {
        running == true
        seconds == 0
    }
}

test Timer "ticks when running" {
    layer state
    
    given {
        seconds = 4
        running = true
    }
    
    when Tick
    
    expect {
        seconds == 5
        running == true
    }
}
Render Layer
