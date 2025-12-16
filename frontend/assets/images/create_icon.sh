#!/bin/bash

# Couleurs
BG_COLOR="#1A2E1A"      # Vert foncé élégant
TEXT_COLOR="#D4AF37"     # Or
LEAF_COLOR="#D4AF37"     # Or pour les feuilles

# Créer l'icône principale (1024x1024)
convert -size 1024x1024 xc:"$BG_COLOR" \
  -gravity center \
  -font "DejaVu-Sans-Bold" \
  -pointsize 600 \
  -fill "$TEXT_COLOR" \
  -annotate +0+0 "S" \
  -fill "$LEAF_COLOR" \
  -draw "path 'M 150,300 Q 100,250 120,200 Q 140,250 150,300 Z'" \
  -draw "path 'M 870,300 Q 920,250 900,200 Q 880,250 870,300 Z'" \
  -draw "path 'M 150,720 Q 100,770 120,820 Q 140,770 150,720 Z'" \
  -draw "path 'M 870,720 Q 920,770 900,820 Q 880,770 870,720 Z'" \
  icon.png

# Créer l'adaptive icon pour Android (même design)
cp icon.png adaptive-icon.png

# Créer le favicon (plus petit, 512x512)
convert icon.png -resize 512x512 favicon.png

echo "✅ Icônes créées avec succès!"
