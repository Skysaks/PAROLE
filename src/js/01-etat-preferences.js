
"use strict";
const DAY = 864e5, HOUR = 36e5, SLOTS = 5, PMAX = 140, VMAX = 280, MAXDAYS = 90, LS = "parole-demo-v10", LSM = "parole-prive-v1", MAXOPEN = 3, MAXREP = 2, LSS = "parole-seen-v1", JURY_DAYS = 3, LSP = "parole-prefs-v2";
const THEMES = ["Sport","Business","Création","Apprentissage","Football","Tech","Santé","Vie perso"];
const PERS = { ines:"Inès Caradec", marc:"Marc Oliveira", salome:"Salomé Brandt", theo:"Théo Lemaire", nadia:"Nadia Ferhat", hugo:"Hugo Vasseur", lea:"Léa Montfort" };
const blank = () => ({ paroles:{}, temoins:{}, voix:{} });
const DATA = { demo: blank(), reel: blank() };
const S = { src:"demo", uid:null, canReal:false, stale:false, names:{}, ui:{ tab:"pourtoi", ptab:"paroles", profile:null, q:"", theme:null, thread:{} } };
let db = null, user = null, dict = null, prefs = { perso:true, offres:false, stats:true, ia:false, size:"m", contrast:false, motion:false, onb:false, skin:"moderne" }, SEEN = null, lastFocus = null;
const SKINS = [["moderne","Moderne","Clair, net, un accent bleu.",["#F5F5F7","#1D1D1F","#0058C7"]],["sapin","Sapin","Ivoire, vert sapin, filets laiton.",["#F4F0E6","#1F4D3A","#B2955A"]],["chocolat","Chocolat","Crème, brun chocolat, cuivre.",["#F3ECE2","#5A3521","#B98A56"]]];
function skinPicker(){
  const box = h("div", {class:"skins", role:"group", "aria-label":"Ambiance"});
  SKINS.forEach(([id, n, d, cols]) => box.append(h("button", {type:"button", "aria-pressed":String((prefs.skin || "moderne") === id), onclick:()=>{ prefs.skin = id; try{ localStorage.setItem(LSP, JSON.stringify(prefs)); }catch(e){} applyPrefs(); box.querySelectorAll("button").forEach((b,k) => b.setAttribute("aria-pressed", String(SKINS[k][0] === id))); }},
    h("div", {class:"dots", "aria-hidden":"true"}, cols.map(c => h("i", {style:"background:" + c}))), h("div", null, h("b", null, n), h("span", null, d)))));
  return box;
}
function applyPrefs(){ const r = document.documentElement; if (prefs.skin && prefs.skin !== "moderne" && SKINS.some(k => k[0] === prefs.skin)) r.dataset.skin = prefs.skin; else delete r.dataset.skin; r.dataset.size = prefs.size || "m"; if (prefs.contrast) r.dataset.contrast = "more"; else delete r.dataset.contrast; if (prefs.motion) r.dataset.motion = "less"; else delete r.dataset.motion; }
function savePrefs(){ try{ localStorage.setItem(LSP, JSON.stringify(prefs)); }catch(e){} applyPrefs(); render(); }
/* Ce qui ne regarde que le membre (pronostic sur soi, mot à soi) reste sur son appareil et n'est jamais envoyé */
let PRIV = {}; try { PRIV = JSON.parse(localStorage.getItem(LSM) || "{}") || {}; } catch(e){}
const priv = () => (PRIV[S.src] = PRIV[S.src] && typeof PRIV[S.src] === "object" ? PRIV[S.src] : {});
const savePriv = () => { try { localStorage.setItem(LSM, JSON.stringify(PRIV)); } catch(e){} };
function sv(tag, attrs, ...kids){ const el = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in attrs) el.setAttribute(k, attrs[k]); kids.forEach(k => el.append(k)); return el; }
const D = () => DATA[S.src];
const me = () => S.src === "demo" ? "moi" : S.uid;

