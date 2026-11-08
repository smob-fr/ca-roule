# Feuille de route

## 1. Emballer en appli (priorité)
- Séparer `src/template.html` en `index.html` + `style.css` + modules JS (garder le build mono-fichier pour les artefacts).
- Capacitor (iOS + Android) : `npm i @capacitor/core @capacitor/cli`, `npx cap init`, `npx cap add ios android`, dossier web = `dist/`.
- Icônes, écran de lancement, mode plein écran, zones sûres (déjà gérées en CSS).
- Comptes développeur Apple (99 $/an) et Google Play (25 $ une fois).

- Rappels du défi : `npm i @capacitor/local-notifications`, puis `npx cap sync`. Android 13+ : permission POST_NOTIFICATIONS (demandée par le plugin) ; Android 12+ : pour l'heure exacte, déclarer SCHEDULE_EXACT_ALARM ou accepter un léger décalage. iOS : rien à configurer pour des notifications locales. Icône de notification Android (`smallIcon`) à fournir.

## 2. Monétisation réelle
- SDK pub : AdMob (plugin Capacitor) ; remplacer `runAd('reward'|'inter')` et la bannière.
- Consentement RGPD (UMP de Google) et suivi (ATT sur iOS) : obligatoires en Europe.
- Achat intégré « sans pub » (RevenueCat ou plugin natif).
- Indices en vidéo récompensée (déjà câblés), vie supplémentaire, relance après chrono.

## 3. Contenu et rétention
- ~~Nouvelle Course « sorties limitées »~~ : faite (75 niveaux, 3 villes, carte illustrée, coffres, missions). Suite : villes 4 à 6 (aéroport et plaques tournantes, montagne et voitures bâchées, plage et feux), aides Peinture et Dépanneuse, collections de plaques et « permis » de ville, calendrier de la semaine, rallye du week-end.
- ~~Sons et musique~~ : fait (Web Audio synthétisé). Piste possible : vraie musique composée en fichiers pour la version store.
- ~~Skins de voitures~~ : fait (7 styles débloqués par les étoiles). Piste : skins exclusifs via vidéo récompensée ou achat.
- ~~Défi du jour~~ : fait (casse-tête expert de 30 coups et plus, série de jours). Rappels : faits (notifications locales). Pistes : protection de série via vidéo, classement du jour.
- Plus d'énigmes Casse-tête (relancer `puzzles:search` avec d'autres graines, viser 200 niveaux), packs thématiques.
- ~~Tutoriel plus visuel~~ : fait (main animée sur les niveaux 1-2 de chaque mode). Écran d'accueil : fait.

## 4. Qualité
- Analytique (niveaux abandonnés, durée, taux de vidéos regardées) pour régler la difficulté.
- Équilibrage : tester le chrono et les pièges sur de vrais joueurs ; courbe de difficulté du Casse-tête (derniers niveaux à 46-49 coups très durs).
- Accessibilité : mode daltonien (formes sur les voitures), réduction des animations (déjà gérée).
- Tests automatiques en intégration continue (GitHub Actions : verify + build + e2e).

## 5. Serveur (optionnel)
- Comptes, sauvegarde en ligne, classements, défis entre amis.
