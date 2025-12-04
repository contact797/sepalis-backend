import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
  onComplete?: () => void;
}

export function Confetti({ 
  count = 50, 
  duration = 3000,
  colors = ['#FF6B9D', '#4ECDC4', '#FFB84D', '#95E1D3', '#F38181', '#AA96DA'],
  onComplete 
}: ConfettiProps) {
  const confettiPieces = useRef(
    Array.from({ length: count }).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(1),
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 500,
    }))
  ).current;

  useEffect(() => {
    const animations = confettiPieces.map((piece) => {
      return Animated.parallel([
        // Chute
        Animated.timing(piece.y, {
          toValue: height + 100,
          duration: duration + Math.random() * 1000,
          delay: piece.delay,
          useNativeDriver: true,
        }),
        // Mouvement horizontal
        Animated.timing(piece.x, {
          toValue: piece.x._value + (Math.random() - 0.5) * 100,
          duration: duration,
          delay: piece.delay,
          useNativeDriver: true,
        }),
        // Rotation
        Animated.loop(
          Animated.timing(piece.rotate, {
            toValue: 1,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          })
        ),
        // Scale pulsation
        Animated.sequence([
          Animated.timing(piece.scale, {
            toValue: 1.2,
            duration: 200,
            delay: piece.delay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.scale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      if (onComplete) onComplete();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece, index) => {
        const rotate = piece.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: piece.color,
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  { rotate },
                  { scale: piece.scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
