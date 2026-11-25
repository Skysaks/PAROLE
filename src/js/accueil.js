
"use strict";
/* Adresse de la démonstration : seule valeur à changer si l'application est hébergée ailleurs (par exemple "./app/"). */
const DEMO = "parole.html";
document.querySelectorAll("[data-demo]").forEach(a => { a.href = DEMO; if (/^https:/.test(DEMO)) { a.target = "_blank"; a.rel = "noopener"; } });
document.getElementById("an").textContent = new Date().getFullYear();
const meta = document.querySelector('meta[name="theme-color"]');
document.querySelectorAll(".skin").forEach(b => b.addEventListener("click", () => {
  document.documentElement.dataset.skin = b.dataset.s;
  document.querySelectorAll(".skin").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  meta.content = getComputedStyle(document.documentElement).getPropertyValue("--deep").trim();
}));
const rv = document.querySelectorAll(".rv");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  rv.forEach(e => io.observe(e));
} else rv.forEach(e => e.classList.add("in"));
