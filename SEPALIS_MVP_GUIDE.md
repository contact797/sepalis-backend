# 🌱 Sepalis Mobile - MVP Guide

## 📱 Application Mobile Créée

Une application mobile native complète pour Sepalis avec **React Native / Expo**.

## ✅ Fonctionnalités Implémentées (Phase 1 - MVP)

### 1. **Authentication** 
- ✅ Splash screen avec redirection automatique
- ✅ Écran de connexion (email + mot de passe)
- ✅ Écran d'inscription (nom, email, mot de passe)
- ✅ Gestion JWT tokens avec AsyncStorage
- ✅ Protection des routes (AuthContext)
- ✅ Persistance de session

### 2. **Navigation Bottom Tabs**
5 onglets principaux :

#### **Tab 1 - Jardin (Dashboard)**
- Dashboard avec salutation personnalisée
- 3 cartes de statistiques (Plantes, Tâches du jour, Arrosages)
- Section "Tâches du jour" avec liste des tâches en attente
- Conseils saisonniers
- Plantes nécessitant attention
- Pull-to-refresh

#### **Tab 2 - Mes Plantes**
- Liste des plantes de l'utilisateur
- Affichage avec image, nom scientifique, fréquence d'arrosage
- Bouton FAB pour ajouter une plante
- Long press pour supprimer une plante
- État vide avec message d'encouragement
- Pull-to-refresh

#### **Tab 3 - Tâches**
- Filtres : À faire / Terminées / Toutes
- Liste des tâches avec icônes selon le type (arrosage, fertilisation, etc.)
- Checkbox pour marquer comme complétée
- Détails : titre, description, plante associée, date d'échéance
- Bouton FAB pour créer une tâche
- Swipe/button pour supprimer
- Pull-to-refresh

#### **Tab 4 - Académie**
- Liste des 4 formations disponibles
- Cards avec image, titre, description, durée, prix
- Badge de niveau (Débutant, Intermédiaire, etc.)
- Bouton de pré-inscription
- Section "Ateliers pratiques 2026"
- Pull-to-refresh

#### **Tab 5 - Profil**
- Avatar avec initiale
- Nom et email de l'utilisateur
- Statistiques : nombre de plantes, tâches, formations
- Menu avec 6 options :
  - Informations personnelles
  - Mon abonnement (badge "Gratuit")
  - Notifications
  - Paramètres
  - Aide et support
  - À propos
- Bouton de déconnexion
- Version de l'app

### 3. **Connexion API Backend**
- ✅ URL Backend : `https://sepalis-mobile-1.preview.emergentagent.com/api`
- ✅ Axios configuré avec intercepteurs JWT
- ✅ Gestion automatique des tokens
- ✅ Refresh automatique en cas d'expiration
- ✅ Services API pour :
  - Authentication (`/api/auth/*`)
  - Plantes (`/api/plants`, `/api/user/plants`)
  - Tâches (`/api/user/tasks`)
  - Formations (`/api/courses`)
  - Ateliers (`/api/workshops`)
  - Abonnements (`/api/subscription/*`)

### 4. **Design & UX**
- ✅ Charte graphique Sepalis respectée
  - Vert primaire: #22C55E
  - Vert foncé: #16A34A
  - Gris foncé: #111827
- ✅ Interface moderne avec cards et ombres
- ✅ Icônes Ionicons (cohérent iOS/Android)
- ✅ Boutons arrondis et tactiles
- ✅ Animations et transitions fluides
- ✅ Pull-to-refresh sur toutes les listes
- ✅ États vides avec messages encourageants
- ✅ Loading states avec ActivityIndicator
- ✅ Gestion du clavier (KeyboardAvoidingView)
- ✅ Safe Area pour iOS

## 📦 Structure du Projet

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Bottom tabs navigation
│   │   ├── index.tsx          # Dashboard Jardin
│   │   ├── plants.tsx         # Mes Plantes
│   │   ├── tasks.tsx          # Tâches
│   │   ├── academy.tsx        # Académie
│   │   └── profile.tsx        # Profil
│   ├── _layout.tsx            # Root layout avec AuthProvider
│   └── index.tsx              # Splash screen
├── contexts/
│   └── AuthContext.tsx        # Context d'authentification
├── services/
│   └── api.ts                 # Services API avec Axios
└── constants/
    └── Colors.ts              # Palette de couleurs

```

## 🔧 Technologies Utilisées

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router + React Navigation Bottom Tabs
- **State Management**: React Context API
- **HTTP Client**: Axios avec intercepteurs
- **Storage**: AsyncStorage
- **Icons**: Expo Vector Icons (Ionicons)
- **TypeScript**: Full type safety

## 🚀 Comment Tester l'Application

### Option 1 : Expo Go (Recommandé pour le test)
1. Installez **Expo Go** sur votre smartphone :
   - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)
   - [Android (Play Store)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scannez le QR code affiché dans les logs Expo
3. L'application se chargera automatiquement

### Option 2 : Aperçu Web
1. Accédez à l'URL fournie dans les logs (http://localhost:3000)
2. Version web de l'app (fonctionnalités limitées)

## 📋 Prochaines Étapes

### Phase 2 - Notifications Push
- Intégration Expo Notifications
- Rappels d'arrosage
- Notifications de tâches
- Alertes météo

### Phase 3 - Monétisation
- Intégration Stripe React Native SDK
- Écran d'abonnement Premium (9,99€/mois)
- Paiement des formations (39-49€)
- Réservation des ateliers (35€)

### Phase 4 - Publication
- Génération APK/AAB pour Android
- Build iOS avec EAS Build
- Assets Play Store (icônes, screenshots)
- Soumission Google Play Store

## 🎨 Fonctionnalités Planifiées (Phase 2+)

- [ ] Ajouter une plante depuis le catalogue (500+ plantes)
- [ ] Créer des tâches manuellement
- [ ] Détail d'une plante avec historique
- [ ] Détail d'une formation avec vidéos
- [ ] Calendrier des ateliers pratiques
- [ ] Page de détail pour chaque formation
- [ ] Recherche de plantes
- [ ] Filtres avancés
- [ ] Mode hors ligne
- [ ] Synchronisation automatique
- [ ] Notifications push

## 💰 Estimation Budget Phase 1

- Structure + Auth + Navigation : ~10 crédits
- 5 écrans principaux : ~15 crédits
- Intégration API : ~10 crédits
- Design + UX : ~10 crédits
- Tests + Debugging : ~5 crédits

**Total Phase 1 : ~50 crédits** ✅

## 🐛 Known Issues / Limitations

- Les fonctionnalités "Ajouter plante" et "Créer tâche" affichent une alerte (à implémenter en Phase 2)
- Les détails des formations ne sont pas encore cliquables
- Pas de notifications push pour le moment
- Version web limitée (certaines fonctionnalités native uniquement)

## 📞 Support

Pour toute question ou problème :
- Backend API : https://sepalis-mobile-1.preview.emergentagent.com/api
- Test endpoint : `GET /api/` → `{"message": "Hello World"}`

---

🌱 **Sepalis Mobile MVP - Votre jardin dans votre poche !**
