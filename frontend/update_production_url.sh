#!/bin/bash
# Script pour mettre à jour l'URL de production

PRODUCTION_URL=$1

if [ -z "$PRODUCTION_URL" ]; then
    echo "❌ Erreur: Veuillez fournir l'URL de production"
    echo "Usage: ./update_production_url.sh https://votre-url-production.com"
    exit 1
fi

echo "🔄 Mise à jour de l'URL backend vers: $PRODUCTION_URL"

# Créer un backup du .env actuel
cp .env .env.backup

# Mettre à jour EXPO_PUBLIC_BACKEND_URL
sed -i "s|EXPO_PUBLIC_BACKEND_URL=.*|EXPO_PUBLIC_BACKEND_URL=${PRODUCTION_URL}|g" .env

echo "✅ .env mis à jour avec succès!"
echo ""
echo "Nouvelle configuration:"
grep "EXPO_PUBLIC_BACKEND_URL" .env

