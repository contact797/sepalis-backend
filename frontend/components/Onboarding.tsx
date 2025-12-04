import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenData {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  animation?: string;
}

const onboardingData: OnboardingScreenData[] = [
  {
    id: '1',
    title: 'Bienvenue sur Sepalis ! 🌱',
    description: 'Votre assistant de jardinage intelligent créé par un Meilleur Ouvrier de France en paysagisme. L\'excellence au service de votre jardin.',
    icon: 'leaf',
    color: Colors.accent,
  },
  {
    id: '2',
    title: 'Intelligence Artificielle 🤖',
    description: 'Identifiez vos plantes en un clic avec notre IA ! Scannez, obtenez des infos détaillées et des conseils d\'entretien adaptés à chaque espèce.',
    icon: 'scan',
    color: '#FF6B9D',
  },
  {
    id: '3',
    title: 'Météo & Automatisation ⚡',
    description: 'Recevez des prévisions météo locales et des suggestions de tâches automatiques selon la saison. Votre jardin au bon moment, toujours !',
    icon: 'thunderstorm',
    color: '#FFB84D',
  },
  {
    id: '4',
    title: 'Essai Gratuit 7 Jours 🎁',
    description: 'Profitez de TOUTES les fonctionnalités premium gratuitement pendant 7 jours. Aucune carte bancaire requise pour commencer !',
    icon: 'gift',
    color: '#4ECDC4',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      
      // Animation de bounce sur le bouton
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Mettre à jour l'index AVANT le scroll
      setCurrentIndex(nextIndex);

      // Scroll vers le prochain écran en utilisant scrollToOffset (plus fiable)
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    const lastIndex = onboardingData.length - 1;
    
    // Scroll vers le dernier écran en utilisant scrollToOffset
    flatListRef.current?.scrollToOffset({
      offset: lastIndex * width,
      animated: true,
    });
  };

  const handleFinish = async () => {
    // Demander les permissions
    await requestPermissions();
    
    // Marquer l'onboarding comme complété
    await AsyncStorage.setItem('onboardingCompleted', 'true');
    
    // Animation de bounce avant de terminer
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  const requestPermissions = async () => {
    try {
      // Demander la permission de localisation
      await Location.requestForegroundPermissionsAsync();
      
      // Demander la permission des notifications
      if (Platform.OS !== 'web') {
        await Notifications.requestPermissionsAsync();
      }
    } catch (error) {
      console.log('Erreur permissions:', error);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item, index }: { item: OnboardingScreenData; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: item.color + '20',
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <Ionicons name={item.icon} size={80} color={item.color} />
        </Animated.View>
        <Animated.Text
          style={[
            styles.title,
            {
              opacity,
            },
          ]}
        >
          {item.title}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.description,
            {
              opacity,
            },
          ]}
        >
          {item.description}
        </Animated.Text>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: onboardingData[index].color,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {currentIndex < onboardingData.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Dots Indicator */}
      {renderDots()}

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {currentIndex === onboardingData.length - 1 ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.accent }]}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>C'est parti ! 🚀</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: onboardingData[currentIndex].color },
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Suivant</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.dark} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    height: 8,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.dark,
  },
});
