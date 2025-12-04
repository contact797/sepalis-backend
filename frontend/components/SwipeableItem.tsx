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

export function SwipeableItem({ children, onDelete }: SwipeableItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Swipe suffisant → Suppression
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
        } else {
          // Swipe insuffisant → Retour
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
      {/* Background de suppression */}
      <View style={styles.deleteBackground}>
        <Ionicons name="trash" size={24} color="#fff" />
        <Text style={styles.deleteText}>Supprimer</Text>
      </View>

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
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.3,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  swipeableContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
});
