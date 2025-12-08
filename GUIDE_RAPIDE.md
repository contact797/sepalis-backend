# 📖 GUIDE RAPIDE - Où trouver quoi ?

## 🎯 COMMENCEZ PAR ICI

### 1️⃣ **README_PUBLICATION.md** 
📍 Emplacement : `/app/README_PUBLICATION.md`

**C'est le point de départ !** Ce fichier contient :
- ✅ Ce qui a été fait automatiquement
- 📋 Ce qu'il vous reste à faire (checklist)
- ⏱️ Timeline estimée (3-4 semaines)
- 💰 Coûts totaux (124$ la première année)

**👉 À lire en premier pour avoir la vue d'ensemble**

---

## 📚 GUIDES DÉTAILLÉS

### 2️⃣ **GUIDE_PUBLICATION_STORES.md** ⭐ LE PLUS IMPORTANT
📍 Emplacement : `/app/GUIDE_PUBLICATION_STORES.md`

**Guide complet en 9 phases :**
- Phase 1 : Comptes Developer (Apple + Google)
- Phase 2 : Assets graphiques (screenshots, icônes)
- Phase 3 : Configuration EAS Build
- Phase 4 : Build iOS
- Phase 5 : Build Android
- Phase 6 : Soumission iOS (App Store Connect)
- Phase 7 : Soumission Android (Play Console)
- Phase 8 : Configuration RevenueCat (abonnements)
- Phase 9 : Post-lancement (analytics, monitoring)

**📖 C'est votre bible pour la publication !**

Extraits importants :
```
PHASE 1 : Créer comptes Apple Developer (99$/an) et Google Play (25$)
PHASE 2 : Prendre 6-10 screenshots de l'app
PHASE 3 : Installer EAS CLI : npm install -g eas-cli
PHASE 4 : Build iOS : eas build --platform ios
...
```

---

## 📝 DOCUMENTS LÉGAUX (À PERSONNALISER)

### 3️⃣ **POLITIQUE_CONFIDENTIALITE.md**
📍 Emplacement : `/app/POLITIQUE_CONFIDENTIALITE.md`

**Template RGPD complet** à personnaliser :
- Remplacer `[VOTRE ENTREPRISE]` par votre nom de société
- Remplacer `[VOTRE ADRESSE]` par votre adresse postale
- Remplacer `[VOTRE SIRET]` par votre numéro SIRET
- Remplacer `[DATE]` par la date du jour

**⚠️ OBLIGATOIRE pour Apple et Google**
Vous devez publier ce document en ligne à une URL publique (ex: https://votresite.com/privacy)

### 4️⃣ **CGU.md**
📍 Emplacement : `/app/CGU.md`

**Conditions Générales d'Utilisation** à personnaliser :
- Mêmes remplacements que la politique de confidentialité
- Ajouter votre numéro de téléphone support
- Ajouter le nom du médiateur de la consommation

**⚠️ OBLIGATOIRE pour Apple et Google**
Publier en ligne à : https://votresite.com/terms

---

## 📱 TEXTES MARKETING (PRÊTS À COPIER-COLLER)

### 5️⃣ **TEXTES_MARKETING_STORES.md**
📍 Emplacement : `/app/TEXTES_MARKETING_STORES.md`

**Tous les textes sont prêts !** Juste à copier-coller :

**Pour Apple App Store :**
- ✅ Nom de l'app : "Sepalis - Jardin & MOF"
- ✅ Sous-titre : "Conseils jardinage expert"
- ✅ Description complète (4000 caractères)
- ✅ Mots-clés optimisés
- ✅ Notes pour la review

**Pour Google Play Store :**
- ✅ Nom : "Sepalis - Jardin Expert MOF"
- ✅ Description courte
- ✅ Description complète
- ✅ Release notes

**Bonus :**
- 📧 Templates d'emails (bienvenue, fin d'essai)
- 📱 Bio réseaux sociaux
- 💬 Réponses types aux avis (positifs/négatifs)
- 🎬 Script vidéo promo

---

## ⚙️ FICHIERS DE CONFIGURATION

### 6️⃣ **app.json**
📍 Emplacement : `/app/frontend/app.json`

**✅ Déjà configuré avec :**
- Nom : "Sepalis"
- Bundle ID iOS : `com.sepalis.app`
- Package Android : `com.sepalis.app`
- Permissions (caméra, localisation, notifications)

**⚠️ À MODIFIER :**
Une seule chose à changer après `eas build:configure` :
```json
"extra": {
  "eas": {
    "projectId": "VOTRE_PROJECT_ID_ICI"  ← Remplacer par votre vrai ID
  }
}
```

### 7️⃣ **eas.json**
📍 Emplacement : `/app/frontend/eas.json`

**✅ Déjà créé avec :**
- Build profiles (production, preview, development)
- Configuration iOS et Android

