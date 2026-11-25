/* ---------- utilitaires ---------- */
function h(tag, attrs, ...kids){
  const el = document.createElement(tag);
  for (const k in (attrs||{})){
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)){
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
const iso = (t) => { const d = new Date(t); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const endOf = (day) => { const [y,m,d] = String(day).split("-").map(Number); return new Date(y, m-1, d, 23, 59, 59).getTime(); };
const fmt = (t) => new Date(t).toLocaleDateString("fr-FR", {day:"numeric", month:"short"});
const validDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s||""));
const newId = () => "x" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const clone = (o) => JSON.parse(JSON.stringify(o));
/* Sécurité : les clés venues d'autres membres vont dans des objets sans prototype, pour qu'une clé piégée ne puisse rien altérer */
const bag = () => Object.create(null);
const arr = (v) => Array.isArray(v) ? v : [];
/* Sécurité : toute donnée lue (réseau ou navigateur) est ramenée à un schéma strict avant usage. Champ inconnu ou de mauvais type : ignoré. */
const zS = (n) => (v) => typeof v === "string" ? v.slice(0, n) : undefined;
const zN = (v) => typeof v === "number" && isFinite(v) ? v : undefined;
const zB = (v) => v === true ? true : undefined;
const zT = (v) => v === true || (typeof v === "number" && isFinite(v)) ? v : undefined;
const zE = (...o) => (v) => o.includes(v) ? v : undefined;
const zDay = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
const zO = (spec) => (v) => { if (!v || typeof v !== "object" || Array.isArray(v)) return undefined; const o = {}; for (const k in spec){ const r = spec[k](v[k]); if (r !== undefined) o[k] = r; } return o; };
const zM = (fn, max) => (v) => { const o = {}; if (!v || typeof v !== "object" || Array.isArray(v)) return o; let i = 0; for (const k of Object.keys(v)){ if (i++ >= (max || 400)) break; if (k === "__proto__" || k === "constructor" || k === "prototype" || k.length > 80) continue; const r = fn(v[k]); if (r !== undefined) o[k] = r; } return o; };
const zL = (fn, max) => (v) => Array.isArray(v) ? v.slice(0, max).map(fn).filter(x => x !== undefined) : undefined;
const zParole = zO({ seal:zB, pact:zO({u:zS(80), id:zS(80)}), fix:zS(80), plan:zS(160), relay:zB, t:zS(140), th:zS(20), due:zDay, c:zN, decl:zE("tenue","abandon","partielle"), proof:zS(240), dAt:zN, vis:zS(90), aud:zL(zS(80),30), to:zS(80), proj:zB, contre:zS(140), ch:zS(50), from:zO({u:zS(80), id:zS(80)}), ck:zO({d:zDay, s:zE("ok","dur")}), reps:zL(zO({from:zDay, why:zS(240), at:zN, n:zN}),4), rep:zO({from:zDay, why:zS(240), at:zN}), late:zS(240) });
const zEntry = zO({ a:zS(80), at:zN, v:zE("ok","ko"), vat:zN, j:zB, to:zB, why:zS(200), amb:zN, mot:zS(160), sup:zT, h:zN });
const zVoix = zO({ profil:zO({ titre:zS(70), bio:zS(400), lieu:zS(40), devise:zS(80), liens:zL(zO({t:zS(24), u:zS(120)}),2), dispo:zL(zS(20),5), themes:zL(zS(20),4), couleur:zN, pins:zL(zS(80),3), honneur:zS(40), fier:zS(140), jamais:zS(140), parrain:zS(80), depuis:zN }),
  posts:zM(zO({ t:zS(280), c:zN, th:zS(20), re:zO({k:zE("p","v"), u:zS(80), id:zS(80)}) })), suivis:zM(zT), bloques:zM(zT), signals:zM(zO({r:zS(60), at:zN}),100), espaces:zM(zO({n:zS(60), type:zS(20), c:zN}),20), membre:zM(zT,50), soutiens:zM(zO({a:zS(80), m:zN, at:zN, h:zT}),200), msgs:zM(zO({k:zS(80), a:zS(80), t:zS(280), c:zN}),300) });
function sanitize(kind, v){
  if (kind === "voix") return zVoix(v) || { profil:{}, posts:{}, suivis:{} };
  const fn = kind === "paroles" ? (x) => { const o = zParole(x); return o && o.t && o.due ? o : undefined; } : (x) => { const o = zEntry(x); return o && o.a ? o : undefined; };
  return { items: zM(fn, kind === "paroles" ? 300 : 800)(v && typeof v === "object" ? v.items : null) };
}
function sanitizeAll(X){ ["paroles","temoins","voix"].forEach(k => { const src = X[k] && typeof X[k] === "object" ? X[k] : {}, out = bag(); Object.keys(src).slice(0,5000).forEach(u => { if (u !== "__proto__" && u.length <= 80) out[u] = sanitize(k, src[u]); }); X[k] = out; }); return X; }
const hash = (s) => { let x = 7; for (const c of String(s)) x = (x*31 + c.charCodeAt(0)) >>> 0; return x; };
function ago(t){ const d = Date.now() - t; if (d < HOUR) return "à l'instant"; if (d < DAY) return "il y a " + Math.floor(d/HOUR) + " h"; if (d < 7*DAY) return "il y a " + Math.floor(d/DAY) + " j"; return fmt(t); }
let toastTimer;
function toast(msg){ const t = document.getElementById("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(()=>{t.hidden = true;}, 4200); }
function nameOf(uid){
  if (S.src === "demo") return uid === "moi" ? "Toi" : (PERS[uid] || "Membre");
  return S.names[uid] || (uid === S.uid ? "Toi" : "Membre");
}
const prof = (uid) => (D().voix[uid] && D().voix[uid].profil) || {};
function avatar(uid, cls){
  const n = nameOf(uid).split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return h("button", {class:"av " + (cls||""), style:"background-color:hsl(" + (hash(uid)%360) + " 40% 40%)", "aria-label":"Profil de " + nameOf(uid), onclick:()=>openProfile(uid)}, n);
}
function openProfile(uid){ S.ui.profile = uid; S.ui.ptab = "paroles"; if (location.hash === "#profil") render(); else location.hash = "#profil"; }

