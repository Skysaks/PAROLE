# Architecture

Parole se compose d'une page de présentation et d'une application, deux fichiers HTML autonomes construits depuis `src/`. L'application est en JavaScript sans dépendance (≈ 140 Ko de code). Ce document décrit la chaîne de build, le modèle de règles, la persistance et la confidentialité par conception.

## De `src/` à `dist/`

```
src/*.html ───────┐
src/styles/*.css  ├─ scripts/build.mjs ──► dist/accueil.html, dist/parole.html
src/fonts/*.woff2 ┤     • <link rel="stylesheet"> → <style> (url() des polices → data:font/woff2)
src/js/*.js ──────┘     • <script src> d'un même data-bundle → un seul <script>
```

- Le gabarit référence les fichiers comme une page web classique ; les balises qui partagent un `data-bundle` sont concaténées dans l'ordre, sans séparateur. Le résultat est un script classique unique : les déclarations d'un module sont visibles de tous, comme dans un fichier d'un seul tenant.
- `npm run build -- --check` reconstruit en mémoire et compare octet par octet avec `dist/accueil.html` et `dist/parole.html` ; la CI échoue au moindre écart.
- `scripts/lib.mjs` porte aussi les contrôles : ressources externes (balises `src`/`href`, `url()`, `@import`, `import()`) et données personnelles (adresses, jetons, liens privés, termes locaux d'un fichier `.prive-termes.txt` jamais publié).

## Modules

| Fichier | Rôle |
|---|---|
| `accueil.js` | page de présentation : lien vers l'application, apparition progressive des sections |
| `01-etat-preferences.js` | limites (`SLOTS` = 5 paroles ouvertes, 140 caractères, 90 jours), thèmes, membres de démonstration, état `S`, ambiances et préférences, données privées locales |
| `02-utilitaires.js` | création d'éléments DOM (`h`, `sv`), dates, formats |
| `03-modele.js` | règles : poids des témoins et du juré, visibilité, verdict à l'aveugle, série, fiabilité, index de contestations |
| `04-persistance.js` | jeu de démonstration local ou base de l'hébergeur, abonnements temps réel |
| `05-lecture-vocale.js` | lecture des paroles par synthèse vocale |
| `06-actions.js` | prendre la parole (dictée ou saisie), juger, reporter, clore, accueil des nouveaux membres |
| `07-cartes.js` | carte d'une parole : état, preuves, témoins, verdicts |
| `08-vues.js` | accueil, explorer, activité, profil, bilan, réglages, coulisses |
| `09-espaces-rendu.js` | espaces, rail latéral, `render()` et regroupement des rendus |

## Modèle de règles

`03-modele.js` ne stocke presque rien de dérivé : tout est recalculé à la lecture à partir des paroles, des témoins et des verdicts.

| Règle | Effet |
|---|---|
| Poids des verdicts | témoin confirmé par l'auteur : ½ ; témoin invité : 1 ; juré tiré au sort hors du cercle : 2 |
| Indépendance du juré | retenu seulement si son auteur est indépendant de celui de la parole |
| Verdict à l'aveugle | tant que tous n'ont pas jugé (ou que le délai court), personne ne voit le sens des verdicts rendus |
| Visibilité | publique, abonnés ou espace ; témoins, juré et destinataire voient toujours |
| Série | paroles tenues d'affilée ; un aveu (abandon, en partie) ne la casse pas, une parole rompue ou contestée, si |
| Fiabilité | affichée à partir de trois paroles jugées |
| Désaveux | un témoin qui confirme ce que le juré conteste est compté contre lui |

## Persistance

| Donnée | Démonstration | Version hébergée |
|---|---|---|
| Paroles, témoins, profils (`paroles`, `temoins`, `voix`) | `localStorage`, jeu fictif réinitialisable | base partagée, temps réel |
| Préférences (ambiance, taille, contraste) | `localStorage` | `localStorage` |
| Pronostic sur soi, mot à soi | `localStorage` uniquement | `localStorage` uniquement, jamais envoyé |

Les deux sources (`demo`, `reel`) coexistent dans `DATA` ; la vue lit toujours `D()`, la source courante.

## Rendu

`render()` reconstruit la vue active. Les mises à jour venues du réseau passent par `schedule()`, qui les regroupe en un seul rendu par image (`requestAnimationFrame`) au lieu d'un rendu par document reçu.

## Page de présentation

Fichier séparé, sans dépendance à l'application : une politique de sécurité du contenu (`default-src 'none'`, images en `data:` seulement, aucun formulaire) garantit qu'elle ne charge rien de l'extérieur.

## Tests

| Fichier | Vérifie |
|---|---|
| `tests/build.test.mjs` | `dist/` à jour, document complet (langue, encodage, viewport, titre, description), aucune ressource externe, aucun fichier orphelin dans `src/`, aucune donnée personnelle |
| `tests/e2e/app.spec.mjs` | ouverture hors ligne sans erreur ni requête, absence de débordement horizontal, ouverture de l'application depuis la présentation, assistant d'accueil, sections principales, onglets du fil, espaces, réglages et coulisses ; en 1440 × 900 et en 390 × 844 tactile |

Les parcours sont décrits dans `build.config.json` (`e2e.flows`), ce qui garde le fichier de test générique.