**⚠️ À MODIFIER après création des comptes :**
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "votre-email@example.com",     ← Votre Apple ID
      "ascAppId": "1234567890",                  ← App Store Connect ID
      "appleTeamId": "ABCDE12345"                ← Votre Team ID
    }
  }
}
```

---

## 🔍 VÉRIFICATION AUTOMATIQUE

### 8️⃣ **check-publication-ready.sh**
📍 Emplacement : `/app/frontend/check-publication-ready.sh`

**Script de vérification automatique**

Pour vérifier que tout est prêt :
```bash
cd /app/frontend
bash check-publication-ready.sh
```

Ce script vérifie :
- ✅ app.json et eas.json présents et configurés
- ✅ Assets graphiques (icon, splash, notification)
- ✅ Node.js, npm, Expo CLI, EAS CLI installés
- ✅ Documents légaux présents
- ✅ Dépendances package.json

Résultat :
```
✅ Succès: 21
⚠️  Avertissements: 4
❌ Échecs: 0
```

---

## 📂 STRUCTURE COMPLÈTE DES FICHIERS

```
/app/
├── 📖 README_PUBLICATION.md          ← COMMENCEZ ICI (récapitulatif)
├── 📚 GUIDE_PUBLICATION_STORES.md    ← Guide complet 9 phases
├── 📝 TEXTES_MARKETING_STORES.md     ← Textes prêts à copier-coller
├── 📄 POLITIQUE_CONFIDENTIALITE.md   ← À personnaliser et publier en ligne
├── 📄 CGU.md                          ← À personnaliser et publier en ligne
├── 📖 GUIDE_RAPIDE.md                 ← Ce fichier (vous êtes ici)
│
└── frontend/
    ├── app.json                       ← ✅ Configuré (Project ID à ajouter)
    ├── eas.json                       ← ✅ Créé (IDs Apple à ajouter)
    ├── check-publication-ready.sh     ← Script de vérification
    │
    └── assets/images/
        ├── icon.png                   ← ✅ Existe (vérifier taille 1024x1024)
        ├── adaptive-icon.png          ← ✅ Existe
        ├── splash-image.png           ← ✅ Existe
        └── notification-icon.png      ← ⚠️ À CRÉER (96x96, monochrome)
```

---

## 🎯 PLAN D'ACTION SIMPLIFIÉ

### Semaine 1 : PRÉPARATION
1. ✅ Lire `README_PUBLICATION.md`
2. ✅ Créer comptes Apple Developer + Google Play Console
3. ✅ Personnaliser `POLITIQUE_CONFIDENTIALITE.md` et `CGU.md`
4. ✅ Publier docs en ligne (GitHub Pages recommandé)
5. ✅ Créer `notification-icon.png` (96x96)
6. ✅ Prendre 6-10 screenshots de l'app

### Semaine 2 : BUILD
1. ✅ Installer EAS CLI : `npm install -g eas-cli`
2. ✅ Configurer : `eas build:configure` (noter Project ID)
3. ✅ Mettre à jour `app.json` avec Project ID
4. ✅ Build : `eas build --platform ios` puis `--platform android`

### Semaine 3 : SOUMISSION iOS
1. ✅ Créer l'app sur App Store Connect
2. ✅ Uploader screenshots
3. ✅ Copier-coller textes depuis `TEXTES_MARKETING_STORES.md`
4. ✅ Créer produits In-App Purchase (abonnements)
5. ✅ Soumettre pour review

### Semaine 4 : SOUMISSION ANDROID + RevenueCat
1. ✅ Créer l'app sur Play Console
2. ✅ Uploader build + screenshots
3. ✅ Remplir Store Listing
4. ✅ Soumettre pour review
5. ✅ Configurer RevenueCat

---

## 💡 CONSEILS PRATIQUES

### Pour les documents légaux
- **GitHub Pages** est la solution la plus simple (gratuit)
- Créez un repo `sepalis-legal`, mettez-y les .md
- Activez Pages : Settings → Pages → Source: main branch
- URLs générées : `https://votrecompte.github.io/sepalis-legal/POLITIQUE_CONFIDENTIALITE`

### Pour les screenshots
- Utilisez l'app actuelle en ligne : https://daily-garden-1.preview.emergentagent.com
- Outils : Responsively (simuler différentes tailles), Chrome DevTools
- Ajoutez des annotations avec Figma ou Canva pour plus d'impact

### Pour les icônes
- Icon principale : Déjà présente, vérifier qu'elle fait 1024x1024
- Notification icon : Simplifiez l'icon principale en version monochrome blanche

### Première fois avec EAS ?
- Suivez le guide interactif : https://docs.expo.dev/eas/
- EAS s'occupe de tout (certificats, keystore, etc.)
- Gratuit pour usage standard

---

## 🆘 BESOIN D'AIDE ?

### Problème technique ?
1. Consultez `GUIDE_PUBLICATION_STORES.md` (très détaillé)
2. Documentation Expo : https://docs.expo.dev/
3. Discord Expo : https://chat.expo.dev/ (réponse en quelques heures)

### Question sur un fichier ?
- Ouvrez-le et lisez les commentaires
- Tous les emplacements à remplir sont marqués `[...]`

### Bloqué quelque part ?
- Lancez `bash check-publication-ready.sh` pour voir ce qui manque
- Chaque avertissement/erreur est explicite

---

## ✨ RÉCAPITULATIF VISUEL

```
┌─────────────────────────────────────────────────────┐
│  📖 LISEZ D'ABORD                                   │
│  ├─ README_PUBLICATION.md (vue d'ensemble)         │
│  └─ GUIDE_RAPIDE.md (ce fichier)                   │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  📚 SUIVEZ LE GUIDE ÉTAPE PAR ÉTAPE                │
│  └─ GUIDE_PUBLICATION_STORES.md (9 phases)         │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  📝 PERSONNALISEZ LES DOCS LÉGAUX                   │
│  ├─ POLITIQUE_CONFIDENTIALITE.md                   │
│  └─ CGU.md                                          │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  📱 UTILISEZ LES TEXTES PRÊTS                       │
│  └─ TEXTES_MARKETING_STORES.md (copier-coller)     │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  🔍 VÉRIFIEZ QUE TOUT EST PRÊT                      │
│  └─ bash check-publication-ready.sh                 │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  🚀 LANCEZ LES BUILDS                               │
│  └─ eas build --platform all                        │
└─────────────────────────────────────────────────────┘
```

---

**🎉 Votre app est techniquement prête !**

**Timeline** : 3-4 semaines jusqu'à publication
**Coût** : 124$ la première année (99$ Apple + 25$ Google)

**Bon courage ! 🌱**
