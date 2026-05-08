import { useState, useCallback, useEffect, useRef } from "react";

const T = {
  black:"#0A0A0A", cream:"#F5F0E8", gold:"#B8922A", goldLight:"#D4A843",
  red:"#E51E21", white:"#FAFAF8",
  n100:"#F0EBE3", n200:"#DDD8CF", n300:"#C8C0B6",
  n400:"#A09890", n600:"#5C5650", n800:"#2A2520",
  green:"#1E5C1E", greenBg:"#EDF7ED", greenBorder:"#A8CFA8",
  goldBg:"#FBF5E8", goldBorder:"#D4B870",
  redBg:"#FCEAEA", redBorder:"#E8A8A8",
};

const INITIAL_EVENTS = [
  { id:"evt-001", name:"Threads of Connection", subtitle:"35th Anniversary", date:"24 JUNE 2026", time:"8:00 PM", location:"GIARDINO CORSINI", address:"VIA DELLA SCALA 115, FLORENCE, ITALY", description:"Art · Yarn · Nature · Contemporary Culture", status:"upcoming", coverImage:null },
  { id:"evt-002", name:"Native Soul Collection", subtitle:"Winter Preview 2026", date:"15 SEPTEMBER 2026", time:"7:30 PM", location:"PALAZZO STROZZI", address:"PIAZZA DEGLI STROZZI, FLORENCE, ITALY", description:"Cashmere · Heritage · Innovation", status:"upcoming", coverImage:null },
];
const INITIAL_GUESTS = [
  { id:"g001", eventId:"evt-001", firstName:"Marco",     lastName:"Conti",      email:"m.conti@luxfashion.it",    phone:"+39 02 1234567", status:"registered",  guestToken:"tok-a1b2c3", qrToken:"qr-x1y2z3", registeredAt:"2026-05-10T14:32:00Z", checkedInAt:null },
  { id:"g002", eventId:"evt-001", firstName:"Sophia",    lastName:"Martini",    email:"s.martini@vogue.it",       phone:"+39 06 9876543", status:"registered",  guestToken:"tok-d4e5f6", qrToken:"qr-a4b5c6", registeredAt:"2026-05-11T09:15:00Z", checkedInAt:null },
  { id:"g003", eventId:"evt-001", firstName:"James",     lastName:"Richardson", email:"j.rich@sothebys.com",      phone:"+44 20 5551234", status:"invited",     guestToken:"tok-g7h8i9", qrToken:"qr-d7e8f9", registeredAt:null, checkedInAt:null },
  { id:"g004", eventId:"evt-001", firstName:"Elena",     lastName:"Vasquez",    email:"e.vasquez@hermes.fr",      phone:"+33 1 4012345",  status:"invited",     guestToken:"tok-j1k2l3", qrToken:"qr-g1h2i3", registeredAt:null, checkedInAt:null },
  { id:"g005", eventId:"evt-001", firstName:"Luca",      lastName:"Ferragamo",  email:"l.ferragamo@ferragamo.com",phone:"+39 055 339222", status:"checked-in",  guestToken:"tok-m4n5o6", qrToken:"qr-j4k5l6", registeredAt:"2026-05-08T16:00:00Z", checkedInAt:"2026-06-24T20:15:00Z" },
  { id:"g006", eventId:"evt-001", firstName:"Charlotte", lastName:"Dubois",     email:"c.dubois@lvmh.fr",         phone:"+33 1 5556789",  status:"registered",  guestToken:"tok-p7q8r9", qrToken:"qr-m7n8o9", registeredAt:"2026-05-12T11:30:00Z", checkedInAt:null },
  { id:"g007", eventId:"evt-002", firstName:"Alessandro",lastName:"Ferrari",    email:"a.ferrari@maxmara.com",    phone:"+39 0522 000001",status:"registered",  guestToken:"tok-s1t2u3", qrToken:"qr-p1q2r3", registeredAt:"2026-05-15T10:00:00Z", checkedInAt:null },
  { id:"g008", eventId:"evt-002", firstName:"Yuki",      lastName:"Tanaka",     email:"y.tanaka@isseymiyake.jp",  phone:"+81 3 12345678", status:"invited",     guestToken:"tok-v4w5x6", qrToken:"qr-s4t5u6", registeredAt:null, checkedInAt:null },
];

const uid = () => Math.random().toString(36).substr(2,9);
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}) : "";
const useIsMobile = () => { const [m,setM]=useState(window.innerWidth<640); useEffect(()=>{ const h=()=>setM(window.innerWidth<640); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]); return m; };

// ── QR ───────────────────────────────────────────────────────────────────────
function QRCode({ value, size=80, color=T.gold, bg="transparent" }) {
  const hash=value.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const N=21, cs=size/N;
  const FIXED=new Set([...[0,1,2,3,4,5,6].flatMap(i=>[[0,i],[6,i],[i,0],[i,6],[0,14+i],[6,14+i],[i,14],[i,20],[14+i,0],[14+i,6],[14,i],[20,i]].map(([r,c])=>`${r},${c}`)),...[2,3,4].flatMap(r=>[2,3,4].flatMap(c=>[`${r},${c}`,`${r},${16+c-2}`,`${14+r},${c}`]))]);
  const cells=[];
  for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(FIXED.has(`${r},${c}`)||(((hash*(r*N+c+1)*2654435761)>>>0)%3===0)) cells.push(<rect key={`${r}-${c}`} x={c*cs} y={r*cs} width={cs} height={cs} fill={color}/>);
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block"}}>{bg!=="transparent"&&<rect width={size} height={size} fill={bg}/>}{cells}</svg>;
}

// ── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const S={invited:{label:"INVITED",bg:T.n100,color:T.n600,border:T.n300},registered:{label:"REGISTERED",bg:T.greenBg,color:T.green,border:T.greenBorder},"checked-in":{label:"CHECKED IN",bg:T.goldBg,color:T.gold,border:T.goldBorder}}[status]||{label:status,bg:T.n100,color:T.n600,border:T.n300};
  return <span style={{display:"inline-flex",alignItems:"center",whiteSpace:"nowrap",padding:"3px 8px",background:S.bg,color:S.color,border:`1px solid ${S.border}`,borderRadius:3,fontSize:10,fontWeight:700,letterSpacing:"0.08em",fontFamily:"sans-serif"}}>{S.label}</span>;
}

// ── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:T.white,borderRadius:4,padding:28,maxWidth:400,width:"100%",border:`1px solid ${T.n200}`}}>
        <div style={{fontSize:17,fontFamily:"'Georgia',serif",color:T.n800,marginBottom:10}}>{title}</div>
        <div style={{fontSize:13,fontFamily:"sans-serif",color:T.n600,lineHeight:1.7,marginBottom:24}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{padding:"9px 18px",background:"none",border:`1px solid ${T.n200}`,borderRadius:2,cursor:"pointer",fontSize:11,letterSpacing:"0.1em",fontFamily:"sans-serif",color:T.n600}}>CANCEL</button>
          <button onClick={onConfirm} style={{padding:"9px 18px",background:danger?T.red:T.n800,border:"none",borderRadius:2,cursor:"pointer",fontSize:11,letterSpacing:"0.1em",fontFamily:"sans-serif",color:T.white,fontWeight:700}}>{danger?"DELETE":"CONFIRM"}</button>
        </div>
      </div>
    </div>
  );
}

