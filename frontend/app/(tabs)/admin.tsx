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
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [seasonTips, setSeasonTips] = useState<any[]>([]);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showEmailsModal, setShowEmailsModal] = useState(false);
  const [showCalendarTaskModal, setShowCalendarTaskModal] = useState(false);
  const [exportedEmails, setExportedEmails] = useState<any[]>([]);
  const [currentTip, setCurrentTip] = useState<any>(null);
  
  // Calendar tasks state
  const [calendarTasks, setCalendarTasks] = useState<any[]>([]);
  const [currentCalendarTask, setCurrentCalendarTask] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskWeekNumber, setTaskWeekNumber] = useState('1');
  const [taskType, setTaskType] = useState('general');
  const [taskPriority, setTaskPriority] = useState('optionnel');
  
  // Quiz questions state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState<any>(null);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizAnswers, setQuizAnswers] = useState(['', '', '', '']);
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState(0);
  const [quizExplanation, setQuizExplanation] = useState('');
  const [quizScheduledDate, setQuizScheduledDate] = useState('');
  const [quizCategory, setQuizCategory] = useState('general');
  
  // Analytics stats
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Form states
  const [season, setSeason] = useState('spring');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [icon, setIcon] = useState('flower');
  const [color, setColor] = useState('#4CAF50');
  
  // Message state
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [broadcastMessages, setBroadcastMessages] = useState<any[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<any[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadSeasonTips();
    loadAnalytics();
    loadCalendarTasks();
    loadQuizQuestions();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/analytics/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleExportEmails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      console.log('🔄 Export des emails en cours...');
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/analytics/export-emails`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📡 Réponse reçue:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Données reçues:', data.count, 'emails');
        
        // Stocker les emails et ouvrir le modal
        setExportedEmails(data.emails);
        setShowEmailsModal(true);
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur réponse:', errorText);
        Alert.alert('Erreur', `Impossible d'exporter les emails (${response.status})`);
      }
    } catch (error) {
      console.error('❌ Erreur export:', error);
      Alert.alert('Erreur', `Erreur réseau: ${error}`);
    } finally {
      setLoading(false);
      console.log('🏁 Export terminé');
    }
  };

  const loadSeasonTips = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/season-tips`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSeasonTips(data);
      }
    } catch (error) {
      console.error('Erreur chargement conseils:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTip = async () => {
    if (!title || !text) {
      Alert.alert('Erreur', 'Titre et texte sont requis');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/season-tips`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ season, title, text, icon, color }),
      });

      if (response.ok) {
        Alert.alert('Succès', 'Conseil de saison enregistré !');
        setShowTipModal(false);
        resetTipForm();
        await loadSeasonTips();
      } else {
        Alert.alert('Erreur', 'Impossible de sauvegarder le conseil');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTip = async (seasonToDelete: string) => {
    Alert.alert(
      'Confirmer',
      'Supprimer ce conseil de saison ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/season-tips/${seasonToDelete}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Succès', 'Conseil supprimé');
                await loadSeasonTips();
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!messageTitle || !messageContent) {
      Alert.alert('Erreur', 'Titre et contenu sont requis');
      return;
    }

    Alert.alert(
      'Fonctionnalité à venir',
      'L\'envoi de messages aux utilisateurs sera bientôt disponible.',
      [{ text: 'OK' }]
    );
    
    // TODO: Implémenter l'envoi de push notifications ou emails
  };

  // ============ CALENDAR TASKS FUNCTIONS ============
  const loadCalendarTasks = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/calendar-tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCalendarTasks(data);
        console.log('✅ Tâches calendrier chargées:', data.length);
      }
    } catch (error) {
      console.error('Erreur chargement tâches calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCalendarTask = async () => {
    if (!taskTitle || !taskDescription) {
      Alert.alert('Erreur', 'Titre et description sont requis');
      return;
    }

    const weekNum = parseInt(taskWeekNumber);
    if (weekNum < 1 || weekNum > 52) {
      Alert.alert('Erreur', 'Le numéro de semaine doit être entre 1 et 52');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const taskData = {
        title: taskTitle,
        description: taskDescription,
        weekNumber: weekNum,
        taskType: taskType,
        priority: taskPriority,
      };

      const url = currentCalendarTask
        ? `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/calendar-tasks/${currentCalendarTask.id}`
        : `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/calendar-tasks`;
      
      const method = currentCalendarTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        Alert.alert('Succès', 'Tâche enregistrée !');
        setShowCalendarTaskModal(false);
        resetCalendarTaskForm();
        await loadCalendarTasks();
      } else {
        Alert.alert('Erreur', 'Impossible de sauvegarder la tâche');
      }
    } catch (error) {
      console.error('Erreur sauvegarde tâche:', error);
      Alert.alert('Erreur', 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCalendarTask = async (taskId: string) => {
    Alert.alert(
      'Confirmer',
      'Supprimer cette tâche du calendrier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/calendar-tasks/${taskId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Succès', 'Tâche supprimée');
                await loadCalendarTasks();
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  const handleDistributeTasks = async () => {
    Alert.alert(
      'Distribuer les tâches',
      'Cette action va distribuer les tâches de la semaine actuelle à tous les utilisateurs. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Distribuer',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('authToken');
              
              console.log('🚀 Lancement de la distribution...');
              
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/calendar-tasks/distribute`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                const data = await response.json();
                console.log('✅ Distribution réussie:', data);
                
                Alert.alert(
                  '✅ Distribution réussie',
                  `${data.tasksDistributed} tâches distribuées à ${data.usersCount} utilisateurs pour la semaine ${data.weekNumber}`,
                  [{ text: 'OK' }]
                );
              } else {
                const errorText = await response.text();
                console.error('❌ Erreur distribution:', errorText);
                Alert.alert('Erreur', 'Impossible de distribuer les tâches');
              }
            } catch (error) {
              console.error('❌ Erreur distribution:', error);
              Alert.alert('Erreur', `Erreur réseau: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetCalendarTaskForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskWeekNumber('1');
    setTaskType('general');
    setTaskPriority('optionnel');
    setCurrentCalendarTask(null);
  };

  // ============ QUIZ FUNCTIONS ============
  const loadQuizQuestions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/quiz/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuizQuestions(data);
        console.log('✅ Questions quiz chargées:', data.length);
      }
    } catch (error) {
      console.error('Erreur chargement questions quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuizQuestion = async () => {
    if (!quizQuestion || !quizExplanation || !quizScheduledDate) {
      Alert.alert('Erreur', 'Question, explication et date sont requis');
      return;
    }

    // Vérifier que les 4 réponses sont remplies
    if (quizAnswers.some(a => !a.trim())) {
      Alert.alert('Erreur', 'Les 4 réponses doivent être remplies');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const questionData = {
        question: quizQuestion,
        answers: quizAnswers,
        correctAnswer: quizCorrectAnswer,
        explanation: quizExplanation,
        scheduledDate: quizScheduledDate,
        difficulty: 'medium',
        category: quizCategory,
      };

      const url = currentQuizQuestion
        ? `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/quiz/questions/${currentQuizQuestion.id}`
        : `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/quiz/questions`;
      
      const method = currentQuizQuestion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      if (response.ok) {
        Alert.alert('Succès', 'Question enregistrée !');
        setShowQuizModal(false);
        resetQuizForm();
        await loadQuizQuestions();
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.detail || 'Impossible de sauvegarder la question');
      }
    } catch (error) {
      console.error('Erreur sauvegarde question:', error);
      Alert.alert('Erreur', 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuizQuestion = async (questionId: string) => {
    Alert.alert(
      'Confirmer',
      'Supprimer cette question ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/quiz/questions/${questionId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Succès', 'Question supprimée');
                await loadQuizQuestions();
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  const resetQuizForm = () => {
    setQuizQuestion('');
    setQuizAnswers(['', '', '', '']);
    setQuizCorrectAnswer(0);
    setQuizExplanation('');
    setQuizScheduledDate('');
    setQuizCategory('general');
    setCurrentQuizQuestion(null);
  };

  const resetTipForm = () => {
    setSeason('spring');
    setTitle('');
    setText('');
    setIcon('flower');
    setColor('#4CAF50');
    setCurrentTip(null);
  };

  const seasonsData = [
    { key: 'spring', label: 'Printemps', icon: 'flower', color: '#4CAF50' },
    { key: 'summer', label: 'Été', icon: 'sunny', color: '#FFA726' },
    { key: 'fall', label: 'Automne', icon: 'leaf', color: '#FF8C00' },
    { key: 'winter', label: 'Hiver', icon: 'snow', color: '#4A90E2' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panneau Admin</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Section: Statistiques */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={24} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Statistiques de l'app</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Vue d'ensemble des performances de Sepalis
        </Text>

        {loadingAnalytics ? (
          <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
        ) : analytics ? (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="people" size={28} color={Colors.primary} />
                <Text style={styles.statValue}>{analytics.overview?.totalUsers || 0}</Text>
                <Text style={styles.statLabel}>Utilisateurs</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: Colors.accent + '20' }]}>
                <Ionicons name="person-add" size={28} color={Colors.accent} />
                <Text style={styles.statValue}>{analytics.overview?.newUsersThisWeek || 0}</Text>
                <Text style={styles.statLabel}>Nouveaux (7j)</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="diamond" size={28} color={Colors.success} />
                <Text style={styles.statValue}>{analytics.overview?.premiumUsers || 0}</Text>
                <Text style={styles.statLabel}>Premium</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: Colors.warning + '20' }]}>
                <Ionicons name="time" size={28} color={Colors.warning} />
                <Text style={styles.statValue}>{analytics.overview?.trialUsers || 0}</Text>
                <Text style={styles.statLabel}>En essai</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#9C27B0' + '20' }]}>
                <Ionicons name="pulse" size={28} color="#9C27B0" />
                <Text style={styles.statValue}>{analytics.overview?.activeUsers || 0}</Text>
                <Text style={styles.statLabel}>Actifs (7j)</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#FF5722' + '20' }]}>
                <Ionicons name="trending-up" size={28} color="#FF5722" />
                <Text style={styles.statValue}>{analytics.overview?.conversionRate || 0}%</Text>
                <Text style={styles.statLabel}>Conversion</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportEmails}
            >
              <Ionicons name="download" size={20} color={Colors.white} />
              <Text style={styles.exportButtonText}>Exporter les emails</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noDataText}>Aucune donnée disponible</Text>
        )}
      </View>

      {/* Section: Conseils de saison */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb" size={24} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Conseils de saison</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Personnalisez les conseils qui apparaissent sur la page d'accueil selon les saisons
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetTipForm();
            setShowTipModal(true);
          }}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Créer/Modifier un conseil</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.tipsList}>
            {seasonTips.map((tip) => (
              <View key={tip.season} style={styles.tipCard}>
                <View style={[styles.tipIcon, { backgroundColor: tip.color + '30' }]}>
                  <Ionicons name={tip.icon as any} size={24} color={tip.color} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipText} numberOfLines={2}>{tip.text}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTip(tip.season)}
                >
                  <Ionicons name="trash" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Section: Messages */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="megaphone" size={24} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Messages utilisateurs</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Envoyez des messages hebdomadaires à tous les utilisateurs
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowMessageModal(true)}
        >
          <Ionicons name="send" size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Envoyer un message</Text>
        </TouchableOpacity>
      </View>

      {/* Section: Calendrier annuel MOF */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={24} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Calendrier annuel MOF</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Créez des tâches de jardinage qui seront automatiquement diffusées aux utilisateurs à la bonne période
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[styles.addButton, { flex: 1 }]}
            onPress={() => {
              resetCalendarTaskForm();
              setShowCalendarTaskModal(true);
            }}
          >
            <Ionicons name="add-circle" size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Créer une tâche</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { flex: 1, backgroundColor: Colors.primary }]}
            onPress={handleDistributeTasks}
          >
            <Ionicons name="share-social" size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Distribuer</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.tipsList}>
            {calendarTasks.map((task) => (
              <View key={task.id} style={styles.tipCard}>
                <View style={[styles.tipIcon, { backgroundColor: Colors.primary + '30' }]}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.primary }}>
                    S{task.weekNumber}
                  </Text>
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{task.title}</Text>
                  <Text style={styles.tipText} numberOfLines={2}>{task.description}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: Colors.textSecondary }}>
                      {task.taskType === 'watering' ? '💧 Arrosage' :
                       task.taskType === 'pruning' ? '✂️ Taille' :
                       task.taskType === 'fertilizing' ? '🌱 Fertilisation' :
                       task.taskType === 'planting' ? '🪴 Plantation' : '📝 Général'}
                    </Text>
                    <Text style={{ fontSize: 11, color: 
                      task.priority === 'urgent' ? Colors.error :
                      task.priority === 'important' ? Colors.warning : Colors.textSecondary
                    }}>
                      {task.priority === 'urgent' ? '🔴 Urgent' :
                       task.priority === 'important' ? '🟡 Important' : '⚪ Optionnel'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCalendarTask(task.id)}
                >
                  <Ionicons name="trash" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {calendarTasks.length === 0 && (
              <Text style={styles.noDataText}>Aucune tâche programmée</Text>
            )}
          </View>
        )}
      </View>

      {/* Section: Quiz Quotidien MOF */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="help-circle" size={24} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Quiz Quotidien MOF</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Créez des questions pour le quiz quotidien. Les utilisateurs recevront une question par jour pour tester leurs connaissances.
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetQuizForm();
            // Pré-remplir la date d'aujourd'hui
            const today = new Date().toISOString().split('T')[0];
            setQuizScheduledDate(today);
            setShowQuizModal(true);
          }}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Créer une question</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.tipsList}>
            {quizQuestions.map((q) => (
              <View key={q.id} style={styles.tipCard}>
                <View style={[styles.tipIcon, { backgroundColor: Colors.primary + '30' }]}>
                  <Ionicons name="help-circle" size={24} color={Colors.primary} />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{q.question}</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>
                    📅 {new Date(q.scheduledDate).toLocaleDateString('fr-FR')} • 📂 {q.category}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteQuizQuestion(q.id)}
                >
                  <Ionicons name="trash" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {quizQuestions.length === 0 && (
              <Text style={styles.noDataText}>Aucune question créée</Text>
            )}
          </View>
        )}
      </View>

      {/* Modal: Créer/Modifier conseil */}
      <Modal
        visible={showTipModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Conseil de saison</Text>
              <TouchableOpacity onPress={() => setShowTipModal(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Saison</Text>
              <View style={styles.seasonButtons}>
                {seasonsData.map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.seasonButton,
                      season === s.key && { backgroundColor: s.color + '30', borderColor: s.color },
                    ]}
                    onPress={() => setSeason(s.key)}
                  >
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                    <Text style={styles.seasonButtonText}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Titre</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Printemps - Temps de plantation"
              />

              <Text style={styles.label}>Texte du conseil</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={text}
                onChangeText={setText}
                placeholder="Conseil détaillé..."
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Icône</Text>
              <TextInput
                style={styles.input}
                value={icon}
                onChangeText={setIcon}
                placeholder="Ex: flower, sunny, leaf, snow"
              />

              <Text style={styles.label}>Couleur (Hex)</Text>
              <TextInput
                style={styles.input}
                value={color}
                onChangeText={setColor}
                placeholder="Ex: #4CAF50"
              />

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSaveTip}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Envoyer message */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Envoyer un message</Text>
              <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Titre du message</Text>
              <TextInput
                style={styles.input}
                value={messageTitle}
                onChangeText={setMessageTitle}
                placeholder="Ex: Nouveaux conseils de printemps"
              />

              <Text style={styles.label}>Contenu</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={messageContent}
                onChangeText={setMessageContent}
                placeholder="Message pour les utilisateurs..."
                multiline
                numberOfLines={6}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSendMessage}
              >
                <Ionicons name="send" size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Envoyer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Exporter emails */}
      <Modal
        visible={showEmailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📧 Export des emails ({exportedEmails.length})</Text>
              <TouchableOpacity onPress={() => setShowEmailsModal(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionDesc}>
                Liste complète des emails de tous les utilisateurs inscrits :
              </Text>
              
              {exportedEmails.map((user, index) => (
                <View key={index} style={styles.emailCard}>
                  <View style={styles.emailIcon}>
                    <Ionicons name="mail" size={20} color={Colors.accent} />
                  </View>
                  <View style={styles.emailContent}>
                    <Text style={styles.emailAddress}>{user.email}</Text>
                    <Text style={styles.emailName}>{user.name}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.emailActionsContainer}>
                <Text style={styles.label}>Copier tous les emails :</Text>
                <View style={styles.emailCopyBox}>
                  <Text style={styles.emailCopyText} selectable>
                    {exportedEmails.map(e => e.email).join(', ')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => setShowEmailsModal(false)}
              >
                <Ionicons name="checkmark" size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Créer/Modifier tâche calendrier */}
      <Modal
        visible={showCalendarTaskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendarTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tâche du calendrier MOF</Text>
              <TouchableOpacity onPress={() => setShowCalendarTaskModal(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Titre de la tâche *</Text>
              <TextInput
                style={styles.input}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Ex: Tailler les rosiers"
              />

              <Text style={styles.label}>Description détaillée *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder="Conseil détaillé du MOF pour cette tâche..."
                multiline
                numberOfLines={6}
              />

              <Text style={styles.label}>Semaine de l'année (1-52) *</Text>
              <TextInput
                style={styles.input}
                value={taskWeekNumber}
                onChangeText={setTaskWeekNumber}
                placeholder="Ex: 12"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Type de tâche</Text>
              <View style={styles.seasonButtons}>
                {[
                  { key: 'general', label: '📝 Général' },
                  { key: 'watering', label: '💧 Arrosage' },
                  { key: 'pruning', label: '✂️ Taille' },
                  { key: 'fertilizing', label: '🌱 Fertilisation' },
                  { key: 'planting', label: '🪴 Plantation' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.seasonButton,
                      taskType === type.key && { backgroundColor: Colors.accent + '30', borderColor: Colors.accent },
                    ]}
                    onPress={() => setTaskType(type.key)}
                  >
                    <Text style={styles.seasonButtonText}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Priorité</Text>
              <View style={styles.seasonButtons}>
                {[
                  { key: 'optionnel', label: '⚪ Optionnel', color: Colors.textSecondary },
                  { key: 'important', label: '🟡 Important', color: Colors.warning },
                  { key: 'urgent', label: '🔴 Urgent', color: Colors.error },
                ].map((priority) => (
                  <TouchableOpacity
                    key={priority.key}
                    style={[
                      styles.seasonButton,
                      taskPriority === priority.key && { 
                        backgroundColor: priority.color + '20', 
                        borderColor: priority.color 
                      },
                    ]}
                    onPress={() => setTaskPriority(priority.key)}
                  >
                    <Text style={styles.seasonButtonText}>{priority.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSaveCalendarTask}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Créer/Modifier question quiz */}
      <Modal
        visible={showQuizModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuizModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💡 Question du Quiz MOF</Text>
              <TouchableOpacity onPress={() => setShowQuizModal(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Question *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={quizQuestion}
                onChangeText={setQuizQuestion}
                placeholder="Ex: Quelle est la meilleure période pour tailler les rosiers ?"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Réponse A *</Text>
              <TextInput
                style={styles.input}
                value={quizAnswers[0]}
                onChangeText={(text) => {
                  const newAnswers = [...quizAnswers];
                  newAnswers[0] = text;
                  setQuizAnswers(newAnswers);
                }}
                placeholder="Première réponse"
              />

              <Text style={styles.label}>Réponse B *</Text>
              <TextInput
                style={styles.input}
                value={quizAnswers[1]}
                onChangeText={(text) => {
                  const newAnswers = [...quizAnswers];
                  newAnswers[1] = text;
                  setQuizAnswers(newAnswers);
                }}
                placeholder="Deuxième réponse"
              />

              <Text style={styles.label}>Réponse C *</Text>
              <TextInput
                style={styles.input}
                value={quizAnswers[2]}
                onChangeText={(text) => {
                  const newAnswers = [...quizAnswers];
                  newAnswers[2] = text;
                  setQuizAnswers(newAnswers);
                }}
                placeholder="Troisième réponse"
              />

              <Text style={styles.label}>Réponse D *</Text>
              <TextInput
                style={styles.input}
                value={quizAnswers[3]}
                onChangeText={(text) => {
                  const newAnswers = [...quizAnswers];
                  newAnswers[3] = text;
                  setQuizAnswers(newAnswers);
                }}
                placeholder="Quatrième réponse"
              />

              <Text style={styles.label}>Bonne réponse *</Text>
              <View style={styles.seasonButtons}>
                {['A', 'B', 'C', 'D'].map((letter, index) => (
                  <TouchableOpacity
                    key={letter}
                    style={[
                      styles.seasonButton,
                      quizCorrectAnswer === index && { 
                        backgroundColor: Colors.accent + '30', 
                        borderColor: Colors.accent 
                      },
                    ]}
                    onPress={() => setQuizCorrectAnswer(index)}
                  >
                    <Text style={styles.seasonButtonText}>{letter}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Explication du MOF *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={quizExplanation}
                onChangeText={setQuizExplanation}
                placeholder="Expliquez pourquoi c'est la bonne réponse et donnez des conseils..."
                multiline
                numberOfLines={5}
              />

              <Text style={styles.label}>Date de publication * (AAAA-MM-JJ)</Text>
              <TextInput
                style={styles.input}
                value={quizScheduledDate}
                onChangeText={setQuizScheduledDate}
                placeholder="2025-12-07"
              />

              <Text style={styles.label}>Catégorie</Text>
              <View style={styles.seasonButtons}>
                {[
                  { key: 'general', label: '📝 Général' },
                  { key: 'roses', label: '🌹 Roses' },
                  { key: 'potager', label: '🥕 Potager' },
                  { key: 'interieur', label: '🪴 Intérieur' },
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.seasonButton,
                      quizCategory === cat.key && { 
                        backgroundColor: Colors.accent + '30', 
                        borderColor: Colors.accent 
                      },
                    ]}
                    onPress={() => setQuizCategory(cat.key)}
                  >
                    <Text style={styles.seasonButtonText}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSaveQuizQuestion}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  section: {
    padding: 20,
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  disabledButton: {
    backgroundColor: Colors.border,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  tipsList: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
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
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  seasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  seasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  seasonButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    marginBottom: 8,
  },
  emailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailContent: {
    flex: 1,
  },
  emailAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  emailName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emailActionsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emailCopyBox: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailCopyText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
});
