# 🚀 GUIDE COMPLET - Publication Sepalis sur les Stores

## ✅ CE QUI A ÉTÉ FAIT

### Configuration technique
- ✅ `app.json` optimisé avec toutes les permissions et configurations
- ✅ `eas.json` créé pour les builds Expo
- ✅ Politique de confidentialité rédigée (`POLITIQUE_CONFIDENTIALITE.md`)
- ✅ Conditions Générales d'Utilisation rédigées (`CGU.md`)
- ✅ Assets graphiques existants (icon, splash, adaptive-icon)

---

## 📋 CE QU'IL RESTE À FAIRE

### PHASE 1 : PRÉPARATION ADMINISTRATIVE (Semaine 1)

#### 1.1 Créer les comptes développeur

**Apple Developer Program** (obligatoire pour iOS)
- 🔗 https://developer.apple.com/programs/enroll/
- 💰 Coût : 99$ par an
- ⏱️ Délai : 24-48h pour activation
- 📋 Documents nécessaires :
  - Carte d'identité ou passeport
  - Coordonnées bancaires
  - SIRET si entreprise

**Actions à faire :**
1. S'inscrire sur https://developer.apple.com
2. Choisir "Account Holder" (titulaire du compte)
3. Payer 99$/an
4. Attendre validation (email de confirmation)

**Google Play Console** (obligatoire pour Android)
- 🔗 https://play.google.com/console/signup
- 💰 Coût : 25$ (paiement unique)
- ⏱️ Délai : Immédiat
- 📋 Documents nécessaires :
  - Carte d'identité
  - Coordonnées bancaires
  - Informations entreprise

**Actions à faire :**
1. S'inscrire sur https://play.google.com/console
2. Payer 25$ (une seule fois)
3. Remplir le profil développeur

---

#### 1.2 Publier les documents légaux

**OBLIGATOIRE pour Apple et Google :**

Vous devez héberger ces documents sur un site web public :
- `POLITIQUE_CONFIDENTIALITE.md` → URL : https://votresite.com/privacy
- `CGU.md` → URL : https://votresite.com/terms

**Options pour l'hébergement :**

**Option A : GitHub Pages (GRATUIT)**
1. Créer un repo GitHub public
2. Activer GitHub Pages dans Settings
3. Uploader les fichiers .md
4. URLs générées automatiquement

**Option B : Site web existant**
- Créer les pages /privacy et /terms
- Copier-coller le contenu des fichiers MD

**Option C : Services gratuits**
- Notion (public pages)
- Google Sites
- Wix/WordPress (plan gratuit)

**⚠️ IMPORTANT** : Les URLs doivent être actives AVANT la soumission aux stores.

---

#### 1.3 Compléter les documents légaux

**À remplacer dans `POLITIQUE_CONFIDENTIALITE.md` :**
- `[DATE]` → Date actuelle
- `[VOTRE ENTREPRISE]` → Nom de votre société
- `[VOTRE ADRESSE]` → Adresse postale complète
- `[VOTRE SIRET]` → Numéro SIRET
- `[NOM ET CONTACT DPO]` → Si applicable (obligatoire si >250 employés)

**À remplacer dans `CGU.md` :**
- `[DATE]` → Date actuelle
- `[NOM DE VOTRE ENTREPRISE]` → Nom de votre société
- `[ADRESSE]` → Adresse postale
- `[NUMÉRO SIRET]` → Numéro SIRET
- `[VOTRE NUMÉRO]` → Téléphone support
- `[ANNÉE]` → Année en cours
- `[NOM DU MÉDIATEUR]` → Médiateur de la consommation (ex: CM2C)

---

### PHASE 2 : PRÉPARATION GRAPHIQUE (Semaine 1-2)

#### 2.1 Vérifier/améliorer les assets existants

**Assets déjà présents :**
- ✅ icon.png (250KB)
- ✅ adaptive-icon.png (250KB)
- ✅ splash-image.png (116KB)

**À vérifier :**
1. icon.png doit être 1024x1024px
2. Fond transparent ou couleur unie #1A1A1A
3. Design professionnel et reconnaissable

**Si besoin de refaire les assets :**
- Utilisez Figma, Canva ou un designer
- Respectez les dimensions exactes
- Format PNG obligatoire

#### 2.2 Créer l'icône de notification (MANQUANT)

