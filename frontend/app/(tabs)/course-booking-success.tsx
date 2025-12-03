import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { coursesAPI } from '../../services/api';

export default function CourseBookingSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionId = params.session_id as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState('');
  const [pollAttempts, setPollAttempts] = useState(0);

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    } else {
      setError('Session de paiement introuvable');
      setLoading(false);
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await coursesAPI.checkCourseBookingStatus(sessionId);
      
      if (response.data.status === 'paid') {
        setBooking(response.data.booking);
        setLoading(false);
      } else if (response.data.status === 'expired') {
        setError('La session de paiement a expiré. Veuillez réessayer.');
        setLoading(false);
      } else {
        if (pollAttempts < 5) {
          setPollAttempts(pollAttempts + 1);
          setTimeout(() => checkPaymentStatus(), 2000);
        } else {
          setError('La vérification du paiement prend plus de temps que prévu. Veuillez vérifier votre email pour la confirmation.');
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Error checking payment status:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la vérification du paiement');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Vérification du paiement...</Text>
          <Text style={styles.loadingSubtext}>Veuillez patienter</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="close-circle" size={80} color={Colors.error} />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(tabs)/academy')}
          >
            <Text style={styles.buttonText}>Retour à l'académie</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={80} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>Inscription introuvable</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(tabs)/academy')}
          >
            <Text style={styles.buttonText}>Retour à l'académie</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={100} color={Colors.success} />
        </View>

        <Text style={styles.title}>Inscription confirmée !</Text>
        <Text style={styles.subtitle}>
          Votre paiement a été effectué avec succès
        </Text>

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Détails de votre inscription</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="school" size={20} color={Colors.accent} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Formation</Text>
              <Text style={styles.detailValue}>{booking.courseTitle}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={20} color={Colors.accent} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Durée</Text>
              <Text style={styles.detailValue}>{booking.duration}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="bar-chart" size={20} color={Colors.accent} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Niveau</Text>
              <Text style={styles.detailValue}>{booking.level}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person" size={20} color={Colors.accent} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Nom</Text>
              <Text style={styles.detailValue}>
                {booking.firstName} {booking.lastName}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="mail" size={20} color={Colors.accent} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{booking.email}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, styles.totalRow]}>
            <View style={styles.detailIcon}>
              <Ionicons name="cash" size={20} color={Colors.success} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Montant payé</Text>
              <Text style={styles.totalAmount}>{booking.totalAmount}€</Text>
            </View>
          </View>
        </View>

        <View style={styles.emailCard}>
          <Ionicons name="mail-open" size={24} color={Colors.primary} />
          <View style={styles.emailContent}>
            <Text style={styles.emailTitle}>Email de confirmation envoyé</Text>
            <Text style={styles.emailText}>
              Vous recevrez un email à{' '}
              <Text style={styles.emailHighlight}>{booking.email}</Text> avec vos identifiants d'accès à la plateforme de formation.
            </Text>
          </View>
        </View>

        <View style={styles.accessCard}>
          <Ionicons name="laptop" size={24} color={Colors.accent} />
          <View style={styles.accessContent}>
            <Text style={styles.accessTitle}>Accès à la formation</Text>
            <Text style={styles.accessText}>
              Vous recevrez dans les prochaines 24h un email avec :
            </Text>
            <View style={styles.accessList}>
              <Text style={styles.accessItem}>• Vos identifiants de connexion</Text>
              <Text style={styles.accessItem}>• Lien vers la plateforme</Text>
              <Text style={styles.accessItem}>• Premier module de formation</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/academy')}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.dark} />
          <Text style={styles.primaryButtonText}>Retour à l'académie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(tabs)/index')}
        >
          <Ionicons name="home" size={20} color={Colors.text} />
          <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsCard: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.success,
  },
  emailCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  emailContent: {
    flex: 1,
    marginLeft: 12,
  },
  emailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: '600',
    color: Colors.primary,
  },
  accessCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  accessContent: {
    flex: 1,
    marginLeft: 12,
  },
  accessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  accessText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  accessList: {
    marginTop: 4,
  },
  accessItem: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
