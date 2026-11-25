/* ---------- actions ---------- */
function toggleFollow(uid){ const m = mine("voix"); if (m.suivis[uid]) delete m.suivis[uid]; else m.suivis[uid] = Date.now(); commit("voix"); }
function witness(x){ if ((x.back||[]).some(b => b.uid === me())){ toast("Tu soutiens ce projet : tu ne peux pas en être témoin."); return; } mine("temoins").items[x.id] = { a:x.uid, at:Date.now(), h:hash(String(x.p.t)) }; commit("temoins"); }
function unwitness(x){ delete mine("temoins").items[x.id]; commit("temoins"); }
function verdict(x, v, why, amb, mot){
  const it = mine("temoins").items; let e = it[x.id];
  if (!e){ if (!(x.jury && x.jury.uid === me())) return; e = it[x.id] = { a:x.uid, j:true, at:Date.now() }; }
  e.v = v; e.vat = Date.now(); if (why) e.why = why; if (amb) e.amb = amb; if (mot) e.mot = mot; commit("temoins");
}
function openConfirm(x){
  const mot = h("input", {type:"text", id:"m-mot", maxlength:"160", placeholder:"Ce que tu as vu, en une phrase"});
  const go = (n) => { const v = mot.value.trim(); closeModal(); verdict(x, "ok", null, n, v); };
  shell("Confirmer cette parole", h("div", {class:"ptxt", style:"margin:0"}, x.p.t), x.p.proof ? proofBox(x.p) : null,
    h("label", {for:"m-mot"}, "Un mot de témoin pour son profil (facultatif)", mot),
    h("div", {class:"meta"}, "Quelle était la portée de cet engagement ? Ta réponse pondère la fiabilité de l'auteur : une parole facile compte moins."),
    h("div", {class:"choice"},
      h("button", {type:"button", onclick:()=>go(1)}, h("b", null, "Modeste"), h("span", null, "Tenable sans effort particulier.")),
      h("button", {type:"button", onclick:()=>go(2)}, h("b", null, "Sérieuse"), h("span", null, "Demande de la constance ou un vrai travail.")),
      h("button", {type:"button", onclick:()=>go(3)}, h("b", null, "Exigeante"), h("span", null, "Difficile, avec un vrai risque d'échec."))),
    h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Annuler"));
  document.querySelector(".choice button").focus();
}
function openPledge(x){
  const go = (m) => { mine("voix").soutiens[x.id] = { a:x.uid, m, at:Date.now() }; closeModal(); commit("voix"); toast("Soutien promis : " + m + " €. Tu l'honoreras si la parole est tenue."); };
  shell("Promettre un soutien", h("div", {class:"ptxt", style:"margin:0"}, x.p.t), x.p.contre ? h("div", {class:"meta"}, "Contrepartie proposée : " + String(x.p.contre).slice(0,140)) : null,
    h("div", {class:"meta"}, "Tu t'engages à verser cette somme à " + nameOf(x.uid) + " si, et seulement si, sa parole est jugée tenue. Aucun argent ne passe par Parole dans ce prototype. Ton soutien, honoré ou non, figurera sur ton profil. En soutenant, tu renonces à être témoin ou juré de cette parole."),
    h("div", {class:"choice"}, [10,25,50,100].map(m => h("button", {type:"button", onclick:()=>go(m)}, h("b", null, m + " €"), h("span", null, "À verser si la parole est tenue")))),
    h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Annuler"));
  document.querySelector(".choice button").focus();
}
function proofBox(p){
  const label = p.decl === "abandon" ? "Raison : " : p.decl === "partielle" ? "Dit franchement : " : "Preuve : ", txt = String(p.proof).slice(0,240), box = h("div", {class:"proof"}, label);
  txt.split(/(https:\/\/[^\s]+)/).forEach(part => box.append(/^https:\/\//.test(part) ? h("a", {href:part, rel:"noopener noreferrer", target:"_blank"}, part) : part));
  return box;
}
function copyText(t, ok){ try { navigator.clipboard.writeText(t).then(()=>toast(ok), ()=>toast("Copie refusée par le navigateur.")); } catch(e){ toast("Copie indisponible dans cette vue."); } }
function openMenu(x){
  const isMine = x.uid === me(), key = x.k + "/" + x.uid + "/" + x.id, items = [];
  const btn = (t, d, fn, cls) => h("button", {type:"button", class:cls||"", onclick:fn}, h("b", null, t), h("span", null, d));
  if (isMine && x.k === "p" && x.st === "tenue"){ const pins = (prof(me()).pins || []).filter(i => typeof i === "string"), on = pins.includes(x.id);
    if (on || pins.length < 3) items.push(btn(on ? "Retirer de la une" : "Mettre à la une de mon profil", on ? "Elle reste dans ton registre." : "Trois paroles tenues au plus.", () => { mine("voix").profil.pins = on ? pins.filter(i => i !== x.id) : pins.concat(x.id); closeModal(); commit("voix"); })); }
  if (isMine && x.k === "p" && x.st === "encours") items.push(btn("Inviter des témoins", "Copie un message à envoyer à qui tu veux.", () => { closeModal(); copyText("Je donne ma parole : « " + x.p.t + " » avant le " + fmt(endOf(x.p.due)) + ". Sois mon témoin sur Parole : " + location.href.split("#")[0], "Invitation copiée. Colle-la dans un message."); }));
  if (isMine && x.k === "p" && x.st === "encours" && !x.wit.length) items.push(btn("Retirer cette parole", "Possible tant qu'aucun témoin ne s'est engagé.", () => { delete mine("paroles").items[x.id]; closeModal(); commit("paroles"); }));
  if (isMine && x.k === "v") items.push(btn("Supprimer cette prise de parole", "Elle disparaît pour tout le monde.", () => { delete mine("voix").posts[x.id]; closeModal(); commit("voix"); }));
  if (!isMine && x.k === "p" && !x.hidden && !sealedFor(x) && (x.st === "encours" || x.st === "tenue")) items.push(btn("M'engager aussi", "Reprends cette parole à ton compte, avec ta propre échéance.", () => { closeModal(); openPost("p", null, { text:x.p.t, th:x.p.th, from:{ u:x.uid, id:x.id } }); }));
  if (!isMine && x.k === "p" && !x.hidden && (x.st === "abandon" || x.st === "partielle" || x.st === "rompue")) items.push(btn("Reprendre le flambeau", "Cette parole n'a pas abouti. Porte-la à ton tour, en relais.", () => { closeModal(); openPost("p", null, { text:x.p.t, th:x.p.th, from:{ u:x.uid, id:x.id }, relay:true }); }));
  if (x.k === "p" && x.st === "tenue" && !x.hidden) items.push(btn("Copier l'attestation", "Un texte daté à joindre à un CV, un devis, une candidature.", () => { closeModal();
    const f = (t) => new Date(t).toLocaleDateString("fr-FR", {day:"numeric", month:"long", year:"numeric"}), ws = x.wit.filter(w => w.v === "ok").map(w => nameOf(w.uid));
    copyText("ATTESTATION PAROLE\n" + nameOf(x.uid) + " a tenu parole : « " + x.p.t + " ».\nEngagée le " + f(x.p.c) + ", échéance le " + f(endOf(x.p.due)) + ", déclarée tenue le " + f(x.p.dAt) + ".\nConfirmée par : " + (ws.join(", ") || "—") + (x.jury && x.jury.v === "ok" ? " ; juré tiré au sort : " + nameOf(x.jury.uid) : "") + "." + (x.amb ? "\nPortée jugée " + PORTEE[x.amb] + "." : "") + "\nEmpreinte : " + hash(x.uid + x.id + x.p.t + x.p.due).toString(16) + "\nVérifiable sur " + location.href.split("#")[0], "Attestation copiée."); }));
  if (!isMine){
    ["Contenu dangereux ou illégal", "Harcèlement ou attaque personnelle", "Fausse preuve", "Spam ou publicité"].forEach(r => items.push(btn("Signaler : " + r.toLowerCase(), "Transmis à la modération.", () => { mine("voix").signals[key.replace(/\//g, "_")] = { r, at:Date.now() }; closeModal(); commit("voix"); toast("Signalement enregistré. Merci."); })));
    items.push(btn("Masquer " + nameOf(x.uid), "Tu ne verras plus ses publications. Réversible dans Réglages.", () => { mine("voix").bloques[x.uid] = Date.now(); closeModal(); commit("voix"); toast("Membre masqué."); }));
  }
  shell("Options", h("div", {class:"choice"}, items), h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Fermer"));
  document.querySelector(".choice button").focus();
}
const CHARTE = [["Vérifiable","Une parole décrit un acte qu'un tiers peut constater."],["Sans danger","Aucune parole qui met en danger ta santé ou celle d'autrui : pas de jeûne, de privation, de défi risqué."],["Sur soi","On s'engage pour soi, jamais à la place de quelqu'un d'autre."],["Preuve honnête","Fabriquer une preuve entraîne l'exclusion."],["Respect","On conteste une preuve, pas une personne."],["Majeurs","Le réseau est réservé aux adultes."]];
function openOnboarding(){
  let i = 0;
  const pages = [
    ["Choisis ton ambiance.", "SKIN"],
    ["Ici, on publie ce qu'on va faire.", "Une parole, c'est un acte précis et une échéance. Tu la dictes ou tu l'écris en dix secondes."],
    ["Des témoins diront si tu l'as fait.", "Tes abonnés se portent témoins. À l'échéance, tu donnes ta preuve. Un juré tiré au sort hors de ton cercle la lit aussi."],
    ["Dire vrai te protège.", "Tenue, en partie ou abandonnée : si tu le dis toi-même, ta série continue. Seul le silence la casse."],
    ["Qu'est-ce qui compte pour toi ?", "THEMES"],
    ["La charte, en six lignes.", null]
  ];
  let picks = arr(prof(me()).themes).slice(0,4);
  const themePicker = () => h("div", null, h("div", {class:"chips"}, THEMES.map(t => { const b = h("button", {type:"button", class:"chip", "aria-pressed":String(picks.includes(t)), onclick:()=>{ if (picks.includes(t)) picks = picks.filter(k => k !== t); else if (picks.length < 4) picks.push(t); b.setAttribute("aria-pressed", String(picks.includes(t))); }}, t); return b; })), h("p", {class:"meta", style:"margin-top:10px;font-size:.86rem"}, "Quatre au plus. Ton fil mettra ces sujets en avant, et tu peux couper ce réglage quand tu veux."));
  const draw = () => {
    const last = i === pages.length - 1;
    shell(pages[i][0], h("div", {class:"onb"}, pages[i][1] === "THEMES" ? themePicker() : pages[i][1] === "SKIN" ? [skinPicker(), h("p", {class:"meta", style:"margin-top:10px;font-size:.86rem"}, "Modifiable à tout moment dans Réglages. Le thème sombre suit ton appareil.")] : pages[i][1] ? h("p", null, pages[i][1]) : h("dl", {style:"display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:0"}, CHARTE.map(([a,b]) => [h("dt", {style:"font-weight:700;color:var(--accent)"}, a), h("dd", {style:"margin:0"}, b)]))),
      h("div", {class:"steps", "aria-hidden":"true"}, pages.map((_, k) => h("i", {class: k === i ? "on" : ""}))),
      h("div", {class:"frow"}, i ? h("button", {class:"btn ghost", type:"button", onclick:()=>{ i--; draw(); }}, "Retour") : null,
        h("button", {class:"btn", type:"button", id:"onb-next", onclick:()=>{ if (!last){ i++; draw(); return; } prefs.onb = true; try{ localStorage.setItem(LSP, JSON.stringify(prefs)); }catch(e){} closeModal(); if (picks.length){ mine("voix").profil.themes = picks; commit("voix"); } }}, last ? "J'accepte la charte et je commence" : "Continuer")));
    document.getElementById("onb-next").focus();
  };
  draw();
}
function openContest(x){
  const inp = h("input", {type:"text", id:"m-why", maxlength:"200", placeholder:"Ce qui manque ou contredit la preuve"});
  shell("Contester cette parole", h("div", {class:"ptxt", style:"margin:0"}, x.p.t), x.p.proof ? h("div", {class:"proof", style:"margin:0"}, "Preuve : " + x.p.proof) : null,
    h("label", {for:"m-why"}, "Motif, visible de tous", inp),
    h("div", {class:"frow"}, h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Annuler"),
      h("button", {class:"btn", type:"button", onclick:() => { const v = inp.value.trim(); if (v.length < 8){ toast("Un motif précis est obligatoire pour contester."); inp.focus(); return; } closeModal(); verdict(x, "ko", v); }}, "Contester")));
  inp.focus();
}
function closeModal(){ if (rec){ try{rec.stop();}catch(e){} } if (dict && dict.active()) dict.stop().catch(()=>{}); const m = document.getElementById("modal"); if (!m.firstChild) return; m.replaceChildren(); if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); else document.getElementById("app").focus(); }
function shell(title, ...kids){
  const veil = h("div", {class:"veil", onclick:(e)=>{ if (e.target === veil) closeModal(); }}, h("div", {class:"modal", role:"dialog", "aria-modal":"true", "aria-label":title}, h("h2", null, title), kids));
  if (!document.getElementById("modal").firstChild) lastFocus = document.activeElement;
  veil.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [...veil.querySelectorAll("button,input,textarea,select,a[href]")].filter(el => !el.disabled);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length-1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length-1]){ e.preventDefault(); f[0].focus(); }
  });
  document.getElementById("modal").replaceChildren(veil);
}
let rec = null, micBtn = null, partialEl = null, target = null;
function appendFinal(txt){ if (!target) return; const max = Number(target.getAttribute("maxlength")); target.value = ((target.value ? target.value : "") + (target.value ? txt : txt.replace(/^\s+/,""))).slice(0, max); target.dispatchEvent(new Event("input")); }
function setLive(on){ if (micBtn){ micBtn.classList.toggle("live", on); micBtn.replaceChildren(icon(on ? "stop" : "mic")); } if (!on && partialEl) partialEl.textContent = ""; }
function micRow(ta){
  target = ta; partialEl = h("div", {class:"partial", "aria-live":"polite"});
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!dict && !(SR && !window.claude)) return h("div", {class:"meta"}, "Dictée indisponible dans cette vue : écris ta parole, ou utilise la dictée de ton clavier.");
  micBtn = h("button", {class:"micbtn", type:"button", "aria-label":"Dicter", onclick:() => {
    if (dict){
      if (dict.active()) dict.stop().catch(()=>{});
      else dict.start().catch(e => { setLive(false); toast(e && e.code === "not_granted" ? "Micro refusé. Tu peux écrire ta parole." : "Dictée indisponible pour l'instant. Tu peux écrire."); });
      return;
    }
    if (rec){ try{rec.stop();}catch(e){} return; }
    try {
      rec = new SR(); rec.lang = "fr-FR"; rec.interimResults = true; rec.continuous = true;
      rec.onresult = (ev) => { let interim = ""; for (let i = ev.resultIndex; i < ev.results.length; i++){ const r = ev.results[i]; if (r.isFinal) appendFinal(" " + r[0].transcript.trim()); else interim += r[0].transcript; } if (partialEl) partialEl.textContent = interim; };
      rec.onend = () => { rec = null; setLive(false); };
      rec.onerror = () => { toast("Micro indisponible. Tu peux écrire ta parole."); };
      rec.start(); setLive(true);
    } catch(e){ rec = null; toast("Micro indisponible. Tu peux écrire ta parole."); }
  }}, icon("mic"));
  return h("div", {class:"mic"}, micBtn, h("div", null, h("div", {class:"meta"}, "Appuie et parle. Le texte reste modifiable avant publication."), partialEl));
}
const EX = { Sport:"Courir trois fois cette semaine, 5 km minimum", Business:"Appeler dix prospects avant vendredi et publier le décompte", "Création":"Publier le premier épisode avant la fin du mois", Apprentissage:"Finir le chapitre 4 et rendre l'exercice corrigé", Football:"Animer deux séances spécifiques gardiens ce mois-ci", Tech:"Mettre en ligne la page d'inscription", "Santé":"Marcher trente minutes chaque jour pendant deux semaines", "Vie perso":"Trier le garage et déposer trois cartons à la recyclerie" };
let lastPost = 0;
function openPost(kind, re, preset){
  let type = kind;
  const draw = () => {
    const max = type === "p" ? PMAX : VMAX;
    const ta = h("textarea", {id:"c-text", maxlength:String(max), placeholder: type === "p" ? "Publier le premier épisode de mon podcast" : re ? "Ta réponse" : "Un point d'étape, une question à tes témoins, un retour d'expérience"});
    const cnt = h("span", {class:"meta"}, "0/" + max);
    ta.addEventListener("input", () => { cnt.textContent = ta.value.length + "/" + max; });
    const th = h("select", {id:"c-theme"}, THEMES.map(t => h("option", {value:t}, t)));
    const mySp = Object.values(IDX.sp).filter(sp => sp.members.includes(me()));
    const vis = h("select", {id:"c-vis"}, h("option", {value:"pub"}, "Tout le monde"), h("option", {value:"abo"}, "Mes abonnés seulement"), h("option", {value:"sel"}, "Personnes choisies"), mySp.map(sp => h("option", {value:"e:" + sp.id}, sp.n)));
    if (preset && preset.vis) vis.value = preset.vis; if (preset && preset.to) to.value = preset.to;
    const cand = [...new Set([...Object.keys(follows(me())), ...followersOf(me())])].filter(u => u !== me());
    const audBox = h("div", {class:"chips", role:"group", "aria-label":"Personnes qui verront cette parole"}, cand.length ? cand.map(u => { const b = h("button", {type:"button", class:"chip", "aria-pressed":"false", "data-u":u, onclick:()=>b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"))}, nameOf(u)); return b; }) : h("span", {class:"meta"}, "Suis des membres pour pouvoir les choisir."));
    audBox.hidden = vis.value !== "sel"; vis.addEventListener("change", () => { audBox.hidden = vis.value !== "sel"; });
    const chs = [...new Set(Object.values((D().paroles[me()] && D().paroles[me()].items) || {}).map(q => q && q.ch).filter(Boolean))];
    const ch = h("input", {type:"text", id:"c-ch", maxlength:"50", placeholder:"Ex. : Lancement du site", list:"c-chs"}), chList = h("datalist", {id:"c-chs"}, chs.map(c => h("option", {value:c})));
    const lint = h("div", {class:"lint", "aria-live":"polite"});
    const check = () => { if (type !== "p") return; const v = ta.value.trim().toLowerCase(); let msg = "", ok = false;
      if (v.length < 12) msg = "Décris l'acte : ce qui sera fait, et ce qu'on pourra constater.";
      else if (/\b(essayer|tenter|mieux|davantage|bient[oô]t|plus souvent|un peu)\b/.test(v)) msg = "Un mot reste flou. Remplace-le par ce qui sera fait, compté ou livré.";
      else if (!/\d|\b(un|une|deux|trois|quatre|cinq|six|dix|premier|première)\b/.test(v)) msg = "Ajoute un chiffre ou un livrable : combien, combien de fois, quoi exactement.";
      else { msg = "✓ Vérifiable par un tiers."; ok = true; }
      lint.textContent = msg; lint.className = "lint" + (ok ? " ok" : ""); };
    ta.addEventListener("input", check);
    if (preset && preset.text){ ta.value = String(preset.text).slice(0, max); cnt.textContent = ta.value.length + "/" + max; } if (preset && preset.th && THEMES.includes(preset.th)) th.value = preset.th; check();
    const seal = h("select", {id:"c-seal"}, h("option", {value:""}, "Visible tout de suite"), h("option", {value:"1"}, "Scellé jusqu'à l'échéance"));
    const plan = h("input", {type:"text", id:"c-plan", maxlength:"160", placeholder:"Si je prends du retard mardi, alors je bloque mon mercredi matin"});
    const conf = h("select", {id:"c-conf"}, h("option", {value:""}, "Je ne me prononce pas"), [50,70,90].map(n => h("option", {value:String(n)}, n + " % de chances de tenir")));
    const memo = h("input", {type:"text", id:"c-memo", maxlength:"200", placeholder:"Ce que tu veux te rappeler le jour de l'échéance"});
    const contre = h("input", {type:"text", id:"c-contre", maxlength:"140", placeholder:"Ex. : accès anticipé, ton nom dans les remerciements"});
    const to = h("select", {id:"c-to"}, h("option", {value:""}, "Personne en particulier"), [...new Set([...Object.keys(follows(me())), preset && preset.to].filter(Boolean))].map(u => h("option", {value:u}, nameOf(u))));
    const due = h("input", {type:"date", id:"c-due", min:iso(Date.now()), max:iso(Date.now()+MAXDAYS*DAY), value:iso(Date.now()+7*DAY)});
    shell(re ? "Répondre" : "Prendre la parole",
      re ? null : h("div", {class:"seg"}, h("button", {type:"button", "aria-pressed":String(type==="p"), onclick:()=>{ type="p"; draw(); }}, "Parole engagée"), h("button", {type:"button", "aria-pressed":String(type==="v"), onclick:()=>{ type="v"; draw(); }}, "Voix libre")),
      h("div", {class:"meta"}, type === "p" ? "Un acte vérifiable, une échéance, sans danger pour ta santé ni pour autrui. Des témoins jugeront." : "Jusqu'à 30 secondes. Publiée en audio avec sa transcription."),
      micRow(ta),
      preset && preset.from ? h("div", {class:"meta"}, "Tu reprends une parole de " + nameOf(preset.from.u) + ". Adapte-la et fixe ta propre échéance.") : null,
      h("label", {for:"c-text"}, type === "p" ? "Je donne ma parole : je vais…" : "Transcription", ta), type === "p" ? lint : null,
      re ? null : h("div", {class:"frow"}, h("label", {for:"c-theme"}, "Thème", th), type === "p" ? h("label", {for:"c-due"}, "Au plus tard le", due) : null),
      preset && preset.fix ? h("div", {class:"meta"}, "Cette parole répare une parole rompue. Tenue, elle divisera par deux son poids dans ta fiabilité.") : null,
      preset && preset.pact ? h("div", {class:"meta"}, "Tu réponds à la parole de " + nameOf(preset.pact.u) + " par la tienne : c'est un pacte. Il n'est honoré que si les deux sont tenues.") : null,
      type === "p" ? h("label", {for:"c-plan"}, "Mon plan si un obstacle arrive (si…, alors…)", plan) : null,
      type === "p" ? h("details", {class:"adv"}, h("summary", null, "Options : visibilité, destinataire, scellé, projet"), h("div", {class:"in"},
        h("div", {class:"frow"}, h("label", {for:"c-vis"}, "Visible par", vis), h("label", {for:"c-to"}, "Parole donnée à", to)),
        audBox,
        S.src === "reel" ? h("div", {class:"meta"}, "Prototype partagé : la confidentialité d'une parole non publique n'y est pas garantie.") : null,
        h("label", {for:"c-seal"}, "Contenu", seal),
        h("label", {for:"c-ch"}, "Chantier (pour relier plusieurs paroles)", ch, chList),
        h("label", {for:"c-contre"}, "Projet à soutenir ? Indique la contrepartie", contre))) : null,
      type === "p" ? h("details", {class:"adv"}, h("summary", null, "Pour toi seul : pronostic et mot à toi-même"), h("div", {class:"in"},
        h("label", {for:"c-conf"}, "Mon pronostic sur moi-même", conf),
        h("label", {for:"c-memo"}, "Un mot pour toi, relu à l'échéance", memo),
        h("div", {class:"meta"}, "Ces deux réponses restent sur cet appareil. Personne d'autre ne les voit."))) : null,
      type === "p" ? h("button", {class:"link", type:"button", onclick:()=>{ ta.value = EX[th.value] || EX.Business; ta.dispatchEvent(new Event("input")); ta.focus(); }}, "Voir un exemple de parole bien formulée") : null,
      h("div", {class:"frow", style:"align-items:center"}, cnt,
        h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Annuler"),
        h("button", {class:"btn", type:"button", onclick:() => {
          const t = ta.value.trim().replace(/\s+/g," ");
          if (Date.now() - lastPost < 4000){ toast("Une publication à la fois. Réessaie dans quelques secondes."); return; }
          if (t.length < 8){ toast("Dis-en un peu plus : 8 caractères minimum."); ta.focus(); return; }
          if (type === "p"){
            if (!validDay(due.value) || endOf(due.value) < Date.now() || endOf(due.value) > Date.now()+(MAXDAYS+1)*DAY){ toast("Choisis une échéance entre aujourd'hui et " + MAXDAYS + " jours."); due.focus(); return; }
            if (paroles().filter(y => y.uid === me() && y.st === "encours").length >= MAXOPEN){ toast("Trois paroles en cours au maximum. Clos-en une avant d'en engager une autre."); return; }
            const id = newId(), np = { t, th:th.value, due:due.value, c:Date.now() };
            if (vis.value !== "pub") np.vis = vis.value; if (to.value) np.to = to.value;
            if (vis.value === "sel"){ np.aud = [...audBox.querySelectorAll('[aria-pressed="true"]')].map(b => b.getAttribute("data-u")); if (!np.aud.length){ toast("Choisis au moins une personne."); return; } }
            if (contre.value.trim()){ np.proj = true; np.contre = contre.value.trim(); }
            if (ch.value.trim()) np.ch = ch.value.trim(); if (preset && preset.from) np.from = preset.from;
            if (seal.value) np.seal = true; if (plan.value.trim()) np.plan = plan.value.trim();
            if (preset && preset.fix) np.fix = preset.fix; if (preset && preset.pact) np.pact = preset.pact; if (preset && preset.relay) np.relay = true;
            if (conf.value || memo.value.trim()){ priv()[id] = { conf: Number(conf.value) || 0, memo: memo.value.trim() }; savePriv(); }
            mine("paroles").items[id] = np;
            if (S.src === "demo"){
              const sp = IDX.sp[spaceOf(np)], ws = sp ? sp.members.filter(u => PERS[u]).slice(0,2) : np.aud ? np.aud.filter(u => PERS[u]).slice(0,2) : ["ines","hugo"].filter(u => u !== np.to), T = DATA.demo.temoins;
              ws.forEach(w => { (T[w] = T[w] || {items:{}}).items[id] = { a:"moi", at:Date.now() }; });
              if (np.to && PERS[np.to]) (T[np.to] = T[np.to] || {items:{}}).items[id] = { a:"moi", at:Date.now(), to:true };
              toast("Parole engagée. " + ws.map(w => PERS[w].split(" ")[0]).join(" et ") + " se portent témoins (simulation).");
            }
            else toast("Parole engagée. Sans témoin, elle ne comptera pas.");
            lastPost = Date.now(); closeModal(); commit("paroles");
          } else {
            lastPost = Date.now();
            mine("voix").posts[newId()] = Object.assign({ t, c:Date.now() }, re ? { re:{k:re.k, u:re.uid, id:re.id} } : { th:th.value });
            if (re) S.ui.thread[re.k + re.uid + re.id] = true;
            closeModal(); commit("voix");
          }
        }}, type === "p" ? "Engager ma parole" : "Publier")));
    ta.focus();
  };
  draw();
}
function openClose(x, kind0){
  let kind = kind0 || "tenue";
  const K = { tenue:["Je l'ai tenue","Entièrement. Un juré hors de ton cercle lira ta preuve.","Preuve","Lien, chiffre, fait vérifiable","Soumettre aux témoins"],
              partielle:["En partie","Tu le dis toi-même. Ta série continue, ta franchise monte.","Ce qui a été fait, ce qui manque","Deux sorties sur trois, la troisième annulée","Déclarer en partie"],
              abandon:["J'abandonne","Dit avant l'échéance, un abandon ne casse pas ta série.","Raison","Ce qui a changé","Confirmer l'abandon"] };
  if (repsOf(x.p).length < MAXREP) K.report = ["Reporter l'échéance","Un imprévu arrive. De 3 à 14 jours, " + MAXREP + " reports au plus par parole, raison visible.","Raison du report","Ce qui a changé","Reporter l'échéance"];
  const days = h("select", {id:"m-days"}, [[3,"3 jours"],[7,"7 jours"],[14,"14 jours"]].map(([v,l]) => h("option", {value:String(v)}, l))); days.value = "7";
  const draw = (keep) => {
    const inp = h("input", {type:"text", id:"m-proof", maxlength:"240", placeholder:K[kind][3], value:keep || ""});
    const pm = priv()[x.id];
    shell("Clore cette parole", h("div", {class:"ptxt", style:"margin:0"}, x.p.t),
      pm && pm.memo ? h("div", {class:"quote", style:"margin:0"}, h("small", null, "Ce que tu t'étais dit le " + fmt(x.p.c)), pm.memo) : null,
      h("div", {class:"choice", role:"group", "aria-label":"Issue de la parole"}, Object.keys(K).map(k => h("button", {type:"button", "aria-pressed":String(kind===k), onclick:()=>{ kind = k; draw(inp.value); }}, h("b", null, K[k][0]), h("span", null, K[k][1])))),
      h("label", {for:"m-proof"}, K[kind][2], inp),
      kind === "report" ? h("label", {for:"m-days"}, "Durée du report", days) : null,
      h("div", {class:"frow"}, h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Annuler"),
        h("button", {class:"btn" + (kind==="tenue"?" ok":""), type:"button", onclick:() => {
          const v = inp.value.trim(); if (!v){ toast(kind === "tenue" ? "Ajoute une preuve vérifiable." : "Dis-le en une phrase."); inp.focus(); return; }
          const p = mine("paroles").items[x.id]; if (!p) return;
          if (kind === "report"){ const n = Number(days.value) || 7; p.reps = repsOf(p).concat({ from:p.due, why:v, at:Date.now(), n }); delete p.rep; p.due = iso(endOf(p.due) + n*DAY - 3600e3); closeModal(); commit("paroles"); toast("Échéance reportée de " + n + " jours. Tes témoins voient la raison."); return; }
          p.decl = kind; p.proof = v; p.dAt = Date.now();
          if (S.src === "demo" && kind === "tenue"){
            const T = DATA.demo.temoins;
            for (const w in T){ const e = T[w].items[x.id]; if (e && e.a === "moi" && PERS[w]){ e.v = "ok"; e.vat = Date.now(); } }
            const mineNow = paroles().find(y => y.uid === "moi" && y.id === x.id), j = mineNow && mineNow.jury;
            if (j && PERS[j.uid]) (T[j.uid] = T[j.uid] || {items:{}}).items[x.id] = { a:"moi", j:true, at:Date.now(), v:"ok", vat:Date.now() };
          }
          closeModal(); commit("paroles");
          if (kind !== "tenue") toast(kind === "partielle" ? "C'est noté, dit franchement. Ta série continue." : "Abandon déclaré. Ta série continue.");
        }}, K[kind][4])));
    inp.focus();
  };
  draw("");
}
function chatOf(x){
  const ok = new Set([x.uid, ...x.wit.map(w => w.uid)]); if (x.jury) ok.add(x.jury.uid); if (x.p.to) ok.add(x.p.to);
  const out = [], V = D().voix;
  for (const u of ok){ const ms = (V[u] && V[u].msgs) || {}; let n = 0; for (const id in ms){ const m = ms[id]; if (++n > 200) break; if (m && typeof m === "object" && m.k === x.id && m.a === x.uid && m.t) out.push({ uid:u, t:String(m.t).slice(0,280), c:Number(m.c)||0 }); } }
  return { ok, list: out.sort((a,b) => a.c - b.c).slice(-30) };
}
function openChat(x){
  const c = chatOf(x), inp = h("input", {type:"text", id:"m-msg", maxlength:"280", placeholder:"Un mot pour l'auteur et ses témoins"});
  const send = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } mine("voix").msgs[newId()] = { k:x.id, a:x.uid, t:v, c:Date.now() }; commit("voix"); const fresh = paroles().find(y => y.uid === x.uid && y.id === x.id); openChat(fresh || x); };
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter"){ e.preventDefault(); send(); } });
  shell("Entre l'auteur et ses témoins", h("div", {class:"meta"}, "« " + x.p.t + " » · " + c.ok.size + " participant" + (c.ok.size > 1 ? "s" : "")),
    c.list.length ? h("div", {style:"display:grid;gap:10px;max-height:40vh;overflow:auto"}, c.list.map(m => h("div", null, h("b", null, nameOf(m.uid)), h("span", {class:"meta"}, " · " + ago(m.c)), h("div", null, m.t)))) : h("div", {class:"meta"}, "Aucun message. Ce fil sert à s'organiser autour de cette parole : envoyer une preuve, demander un coup de main, encourager."),
    h("label", {for:"m-msg"}, "Message", inp),
    S.src === "reel" ? h("div", {class:"meta"}, "Prototype partagé : ces messages ne sont ni chiffrés ni réellement privés.") : null,
    h("div", {class:"frow"}, h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Fermer"), h("button", {class:"btn", type:"button", onclick:send}, "Envoyer")));
  inp.focus();
}
function openLate(x){
  const inp = h("input", {type:"text", id:"m-late", maxlength:"240", placeholder:"Ce qui s'est passé, en une phrase"});
  shell("Expliquer ce qui s'est passé", h("div", {class:"ptxt", style:"margin:0"}, x.p.t), h("div", {class:"meta"}, "La parole reste rompue, mais ton explication s'affiche dessous. Il n'est jamais trop tard pour dire vrai."),
    h("label", {for:"m-late"}, "Explication", inp),
    h("div", {class:"frow"}, h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Annuler"), h("button", {class:"btn", type:"button", onclick:()=>{ const v = inp.value.trim(); if (!v){ inp.focus(); return; } const p = mine("paroles").items[x.id]; if (!p) return; p.late = v; closeModal(); commit("paroles"); }}, "Publier l'explication")));
  inp.focus();
}
function openCheck(x){
  const set = (sv_) => { const p = mine("paroles").items[x.id]; if (!p) return; p.ck = { d:iso(Date.now()), s:sv_ }; closeModal(); commit("paroles"); toast(sv_ === "dur" && p.plan ? "Tu avais prévu : " + String(p.plan).slice(0,140) : sv_ === "ok" ? "Point du jour noté. À demain." : "Dit franchement. Tes témoins le voient et peuvent te répondre."); };
  shell("Point du jour", h("div", {class:"ptxt", style:"margin:0"}, x.p.t), h("div", {class:"meta"}, "Dix secondes par jour. Tes témoins voient ta réponse."),
    h("div", {class:"choice"},
      h("button", {type:"button", onclick:()=>set("ok")}, h("b", null, "En bonne voie"), h("span", null, "Je tiens le rythme.")),
      h("button", {type:"button", onclick:()=>set("dur")}, h("b", null, "En difficulté"), h("span", null, "Je le dis maintenant plutôt qu'à l'échéance."))),
    h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Plus tard"));
  document.querySelector(".choice button").focus();
}
function celebrate(x, n){
  const veil = h("div", {class:"veil"}, h("div", {class:"modal cele", role:"dialog", "aria-modal":"true", "aria-label":"Parole tenue"},
    sv("svg", {viewBox:"0 0 120 120", "aria-hidden":"true"}, sv("circle", {cx:60, cy:60, r:52, transform:"rotate(-90 60 60)"}), sv("path", {d:"M38 62l15 15 30-33"})),
    h("h2", null, "Parole tenue"), h("div", {class:"sub"}, x.p.t),
    h("div", {class:"num"}, n), h("div", {class:"sub"}, n > 1 ? "paroles tenues d'affilée" : "parole tenue d'affilée"),
    h("button", {class:"btn", type:"button", id:"cele-ok", onclick:closeModal}, "Continuer")));
  lastFocus = document.activeElement; document.getElementById("modal").replaceChildren(veil); document.getElementById("cele-ok").focus();
}
function checkCelebrate(ps){
  const first = !SEEN || !SEEN[S.src]; SEEN = SEEN || {}; const cur = SEEN[S.src] || {}; let hit = null;
  ps.filter(x => x.uid === me()).forEach(x => { if (!first && x.st === "tenue" && cur[x.id] !== "tenue") hit = x; cur[x.id] = x.st; });
  SEEN[S.src] = cur; try { localStorage.setItem(LSS, JSON.stringify(SEEN)); } catch(e){}
  if (hit && !document.getElementById("modal").firstChild) celebrate(hit, streak(me(), ps));
}
function ring(pct, label, sub, color){
  const C = 2 * Math.PI * 52;
  return h("div", {class:"ring"}, sv("svg", {viewBox:"0 0 120 120", class:"ringsvg", "aria-hidden":"true"}, sv("circle", {cx:60, cy:60, r:52, class:"rbg"}),
    sv("circle", {cx:60, cy:60, r:52, class:"rfg", transform:"rotate(-90 60 60)", style:"stroke:" + color + ";stroke-dasharray:" + C + ";stroke-dashoffset:" + (C * (1 - pct))})),
    h("div", {class:"ringtxt"}, h("b", null, label), h("span", null, sub)));
}
function hero(ps){
  const m = me(), nx = ps.filter(x => x.uid === m && x.st === "encours").sort((a,b)=>endOf(a.p.due)-endOf(b.p.due))[0], r = recordOf(m, ps), st = streak(m, ps), today = iso(Date.now());
  let main;
  if (nx){
    const total = Math.max(1, endOf(nx.p.due) - nx.p.c), pct = Math.min(1, Math.max(0.03, (Date.now() - nx.p.c) / total)), left = Math.max(0, Math.ceil((endOf(nx.p.due) - Date.now()) / DAY) - 1);
    main = h("section", {class:"tile main", "aria-label":"Ma prochaine échéance, dans " + left + " jours"}, ring(pct, "J-" + left, fmt(endOf(nx.p.due)), "currentColor"),
      h("div", {class:"grow"}, h("div", {class:"lab"}, "Ma prochaine échéance"), h("div", {class:"big"}, nx.p.t),
        h("div", {class:"acts"}, nx.p.ck && nx.p.ck.d === today ? h("span", {class:"pill"}, nx.p.ck.s === "ok" ? "✓ Point du jour : en bonne voie" : "Point du jour : en difficulté") : h("button", {class:"btn inv", onclick:()=>openCheck(nx)}, "Point du jour"),
          h("button", {class:"btn inv ghost", onclick:()=>openClose(nx, "tenue")}, "Clore"))));
  } else main = h("section", {class:"tile main", "aria-label":"Aucune parole en cours"}, h("div", {class:"grow"}, h("div", {class:"lab"}, "Aucune parole en cours"), h("div", {class:"big"}, "Qu'est-ce que tu vas faire, et pour quand ?"), h("div", {class:"acts"}, h("button", {class:"btn inv", onclick:()=>openPost("p")}, "Engager une parole"))));
  return h("div", {class:"hero"}, main,
    h("section", {class:"tile", "aria-label":"Série en cours"}, h("div", {class:"lab"}, "Série"), h("div", {class:"num"}, st), h("div", {class:"small"}, "tenue" + (st > 1 ? "s" : "") + " d'affilée. Un aveu ne la casse pas, un silence si.")),
    h("section", {class:"tile", "aria-label":"Fiabilité et franchise"}, h("div", {class:"lab"}, "Fiabilité"), h("div", {class:"num"}, r.fiab == null ? "—" : r.fiab + " %"), h("div", {class:"small"}, r.fiab == null ? "Visible à partir de 3 paroles jugées." : "Franchise : " + (r.franc == null ? "—" : r.franc + " %"))));
}
function openEdit(){
  const p = prof(me()), L = Array.isArray(p.liens) ? p.liens : [];
  const inp = (id, max, val, ph) => h("input", {type:"text", id, maxlength:String(max), value:val || "", placeholder:ph || ""});
  const ti = inp("e-titre", 70, p.titre, "Ce que tu fais, en une ligne"), lieu = inp("e-lieu", 40, p.lieu, "Ville"), dev = inp("e-devise", 80, p.devise, "Une phrase qui te tient lieu de ligne de conduite");
  const bi = h("textarea", {id:"e-bio", maxlength:"400"}); bi.value = p.bio || "";
  const l1t = inp("e-l1t", 24, L[0] && L[0].t, "Nom du lien"), l1u = inp("e-l1u", 120, L[0] && L[0].u, "https://"), l2t = inp("e-l2t", 24, L[1] && L[1].t, "Nom du lien"), l2u = inp("e-l2u", 120, L[1] && L[1].u, "https://");
  const tog = (list, on, max) => h("div", {class:"chips"}, list.map(t => { const b = h("button", {type:"button", class:"chip", "aria-pressed":String(arr(on).includes(t)), "data-v":t, onclick:()=>{ const act = b.getAttribute("aria-pressed") === "true"; if (!act && max && b.parentNode.querySelectorAll('[aria-pressed="true"]').length >= max) return; b.setAttribute("aria-pressed", String(!act)); }}, t); return b; }));
  const earned = miles(me(), paroles()), hon = h("select", {id:"e-hon"}, h("option", {value:""}, "Aucun"), earned.map(t => h("option", {value:t}, t))); hon.value = earned.includes(p.honneur) ? p.honneur : "";
  const fier = inp("e-fier", 140, p.fier, "Celle que tu racontes encore"), jamais = inp("e-jamais", 140, p.jamais, "Une promesse que tu as appris à ne plus faire");
  const par = h("select", {id:"e-par"}, h("option", {value:""}, "Personne"), Object.keys(follows(me())).map(u => h("option", {value:u}, nameOf(u))));
  const dispo = tog(DISPO, p.dispo), themes = tog(THEMES, p.themes, 4), picked = (box) => [...box.querySelectorAll('[aria-pressed="true"]')].map(b => b.getAttribute("data-v"));
  let coul = Number(p.couleur) || 0;
  const sw = h("div", {class:"swatches", role:"group", "aria-label":"Couleur de la bannière"}, COVERS.map((c,i) => { const b = h("button", {type:"button", style:"background:" + c, "aria-pressed":String(i === coul), "aria-label":"Bannière " + (i+1), onclick:()=>{ coul = i; sw.querySelectorAll("button").forEach((x,k) => x.setAttribute("aria-pressed", String(k === i))); }}); return b; }));
  shell("Modifier mon profil", h("label", {for:"e-titre"}, "Titre", ti), h("label", {for:"e-bio"}, "Résumé", bi),
    h("div", {class:"frow"}, h("label", {for:"e-lieu"}, "Lieu", lieu), h("label", {for:"e-devise"}, "Devise", dev)),
    h("label", null, "Thèmes (4 au plus)", themes), h("label", null, "Disponible pour", dispo),
    h("div", {class:"frow"}, h("label", {for:"e-l1t"}, "Lien 1", l1t), h("label", {for:"e-l1u"}, "Adresse", l1u)),
    h("div", {class:"frow"}, h("label", {for:"e-l2t"}, "Lien 2", l2t), h("label", {for:"e-l2u"}, "Adresse", l2u)),
    h("label", {for:"e-hon"}, "Titre d'honneur affiché près de ton nom", hon),
    h("label", {for:"e-fier"}, "La parole dont je suis le plus fier", fier), h("label", {for:"e-jamais"}, "Ce que je ne promets plus", jamais),
    p.parrain ? h("div", {class:"meta"}, "Introduit par " + nameOf(p.parrain) + ".") : h("label", {for:"e-par"}, "Qui t'a introduit ici ? (une seule fois)", par),
    h("label", null, "Bannière", sw),
    h("div", {class:"meta"}, "Pour mettre une parole tenue à la une, ouvre son menu ⋯."),
    h("div", {class:"frow"}, h("button", {class:"btn ghost", type:"button", onclick:closeModal}, "Annuler"),
      h("button", {class:"btn", type:"button", onclick:() => {
        const liens = [[l1t,l1u],[l2t,l2u]].map(([t,u]) => ({ t:t.value.trim(), u:u.value.trim() })).filter(l => l.t && /^https:\/\//.test(l.u));
        if ([l1u,l2u].some(u => u.value.trim() && !/^https:\/\//.test(u.value.trim()))){ toast("Une adresse de lien doit commencer par https://"); return; }
        Object.assign(mine("voix").profil, { titre:ti.value.trim(), bio:bi.value.trim(), lieu:lieu.value.trim(), devise:dev.value.trim(), liens, dispo:picked(dispo), themes:picked(themes), couleur:coul, honneur:hon.value, fier:fier.value.trim(), jamais:jamais.value.trim() });
        if (!p.parrain && par.value) mine("voix").profil.parrain = par.value; if (!mine("voix").profil.depuis) mine("voix").profil.depuis = Date.now();
        closeModal(); commit("voix"); }}, "Enregistrer")));
  ti.focus();
}

