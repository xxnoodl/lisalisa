import { useState, useMemo, useEffect, useRef } from "react";

// ── Cost constants ────────────────────────────────────────────────
const C = {
  breast:120/9, drum:35/6, mixed:42/7,
  giz:5.31, sau:2.81,
  friesS:9.17, friesM:12.83, friesL:16.50,
  sauceH:12.67, sauceL:2.00, oils:4.72,
  vegs:4.63, wrap:11.00,
  packS:2.00, packL:2.50, foil:2.50,
};

function buildItems(cheeseAmt, pfC, lfC, swC) {
  const pf=C[pfC], lf=C[lfC], sw=C[swC];
  const raw = [
    {id:"pf60",  cat:"plain",    label:"Fries + Chicken", sell:60,  cost:2*pf+C.friesS+C.sauceL+C.oils+C.packS},
    {id:"pf80",  cat:"plain",    label:"Fries + Chicken", sell:80,  cost:3*pf+C.friesM+C.sauceL+C.oils+C.packS},
    {id:"pf100", cat:"plain",    label:"Fries + Chicken", sell:100, cost:4*pf+C.friesL+C.sauceL+C.oils+C.packS},
    {id:"lf70",  cat:"loaded",   label:"Loaded Fries",    sell:70,  cost:0.5*lf+C.giz+C.sau+C.friesS+C.sauceH+cheeseAmt+C.oils+C.packS},
    {id:"lf90",  cat:"loaded",   label:"Loaded Fries",    sell:90,  cost:1*lf+C.giz+C.sau+C.friesM+C.sauceH+cheeseAmt+C.oils+C.packL},
    {id:"lf120", cat:"loaded",   label:"Loaded Fries",    sell:120, cost:1.5*lf+C.giz+C.sau+C.friesL+C.sauceH+cheeseAmt+C.oils+C.packL},
    {id:"sw60",  cat:"shawarma", label:"Shawarma",        sell:60,  cost:sw+C.giz+C.sau+C.vegs+C.wrap+C.sauceH+C.oils+C.foil},
    {id:"sw80",  cat:"shawarma", label:"Shawarma",        sell:80,  cost:1.5*sw+C.giz+C.sau+C.vegs+C.wrap+C.sauceH+C.oils+C.foil},
    {id:"sw100", cat:"shawarma", label:"Shawarma",        sell:100, cost:2*sw+C.giz+C.sau+C.vegs+C.wrap+C.sauceH+C.oils+C.foil},
  ];
  return raw.map(i => {
    const profit = +(i.sell - i.cost).toFixed(2);
    return {...i, cost:+i.cost.toFixed(2), profit, margin:+((profit/i.sell)*100).toFixed(1)};
  });
}

const CHEESE_OPTS = [{label:"Small",val:10},{label:"Medium",val:20},{label:"Large",val:30}];
const CHX_OPTS = [
  {key:"drum",  label:"Drumstick", sub:"₵5.83/pc"},
  {key:"mixed", label:"Mixed",     sub:"₵6.00/pc"},
  {key:"breast",label:"Breast",    sub:"₵13.33/pc"},
];

function tier(profit) {
  if (profit >= 25) return "green";
  if (profit >= 10) return "yellow";
  return "red";
}

// ── Givingli-inspired warm palette ────────────────────────────────
const P = {
  cream:    "#F7F1E6",   // page background
  card:     "#FFFFFF",
  ink:      "#3A2E45",   // dark plum primary text
  inkSoft:  "#8C8295",   // muted secondary text
  inkFaint: "#B8B0BF",
  line:     "#EAE2D4",
};

const T = {
  green:  {color:"#4B7B43", bg:"#E4EFD9", chip:"#5C8C50", tag:"GREAT"},
  yellow: {color:"#B5852C", bg:"#F6E9C9", chip:"#C99A3A", tag:"OKAY"},
  red:    {color:"#BB5C5C", bg:"#F4DAD6", chip:"#C46B6B", tag:"RISKY"},
};

