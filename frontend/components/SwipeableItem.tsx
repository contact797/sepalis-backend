import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onSwipeRight?: () => void;
  rightActionColor?: string;
  rightActionIcon?: any;
  rightActionText?: string;
}

export function SwipeableItem({ 
  children, 
  onDelete, 
  onSwipeRight,
  rightActionColor = Colors.success,
  rightActionIcon = 'checkmark-circle',
  rightActionText = 'Terminer',
}: SwipeableItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Permettre le swipe dans les deux directions
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Swipe gauche (négatif) → Suppression
        if (gestureState.dx < -SWIPE_THRESHOLD && onDelete) {
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -width,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(itemOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onDelete();
          });
        }
        // Swipe droite (positif) → Action personnalisée
        else if (gestureState.dx > SWIPE_THRESHOLD && onSwipeRight) {
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: width,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(itemOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeRight();
          });
        }
        // Swipe insuffisant → Retour
        else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Background gauche (swipe droite → action) */}
      {onSwipeRight && (
        <View style={[styles.leftBackground, { backgroundColor: rightActionColor }]}>
          <Ionicons name={rightActionIcon} size={24} color="#fff" />
          <Text style={styles.leftText}>{rightActionText}</Text>
        </View>
      )}

      {/* Background droite (swipe gauche → suppression) */}
      {onDelete && (
        <View style={styles.rightBackground}>
          <Ionicons name="trash" size={24} color="#fff" />
          <Text style={styles.rightText}>Supprimer</Text>
        </View>
      )}

      {/* Contenu swipeable */}
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX }],
            opacity: itemOpacity,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 12,
  },
  leftBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
  },
  leftText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  rightBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.35,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
  },
  rightText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  swipeableContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
});
