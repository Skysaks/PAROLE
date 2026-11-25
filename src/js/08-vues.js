/* ---------- vues ---------- */
function viewHome(ps, vs){
  const judge = toJudge(ps);
  const pv = ps.filter(x => !x.hidden);
  let items = [...pv, ...vs.filter(v => !v.p.re)].filter(x => !judge.includes(x)).sort((a,b)=>b.at-a.at);
  const myTh = prefs.perso ? arr(prof(me()).themes) : [];
  if (S.ui.tab === "pourtoi" && myTh.length) items.sort((a,b) => (b.at + (myTh.includes(b.p.th) ? 2*DAY : 0)) - (a.at + (myTh.includes(a.p.th) ? 2*DAY : 0)));
  if (S.ui.tab === "abos"){ const f = follows(me()); items = items.filter(x => f[x.uid] || x.uid === me()); }
  if (S.ui.tab === "echeances") items = pv.filter(x => x.st === "encours").sort((a,b)=>endOf(a.p.due)-endOf(b.p.due));
  const total = items.length; items = items.slice(0, feedN);
  return [topbar("Aujourd'hui", [["pourtoi","Pour toi"],["abos","Abonnements"],["echeances","Échéances"]], S.ui.tab, (k)=>{ S.ui.tab = k; render(); }),
    S.ui.tab === "pourtoi" ? [greet(ps), hero(ps)] : null,
    S.ui.tab !== "echeances" && judge.length ? [sec("À toi de juger", judge.length + " verdict" + (judge.length>1?"s":"")), judge.map(x=>card(x,ps,vs)), sec("Le fil")] : null,
    items.length ? items.map(x=>card(x,ps,vs)) : h("div", {class:"empty"}, S.src === "reel" ? "Le réseau réel est vide. Prends la parole le premier, puis invite des témoins sur cette page." : "Rien ici pour l'instant."),
    total > items.length ? h("div", {class:"morefeed"}, h("button", {class:"btn ghost", onclick:()=>{ feedN += 15; render(); }}, "Afficher la suite · " + (total - items.length))) : (items.length ? h("div", {class:"empty"}, "✓ Tu es à jour. Rien d'autre avant la prochaine échéance.") : null)];
}
function exploreResults(ps, vs){
  const q = S.ui.q.trim().toLowerCase(), th = S.ui.theme;
  const match = (x) => !x.hidden && !(q && x.k === "p" && sealedFor(x)) && (!th || x.p.th === th) && (!q || String(x.p.t).toLowerCase().includes(q) || nameOf(x.uid).toLowerCase().includes(q));
  const people = members().filter(u => !q || nameOf(u).toLowerCase().includes(q) || String(prof(u).titre||"").toLowerCase().includes(q))
    .filter(u => !th || arr(prof(u).themes).includes(th) || ps.some(x=>x.uid===u && x.p.th===th))
    .map(u => ({ u, r:recordOf(u, ps) })).sort((a,b)=>(b.r.fiab==null?-1:b.r.fiab)-(a.r.fiab==null?-1:a.r.fiab) || b.r.tenue-a.r.tenue).slice(0,6);
  const soon = ps.filter(x => x.st === "encours" && match(x)).sort((a,b)=>endOf(a.p.due)-endOf(b.p.due)).slice(0,6);
  const kept = ps.filter(x => x.st === "tenue" && match(x)).sort((a,b)=>b.at-a.at).slice(0,4);
  const voices = vs.filter(v => !v.p.re && match(v)).sort((a,b)=>b.at-a.at).slice(0,6);
  const myLieu = String(prof(me()).lieu || "").trim().toLowerCase();
  const near = myLieu && !q && !th ? members().filter(u => u !== me() && String(prof(u).lieu || "").trim().toLowerCase() === myLieu).slice(0,4) : [];
  return [near.length ? [sec("Près de chez toi", prof(me()).lieu), near.map(u => person(u, ps))] : null, sec("Membres", "classés par fiabilité"), people.length ? people.map(p=>person(p.u, ps)) : h("div", {class:"empty"}, "Aucun membre ne correspond."),
    sec("Échéances proches"), soon.length ? soon.map(x=>card(x,ps,vs)) : h("div", {class:"empty"}, "Aucune parole en cours sur ce filtre."),
    kept.length ? [sec("Paroles tenues récemment"), kept.map(x=>card(x,ps,vs))] : null,
    voices.length ? [sec("Voix récentes"), voices.map(x=>card(x,ps,vs))] : null];
}
function viewExplore(ps, vs){
  const counts = bag(); [...ps.filter(x => !x.hidden), ...vs].forEach(x => { if (x.p.th) counts[x.p.th] = (counts[x.p.th]||0) + 1; });
  const res = h("div", {id:"ex-results"}, exploreResults(ps, vs));
  return [topbar("Explorer"),
    h("div", {class:"pad", style:"display:grid;gap:12px;border-bottom:1px solid var(--rule)"},
      h("a", {class:"btn ghost mlinks", href:"#espaces", style:"text-decoration:none;justify-self:start"}, "Espaces d'équipe"),
      h("input", {class:"search", type:"text", id:"ex-q", placeholder:"Chercher une personne, une parole, un sujet", value:S.ui.q, "aria-label":"Recherche", oninput:(e)=>{ S.ui.q = e.target.value; res.replaceChildren(...exploreResults(ps, vs).flat(Infinity).filter(Boolean)); }}),
      h("div", {class:"chips"}, THEMES.filter(t=>counts[t]).map(t => h("button", {class:"chip", "aria-pressed":String(S.ui.theme===t), onclick:()=>{ S.ui.theme = S.ui.theme === t ? null : t; render(); }}, t + " · " + counts[t])))),
    res];
}
function notifications(ps, vs){
  const out = [], m = me();
  ps.filter(x => x.uid === m && x.jury && x.jury.v).forEach(x => out.push({ at:x.jury.vat, tag:"Juré", cls: x.jury.v === "ok" ? "green" : "red", txt:nameOf(x.jury.uid) + ", juré tiré au sort, " + (x.jury.v === "ok" ? "confirme" : "conteste") + " « " + x.p.t + " »", go:()=>openProfile(m) }));
  ps.filter(x => x.st === "tenue" && (x.back||[]).some(b => b.uid === m && !b.h)).forEach(x => out.push({ at:x.p.dAt, tag:"Soutien dû", cls:"red", txt:nameOf(x.uid) + " a tenu parole : « " + x.p.t + " ». Ton soutien est à honorer.", go:()=>openProfile(x.uid) }));
  ps.filter(x => x.uid === m).forEach(x => (x.back||[]).forEach(b => out.push({ at:x.at, tag:"Soutien", cls:"green", txt:nameOf(b.uid) + " promet " + b.m + " € si tu tiens « " + x.p.t + " »", go:()=>openProfile(b.uid) })));
  toJudge(ps).forEach(x => out.push({ at:x.p.dAt, tag: x.jury && x.jury.uid === m ? "Juré" : "Verdict dû", cls:"red", txt:nameOf(x.uid) + " dit avoir tenu : « " + x.p.t + " »", go:()=>{ S.ui.tab="pourtoi"; location.hash="#accueil"; } }));
  ps.filter(x=>x.uid===m).forEach(x => {
    x.wit.forEach(w => { out.push({ at:w.at, tag:"Témoin", txt:nameOf(w.uid) + " est témoin de « " + x.p.t + " »", go:()=>openProfile(w.uid) });
      if (w.v) out.push({ at:w.vat, tag: w.v === "ok" ? "Confirmé" : "Contesté", cls: w.v === "ok" ? "green" : "red", txt:nameOf(w.uid) + (w.v === "ok" ? " confirme" : " conteste") + " « " + x.p.t + " »", go:()=>openProfile(w.uid) }); });
    const left = Math.ceil((endOf(x.p.due) - Date.now()) / DAY) - 1;
    if (x.st === "encours" && left <= 3) out.push({ at:Date.now(), tag:"Échéance", cls:"red", txt:"J-" + Math.max(0,left) + " pour « " + x.p.t + " »", go:()=>openProfile(m) });
  });
  vs.filter(v => v.p.re && v.p.re.u === m && v.uid !== m).forEach(v => out.push({ at:v.at, tag:"Réponse", txt:nameOf(v.uid) + " : " + v.p.t, go:()=>openProfile(v.uid) }));
  followersOf(m).forEach(u => out.push({ at:Number(follows(u)[m])||0, tag:"Abonné", txt:nameOf(u) + " suit tes paroles", go:()=>openProfile(u) }));
  return out.sort((a,b)=>b.at-a.at);
}
function viewActivity(ps, vs){
  const n = notifications(ps, vs);
  return [topbar("Activité"), n.length ? n.map(x => h("div", {class:"notif"}, h("span", {class:"tag " + (x.cls||"")}, x.tag), h("button", {class:"nm", style:"font-weight:400", onclick:x.go}, x.txt), h("span", {class:"meta"}, ago(x.at))))
    : h("div", {class:"empty"}, "Rien à signaler. L'activité arrive avec tes premières paroles et tes premiers témoins.")];
}
function profileExtras(uid, ps){
  const own = ps.filter(x => x.uid === uid), vis = own.filter(x => !x.hidden), out = [];
  const dom = bag(); vis.filter(x => x.st === "tenue" && x.p.th).forEach(x => { dom[x.p.th] = (dom[x.p.th] || 0) + 1; });
  if (Object.keys(dom).length) out.push(sec("Domaines prouvés", "par thème"), h("div", {class:"pad"}, h("div", {class:"chips"}, Object.entries(dom).sort((a,b)=>b[1]-a[1]).map(([t,n]) => h("span", {class:"chip"}, String(t).slice(0,20) + " · " + n)))));
  const ch = bag(); vis.filter(x => x.p.ch).forEach(x => { const k = String(x.p.ch).slice(0,50); ch[k] = ch[k] || { n:0, k:0 }; ch[k].n++; if (x.st === "tenue") ch[k].k++; });
  if (Object.keys(ch).length) out.push(sec("Chantiers"), Object.entries(ch).map(([n,c]) => h("div", {class:"person", style:"display:block"}, h("div", {style:"display:flex;justify-content:space-between;gap:10px"}, h("b", null, n), h("span", {class:"meta"}, c.k + " tenue" + (c.k > 1 ? "s" : "") + " sur " + c.n)), h("div", {class:"bar2"}, h("span", {style:"width:" + Math.round(100*c.k/c.n) + "%"})))));
  const cer = bag(); own.forEach(x => x.wit.forEach(w => { cer[w.uid] = (cer[w.uid] || 0) + 1; }));
  const top = Object.entries(cer).sort((a,b)=>b[1]-a[1]).slice(0,3);
  if (top.length) out.push(sec("Cercle proche", "témoins fidèles"), top.map(([u,n]) => h("div", {class:"person"}, avatar(u), h("div", {class:"grow"}, h("button", {class:"nm", onclick:()=>openProfile(u)}, nameOf(u)), h("div", {class:"sub"}, "Témoin de " + n + " parole" + (n > 1 ? "s" : ""))))));
  const days = bag(), put = (t, c) => { if (!t) return; const k = iso(t); if (c === "k" || (c === "b" && days[k] !== "k") || !days[k]) days[k] = c; };
  own.forEach(x => { put(Number(x.p.c), "e"); if (x.st === "tenue") put(Number(x.p.dAt), "k"); else if (x.st === "rompue") put(endOf(x.p.due), "b"); else if (x.p.dAt) put(Number(x.p.dAt), "e"); });
  const start = new Date(); start.setHours(12,0,0,0); start.setDate(start.getDate() - 83 - ((start.getDay() + 6) % 7));
  const cells = []; for (let i = 0; i < 84 + ((new Date().getDay() + 6) % 7) + 1; i++){ const d = new Date(start.getTime() + i*DAY); cells.push(h("i", {class: days[iso(d.getTime())] || ""})); }
  out.push(sec("Douze dernières semaines", Object.keys(days).length + " jours actifs"), h("div", {class:"pad"}, h("div", {class:"cal", role:"img", "aria-label":"Calendrier d'activité : " + Object.keys(days).length + " jours actifs sur douze semaines"}, cells), h("div", {class:"meta", style:"margin-top:8px"}, "Vert : parole tenue. Teinte claire : parole engagée ou close. Rouge : parole rompue.")));
  return out;
}
function lucidity(ps){
  const pr = priv(), by = {50:[0,0], 70:[0,0], 90:[0,0]};
  ps.filter(x => x.uid === me() && pr[x.id] && by[pr[x.id].conf]).forEach(x => { if (x.st === "tenue"){ by[pr[x.id].conf][0]++; by[pr[x.id].conf][1]++; } else if (["rompue","contestee","abandon","partielle"].includes(x.st)) by[pr[x.id].conf][1]++; });
  return [50,70,90].filter(k => by[k][1]).map(k => "Annoncé " + k + " % : " + by[k][0] + " tenue" + (by[k][0] > 1 ? "s" : "") + " sur " + by[k][1]);
}
const EXPL = { "Fiabilité":"La part des paroles tenues parmi celles que des témoins ont jugées, sur douze mois. Une parole exigeante pèse plus qu'une parole modeste. Elle s'affiche à partir de trois paroles jugées.", "Série":"Le nombre de paroles tenues d'affilée. Dire « en partie » ou abandonner avant l'échéance ne la casse pas. Une parole rompue ou contestée la remet à zéro.", "Tenues":"Les paroles déclarées tenues et confirmées par les témoins, et par le juré tiré au sort quand il y en a un.", "Franchise":"Parmi les paroles non tenues, la part que le membre a déclarées lui-même (abandon ou en partie) plutôt que laissées sans réponse." };
function explain(k){ shell(k, h("p", {style:"margin:0;font-size:1.05rem;line-height:1.5"}, EXPL[k]), h("button", {class:"btn", type:"button", id:"ex-ok", onclick:closeModal}, "Compris")); document.getElementById("ex-ok").focus(); }
function openBilan(ps){
  const m = me(), own = ps.filter(x => x.uid === m), r = recordOf(m, ps), kept = own.filter(x => x.st === "tenue");
  const th = bag(); kept.forEach(x => { if (x.p.th) th[x.p.th] = (th[x.p.th] || 0) + 1; }); const topTh = Object.entries(th).sort((a,b)=>b[1]-a[1])[0];
  const cer = bag(); own.forEach(x => x.wit.forEach(w => { cer[w.uid] = (cer[w.uid] || 0) + 1; })); const topW = Object.entries(cer).sort((a,b)=>b[1]-a[1])[0];
  const adv = kept.filter(x => x.p.dAt).map(x => (endOf(x.p.due) - x.p.dAt) / DAY), avg = adv.length ? Math.round(adv.reduce((a,b)=>a+b,0) / adv.length) : null;
  const mots = kept.flatMap(x => [...x.wit, x.jury].filter(w => w && w.mot).map(w => w)), jug = rigor(m).n;
  const sig = !kept.length ? "Ton registre commence. La première parole tenue en sera la première ligne." : (avg != null && avg >= 1 ? "Tu clos tes paroles en moyenne " + avg + " jour" + (avg > 1 ? "s" : "") + " avant l'échéance." : "Tu tiens tes paroles jusqu'au dernier jour.") + (topTh ? " Ton terrain : " + topTh[0].toLowerCase() + "." : "") + (r.franc === 100 ? " Quand tu ne tiens pas, tu le dis." : "");
  const txt = "Mon bilan sur Parole : " + r.tenue + " parole" + (r.tenue > 1 ? "s tenues" : " tenue") + ", série de " + streak(m, ps) + ", " + jug + " verdict" + (jug > 1 ? "s rendus" : " rendu") + ". " + sig;
  shell("Mon bilan", h("p", {style:"margin:0;font-size:1.08rem"}, sig),
    h("div", {class:"bilan"}, h("div", null, h("b", null, r.tenue), r.tenue > 1 ? "paroles tenues" : "parole tenue"), h("div", null, h("b", null, streak(m, ps)), "série en cours"),
      h("div", null, h("b", null, r.fiab == null ? "—" : r.fiab + " %"), "fiabilité"), h("div", null, h("b", null, r.franc == null ? "—" : r.franc + " %"), "franchise"),
      h("div", null, h("b", null, topW ? nameOf(topW[0]) : "—"), "ton témoin le plus fidèle"), h("div", null, h("b", null, jug), "verdicts que tu as rendus"),
      h("div", null, h("b", null, countOn(ps).length), "personnes comptent sur toi"), h("div", null, h("b", null, "n° " + (IDX.num[m] || "—")), "ton rang d'arrivée")),
    lucidity(ps).length ? h("div", {class:"proof", style:"margin:0"}, "Ta lucidité sur toi-même (visible de toi seul) — " + lucidity(ps).join(" · ")) : null,
    mots.length ? h("div", {class:"proof", style:"margin:0"}, "« " + mots[mots.length-1].mot + " » — " + nameOf(mots[mots.length-1].uid)) : null,
    h("div", {class:"frow"}, h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Fermer"), h("button", {class:"btn", type:"button", id:"bil-copy", onclick:()=>copyText(txt, "Bilan copié.")}, "Copier mon bilan")));
  document.getElementById("bil-copy").focus();
}
function viewProfile(ps, vs){
  const uid = S.ui.profile && members().concat(me()).includes(S.ui.profile) ? S.ui.profile : me(), isMe = uid === me();
  const p = prof(uid), r = recordOf(uid, ps), f = follows(me())[uid], rg = rigor(uid), pl = pledges(uid, ps);
  const pins = (Array.isArray(p.pins) ? p.pins : []).map(i => ps.find(x => x.uid === uid && x.id === i && x.st === "tenue" && !x.hidden)).filter(Boolean).slice(0,3);
  const mots = ps.filter(x => x.uid === uid && x.st === "tenue" && !x.hidden).flatMap(x => [...x.wit, x.jury].filter(w => w && w.mot).map(w => ({ w, x }))).slice(0,6);
  const liens = (Array.isArray(p.liens) ? p.liens : []).filter(l => l && /^https:\/\//.test(String(l.u))).slice(0,2);
  const wOf = ps.filter(x => x.wit.some(w=>w.uid===uid) || (x.jury && x.jury.uid === uid && x.jury.v));
  const lists = { paroles: ps.filter(x=>x.uid===uid).sort((a,b)=>b.at-a.at), voix: vs.filter(v=>v.uid===uid && !v.p.re).sort((a,b)=>b.at-a.at), temoin: wOf.sort((a,b)=>b.at-a.at), parcours: [] };
  const cur = lists[S.ui.ptab] ? S.ui.ptab : "paroles", ms = miles(uid, ps);
  const parcours = () => [
    sec("Toutes les mesures"),
    h("div", {class:"pad"}, h("div", {class:"tally", style:"margin:0"},
      h("div", null, h("b", null, r.rompue + r.contestee), "rompues"), h("div", null, h("b", null, r.abandon + r.partielle), "aveux"), h("div", null, h("b", null, followersOf(uid).length), "abonnés"),
      h("div", null, h("b", null, rg.n), "verdicts rendus"), h("div", null, h("b", null, rg.n ? Math.round(100*rg.ko/rg.n) + " %" : "—"), "contestations"),
      h("div", null, h("b", null, r.portee == null ? "—" : String(r.portee).replace(".", ",") + " / 3"), "portée moyenne"), h("div", null, h("b", null, IDX.dis[uid] || 0), "désaveux"), pl.due ? h("div", null, h("b", null, pl.done + " / " + pl.due), "soutiens honorés") : null),
      ms.length ? h("div", {class:"chips", style:"margin-top:12px"}, ms.map(t => h("span", {class:"chip"}, t))) : null,
      h("div", {class:"meta", style:"margin-top:10px"}, "Fiabilité : part des paroles tenues parmi celles jugées, pondérée par leur portée, à partir de 3. Désaveu : avoir confirmé une parole que le juré a contestée. Franchise : part des paroles non tenues que le membre a déclarées lui-même plutôt que laissées sans réponse.")),
    p.fier ? h("div", {class:"quote"}, h("small", null, "La parole dont je suis le plus fier"), String(p.fier).slice(0,140)) : null,
    p.jamais ? h("div", {class:"quote"}, h("small", null, "Ce que je ne promets plus"), String(p.jamais).slice(0,140)) : null,
    mots.length ? [sec("Mots de témoins"), mots.map(({w,x}) => h("div", {class:"person"}, avatar(w.uid), h("div", {class:"grow"}, h("div", null, "« " + w.mot + " »"), h("div", {class:"sub"}, nameOf(w.uid) + ", " + (w.j ? "juré" : "témoin") + " de « " + x.p.t + " »"))))] : null,
    profileExtras(uid, ps)];
  return [h("div", {class:"cover", style:"background:" + (COVERS[Number(p.couleur)] || COVERS[0])}),
    h("div", {class:"phead"},
      h("div", {class:"rowtop"}, avatar(uid, "xl"), isMe ? h("div", {class:"acts", style:"margin:0"}, h("button", {class:"btn", onclick:()=>openBilan(ps)}, "Mon bilan"), h("button", {class:"btn ghost", onclick:openEdit}, "Modifier"), h("a", {class:"btn ghost mlinks", href:"#donnees", style:"text-decoration:none"}, "Réglages"), h("a", {class:"btn ghost mlinks", href:"#coulisses", style:"text-decoration:none"}, "Coulisses")) : h("button", {class:"btn" + (f ? " ghost" : ""), onclick:()=>toggleFollow(uid)}, f ? "Suivi" : "Suivre")),
      h("h2", null, nameOf(uid)), honourOf(uid, ps) ? h("div", {style:"margin:4px 0 6px"}, h("span", {class:"pill ok"}, honourOf(uid, ps))) : null,
      h("div", {class:"meta"}, "Membre n° " + (IDX.num[uid] || "—") + (isFinite(IDX.first[uid]) ? " · depuis " + new Date(IDX.first[uid]).toLocaleDateString("fr-FR", {month:"long", year:"numeric"}) : "") + (p.parrain && p.parrain !== uid ? " · introduit par " + nameOf(p.parrain) : "")),
      h("div", {class:"sub"}, p.titre || (isMe ? "Ajoute un titre pour dire ce que tu fais." : "Membre")),
      p.devise ? h("p", {style:"margin:10px 0 0;font-weight:650;font-size:1.08rem"}, "« " + String(p.devise).slice(0,80) + " »") : null,
      p.bio ? h("p", {style:"margin:10px 0 0;max-width:60ch"}, String(p.bio).slice(0,400)) : null,
      p.lieu || liens.length ? h("div", {class:"infos"}, p.lieu ? h("span", null, String(p.lieu).slice(0,40)) : null, liens.map(l => h("a", {href:l.u, rel:"noopener noreferrer", target:"_blank"}, String(l.t).slice(0,24)))) : null,
      arr(p.dispo).length || arr(p.themes).length ? h("div", {class:"chips", style:"margin-top:10px"}, arr(p.dispo).filter(d => DISPO.includes(d)).map(d => h("span", {class:"pill ok"}, "Disponible : " + d.toLowerCase())), arr(p.themes).filter(t => THEMES.includes(t)).map(t => h("span", {class:"chip"}, t))) : null,
      h("div", {class:"tally", style:"grid-template-columns:repeat(4,minmax(0,1fr))"},
        h("button", {"aria-label":"Fiabilité : explication", onclick:()=>explain("Fiabilité")}, h("b", null, r.fiab == null ? "—" : r.fiab + " %"), "fiabilité"), h("button", {"aria-label":"Série : explication", onclick:()=>explain("Série")}, h("b", null, streak(uid, ps)), "série"),
        h("button", {"aria-label":"Paroles tenues : explication", onclick:()=>explain("Tenues")}, h("b", null, r.tenue), "tenues"), h("button", {"aria-label":"Franchise : explication", onclick:()=>explain("Franchise")}, h("b", null, r.franc == null ? "—" : r.franc + " %"), "franchise"))),
    pins.length ? [sec("À la une"), pins.map(x => card(x, ps, vs))] : null,
    h("div", {class:"top", style:"padding-top:8px;position:static;background:none"}, h("div", {class:"tabs", role:"tablist"}, [["paroles","Paroles · " + lists.paroles.length],["voix","Voix · " + lists.voix.length],["temoin","Témoin de · " + lists.temoin.length],["parcours","Parcours"]].map(([k,l]) => h("button", {role:"tab", "aria-selected":String(cur===k), onclick:()=>{ S.ui.ptab = k; render(); }}, l)))),
    cur === "parcours" ? parcours() : lists[cur].length ? lists[cur].map(x=>card(x,ps,vs)) : h("div", {class:"empty"}, "Rien dans cet onglet.")];
}
function viewData(ps, vs){
  const m = me(), mineP = ps.filter(x=>x.uid===m), mineV = vs.filter(v=>v.uid===m), th = {};
  [...mineP, ...mineV].forEach(x => { if (x.p.th) th[x.p.th] = (th[x.p.th]||0)+1; });
  const sw = (key, title, desc) => h("div", {class:"toggle"}, h("div", null, h("div", {style:"font-weight:600"}, title), h("div", {class:"sub"}, desc)),
    h("button", {class:"sw", role:"switch", "aria-checked":String(!!prefs[key]), "aria-label":title, onclick:()=>{ prefs[key] = !prefs[key]; savePrefs(); }}));
  const segm = (label, key, opts) => h("div", {class:"toggle"}, h("div", {style:"font-weight:600"}, label), h("div", {class:"seg", role:"group", "aria-label":label, style:"min-width:190px"}, opts.map(([v,l]) => h("button", {"aria-pressed":String(prefs[key]===v), onclick:()=>{ prefs[key] = v; savePrefs(); }}, l))));
  return [topbar("Réglages"),
    sec("Ambiance"),
    h("div", {class:"pad"}, skinPicker()),
    sec("Confort de lecture"),
    segm("Taille du texte", "size", [["m","A"],["l","A+"],["xl","A++"]]),
    sw("contrast","Contraste renforcé","Texte secondaire plus foncé et contours marqués."),
    sw("motion","Réduire les animations","Supprime les transitions et les effets de célébration."),
    h("div", {class:"pad"}, h("button", {class:"btn ghost", onclick:openOnboarding}, "Revoir l'introduction et la charte")),
    Object.keys(blocked()).length ? [sec("Membres masqués"), Object.keys(blocked()).map(u => h("div", {class:"person"}, h("div", {class:"grow"}, h("div", {class:"nm"}, nameOf(u))), h("button", {class:"btn ghost", onclick:()=>{ delete mine("voix").bloques[u]; commit("voix"); }}, "Rétablir")))] : null,
    sec("Mes données"),
    h("div", {class:"prose", style:"padding-bottom:6px"}, h("p", null, "Tout ce que Parole sait de toi tient sur cette page. Chaque usage au-delà du fonctionnement du réseau demande ton accord, et tu peux le retirer ici.")),
    sec("Ce que tu as déclaré", null),
    h("div", {class:"pad"}, h("div", {class:"tally", style:"margin:0"},
      h("div", null, h("b", null, mineP.length), "paroles datées"), h("div", null, h("b", null, mineV.length), "prises de parole"),
      h("div", null, h("b", null, Object.keys(follows(m)).length), "abonnements"), h("div", null, h("b", null, mySlots(ps).length), "paroles suivies comme témoin")),
      h("p", {class:"meta", style:"margin:12px 0 0"}, "Thèmes déduits de tes publications : " + (Object.keys(th).length ? Object.entries(th).map(([k,v])=>k + " (" + v + ")").join(", ") : "aucun pour l'instant"))),
    sec("Tes accords"),
    sw("perso","Personnaliser mon fil","Classer le fil selon mes thèmes et les personnes que je suis."),
    sw("offres","Offres liées à mes paroles","Autoriser une marque à soutenir une de mes paroles, par exemple une réduction sur un dossard si je promets un semi-marathon. Désactivé par défaut."),
    sw("stats","Statistiques agrégées","Compter mes paroles dans des chiffres d'ensemble où personne n'est identifiable."),
    sw("ia","Ma voix pour entraîner des modèles","Désactivé par défaut. Sans accord, l'audio sert uniquement à la lecture et à la transcription."),
    h("div", {class:"pad"}, h("button", {class:"btn ghost", onclick:()=>{ const out = JSON.stringify({ paroles:D().paroles[m]||{}, temoins:D().temoins[m]||{}, voix:D().voix[m]||{}, accords:prefs }, null, 1); try { navigator.clipboard.writeText(out).then(()=>toast("Tes données sont copiées au format JSON."), ()=>toast("Copie refusée par le navigateur.")); } catch(e){ toast("Copie indisponible dans cette vue."); } }}, "Copier toutes mes données"),
      h("p", {class:"meta", style:"margin:12px 0 0"}, "Dans ce prototype, les accords et les réglages sont gardés dans ce navigateur.")),
    sec("Zone sensible"),
    h("div", {class:"pad"}, h("button", {class:"btn danger", onclick:()=>{
      shell("Supprimer toutes mes données", h("p", {style:"margin:0"}, "Tes paroles, tes prises de parole, tes verdicts, tes abonnements et ton profil seront effacés. Les paroles des autres perdront ton témoignage. C'est définitif."),
        h("div", {class:"frow"}, h("button", {class:"btn ghost", type:"button", id:"del-no", onclick:closeModal}, "Annuler"), h("button", {class:"btn danger", type:"button", onclick:()=>{ const d = D(); d.paroles[me()] = { items:{} }; d.temoins[me()] = { items:{} }; d.voix[me()] = { profil:{}, posts:{}, suivis:{}, bloques:{}, signals:{} }; closeModal(); commit("paroles"); commit("temoins"); commit("voix"); toast("Tes données sont effacées."); }}, "Tout supprimer")));
      document.getElementById("del-no").focus(); }}, "Supprimer toutes mes données"))];
}
function viewAbout(){
  const dl = (pairs) => h("dl", null, pairs.map(([a,b]) => [h("dt", null, a), h("dd", null, b)]));
  const p = (t) => h("p", null, t);
  return [topbar("Coulisses"), h("div", {class:"prose"},
    h("h3", null, "Le principe"),
    p("On entre par la voix, on est lu par le texte. Parler coûte peu, écouter des inconnus coûte cher : chaque prise de parole est donc transcrite, et l'audio reste à un clic."),
    p("Deux objets seulement. La parole engagée est un acte daté que des témoins jugeront. La voix libre est un point d'étape, une question ou une réponse de trente secondes."),
    dl([["Parole","140 caractères, une échéance à 90 jours au plus, un thème."],["Témoins","5 places à la fois par membre. La rareté oblige à choisir."],["Verdict","L'auteur fournit une preuve. Tenue si plus de témoins confirment que ne contestent."],["Silence","Une échéance dépassée sans déclaration vaut parole rompue."],["Aveu","Abandonner ou dire « en partie » avec sa raison reste visible, sans dégrader la fiabilité ni casser la série."],["Absents","Likes, compteurs de vues, fil infini. Le fil a une fin."]]),
    h("h3", null, "Pensé pour des personnes, pas pour des profils"),
    p("Ce que quelqu'un de réel craint ou attend en donnant sa parole devant d'autres, et la réponse du produit."),
    dl([["« Un imprévu m'arrive »","Jusqu'à deux reports par parole, de 3, 7 ou 14 jours, avec leur raison visible."],["« Je promets toujours trop »","Trois paroles en cours au maximum."],["« Je ne sais pas formuler »","Un exemple de parole bien tournée pour chaque thème."],["« Je ne veux pas que tout le monde voie »","Chaque parole est publique, réservée aux abonnés, à des personnes choisies ou à un espace. Privée, elle compte quand même dans la fiabilité, sans montrer son contenu."],["« J'ai promis à quelqu'un »","Une parole peut être donnée à une personne. Son verdict compte double."],["« J'ai besoin d'aide, pas d'un juge »","Les témoins peuvent soutenir une parole en cours, surtout quand elle est en difficulté."],["« J'ai échoué et je me suis tu »","L'auteur peut expliquer après coup. La parole reste rompue, l'explication s'affiche."],["« Mes erreurs me suivront »","La fiabilité se calcule sur les douze derniers mois."]]),
    h("h3", null, "Projets et soutiens"),
    p("Une parole peut être un projet : un lancement, un produit, un événement. D'autres membres promettent alors un soutien, versé seulement si la parole est jugée tenue."),
    dl([["Soutien","Une somme promise à l'auteur, due si la parole est tenue, libérée sinon."],["Double registre","Le soutien honoré ou non figure sur le profil de celui qui l'a promis."],["Pas de conflit","Qui soutient ne peut être ni témoin ni juré. Qui juge ne peut pas soutenir."],["Pas un pari","Personne ne gagne d'argent sur l'échec ou la réussite d'un autre."],["Pas un placement","Aucune part, aucun prêt, aucun rendement : une contrepartie symbolique au plus."],["Prototype","Aucun argent ne circule ici. Le service réel passera par un prestataire de paiement agréé."]]),
    h("h3", null, "Le profil"),
    dl([["Résumé","Titre, résumé, lieu, devise, liens, thèmes, bannière."],["À la une","Trois paroles tenues, choisies par le membre."],["Mots de témoins","Une phrase laissée par celui qui confirme. Elle est toujours attachée à une parole vérifiée."],["Disponible pour","Missions, emploi, mentorat, association, conférences."]]),
    h("h3", null, "Entreprise : les espaces"),
    p("Un espace est un registre privé pour une équipe, une promotion, un club ou un incubateur. Il affiche un tour de table et des chiffres collectifs."),
    dl(GARDE),
    h("h3", null, "Ce qui n'existe pas ailleurs, à notre connaissance"),
    dl([["Parole scellée","Le contenu reste caché jusqu'à l'échéance. On s'engage devant témoins sans récolter d'approbation avant d'avoir agi."],["Verdict à l'aveugle","Personne ne voit le sens des verdicts déjà rendus tant que tous n'ont pas jugé. Fini le suivisme."],["Pacte","Deux paroles données l'une à l'autre. Le pacte n'est honoré que si les deux sont tenues."],["Réparation","Une parole rompue peut être réparée par une nouvelle parole tenue : son poids est divisé par deux."],["Relais","Une parole abandonnée peut être reprise par un autre membre."],["Plan si-alors","L'auteur écrit d'avance sa parade à l'obstacle. Elle lui est rappelée le jour où il se dit en difficulté."],["Pronostic sur soi","On note ses chances de tenir, pour soi seul. Le bilan montre ensuite si on se connaît bien."],["Mot à soi-même","Une phrase écrite à l'engagement, relue au moment de clore."],["Attestation","Chaque parole tenue se copie en un texte daté, avec ses témoins et son empreinte."]]),
    h("h3", null, "Messages"),
    p("Pas de messagerie ouverte. Chaque parole a un fil réservé à son auteur, ses témoins, son juré et son destinataire. On s'y organise autour d'un engagement, on n'y démarche personne."),
    h("h3", null, "Sécurité du prototype"),
    dl([["Affichage","Tout texte venu d'un membre est inséré comme texte, jamais comme code. Seuls les liens en https sont cliquables."],["Juré","Un verdict de juré n'est retenu que si son auteur est indépendant de l'auteur de la parole et, sur le réseau réel, parmi les trois premiers du tirage."],["Places de témoin","Au-delà de cinq engagements actifs, les suivants ne comptent pas."],["Texte figé","Chaque témoin garde l'empreinte du texte au moment où il s'engage. Une modification ultérieure est signalée."],["Données reçues","Tout ce qui est lu est ramené à un schéma strict : champ inconnu ou de mauvais type, ignoré. Une publication illisible est isolée et n'empêche pas le reste de s'afficher."],["Limite","Ces contrôles tournent dans le navigateur. Un vrai service devra les appliquer côté serveur, avec des dates certifiées."]]),
    h("h3", null, "Mesure du test"),
    p("Les chiffres qui disent si le mécanisme tient, calculés sur les données de ce réseau."),
    measure(),
    h("h3", null, "La charte"),
    dl(CHARTE),
    h("h3", null, "Ce qui fait revenir"),
    p("Aucune récompense aléatoire, aucun fil sans fin. On revient parce qu'on a quelque chose en jeu."),
    dl([["Échéance","Le compte à rebours de sa propre parole ouvre l'écran d'accueil."],["Point du jour","Dix secondes : en bonne voie ou en difficulté. Les témoins le voient."],["Série","Les paroles tenues d'affilée. Un aveu ne la casse pas, un silence si."],["Franchise","La part des paroles non tenues qu'on a déclarées soi-même. Dire vrai devient un score."],["Devoir","Un verdict à rendre comme témoin ou comme juré tiré au sort."],["À jour","Le fil se termine. Finir fait partie du plaisir."]]),
    h("h3", null, "Ce que les autres réseaux nous ont appris"),
    h("div", {class:"tbox"}, h("table", {class:"ptable"},
      h("tr", null, ["Réseau","Idée","Ici"].map(t => h("th", {scope:"col"}, t))),
      [["Spotify, Strava","Bilan personnel","Mon bilan, avec une phrase qui n'appartient qu'à toi"],["GitHub","Grille d'activité","Douze dernières semaines sur le profil"],["MySpace, Snapchat","Top amis","Cercle proche : tes témoins les plus fidèles"],["TikTok, X","Duo, citation","M'engager aussi : reprendre une parole à son compte"],["Hinge","Questions de profil","La parole dont je suis fier, ce que je ne promets plus"],["Clubhouse, clubs","Cooptation","Membre n°, introduit par un parrain"],["Reddit, Duolingo","Distinctions","Titre d'honneur gagné, jamais acheté"],["Bluesky, Neptune","Algorithme réglable","Thèmes choisis, personnalisation désactivable"],["Pinterest","Tableaux","Chantiers : plusieurs paroles, une progression"],["BeReal","Rendez-vous commun","Combien de membres se sont engagés cette semaine"],["Nextdoor","Voisinage","Près de chez toi"],["Likes, vues, fil infini, anonymat, contenu généré","","Refusés : ils récompensent le bruit, pas l'acte"]]
        .map(r => h("tr", null, r.map((c,i) => h(i ? "td" : "th", i ? null : {scope:"row"}, c)))))),
    h("h3", null, "Positionnement"),
    h("div", {class:"tbox"}, h("table", {class:"ptable"},
      h("tr", null, ["Acteur","Ce qui est publié","Qui vérifie","Réputation cumulée","Domaines"].map(t => h("th", {scope:"col"}, t))),
      [["LinkedIn","Parcours et posts","Personne","Oui, déclarative","Travail"],["X","Posts","Personne","Audience","Tous"],["Airchat","Notes vocales","Personne","Audience","Tous"],["BeReal","Photo du moment","L'horodatage","Non","Quotidien"],["Strava","Activités sportives","Un capteur","Oui, mesurée","Sport"],["stickK","Contrat d'engagement","Un arbitre choisi par l'auteur","Non","Tous"],["Beeminder","Objectif chiffré","Les données saisies","Non","Ce qui se chiffre"],["Parole","Engagement daté, à la voix","Témoins et juré tiré au sort","Oui, vérifiée","Tous"]]
        .map(r => h("tr", null, r.map((c,i) => h(i ? "td" : "th", i ? null : {scope:"row"}, c)))))),
    p("Strava est le voisin le plus proche : une preuve solide et une réputation publique, limitées au sport. Parole vise la même chose pour tout engagement qu'un capteur ne peut pas mesurer."),
    h("h3", null, "La parade à la complaisance"),
    p("Des amis peuvent tout confirmer. Quatre règles rendent ce confort coûteux et visible."),
    dl([["Juré","Dès qu'une parole est déclarée tenue, un membre hors du cercle de l'auteur est tiré au sort. Il juge la preuve publique et son verdict compte double."],["Réciprocité","Un témoin que l'auteur a lui-même confirmé par le passé compte pour moitié."],["Motif","Contester exige un motif écrit, affiché sous la parole."],["Rigueur","Chaque profil affiche le nombre de verdicts rendus et la part de contestations."],["Désaveu","Confirmer une parole que le juré conteste laisse une trace sur le profil du témoin. Au deuxième désaveu, ses verdicts comptent pour moitié."],["Portée","Celui qui confirme note la portée de la parole : modeste, sérieuse ou exigeante. Elle pondère la fiabilité, donc les paroles faciles rapportent peu."],["Délai","Le juré a " + JURY_DAYS + " jours. Passé ce délai, les témoins décident seuls."]]),
    h("h3", null, "Monétisation, par ordre de probabilité"),
    dl([["Équipes","Registres privés pour une équipe commerciale, une promotion d'école, un club : chacun engage ses objectifs, ses pairs sont témoins. Facturé par siège."],
        ["Paroles soutenues","Une marque finance une parole avec l'accord de son auteur : une réduction, un don, une prime versée si la parole est tenue. La marque paie au résultat."],
        ["Parole Pro","Abonnement individuel : registre certifié partageable hors du réseau, statistiques, cercles privés."],
        ["Vérification","Un recruteur ou un partenaire paie pour consulter, avec l'accord du membre, un historique de fiabilité certifié."],
        ["Baromètre","Études agrégées et anonymes sur les intentions déclarées et leur taux de réalisation, par thème."]]),
    h("h3", null, "La donnée"),
    p("L'actif n'est pas le volume de traces. C'est une donnée que les autres réseaux doivent deviner et que celui-ci reçoit déclarée : ce qu'une personne compte faire, pour quelle date, et si elle l'a fait."),
    dl([["Intention","Un projet daté, formulé par la personne elle-même."],["Résultat","Tenu ou non, validé par des tiers."],["Confiance","Qui se porte témoin pour qui, et avec quelle rigueur."],["Sujets","Thèmes tirés des transcriptions."]]),
    p("En Europe, collecter le maximum sans finalité ni accord expose à des sanctions lourdes, et la voix devient une donnée sensible dès qu'on s'en sert pour identifier quelqu'un. Le prototype prend le parti inverse : peu de données, toutes déclarées, chaque usage commercial soumis à un accord visible dans Mes données."),
    h("h3", null, "Limites de ce prototype"),
    dl([["Voix","La lecture utilise une voix de synthèse à partir de la transcription. Le produit réel enregistre et rejoue la voix de l'auteur."],["Dictée","Disponible selon le navigateur et la vue. Sinon, le texte se tape."],["Démo","Membres fictifs, témoins simulés, données gardées dans ce navigateur."]]))];
}
const GARDE = [["Tout le monde s'engage","L'animateur publie ses paroles comme les autres membres."],["Pas d'évaluation","Les paroles de l'espace ne servent ni à l'entretien annuel ni à la paie."],["Pas de classement des échecs","L'espace affiche des chiffres collectifs. Aucun palmarès individuel des paroles rompues."],["La difficulté appelle l'aide","Un point du jour « en difficulté » invite les témoins à soutenir, pas à sanctionner."],["Rien ne sort","Ce qui est engagé dans l'espace n'est visible que de ses membres."]];