// ── IMAGE UPLOAD ──────────────────────────────────────────────────────────────
function ImageUpload({ value, onChange, label="Upload Template Image" }) {
  const ref=useRef();
  const handleFile=(e)=>{
    const f=e.target.files[0];
    if(!f) return;
    const reader=new FileReader();
    reader.onload=(ev)=>onChange(ev.target.result);
    reader.readAsDataURL(f);
  };
  return (
    <div>
      <label style={{display:"block",fontSize:9,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:6}}>{label.toUpperCase()}</label>
      <div onClick={()=>ref.current.click()} style={{border:`1.5px dashed ${value?T.goldBorder:T.n200}`,borderRadius:4,padding:value?"0":"28px 16px",cursor:"pointer",textAlign:"center",background:value?"transparent":T.n100,overflow:"hidden",position:"relative",minHeight:value?120:80,display:"flex",alignItems:"center",justifyContent:"center",transition:"border-color 0.2s"}}
        onMouseEnter={e=>e.currentTarget.style.borderColor=T.gold}
        onMouseLeave={e=>e.currentTarget.style.borderColor=value?T.goldBorder:T.n200}>
        {value
          ? <img src={value} alt="template" style={{width:"100%",maxHeight:160,objectFit:"cover",display:"block",borderRadius:3}}/>
          : <div><div style={{fontSize:22,marginBottom:6}}>🖼</div><div style={{fontSize:11,color:T.n600,fontFamily:"sans-serif"}}>Click to upload JPG or PNG</div><div style={{fontSize:10,color:T.n400,fontFamily:"sans-serif",marginTop:2}}>Recommended: 1080×1920px portrait</div></div>
        }
        {value&&<div style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.5)",borderRadius:2,padding:"2px 6px",color:T.white,fontSize:10,cursor:"pointer"}} onClick={e=>{e.stopPropagation();onChange(null);}}>✕</div>}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFile} style={{display:"none"}}/>
    </div>
  );
}

// ── EVENT FORM MODAL ──────────────────────────────────────────────────────────
function EventFormModal({ initial, onSave, onClose }) {
  const blank={name:"",subtitle:"",date:"",time:"",location:"",address:"",description:"",status:"upcoming",coverImage:null};
  const [form,setForm]=useState(initial||blank);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const valid=form.name&&form.date&&form.location;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}>
      <div style={{background:T.white,borderRadius:4,padding:"28px 24px",maxWidth:520,width:"100%",border:`1px solid ${T.n200}`,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div><div style={{fontSize:9,letterSpacing:"0.3em",color:T.gold,fontFamily:"sans-serif",marginBottom:3}}>XINAO EVENTS</div>
          <div style={{fontSize:18,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:700}}>{initial?"Edit Event":"New Event"}</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:T.n400,lineHeight:1}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[["Event Name *","name"],["Subtitle / Edition","subtitle"],["Date *","date","24 JUNE 2026"],["Time *","time","8:00 PM"],["Venue / Location *","location"],["Full Address","address"],["Description / Tagline","description"]].map(([label,key,ph])=>(
            <div key={key}>
              <label style={{display:"block",fontSize:9,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:5}}>{label.toUpperCase()}</label>
              <input value={form[key]} placeholder={ph||""} onChange={e=>set(key,e.target.value)} style={{width:"100%",padding:"10px 13px",border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:"sans-serif",color:T.n800,outline:"none",background:T.white,boxSizing:"border-box"}}/>
            </div>
          ))}
          <div>
            <label style={{display:"block",fontSize:9,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:5}}>STATUS</label>
            <select value={form.status} onChange={e=>set("status",e.target.value)} style={{width:"100%",padding:"10px 13px",border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:"sans-serif",color:T.n800,background:T.white}}>
              <option value="upcoming">Upcoming</option><option value="active">Active</option><option value="past">Past</option>
            </select>
          </div>
          {/* Image upload */}
          <ImageUpload value={form.coverImage} onChange={v=>set("coverImage",v)} label="Invitation Template (JPG/PNG)"/>
          {form.coverImage&&<div style={{fontSize:10,color:T.green,fontFamily:"sans-serif",background:T.greenBg,padding:"7px 10px",borderRadius:3,border:`1px solid ${T.greenBorder}`}}>✓ Template image uploaded — will appear as invitation background</div>}
        </div>
        <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"flex-end",flexWrap:"wrap"}}>
          <button onClick={onClose} style={{padding:"10px 18px",background:"none",border:`1px solid ${T.n200}`,borderRadius:2,cursor:"pointer",fontSize:11,letterSpacing:"0.1em",fontFamily:"sans-serif",color:T.n600}}>CANCEL</button>
          <button onClick={()=>valid&&onSave(form)} disabled={!valid} style={{padding:"10px 20px",background:valid?T.n800:T.n300,color:valid?T.white:T.n400,border:"none",borderRadius:2,cursor:valid?"pointer":"not-allowed",fontSize:11,letterSpacing:"0.15em",fontFamily:"sans-serif",fontWeight:700}}>{initial?"SAVE CHANGES":"CREATE EVENT"}</button>
        </div>
      </div>
    </div>
  );
}

