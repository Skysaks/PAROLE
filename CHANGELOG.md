# Journal des modifications

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versions datées.

## [1.0.0] — 2026-11-25

### Ajouté

- Sources découpées en modules (`src/js`, `src/styles`) et build vers `dist/accueil.html` et `dist/parole.html`.
- Police Libre Caslon Display embarquée : plus aucune requête réseau.
- Tests d'intégrité (node:test) et parcours de bout en bout bureau et mobile (Playwright), CI GitHub Actions.
- Publication de la présentation et de l'application sur GitHub Pages.
- Documentation : architecture (modèle de règles, persistance), captures, sécurité, contribution.

### Modifié

- La page de présentation pointe vers `parole.html`, publié à côté d'elle.
