import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
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

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);

  // Form states
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postAuthor, setPostAuthor] = useState('Nicolas Blot');
  const [postCategory, setPostCategory] = useState('Jardinage');
  const [postCoverImage, setPostCoverImage] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/blog/articles`, {
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
      Alert.alert('Erreur', 'Impossible de charger les articles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    setCurrentPost(null);
    setPostTitle('');
    setPostContent('');
    setPostAuthor('Nicolas Blot');
    setPostCategory('Jardinage');
    setPostCoverImage('');
    setShowModal(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setCurrentPost(post);
    setPostTitle(post.title);
    setPostContent(post.content);
    setPostAuthor(post.author);
    setPostCategory(post.category);
    setPostCoverImage(post.coverImageUrl || '');
    setShowModal(true);
  };

  const handleSavePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      const postData = {
        title: postTitle,
        content: postContent,
        author: postAuthor,
        category: postCategory,
        coverImageUrl: postCoverImage || undefined,
      };

      const url = currentPost
        ? `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/blog/articles/${currentPost._id}`
        : `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/blog/articles`;

      const method = currentPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        Alert.alert(
          'Succès',
          currentPost ? 'Article modifié avec succès' : 'Article créé avec succès'
        );
        setShowModal(false);
        loadPosts();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde article:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'article');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cet article ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/blog/posts/${postId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Succès', 'Article supprimé avec succès');
                loadPosts();
              } else {
                throw new Error('Erreur lors de la suppression');
              }
            } catch (error) {
              console.error('Erreur suppression article:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'article');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const categories = ['Jardinage', 'Plantes', 'Saisons', 'Conseils', 'Entretien', 'Outils'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Gestion du Blog</Text>
          <Text style={styles.sectionSubtitle}>{posts.length} article(s) publié(s)</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreatePost}>
          <Ionicons name="add" size={24} color={Colors.white} />
          <Text style={styles.addButtonText}>Nouvel article</Text>
        </TouchableOpacity>
      </View>

      {loading && posts.length === 0 ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 32 }} />
      ) : posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>Aucun article publié</Text>
          <Text style={styles.emptySubtext}>Créez votre premier article de blog</Text>
        </View>
      ) : (
        <ScrollView style={styles.postsList}>
          {posts.map((post) => (
            <View key={post._id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{post.category}</Text>
                </View>
                <Text style={styles.postDate}>
                  {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postAuthor}>Par {post.author}</Text>
              <Text style={styles.postExcerpt} numberOfLines={2}>
                {post.content}
              </Text>

              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditPost(post)}
                >
                  <Ionicons name="pencil" size={18} color={Colors.primary} />
                  <Text style={styles.editButtonText}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePost(post._id)}
                >
                  <Ionicons name="trash" size={18} color={Colors.error} />
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal Création/Edition */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {currentPost ? 'Modifier l\'article' : 'Nouvel article'}
            </Text>
            <TouchableOpacity onPress={handleSavePost} disabled={loading}>
              <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
                {loading ? 'Sauvegarde...' : 'Publier'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre de l'article"
              placeholderTextColor={Colors.textSecondary}
              value={postTitle}
              onChangeText={setPostTitle}
            />

            <Text style={styles.label}>Catégorie *</Text>
            <View style={styles.categorySelector}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    postCategory === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setPostCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      postCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Auteur *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de l'auteur"
              placeholderTextColor={Colors.textSecondary}
              value={postAuthor}
              onChangeText={setPostAuthor}
            />

            <Text style={styles.label}>URL de l'image de couverture (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={Colors.textSecondary}
              value={postCoverImage}
              onChangeText={setPostCoverImage}
            />

            <Text style={styles.label}>Contenu *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Rédigez votre article ici..."
              placeholderTextColor={Colors.textSecondary}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={15}
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  postsList: {
    flex: 1,
  },
  postCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  postDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  postAuthor: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  postExcerpt: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '20',
    paddingVertical: 10,
    borderRadius: 8,
  },
  editButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.error + '20',
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveButtonDisabled: {
    color: Colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 200,
    marginBottom: 32,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
});
