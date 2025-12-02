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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { coursesAPI } from '../../services/api';

export default function CoursePreregister() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const course = params.course ? JSON.parse(params.course as string) : null;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner votre nom et prénom');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('Erreur', 'Veuillez renseigner un email valide');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner votre numéro de téléphone');
      return;
    }

    setLoading(true);
    try {
      await coursesAPI.preregister({
        courseSlug: course.slug,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      Alert.alert(
        'Pré-inscription enregistrée ! 🎉',
        `Merci ${formData.firstName} !\n\nVotre pré-inscription à la formation "${course.title}" a été enregistrée avec succès.\n\nVous recevrez un email de confirmation avec toutes les informations pour finaliser votre inscription.`,
        [
          {
            text: 'Retour à l\'académie',
            onPress: () => router.push('/(tabs)/academy'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur pré-inscription:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.detail || 'Impossible d\'enregistrer votre pré-inscription. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!course) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Formation non trouvée</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Pré-inscription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Formation info */}
        <View style={styles.courseInfo}>
          <View style={styles.iconContainer}>
            <Ionicons name="school" size={40} color={Colors.accent} />
          </View>
          <View style={styles.courseDetails}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseInstructor}>
              <Ionicons name="person" size={12} color={Colors.textSecondary} /> {course.instructor}
            </Text>
            <View style={styles.courseMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={Colors.primary} />
                <Text style={styles.metaText}>{course.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="card-outline" size={14} color={Colors.accent} />
                <Text style={styles.metaText}>{course.price}€</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            <Ionicons name="document-text" size={20} color={Colors.accent} /> Vos informations
          </Text>
          <Text style={styles.formDescription}>
            Remplissez ce formulaire pour vous pré-inscrire à cette formation. Nous vous recontacterons rapidement avec tous les détails.
          </Text>

          {/* Prénom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Prénom <Text style={styles.required}>*</Text>
            </Text>
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

          {/* Nom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nom <Text style={styles.required}>*</Text>
            </Text>
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

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
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

          {/* Téléphone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Téléphone <Text style={styles.required}>*</Text>
            </Text>
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

          {/* Message (optionnel) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message (optionnel)</Text>
            <View style={styles.textAreaContainer}>
              <Ionicons name="chatbox-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Des questions ou remarques particulières ?"
                placeholderTextColor={Colors.textSecondary}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Info RGPD */}
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Vos données sont sécurisées et utilisées uniquement pour le traitement de votre pré-inscription.
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bouton fixe */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color={Colors.dark} />
              <Text style={styles.submitButtonText}>Envoi en cours...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={Colors.dark} />
              <Text style={styles.submitButtonText}>Envoyer ma pré-inscription</Text>
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
  courseInfo: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseDetails: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
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
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
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
  textArea: {
    minHeight: 100,
    paddingTop: 0,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
});
