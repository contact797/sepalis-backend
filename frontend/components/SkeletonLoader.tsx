import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton préconfiguré pour une Card
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.cardContent}>
          <SkeletonLoader width="70%" height={16} />
          <SkeletonLoader width="50%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={60} style={{ marginTop: 12 }} />
    </View>
  );
}

// Skeleton pour une liste d'items
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </>
  );
}

// Skeleton pour le dashboard
export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <SkeletonLoader width={200} height={24} />
          <SkeletonLoader width={150} height={16} style={{ marginTop: 8 }} />
        </View>
        <SkeletonLoader width={48} height={48} borderRadius={24} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <SkeletonLoader width="30%" height={80} borderRadius={12} />
        <SkeletonLoader width="30%" height={80} borderRadius={12} />
        <SkeletonLoader width="30%" height={80} borderRadius={12} />
      </View>

      {/* Content Cards */}
      <SkeletonLoader width="100%" height={200} borderRadius={12} style={{ marginTop: 16 }} />
      <SkeletonLoader width="100%" height={150} borderRadius={12} style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.card,
  },
  card: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardContent: {
    flex: 1,
  },
  dashboard: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
