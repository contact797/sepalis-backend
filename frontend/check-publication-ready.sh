#!/bin/bash

# Script de vérification avant publication Sepalis
# Usage: bash check-publication-ready.sh

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║       🔍 VÉRIFICATION DE PRÉPARATION POUR LA PUBLICATION            ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS_COUNT=0
FAIL_COUNT=0
WARNING_COUNT=0

function check_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((SUCCESS_COUNT++))
}

function check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAIL_COUNT++))
}

function check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNING_COUNT++))
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. VÉRIFICATION DES FICHIERS DE CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier app.json
if [ -f "app.json" ]; then
    check_success "app.json existe"
    
    # Vérifier le nom
    if grep -q '"name": "Sepalis"' app.json; then
        check_success "Nom de l'app: Sepalis"
    else
        check_fail "Nom de l'app incorrect (devrait être 'Sepalis')"
    fi
    
    # Vérifier bundle ID
    if grep -q '"bundleIdentifier": "com.sepalis.app"' app.json; then
        check_success "Bundle ID iOS configuré"
    else
        check_fail "Bundle ID iOS manquant ou incorrect"
    fi
    
    # Vérifier package Android
    if grep -q '"package": "com.sepalis.app"' app.json; then
        check_success "Package Android configuré"
    else
        check_fail "Package Android manquant ou incorrect"
    fi
    
    # Vérifier Project ID
    if grep -q '"projectId":' app.json; then
        if grep -q '"projectId": "VOTRE_PROJECT_ID_ICI"' app.json; then
            check_warning "Project ID à configurer (remplacer VOTRE_PROJECT_ID_ICI)"
        else
            check_success "Project ID configuré"
        fi
    else
        check_fail "Project ID manquant dans extra.eas"
    fi
else
    check_fail "app.json manquant"
fi

# Vérifier eas.json
if [ -f "eas.json" ]; then
    check_success "eas.json existe"
else
    check_fail "eas.json manquant"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. VÉRIFICATION DES ASSETS GRAPHIQUES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier les assets
if [ -f "assets/images/icon.png" ]; then
    check_success "Icon principal existe"
    # Vérifier la taille (devrait être 1024x1024)
    if command -v identify &> /dev/null; then
        size=$(identify -format "%wx%h" assets/images/icon.png)
        if [ "$size" = "1024x1024" ]; then
            check_success "Icon principal: taille correcte (1024x1024)"
        else
            check_warning "Icon principal: taille actuelle $size (recommandé: 1024x1024)"
        fi
    fi
else
    check_fail "Icon principal manquant (assets/images/icon.png)"
fi

if [ -f "assets/images/adaptive-icon.png" ]; then
    check_success "Adaptive icon Android existe"
else
    check_warning "Adaptive icon Android manquant (assets/images/adaptive-icon.png)"
fi

if [ -f "assets/images/splash-image.png" ]; then
    check_success "Splash screen existe"
else
    check_warning "Splash screen manquant (assets/images/splash-image.png)"
fi

if [ -f "assets/images/notification-icon.png" ]; then
    check_success "Notification icon existe"
else
    check_warning "Notification icon manquant (assets/images/notification-icon.png - 96x96)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. VÉRIFICATION DES DÉPENDANCES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_success "Node.js installé: $NODE_VERSION"
else
    check_fail "Node.js non installé"
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_success "npm installé: $NPM_VERSION"
else
    check_fail "npm non installé"
fi

# Vérifier Expo CLI
if command -v npx &> /dev/null; then
    if npx expo --version &> /dev/null; then
        check_success "Expo CLI accessible"
    else
        check_warning "Expo CLI non accessible (normal si pas encore installé)"
    fi
else
    check_fail "npx non disponible"
fi

# Vérifier EAS CLI
if command -v eas &> /dev/null; then
    EAS_VERSION=$(eas --version 2>/dev/null || echo "unknown")
    check_success "EAS CLI installé: $EAS_VERSION"
else
    check_warning "EAS CLI non installé (à installer: npm install -g eas-cli)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. VÉRIFICATION DES DOCUMENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier documents dans /app/
if [ -f "../POLITIQUE_CONFIDENTIALITE.md" ]; then
    check_success "Politique de confidentialité existe"
    if grep -q '\[VOTRE ENTREPRISE\]' ../POLITIQUE_CONFIDENTIALITE.md; then
        check_warning "Politique à personnaliser (contient [VOTRE ENTREPRISE])"
    else
        check_success "Politique semble personnalisée"
    fi
else
    check_fail "Politique de confidentialité manquante"
fi

if [ -f "../CGU.md" ]; then
    check_success "CGU existe"
    if grep -q '\[NOM DE VOTRE ENTREPRISE\]' ../CGU.md; then
        check_warning "CGU à personnaliser (contient [NOM DE VOTRE ENTREPRISE])"
    else
        check_success "CGU semblent personnalisées"
    fi
else
    check_fail "CGU manquantes"
fi

if [ -f "../GUIDE_PUBLICATION_STORES.md" ]; then
    check_success "Guide de publication disponible"
else
    check_warning "Guide de publication manquant"
fi

if [ -f "../TEXTES_MARKETING_STORES.md" ]; then
    check_success "Textes marketing disponibles"
else
    check_warning "Textes marketing manquants"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. VÉRIFICATION package.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "package.json" ]; then
    check_success "package.json existe"
    
    # Vérifier quelques dépendances clés
    if grep -q '"expo"' package.json; then
        check_success "Expo installé dans les dépendances"
    fi
    
    if grep -q '"expo-router"' package.json; then
        check_success "Expo Router installé"
    fi
    
    if grep -q '"expo-notifications"' package.json; then
        check_success "Expo Notifications installé"
    fi
    
    if grep -q '"expo-camera"' package.json; then
        check_success "Expo Camera installé"
    fi
else
    check_fail "package.json manquant"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                           📊 RÉSUMÉ                                  ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Succès: $SUCCESS_COUNT${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNING_COUNT${NC}"
echo -e "${RED}❌ Échecs: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
    echo "🎉 FÉLICITATIONS ! Votre app est prête pour la publication."
    echo "📖 Consultez GUIDE_PUBLICATION_STORES.md pour les prochaines étapes."
elif [ $FAIL_COUNT -eq 0 ]; then
    echo "✨ Bonne progression ! Quelques avertissements à traiter."
    echo "⚠️  Vérifiez les points marqués en jaune ci-dessus."
else
    echo "⚠️  Certains éléments critiques sont manquants."
    echo "❌ Corrigez les points marqués en rouge avant de continuer."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 DOCUMENTATION DISPONIBLE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ../GUIDE_PUBLICATION_STORES.md   → Guide complet étape par étape"
echo "  ../README_PUBLICATION.md          → Récapitulatif et checklist"
echo "  ../TEXTES_MARKETING_STORES.md     → Textes pour les stores"
echo "  ../POLITIQUE_CONFIDENTIALITE.md   → À personnaliser et publier"
echo "  ../CGU.md                          → À personnaliser et publier"
echo ""
