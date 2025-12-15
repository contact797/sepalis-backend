#!/bin/bash
# Script pour lancer le build avec génération automatique du keystore
echo "y" | npx eas build --platform android --profile production 2>&1
