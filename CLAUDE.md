# CLAUDE.md

Lis d'abord **`AGENTS.md`** à la racine : c'est la source unique des instructions pour ce dépôt (règles, commandes, définition de « terminé »).

Spécificités pour Claude :
- Tu es mobilisé en priorité pour les **zones sensibles** listées dans `AGENTS.md` (calculs, format de grille, stockage, impression), la rédaction ou l'arbitrage de spécifications, et la revue de PR.
- Avant de modifier un calcul ou une structure sauvegardée, relis `docs/spec/methodes-correction.md` et `docs/spec/donnees.md`, puis ajoute ou adapte les tests unitaires.
- Pour une revue : compare le diff à la spec, vérifie les tests et la compatibilité des données, liste les risques avant d'approuver.
