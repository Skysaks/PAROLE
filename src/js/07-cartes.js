/* ---------- cartes ---------- */
const LABEL = { tenue:"Tenue", rompue:"Rompue", contestee:"Contestée", attente:"En jugement", encours:"En cours", abandon:"Abandonnée", partielle:"En partie", sanstemoin:"Sans témoin" };
function head(x){
  return h("div", {class:"hd"}, h("button", {class:"nm", onclick:()=>openProfile(x.uid)}, nameOf(x.uid)), h("span", {class:"sub"}, [prof(x.uid).titre, ago(x.at)].filter(Boolean).join(" · ")));
}
function honourOf(uid, ps){ const hn = prof(uid).honneur; return hn && miles(uid, ps).includes(hn) ? hn : ""; }
function countOn(ps){
  const m = me(), set = new Set();
  ps.filter(x => x.uid === m && (x.st === "encours" || x.st === "attente")).forEach(x => { x.wit.forEach(w => set.add(w.uid)); (x.back||[]).forEach(b => set.add(b.uid)); if (x.p.to) set.add(x.p.to); });
  return [...set];
}
function greet(ps){
  const hr = new Date().getHours(), hello = hr < 12 ? "Bonjour" : hr < 18 ? "Bon après-midi" : "Bonsoir", m = me();
  const nm = S.src === "reel" && S.names[m] ? S.names[m].split(" ")[0] : "", on = countOn(ps), week = Date.now() - 7*DAY;
  const engaged = new Set(ps.filter(x => Number(x.p.c) >= week).map(x => x.uid)), mineW = engaged.has(m), owe = ps.filter(x => x.st === "tenue" && (x.back||[]).some(b => b.uid === m && !b.h)).length;
  return h("div", {class:"greet"}, h("h2", null, hello + (nm ? ", " + nm : "") + "."),
    on.length ? h("p", null, (on.length > 1 ? on.length + " personnes comptent" : "Une personne compte") + " sur toi en ce moment : " + on.slice(0,3).map(nameOf).join(", ") + (on.length > 3 ? " et " + (on.length - 3) + " de plus" : "") + ".") : h("p", null, "Personne n'attend encore rien de toi. Ta prochaine parole changera ça."),
    h("p", null, engaged.size + " membre" + (engaged.size > 1 ? "s ont engagé" : " a engagé") + " une parole cette semaine" + (mineW ? ", dont toi." : ". Et toi ?")),
    owe ? h("p", null, "Tu as " + owe + " soutien" + (owe > 1 ? "s" : "") + " à honorer.") : null);
}
function thread(x, vs){
  const reps = repliesTo(vs, x), key = x.k + x.uid + x.id;
  const btn = h("button", {class:"act", onclick:()=>{ if (reps.length && !S.ui.thread[key]){ S.ui.thread[key] = true; render(); } else openPost("v", x); }}, "Répondre" + (reps.length ? " · " + reps.length : ""));
  const box = S.ui.thread[key] && reps.length ? h("div", {class:"thread"}, reps.map(r => h("div", {class:"rep"}, avatar(r.uid, "s"), h("div", null, head(r), player(r.p.t, true), h("div", {class:"vtxt"}, r.p.t)))),
    h("button", {class:"link", onclick:()=>openPost("v", x)}, "Ajouter ma réponse")) : null;
  return { btn, box };
}
function pCard(x, ps, vs){
  if (x.hidden) return h("article", {class:"card"}, avatar(x.uid), h("div", null, head(x),
    h("div", {class:"kind"}, "Parole privée", h("span", {class:"stamp s-" + x.st}, LABEL[x.st])),
    h("div", {class:"meta"}, "Son contenu est réservé à " + (spaceOf(x.p) ? "un espace" : x.p.vis === "abo" ? "ses abonnés" : "des personnes choisies") + ". Elle compte dans la fiabilité de son auteur.")));
  const { p, wit, st } = x, isMine = x.uid === me(), open = st === "encours";
  const myE = D().temoins[me()] && D().temoins[me()].items && D().temoins[me()].items[x.id];
  const iW = !!(myE && myE.a === x.uid && !myE.j), isJ = !!(x.jury && x.jury.uid === me()), isTo = p.to === me(), sp = IDX.sp[spaceOf(p)], sups = wit.filter(w => w.sup).length, back = x.back || [], myB = back.find(b => b.uid === me()), total = back.reduce((n,b) => n + b.m, 0);
  const left = Math.ceil((endOf(p.due) - Date.now()) / DAY) - 1;
  const isBlind = blind(p, wit, x.jury), sc = score(x.uid, wit, x.jury), num = (n) => String(n).replace(".", ","), myV = isJ ? x.jury.v : (myE && myE.v);
  const whys = blind(p, wit, x.jury) ? [] : [...wit, x.jury].filter(w => w && w.v === "ko" && w.why);
  const t = thread(x, vs), acts = h("div", {class:"acts"});
  const ckToday = p.ck && p.ck.d === iso(Date.now());
  if (isMine && open) acts.append(h("button", {class:"act ok", onclick:()=>openClose(x,"tenue")}, "Clore cette parole"), ckToday ? null : h("button", {class:"act", onclick:()=>openCheck(x)}, "Point du jour"));
  if (!isMine && open){
    if (iW) acts.append(myE.to ? h("span", {class:"pill"}, "Tu es le destinataire") : h("button", {class:"act on", onclick:()=>unwitness(x)}, "Témoin · me retirer"),
      h("button", {class:"act" + (myE.sup ? " on" : ""), "aria-pressed":String(!!myE.sup), onclick:()=>{ const e = mine("temoins").items[x.id]; if (e.sup) delete e.sup; else e.sup = Date.now(); commit("temoins"); }}, myE.sup ? "Soutien envoyé" : "Soutenir"));
    else if (isTo) acts.append(h("button", {class:"act ok", onclick:()=>{ mine("temoins").items[x.id] = { a:x.uid, at:Date.now(), to:true }; commit("temoins"); }}, "Accepter : cette parole m'est donnée"));
    if (isTo && !x.partner) acts.append(h("button", {class:"act", onclick:()=>openPost("p", null, { to:x.uid, pact:{ u:x.uid, id:x.id } })}, "Répondre par une parole (pacte)"));
    else { const used = RC.slots; acts.append(h("button", {class:"act", disabled:used >= SLOTS || !!myB, onclick:()=>witness(x)}, "Me porter témoin · " + used + "/" + SLOTS)); }
  }
  if (p.proj && !isMine){
    if (myB && open) acts.append(h("button", {class:"act on", onclick:()=>{ delete mine("voix").soutiens[x.id]; commit("voix"); }}, "Soutien promis : " + myB.m + " € · retirer"));
    else if (myB && st === "tenue" && !myB.h) acts.append(h("button", {class:"act ok", onclick:()=>{ mine("voix").soutiens[x.id].h = Date.now(); commit("voix"); toast("Soutien honoré. C'est noté sur ton profil."); }}, "J'ai honoré mon soutien de " + myB.m + " €"));
    else if (!myB && open && !iW && !isJ && !isTo) acts.append(h("button", {class:"act", onclick:()=>openPledge(x)}, "Promettre un soutien"));
  }
  if (!isMine && (iW || isJ) && p.decl === "tenue" && !myV) acts.append(h("button", {class:"act ok", onclick:()=>openConfirm(x)}, "Je confirme"), h("button", {class:"act ko", onclick:()=>openContest(x)}, "Je conteste"));
  if (isMine || iW || isJ || isTo){ const nmsg = chatOf(x).list.length; if (isMine ? wit.length : true) acts.append(h("button", {class:"act", onclick:()=>openChat(x)}, "Entre nous" + (nmsg ? " · " + nmsg : ""))); }
  if (isMine && (st === "rompue" || st === "contestee") && !x.repaired && !ps.some(y => y.uid === x.uid && y.p.fix === x.id && y.st !== "rompue" && y.st !== "abandon")) acts.append(h("button", {class:"act", onclick:()=>openPost("p", null, { fix:x.id, th:p.th })}, "Réparer par une nouvelle parole"));
  if (isMine && st === "rompue" && !p.late) acts.append(h("button", {class:"act", onclick:()=>openLate(x)}, "Expliquer ce qui s'est passé"));
  acts.append(t.btn, h("button", {class:"more", "aria-label":"Options pour cette parole", onclick:()=>openMenu(x)}, "⋯"));
  return h("article", {class:"card"}, avatar(x.uid), h("div", null, head(x),
    h("div", {class:"kind"}, "Parole", p.th ? h("span", null, "· " + String(p.th).slice(0,20)) : null,
      h("span", {class:"dd" + (open && left <= 2 ? " soon" : "")}, open ? "· J-" + Math.max(0,left) + " · " + fmt(endOf(p.due)) : "· échéance " + fmt(endOf(p.due))),
      x.amb && st === "tenue" ? h("span", {class:"pill"}, "Portée " + PORTEE[x.amb]) : null,
      h("span", {class:"stamp s-"+st, style: x.amb && st === "tenue" ? "margin-left:0" : ""}, LABEL[st])),
    sealedFor(x) ? h("div", {class:"sealed"}, "Parole scellée", h("div", {class:"meta"}, "Révélée à l'échéance ou à sa clôture · empreinte " + hash(String(p.t)).toString(16))) : h("div", {class:"ptxt"}, String(p.t||"").slice(0, PMAX)),
    p.seal && !sealedFor(x) ? h("div", {class:"meta"}, isMine && open ? "Scellée : les autres ne voient pas ce texte avant l'échéance." : "Parole scellée, révélée à sa clôture.") : null,
    x.partner ? h("div", {class:"projet"}, h("b", null, "Pacte avec " + nameOf(x.partner.uid)), x.st === "tenue" && x.partner.st === "tenue" ? " · honoré des deux côtés" : " · sa parole : " + LABEL[x.partner.st].toLowerCase(), h("div", {class:"meta"}, "« " + shown(x.partner) + " »")) : null,
    p.fix ? h("div", null, h("span", {class:"pill"}, "Répare une parole rompue")) : null,
    x.repaired ? h("div", null, h("span", {class:"pill ok"}, "✓ Réparée par une nouvelle parole tenue")) : null,
    p.plan && !sealedFor(x) ? h("div", {class:"meta"}, "Plan : " + String(p.plan).slice(0,160)) : null,
    p.ch || p.from || IDX.reps[x.uid + "/" + x.id] ? h("div", {class:"chips", style:"margin-bottom:8px"}, p.ch ? h("span", {class:"chip"}, "Chantier : " + String(p.ch).slice(0,50)) : null, p.from && p.from.u ? h("button", {class:"chip", onclick:()=>openProfile(p.from.u)}, (p.relay ? "Relais d'une parole de " : "Reprise d'une parole de ") + nameOf(p.from.u)) : null,
      IDX.reps[x.uid + "/" + x.id] ? h("span", {class:"pill ok"}, IDX.reps[x.uid + "/" + x.id] + (IDX.reps[x.uid + "/" + x.id] > 1 ? " membres se sont engagés aussi" : " membre s'est engagé aussi")) : null) : null,
    sp || p.vis === "abo" || p.vis === "sel" || p.to ? h("div", {class:"chips", style:"margin-bottom:8px"}, sp ? h("button", {class:"chip", onclick:()=>{ S.ui.space = sp.id; location.hash = "#espaces"; render(); }}, sp.n) : null, p.vis === "abo" ? h("span", {class:"chip"}, "Abonnés seulement") : null, p.vis === "sel" ? h("span", {class:"chip"}, "Personnes choisies") : null, p.to ? h("span", {class:"chip"}, "Donnée à " + nameOf(p.to)) : null) : null,
    p.proj ? h("div", {class:"projet"}, h("b", null, "Projet ouvert aux soutiens"), p.contre ? " · contrepartie : " + String(p.contre).slice(0,140) : "", h("div", {class:"meta"}, back.length ? back.length + " soutien" + (back.length > 1 ? "s promis" : " promis") + " · " + total + " €" + (st === "tenue" ? " · " + back.filter(b => b.h).length + " honoré" + (back.filter(b => b.h).length > 1 ? "s" : "") : st !== "encours" && st !== "attente" ? " · libérés, la parole n'a pas été tenue" : "") : "Aucun soutien promis pour l'instant"),
      myB && st === "tenue" && myB.h ? h("div", {class:"meta"}, "✓ Tu as honoré ton soutien de " + myB.m + " €") : null, (iW || isJ) && !isMine ? h("div", {class:"meta"}, "Témoin ou juge, tu ne peux pas soutenir financièrement ce projet.") : null) : null,
    repsOf(p).map(r => h("div", {class:"meta"}, "Reportée (prévue le " + (validDay(r.from) ? fmt(endOf(r.from)) : "—") + ") : " + String(r.why||"").slice(0,240))),
    open && p.ck && validDay(p.ck.d) ? h("div", null, h("span", {class:"pill " + (p.ck.s === "dur" ? "dur" : "ok")}, (p.ck.s === "dur" ? "En difficulté, dit le " : "✓ En bonne voie, le ") + fmt(endOf(p.ck.d)))) : null,
    p.proof ? proofBox(p) : null,
    p.late && st === "rompue" ? h("div", {class:"proof"}, "Expliqué après coup : " + String(p.late).slice(0,240)) : null,
    sups && open ? h("div", {class:"meta"}, sups + " témoin" + (sups > 1 ? "s te soutiennent" : " te soutient").replace("te ", isMine ? "te " : "le ")) : null,
    wit.length ? h("details", {class:"vd"}, h("summary", null, wit.length + " témoin" + (wit.length > 1 ? "s" : "") + (x.jury ? " · un juré" : "") + (p.decl === "tenue" ? (isBlind ? " · verdicts à l'aveugle" : " · " + num(sc.ok) + " pour, " + num(sc.ko) + " contre") : "") + (myV ? " · ton verdict : " + (myV === "ok" ? "confirmé" : "contesté") : "")),
    h("div", {class:"meta"}, wit.length ? wit.length + " témoin" + (wit.length>1?"s":"") + " : " + wit.map(w=>nameOf(w.uid) + (w.to ? " (destinataire, compte double)" : recip(x.uid, w.uid) ? " (réciproque, compte ½)" : "") + ((IDX.dis[w.uid]||0) >= 2 ? " (désavoué " + IDX.dis[w.uid] + " fois, compte ½)" : "")).join(", ") : "Aucun témoin, cette parole ne comptera pas"),
    x.jury ? h("div", {class:"meta"}, (isJ ? "Tu es le juré tiré au sort" : "Juré tiré au sort : " + nameOf(x.jury.uid)) + (x.jury.v ? (isBlind ? " · a rendu son verdict" : x.jury.v === "ok" ? " · confirme" : " · conteste") : " · verdict attendu sous " + JURY_DAYS + " jours") + " · compte double") : null,
    p.decl === "tenue" && wit.length ? h("div", {class:"meta"}, (isBlind ? "Verdicts à l'aveugle : " + (wit.filter(w => w.v).length + (x.jury && x.jury.v ? 1 : 0)) + " rendus sur " + (wit.length + (x.jury ? 1 : 0)) + ", révélés quand tous auront jugé" : "Décompte pondéré : " + num(sc.ok) + " pour, " + num(sc.ko) + " contre") + (myV ? " · ton verdict : " + (myV === "ok" ? "confirmé" : "contesté") : "")) : null) : h("div", {class:"meta"}, "Aucun témoin, cette parole ne comptera pas"),
    wit.some(w => w.h && w.h !== hash(String(p.t))) ? h("div", {class:"proof", style:"border-left-color:var(--broken)"}, "Attention : le texte de cette parole a changé depuis l'engagement de " + wit.filter(w => w.h && w.h !== hash(String(p.t))).length + " témoin(s).") : null,
    whys.map(w => h("div", {class:"proof", style:"border-left-color:var(--broken)"}, "Contesté par " + nameOf(w.uid) + " : " + w.why)),
    acts), t.box);
}
function vCard(x, vs){
  const t = thread(x, vs);
  return h("article", {class:"card"}, avatar(x.uid), h("div", null, head(x),
    player(x.p.t), h("div", {class:"vtxt"}, String(x.p.t).slice(0, VMAX)),
    h("div", {class:"acts"}, x.p.th ? h("button", {class:"chip", onclick:()=>{ S.ui.theme = x.p.th; location.hash = "#explorer"; render(); }}, String(x.p.th).slice(0,20)) : null, t.btn, h("button", {class:"more", "aria-label":"Options pour cette prise de parole", onclick:()=>openMenu(x)}, "⋯"))), t.box);
}
const card = (x, ps, vs) => { try { return x.k === "p" ? pCard(x, ps, vs) : vCard(x, vs); } catch(e){ return h("article", {class:"card"}, h("div"), h("div", {class:"meta"}, "Publication illisible : ses données sont mal formées.")); } };
function person(uid, ps){
  const r = recordOf(uid, ps), mineF = follows(me())[uid];
  return h("div", {class:"person"}, avatar(uid), h("div", {class:"grow"}, h("button", {class:"nm", onclick:()=>openProfile(uid)}, nameOf(uid)),
    h("div", {class:"sub"}, prof(uid).titre || "Membre"), h("div", {class:"meta"}, r.tenue + " tenue" + (r.tenue>1?"s":"") + (r.fiab != null ? " · fiabilité " + r.fiab + " %" : ""))),
    uid === me() ? null : h("button", {class:"btn" + (mineF ? " ghost" : ""), onclick:()=>toggleFollow(uid)}, mineF ? "Suivi" : "Suivre"));
}
const topbar = (title, tabs, cur, set) => h("div", {class:"top"}, h("h1", null, title), tabs ? h("div", {class:"tabs", role:"tablist"}, tabs.map(([k,l]) => h("button", {role:"tab", "aria-selected":String(cur===k), onclick:()=>set(k)}, l))) : h("div", {style:"height:4px"}));
const sec = (title, right) => h("div", {class:"h2"}, h("span", null, title), right ? h("span", null, right) : null);

