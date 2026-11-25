/* ---------- modèle ---------- */
function witnessesOf(author, pid){
  const out = [], T = D().temoins;
  for (const w in T){
    const e = T[w] && T[w].items && T[w].items[pid];
    if (e && typeof e === "object" && e.a === author && w !== author && !IDX.voidW.has(w + "/" + pid)) out.push({ h:Number(e.h)||0, uid:w, v: e.v === "ok" || e.v === "ko" ? e.v : null, at:Number(e.at)||0, vat:Number(e.vat)||0, j:!!e.j, why:String(e.why||"").slice(0,200), amb:Number(e.amb)||0, to:!!e.to, sup:!!e.sup, mot:String(e.mot||"").slice(0,160) });
  }
  return out;
}
/* Parade à la complaisance : un témoin que l'auteur a lui-même confirmé compte ½, un juré tiré au sort hors du cercle compte 2 */
/* Index recalculé à chaque lecture : jurés qui ont contesté, et désaveux par témoin (a confirmé ce que le juré a contesté) */
let IDX = { dis:bag(), sp:bag(), reps:bag(), num:bag(), first:bag(), voidW:new Set() };
const repsOf = (p) => (Array.isArray(p.reps) ? p.reps : (p.rep ? [p.rep] : [])).filter(r => r && typeof r === "object").slice(0, 4);
function backersOf(author, pid){
  const out = [], V = D().voix;
  for (const u in V){ const b = V[u] && V[u].soutiens && V[u].soutiens[pid]; if (b && b.a === author && u !== author) out.push({ uid:u, m:Math.max(0, Math.min(1000, Number(b.m)||0)), h:!!b.h }); }
  return out;
}
function pledges(uid, ps){ let due = 0, done = 0; ps.forEach(x => { const b = (x.back||[]).find(b => b.uid === uid); if (b && x.st === "tenue"){ due++; if (b.h) done++; } }); return { due, done }; }
const COVERS = ["linear-gradient(120deg,#0058C7,#0B7A3B)","linear-gradient(120deg,#5B2EA6,#C2261A)","linear-gradient(120deg,#0B6E6E,#1B3A8A)","linear-gradient(120deg,#1D1D1F,#6A6A72)","linear-gradient(120deg,#A6341B,#C98A00)"];
const DISPO = ["Missions","Emploi","Mentorat","Association","Conférences"];
const spaceOf = (p) => typeof p.vis === "string" && p.vis.startsWith("e:") ? p.vis.slice(2) : null;
function spaces(){
  const out = bag(), V = D().voix;
  for (const u in V){ const e = (V[u] && V[u].espaces) || {}; for (const id in e) if (e[id] && e[id].n) out[id] = { id, owner:u, n:String(e[id].n).slice(0,60), type:String(e[id].type || "Équipe").slice(0,20), c:Number(e[id].c)||0, members:[u] }; }
  for (const u in V){ const m = (V[u] && V[u].membre) || {}; for (const id in m) if (m[id] && out[id] && !out[id].members.includes(u)) out[id].members.push(u); }
  return out;
}
/* Qui voit quoi : public, abonnés de l'auteur, ou membres d'un espace. Témoins, juré et destinataire voient toujours. */
function canSee(x){
  const m = me(), v = x.p.vis;
  if (x.uid === m || !v || v === "pub") return true;
  if (x.wit.some(w => w.uid === m) || (x.jury && x.jury.uid === m) || x.p.to === m) return true;
  if (v === "abo") return !!follows(m)[x.uid];
  if (v === "sel") return Array.isArray(x.p.aud) && x.p.aud.includes(m);
  const sp = IDX.sp[spaceOf(x.p)]; return !!(sp && sp.members.includes(m));
}
function buildIdx(){
  const T = D().temoins, jko = new Set(), dis = bag();
  for (const w in T) for (const pid in ((T[w] && T[w].items) || {})){ const e = T[w].items[pid]; if (e && e.j && e.v === "ko") jko.add(e.a + "/" + pid); }
  for (const w in T) for (const pid in ((T[w] && T[w].items) || {})){ const e = T[w].items[pid]; if (e && !e.j && e.v === "ok" && jko.has(e.a + "/" + pid)) dis[w] = (dis[w] || 0) + 1; }
  const reps = bag(), P = D().paroles, first = bag();
  for (const u in P) for (const id in ((P[u] && P[u].items) || {})){ const p = P[u].items[id]; if (p && p.from && p.from.u && p.from.u !== u) reps[p.from.u + "/" + p.from.id] = (reps[p.from.u + "/" + p.from.id] || 0) + 1; if (p && p.c) first[u] = Math.min(first[u] || Infinity, Number(p.c)); }
  const V = D().voix; for (const u in V){ const d = Number(V[u] && V[u].profil && V[u].profil.depuis); if (d) first[u] = Math.min(first[u] || Infinity, d); else if (!first[u]) first[u] = Infinity; }
  const num = bag(); Object.keys(first).sort((a,b) => first[a] - first[b] || (a < b ? -1 : 1)).forEach((u,i) => { num[u] = i + 1; });
  const voidW = new Set();
  for (const w in T){
    const act = []; const its = (T[w] && T[w].items) || {};
    for (const pid in its){ const e = its[pid]; if (!e || typeof e !== "object" || e.j || e.to) continue; const q = P[e.a] && P[e.a].items && P[e.a].items[pid]; if (!q || !validDay(q.due)) continue;
      if ((!q.decl && endOf(q.due) >= Date.now()) || (q.decl === "tenue" && !e.v)) act.push([pid, Number(e.at)||0]); }
    if (act.length > SLOTS) act.sort((a,b) => a[1]-b[1]).slice(SLOTS).forEach(([pid]) => voidW.add(w + "/" + pid));
  }
  IDX = { dis, sp: spaces(), reps, num, first, voidW };
}
const weightOf = (author, w) => (recip(author, w) ? 0.5 : 1) * ((IDX.dis[w] || 0) >= 2 ? 0.5 : 1);
const PORTEE = { 1:"modeste", 2:"sérieuse", 3:"exigeante" };
function porteeOf(wit, jury){
  const a = (e) => e && e.amb >= 1 && e.amb <= 3 ? Math.round(e.amb) : 0;
  if (a(jury)) return a(jury);
  const v = wit.map(a).filter(Boolean); return v.length ? Math.round(v.reduce((x,y)=>x+y,0) / v.length) : 0;
}
function recip(author, w){ const T = D().temoins[author]; return !!(T && T.items && Object.values(T.items).some(e => e && e.a === w && e.v === "ok" && !e.j)); }
function juryOf(author, pid, p, wit, entry){
  if (p.decl !== "tenue" || !wit.length) return null;

  const sid = spaceOf(p), sp = sid && IDX.sp[sid];
  const bk = p.proj ? backersOf(author, pid).map(b => b.uid) : [];
  const el = sp ? sp.members.filter(u => u !== author && !bk.includes(u) && !wit.some(w=>w.uid===u)) : members().filter(u => u !== author && !bk.includes(u) && u !== p.to && !wit.some(w=>w.uid===u) && !follows(author)[u] && !follows(u)[author]);
  el.sort((a,b) => hash(pid + a) - hash(pid + b));
  /* Un verdict de juré n'est retenu que si son auteur est indépendant ; sur le réseau réel il doit aussi figurer parmi les trois premiers du tirage */
  if (entry){ const rank = el.indexOf(entry.uid); if (rank >= 0 && (S.src === "demo" || rank < 3)) return entry; }
  if (Date.now() - (Number(p.dAt)||0) >= JURY_DAYS*DAY) return null;
  if (!el.length) return null;
  return { uid:el[0], v:null, at:0, vat:0, j:true, why:"", amb:0 };
}
function score(author, wit, jury){
  let ok = 0, ko = 0;
  wit.forEach(w => { const k = w.to ? 2 : weightOf(author, w.uid); if (w.v === "ok") ok += k; if (w.v === "ko") ko += k; });
  if (jury && jury.v === "ok") ok += 2; if (jury && jury.v === "ko") ko += 2;
  return { ok, ko };
}
/* Verdict à l'aveugle : tant que tous n'ont pas jugé (ou que le délai court), personne ne voit le sens des verdicts déjà rendus */
function blind(p, wit, jury){
  if (p.decl !== "tenue" || !wit.length) return false;
  const all = wit.length + (jury ? 1 : 0), done = wit.filter(w => w.v).length + (jury && jury.v ? 1 : 0);
  return done < all && Date.now() - (Number(p.dAt)||0) < JURY_DAYS*DAY;
}
const sealedFor = (x) => !!x.p.seal && x.uid !== me() && x.st === "encours";
const shown = (x) => sealedFor(x) ? "Parole scellée jusqu'à son échéance" : String(x.p.t || "").slice(0, PMAX);
function statusOf(p, wit, jury, author){
  if (p.decl === "abandon") return "abandon";
  if (p.decl === "partielle") return "partielle";
  if (p.decl === "tenue"){
    if (!wit.length) return "sanstemoin";
    if (blind(p, wit, jury)) return "attente";
    const s = score(author, wit, jury);
    if (s.ok > s.ko) return "tenue";
    if (s.ko > 0) return "contestee";
    return "attente";
  }
  if (Date.now() > endOf(p.due)) return wit.length ? "rompue" : "sanstemoin";
  return "encours";
}
function paroles(){
  buildIdx();
  const out = [], P = D().paroles;
  for (const uid in P){
    const items = (P[uid] && P[uid].items) || {};
    let seen = 0;
    for (const pid in items){
      if (++seen > 300) break;
      const p = items[pid];
      if (!p || typeof p !== "object" || !validDay(p.due)) continue;
      const every = witnessesOf(uid, pid), wit = every.filter(w=>!w.j); wit.forEach(w => { w.to = w.to && p.to === w.uid; }); const jury = juryOf(uid, pid, p, wit, every.find(w=>w.j));
      out.push({ k:"p", uid, id:pid, p, wit, jury, back: p.proj ? backersOf(uid, pid) : [], amb: porteeOf(wit, jury), st: statusOf(p, wit, jury, uid), at: Math.max(Number(p.c)||0, Number(p.dAt)||0) });
    }
  }
  const byKey = bag(); out.forEach(x => { byKey[x.uid + "/" + x.id] = x; });
  out.forEach(x => {
    if (x.p.fix && x.st === "tenue"){ const o = byKey[x.uid + "/" + x.p.fix]; if (o && (o.st === "rompue" || o.st === "contestee")) o.repaired = true; }
    if (x.p.pact && x.p.pact.u && x.p.pact.u !== x.uid){ const o = byKey[x.p.pact.u + "/" + x.p.pact.id]; if (o && o.p.to === x.uid && x.p.to === o.uid){ x.partner = o; o.partner = x; } }
  });
  return out;
}
function voix(){
  const out = [], V = D().voix;
  for (const uid in V){
    const posts = (V[uid] && V[uid].posts) || {};
    for (const id in posts){ const p = posts[id]; if (p && typeof p === "object" && p.t) out.push({ k:"v", uid, id, p, at:Number(p.c)||0 }); }
  }
  return out;
}
const repliesTo = (vs, x) => vs.filter(v => v.p.re && v.p.re.k === x.k && v.p.re.u === x.uid && v.p.re.id === x.id).sort((a,b)=>a.at-b.at);
function recordOf(uid, ps){
  const r = { tenue:0, rompue:0, contestee:0, abandon:0, partielle:0, encours:0, attente:0, sanstemoin:0 };
  let wk = 0, wj = 0, ps_ = 0, pn = 0;
  const since = Date.now() - 365*DAY;
  ps.filter(x=>x.uid===uid && x.at >= since).forEach(x=>{ r[x.st]++; const w = x.amb || 2;
    if (x.st === "tenue"){ wk += w; wj += w; if (x.amb){ ps_ += x.amb; pn++; } } else if (x.st === "rompue" || x.st === "contestee") wj += x.repaired ? w / 2 : w; });
  r.jugees = r.tenue + r.rompue + r.contestee;
  r.fiab = r.jugees >= 3 ? Math.round(100 * wk / wj) : null;
  r.portee = pn ? Math.round(10 * ps_ / pn) / 10 : null;
  const aveux = r.abandon + r.partielle;
  r.franc = aveux + r.rompue > 0 ? Math.round(100 * aveux / (aveux + r.rompue)) : null;
  return r;
}
/* Série : paroles tenues d'affilée. Un aveu (abandon, en partie) ne la casse pas ; une parole rompue ou contestée, si. */
function streak(uid, ps){
  let n = 0;
  for (const x of ps.filter(x => x.uid === uid).sort((a,b) => b.at - a.at)){ if (x.st === "tenue") n++; else if (x.st === "rompue" || x.st === "contestee") break; }
  return n;
}
function miles(uid, ps){
  const r = recordOf(uid, ps), out = [];
  if (r.tenue >= 1) out.push("Première parole tenue");
  if (r.tenue >= 3) out.push("Trois paroles tenues");
  if (streak(uid, ps) >= 3) out.push("Série de 3");
  if (r.jugees >= 2 && r.rompue + r.contestee === 0) out.push("Aucun silence");
  if (r.abandon + r.partielle >= 1) out.push("A su renoncer franchement");
  if (rigor(uid).n >= 3) out.push("Juge régulier");
  return out;
}
function rigor(uid){ const T = D().temoins[uid]; const v = T && T.items ? Object.values(T.items).filter(e => e && (e.v === "ok" || e.v === "ko")) : []; return { n:v.length, ko:v.filter(e=>e.v==="ko").length }; }
function mySlots(ps){
  const m = (D().temoins[me()] && D().temoins[me()].items) || {};
  return ps.filter(x => m[x.id] && !m[x.id].j && !m[x.id].to && m[x.id].a === x.uid && (x.st === "encours" || (x.p.decl === "tenue" && !m[x.id].v)));
}
function toJudge(ps){
  const m = (D().temoins[me()] && D().temoins[me()].items) || {};
  return ps.filter(x => x.uid !== me() && x.p.decl === "tenue" && ((m[x.id] && m[x.id].a === x.uid && !m[x.id].v) || (x.jury && x.jury.uid === me() && !x.jury.v)));
}
function mine(kind){
  const d = D(); if (!d[kind][me()]) d[kind][me()] = kind === "voix" ? { profil:{}, posts:{}, suivis:{} } : { items:{} };
  const o = d[kind][me()];
  if (kind === "voix"){ o.profil = o.profil || {}; o.posts = o.posts || {}; o.suivis = o.suivis || {}; o.bloques = o.bloques || {}; o.signals = o.signals || {}; o.espaces = o.espaces || {}; o.membre = o.membre || {}; o.soutiens = o.soutiens || {}; o.msgs = o.msgs || {}; } else o.items = o.items || {};
  return o;
}
const blocked = () => (D().voix[me()] && D().voix[me()].bloques) || {};
const follows = (uid) => (D().voix[uid] && D().voix[uid].suivis) || {};
const followersOf = (uid) => Object.keys(D().voix).filter(u => follows(u)[uid]);
const members = () => [...new Set([...Object.keys(D().paroles), ...Object.keys(D().voix), ...Object.keys(D().temoins)])];

