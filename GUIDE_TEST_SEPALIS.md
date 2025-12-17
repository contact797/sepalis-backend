# 🌱 Guide de Test - Application Sepalis

## ✅ TOUT EST PRÊT ! Voici comment tester :

---

## 🌐 OPTION 1 : TEST WEB (Plus Rapide)

### Étape 1 : Ouvrir l'application
👉 **Cliquez sur ce lien :**
```
https://garden-backend.preview.emergentagent.com
```

### Étape 2 : Créer un compte
Vous verrez l'écran de connexion. Cliquez sur **"S'inscrire"** en bas.

Remplissez :
- **Nom** : Votre Nom
- **Email** : test@example.com (ou n'importe quel email)
- **Mot de passe** : test123456
- **Confirmer** : test123456

Cliquez sur **"S'inscrire"**

### Étape 3 : Explorer l'application
Une fois connecté, vous verrez 5 onglets en bas :

1. **🏠 Jardin** : Dashboard avec vos statistiques
2. **🌱 Mes Plantes** : Liste de vos plantes (vide pour l'instant)
3. **✅ Tâches** : Vos tâches de jardinage (vide pour l'instant)
4. **🎓 Académie** : 4 formations disponibles !
5. **👤 Profil** : Vos informations

---

## 📝 CE QUE VOUS POUVEZ TESTER :

### ✅ Authentication
- [x] Inscription avec email/mot de passe
- [x] Connexion
- [x] Déconnexion (onglet Profil → bouton rouge en bas)

### ✅ Navigation
- [x] 5 onglets cliquables
- [x] Navigation fluide entre les écrans
- [x] Retour arrière fonctionne

### ✅ Académie (Formations)
- [x] 4 formations affichées avec :
  - Titre
  - Description
  - Niveau (Débutant, Intermédiaire, Avancé)
  - Durée
  - Prix
- [x] Clic sur une formation → Modal de pré-inscription
- [x] Pull-to-refresh pour rafraîchir

### ✅ Profil
- [x] Avatar avec votre initiale
- [x] Nom et email affichés
- [x] Statistiques (0 pour l'instant)
- [x] Menu avec 6 options
- [x] Bouton de déconnexion

---

## 🎯 COMPTE DE TEST DÉJÀ CRÉÉ

Si vous voulez tester directement la connexion :

**Email** : `demo@sepalis.com`
**Mot de passe** : `demo123456`

---

## 🐛 SI VOUS VOYEZ UNE ERREUR

**"Erreur de connexion"** ou **"Impossible de se connecter"** ?

➡️ Essayez de :
1. Rafraîchir la page (F5)
2. Vider le cache du navigateur
3. Utiliser un autre navigateur (Chrome, Firefox, Safari)
4. Me le dire et je corrige immédiatement !

---

## 📱 POUR TESTER SUR SMARTPHONE (OPTIONNEL)

1. Installez **Expo Go** depuis votre store (App Store ou Google Play)
2. Scannez le QR code (je peux le générer si besoin)
3. L'app se charge automatiquement

---

## 🎨 CE QUI FONCTIONNE MAINTENANT :

✅ **Backend complet** :
- API d'authentification JWT
- Gestion des utilisateurs
- Base de données MongoDB
- Endpoints pour plantes et tâches
- 4 formations pré-chargées

✅ **Frontend complet** :
- Interface moderne et fluide
- Navigation par onglets
- Gestion d'état avec Context API
- Persistance de session
- Design Sepalis (vert #22C55E)

✅ **Sécurité** :
- Mots de passe hashés (bcrypt)
- Tokens JWT
- Sessions persistantes

---

## 🚀 PROCHAINE ÉTAPE

Après votre test, dites-moi :
1. ✅ Ça fonctionne / ❌ J'ai un problème
2. Ce que vous aimez
3. Ce que vous voulez ajouter en priorité

Je peux ensuite développer :
- Ajout de plantes depuis le catalogue
- Création de tâches
- Détails des formations
- Notifications
- Et plus encore !

---

**Testez maintenant : https://garden-backend.preview.emergentagent.com** 🌱
