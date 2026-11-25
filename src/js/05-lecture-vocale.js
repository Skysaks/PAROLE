/* ---------- lecture vocale (synthèse dans ce prototype) ---------- */
let playing = null;
function stopPlay(){
  if (!playing) return;
  clearInterval(playing.timer);
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(e){}
  playing.bars.forEach(b => b.classList.remove("on"));
  playing.btn.replaceChildren(icon("play")); playing = null;
}
function icon(n){
  const el = document.createElementNS("http://www.w3.org/2000/svg","svg"); el.setAttribute("viewBox","0 0 24 24");
  const p = document.createElementNS("http://www.w3.org/2000/svg","path");
  p.setAttribute("d", n === "play" ? "M7 4v16l13-8z" : n === "stop" ? "M6 6h12v12H6z" : "M12 15a4 4 0 004-4V6a4 4 0 00-8 0v5a4 4 0 004 4zm7-4h-2a5 5 0 01-10 0H5a7 7 0 006 6.9V21h2v-3.1A7 7 0 0019 11z");
  el.append(p); return el;
}
const durOf = (t) => Math.max(3, Math.round(String(t).length / 14));
function player(text, small){
  const n = small ? 22 : 40, seed0 = hash(text), bars = [];
  for (let i = 0; i < n; i++){ const v = (Math.sin(seed0 % 97 + i * 1.7) + Math.sin(i * 0.45 + seed0 % 13) + 2) / 4; bars.push(h("i", {style:"height:" + Math.round(18 + v * 82) + "%"})); }
  const d = durOf(text);
  const btn = h("button", {class:"play", "aria-label":"Écouter", onclick:() => {
    const was = playing && playing.btn === btn; stopPlay(); if (was) return;
    let i = 0;
    playing = { btn, bars, timer: setInterval(() => { if (i < bars.length) bars[i++].classList.add("on"); else stopPlay(); }, d * 1000 / bars.length) };
    btn.replaceChildren(icon("stop"));
    try { if (window.speechSynthesis){ const u = new SpeechSynthesisUtterance(text); u.lang = "fr-FR"; window.speechSynthesis.speak(u); } } catch(e){}
  }}, icon("play"));
  return h("div", {class:"player"}, btn, h("div", {class:"wave", "aria-hidden":"true"}, bars), h("span", {class:"dur"}, "0:" + String(d).padStart(2,"0")));
}

