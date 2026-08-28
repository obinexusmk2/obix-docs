/* Model A vs Model B terminal semantics, incl. the Start-at-limit path */

const P = Object.freeze({ limitSeconds: 5, idleText: "Ready" });
const S0 = Object.freeze({ seconds: 0, running: false });

/* ---- Model A: running = user requested running (current fixture) ---- */
const A = {
  Start(s){ if (s.running) return s; return { ...s, running: true }; },
  Stop(s){ if (!s.running) return s; return { ...s, running: false }; },
  Reset(s){ return { ...s, seconds: 0, running: false }; },
  Tick(s, _p, props){
    if (!s.running) return s;
    if (s.seconds >= props.limitSeconds) return s;          // identity at limit
    return { ...s, seconds: s.seconds + 1 };
  }
};

/* ---- Model B as proposed by the reviewer (clamping) ---- */
const B_naive = {
  ...A,
  Tick(s, _p, props){
    if (!s.running) return s;
    const next = s.seconds + 1;
    if (next >= props.limitSeconds)
      return { ...s, seconds: props.limitSeconds, running: false };   // clamps
    return { ...s, seconds: next };
  }
};

/* ---- Model B refined: monotone Tick + Start guarded ---- */
const B = {
  Start(s, _p, props){
    if (s.running) return s;
    if (s.seconds >= props.limitSeconds) return s;          // cannot start a finished timer
    return { ...s, running: true };
  },
  Stop: A.Stop,
  Reset: A.Reset,
  Tick(s, _p, props){
    if (!s.running) return s;
    if (s.seconds >= props.limitSeconds) return { ...s, running: false };  // repair path
    const seconds = s.seconds + 1;
    if (seconds >= props.limitSeconds) return { ...s, seconds, running: false };
    return { ...s, seconds };
  }
};

const run = (acts, trace, s = S0) => {
  let cur = s, transitions = 0;
  for (const n of trace) { const nx = acts[n](cur, undefined, P);
                           if (!Object.is(nx, cur)) transitions++; cur = nx; }
  return { state: cur, transitions };
};

const T8 = ["Start", ...Array(8).fill("Tick")];
const J = (o) => JSON.stringify(o);

console.log("=== 1. terminal state after Start + 8 Tick (limit 5) ===");
for (const [name, m] of [["Model A", A], ["Model B naive", B_naive], ["Model B refined", B]]) {
  const r = run(m, T8);
  console.log(name.padEnd(16), J(r.state), " transitions:", r.transitions);
}

console.log("\n=== 2. THE TRAP: user presses Start at the limit, then one Tick ===");
for (const [name, m] of [["Model A", A], ["Model B naive", B_naive], ["Model B refined", B]]) {
  const atLimit = run(m, T8).state;
  const afterStart = m.Start(atLimit, undefined, P);
  const afterTick  = m.Tick(afterStart, undefined, P);
  const startWasNoop = Object.is(afterStart, atLimit);
  console.log(name.padEnd(16),
    "Start ->", J(afterStart),
    " Tick ->", J(afterTick),
    " Start is identity:", startWasNoop);
}

console.log("\n=== 3. is the Start button truthful? (disabled=\"{running}\") ===");
for (const [name, m] of [["Model A", A], ["Model B refined", B]]) {
  const atLimit = run(m, T8).state;
  const startDisabledOld = atLimit.running;                         // current binding
  const cannotStart = atLimit.running || atLimit.seconds >= P.limitSeconds;
  console.log(name.padEnd(16),
    "state:", J(atLimit),
    " disabled={running}:", String(startDisabledOld).padEnd(5),
    " disabled={cannotStart}:", cannotStart);
}

console.log("\n=== 4. what the live region announces at the limit ===");
const statusOld = ({running, seconds}, {idleText}) =>
  running ? "Running" : (seconds > 0 ? "Paused" : idleText);
const statusNew = ({running, seconds}, {idleText, limitSeconds}) => {
  if (!running && seconds >= limitSeconds) return "Finished";
  if (running) return "Running";
  return seconds > 0 ? "Paused" : idleText;
};
for (const [name, m] of [["Model A", A], ["Model B refined", B]]) {
  const s = run(m, T8).state;
  console.log(name.padEnd(16), "statusLabel(old):", statusOld(s,P).padEnd(9),
              " statusLabel(new):", statusNew(s,P));
}

console.log("\n=== 5. monotonicity: restored state above the limit (seconds 8, limit 5) ===");
const restored = Object.freeze({ seconds: 8, running: true });
for (const [name, m] of [["Model A", A], ["Model B naive", B_naive], ["Model B refined", B]]) {
  const nx = m.Tick(restored, undefined, P);
  console.log(name.padEnd(16), "Tick ->", J(nx),
    " decreased seconds:", nx.seconds < restored.seconds);
}

console.log("\n=== 6. effect predicate needed to reach quiescence ===");
const quiesces = (m, whileFn) => {
  let s = m.Start(S0, undefined, P), fired = 0;
  for (let i = 0; i < 50; i++) { if (!whileFn(s, P)) break; s = m.Tick(s, undefined, P); fired++; }
  return { fired, stopped: !whileFn(s, P), state: s };
};
const simple   = (s) => s.running;
const compound = (s, p) => s.running && s.seconds < p.limitSeconds;
console.log("Model A  while:{running}          ->", J(quiesces(A, simple)));
console.log("Model A  while:{running&&<limit}  ->", J(quiesces(A, compound)));
console.log("Model B  while:{running}          ->", J(quiesces(B, simple)));
