"use strict";
// Garde-fou des icônes : elles sont intégrées en data-URI dans correction.css (aucun chargement réseau
// pour dessiner l'interface). Ce test vérifie qu'aucune référence externe ne revient, que chaque classe
// icône utilisée a bien sa règle, et que le contenu intégré reste identique au fichier source (dossier icones/).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "correction.html"), "utf8");
const css = fs.readFileSync(path.join(root, "correction.css"), "utf8");
const jsDir = path.join(root, "src", "js");
const jsSources = [fs.readFileSync(path.join(root, "editeur-grille.js"), "utf8"), ...fs.readdirSync(jsDir).filter(n => n.endsWith(".js")).map(n => fs.readFileSync(path.join(jsDir, n), "utf8"))].join("\n");

// Icônes posées dynamiquement par le JavaScript (noms littéraux des sites d'appel).
const ICONES_DYNAMIQUES = ["target", "rule", "leaderboard", "add_circle", "hourglass_empty", "star", "info", "timer_pause", "timer_play", "restart_alt", "close", "sort", "school", "check", "portrait", "view_list", "grid_view", "dehaze", "edit", "stacks"];

const regles = new Map(); // nom -> data-URI
for (const [, nom, uri] of css.matchAll(/\.icone-([a-z_]+)\{--icon:url\("([^"]+)"\)\}/g)) regles.set(nom, uri);

test("plus aucune icône n'est chargée par le réseau", () => {
  assert.doesNotMatch(html, /--icon:url\('icones\//, "correction.html ne référence plus de fichiers d'icônes");
  assert.doesNotMatch(css, /url\(['"]?icones\//, "correction.css ne référence plus de fichiers d'icônes");
  assert.doesNotMatch(jsSources, /icones\/[a-z_]+\.svg/, "les modules JS ne référencent plus de fichiers d'icônes");
});

test("chaque classe icône utilisée dispose d'une règle en data-URI", () => {
  const utilisees = new Set([...html.matchAll(/class="[^"]*\bicone-([a-z_]+)/g)].map(m => m[1]));
  for (const nom of ICONES_DYNAMIQUES) utilisees.add(nom);
  for (const nom of utilisees) assert.ok(regles.has(nom), `règle .icone-${nom} absente de correction.css`);
  for (const [nom, uri] of regles) assert.ok(uri.startsWith("data:image/svg+xml,"), `.icone-${nom} n'est pas une data-URI`);
});

test("le contenu intégré de chaque icône reste identique au fichier source du dossier icones/", () => {
  assert.ok(regles.size > 0, "aucune règle d'icône trouvée");
  for (const [nom, uri] of regles) {
    const source = fs.readFileSync(path.join(root, "icones", `${nom}.svg`), "utf8");
    assert.equal(decodeURIComponent(uri.slice("data:image/svg+xml,".length)), source, `icone-${nom} diverge du fichier source`);
  }
});