**Fichier à créer :** `/app/frontend/assets/images/notification-icon.png`
- Dimensions : 96x96px
- Format : PNG avec transparence
- Couleur : Monochrome blanc sur transparent
- Style : Simplifié (icône seule, sans texte)

**💡 Astuce** : Extraire l'icône principale et la simplifier en version monochrome.

---

#### 2.3 Captures d'écran pour les stores

**TRÈS IMPORTANT** : Les captures d'écran sont LE facteur clé pour les téléchargements.

**iOS - Dimensions requises :**

| Device | Dimensions | Quantité |
|--------|------------|----------|
| iPhone 6.7" (14 Pro Max) | 1290 x 2796 | 3-10 |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | 3-10 |
| iPad Pro 12.9" | 2048 x 2732 | 2-10 (optionnel) |

**Android - Dimensions requises :**

| Device | Dimensions | Quantité |
|--------|------------|----------|
| Téléphone | 1080 x 1920 minimum | 2-8 |
| Tablette 7" | 1200 x 1920 | 2-8 (optionnel) |
| Tablette 10" | 1600 x 2560 | 2-8 (optionnel) |

**📸 Écrans à capturer (suggestions) :**
1. **Onboarding** : Écran d'accueil avec "Validé par un MOF Paysagiste"
2. **Dashboard** : Page d'accueil avec météo, tâches, zones
3. **Scanner** : Identification de plante en action (avec résultat)
4. **Suggestions** : Modal avec filtres et suggestions personnalisées
5. **Quiz** : Question quotidienne avec badge "1"
6. **Plantes** : Liste des plantes avec badge "Favori"
7. **Zones** : Gestion des zones de jardinage
8. **Académie** : Contenu éducatif

**💡 Outils pour créer de belles captures :**
- Ajoutez des titres/descriptions sur les screenshots
- Utilisez des mockups de téléphones
- Canva a des templates pour App Store screenshots
- Figma avec plugins (Mockuuups, Rotato)

**🎨 Conseils design :**
- Fond cohérent (couleur unie ou dégradé)
- Texte court et percutant
- Montrez l'action, pas juste l'interface
- Mettez en avant "MOF" et "IA"

---

### PHASE 3 : CONFIGURATION DU BUILD (Semaine 2)

#### 3.1 Installer EAS CLI

```bash
npm install -g eas-cli
```

#### 3.2 Se connecter à Expo

```bash
cd /app/frontend
eas login
```

*Utilisez votre compte Expo existant ou créez-en un sur https://expo.dev*

#### 3.3 Configurer le projet EAS

```bash
eas build:configure
```

Cette commande va :
- Créer un `eas.json` (déjà fait ✅)
- Générer un Project ID Expo
- Lier votre projet

**⚠️ IMPORTANT** : Notez le **Project ID** généré.

#### 3.4 Mettre à jour app.json avec le Project ID

Ouvrez `/app/frontend/app.json` et remplacez :
```json
"extra": {
  "eas": {
    "projectId": "VOTRE_PROJECT_ID_ICI"  ← Remplacer par le vrai ID
  }
}
```

---

### PHASE 4 : BUILD iOS (Semaine 2-3)

#### 4.1 Configurer le Bundle Identifier

Dans `app.json`, le bundle ID est déjà configuré :
```json
"ios": {
  "bundleIdentifier": "com.sepalis.app"
}
```

**Étape suivante :** Enregistrer ce Bundle ID sur Apple Developer

1. Aller sur https://developer.apple.com/account/resources/identifiers/list
2. Cliquer "+" pour créer un nouveau identifier
3. Choisir "App IDs"
4. Saisir :
   - Description : Sepalis
   - Bundle ID : `com.sepalis.app` (EXACTEMENT comme dans app.json)
5. Capabilities à activer :
   - Push Notifications
   - Sign in with Apple (si vous utilisez)
6. Sauvegarder

#### 4.2 Créer l'App sur App Store Connect

1. Aller sur https://appstoreconnect.apple.com
2. "My Apps" → "+" → "New App"
3. Remplir :
   - Platform : iOS
   - Name : Sepalis
   - Primary Language : French
   - Bundle ID : com.sepalis.app (sélectionner celui créé avant)
   - SKU : `sepalis-app-2025` (identifiant unique interne)
   - User Access : Full Access
4. Créer

**⚠️ Notez l'ASC App ID** (visible dans l'URL ou dans App Information)

