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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function HelpSupportScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const faqs = [
    {
      question: 'Comment scanner une plante ?',
      answer: 'Allez dans l\'onglet "Plantes", cliquez sur le bouton "Scanner" en bas de l\'écran. Prenez une photo claire de la plante et l\'IA l\'identifiera automatiquement.',
    },
    {
      question: 'Comment créer une zone climatique ?',
      answer: 'Dans l\'onglet "Zones", cliquez sur le bouton "+". Donnez un nom à votre zone et sélectionnez son climat (ensoleillé, mi-ombre, ombre). Vous recevrez alors des recommandations de plantes adaptées.',
    },
    {
      question: 'Comment fonctionne le parrainage ?',
      answer: 'Allez dans Profil > Parrainer des amis. Copiez votre code unique et partagez-le. Quand vos amis s\'inscrivent avec votre code, vous gagnez tous les deux du Premium gratuit !',
    },
    {
      question: 'Comment activer les notifications ?',
      answer: 'Allez dans votre Profil, activez le Switch "Notifications". Vous devrez accepter les permissions sur votre téléphone. Ensuite, vous recevrez des rappels et conseils quotidiens.',
    },
    {
      question: 'Que faire si le scan ne fonctionne pas ?',
      answer: 'Assurez-vous que : 1) Votre photo est nette et bien éclairée, 2) La plante est au centre de l\'image, 3) Vous avez une connexion internet active. Si le problème persiste, contactez le support.',
    },
    {
      question: 'Comment annuler mon abonnement Premium ?',
      answer: 'Allez dans Profil > Mon abonnement > Gérer l\'abonnement. Vous serez redirigé vers le Google Play Store où vous pourrez annuler.',
    },
    {
      question: 'Mes données sont-elles sécurisées ?',
      answer: 'Oui ! Nous utilisons un cryptage de niveau bancaire. Vos mots de passe sont cryptés et nous ne vendons jamais vos données. Voir notre Politique de confidentialité pour plus de détails.',
    },
    {
      question: 'Comment supprimer mon compte ?',
      answer: 'Allez dans Profil > Paramètres > Zone de danger > Supprimer mon compte. Cette action est irréversible et supprimera toutes vos données.',
    },
  ];

  const handleSendMessage = () => {
    if (!contactMessage.trim() || !contactEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const subject = 'Support Sepalis';
    const body = `Email: ${contactEmail}\n\nMessage:\n${contactMessage}`;
    const mailto = `mailto:contact@nicolasblot.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailto).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide et support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Contact rapide */}
        <View style={styles.quickContact}>
          <Ionicons name="mail" size={32} color={Colors.primary} />
          <View style={styles.quickContactInfo}>
            <Text style={styles.quickContactTitle}>Besoin d'aide rapide ?</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:contact@nicolasblot.com')}>
              <Text style={styles.quickContactEmail}>contact@nicolasblot.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              {expandedFaq === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Liens utiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liens utiles</Text>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => router.push('/(tabs)/about' as any)}
          >
            <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>À propos de Sepalis</Text>
              <Text style={styles.linkDescription}>Notre mission et valeurs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Linking.openURL('https://sepalis-app-1.preview.emergentagent.com/docs/POLITIQUE_CONFIDENTIALITE.md')}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            <View style={styles.linkInfo}>
              <Text style={styles.linkTitle}>Politique de confidentialité</Text>
              <Text style={styles.linkDescription}>Protection de vos données</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Formulaire de contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nous contacter</Text>

          <Text style={styles.label}>Votre email</Text>
          <TextInput
            style={styles.input}
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="email@exemple.com"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Votre message</Text>
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

          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Ionicons name="send" size={20} color={Colors.white} />
            <Text style={styles.sendButtonText}>Envoyer le message</Text>
          </TouchableOpacity>
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
  quickContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.primary + '20',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  quickContactInfo: {
    flex: 1,
  },
  quickContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  quickContactEmail: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
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
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    paddingLeft: 8,
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  bottomSpacing: {
    height: 40,
  },
});