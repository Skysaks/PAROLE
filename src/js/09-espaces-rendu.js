function agg(list){
  let wk = 0, wj = 0, av = 0, ro = 0; const c = { encours:0, tenue:0 };
  list.forEach(x => { const w = x.amb || 2; if (x.st === "encours") c.encours++; if (x.st === "tenue"){ c.tenue++; wk += w; wj += w; } else if (x.st === "rompue" || x.st === "contestee"){ wj += w; if (x.st === "rompue") ro++; } else if (x.st === "abandon" || x.st === "partielle") av++; });
  return { encours:c.encours, tenue:c.tenue, fiab: wj ? Math.round(100*wk/wj) + " %" : "—", franc: av + ro ? Math.round(100*av/(av+ro)) + " %" : "—" };
}
function openNewSpace(){
  const n = h("input", {type:"text", id:"sp-n", maxlength:"60", placeholder:"Équipe commerciale, promotion 2027, staff U15"});
  const ty = h("select", {id:"sp-t"}, ["Équipe","Promotion","Club","Incubateur","Association"].map(t => h("option", {value:t}, t)));
  shell("Créer un espace", h("label", {for:"sp-n"}, "Nom de l'espace", n), h("label", {for:"sp-t"}, "Type", ty),
    h("div", {class:"meta"}, "En créant cet espace, tu en deviens l'animateur et tu acceptes ses cinq garde-fous :"),
    h("dl", {style:"display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0;font-size:.9rem"}, GARDE.map(([a,b]) => [h("dt", {style:"font-weight:700;color:var(--accent)"}, a), h("dd", {style:"margin:0"}, b)])),
    h("div", {class:"frow"}, h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Annuler"), h("button", {class:"btn", type:"button", onclick:()=>{ const v = n.value.trim(); if (v.length < 3){ toast("Donne un nom à l'espace."); n.focus(); return; } const id = "e" + newId(); mine("voix").espaces[id] = { n:v, type:ty.value, c:Date.now() }; S.ui.space = id; closeModal(); commit("voix"); }}, "Créer l'espace")));
  n.focus();
}
function viewSpaces(ps, vs){
  const all = Object.values(IDX.sp), m = me(), cur = S.ui.space && IDX.sp[S.ui.space];
  if (cur){
    const mem = cur.members.includes(m), list = ps.filter(x => spaceOf(x.p) === cur.id && !x.hidden), a = agg(list), week = list.filter(x => x.st === "encours" && endOf(x.p.due) - Date.now() < 7*DAY).length;
    const row = (u) => { const nx = list.filter(x => x.uid === u && x.st === "encours").sort((p,q)=>endOf(p.p.due)-endOf(q.p.due))[0];
      return h("div", {class:"person"}, avatar(u), h("div", {class:"grow"}, h("button", {class:"nm", onclick:()=>openProfile(u)}, nameOf(u) + (u === cur.owner ? " · animateur" : "")),
        h("div", {class:"sub"}, nx ? shown(nx) : "Aucune parole en cours dans l'espace"), nx && nx.p.ck ? h("div", {class:"meta"}, nx.p.ck.s === "dur" ? "En difficulté : un coup de main ?" : "En bonne voie") : null),
        nx ? h("span", {class:"pill"}, "J-" + Math.max(0, Math.ceil((endOf(nx.p.due)-Date.now())/DAY)-1)) : null); };
    return [h("div", {class:"top"}, h("button", {class:"back", onclick:()=>{ S.ui.space = null; render(); }}, "‹ Tous les espaces"), h("h1", null, cur.n), h("div", {class:"sub", style:"margin-bottom:8px"}, cur.type + " · " + cur.members.length + " membre" + (cur.members.length > 1 ? "s" : "") + " · animé par " + nameOf(cur.owner))),
      h("div", {class:"pad"}, h("div", {class:"tally", style:"margin:0"},
        h("div", null, h("b", null, a.encours), "paroles en cours"), h("div", null, h("b", null, week), "échéances sous 7 jours"), h("div", null, h("b", null, a.tenue), "paroles tenues"),
        h("div", null, h("b", null, a.fiab), "fiabilité collective"), h("div", null, h("b", null, a.franc), "franchise collective")),
        h("div", {class:"acts"}, mem ? h("button", {class:"btn", onclick:()=>openPost("p", null, {vis:"e:" + cur.id})}, "Engager une parole ici") : h("button", {class:"btn", onclick:()=>{ mine("voix").membre[cur.id] = Date.now(); commit("voix"); }}, "Rejoindre l'espace"),
          mem && cur.owner !== m ? h("button", {class:"btn ghost", onclick:()=>{ delete mine("voix").membre[cur.id]; commit("voix"); }}, "Quitter") : null,
          mem ? h("button", {class:"btn ghost", onclick:()=>copyText("Rejoins l'espace « " + cur.n + " » sur Parole : " + location.href.split("#")[0] + "#espaces", "Invitation copiée.")}, "Inviter") : null)),
      mem ? [sec("Tour de table", "la prochaine échéance de chacun"), cur.members.map(row),
        sec("Paroles de l'espace"), list.length ? list.sort((p,q)=>q.at-p.at).map(x => card(x, ps, vs)) : h("div", {class:"empty"}, "Aucune parole dans cet espace. Lance le premier tour de table.")]
        : h("div", {class:"empty"}, "Les paroles de cet espace ne sont visibles que de ses membres."),
      sec("Garde-fous de l'espace"), h("div", {class:"prose"}, h("dl", null, GARDE.map(([a,b]) => [h("dt", null, a), h("dd", null, b)])))];
  }
  const mineS = all.filter(sp => sp.members.includes(m)), others = all.filter(sp => !sp.members.includes(m));
  const line = (sp) => h("div", {class:"person"}, h("div", {class:"grow"}, h("button", {class:"nm", onclick:()=>{ S.ui.space = sp.id; render(); }}, sp.n), h("div", {class:"sub"}, sp.type + " · " + sp.members.length + " membre" + (sp.members.length > 1 ? "s" : "") + " · animé par " + nameOf(sp.owner))), h("button", {class:"btn ghost", onclick:()=>{ S.ui.space = sp.id; render(); }}, "Ouvrir"));
  return [topbar("Espaces"),
    h("div", {class:"pitch"}, h("h2", null, "Parole pour les équipes, les promotions et les clubs"), h("p", null, "Un registre privé où chacun engage ses objectifs devant ses pairs. Tour de table chaque semaine, fiabilité collective, entraide quand quelqu'un décroche."), h("button", {class:"btn inv", onclick:openNewSpace}, "Créer un espace")),
    sec("Mes espaces"), mineS.length ? mineS.map(line) : h("div", {class:"empty"}, "Tu n'es membre d'aucun espace."),
    others.length ? [sec("Autres espaces"), others.map(line)] : null,
    sec("À quoi ça sert"), h("div", {class:"prose"}, h("dl", null, [["Équipe","Les objectifs de la semaine deviennent des paroles datées. Le point d'équipe part du tour de table."],["Promotion","Chaque apprenant engage son prochain rendu. Le formateur voit qui décroche avant l'échéance."],["Club","Le staff s'engage sur les séances et les suivis. Les joueurs majeurs sur leur préparation."],["Incubateur","Chaque fondateur annonce son jalon du mois. La promotion sert de témoin."]].map(([a,b]) => [h("dt", null, a), h("dd", null, b)])))];
}
function measure(){
  const ps = paroles(), due = ps.filter(x => x.st !== "encours"), said = due.filter(x => x.p.decl), jug = ps.filter(x => x.p.decl === "tenue" && x.wit.length);
  const votes = jug.reduce((n,x) => n + x.wit.filter(w=>w.v).length + (x.jury && x.jury.v ? 1 : 0), 0), exp = jug.reduce((n,x) => n + x.wit.length + (x.jury ? 1 : 0), 0);
  const cks = ps.filter(x => x.p.ck).length, open = ps.filter(x => x.st === "encours").length, pct = (a,b) => b ? Math.round(100*a/b) + " %" : "—";
  return h("div", {class:"tally", style:"margin:12px 0"},
    h("div", null, h("b", null, members().length), "membres"), h("div", null, h("b", null, ps.length), "paroles engagées"),
    h("div", null, h("b", null, pct(said.length, due.length)), "échéances closes par l'auteur lui-même"), h("div", null, h("b", null, pct(votes, exp)), "verdicts rendus sur verdicts attendus"),
    h("div", null, h("b", null, pct(ps.filter(x=>x.wit.length).length, ps.length)), "paroles avec au moins un témoin"), h("div", null, h("b", null, pct(cks, open + due.length)), "paroles avec un point du jour"));
}
function rail(ps, vs){
  const soon = ps.filter(x => x.st === "encours" && !x.hidden).sort((a,b)=>endOf(a.p.due)-endOf(b.p.due)).slice(0,4);
  const counts = bag(); [...ps.filter(x => !x.hidden), ...vs].forEach(x => { if (x.p.th) counts[x.p.th] = (counts[x.p.th]||0) + 1; });
  const f = follows(me());
  const sug = members().filter(u => u !== me() && !f[u]).map(u => ({ u, r:recordOf(u, ps) })).sort((a,b)=>b.r.tenue-a.r.tenue).slice(0,3);
  return [
    h("div", {class:"box"}, h("h3", null, "Échéances proches"), soon.length ? soon.map(x => { const left = Math.max(0, Math.ceil((endOf(x.p.due)-Date.now())/DAY)-1); return h("div", {class:"mini"}, h("b", {style: left <= 2 ? "color:var(--broken)" : ""}, "J-" + left), h("div", null, h("button", {class:"nm", style:"font-size:13px", onclick:()=>openProfile(x.uid)}, nameOf(x.uid)), h("div", null, shown(x)))); }) : h("div", {class:"sub"}, "Aucune parole en cours.")),
    Object.keys(counts).length ? h("div", {class:"box"}, h("h3", null, "Thèmes actifs"), h("div", {class:"chips"}, Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([t,c]) => h("button", {class:"chip", onclick:()=>{ S.ui.theme = t; location.hash = "#explorer"; render(); }}, String(t).slice(0,20) + " · " + c)))) : null,
    sug.length ? h("div", {class:"box"}, h("h3", null, "À suivre"), sug.map(s => person(s.u, ps))) : null
  ];
}
let RC = { slots:0 }, lastKey = "", rafId = 0, feedN = 15;
/* Les mises à jour venues du réseau sont regroupées : un seul affichage par image, au lieu d'un par événement */
function schedule(){ if (rafId) return; rafId = requestAnimationFrame(() => { rafId = 0; render(); }); }
function render(){
  stopPlay();
  const keepY = window.scrollY;
  const route = (location.hash || "#accueil").slice(1);
  const views = { accueil:viewHome, explorer:viewExplore, espaces:viewSpaces, activite:viewActivity, profil:viewProfile, donnees:viewData, coulisses:viewAbout };
  const key = views[route] ? route : "accueil";
  document.querySelectorAll("#nav a").forEach(a => { if (a.getAttribute("href") === "#"+key) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  const bl = blocked(), ps = paroles().filter(x => !bl[x.uid]), vs = voix().filter(x => !bl[x.uid]);
  ps.forEach(x => { x.hidden = !canSee(x); });
  RC = { slots: mySlots(ps).length };
  const nb = toJudge(ps).length, badge = document.getElementById("badge"); badge.hidden = !nb; badge.textContent = nb;
  const src = document.getElementById("src"); src.replaceChildren();
  if (S.canReal) src.append(h("div", {class:"seg"}, h("button", {"aria-pressed":String(S.src==="demo"), onclick:()=>{ S.src="demo"; S.ui.profile=null; render(); }}, "Démo"), h("button", {"aria-pressed":String(S.src==="reel"), onclick:()=>{ S.src="reel"; S.ui.profile=null; render(); refreshNames(); }}, "Réseau réel")));
  src.append(S.src === "demo" ? h("div", null, "Démo : membres fictifs, témoins simulés. ", h("button", {class:"link", onclick:()=>{ try{localStorage.removeItem(LS);}catch(e){} seed(); S.ui.thread = {}; render(); toast("Démo réinitialisée."); }}, "Réinitialiser")) : h("div", null, S.stale ? "Réseau injoignable pour l'instant, l'affichage peut dater." : "Réseau réel : chaque personne invitée publie sous son nom."));
  const focusQ = document.activeElement && document.activeElement.id === "ex-q";
  let content; try { content = [views[key](ps, vs)].flat(Infinity).filter(Boolean); } catch(e){ content = [topbar("Parole"), h("div", {class:"empty"}, "Cet écran n'a pas pu s'afficher. Recharge la page ou reviens à l'accueil.")]; }
  document.getElementById("app").replaceChildren(...content);
  document.getElementById("rail").replaceChildren(...rail(ps, vs).filter(Boolean));
  if (lastKey === key + (S.ui.profile || "")) window.scrollTo(0, keepY); else lastKey = key + (S.ui.profile || "");
  try { const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#F5F5F7"); } catch(e){}
  if (S.src === "demo" || S.canReal) checkCelebrate(ps);
  if (focusQ){ const q = document.getElementById("ex-q"); if (q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
}
document.getElementById("speak").addEventListener("click", () => openPost("p"));
document.getElementById("fab").addEventListener("click", () => openPost("p"));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
window.addEventListener("hashchange", () => {
  if (location.hash !== "#profil") S.ui.profile = null; feedN = 15;
  const go = () => { window.scrollTo(0,0); render(); };
  const calm = document.documentElement.dataset.motion === "less" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (document.startViewTransition && !calm) { try { document.startViewTransition(go); } catch(e){ go(); } } else go();
});
boot().then(() => {
  if (!dict) return;
  dict.onFinal(({text}) => appendFinal(text));
  dict.onPartial(({text}) => { if (partialEl) partialEl.textContent = text; });
  dict.onState(({state}) => setLive(state === "listening" || state === "starting"));
});
