/* Draft 0.2.1 + Addendum A — adopted Timer, re-verified across all adapters */
const P0 = Object.freeze({ label:"Timer", limitSeconds:5, idleText:"Ready" });
const S0 = Object.freeze({ seconds:0, running:false });

const actions = {
  Start(s,_p,props){ if(s.running) return s;
                     if(s.seconds>=props.limitSeconds) return s;
                     return {...s, running:true}; },
  Stop(s){ if(!s.running) return s; return {...s, running:false}; },
  Reset(s){ return {...s, seconds:0, running:false}; },
  Tick(s,_p,props){
    if(!s.running) return s;
    if(s.seconds>=props.limitSeconds) return {...s, running:false};
    const seconds = s.seconds+1;
    if(seconds>=props.limitSeconds) return {...s, seconds, running:false};
    return {...s, seconds};
  }
};
const derived = {
  formattedTime({seconds}){ const m=Math.floor(seconds/60),r=seconds%60;
    return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`; },
  finished({running,seconds},{limitSeconds}){ return !running && seconds>=limitSeconds; },
  statusLabel({running,seconds},{idleText,limitSeconds}){
    if(!running && seconds>=limitSeconds) return "Finished";
    if(running) return "Running";
    return seconds>0 ? "Paused" : idleText; },
  cannotStart({running,seconds},{limitSeconds}){ return running || seconds>=limitSeconds; },
  stopped({running}){ return !running; },
  atLimit({seconds},{limitSeconds}){ return seconds>=limitSeconds; }
};
const validate = (s,p) => {
  const v = s.seconds > p.limitSeconds ? [{rule:"NeverPastLimit"}] : [];
  return { valid: v.length===0, violations: v };
};
const render = (s,p) =>
  `<output>${derived.formattedTime(s,p)}</output><p>${derived.statusLabel(s,p)}</p>` +
  (derived.finished(s,p) ? `<p>Time's up. Reset to start again.</p>` : ``);
const dop = Object.freeze({ name:"Timer", initialState:S0, props:P0,
                            actions, derived, validate, render });

const toData = d => d;
const toFunctional = d => ({ ...d,
  reduce:(s,n,pay,p=d.props)=>d.actions[n](s,pay,p),
  replay(t,from=d.initialState,p=d.props){ return t.reduce((s,[n,pay])=>d.actions[n](s,pay,p),from); },
  create(o={}){ let c=o.state??d.initialState; const p=Object.freeze({...d.props,...(o.props||{})});
    return { getState:()=>c, dispatch(n,pay){ c=d.actions[n](c,pay,p); return c; } }; } });
const toOOP = d => { class C { #s;#p;
  constructor(o={}){ this.#s=o.state??d.initialState; this.#p=Object.freeze({...d.props,...(o.props||{})}); }
  get state(){return this.#s;} get props(){return this.#p;}
  dispatch(n,pay){ this.#s=d.actions[n](this.#s,pay,this.#p); return this.#s; }
  replay(t){ for(const [n,pay] of t) this.dispatch(n,pay); return this.#s; } } return C; };
const toReactive = d => (o={}) => { let c=o.state??d.initialState;
  const p=Object.freeze({...d.props,...(o.props||{})}); let tx=0;
  const dispatch=(n,pay)=>{ const nx=d.actions[n](c,pay,p); if(Object.is(nx,c)) return c; tx++; c=nx; return c; };
  return { get state(){return c;}, get transitions(){return tx;}, dispatch,
           replay(t){ for(const [n,pay] of t) dispatch(n,pay); return c; } }; };

const J=o=>JSON.stringify(o), eq=(a,b)=>J(a)===J(b);
const D=toData(dop), F=toFunctional(dop), O=toOOP(dop), R=toReactive(dop);
const TRACE=[["Start"],["Tick"],["Tick"],["Stop"]];

let ds=D.initialState; for(const [n,pay] of TRACE) ds=D.actions[n](ds,pay,D.props);
const fc=F.create(); for(const [n,pay] of TRACE) fc.dispatch(n,pay);
const res=[ds,F.replay(TRACE),fc.getState(),new O().replay(TRACE),R().replay(TRACE)];

console.log("=== Adapter Equivalence: Start -> Tick -> Tick -> Stop ===");
console.log("all five projections :", J(res[0]));
console.log("all equivalent       :", res.every(v=>eq(v,res[0])));
let s=D.initialState; const oi=new O(), ri=R(), fi=F.create(); let step=true;
for(const [n,pay] of TRACE){ s=D.actions[n](s,pay,D.props);
  if(![fi.dispatch(n,pay),oi.dispatch(n,pay),ri.dispatch(n,pay)].every(v=>eq(v,s))) step=false; }
console.log("step-wise equivalent :", step);
console.log("render equivalent    :", [D,F].every(a=>a.render(res[0],D.props)===D.render(res[0],D.props)));
console.log("validation equal     :", eq(D.validate(res[0],D.props),{valid:true,violations:[]}));

console.log("\n=== terminal: Start + 8 Tick, limitSeconds 5 ===");
const T8=[["Start"],...Array(8).fill(["Tick"])];
const term=[ (()=>{let x=D.initialState; for(const [n,p] of T8) x=D.actions[n](x,p,D.props); return x;})(),
             F.replay(T8), new O().replay(T8), R().replay(T8) ];
console.log("all four projections :", J(term[0]), " equivalent:", term.every(v=>eq(v,term[0])));
const t=term[0];
console.log("finished             :", D.derived.finished(t,D.props));
console.log("statusLabel          :", D.derived.statusLabel(t,D.props));
console.log("cannotStart          :", D.derived.cannotStart(t,D.props));
console.log("validation           :", J(D.validate(t,D.props)));
const rr=R(); rr.replay(T8);
console.log("transitions          :", rr.transitions);
console.log("Start at limit       :", J(D.actions.Start(t,undefined,D.props)),
            " identity:", Object.is(D.actions.Start(t,undefined,D.props),t));
console.log("Reset then Start     :", J(D.actions.Start(D.actions.Reset(t),undefined,D.props)));
console.log("Tick monotone (8>5)  :", J(D.actions.Tick({seconds:8,running:true},undefined,D.props)));