#### 4.3 Mettre à jour eas.json avec les infos Apple

Éditez `/app/frontend/eas.json` :
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "votre-email@example.com",     ← Votre Apple ID
      "ascAppId": "1234567890",                  ← ASC App ID (étape 4.2)
      "appleTeamId": "ABCDE12345"                ← Team ID (https://developer.apple.com/account → Membership)
    }
  }
}
```

#### 4.4 Lancer le build iOS

```bash
cd /app/frontend
eas build --platform ios --profile production
```

⏱️ **Durée** : 15-30 minutes

**Ce qui se passe :**
- EAS compile votre app sur un serveur cloud
- Génère un fichier .ipa (installable iOS)
- Vous recevez un lien de téléchargement

**⚠️ Identifiants Apple** : EAS vous demandera vos identifiants Apple Developer la première fois (stockés de manière sécurisée).

---

### PHASE 5 : BUILD ANDROID (Semaine 2-3)

#### 5.1 Créer une clé de signature (Keystore)

**Option A : Laisser EAS gérer (RECOMMANDÉ)**
```bash
eas build --platform android --profile production
```
EAS créera automatiquement un keystore sécurisé.

**Option B : Créer manuellement**
```bash
keytool -genkeypair -v -keystore sepalis-release.keystore -alias sepalis -keyalg RSA -keysize 2048 -validity 10000
```

*Notez précieusement le mot de passe ! Sans lui, impossible de mettre à jour l'app.*

#### 5.2 Lancer le build Android

```bash
cd /app/frontend
eas build --platform android --profile production
```

⏱️ **Durée** : 10-20 minutes

**Résultat** : Fichier `.aab` (Android App Bundle)

---

### PHASE 6 : SOUMISSION iOS (Semaine 3)

#### 6.1 Upload via EAS

```bash
eas submit --platform ios --latest
```

Cette commande :
- Télécharge le dernier build iOS
- L'envoie à App Store Connect
- Configure automatiquement

**OU manuellement via Transporter :**
1. Télécharger Transporter (App Store sur Mac)
2. Télécharger le .ipa depuis EAS
3. Glisser-déposer dans Transporter
4. Attendre l'upload

#### 6.2 Compléter les informations sur App Store Connect

**Onglet "App Information" :**
- Subtitle (30 chars) : `Conseils jardinage expert`
- Category : Primary = Lifestyle, Secondary = Education
- Content Rights : "No, it does not contain third-party content"

**Onglet "Prepare for Submission" → Version 1.0 :**

**Screenshots** (étape 2.3) :
- Uploader les 3-10 captures par taille d'écran

**Promotional Text** (170 chars) :
```
Transformez votre jardin avec l'expertise d'un MOF Paysagiste. Identification IA, conseils personnalisés, quiz quotidien. 🌱
```

**Description** (4000 chars) :
*Copier-coller la description préparée dans le guide précédent (section textes marketing)*

**Keywords** (100 chars) :
```
jardin,jardinage,plantes,MOF,paysagiste,potager,expert,IA,météo,fleurs
```

**Support URL** :
```
https://votresite.com/support
```

**Marketing URL** (optionnel) :
```
https://votresite.com
```

**Privacy Policy URL** :
```
https://votresite.com/privacy
```

**App Review Information** :
- First Name : [Votre prénom]
- Last Name : [Votre nom]
- Phone : [Votre téléphone]
- Email : contact@sepalis.com
- **Demo Account** (CRITIQUE) :
  - Username : demo@sepalis.com
  - Password : DemoSepalis2025!
  - **⚠️ Créez ce compte dans votre app avec des données de test**

**Notes for Review** :
```
Bonjour,

Sepalis est une application d'assistance au jardinage combinant IA (GPT-4) et expertise d'un Meilleur Ouvrier de France Paysagiste.

Fonctionnalités principales :
- Identification de plantes par photo (caméra requise)
- Diagnostic des maladies
- Suggestions personnalisées de plantes
- Météo locale (localisation requise)
- Quiz quotidien avec notifications

Compte de test fourni avec zones, plantes et historique pré-remplis.

L'abonnement est géré via Apple In-App Purchase (essai 7 jours puis 5.99€/mois ou 59€/an).

