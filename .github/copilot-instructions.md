# Instructions pour GitHub Copilot

Lis d'abord **`AGENTS.md`** à la racine : il contient toutes les règles du dépôt (français, tablette d'abord, compatibilité des données, zones sensibles, définition de « terminé »). Ne dupliquons pas les consignes ici.

Spécificités Copilot :
- Pour vérifier l'interface, lance `npm run serve` puis utilise le serveur MCP Playwright déclaré dans `.vscode/mcp.json` (ne modifie pas ce fichier).
- Travaille sur une branche `agent/copilot/<sujet>` et ouvre une PR en brouillon avec le modèle fourni.
- Évite les tâches marquées `sensible` dans les issues sans accord explicite.