const CAT = {
  plain:    {icon:"🍟", name:"Fries + Chicken", bg:"#F2D98A", deep:"#8A6A1E", soft:"#FBF1D2"}, // mustard
  loaded:   {icon:"🍳", name:"Loaded Fries",    bg:"#EFB088", deep:"#9E5226", soft:"#FBE4D5"}, // coral
  shawarma: {icon:"🌯", name:"Shawarma",        bg:"#B9D199", deep:"#4E7232", soft:"#E8F1D9"}, // sage
};

const ACCENT = "#9B7FC4";       // lavender (Givingli purple)
const ACCENT_SOFT = "#EAE1F4";

const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Root ──────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap";
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch(e){} };
  }, []);

  const [mode,    setMode]    = useState("orders");
  const [showCfg, setShowCfg] = useState(false);
  const [cheese,  setCheese]  = useState(1);
  const [pfC,     setPfC]     = useState("drum");
  const [lfC,     setLfC]     = useState("breast");
  const [swC,     setSwC]     = useState("breast");
  const [orders,  setOrders]  = useState([]);
  const [toast,   setToast]   = useState(null);
  const timerRef = useRef(null);

  const items = useMemo(() => buildItems(CHEESE_OPTS[cheese].val, pfC, lfC, swC), [cheese, pfC, lfC, swC]);

  const logOrder = item => {
    setOrders(p => [...p, {...item, orderId:Date.now(), time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}]);
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(item.profit);
    timerRef.current = setTimeout(() => setToast(null), 1600);
  };

  const totals = useMemo(() => ({
    count:   orders.length,
    revenue: +orders.reduce((s,o)=>s+o.sell,  0).toFixed(0),
    profit:  +orders.reduce((s,o)=>s+o.profit,0).toFixed(0),
    cost:    +orders.reduce((s,o)=>s+o.cost,  0).toFixed(0),
  }), [orders]);

  const breakdown = useMemo(() => {
    const m = {};
    orders.forEach(o => {
      if (!m[o.id]) m[o.id] = {id:o.id,cat:o.cat,label:o.label,sell:o.sell,count:0,revenue:0,profit:0};
      m[o.id].count++; m[o.id].revenue+=o.sell; m[o.id].profit+=o.profit;
    });
    return Object.values(m).sort((a,b)=>b.profit-a.profit);
  }, [orders]);

  return (
    <div style={{fontFamily:FONT, background:P.cream, color:P.ink, minHeight:"100vh", maxWidth:440, margin:"0 auto", position:"relative", paddingBottom:78}}>

      <style>{`
        @keyframes popIn {
          0%   { opacity:0; transform:translateX(-50%) translateY(8px) scale(0.85); }
          25%  { opacity:1; transform:translateX(-50%) translateY(0)   scale(1.05); }
          65%  { opacity:1; transform:translateX(-50%) translateY(0)   scale(1); }
          100% { opacity:0; transform:translateX(-50%) translateY(-6px) scale(0.95); }
        }
        button:active { opacity:0.8; transform:scale(0.97); }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      {/* Toast */}
      {toast !== null && (
        <div style={{position:"fixed",top:78,left:"50%",background:T.green.chip,color:"#fff",fontFamily:FONT,fontWeight:700,fontSize:"1rem",padding:"9px 22px",borderRadius:50,zIndex:200,pointerEvents:"none",boxShadow:"0 8px 24px rgba(91,140,80,0.35)",animation:"popIn 1.6s ease-in-out forwards"}}>
          +₵{toast} kept
        </div>
      )}

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:50,background:P.cream,borderBottom:`1px solid ${P.line}`}}>
        <div style={{padding:"15px 18px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:SERIF,fontSize:"1.3rem",color:P.ink,letterSpacing:"0.01em"}}>Daily Business</div>
          <div style={{display:"flex",gap:6}}>
            {orders.length > 0 && (
              <button onClick={()=>setOrders(p=>p.slice(0,-1))} style={{background:P.card,border:`1px solid ${P.line}`,borderRadius:20,color:P.inkSoft,fontSize:"0.62rem",fontWeight:600,cursor:"pointer",padding:"5px 11px",fontFamily:FONT}}>↩ Undo</button>
            )}
            <button onClick={()=>setShowCfg(s=>!s)} style={{background:showCfg?ACCENT:P.card,border:`1px solid ${showCfg?ACCENT:P.line}`,borderRadius:20,color:showCfg?"#fff":P.inkSoft,fontSize:"0.62rem",fontWeight:600,cursor:"pointer",padding:"5px 11px",fontFamily:FONT}}>⚙ Settings</button>
          </div>
        </div>

        {/* Live ticker */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"0 18px 13px",gap:8}}>
          {[
            {label:"Orders",  val:totals.count,         color:P.ink},
            {label:"Revenue", val:`₵${totals.revenue}`, color:"#5B7FA6"},
            {label:"Profit",  val:`₵${totals.profit}`,  color:totals.profit>0?T.green.chip:totals.profit<0?T.red.chip:P.inkSoft},
          ].map(s=>(
            <div key={s.label} style={{textAlign:"center",background:P.card,borderRadius:11,padding:"7px 4px",border:`1px solid ${P.line}`}}>
              <div style={{fontSize:"0.52rem",color:P.inkFaint,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:"1.05rem",fontWeight:700,color:s.color}}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings drawer */}
      {showCfg && (
        <div style={{background:ACCENT_SOFT,borderBottom:`1px solid ${P.line}`,padding:"16px 18px"}}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:"0.58rem",color:ACCENT,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Cheese portion per order</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
              {CHEESE_OPTS.map((o,i)=>(
                <button key={i} onClick={()=>setCheese(i)} style={{padding:"9px 4px",borderRadius:10,cursor:"pointer",textAlign:"center",border:`1.5px solid ${cheese===i?ACCENT:"transparent"}`,background:cheese===i?P.card:"rgba(255,255,255,0.5)",color:cheese===i?ACCENT:P.inkSoft,fontFamily:FONT,fontSize:"0.7rem",fontWeight:600}}>
                  {o.label}<br/><span style={{fontSize:"0.56rem",fontWeight:500,opacity:0.7}}>₵{o.val}/order</span>
                </button>
              ))}
            </div>
          </div>
          {[
            {label:"Plain fries chicken",  state:pfC, set:setPfC},
            {label:"Loaded fries chicken", state:lfC, set:setLfC},
            {label:"Shawarma chicken",     state:swC, set:setSwC},
          ].map(row=>(
            <div key={row.label} style={{marginBottom:10}}>
              <div style={{fontSize:"0.58rem",color:ACCENT,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{row.label}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                {CHX_OPTS.map(o=>(
                  <button key={o.key} onClick={()=>row.set(o.key)} style={{padding:"8px 4px",borderRadius:9,cursor:"pointer",textAlign:"center",border:`1.5px solid ${row.state===o.key?ACCENT:"transparent"}`,background:row.state===o.key?P.card:"rgba(255,255,255,0.5)",color:row.state===o.key?ACCENT:P.inkSoft,fontFamily:FONT,fontSize:"0.64rem",fontWeight:row.state===o.key?700:500}}>
                    {o.label}<br/><span style={{fontSize:"0.54rem",opacity:0.7,fontWeight:500}}>{o.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page content */}
      <div style={{padding:"16px 14px 0"}}>
        {mode==="orders" && <OrdersView items={items} logOrder={logOrder} orders={orders} />}
        {mode==="plan"   && <PlanView   items={items} />}
        {mode==="dayend" && <DayEndView totals={totals} breakdown={breakdown} onReset={()=>setOrders([])} />}
      </div>

      {/* Bottom nav */}
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:440,background:"rgba(247,241,230,0.96)",backdropFilter:"blur(20px)",borderTop:`1px solid ${P.line}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"9px 0 18px",zIndex:50}}>
        {[{key:"plan",icon:"📋",label:"Plan"},{key:"orders",icon:"🛒",label:"Orders"},{key:"dayend",icon:"📊",label:"Recap"}].map(m=>(
          <button key={m.key} onClick={()=>setMode(m.key)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:FONT,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
            <div style={{fontSize:"1.05rem",opacity:mode===m.key?1:0.4,filter:mode===m.key?"none":"grayscale(0.6)"}}>{m.icon}</div>
            <div style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.03em",color:mode===m.key?P.ink:P.inkFaint}}>{m.label}</div>
            {mode===m.key && <div style={{width:18,height:2.5,background:ACCENT,borderRadius:2,marginTop:1}}/>}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Orders View ───────────────────────────────────────────────────
function OrdersView({ items, logOrder, orders }) {
  const recent = [...orders].reverse().slice(0, 5);

  return (
    <div>
      {["plain","loaded","shawarma"].map(catKey => {
        const cs = CAT[catKey];
        const catItems = items.filter(i => i.cat === catKey);
        return (
          <div key={catKey} style={{marginBottom:12,borderRadius:20,overflow:"hidden",background:cs.bg,boxShadow:"0 2px 10px rgba(58,46,69,0.06)"}}>
            <div style={{padding:"15px 18px 11px",display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:"1.35rem"}}>{cs.icon}</span>
              <span style={{fontFamily:SERIF,fontSize:"1.05rem",color:cs.deep}}>{cs.name}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"0 13px 14px"}}>
              {catItems.map(item => {
                const t = T[tier(item.profit)];
                return (
                  <button key={item.id} onClick={()=>logOrder(item)} style={{padding:"13px 6px 11px",borderRadius:15,cursor:"pointer",textAlign:"center",background:P.card,border:"none",fontFamily:FONT,display:"flex",flexDirection:"column",alignItems:"center",gap:2,boxShadow:"0 1px 4px rgba(58,46,69,0.08)"}}>
                    <div style={{fontSize:"1.3rem",fontWeight:800,color:P.ink,lineHeight:1}}>₵{item.sell}</div>
                    <div style={{fontSize:"0.52rem",color:P.inkFaint,marginTop:4}}>you keep</div>
                    <div style={{fontSize:"0.92rem",fontWeight:700,color:t.color}}>₵{item.profit}</div>
                    <div style={{marginTop:4,fontSize:"0.5rem",fontWeight:700,color:t.color,background:t.bg,padding:"2px 7px",borderRadius:20,letterSpacing:"0.05em"}}>{t.tag}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {recent.length > 0 && (
        <div style={{marginTop:6}}>
          <div style={{fontSize:"0.56rem",color:P.inkFaint,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:9}}>Recent orders</div>
          {recent.map((o, i) => (
            <div key={o.orderId} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",marginBottom:6,borderRadius:13,background:P.card,border:`1px solid ${P.line}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:"1rem"}}>{CAT[o.cat].icon}</span>
                <div>
                  <div style={{fontSize:"0.76rem",fontWeight:600,color:P.ink}}>{o.label} · ₵{o.sell}</div>
                  <div style={{fontSize:"0.58rem",color:P.inkFaint}}>{o.time}</div>
                </div>
              </div>
              <div style={{fontSize:"0.82rem",fontWeight:700,color:T.green.chip}}>+₵{o.profit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Plan View ─────────────────────────────────────────────────────
function PlanView({ items }) {
  const sorted = [...items].sort((a,b)=>b.profit-a.profit);
  const best = sorted[0];
  const risky = sorted.filter(i=>tier(i.profit)==="red");

  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontFamily:SERIF,fontSize:"1.5rem",color:P.ink,marginBottom:3,lineHeight:1.1}}>What to push today</div>
        <div style={{fontSize:"0.72rem",color:P.inkSoft}}>Ranked by how much you keep per order.</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:16}}>
        {sorted.map((item, i) => {
          const t = T[tier(item.profit)];
          const cs = CAT[item.cat];
          return (
            <div key={item.id} style={{padding:"14px 8px 11px",borderRadius:16,textAlign:"center",background:cs.soft,position:"relative",border:`1px solid ${i===0?ACCENT:"transparent"}`}}>
              {i === 0 && (
                <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:ACCENT,borderRadius:20,padding:"2px 10px",fontSize:"0.46rem",fontWeight:700,color:"#fff",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>★ BEST</div>
              )}
              <div style={{fontSize:"1.05rem",marginBottom:5}}>{cs.icon}</div>
              <div style={{fontSize:"0.54rem",color:P.inkSoft,marginBottom:2,fontWeight:500}}>{item.label.split(" ")[0]}</div>
              <div style={{fontSize:"0.88rem",fontWeight:700,color:P.ink}}>₵{item.sell}</div>
              <div style={{width:22,height:1,background:t.color,opacity:0.35,margin:"6px auto"}}/>
              <div style={{fontSize:"0.92rem",fontWeight:800,color:t.color}}>+₵{item.profit}</div>
              <div style={{fontSize:"0.46rem",color:t.color,opacity:0.85,marginTop:2,letterSpacing:"0.06em",fontWeight:700}}>{t.tag}</div>
            </div>
          );
        })}
      </div>

      <div style={{padding:"16px 18px",borderRadius:18,background:ACCENT_SOFT,border:`1px solid ${P.line}`}}>
        <div style={{fontSize:"0.72rem",fontWeight:700,color:ACCENT,marginBottom:8}}>💡 Today's insight</div>
        <div style={{fontSize:"0.74rem",color:P.ink,lineHeight:1.9}}>
          <span style={{fontWeight:700}}>{best.label} ₵{best.sell}</span> earns you the most — <span style={{fontWeight:700,color:T.green.chip}}>₵{best.profit}</span> per order.
          {risky.length > 0 && (
            <> Avoid pushing <span style={{fontWeight:700,color:T.red.chip}}>{risky.map(r=>`${r.label} ₵${r.sell}`).join(", ")}</span> — barely covers your costs.</>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Day End View ──────────────────────────────────────────────────
function DayEndView({ totals, breakdown, onReset }) {
  if (totals.count === 0) {
    return (
      <div style={{textAlign:"center",padding:"60px 24px"}}>
        <div style={{fontSize:"2.8rem",marginBottom:16}}>📋</div>
        <div style={{color:P.inkSoft,fontSize:"0.85rem",lineHeight:2}}>
          No orders yet.<br/>
          <span style={{color:P.ink,fontWeight:600}}>Tap Orders</span> and log each sale as it comes in.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{padding:"28px 22px",borderRadius:22,marginBottom:14,textAlign:"center",background:"#B9D199"}}>
        <div style={{fontSize:"0.58rem",color:"#4E7232",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Today's profit</div>
        <div style={{fontFamily:SERIF,fontSize:"3.4rem",color:"#3A5424",lineHeight:1}}>₵{totals.profit}</div>
        <div style={{marginTop:18,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[{l:"Orders",v:totals.count},{l:"Earned",v:`₵${totals.revenue}`},{l:"Spent",v:`₵${totals.cost}`}].map(s=>(
            <div key={s.l} style={{background:"rgba(255,255,255,0.55)",borderRadius:11,padding:"9px 4px"}}>
              <div style={{fontSize:"0.52rem",color:"#4E7232",letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.l}</div>
              <div style={{fontSize:"0.92rem",fontWeight:700,color:"#3A5424",marginTop:2}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{fontSize:"0.56rem",color:P.inkFaint,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:9}}>Where it came from</div>
      {breakdown.map(b=>(
        <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",marginBottom:7,borderRadius:15,background:P.card,border:`1px solid ${P.line}`}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <span style={{fontSize:"1.2rem"}}>{CAT[b.cat].icon}</span>
            <div>
              <div style={{fontSize:"0.78rem",fontWeight:600,color:P.ink}}>{b.label} ₵{b.sell}</div>
              <div style={{fontSize:"0.6rem",color:P.inkSoft}}>{b.count} order{b.count>1?"s":""} · ₵{b.revenue.toFixed(0)} revenue</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"1rem",fontWeight:700,color:T.green.chip}}>₵{b.profit.toFixed(0)}</div>
            <div style={{fontSize:"0.52rem",color:P.inkFaint}}>profit</div>
          </div>
        </div>
      ))}

      <button onClick={onReset} style={{width:"100%",marginTop:14,padding:"15px",borderRadius:15,cursor:"pointer",background:P.card,border:`1px solid ${T.red.bg}`,color:T.red.chip,fontSize:"0.74rem",fontWeight:700,letterSpacing:"0.03em",fontFamily:FONT}}>
        Reset — start a new day
      </button>
    </div>
  );
}