Merci pour votre review !
```

**Age Rating** :
- Cliquer "Edit" et répondre au questionnaire
- Réponses attendues : Tout "None" ou "Infrequent/Mild"
- Rating final : 4+

#### 6.3 Configurer l'abonnement (In-App Purchase)

**Étape 1 : Créer les produits d'abonnement**

1. App Store Connect → Votre app → "Subscriptions"
2. Créer un "Subscription Group" :
   - Name : Sepalis Premium
3. Ajouter les abonnements :

**Abonnement Mensuel :**
- Reference Name : Sepalis Premium Monthly
- Product ID : `com.sepalis.app.premium.monthly`
- Duration : 1 month
- Price : 5.99€
- Localization (French) :
  - Display Name : Sepalis Premium Mensuel
  - Description : Accès complet aux fonctionnalités Sepalis

**Abonnement Annuel :**
- Reference Name : Sepalis Premium Annual
- Product ID : `com.sepalis.app.premium.annual`
- Duration : 1 year
- Price : 59.00€
- Localization (French) :
  - Display Name : Sepalis Premium Annuel
  - Description : Accès complet aux fonctionnalités Sepalis (économisez 17%)

**Essai gratuit (7 jours) :**
- Activer "Introductory Offer"
- Type : Free Trial
- Duration : 7 days

4. Sauvegarder et soumettre pour review

#### 6.4 Soumettre pour review

1. Tout vérifier une dernière fois
2. Cliquer "Submit for Review"
3. Répondre aux dernières questions (Export Compliance : généralement "No")
4. Confirmer

⏱️ **Délai de review** : 24-48h en moyenne

**Statuts possibles :**
- 🟡 "Waiting for Review" : En attente
- 🟠 "In Review" : En cours d'examen (1-24h)
- 🟢 "Ready for Sale" : APPROUVÉ ! 🎉
- 🔴 "Rejected" : Refusé (ils expliquent pourquoi)

---

### PHASE 7 : SOUMISSION ANDROID (Semaine 3-4)

#### 7.1 Créer l'app sur Google Play Console

1. https://play.google.com/console
2. "Create app"
3. Remplir :
   - App name : Sepalis
   - Default language : French (France)
   - App or game : App
   - Free or paid : Free (avec achats in-app)
4. Accepter les déclarations
5. Créer

#### 7.2 Uploader le build

**Via EAS (recommandé) :**
```bash
eas submit --platform android --latest
```

**Manuellement :**
1. Play Console → Votre app → "Release" → "Production"
2. "Create new release"
3. Uploader le .aab
4. Release name : `1.0.0`
5. Release notes (French) :
```
🌱 Première version de Sepalis !

✨ Fonctionnalités :
- Identification de plantes par IA
- Diagnostic des maladies
- Suggestions personnalisées MOF
- Quiz quotidien
- Gestion de zones
- Météo locale