// ── INVITATION CARD ───────────────────────────────────────────────────────────
function InvitationCard({ guest, event }) {
  const name=`${guest.firstName} ${guest.lastName}`.toUpperCase();
  const qrVal=`https://xinao.com/checkin/${event.id}/${guest.qrToken}`;
  const words=event.name.split(" "); const h=Math.ceil(words.length/2);
  const hasCover=!!event.coverImage;
  return (
    <div style={{width:"100%",maxWidth:380,background:hasCover?"transparent":"#F8F5EF",border:hasCover?"none":"1px solid #E8E2D8",display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 24px 28px",fontFamily:"'Georgia','Times New Roman',serif",boxSizing:"border-box",position:"relative",overflow:"hidden",borderRadius:hasCover?6:0,minHeight:hasCover?580:0}}>
      {hasCover&&<img src={event.coverImage} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,opacity:0.18}}/>}
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
        <div style={{width:20,height:1,background:T.gold,marginBottom:18}}/>
        <div style={{textAlign:"center",marginBottom:3}}>
          <span style={{fontSize:20,fontWeight:700,color:T.gold,letterSpacing:"0.08em",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
            <span style={{fontStyle:"italic"}}>X</span><span>INAO</span>
            <span style={{fontSize:9,fontWeight:700,color:T.gold,border:`1.5px solid ${T.gold}`,borderRadius:4,padding:"1px 4px",fontFamily:"sans-serif"}}>35</span>
          </span>
          <div style={{fontSize:9,color:T.gold,fontStyle:"italic",letterSpacing:"0.15em",marginTop:2}}>{event.subtitle||"Anniversary"}</div>
        </div>
        <div style={{width:14,height:1,background:T.gold,margin:"10px auto"}}/>
        <div style={{fontSize:8,letterSpacing:"0.35em",color:T.gold,fontFamily:"sans-serif",marginBottom:10}}>PERSONAL INVITATION</div>
        <div style={{fontSize:9,letterSpacing:"0.2em",color:T.n600,fontFamily:"sans-serif",marginBottom:2}}>DEAR</div>
        <div style={{fontSize:15,fontWeight:700,color:T.n800,letterSpacing:"0.1em",textAlign:"center",lineHeight:1.2,marginBottom:14}}>{name}</div>
        <div style={{fontSize:7,letterSpacing:"0.35em",color:T.gold,fontFamily:"sans-serif",marginBottom:6}}>FINAL REMINDER</div>
        <div style={{fontSize:22,fontWeight:700,color:T.n800,lineHeight:1.05,textAlign:"center",marginBottom:1}}>{words.slice(0,h).join(" ").toUpperCase()}</div>
        <div style={{fontSize:22,fontWeight:700,color:T.n800,lineHeight:1.05,textAlign:"center",marginBottom:7}}>{words.slice(h).join(" ").toUpperCase()}</div>
        <div style={{fontSize:8,color:T.gold,fontStyle:"italic",letterSpacing:"0.08em",marginBottom:2}}>{event.description}</div>
        <div style={{width:14,height:1,background:T.gold,margin:"10px auto"}}/>
        <div style={{fontSize:10,color:T.n600,textAlign:"center",lineHeight:1.7,marginBottom:12}}>We look forward to welcoming you<br/>to the {event.subtitle||event.name}.</div>
        <div style={{fontSize:9,color:T.gold,fontWeight:700,letterSpacing:"0.15em",fontFamily:"sans-serif",marginBottom:3}}>{event.date} — {event.time}</div>
        <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",color:T.n800,fontFamily:"sans-serif",marginBottom:2}}>{event.location}</div>
        <div style={{fontSize:8,letterSpacing:"0.06em",color:T.n400,fontFamily:"sans-serif"}}>{event.address}</div>
        <div style={{width:14,height:1,background:T.gold,margin:"10px auto"}}/>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
          <div style={{width:22,height:22,border:`1.5px solid ${T.n400}`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",color:T.n400,fontSize:9}}>⊟</div>
          <div style={{fontSize:7,letterSpacing:"0.18em",color:T.n600,fontFamily:"sans-serif"}}>PLEASE PRESENT QR CODE UPON ARRIVAL</div>
        </div>
        <QRCode value={qrVal} size={70} color={T.gold} bg="#F8F5EF"/>
        <div style={{width:14,height:1,background:T.gold,margin:"10px auto"}}/>
        <div style={{fontSize:8,letterSpacing:"0.4em",color:T.gold,fontFamily:"sans-serif"}}>THANK YOU</div>
      </div>
    </div>
  );
}

// ── SORT HOOK ────────────────────────────────────────────────────────────────
function useSort(data, defaultKey, defaultDir="asc") {
  const [key,setKey]=useState(defaultKey);
  const [dir,setDir]=useState(defaultDir);
  const toggle=(k)=>{ if(k===key) setDir(d=>d==="asc"?"desc":"asc"); else{setKey(k);setDir("asc");} };
  const sorted=[...data].sort((a,b)=>{
    let av=a[key]??"", bv=b[key]??"";
    if(typeof av==="string") av=av.toLowerCase(),bv=bv.toLowerCase();
    return av<bv?(dir==="asc"?-1:1):av>bv?(dir==="asc"?1:-1):0;
  });
  return {sorted,key,dir,toggle};
}

// ── GUESTS TABLE — RESPONSIVE ─────────────────────────────────────────────────
function GuestsTable({ guests, event, onCheckIn, initialFilter="all" }) {
  const isMobile=useIsMobile();
  const [search,setSearch]=useState("");
  const [sf,setSf]=useState(initialFilter);
  const [preview,setPreview]=useState(null);
  useEffect(()=>setSf(initialFilter),[initialFilter]);

  const filtered=guests.filter(g=>{
    const q=search.toLowerCase();
    return(!q||`${g.firstName} ${g.lastName} ${g.email||""} ${g.phone||""}`.toLowerCase().includes(q))&&(sf==="all"||g.status===sf);
  });
  const {sorted,key:sk,dir:sd,toggle}=useSort(filtered,"lastName");

  const SortBtn=({k,label})=>(
    <div onClick={()=>toggle(k)} style={{cursor:"pointer",userSelect:"none",display:"flex",alignItems:"center",gap:3,minWidth:0}}>
      <span style={{fontSize:8,letterSpacing:"0.15em",color:T.n400,fontFamily:"sans-serif",fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>
      <span style={{fontSize:8,color:sk===k?T.gold:T.n300,flexShrink:0}}>{sk===k?(sd==="asc"?"▲":"▼"):"↕"}</span>
    </div>
  );

  return (
    <div>
      {/* Search + filters */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexDirection:isMobile?"column":"row"}}>
        <input placeholder="Search by name, email…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{flex:1,padding:"10px 12px",background:T.white,border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:"sans-serif",color:T.n800,outline:"none",minWidth:0}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["all","invited","registered","checked-in"].map(s=>(
            <button key={s} onClick={()=>setSf(s)} style={{padding:"8px 12px",background:sf===s?T.n800:T.white,color:sf===s?T.white:T.n600,border:`1px solid ${sf===s?T.n800:T.n200}`,borderRadius:2,cursor:"pointer",fontSize:9,letterSpacing:"0.08em",fontFamily:"sans-serif",fontWeight:sf===s?700:400,whiteSpace:"nowrap"}}>
              {s==="checked-in"?"✓ IN":s==="all"?"ALL":s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{fontSize:10,color:T.n400,fontFamily:"sans-serif",marginBottom:10}}>{sorted.length} guest{sorted.length!==1?"s":""}</div>

      {/* TABLE — desktop */}
      {!isMobile&&(
        <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 120px 110px 44px",padding:"9px 14px",borderBottom:`1px solid ${T.n100}`,background:T.n100,gap:10,alignItems:"center"}}>
            <SortBtn k="lastName" label="LAST NAME"/>
            <SortBtn k="firstName" label="FIRST NAME"/>
            <SortBtn k="status" label="STATUS"/>
            <SortBtn k="registeredAt" label="REGISTERED"/>
            <div/>
          </div>
          {sorted.length===0&&<div style={{padding:"28px",textAlign:"center",color:T.n400,fontSize:12,fontFamily:"sans-serif"}}>No guests match your filters.</div>}
          {sorted.map(g=>(
            <div key={g.id}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 120px 110px 44px",padding:"11px 14px",alignItems:"center",borderBottom:`1px solid ${T.n100}`,gap:10,background:preview===g.id?"#F9F7F2":"transparent",transition:"background 0.1s"}}>
                <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.lastName}</div>
                <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.firstName}</div>
                <div style={{display:"flex",alignItems:"center"}}><Badge status={g.status}/></div>
                <div style={{fontSize:11,color:T.n400,fontFamily:"sans-serif",whiteSpace:"nowrap"}}>{fmtDate(g.registeredAt)}</div>
                {/* VIEW BUTTON — always visible */}
                <button onClick={()=>setPreview(preview===g.id?null:g.id)}
                  title={preview===g.id?"Close preview":"View invitation"}
                  style={{width:36,height:32,background:preview===g.id?T.n800:T.white,border:`1px solid ${preview===g.id?T.n800:T.n200}`,borderRadius:3,cursor:"pointer",fontSize:13,color:preview===g.id?T.gold:T.n600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {preview===g.id?"▲":"▼"}
                </button>
              </div>
              {preview===g.id&&(
                <div style={{padding:"18px 16px",background:"#F9F7F2",borderBottom:`1px solid ${T.n100}`}}>
                  <div style={{fontSize:8,letterSpacing:"0.25em",color:T.n400,fontFamily:"sans-serif",marginBottom:14}}>INVITATION — {g.firstName.toUpperCase()} {g.lastName.toUpperCase()}</div>
                  <div style={{display:"flex",gap:24,flexWrap:"wrap",alignItems:"flex-start"}}>
                    <InvitationCard guest={g} event={event}/>
                    <div style={{display:"flex",flexDirection:"column",gap:11,minWidth:170}}>
                      {[["EMAIL",g.email||"—"],["PHONE",g.phone||"—"],["GUEST TOKEN",g.guestToken],["QR TOKEN",g.qrToken]].map(([l,v])=>(
                        <div key={l}><div style={{fontSize:8,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:3}}>{l}</div>
                        <div style={{fontSize:11,fontFamily:"monospace",color:T.n800,background:T.n100,padding:"3px 7px",borderRadius:2,wordBreak:"break-all"}}>{v}</div></div>
                      ))}
                      <div><div style={{fontSize:8,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:5}}>STATUS</div><Badge status={g.status}/></div>
                      {g.registeredAt&&<div><div style={{fontSize:8,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:3}}>REGISTERED</div><div style={{fontSize:11,color:T.n800,fontFamily:"sans-serif"}}>{fmtDate(g.registeredAt)} {fmtTime(g.registeredAt)}</div></div>}
                      {g.checkedInAt&&<div><div style={{fontSize:8,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:3}}>CHECKED IN</div><div style={{fontSize:11,color:T.gold,fontWeight:700,fontFamily:"sans-serif"}}>{fmtDate(g.checkedInAt)} {fmtTime(g.checkedInAt)}</div></div>}
                      {g.status==="registered"&&<button onClick={()=>{onCheckIn(g.id);setPreview(null);}} style={{padding:"8px 14px",background:T.n800,color:T.gold,border:"none",borderRadius:2,cursor:"pointer",fontSize:9,letterSpacing:"0.15em",fontFamily:"sans-serif"}}>MANUAL CHECK-IN</button>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CARDS — mobile */}
      {isMobile&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sorted.length===0&&<div style={{padding:"24px",textAlign:"center",color:T.n400,fontSize:12,fontFamily:"sans-serif",background:T.white,border:`1px solid ${T.n200}`,borderRadius:4}}>No guests match.</div>}
          {sorted.map(g=>(
            <div key={g.id} style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,overflow:"hidden"}}>
              <div style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:14,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:600}}>{g.lastName}, {g.firstName}</div>
                  <div style={{fontSize:11,color:T.n400,fontFamily:"sans-serif",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.email||"No email"}</div>
                  <div style={{marginTop:6,display:"flex",alignItems:"center",gap:8}}><Badge status={g.status}/><span style={{fontSize:11,color:T.n400,fontFamily:"sans-serif"}}>{fmtDate(g.registeredAt)}</span></div>
                </div>
                <button onClick={()=>setPreview(preview===g.id?null:g.id)}
                  style={{flexShrink:0,width:40,height:38,background:preview===g.id?T.n800:T.n100,border:`1px solid ${preview===g.id?T.n800:T.n200}`,borderRadius:3,cursor:"pointer",fontSize:14,color:preview===g.id?T.gold:T.n600,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {preview===g.id?"▲":"▼"}
                </button>
              </div>
              {preview===g.id&&(
                <div style={{padding:"16px 14px",background:"#F9F7F2",borderTop:`1px solid ${T.n100}`}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><InvitationCard guest={g} event={event}/></div>
                  {g.status==="registered"&&<button onClick={()=>{onCheckIn(g.id);setPreview(null);}} style={{width:"100%",padding:"10px",background:T.n800,color:T.gold,border:"none",borderRadius:2,cursor:"pointer",fontSize:10,letterSpacing:"0.15em",fontFamily:"sans-serif",fontWeight:700}}>MANUAL CHECK-IN</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SCANNER ───────────────────────────────────────────────────────────────────
function ScannerView({ event, guests, onCheckIn }) {
  const [result,setResult]=useState(null);
  const [token,setToken]=useState("");
  const [scanning,setScanning]=useState(false);
  const check=(qr)=>{
    const g=guests.find(x=>x.qrToken===qr&&x.eventId===event.id);
    if(!g) return setResult({type:"invalid"});
    if(g.status==="checked-in") return setResult({type:"already",guest:g});
    onCheckIn(g.id); setResult({type:"success",guest:{...g,checkedInAt:new Date().toISOString()}});
  };
  const simulate=()=>{
    setScanning(true);
    setTimeout(()=>{
      const el=guests.filter(g=>g.eventId===event.id&&g.status==="registered");
      if(el.length) check(el[Math.floor(Math.random()*el.length)].qrToken); else setResult({type:"invalid"});
      setScanning(false);
    },1000);
  };
  const RES={success:{bg:"#061606",border:"#2D6B2D",color:"#7EC87E",icon:"✓",label:"ACCESS GRANTED"},already:{bg:"#160606",border:T.red,color:"#E57E7E",icon:"⚠",label:"ALREADY CHECKED IN"},invalid:{bg:"#160606",border:T.red,color:"#E57E7E",icon:"✕",label:"INVALID INVITATION"}};
  return (
    <div style={{minHeight:"70vh",background:T.black,display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 16px"}}>
      <div style={{width:"100%",maxWidth:320}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:9,color:T.gold,letterSpacing:"0.3em",fontFamily:"sans-serif",marginBottom:4}}>XINAO EVENT STAFF</div>
          <div style={{fontSize:16,color:T.white,fontFamily:"'Georgia',serif",fontWeight:700}}>QR SCANNER</div>
          <div style={{fontSize:10,color:T.n400,marginTop:2,letterSpacing:"0.1em",fontFamily:"sans-serif"}}>{event.name.toUpperCase()}</div>
        </div>
        <div style={{width:"100%",aspectRatio:"1",background:"#111",border:`1px solid ${scanning?T.gold:"#1A1A1A"}`,borderRadius:4,marginBottom:12,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {[[0,0],[0,1],[1,0],[1,1]].map(([tr,tc],i)=>(
            <div key={i} style={{position:"absolute",top:tr?"auto":"12px",bottom:tr?"12px":"auto",left:tc?"auto":"12px",right:tc?"12px":"auto",width:18,height:18,borderTop:tr?"none":`2px solid ${T.gold}`,borderBottom:tr?`2px solid ${T.gold}`:"none",borderLeft:tc?"none":`2px solid ${T.gold}`,borderRight:tc?`2px solid ${T.gold}`:"none"}}/>
          ))}
          {scanning?<div style={{textAlign:"center"}}><div style={{fontSize:26,color:T.gold,animation:"spin 1s linear infinite"}}>◎</div><div style={{fontSize:9,color:T.n400,marginTop:5,letterSpacing:"0.15em",fontFamily:"sans-serif"}}>SCANNING…</div></div>
          :<div style={{textAlign:"center"}}><div style={{fontSize:32,color:"#1A1A1A"}}>⊟</div><div style={{fontSize:9,color:T.n600,marginTop:5,letterSpacing:"0.1em",fontFamily:"sans-serif"}}>POINT CAMERA AT QR</div></div>}
        </div>
        <button onClick={simulate} disabled={scanning} style={{width:"100%",padding:"13px 0",background:scanning?T.n800:T.gold,color:T.black,border:"none",borderRadius:2,cursor:scanning?"not-allowed":"pointer",fontSize:11,fontWeight:700,letterSpacing:"0.18em",fontFamily:"sans-serif",marginBottom:10}}>
          {scanning?"SCANNING…":"SIMULATE SCAN"}
        </button>
        <div style={{display:"flex",gap:7,marginBottom:18}}>
          <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Enter QR token" onKeyDown={e=>e.key==="Enter"&&check(token.trim())}
            style={{flex:1,padding:"10px 11px",background:"#111",border:"1px solid #2A2520",borderRadius:2,color:T.white,fontSize:12,fontFamily:"sans-serif",outline:"none",minWidth:0}}/>
          <button onClick={()=>check(token.trim())} style={{padding:"10px 12px",background:"#1A1A1A",border:"1px solid #2A2520",borderRadius:2,color:T.n400,cursor:"pointer",fontSize:11,fontFamily:"sans-serif",flexShrink:0}}>CHECK</button>
        </div>
        {result&&(()=>{const R=RES[result.type];return(
          <div style={{padding:18,background:R.bg,border:`1px solid ${R.border}`,borderRadius:4,textAlign:"center"}}>
            <div style={{fontSize:32,color:R.color,marginBottom:6}}>{R.icon}</div>
            <div style={{fontSize:11,color:R.color,letterSpacing:"0.18em",fontFamily:"sans-serif",fontWeight:700}}>{R.label}</div>
            {result.guest&&<div style={{fontSize:16,color:T.white,fontFamily:"'Georgia',serif",marginTop:5}}>{result.guest.firstName} {result.guest.lastName}</div>}
            {result.type==="already"&&result.guest?.checkedInAt&&<div style={{fontSize:10,color:T.n400,marginTop:3,fontFamily:"sans-serif"}}>Checked in at {fmtTime(result.guest.checkedInAt)}</div>}
            <button onClick={()=>{setResult(null);setToken("");}} style={{marginTop:10,padding:"7px 16px",background:"transparent",border:"1px solid #2A2520",color:T.n400,cursor:"pointer",borderRadius:2,fontSize:9,letterSpacing:"0.18em",fontFamily:"sans-serif"}}>SCAN NEXT</button>
          </div>
        );})()}
      </div>
    </div>
  );
}

// ── GUEST REGISTRATION ────────────────────────────────────────────────────────
function GuestRegistrationView({ event, tokenStr, allGuests, onRegister }) {
  const existing=allGuests.find(g=>g.guestToken===tokenStr&&g.eventId===event?.id);
  const done=existing?.status==="registered"||existing?.status==="checked-in";
  const [step,setStep]=useState(()=>{ if(!event||!tokenStr) return "invalid"; if(done) return "already"; return "form"; });
  const [form,setForm]=useState({firstName:existing?.firstName||"",lastName:existing?.lastName||"",email:existing?.email||"",phone:existing?.phone||"",consent:false});
  const [errors,setErrors]=useState({});
  const [saved,setSaved]=useState(done?existing:null);

  const validate=()=>{const e={};if(!form.firstName.trim())e.firstName="Required";if(!form.lastName.trim())e.lastName="Required";if(!form.email.trim()||!/\S+@\S+\.\S+/.test(form.email))e.email="Valid email required";if(!form.consent)e.consent="Please accept to continue";setErrors(e);return Object.keys(e).length===0;};
  const submit=()=>{if(!validate())return;const g={id:`g-${uid()}`,eventId:event.id,...form,firstName:form.firstName.trim(),lastName:form.lastName.trim(),email:form.email.trim(),phone:form.phone.trim(),status:"registered",guestToken:tokenStr,qrToken:`qr-${uid()}`,registeredAt:new Date().toISOString(),checkedInAt:null};onRegister(g);setSaved(g);setStep("success");};

  if(step==="invalid") return(<div style={{minHeight:"100vh",background:T.cream,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{textAlign:"center",maxWidth:280}}><div style={{fontSize:28,marginBottom:10,color:T.n400}}>✕</div><div style={{fontSize:15,fontFamily:"'Georgia',serif",color:T.n800,marginBottom:6}}>Invitation Not Found</div><div style={{fontSize:12,color:T.n400,fontFamily:"sans-serif",lineHeight:1.7}}>This link is invalid or expired.</div></div></div>);

  if(step==="already"&&saved) return(<div style={{minHeight:"100vh",background:T.cream,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 16px"}}><div style={{width:"100%",maxWidth:400,background:T.goldBg,border:`1px solid ${T.goldBorder}`,borderRadius:4,padding:"12px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16,color:T.gold}}>✓</span><span style={{fontSize:11,color:T.gold,fontFamily:"sans-serif"}}>You are already registered.</span></div><InvitationCard guest={saved} event={event}/></div>);

  if(step==="success"&&saved) return(<div style={{minHeight:"100vh",background:T.cream,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 16px"}}><div style={{width:"100%",maxWidth:400,background:T.greenBg,border:`1px solid ${T.greenBorder}`,borderRadius:4,padding:"12px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18,color:T.green}}>✓</span><div><div style={{fontSize:11,fontWeight:700,color:T.green,letterSpacing:"0.12em",fontFamily:"sans-serif"}}>REGISTRATION CONFIRMED</div><div style={{fontSize:11,color:T.green,fontFamily:"sans-serif",marginTop:1}}>Your invitation is ready below.</div></div></div><InvitationCard guest={saved} event={event}/><button onClick={()=>alert("Download available in production build.")} style={{marginTop:14,padding:"11px 22px",background:T.gold,color:T.white,border:"none",borderRadius:2,cursor:"pointer",fontSize:10,letterSpacing:"0.18em",fontFamily:"sans-serif",fontWeight:700}}>⬇ DOWNLOAD INVITATION</button><div style={{fontSize:10,color:T.n400,marginTop:7,fontFamily:"sans-serif",textAlign:"center"}}>Present this QR code at the entrance on {event.date}.</div></div>);

  return(
    <div style={{minHeight:"100vh",background:T.cream,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 16px"}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:20,fontWeight:700,color:T.gold,fontFamily:"'Georgia',serif",letterSpacing:"0.08em"}}>XINAO</div>
          <div style={{width:14,height:1,background:T.gold,margin:"7px auto"}}/>
          <div style={{fontSize:8,letterSpacing:"0.3em",color:T.n600,fontFamily:"sans-serif"}}>CONFIRM YOUR ATTENDANCE</div>
        </div>
        <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:14,marginBottom:18,textAlign:"center"}}>
          <div style={{fontSize:14,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800,marginBottom:2}}>{event.name}</div>
          {event.subtitle&&<div style={{fontSize:9,color:T.gold,letterSpacing:"0.12em",fontFamily:"sans-serif",marginBottom:3}}>{event.subtitle}</div>}
          <div style={{fontSize:10,color:T.gold,fontFamily:"sans-serif",marginBottom:2}}>{event.date} · {event.time}</div>
          <div style={{fontSize:10,color:T.n600,fontFamily:"sans-serif"}}>{event.location}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["First Name *","firstName"],["Last Name *","lastName"]].map(([l,f])=>(
              <div key={f}><label style={{display:"block",fontSize:9,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:4}}>{l.toUpperCase()}</label>
              <input value={form[f]} onChange={e=>{setForm(x=>({...x,[f]:e.target.value}));setErrors(er=>({...er,[f]:""}));}} style={{width:"100%",padding:"9px 11px",background:T.white,border:`1px solid ${errors[f]?T.red:T.n200}`,borderRadius:2,fontSize:13,fontFamily:"sans-serif",color:T.n800,outline:"none",boxSizing:"border-box"}}/>
              {errors[f]&&<div style={{fontSize:10,color:T.red,marginTop:2,fontFamily:"sans-serif"}}>{errors[f]}</div>}</div>
            ))}
          </div>
          {[["Email Address *","email","email"],["Phone (optional)","phone","text"]].map(([l,f,t])=>(
            <div key={f}><label style={{display:"block",fontSize:9,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:4}}>{l.toUpperCase()}</label>
            <input type={t} value={form[f]} onChange={e=>{setForm(x=>({...x,[f]:e.target.value}));setErrors(er=>({...er,[f]:""}));}} style={{width:"100%",padding:"9px 11px",background:T.white,border:`1px solid ${errors[f]?T.red:T.n200}`,borderRadius:2,fontSize:13,fontFamily:"sans-serif",color:T.n800,outline:"none",boxSizing:"border-box"}}/>
            {errors[f]&&<div style={{fontSize:10,color:T.red,marginTop:2,fontFamily:"sans-serif"}}>{errors[f]}</div>}</div>
          ))}
          <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
            <input type="checkbox" id="consent" checked={form.consent} onChange={e=>{setForm(f=>({...f,consent:e.target.checked}));setErrors(er=>({...er,consent:""}));}} style={{marginTop:3,flexShrink:0}}/>
            <div><label htmlFor="consent" style={{fontSize:11,color:T.n600,fontFamily:"sans-serif",lineHeight:1.6,cursor:"pointer"}}>I consent to Xinao Group processing my data for event management.</label>
            {errors.consent&&<div style={{fontSize:10,color:T.red,marginTop:2,fontFamily:"sans-serif"}}>{errors.consent}</div>}</div>
          </div>
          <button onClick={submit} style={{padding:"12px 0",background:T.n800,color:T.cream,border:"none",borderRadius:2,fontSize:10,letterSpacing:"0.22em",fontFamily:"sans-serif",fontWeight:700,cursor:"pointer"}}>CONFIRM & RECEIVE INVITATION</button>
        </div>
      </div>
    </div>
  );
}

// ── EVENT DETAIL ──────────────────────────────────────────────────────────────
function EventDetail({ event, guests, onBack, onCheckIn, onEdit }) {
  const isMobile=useIsMobile();
  const [tab,setTab]=useState("overview");
  const [guestFilter,setGuestFilter]=useState("all");
  const eg=guests.filter(g=>g.eventId===event.id);
  const counts={total:eg.length,registered:eg.filter(g=>g.status==="registered").length,checkedIn:eg.filter(g=>g.status==="checked-in").length,invited:eg.filter(g=>g.status==="invited").length};
  const regPct=counts.total?Math.round(((counts.registered+counts.checkedIn)/counts.total)*100):0;
  const clickStat=(f)=>{setGuestFilter(f);setTab("guests");};
  const STATS=[{key:"all",label:"TOTAL",val:counts.total,color:T.n800,hover:T.n100},{key:"registered",label:"REG.",val:counts.registered,color:T.green,hover:T.greenBg},{key:"checked-in",label:"IN",val:counts.checkedIn,color:T.gold,hover:T.goldBg},{key:"invited",label:"WAITING",val:counts.invited,color:T.n400,hover:T.n100}];
  return(
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",color:T.gold,cursor:"pointer",fontSize:10,letterSpacing:"0.15em",fontFamily:"sans-serif",padding:0,marginBottom:14}}>← ALL EVENTS</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:10,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.3em",color:T.gold,fontFamily:"sans-serif",marginBottom:3}}>{event.subtitle||"XINAO EVENT"}</div>
          <div style={{fontSize:isMobile?20:24,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800,lineHeight:1.2}}>{event.name}</div>
          <div style={{fontSize:11,color:T.n400,fontFamily:"sans-serif",marginTop:3}}>{event.date} · {event.time} · {event.location}</div>
        </div>
        <button onClick={onEdit} style={{padding:"8px 14px",background:"none",border:`1px solid ${T.n200}`,borderRadius:2,cursor:"pointer",fontSize:9,letterSpacing:"0.15em",fontFamily:"sans-serif",color:T.n600,flexShrink:0}}>✎ EDIT</button>
      </div>
      {/* Tabs — scrollable on mobile */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.n200}`,marginBottom:20,overflowX:"auto"}}>
        {["overview","guests","scanner"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",background:"none",border:"none",borderBottom:`2px solid ${tab===t?T.n800:"transparent"}`,cursor:"pointer",fontSize:9,letterSpacing:"0.15em",fontFamily:"sans-serif",color:tab===t?T.n800:T.n400,fontWeight:tab===t?700:400,marginBottom:-1,whiteSpace:"nowrap"}}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      {tab==="overview"&&(
        <div>
          <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:"12px 16px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{fontSize:9,color:T.n600,fontFamily:"sans-serif",letterSpacing:"0.1em"}}>REGISTRATION PROGRESS</div><div style={{fontSize:9,color:T.gold,fontFamily:"sans-serif",fontWeight:700}}>{regPct}%</div></div>
            <div style={{height:3,background:T.n100,borderRadius:2}}><div style={{width:`${regPct}%`,height:"100%",background:`linear-gradient(90deg,${T.gold},${T.goldLight})`,borderRadius:2,transition:"width 0.8s ease"}}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:24}}>
            {STATS.map(s=>(
              <div key={s.key} onClick={()=>clickStat(s.key)}
                style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:isMobile?"10px 8px":"14px",cursor:"pointer",userSelect:"none",textAlign:"center"}}
                onMouseEnter={e=>e.currentTarget.style.background=s.hover}
                onMouseLeave={e=>e.currentTarget.style.background=T.white}>
                <div style={{fontSize:7,letterSpacing:"0.15em",color:T.n400,fontFamily:"sans-serif",marginBottom:6}}>{s.label}</div>
                <div style={{fontSize:isMobile?22:28,fontFamily:"'Georgia',serif",fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:7,color:T.gold,fontFamily:"sans-serif",marginTop:6}}>LIST →</div>
              </div>
            ))}
          </div>
          {/* Cover image preview */}
          {event.coverImage&&<div style={{marginBottom:20}}><div style={{fontSize:9,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:8}}>INVITATION TEMPLATE</div><img src={event.coverImage} alt="template" style={{width:"100%",maxHeight:200,objectFit:"cover",borderRadius:4,border:`1px solid ${T.n200}`}}/></div>}
          <div style={{fontSize:9,letterSpacing:"0.22em",color:T.n400,fontFamily:"sans-serif",marginBottom:10}}>RECENT REGISTRATIONS</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {eg.filter(g=>g.registeredAt).sort((a,b)=>new Date(b.registeredAt)-new Date(a.registeredAt)).slice(0,5).map(g=>(
              <div key={g.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:"10px 14px",gap:10,flexWrap:"wrap"}}>
                <div><div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n800}}>{g.firstName} {g.lastName}</div><div style={{fontSize:10,color:T.n400,fontFamily:"sans-serif"}}>{g.email||""}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:10,color:T.n400,fontFamily:"sans-serif"}}>{fmtDate(g.registeredAt)}</div><Badge status={g.status}/></div>
              </div>
            ))}
            {eg.filter(g=>g.registeredAt).length===0&&<div style={{padding:"22px",textAlign:"center",color:T.n400,fontSize:12,fontFamily:"sans-serif",background:T.white,border:`1px solid ${T.n200}`,borderRadius:4}}>No registrations yet.</div>}
          </div>
        </div>
      )}
      {tab==="guests"&&<GuestsTable guests={eg} event={event} onCheckIn={onCheckIn} initialFilter={guestFilter}/>}
      {tab==="scanner"&&<ScannerView event={event} guests={guests} onCheckIn={onCheckIn}/>}
    </div>
  );
}

// ── EVENTS LIST ───────────────────────────────────────────────────────────────
function EventsList({ events, guests, onSelect, onNew, onEdit, onDuplicate, onDelete }) {
  const isMobile=useIsMobile();
  const [menu,setMenu]=useState(null);
  const {sorted,key:sk,dir:sd,toggle}=useSort(events,"name");
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:isMobile?"flex-start":"flex-end",marginBottom:24,gap:12,flexDirection:isMobile?"column":"row"}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.3em",color:T.gold,fontFamily:"sans-serif",marginBottom:5}}>ADMIN DASHBOARD</div>
          <div style={{fontSize:isMobile?22:26,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800}}>Events</div>
          <div style={{fontSize:11,color:T.n400,fontFamily:"sans-serif",marginTop:2}}>{events.length} event{events.length!==1?"s":""}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:5}}>
            {[["name","NAME"],["date","DATE"],["status","STATUS"]].map(([k,l])=>(
              <button key={k} onClick={()=>toggle(k)} style={{padding:"6px 10px",background:sk===k?T.n800:T.white,color:sk===k?T.white:T.n600,border:`1px solid ${sk===k?T.n800:T.n200}`,borderRadius:2,cursor:"pointer",fontSize:9,letterSpacing:"0.08em",fontFamily:"sans-serif",display:"flex",alignItems:"center",gap:3}}>
                {l}<span style={{fontSize:8,color:sk===k?T.goldLight:T.n300}}>{sk===k?(sd==="asc"?"▲":"▼"):"↕"}</span>
              </button>
            ))}
          </div>
          <button onClick={onNew} style={{padding:"9px 16px",background:T.n800,color:T.cream,border:"none",borderRadius:2,cursor:"pointer",fontSize:10,letterSpacing:"0.18em",fontFamily:"sans-serif",fontWeight:700}}>+ NEW</button>
        </div>
      </div>
      {events.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:T.n400,fontFamily:"sans-serif",fontSize:13,border:`1px dashed ${T.n200}`,borderRadius:4}}>No events. Create your first event.</div>}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {sorted.map(evt=>{
          const eg=guests.filter(g=>g.eventId===evt.id);
          const reg=eg.filter(g=>g.status!=="invited").length;
          const pct=eg.length?Math.round(reg/eg.length*100):0;
          return(
            <div key={evt.id} style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,overflow:"hidden",position:"relative"}}>
              {evt.coverImage&&<img src={evt.coverImage} alt="" style={{width:"100%",height:80,objectFit:"cover",display:"block"}}/>}
              <div style={{height:3,background:`linear-gradient(90deg,${T.gold} ${pct}%,${T.n200} ${pct}%)`}}/>
              <div style={{padding:"16px 14px",cursor:"pointer"}} onClick={()=>onSelect(evt)}>
                <div style={{fontSize:8,letterSpacing:"0.25em",color:T.gold,fontFamily:"sans-serif",marginBottom:3}}>{evt.subtitle||"XINAO EVENT"}</div>
                <div style={{fontSize:16,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800,marginBottom:2}}>{evt.name}</div>
                <div style={{fontSize:10,color:T.n400,fontFamily:"sans-serif",marginBottom:12}}>{evt.date} · {evt.location}</div>
                <div style={{display:"flex",gap:14}}>
                  {[["INVITED",eg.length],["REG.",reg],["IN",eg.filter(g=>g.status==="checked-in").length]].map(([l,v])=>(
                    <div key={l}><div style={{fontSize:7,letterSpacing:"0.18em",color:T.n400,fontFamily:"sans-serif"}}>{l}</div><div style={{fontSize:18,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:700}}>{v}</div></div>
                  ))}
                </div>
              </div>
              <div style={{position:"absolute",top:evt.coverImage?88:8,right:8}}>
                <button onClick={e=>{e.stopPropagation();setMenu(menu===evt.id?null:evt.id);}} style={{width:26,height:26,background:T.white,border:`1px solid ${T.n200}`,borderRadius:2,cursor:"pointer",fontSize:13,color:T.n400,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>⋯</button>
                {menu===evt.id&&(
                  <div style={{position:"absolute",top:29,right:0,background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,boxShadow:"0 4px 20px rgba(0,0,0,0.1)",zIndex:100,minWidth:140,overflow:"hidden"}}>
                    {[{l:"✎  Edit",a:()=>{setMenu(null);onEdit(evt);}},{l:"⧉  Duplicate",a:()=>{setMenu(null);onDuplicate(evt);}},{l:"✕  Delete",a:()=>{setMenu(null);onDelete(evt);},danger:true}].map(item=>(
                      <button key={item.l} onClick={item.a} style={{display:"block",width:"100%",padding:"9px 13px",background:"none",border:"none",borderBottom:`1px solid ${T.n100}`,cursor:"pointer",fontSize:11,fontFamily:"sans-serif",color:item.danger?T.red:T.n800,textAlign:"left"}}>{item.l}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {menu&&<div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setMenu(null)}/>}
    </div>
  );
}

// ── ADMIN LOGIN ───────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pwd,setPwd]=useState("");
  const [err,setErr]=useState(false);
  const submit=()=>{ if(pwd==="xinao2026"||pwd==="admin") onLogin(); else{setErr(true);setTimeout(()=>setErr(false),2000);} };
  return(
    <div style={{minHeight:"100vh",background:T.black,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:340,textAlign:"center"}}>
        <div style={{marginBottom:32}}><div style={{fontSize:26,fontWeight:700,color:T.gold,fontFamily:"'Georgia',serif",letterSpacing:"0.1em",marginBottom:5}}>XINAO</div><div style={{width:18,height:1,background:T.gold,margin:"0 auto 8px"}}/>
        <div style={{fontSize:9,letterSpacing:"0.3em",color:T.n600,fontFamily:"sans-serif"}}>ADMIN DASHBOARD</div></div>
        <div style={{background:"#111",border:`1px solid ${err?"#9F0E10":"#1A1A1A"}`,borderRadius:4,padding:28}}>
          <div style={{fontSize:9,letterSpacing:"0.2em",color:T.n400,fontFamily:"sans-serif",marginBottom:4,textAlign:"left"}}>PASSWORD</div>
          <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="Enter admin password" style={{width:"100%",padding:"11px 12px",background:"#0A0A0A",border:`1px solid ${err?"#9F0E10":"#2A2520"}`,borderRadius:2,color:T.white,fontSize:14,fontFamily:"sans-serif",outline:"none",boxSizing:"border-box",marginBottom:7}}/>
          {err&&<div style={{fontSize:11,color:"#E57E7E",fontFamily:"sans-serif",marginBottom:7,textAlign:"left"}}>Incorrect password.</div>}
          <button onClick={submit} style={{width:"100%",padding:"12px",background:T.gold,color:T.black,border:"none",borderRadius:2,cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:"0.18em",fontFamily:"sans-serif",marginTop:4}}>SIGN IN</button>
          <div style={{fontSize:10,color:T.n600,fontFamily:"sans-serif",marginTop:14}}>Demo password: <code style={{color:T.n400}}>xinao2026</code></div>
        </div>
      </div>
    </div>
  );
}

// ── GUEST PORTAL ──────────────────────────────────────────────────────────────
function GuestPortal({ events, guests, onRegister }) {
  const [token,setToken]=useState("tok-g7h8i9");
  const pg=guests.find(g=>g.guestToken===token);
  const pe=events.find(e=>e.id===pg?.eventId);
  return(
    <div style={{minHeight:"100vh"}}>
      {/* Demo banner */}
      <div style={{background:"#1A1000",border:"none",borderBottom:`2px solid ${T.gold}`,padding:"10px 16px",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:9,letterSpacing:"0.2em",color:T.gold,fontFamily:"sans-serif",fontWeight:700}}>🔍 DEMO MODE</span>
        <span style={{fontSize:9,letterSpacing:"0.15em",color:T.goldLight,fontFamily:"sans-serif"}}>Select guest to preview their registration experience:</span>
        <select value={token} onChange={e=>setToken(e.target.value)} style={{padding:"5px 10px",background:"#111",border:`1px solid ${T.gold}`,borderRadius:2,fontSize:12,fontFamily:"sans-serif",color:T.gold,cursor:"pointer"}}>
          {guests.map(g=><option key={g.id} value={g.guestToken}>{g.firstName} {g.lastName} [{g.status}]</option>)}
        </select>
        <span style={{fontSize:9,color:T.n600,fontFamily:"sans-serif"}}>In production: each guest gets a unique private URL</span>
      </div>
      {pe&&pg?<GuestRegistrationView key={token} event={pe} tokenStr={token} allGuests={guests} onRegister={onRegister}/>
      :<div style={{textAlign:"center",padding:80,color:T.n400,fontFamily:"sans-serif",fontSize:13}}>Guest not found.</div>}
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [role,setRole]=useState("selector");
  const [adminAuth,setAdminAuth]=useState(false);
  const [events,setEvents]=useState(INITIAL_EVENTS);
  const [guests,setGuests]=useState(INITIAL_GUESTS);
  const [adminPage,setAdminPage]=useState("list");
  const [selectedEvt,setSelectedEvt]=useState(null);
  const [formOpen,setFormOpen]=useState(false);
  const [editEvt,setEditEvt]=useState(null);
  const [delConfirm,setDelConfirm]=useState(null);
  const [scannerEvt,setScannerEvt]=useState(null);

  const goHome=useCallback(()=>{setAdminPage("list");setSelectedEvt(null);},[]);
  const openNew=()=>{setEditEvt(null);setFormOpen(true);};
  const openEdit=(evt)=>{setEditEvt(evt);setFormOpen(true);};
  const saveEvent=(form)=>{
    if(editEvt){const u={...editEvt,...form};setEvents(p=>p.map(e=>e.id===editEvt.id?u:e));if(selectedEvt?.id===editEvt.id)setSelectedEvt(u);}
    else setEvents(p=>[...p,{...form,id:`evt-${uid()}`}]);
    setFormOpen(false);setEditEvt(null);
  };
  const dupEvent=(evt)=>setEvents(p=>[...p,{...evt,id:`evt-${uid()}`,name:`${evt.name} (Copy)`}]);
  const delEvent=(evt)=>setDelConfirm(evt);
  const confirmDel=()=>{setEvents(p=>p.filter(e=>e.id!==delConfirm.id));setGuests(p=>p.filter(g=>g.eventId!==delConfirm.id));if(selectedEvt?.id===delConfirm.id)goHome();setDelConfirm(null);};
  const checkIn=useCallback((gid)=>setGuests(p=>p.map(g=>g.id===gid?{...g,status:"checked-in",checkedInAt:new Date().toISOString()}:g)),[]);
  const register=useCallback((ng)=>setGuests(p=>{const i=p.findIndex(g=>g.guestToken===ng.guestToken&&g.eventId===ng.eventId);return i>=0?p.map((g,x)=>x===i?{...g,...ng}:g):[...p,ng];}),[]);

  const CSS = `*{box-sizing:border-box;margin:0;padding:0;}@keyframes spin{to{transform:rotate(360deg)}}input::placeholder{color:#A09890}select{appearance:auto}`;

  // ── SELECTOR ──
  if(role==="selector") return(
    <div style={{minHeight:"100vh",background:T.black,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:420,textAlign:"center"}}>
        <div style={{fontSize:30,fontWeight:700,color:T.gold,fontFamily:"'Georgia',serif",letterSpacing:"0.1em",marginBottom:4}}>XINAO</div>
        <div style={{width:22,height:1,background:T.gold,margin:"0 auto 7px"}}/>
        <div style={{fontSize:8,letterSpacing:"0.3em",color:T.n600,fontFamily:"sans-serif",marginBottom:40}}>INVITE SYSTEM</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[{label:"ADMIN DASHBOARD",sub:"Manage events, guests & check-ins",role:"admin",icon:"⊞"},{label:"GUEST PORTAL",sub:"Register & receive your invitation",role:"guest",icon:"✉"},{label:"EVENT SCANNER",sub:"Scan QR codes at the entrance",role:"scanner",icon:"⊟"}].map(item=>(
            <button key={item.role} onClick={()=>setRole(item.role)}
              style={{padding:"18px 20px",background:"#111",border:"1px solid #1A1A1A",borderRadius:4,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"border-color 0.2s",width:"100%"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.gold}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#1A1A1A"}>
              <span style={{fontSize:20,color:T.gold,width:28,textAlign:"center",flexShrink:0}}>{item.icon}</span>
              <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:11,fontWeight:700,color:T.white,letterSpacing:"0.14em",fontFamily:"sans-serif",marginBottom:2}}>{item.label}</div><div style={{fontSize:11,color:T.n400,fontFamily:"sans-serif"}}>{item.sub}</div></div>
              <span style={{fontSize:14,color:T.n600}}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── ADMIN LOGIN ──
  if(role==="admin"&&!adminAuth) return(<><style>{CSS}</style><AdminLogin onLogin={()=>setAdminAuth(true)}/></>);

  // ── TOP BAR ──
  const TopBar=()=>(
    <div style={{background:T.black,borderBottom:"1px solid #161616",padding:"0 16px",position:"sticky",top:0,zIndex:200}}>
      <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:46}}>
        <button onClick={()=>{if(role==="admin")goHome();else setRole("selector");}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:0}}>
          <span style={{fontSize:13,fontWeight:700,color:T.gold,letterSpacing:"0.12em",fontFamily:"'Georgia',serif"}}>XINAO</span>
          <span style={{width:1,height:11,background:"#2A2520",display:"block"}}/>
          <span style={{fontSize:8,color:T.n600,letterSpacing:"0.22em",fontFamily:"sans-serif"}}>{role==="admin"?"ADMIN":role==="guest"?"GUEST PORTAL":"SCANNER"}</span>
        </button>
        <button onClick={()=>{if(role==="admin")setAdminAuth(false);setRole("selector");}} style={{padding:"4px 11px",background:"none",border:"1px solid #2A2520",borderRadius:2,cursor:"pointer",fontSize:9,letterSpacing:"0.14em",fontFamily:"sans-serif",color:T.n600}}>← BACK</button>
      </div>
    </div>
  );

  if(role==="admin") return(
    <div style={{fontFamily:"'Georgia',serif",background:T.n100,minHeight:"100vh"}}>
      <style>{CSS}</style>
      <TopBar/>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 16px"}}>
        {adminPage==="list"&&<EventsList events={events} guests={guests} onSelect={e=>{setSelectedEvt(e);setAdminPage("detail");}} onNew={openNew} onEdit={openEdit} onDuplicate={dupEvent} onDelete={delEvent}/>}
        {adminPage==="detail"&&selectedEvt&&<EventDetail event={selectedEvt} guests={guests} onBack={goHome} onCheckIn={checkIn} onEdit={()=>openEdit(selectedEvt)}/>}
      </div>
      {formOpen&&<EventFormModal initial={editEvt} onSave={saveEvent} onClose={()=>{setFormOpen(false);setEditEvt(null);}}/>}
      {delConfirm&&<Modal title="Delete Event" message={`Delete "${delConfirm.name}"? Removes all ${guests.filter(g=>g.eventId===delConfirm.id).length} guests. Cannot be undone.`} onConfirm={confirmDel} onCancel={()=>setDelConfirm(null)} danger/>}
    </div>
  );

  if(role==="guest") return(
    <div style={{fontFamily:"'Georgia',serif",minHeight:"100vh"}}>
      <style>{CSS}</style>
      <TopBar/>
      <GuestPortal events={events} guests={guests} onRegister={register}/>
    </div>
  );

  if(role==="scanner") return(
    <div style={{fontFamily:"'Georgia',serif",minHeight:"100vh",background:T.black}}>
      <style>{CSS}</style>
      <TopBar/>
      <div style={{background:"#111",padding:"8px 16px",display:"flex",gap:10,alignItems:"center",borderBottom:"1px solid #1A1A1A",flexWrap:"wrap"}}>
        <span style={{fontSize:8,letterSpacing:"0.22em",color:T.n600,fontFamily:"sans-serif"}}>EVENT:</span>
        <select defaultValue="" onChange={e=>setScannerEvt(events.find(x=>x.id===e.target.value)||null)} style={{padding:"4px 9px",background:"#1A1A1A",border:"1px solid #2A2520",borderRadius:2,fontSize:12,fontFamily:"sans-serif",color:T.white}}>
          <option value="" disabled>Select event…</option>
          {events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      {scannerEvt?<ScannerView event={scannerEvt} guests={guests} onCheckIn={checkIn}/>:<div style={{textAlign:"center",padding:80,color:T.n400,fontFamily:"sans-serif",fontSize:13}}>Select an event above.</div>}
    </div>
  );

  return null;
}
