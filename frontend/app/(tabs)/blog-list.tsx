import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  imageUrl?: string;
  excerpt?: string;
  createdAt: string;
}

export default function BlogList() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremiumRequired, setIsPremiumRequired] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/blog/articles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 403) {
        // Utilisateur non premium
        setIsPremiumRequired(true);
        setPosts([]);
      } else if (response.ok) {
        const data = await response.json();
        setPosts(data);
        setIsPremiumRequired(false);
      }
    } catch (error) {
      console.error('Erreur chargement articles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handlePostPress = (post: BlogPost) => {
    router.push({
      pathname: '/(tabs)/blog-detail',
      params: { postId: post.id },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (isPremiumRequired) {
    return (
      <View style={styles.premiumContainer}>
        <Ionicons name="lock-closed" size={80} color={Colors.accent} />
        <Text style={styles.premiumTitle}>Contenu Premium</Text>
        <Text style={styles.premiumText}>
          Le blog est réservé aux membres Premium.{'\n'}
          Accédez à tous nos articles et conseils d'experts !
        </Text>
        <TouchableOpacity 
          style={styles.premiumButton}
          onPress={() => router.push('/(tabs)/paywall' as any)}
        >
          <Text style={styles.premiumButtonText}>Passer à Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
      }
    >
      {posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Aucun article disponible</Text>
          <Text style={styles.emptyText}>Les articles seront bientôt disponibles</Text>
        </View>
      ) : (
        posts.map((post) => (
          <TouchableOpacity key={post.id} style={styles.card} onPress={() => handlePostPress(post)}>
            {post.imageUrl ? (
              <Image source={{ uri: post.imageUrl }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color={Colors.textSecondary} />
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{post.category}</Text>
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {post.title}
              </Text>

              <Text style={styles.cardExcerpt} numberOfLines={3}>
                {post.content.substring(0, 150)}...
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.authorInfo}>
                  <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.authorText}>{post.author}</Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  cardExcerpt: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  premiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 32,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  premiumText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  premiumButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