Transformez votre jardin avec l'expertise d'un Meilleur Ouvrier de France !
```

#### 7.3 Remplir le Store Listing

**Onglet "Store presence" → "Main store listing" :**

**App details :**
- Short description (80 chars) :
```
Assistant jardinage IA validé par un Meilleur Ouvrier de France Paysagiste
```

- Full description (4000 chars) :
*Utiliser la description préparée (même que iOS)*

**Graphics :**
- Icon : 512x512 (sera généré depuis votre icon.png)
- Feature graphic : 1024x500 (bannière en haut)
  - Créer un visuel avec logo + slogan
- Phone screenshots : 2-8 images (étape 2.3)
- Tablet screenshots : optionnel

**Categorization :**
- App category : Lifestyle
- Tags : Gardening, Plants, Education

**Contact details :**
- Email : contact@sepalis.com
- Phone : [optionnel]
- Website : https://votresite.com

**Privacy policy :**
- URL : https://votresite.com/privacy

#### 7.4 Remplir "App content"

**🔒 Privacy & security :**
1. "Privacy policy" → URL déjà renseigné
2. "Data safety" :
   - Cliquer "Start"
   - Répondre au questionnaire (basé sur votre politique de confidentialité)
   - Données collectées :
     - Email address : Oui (Account management)
     - Photos : Oui (App functionality) - Non stockées
     - Approximate location : Oui (App functionality - météo)
   - Data usage : Functionality, Analytics
   - All data encrypted in transit : Oui
   - Users can request data deletion : Oui
3. Sauvegarder

**📱 Target audience & content :**
- Target age : 13+ (ou 3+ si adapté)
- Content rating :
  - Remplir le questionnaire IARC
  - Réponses attendues : Tout "No" → Rating PEGI 3

**📰 News apps :** Non

**📊 COVID-19 contact tracing :** Non

**📢 Ads :** Non (si pas de pubs)

**🎮 App access :** Provide demo account
- Username : demo@sepalis.com
- Password : DemoSepalis2025!

#### 7.5 Configurer l'abonnement (Google Play Billing)

1. Play Console → Votre app → "Monetize" → "Subscriptions"
2. "Create subscription" :

**Abonnement Mensuel :**
- Product ID : `com.sepalis.app.premium.monthly`
- Name : Sepalis Premium Mensuel
- Description : Accès complet aux fonctionnalités Sepalis
- Billing period : Monthly (1 month)
- Price : 5.99€
- Free trial : 7 days
- Grace period : 3 days
- Active

**Abonnement Annuel :**
- Product ID : `com.sepalis.app.premium.annual`
- Name : Sepalis Premium Annuel
- Description : Accès complet (économisez 17%)
- Billing period : Yearly (1 year)
- Price : 59.00€
- Free trial : 7 days
- Grace period : 3 days
- Active

#### 7.6 Soumettre pour review

1. Retour à "Release" → "Production"
2. "Review release"
3. Vérifier que tout est complété (icônes vertes)
4. "Start rollout to Production"

⏱️ **Délai** : Quelques heures à 7 jours (variable)

---

### PHASE 8 : CONFIGURATION REVENUECAT (Semaine 3-4)

RevenueCat simplifie la gestion des abonnements cross-platform.

#### 8.1 Créer un compte RevenueCat

1. https://www.revenuecat.com/
2. Sign up gratuitement (jusqu'à 10k$ de revenus/mois)
3. "Create new project" : Sepalis

#### 8.2 Configurer iOS

1. RevenueCat Dashboard → Sepalis → "Configure"
2. "Add App" → iOS
3. Remplir :
   - App Name : Sepalis iOS
   - Bundle ID : `com.sepalis.app`
   - Shared Secret : (récupérer depuis App Store Connect → Users and Access → Keys → In-App Purchase → Generate Shared Secret)
4. Sauvegarder

#### 8.3 Configurer Android

1. "Add App" → Android
2. Remplir :
   - App Name : Sepalis Android
   - Package Name : `com.sepalis.app`
   - Service Account JSON : 
     - Créer un service account sur Google Cloud Console
     - Télécharger le JSON
     - Uploader dans RevenueCat

#### 8.4 Créer les produits dans RevenueCat

1. "Products" → "Add Product"
2. Créer les 2 produits :
   - Identifier : `premium_monthly`
     - iOS Product ID : `com.sepalis.app.premium.monthly`
     - Android Product ID : `com.sepalis.app.premium.monthly`
   - Identifier : `premium_annual`
     - iOS Product ID : `com.sepalis.app.premium.annual`
     - Android Product ID : `com.sepalis.app.premium.annual`

#### 8.5 Créer une "Offering"

1. "Offerings" → "Add Offering"
2. Identifier : `default`
3. Ajouter les 2 produits créés
4. Package types :
   - `premium_monthly` → Package : Monthly
   - `premium_annual` → Package : Annual
5. Set as current offering

#### 8.6 Configurer le Webhook (déjà fait dans votre backend)

1. RevenueCat → Settings → Integrations → Webhooks
2. Add Webhook :
   - URL : `https://votre-backend.com/api/revenuecat-webhook`
   - Authorization Header : `Bearer votre-secret-token`
3. Events à activer :
   - INITIAL_PURCHASE
   - RENEWAL
   - CANCELLATION
   - EXPIRATION

---

### PHASE 9 : POST-LANCEMENT (Semaine 4+)

#### 9.1 Monitoring

**Analytics à suivre :**
- Téléchargements (App Store Connect / Play Console)
- Crashs (Expo + Sentry recommandé)
- Utilisateurs actifs
- Taux de conversion essai → payant
- Taux de rétention J1, J7, J30

**Outils recommandés :**
```bash
# Installer Sentry pour crash reporting
npx expo install @sentry/react-native

# Installer analytics
npx expo install @react-native-firebase/analytics
```

#### 9.2 Répondre aux avis

**Crucial pour le référencement :**
- Répondez à TOUS les avis (bons et mauvais)
- Dans les 24h si possible
- Soyez professionnel et empathique
- Remerciez les retours positifs
- Proposez des solutions pour les négatifs

