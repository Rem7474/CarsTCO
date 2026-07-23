# CarsTCO

Comparateur de coût total de possession (TCO) pour deux véhicules — thermique
et/ou électrique — avec quatre modes de financement (achat comptant, crédit,
LOA, LDD/LLD).

Tous les calculs s'exécutent côté client : aucune donnée n'est envoyée à un
serveur, tout est recalculé en temps réel à chaque changement de paramètre.

## Fonctionnalités

- Deux véhicules comparables indépendamment (énergie, financement, usage).
- 4 modes d'acquisition : achat comptant, crédit classique, LOA, LDD/LLD, avec
  gestion du dépassement kilométrique, de la fin de contrat (reconduction,
  levée d'option, restitution) et des postes déjà inclus dans le loyer.
- Décomposition des coûts par poste (financement, énergie, entretien, pneus,
  assurance, fiscalité) sous forme de graphique empilé.
- Graphique de seuil de rentabilité (coût cumulé vs kilométrage annuel ou vs
  durée de détention).
- Sauvegarde automatique du scénario en local (`localStorage`), export/import
  JSON, et partage par lien (paramètres encodés dans l'URL).

## Développement

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production (tsc + vite build)
npm run lint     # oxlint
```

## Structure

- `src/types/scenario.ts` — modèle de données du scénario.
- `src/lib/calculations.ts` — moteur de calcul du TCO par véhicule.
- `src/lib/breakeven.ts` — analyse de sensibilité (kilométrage / durée).
- `src/data/defaults.ts` — valeurs par défaut (marché français 2026).
- `src/components/form/` — formulaire de saisie par section.
- `src/components/results/` — tableau de synthèse et graphiques.

## Hypothèses de calcul notables

- En LOA/LDD, le bonus/malus écologique et la carte grise sont supposés déjà
  répercutés dans le loyer et ne sont donc pas recomptés.
- Les postes "entretien" et "assurance" peuvent être marqués comme inclus dans
  le loyer pour éviter un double comptage.
- Le coût du dépassement kilométrique en LOA/LDD est calculé de façon linéaire
  sur toute la durée de détention plutôt que contrat par contrat.
- Si la durée de détention dépasse la durée du contrat LOA/LDD, plusieurs
  contrats successifs sont simulés (reconduction) ; en LOA, une levée
  d'option n'est appliquée que si la détention se termine exactement à la fin
  d'un contrat.
