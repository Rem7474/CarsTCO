# CarsTCO — Documentation technique

Documentation orientée développement. Pour la présentation du produit, voir
le [README](../README.md).

## Stack

React + TypeScript + Vite, Tailwind CSS v4, Recharts. Aucun backend : tous
les calculs et la persistance (localStorage, export/import JSON, URL) sont
côté client.

## Développement

```bash
npm install
npm run dev        # serveur de développement
npm run build      # build de production (tsc + vite build)
npm run lint        # oxlint
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
npm run test:watch  # vitest en mode watch
```

## Structure

- `src/types/scenario.ts` — modèle de données du scénario.
- `src/lib/calculations.ts` — moteur de calcul du TCO par véhicule.
- `src/lib/breakeven.ts` — analyse de sensibilité (kilométrage / durée).
- `src/lib/persistence.ts` — localStorage, encodage URL, export/import JSON.
- `src/data/defaults.ts` — valeurs par défaut (marché français 2026).
- `src/components/form/` — formulaire de saisie par section.
- `src/components/results/` — tableau de synthèse et graphiques.
- `src/lib/*.test.ts`, `src/App.test.tsx` — tests Vitest + Testing Library.

## Hypothèses de calcul notables

- En LOA/LDD, le bonus/malus écologique et la carte grise sont supposés déjà
  répercutés dans le loyer et ne sont donc pas recomptés.
- Les postes « entretien » et « assurance » peuvent être marqués comme inclus
  dans le loyer pour éviter un double comptage.
- Le coût du dépassement kilométrique en LOA/LDD est calculé de façon linéaire
  sur toute la durée de détention plutôt que contrat par contrat.
- Si la durée de détention dépasse la durée du contrat LOA/LDD, plusieurs
  contrats successifs sont simulés (reconduction) ; en LOA, une levée
  d'option n'est appliquée que si la détention se termine exactement à la fin
  d'un contrat.

## CI/CD

- `.github/workflows/ci.yml` — lint, typecheck, tests et build sur chaque push
  vers `main` et chaque pull request.
- `.github/workflows/deploy.yml` — build puis déploiement sur GitHub Pages à
  chaque push sur `main`.

### Domaine personnalisé (carstco.remcorp.fr)

Le site est servi sur `carstco.remcorp.fr` via un fichier `public/CNAME`
(copié tel quel dans `dist/` à chaque build, donc redéployé automatiquement).
Pour que ça fonctionne, deux réglages sont nécessaires en dehors de ce repo :

1. **DNS** — chez le registrar/gestionnaire DNS de `remcorp.fr`, ajouter un
   enregistrement `CNAME` :
   - Nom/hôte : `carstco`
   - Valeur/cible : `rem7474.github.io.` (avec le point final)
   - TTL : valeur par défaut (ex. 3600)
2. **GitHub** — dans *Settings → Pages* du repo :
   - Source : `GitHub Actions` (déjà utilisé par `deploy.yml`)
   - `Settings → Actions → General → Workflow permissions` : **Read and
     write permissions** (nécessaire pour que le workflow puisse publier sur
     Pages)
   - Custom domain : `carstco.remcorp.fr` (normalement pré-rempli
     automatiquement à partir du fichier `CNAME` après le premier déploiement
     réussi ; sinon le saisir manuellement puis Save)
   - Cocher **Enforce HTTPS** une fois que GitHub a fini de provisionner le
     certificat (peut prendre jusqu'à 24h après la propagation DNS)