#### 9.3 Mises à jour régulières

**Calendrier suggéré :**
- **Hotfixes critiques** : Sous 48h
- **Bugfixes mineurs** : Toutes les 2 semaines
- **Nouvelles features** : Tous les 2-3 mois
- **Contenu** : Nouvelles questions quiz chaque semaine

**Versioning :**
- 1.0.0 → Publication initiale
- 1.0.1 → Correction bug mineur
- 1.1.0 → Nouvelle fonctionnalité
- 2.0.0 → Refonte majeure

**Process de mise à jour :**
```bash
# 1. Incrémenter la version
# Dans app.json : "version": "1.0.1"
# iOS : "buildNumber": "2"
# Android : "versionCode": 2

# 2. Build
eas build --platform all --profile production

# 3. Submit
eas submit --platform all --latest
```

#### 9.4 ASO (App Store Optimization)

**Améliorer le référencement :**
- **Titre** : Inclure mots-clés principaux
- **Keywords** : Tester et ajuster régulièrement
- **Screenshots** : A/B tester différentes versions
- **Icône** : Test de reconnaissabilité
- **Vidéo promo** : Ajouter après le lancement

**Outils ASO :**
- App Radar (analyse keywords)
- Sensor Tower (analyse concurrence)
- AppTweak (suivi rankings)

---

## 📝 CHECKLIST FINALE PRÉ-SOUMISSION

### Documents
- [ ] Politique de confidentialité en ligne
- [ ] CGU en ligne
- [ ] URLs testées et accessibles

### Comptes
- [ ] Apple Developer actif (99$/an payé)
- [ ] Google Play Console actif (25$ payé)
- [ ] Expo account créé
- [ ] RevenueCat configuré

### Configuration
- [ ] app.json complété avec vos infos
- [ ] eas.json complété avec vos IDs
- [ ] Bundle ID enregistré sur Apple
- [ ] Package name unique pour Android

### Assets
- [ ] Icon 1024x1024
- [ ] Splash screen 2048x2048
- [ ] Notification icon 96x96
- [ ] 6-10 screenshots iOS (plusieurs tailles)
- [ ] 2-8 screenshots Android
- [ ] Feature graphic Android 1024x500

### Produits In-App
- [ ] Abonnements créés sur App Store Connect
- [ ] Abonnements créés sur Play Console
- [ ] Produits liés dans RevenueCat

### Tests
- [ ] App testée sur iPhone réel
- [ ] App testée sur Android réel
- [ ] Toutes les fonctionnalités OK
- [ ] Pas de crash
- [ ] Compte démo créé avec données

### Marketing
- [ ] Description rédigée (FR + EN si international)
- [ ] Keywords choisis
- [ ] Textes promotionnels prêts

---

## 🆘 RESSOURCES ET SUPPORT

### Documentation officielle
- 📖 Expo EAS : https://docs.expo.dev/eas/
- 🍎 Apple Review Guidelines : https://developer.apple.com/app-store/review/guidelines/
- 🤖 Google Play Policies : https://play.google.com/about/developer-content-policy/
- 💰 RevenueCat Docs : https://docs.revenuecat.com/

### Communautés
- 💬 Expo Discord : https://chat.expo.dev/
- 🗣️ Reddit : r/reactnative, r/ExpoJS
- 📧 Support Expo : support@expo.dev

### Délais moyens
- Apple Review : 24-48h (peut aller jusqu'à 7 jours)
- Google Review : 2-7 jours (parfois quelques heures)
- Build EAS : 10-30 minutes

### Coûts récurrents
- 💰 Apple Developer : 99$/an
- 💰 Google Play : 25$ (une fois)
- 💰 Hébergement backend : selon votre config
- 💰 OpenAI API : selon usage
- 💰 RevenueCat : Gratuit jusqu'à 10k$/mois

---

## ✅ PROCHAINES ÉTAPES IMMÉDIATES

1. **Créer les comptes Developer (Apple + Google)**
2. **Publier les documents légaux sur un site web**
3. **Créer/vérifier les assets graphiques**
4. **Prendre les screenshots dans l'app actuelle**
5. **Installer EAS CLI et configurer le projet**

**Temps estimé total** : 3-4 semaines de la préparation à la publication.

---

**Besoin d'aide ? Contactez-moi ou consultez la documentation !**

Bon courage pour le lancement ! 🚀🌱
