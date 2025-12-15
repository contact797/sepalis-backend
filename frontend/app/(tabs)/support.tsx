import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAQ_DATA = [
  {
    question: 'Comment scanner une plante ?',
    answer: 'Allez dans l\'onglet "Scanner" en bas de l\'écran, prenez une photo claire de la plante, et notre IA l\'identifiera automatiquement avec des conseils MOF personnalisés.',
  },
  {
    question: 'Comment créer une zone dans mon jardin ?',
    answer: 'Rendez-vous dans l\'onglet "Zones", puis cliquez sur le bouton "+ Créer une zone". Remplissez les informations (nom, type, dimensions, etc.) et enregistrez.',
  },
  {
    question: 'Que signifie le badge MOF ?',
    answer: 'MOF signifie "Meilleur Ouvrier de France". C\'est le plus haut titre professionnel en France. Tous nos conseils sont validés par un paysagiste MOF pour garantir leur excellence.',
  },
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer: 'L\'essai gratuit dure 7 jours et vous donne accès à toutes les fonctionnalités Premium. Aucune carte bancaire n\'est requise. À l\'issue de l\'essai, vous pouvez choisir de passer à Premium ou continuer en version gratuite.',
  },
  {
    question: 'Puis-je annuler mon abonnement ?',
    answer: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis les paramètres Google Play. L\'annulation prend effet à la fin de la période en cours.',
  },
  {
    question: 'Les conseils sont-ils disponibles hors ligne ?',
    answer: 'Les plantes et zones que vous avez déjà scannées ou créées sont accessibles hors ligne. L\'identification de nouvelles plantes nécessite une connexion internet.',
  },
  {
    question: 'Comment activer les notifications ?',
    answer: 'Rendez-vous dans votre profil, puis activez le switch "Notifications". Vous recevrez alors des conseils, rappels de tâches et messages de l\'équipe Sepalis.',
  },
  {
    question: 'Comment parrainer des amis ?',
    answer: 'Allez dans "Parrainer des amis" depuis votre profil. Partagez votre code unique. Vous et votre filleul recevrez des jours Premium gratuits !',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleFaqToggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleSendMessage = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setSending(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/support-message`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: contactSubject,
            message: contactMessage,
          }),
        }
      );

      if (response.ok) {
        Alert.alert(
          '✅ Message envoyé',
          'Nous avons bien reçu votre message. Notre équipe vous répondra dans les plus brefs délais.'
        );
        setContactSubject('');
        setContactMessage('');
      } else {
        throw new Error('Erreur envoi message');
      }
    } catch (error) {
      console.error('Erreur envoi support:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'envoyer le message. Vous pouvez nous contacter directement à contact@sepalis.com'
      );
    } finally {
      setSending(false);
    }
  };

  const handleEmailContact = () => {
    Linking.openURL('mailto:contact@sepalis.com?subject=Support Sepalis');
  };

  const handlePhoneContact = () => {
    Linking.openURL('tel:+33640397138');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide et support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Quick Contact */}
        <View style={styles.quickContactSection}>
          <Text style={styles.sectionTitle}>Contact rapide</Text>
          <View style={styles.quickContactButtons}>
            <TouchableOpacity
              style={styles.quickContactButton}
              onPress={handleEmailContact}
            >
              <Ionicons name="mail" size={24} color={Colors.primary} />
              <Text style={styles.quickContactText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickContactButton}
              onPress={handlePhoneContact}
            >
              <Ionicons name="call" size={24} color={Colors.primary} />
              <Text style={styles.quickContactText}>Téléphone</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          {FAQ_DATA.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => handleFaqToggle(index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.primary}
                />
              </View>
              {expandedIndex === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactez-nous</Text>
          <Text style={styles.sectionDescription}>
            Vous n'avez pas trouvé de réponse ? Envoyez-nous un message.
          </Text>

          <Text style={styles.label}>Sujet *</Text>
          <TextInput
            style={styles.input}
            value={contactSubject}
            onChangeText={setContactSubject}
            placeholder="Ex: Problème de connexion"
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={contactMessage}
            onChangeText={setContactMessage}
            placeholder="Décrivez votre problème ou votre question..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={Colors.white} />
                <Text style={styles.sendButtonText}>Envoyer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfoSection}>
          <View style={styles.contactInfoItem}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            <Text style={styles.contactInfoText}>contact@sepalis.com</Text>
          </View>
          <View style={styles.contactInfoItem}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
            <Text style={styles.contactInfoText}>06 40 39 71 38</Text>
          </View>
          <View style={styles.contactInfoItem}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.contactInfoText}>Lun-Ven: 9h-18h</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  quickContactSection: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  quickContactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickContactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '20',
    padding: 16,
    borderRadius: 12,
  },
  quickContactText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  contactInfoSection: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactInfoText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});
