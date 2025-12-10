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
  _id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  coverImageUrl?: string;
  createdAt: string;
}

export default function BlogList() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/blog/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
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
      params: { postId: post._id },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
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
          <TouchableOpacity key={post._id} style={styles.card} onPress={() => handlePostPress(post)}>
            {post.coverImageUrl ? (
              <Image source={{ uri: post.coverImageUrl }} style={styles.cardImage} resizeMode="cover" />
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
});
