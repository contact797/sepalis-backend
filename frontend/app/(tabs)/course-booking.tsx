import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { coursesAPI } from '../../services/api';
import Constants from 'expo-constants';

export default function CourseBooking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const course = params.course ? JSON.parse(params.course as string) : null;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  if (!course) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Formation non trouvée</Text>
      </View>
    );
  }

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner votre nom et prénom');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('Erreur', 'Veuillez renseigner un email valide');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner votre numéro de téléphone');
      return false;
    }
    return true;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const originUrl = Constants.expoConfig?.extra?.backendUrl || 
                       process.env.EXPO_PUBLIC_BACKEND_URL || 
                       'https://sepalis-app.preview.emergentagent.com';

      const bookingData = {
        workshopSlug: course.slug, // Re-using the workshop field name for API compatibility
        selectedDate: new Date().toISOString().split('T')[0], // Dummy date for online course
        timeSlot: 'morning', // Dummy time slot for online course
        participants: 1,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        originUrl,
      };

      const response = await coursesAPI.bookCourse(bookingData);

      if (response.data.checkout_url) {
        // Open Stripe Checkout in browser
        const result = await WebBrowser.openBrowserAsync(response.data.checkout_url);
        
        if (result.type === 'cancel') {
          Alert.alert('Paiement annulé', 'Votre inscription n\'a pas été finalisée.');
        }
      }
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.detail || 'Impossible de créer l\'inscription. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inscription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Course Info */}
        <View style={styles.courseCard}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <View style={styles.courseMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{course.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{course.level}</Text>
            </View>
          </View>
        </View>

        {/* Info Formation en ligne */}
        <View style={styles.infoCard}>
          <Ionicons name="laptop" size={32} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Formation 100% en ligne</Text>
            <Text style={styles.infoText}>
              Accédez à tous les modules immédiatement après paiement. Apprenez à votre rythme, où vous voulez, quand vous voulez.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="person" size={20} color={Colors.accent} /> Vos informations
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                placeholderTextColor={Colors.textSecondary}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                placeholderTextColor={Colors.textSecondary}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="votre.email@exemple.com"
                placeholderTextColor={Colors.textSecondary}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="06 12 34 56 78"
                placeholderTextColor={Colors.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* What's included */}
        <View style={styles.includedCard}>
          <Text style={styles.includedTitle}>✨ Ce qui est inclus</Text>
          <View style={styles.includedList}>
            <View style={styles.includedItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.includedText}>Accès illimité à tous les modules</Text>
            </View>
            <View style={styles.includedItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.includedText}>Vidéos HD et supports téléchargeables</Text>
            </View>
            <View style={styles.includedItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.includedText}>Support par email avec Nicolas Blot</Text>
            </View>
            <View style={styles.includedItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.includedText}>Certificat de formation</Text>
            </View>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Formation en ligne</Text>
            <Text style={styles.totalValue}>{course.price}€</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelFinal}>Total à payer</Text>
            <Text style={styles.totalAmountFinal}>{course.price}€</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color={Colors.dark} />
              <Text style={styles.payButtonText}>Traitement...</Text>
            </>
          ) : (
            <>
              <Ionicons name="card" size={20} color={Colors.dark} />
              <Text style={styles.payButtonText}>Payer {course.price}€</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 14,
  },
  includedCard: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  includedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  includedList: {
    gap: 12,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  includedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  totalCard: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalRowFinal: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  totalAmountFinal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
});
