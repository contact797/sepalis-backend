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
import { Calendar } from 'react-native-calendars';
import * as WebBrowser from 'expo-web-browser';
import { workshopsAPI } from '../../services/api';
import Constants from 'expo-constants';

export default function WorkshopBooking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const workshop = params.workshop ? JSON.parse(params.workshop as string) : null;

  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | ''>('');
  const [participants, setParticipants] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  if (!workshop) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Atelier non trouvé</Text>
      </View>
    );
  }

  const totalAmount = workshop.price * participants;

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const validateForm = () => {
    if (!selectedDate) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date');
      return false;
    }
    if (!timeSlot) {
      Alert.alert('Erreur', 'Veuillez sélectionner un créneau horaire');
      return false;
    }
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
                       'https://plant-ai-helper-1.preview.emergentagent.com';

      const bookingData = {
        workshopSlug: workshop.slug,
        selectedDate,
        timeSlot,
        participants,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        originUrl,
      };

      const response = await workshopsAPI.createBooking(bookingData);

      if (response.data.checkout_url) {
        // Open Stripe Checkout in browser
        const result = await WebBrowser.openBrowserAsync(response.data.checkout_url);
        
        if (result.type === 'cancel') {
          Alert.alert('Paiement annulé', 'Votre réservation n\'a pas été finalisée.');
        }
      }
    } catch (error: any) {
      console.error('Erreur réservation:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.detail || 'Impossible de créer la réservation. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

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
        <Text style={styles.headerTitle}>Réserver</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Workshop Info */}
        <View style={styles.workshopCard}>
          <Text style={styles.workshopTitle}>{workshop.title}</Text>
          <View style={styles.workshopMeta}>
            <Ionicons name="person" size={14} color={Colors.textSecondary} />
            <Text style={styles.workshopMetaText}>{workshop.instructor}</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar" size={20} color={Colors.accent} /> Choisir une date
          </Text>
          <View style={styles.calendarContainer}>
            <Calendar
              minDate={today}
              onDayPress={handleDateSelect}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: Colors.accent,
                },
              }}
              theme={{
                backgroundColor: Colors.card,
                calendarBackground: Colors.card,
                textSectionTitleColor: Colors.textSecondary,
                selectedDayBackgroundColor: Colors.accent,
                selectedDayTextColor: Colors.dark,
                todayTextColor: Colors.primary,
                dayTextColor: Colors.text,
                textDisabledColor: Colors.textSecondary + '50',
                monthTextColor: Colors.text,
                arrowColor: Colors.accent,
              }}
            />
          </View>
          {selectedDate && (
            <View style={styles.selectedDateCard}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.selectedDateText}>
                Date sélectionnée : {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Time Slot Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time" size={20} color={Colors.accent} /> Choisir un créneau
          </Text>
          <View style={styles.timeSlotsContainer}>
            <TouchableOpacity
              style={[
                styles.timeSlotCard,
                timeSlot === 'morning' && styles.timeSlotCardSelected,
              ]}
              onPress={() => setTimeSlot('morning')}
            >
              <Ionicons
                name="sunny"
                size={32}
                color={timeSlot === 'morning' ? Colors.accent : Colors.textSecondary}
              />
              <Text style={[
                styles.timeSlotTitle,
                timeSlot === 'morning' && styles.timeSlotTitleSelected,
              ]}>
                Matin
              </Text>
              <Text style={[
                styles.timeSlotTime,
                timeSlot === 'morning' && styles.timeSlotTimeSelected,
              ]}>
                09:00 - 12:00
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeSlotCard,
                timeSlot === 'afternoon' && styles.timeSlotCardSelected,
              ]}
              onPress={() => setTimeSlot('afternoon')}
            >
              <Ionicons
                name="partly-sunny"
                size={32}
                color={timeSlot === 'afternoon' ? Colors.accent : Colors.textSecondary}
              />
              <Text style={[
                styles.timeSlotTitle,
                timeSlot === 'afternoon' && styles.timeSlotTitleSelected,
              ]}>
                Après-midi
              </Text>
              <Text style={[
                styles.timeSlotTime,
                timeSlot === 'afternoon' && styles.timeSlotTimeSelected,
              ]}>
                14:00 - 17:00
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="people" size={20} color={Colors.accent} /> Nombre de participants
          </Text>
          <View style={styles.participantsContainer}>
            <TouchableOpacity
              style={[styles.participantButton, participants <= 1 && styles.participantButtonDisabled]}
              onPress={() => participants > 1 && setParticipants(participants - 1)}
              disabled={participants <= 1}
            >
              <Ionicons name="remove" size={24} color={participants <= 1 ? Colors.textSecondary : Colors.accent} />
            </TouchableOpacity>
            <Text style={styles.participantsCount}>{participants}</Text>
            <TouchableOpacity
              style={[styles.participantButton, participants >= 5 && styles.participantButtonDisabled]}
              onPress={() => participants < 5 && setParticipants(participants + 1)}
              disabled={participants >= 5}
            >
              <Ionicons name="add" size={24} color={participants >= 5 ? Colors.textSecondary : Colors.accent} />
            </TouchableOpacity>
          </View>
          <Text style={styles.participantsHint}>Maximum 5 participants par réservation</Text>
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

        {/* Total */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Prix unitaire</Text>
            <Text style={styles.totalValue}>{workshop.price}€</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Participants</Text>
            <Text style={styles.totalValue}>× {participants}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelFinal}>Total</Text>
            <Text style={styles.totalAmountFinal}>{totalAmount}€</Text>
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
              <Text style={styles.payButtonText}>Payer {totalAmount}€</Text>
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
  workshopCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  workshopTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  workshopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workshopMetaText: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  calendarContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 8,
  },
  selectedDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  selectedDateText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timeSlotCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timeSlotCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  timeSlotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  timeSlotTitleSelected: {
    color: Colors.text,
  },
  timeSlotTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  timeSlotTimeSelected: {
    color: Colors.accent,
    fontWeight: '600',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
  },
  participantButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantButtonDisabled: {
    backgroundColor: Colors.border,
  },
  participantsCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  participantsHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
