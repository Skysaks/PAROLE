/* ---------- persistance ---------- */
const chains = {};
function commit(kind){
  render();
  if (S.src === "demo"){ try { localStorage.setItem(LS, JSON.stringify(DATA.demo)); } catch(e){} return; }
  const body = sanitize(kind, clone(mine(kind))), path = kind + "/" + S.uid;
  chains[kind] = (chains[kind] || Promise.resolve()).then(() => db.doc(path).set(body)).catch(e => {
    toast(e && e.code === "invalid_argument" ? "Écriture refusée. Il te faut un accès Contributeur sur cette page." : "Enregistrement impossible pour l'instant. Réessaie.");
  });
}
function seed(){
  const now = Date.now(), d = (n) => iso(now + n*DAY), X = blank();
  const P = (u, id, t, th, due, c, decl, proof, dAt) => { (X.paroles[u] = X.paroles[u] || {items:{}}).items[id] = Object.assign({ t, th, due:d(due), c:now-c*DAY }, decl ? { decl, proof, dAt:now-dAt*DAY } : {}); };
  const W = (w, id, a, v, vat, extra) => { (X.temoins[w] = X.temoins[w] || {items:{}}).items[id] = Object.assign({ a, at:now-9*DAY }, v ? { v, vat:now-(vat||1)*DAY } : {}, extra || {}); };
  const U = (u, titre, bio, themes, suivis) => { X.voix[u] = { profil:{ titre, bio, themes }, posts:{}, suivis:Object.fromEntries(suivis.map(s=>[s, now-12*DAY])) }; };
  const V = (u, id, t, th, hoursAgo, re) => { X.voix[u].posts[id] = Object.assign({ t, th, c:now-hoursAgo*HOUR }, re ? { re } : {}); };
  U("ines","Kiné du sport · prépare son premier semi","Je soigne des coureurs toute la semaine. Cette année je passe de l'autre côté de la table.",["Sport","Santé"],["hugo","nadia","moi"]);
  U("marc","Auteur · roman policier en cours","Un chapitre par mois, promis à voix haute pour ne plus reculer.",["Création"],["ines","hugo"]);
  U("salome","Commerciale indépendante B2B","Je vends des logiciels de planning aux PME. Mes chiffres sont publics ici.",["Business"],["theo","hugo","moi"]);
  U("theo","Développeur · projets perso le soir","Une appli de budget en chantier depuis trop longtemps.",["Tech"],["salome","ines"]);
  U("nadia","Éducatrice U13 · prépare son BMF","Le terrain le mercredi et le samedi, les modules le reste du temps.",["Football","Apprentissage"],["ines","lea"]);
  U("hugo","Fondateur d'un studio de podcast","Je produis des émissions pour des indépendants. Le mien avance moins vite que ceux des clients.",["Création","Business"],["marc","salome","nadia"]);
  U("lea","Étudiante en droit · concours en juin","Je documente mes révisions, les réussites comme les ratés.",["Apprentissage"],["nadia","theo"]);
  U("moi","","",[],["ines","hugo"]);
  X.voix.salome.espaces = { eq1:{ n:"Équipe commerciale Atelier Nord", type:"Équipe", c:now-40*DAY } };
  X.voix.nadia.espaces = { eq2:{ n:"Staff éducateurs U13", type:"Club", c:now-30*DAY } };
  X.voix.hugo.espaces = { eq3:{ n:"Promotion Podcast d'automne", type:"Promotion", c:now-25*DAY } };
  ["theo","marc","moi"].forEach(u => { X.voix[u].membre = { eq1:true }; }); X.voix.ines.membre = { eq2:true }; X.voix.lea.membre = { eq2:true, eq3:true }; X.voix.marc.membre.eq3 = true;
  P("ines","s1","Courir le semi-marathon de Toulouse en moins de 1 h 55","Sport",12,20);
  P("ines","s2","Passer un TOEIC blanc complet et publier mon score","Apprentissage",-1,15,"tenue","Score : 915. Capture du relevé envoyée aux témoins.",0.2);
  P("ines","s8","Tenir trois sorties par semaine pendant un mois","Sport",-20,50,"tenue","Historique de la montre partagé : 13 sorties en 30 jours.",20);
  P("ines","s9","Publier mon protocole de reprise après entorse","Santé",-40,60,"tenue","Document en ligne, relu par deux confrères.",41);
  P("marc","s3","Envoyer le chapitre 3 du manuscrit à mon éditrice","Création",2,9);
  P("marc","s4","Livrer la refonte du site du club avant la reprise","Tech",-3,30);
  P("salome","s5","Appeler 20 prospects et publier le décompte ici","Business",0,4);
  P("salome","s6","Écrire 500 mots par jour pendant deux semaines","Création",-6,20,"abandon","Arrêt au jour 6 : rythme intenable avec le déménagement.",12);
  P("theo","s7","Zéro sucre ajouté pendant 30 jours","Santé",-2,32,"tenue","Journal alimentaire tenu chaque jour, partagé aux deux témoins.",2);
  P("theo","s10","Mettre en ligne la v1 de mon appli de budget","Tech",6,14);
  P("nadia","s11","Valider mon module BMF avant la trêve","Football",20,10);
  P("nadia","s12","Organiser un tournoi U13 de huit équipes","Football",-8,45,"tenue","Tournoi joué samedi : 8 équipes, 96 enfants, feuille de match en lien.",7);
  P("hugo","s13","Sortir quatre épisodes en quatre semaines","Création",9,19);
  P("hugo","s14","Signer un premier sponsor pour le podcast","Business",-15,50,"tenue","Contrat signé, annonce dans l'épisode 12.",16);
  P("lea","s15","Ficher les 12 chapitres de droit des obligations","Apprentissage",5,12);
  P("lea","s16","Réviser deux heures chaque matin pendant dix jours","Apprentissage",-4,16);
  W("marc","s1","ines"); W("salome","s1","ines"); W("theo","s2","ines","ok"); W("moi","s2","ines");
  W("marc","s8","ines","ok",20); W("hugo","s8","ines","ok",19); W("nadia","s9","ines","ok",40);
  W("ines","s3","marc"); W("hugo","s3","marc"); W("ines","s4","marc");
  W("marc","s5","salome"); W("theo","s5","salome"); W("hugo","s6","salome");
  W("salome","s7","theo","ok",2); W("ines","s7","theo","ok",1); W("salome","s10","theo"); W("lea","s10","theo");
  W("ines","s11","nadia"); W("lea","s11","nadia"); W("hugo","s12","nadia","ok",7); W("lea","s12","nadia","ok",6);
  W("marc","s13","hugo"); W("salome","s13","hugo"); W("nadia","s13","hugo"); W("salome","s14","hugo","ok",15); W("marc","s14","hugo","ko",15); W("theo","s14","hugo","ok",14);
  W("nadia","s15","lea"); W("theo","s16","lea");
  P("marc","s17","Courir 10 km trois fois cette semaine","Sport",-1,8,"tenue","Trois sorties enregistrées, captures envoyées aux témoins.",1);
  W("ines","s17","marc","ok",1); W("hugo","s17","marc","ok",1);
  W("theo","s17","marc","ko",0.5,{j:true, why:"Les captures montrent deux sorties de 10 km et une de 6. La parole disait trois fois 10."});
  P("lea","s18","Rendre mon commentaire d'arrêt avant lundi","Apprentissage",0,6,"tenue","Accusé de dépôt sur la plateforme de la faculté, daté de dimanche.",0.5);
  W("nadia","s18","lea","ok",0.4); W("moi","s18","lea",null,null,{j:true});
  W("lea","s14","hugo","ok",14,{j:true, amb:3});
  X.temoins.hugo.items.s8.amb = 2; X.temoins.nadia.items.s9.amb = 2; X.temoins.hugo.items.s12.amb = 3; X.temoins.salome.items.s7.amb = 2; X.temoins.theo.items.s17.amb = 1;
  P("moi","m1","Publier la page de présentation de mon projet","Business",4,6); W("ines","m1","moi"); W("hugo","m1","moi");
  P("moi","m2","Lire un livre de négociation et en publier la fiche","Apprentissage",-12,30,"tenue","Fiche publiée, lien envoyé aux témoins.",12); W("ines","m2","moi","ok",12,{amb:2}); W("hugo","m2","moi","ok",11);
  P("salome","e1","Signer deux nouveaux clients avant la fin du mois","Business",8,10); W("theo","e1","salome"); W("marc","e1","salome");
  P("theo","e2","Livrer la démo au client pilote","Tech",3,7); W("salome","e2","theo",null,null,{sup:now}); W("marc","e2","theo");
  P("marc","e3","Rédiger les trois études de cas clients","Business",-5,20,"tenue","Les trois études sont dans le dossier partagé.",5); W("salome","e3","marc","ok",5,{amb:2}); W("theo","e3","marc","ok",4);
  ["e1"].forEach(i => X.paroles.salome.items[i].vis = "e:eq1"); X.paroles.theo.items.e2.vis = "e:eq1"; X.paroles.marc.items.e3.vis = "e:eq1"; X.paroles.theo.items.e2.ck = { d:d(0), s:"dur" };
  P("nadia","e4","Préparer le plan de séances de décembre","Football",6,5); W("ines","e4","nadia"); X.paroles.nadia.items.e4.vis = "e:eq2";
  P("hugo","t1","Livrer le montage de l'épisode pilote à Marc","Création",4,3); X.paroles.hugo.items.t1.to = "marc"; W("marc","t1","hugo",null,null,{to:true});
  X.paroles.lea.items.s15.rep = { from:d(-2), why:"Le partiel a été avancé d'une semaine, je décale d'autant.", at:now-3*DAY };
  Object.assign(X.paroles.hugo.items.s13, { proj:true, contre:"Ton nom au générique de l'épisode 4" }); X.voix.lea.soutiens = { s13:{ a:"hugo", m:25, at:now-6*DAY } }; X.voix.theo.soutiens = { s13:{ a:"hugo", m:50, at:now-5*DAY } };
  Object.assign(X.paroles.nadia.items.s12, { proj:true, contre:"La photo de l'équipe gagnante, dédicacée" }); X.voix.marc.soutiens = { s12:{ a:"nadia", m:25, at:now-30*DAY, h:now-6*DAY } }; X.voix.moi.soutiens = { s12:{ a:"nadia", m:25, at:now-28*DAY } };
  [["ines",70,null],["hugo",64,"ines"],["marc",58,"hugo"],["salome",52,"hugo"],["nadia",47,"ines"],["theo",40,"salome"],["lea",33,"nadia"],["moi",31,"ines"]].forEach(([u,dd,par]) => { X.voix[u].profil.depuis = now - dd*DAY; if (par) X.voix[u].profil.parrain = par; });
  Object.assign(X.voix.ines.profil, { honneur:"Série de 3", fier:"Mon premier 10 km sans marcher, promis à une patiente qui doutait d'elle.", jamais:"« Je te rappelle demain ». Je donne une heure, ou je ne promets pas." });
  Object.assign(X.voix.hugo.profil, { honneur:"Première parole tenue", fier:"Le premier sponsor du podcast, annoncé avant d'avoir un seul contact." });
  X.paroles.ines.items.s1.ch = X.paroles.ines.items.s8.ch = "Semi-marathon de Toulouse"; X.paroles.hugo.items.s13.ch = X.paroles.hugo.items.s14.ch = X.paroles.hugo.items.t1.ch = "Podcast, saison 1";
  P("lea","r1","Courir trois fois par semaine pendant un mois","Sport",18,4); X.paroles.lea.items.r1.from = { u:"ines", id:"s8" }; W("nadia","r1","lea");
  Object.assign(X.voix.ines.profil, { lieu:"Toulouse", devise:"Ce qui est dit est fait, ou expliqué.", liens:[{ t:"Cabinet", u:"https://exemple.fr/cabinet" }], dispo:["Conférences","Mentorat"], couleur:2, pins:["s8","s9"] });
  Object.assign(X.voix.hugo.profil, { lieu:"Bordeaux", devise:"Un épisode vaut mieux qu'un plan.", dispo:["Missions"], couleur:4, pins:["s14"] });
  Object.assign(X.voix.nadia.profil, { lieu:"Colomiers", couleur:1, pins:["s12"] });
  X.temoins.hugo.items.s8.mot = "Je l'ai vue sortir courir sous la pluie trois soirs de suite."; X.temoins.nadia.items.s9.mot = "Son protocole sert maintenant à nos éducateurs."; X.temoins.salome.items.s14.mot = "Il m'a montré le contrat signé le jour même.";
  X.voix.ines.msgs = { g1:{ k:"m1", a:"moi", t:"Tu me montres la maquette avant vendredi ? Je te dis ce qui accroche.", c:now-2*DAY } }; X.voix.hugo.msgs = { g2:{ k:"m1", a:"moi", t:"Pense à mettre un lien vers la démo, c'est ce que je regarderai.", c:now-1*DAY } };
  X.paroles.theo.items.s10.seal = true; X.paroles.moi.items.m1.plan = "Si la maquette n'est pas prête jeudi, alors je publie d'abord une version texte.";
  P("marc","k1","Relire le script de l'épisode pilote de Hugo et lui rendre mes notes","Création",3,2); Object.assign(X.paroles.marc.items.k1, { to:"hugo", pact:{ u:"hugo", id:"t1" } }); W("hugo","k1","marc",null,null,{to:true});
  P("lea","f1","Réviser une heure chaque matin pendant cinq jours","Apprentissage",-5,11,"tenue","Cinq matins cochés, photo du carnet envoyée.",4); X.paroles.lea.items.f1.fix = "s16"; W("theo","f1","lea","ok",4,{amb:1}); W("nadia","f1","lea","ok",4);
  if (!PRIV.demo) { PRIV.demo = { m2:{ conf:90 }, m1:{ conf:70, memo:"Tu as promis ça un soir de doute. Finis-le, même imparfait." } }; savePriv(); }
  X.paroles.lea.items.s16.late = "J'ai lâché au quatrième jour sans oser le dire. La prochaine sera plus courte.";
  X.paroles.salome.items.s5.ck = { d:d(0), s:"ok" }; X.paroles.lea.items.s15.ck = { d:d(-1), s:"dur" };
  V("salome","v1","Point d'étape : quatorze appels sur vingt à midi. Deux rendez-vous pris. Le décompte complet ce soir.","Business",3);
  V("nadia","v2","Séance de ce matin avec les U13 : relance courte sous pression. Les enfants ont compris en vingt minutes ce que j'expliquais mal depuis un mois.","Football",6);
  V("theo","v3","Question à mes témoins : pour une v1, vous préférez une appli qui fait une seule chose bien, ou trois choses à moitié ? J'ai ma réponse, je veux la vôtre.","Tech",9);
  V("hugo","v4","Une seule chose. Mon podcast a décollé le jour où j'ai arrêté les formats bonus.","Tech",8,{k:"v",u:"theo",id:"v3"});
  V("salome","v5","Une seule. Mes clients achètent le planning, pas les douze modules autour.","Tech",7,{k:"v",u:"theo",id:"v3"});
  V("ines","v6","Sortie longue de dix-huit kilomètres bouclée, allure cinq vingt-cinq. Le genou tient. Je maintiens l'objectif.","Sport",20);
  V("lea","v7","J'ai rompu ma parole sur les révisions du matin. Elle était mal formulée : dix jours d'affilée, sans marge. La prochaine aura un jour de repos.","Apprentissage",28);
  V("ines","v8","Formuler une parole tenable, c'est la moitié du travail. Je serai témoin de la prochaine.","Apprentissage",26,{k:"v",u:"lea",id:"v7"});
  V("marc","v9","Le chapitre 3 résiste. J'ai coupé deux mille mots hier et c'est mieux. Envoi jeudi comme promis.","Création",33);
  V("hugo","v10","Trois semaines que je publie mes engagements ici. Je réfléchis maintenant avant de promettre, parce que je sais que quelqu'un vérifiera.","Création",50);
  V("marc","v11","Je serai là jeudi pour le quatrième épisode. Tu as mon verdict en attente.","Création",30,{k:"p",u:"hugo",id:"s13"});
  DATA.demo = X;
  paroles().forEach(x => { const j = x.jury; if (j && !j.v && !j.at && j.uid !== "moi") (X.temoins[j.uid] = X.temoins[j.uid] || {items:{}}).items[x.id] = { a:x.uid, j:true, at:now-DAY, v:"ok", vat:now-0.1*DAY }; });
}
function startDemo(){
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(LS) || "null"); } catch(e){}
  if (saved && saved.paroles && saved.temoins && saved.voix) DATA.demo = sanitizeAll(saved); else seed();
  try { prefs = Object.assign(prefs, JSON.parse(localStorage.getItem(LSP) || "{}")); } catch(e){}
  try { SEEN = JSON.parse(localStorage.getItem(LSS) || "null"); } catch(e){}
  applyPrefs();
}
async function refreshNames(){
  if (!user || !S.uid) return;
  const ids = [...new Set([S.uid, ...Object.keys(DATA.reel.paroles), ...Object.keys(DATA.reel.voix), ...Object.keys(DATA.reel.temoins)])];
  const ps = await user.profiles(ids);
  let changed = false;
  for (const id of ids){ const n = (ps[id] && ps[id].name) || ""; if (S.names[id] !== n){ S.names[id] = n; changed = true; } }
  if (changed && S.src === "reel") render();
}
async function boot(){
  startDemo(); render();
  if (!prefs.onb) openOnboarding();
  if (!(window.claude && typeof window.claude.use === "function")) return;
  try {
    [db, user, dict] = await Promise.all([window.claude.use("db"), window.claude.use("user"), window.claude.use("dictation")]);
    const uid = user ? await user.id() : null;
    if (!db || !uid) return;
    S.uid = uid; S.canReal = true;
    let got = 0;
    const timer = setTimeout(() => { S.stale = true; render(); }, 10000);
    ["paroles","temoins","voix"].forEach(kind => db.collection(kind).onSnapshot(snap => {
      const next = bag();
      snap.docs.forEach(doc => { const data = doc.data(); if (data) next[doc.id] = sanitize(kind, clone(data)); });
      DATA.reel[kind] = next;
      if (!snap.metadata.fromCache){ got++; if (got >= 3){ clearTimeout(timer); S.stale = false; } }
      if (S.src === "reel") schedule();
      refreshNames();
    }, () => { clearTimeout(timer); S.stale = true; render(); }));
    render();
  } catch(e){}
}

