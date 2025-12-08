# 📦 PRÉPARATION PUBLICATION SEPALIS - RÉCAPITULATIF

## ✅ CE QUI A ÉTÉ CONFIGURÉ AUTOMATIQUEMENT

### 1. Configuration technique
- **`/app/frontend/app.json`** ✅
  - Nom de l'app : "Sepalis"
  - Bundle ID iOS : `com.sepalis.app`
  - Package Android : `com.sepalis.app`
  - Permissions configurées (caméra, localisation, notifications)
  - Messages de permission personnalisés
  - Configuration splash screen et icônes

- **`/app/frontend/eas.json`** ✅
  - Profiles de build (development, preview, production)
  - Configuration iOS et Android
  - Settings de soumission aux stores

### 2. Documents légaux (templates)
- **`/app/POLITIQUE_CONFIDENTIALITE.md`** ✅
  - Conforme RGPD
  - Détaille toutes les données collectées
  - Explique les droits des utilisateurs
  - À personnaliser avec vos informations

- **`/app/CGU.md`** ✅
  - Conditions générales d'utilisation
  - Détails sur les abonnements
  - Responsabilités et limitations
  - À personnaliser avec vos informations

### 3. Guides complets
- **`/app/GUIDE_PUBLICATION_STORES.md`** ✅
  - Guide étape par étape complet (9 phases)
  - Tutoriels détaillés pour iOS et Android
  - Configuration EAS Build
  - Configuration RevenueCat
  - Checklist finale pré-soumission

- **`/app/TEXTES_MARKETING_STORES.md`** ✅
  - Tous les textes prêts à copier-coller
  - Descriptions App Store et Play Store
  - Mots-clés optimisés
  - Templates emails et réseaux sociaux
  - Réponses types aux avis

---

## 📋 CE QU'IL VOUS RESTE À FAIRE

### ACTIONS PRIORITAIRES (Cette semaine)

#### 1. Créer les comptes Developer
- [ ] Apple Developer Program (99$/an) : https://developer.apple.com/programs/enroll/
- [ ] Google Play Console (25$ une fois) : https://play.google.com/console/signup
- ⏱️ **Durée** : 30 min + attente activation (24-48h pour Apple)

#### 2. Personnaliser les documents légaux
Ouvrir et compléter :
- [ ] `/app/POLITIQUE_CONFIDENTIALITE.md`
  - Remplacer `[DATE]`
  - Remplacer `[VOTRE ENTREPRISE]`
  - Remplacer `[VOTRE ADRESSE]`
  - Remplacer `[VOTRE SIRET]`
  
- [ ] `/app/CGU.md`
  - Mêmes informations à remplacer
  - Ajouter numéro de téléphone support

#### 3. Publier les documents sur un site web
Vous **DEVEZ** avoir des URLs publiques pour :
- Politique de confidentialité : https://votresite.com/privacy
- CGU : https://votresite.com/terms

**Options :**
- GitHub Pages (gratuit)
- Votre site web existant
- Notion (pages publiques)
- Google Sites

#### 4. Créer/vérifier les assets graphiques
Assets existants à vérifier :
- [ ] `/app/frontend/assets/images/icon.png` (doit être 1024x1024)
- [ ] `/app/frontend/assets/images/adaptive-icon.png` (1024x1024)
- [ ] `/app/frontend/assets/images/splash-image.png` (2048x2048)

Asset manquant à créer :
- [ ] `/app/frontend/assets/images/notification-icon.png` (96x96, monochrome blanc)

#### 5. Capturer les screenshots
Vous devez prendre 6-10 screenshots de l'app sur :
- iPhone 14 Pro Max (1290 x 2796)
- iPhone 11 Pro Max (1242 x 2688)
- Android (1080 x 1920 minimum)

**Écrans suggérés :**
1. Onboarding / Écran d'accueil
2. Dashboard (météo + tâches)
3. Scanner de plantes
4. Suggestions MOF avec filtres
5. Quiz quotidien
6. Liste plantes avec badge Favori

---

### ACTIONS TECHNIQUES (Semaine 2-3)

#### 6. Configuration EAS Build
```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter
cd /app/frontend
eas login

# Configurer
eas build:configure

# Noter le Project ID généré et le mettre dans app.json
```

#### 7. Mettre à jour app.json avec votre Project ID
```json
"extra": {
  "eas": {
    "projectId": "REMPLACER_PAR_VOTRE_PROJECT_ID"
  }
}
```

