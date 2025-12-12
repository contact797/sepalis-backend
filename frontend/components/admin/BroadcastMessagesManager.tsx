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
  Switch,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

interface BroadcastMessage {
  id: string;
  title: string;
  body: string;
  scheduledDate?: string;
  sentAt?: string;
  status: 'scheduled' | 'sent' | 'failed';
  recipientsCount?: number;
  createdAt: string;
}

interface MessageTemplate {
  _id: string;
  name: string;
  title: string;
  body: string;
}

export default function BroadcastMessagesManager() {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'templates'>('send');

  // Form states
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadMessages(), loadTemplates()]);
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/messages/broadcast`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/messages/templates`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageTitle.trim() || !messageBody.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le titre et le contenu du message');
      return;
    }

    try {
      setSending(true);
      const token = await AsyncStorage.getItem('authToken');

      const payload: any = {
        title: messageTitle,
        body: messageBody,
        isRecurring: false,
      };

      if (isScheduled) {
        payload.scheduledDate = scheduledDate.toISOString();
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/messages/broadcast`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          '✅ Succès',
          isScheduled
            ? `Message planifié pour le ${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
            : `Message envoyé à ${data.recipientsCount} utilisateur(s)`
        );
        resetForm();
        setShowModal(false);
        loadMessages();
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    setMessageTitle(template.title);
    setMessageBody(template.body);
    Alert.alert('Template appliqué', 'Vous pouvez maintenant modifier et envoyer le message');
  };

  const resetForm = () => {
    setMessageTitle('');
    setMessageBody('');
    setIsScheduled(false);
    setScheduledDate(new Date());
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(scheduledDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setScheduledDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(scheduledDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setScheduledDate(newDate);
    }
  };

  const renderSendTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.label}>Titre du message *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Nouvelle fonctionnalité disponible !"
        placeholderTextColor={Colors.textSecondary}
        value={messageTitle}
        onChangeText={setMessageTitle}
      />

      <Text style={styles.label}>Contenu du message *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Rédigez votre message..."
        placeholderTextColor={Colors.textSecondary}
        value={messageBody}
        onChangeText={setMessageBody}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <View style={styles.scheduledContainer}>
        <View style={styles.scheduledHeader}>
          <Ionicons name="time-outline" size={20} color={Colors.primary} />
          <Text style={styles.scheduledLabel}>Planifier l'envoi</Text>
        </View>
        <Switch
          value={isScheduled}
          onValueChange={setIsScheduled}
          trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
          thumbColor={isScheduled ? Colors.primary : Colors.textSecondary}
        />
      </View>

      {isScheduled && (
        <View style={styles.dateTimeContainer}>
          {Platform.OS === 'web' ? (
            <>
              <View style={styles.dateTimeButton}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <TextInput
                  style={styles.dateTimeInput}
                  value={scheduledDate.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    const [year, month, day] = text.split('-').map(Number);
                    if (year && month && day) {
                      const newDate = new Date(scheduledDate);
                      newDate.setFullYear(year);
                      newDate.setMonth(month - 1);
                      newDate.setDate(day);
                      setScheduledDate(newDate);
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.dateTimeButton}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <TextInput
                  style={styles.dateTimeInput}
                  value={scheduledDate.toTimeString().split(' ')[0].substring(0, 5)}
                  onChangeText={(text) => {
                    const [hours, minutes] = text.split(':').map(Number);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                      const newDate = new Date(scheduledDate);
                      newDate.setHours(hours);
                      newDate.setMinutes(minutes);
                      setScheduledDate(newDate);
                    }
                  }}
                  placeholder="HH:MM"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.dateTimeText}>
                  {scheduledDate.toLocaleDateString('fr-FR')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
                <Text style={styles.dateTimeText}>
                  {scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {Platform.OS !== 'web' && showTimePicker && (
        <DateTimePicker
          value={scheduledDate}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      <TouchableOpacity
        style={[styles.sendButton, sending && styles.sendButtonDisabled]}
        onPress={handleSendMessage}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Ionicons name={isScheduled ? 'time' : 'send'} size={20} color={Colors.white} />
            <Text style={styles.sendButtonText}>
              {isScheduled ? 'Planifier' : 'Envoyer maintenant'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 32 }} />
      ) : messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-open-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>Aucun message envoyé</Text>
        </View>
      ) : (
        <ScrollView style={styles.messagesList}>
          {messages.map((message) => (
            <View key={message._id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        message.status === 'sent'
                          ? Colors.primary + '20'
                          : message.status === 'scheduled'
                          ? '#FFA500' + '20'
                          : Colors.error + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          message.status === 'sent'
                            ? Colors.primary
                            : message.status === 'scheduled'
                            ? '#FFA500'
                            : Colors.error,
                      },
                    ]}
                  >
                    {message.status === 'sent'
                      ? 'Envoyé'
                      : message.status === 'scheduled'
                      ? 'Planifié'
                      : 'Échec'}
                  </Text>
                </View>
                <Text style={styles.messageDate}>
                  {message.sentAt
                    ? new Date(message.sentAt).toLocaleDateString('fr-FR')
                    : message.scheduledDate
                    ? new Date(message.scheduledDate).toLocaleDateString('fr-FR')
                    : ''}
                </Text>
              </View>

              <Text style={styles.messageTitle}>{message.title}</Text>
              <Text style={styles.messageBody} numberOfLines={2}>
                {message.body}
              </Text>

              {message.recipientsCount !== undefined && (
                <View style={styles.recipientsInfo}>
                  <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.recipientsText}>
                    {message.recipientsCount} destinataire(s)
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderTemplatesTab = () => (
    <View style={styles.tabContent}>
      {templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>Aucun template disponible</Text>
        </View>
      ) : (
        <ScrollView style={styles.templatesList}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template._id}
              style={styles.templateCard}
              onPress={() => {
                handleUseTemplate(template);
                setActiveTab('send');
              }}
            >
              <View style={styles.templateHeader}>
                <Ionicons name="document-text" size={24} color={Colors.primary} />
                <Text style={styles.templateName}>{template.name}</Text>
              </View>
              <Text style={styles.templateTitle}>{template.title}</Text>
              <Text style={styles.templateBody} numberOfLines={2}>
                {template.body}
              </Text>
              <View style={styles.useTemplateButton}>
                <Text style={styles.useTemplateText}>Utiliser ce template</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Messages Broadcast</Text>
          <Text style={styles.sectionSubtitle}>
            Envoyez des notifications à vos utilisateurs
          </Text>
        </View>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => {
            resetForm();
            setActiveTab('send');
            setShowModal(true);
          }}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="send" size={24} color={Colors.primary} />
          <Text style={styles.statNumber}>{messages.filter((m) => m.status === 'sent').length}</Text>
          <Text style={styles.statLabel}>Envoyés</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#FFA500" />
          <Text style={styles.statNumber}>
            {messages.filter((m) => m.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Planifiés</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={24} color={Colors.accent} />
          <Text style={styles.statNumber}>{templates.length}</Text>
          <Text style={styles.statLabel}>Templates</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewHistoryButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.viewHistoryText}>Voir l'historique et gérer</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* Modal */}
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
            <Text style={styles.modalTitle}>Gestion des Messages</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'send' && styles.tabActive]}
              onPress={() => setActiveTab('send')}
            >
              <Ionicons
                name="send"
                size={20}
                color={activeTab === 'send' ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'send' && styles.tabTextActive]}>
                Envoyer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.tabActive]}
              onPress={() => setActiveTab('history')}
            >
              <Ionicons
                name="time"
                size={20}
                color={activeTab === 'history' ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                Historique
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
              onPress={() => setActiveTab('templates')}
            >
              <Ionicons
                name="document-text"
                size={20}
                color={activeTab === 'templates' ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
                Templates
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'send' && renderSendTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'templates' && renderTemplatesTab()}
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
  composeButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  viewHistoryButton: {
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
  viewHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
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
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  tabActive: {
    backgroundColor: Colors.primary + '20',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabContent: {
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
    minHeight: 120,
  },
  scheduledContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduledLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  dateTimeInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    padding: 0,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
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
  messagesList: {
    flex: 1,
  },
  messageCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  messageBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recipientsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recipientsText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  templatesList: {
    flex: 1,
  },
  templateCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  templateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  templateBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  useTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  useTemplateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