#### 8. Mettre à jour eas.json avec vos infos
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "votre-email@example.com",
      "ascAppId": "VOTRE_ASC_APP_ID",
      "appleTeamId": "VOTRE_TEAM_ID"
    }
  }
}
```

#### 9. Lancer les builds
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

---

### ACTIONS STORES (Semaine 3-4)

#### 10. Configuration App Store Connect (iOS)
- [ ] Créer l'app sur https://appstoreconnect.apple.com
- [ ] Uploader les screenshots
- [ ] Remplir les descriptions (voir `TEXTES_MARKETING_STORES.md`)
- [ ] Créer les produits In-App Purchase (abonnements)
- [ ] Créer un compte démo pour review
- [ ] Soumettre pour review

#### 11. Configuration Google Play Console (Android)
- [ ] Créer l'app sur https://play.google.com/console
- [ ] Uploader le build APK/AAB
- [ ] Remplir le Store Listing
- [ ] Compléter "App content" (questionnaire données)
- [ ] Créer les abonnements
- [ ] Soumettre pour review

#### 12. Configuration RevenueCat (optionnel mais recommandé)
- [ ] Créer compte sur https://www.revenuecat.com/
- [ ] Connecter iOS (Shared Secret)
- [ ] Connecter Android (Service Account JSON)
- [ ] Créer les produits et offerings
- [ ] Configurer le webhook vers votre backend

---

## 📚 DOCUMENTATION DISPONIBLE

Tous les guides sont dans le dossier `/app/` :

| Fichier | Description |
|---------|-------------|
| `GUIDE_PUBLICATION_STORES.md` | Guide complet étape par étape |
| `POLITIQUE_CONFIDENTIALITE.md` | Template politique de confidentialité RGPD |
| `CGU.md` | Template conditions générales |
| `TEXTES_MARKETING_STORES.md` | Tous les textes marketing prêts |
| `README_PUBLICATION.md` | Ce fichier (récapitulatif) |

---

## ⏱️ TIMELINE ESTIMÉE

| Phase | Durée | Tâches |
|-------|-------|--------|
| **Semaine 1** | 5-10h | Comptes Developer, Documents légaux, Assets |
| **Semaine 2** | 3-5h | EAS Config, Builds, Screenshots |
| **Semaine 3** | 5-8h | Soumission iOS, Configuration Store |
| **Semaine 4** | 3-5h | Soumission Android, RevenueCat |
| **Attente review** | 2-7 jours | Apple: 1-2j, Google: 2-7j |

**Total** : 3-4 semaines de la préparation à la publication

---

## 💰 COÛTS TOTAUX

| Item | Coût | Fréquence |
|------|------|-----------|
| Apple Developer | 99$ | Annuel |
| Google Play Console | 25$ | Une fois |
| EAS Build (Expo) | Gratuit | - |
| RevenueCat | Gratuit | Jusqu'à 10k$/mois |
| Hébergement docs | Gratuit* | - |
| **TOTAL ANNÉE 1** | **124$** | - |
| **TOTAL ANNÉES SUIVANTES** | **99$/an** | - |

*Si utilisation GitHub Pages ou équivalent gratuit

---

## ✅ CHECKLIST RAPIDE

Avant de commencer :
- [ ] J'ai lu le `GUIDE_PUBLICATION_STORES.md`
- [ ] J'ai mes informations d'entreprise (SIRET, adresse, etc.)
- [ ] J'ai une carte bancaire pour payer les comptes Developer
- [ ] J'ai un site web pour héberger les docs légaux (ou je vais utiliser GitHub Pages)

Phase 1 - Administrative :
- [ ] Comptes Developer créés
- [ ] Documents légaux personnalisés et en ligne
- [ ] Assets graphiques prêts

Phase 2 - Technique :
- [ ] EAS CLI installé
- [ ] Builds iOS et Android réussis
- [ ] Screenshots capturés

Phase 3 - Soumission :
- [ ] App Store Connect configuré
- [ ] Play Console configuré
- [ ] Apps soumises pour review

Phase 4 - Post-lancement :
- [ ] RevenueCat configuré
- [ ] Analytics en place
- [ ] Plan de réponse aux avis

---

## 🆘 BESOIN D'AIDE ?

### Ressources officielles
- 📖 Expo : https://docs.expo.dev/eas/
- 🍎 Apple : https://developer.apple.com/support/
- 🤖 Google : https://support.google.com/googleplay/android-developer/

### Communautés
- 💬 Expo Discord : https://chat.expo.dev/
- 🗣️ Reddit : r/reactnative, r/ExpoJS

### Support direct
Si vous rencontrez un blocage :
1. Consultez le `GUIDE_PUBLICATION_STORES.md` (très détaillé)
2. Recherchez l'erreur sur Google + Stack Overflow
3. Demandez sur Discord Expo (communauté très réactive)

---

## 🚀 PRÊT À LANCER ?

Votre application **Sepalis** est techniquement prête pour la publication ! 

**Prochaine étape :** Suivez le `GUIDE_PUBLICATION_STORES.md` phase par phase.

**Conseil** : Ne vous précipitez pas. Prenez le temps de bien configurer chaque étape. Une app bien préparée = review plus rapide et moins de rejets.

Bon courage pour le lancement ! 🌱✨

---

*Dernière mise à jour : Décembre 2024*
