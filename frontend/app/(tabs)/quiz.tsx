import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QuizScreen() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [todayQuestion, setTodayQuestion] = useState<any>(null);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showEnvelope, setShowEnvelope] = useState(true);
  
  // Animation pour l'enveloppe
  const envelopeAnim = useState(new Animated.Value(0))[0];
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    loadQuizData();
  }, []);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      // Charger les stats
      const statsResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/quiz/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
        setAlreadyAnswered(statsData.todayAnswered);

        // Si pas encore répondu, charger la question du jour
        if (!statsData.todayAnswered) {
          const questionResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/quiz/today`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (questionResponse.ok) {
            const questionData = await questionResponse.json();
            if (!questionData.alreadyAnswered) {
              setTodayQuestion(questionData.question);
              setStartTime(Date.now());
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEnvelope = () => {
    Animated.timing(envelopeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setShowEnvelope(false);
    });
  };

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/quiz/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: todayQuestion.id,
          selectedAnswer: selectedAnswer,
          timeSpent: timeSpent,
        }),
      });

      if (response.ok) {
        const resultData = await response.json();
        setResult(resultData);
        setShowResult(true);
        
        // Recharger les stats
        await loadQuizData();
      }
    } catch (error) {
      console.error('Erreur soumission réponse:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !todayQuestion) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // Écran "Déjà répondu"
  if (alreadyAnswered && !todayQuestion) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.accent} />
          <Text style={styles.doneTitle}>✅ Question complétée !</Text>
          <Text style={styles.doneText}>
            Vous avez déjà répondu à la question du jour.
          </Text>
          <Text style={styles.doneText}>
            Revenez demain à 7h00 pour une nouvelle question ! 🌅
          </Text>
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>📊 Vos statistiques</Text>
            
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>🔥 Série actuelle</Text>
              <Text style={styles.statValue}>{stats.currentStreak} jours</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>⭐ Total XP</Text>
              <Text style={styles.statValue}>{stats.totalXP} points</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>✅ Taux de réussite</Text>
              <Text style={styles.statValue}>
                {stats.totalAnswered > 0 
                  ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
                  : 0}%
              </Text>
            </View>

            {stats.badges && stats.badges.length > 0 && (
              <View style={styles.badgesContainer}>
                <Text style={styles.badgesTitle}>🏆 Vos badges</Text>
                {stats.badges.map((badge: any) => (
                  <View key={badge.id} style={styles.badgeCard}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <View style={styles.badgeContent}>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                      <Text style={styles.badgeDescription}>{badge.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  // Écran "Animation enveloppe"
  if (showEnvelope && todayQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.envelopeContainer}>
          <Animated.View
            style={[
              styles.envelope,
              {
                transform: [
                  {
                    rotateX: envelopeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  },
                ],
                opacity: envelopeAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0.5, 0],
                }),
              },
            ]}
          >
            <Ionicons name="mail" size={120} color={Colors.accent} />
          </Animated.View>

          <Text style={styles.envelopeTitle}>🏆 Question du MOF</Text>
          <Text style={styles.envelopeSubtitle}>Touchez pour découvrir</Text>

          <TouchableOpacity style={styles.openButton} onPress={openEnvelope}>
            <Ionicons name="arrow-down-circle" size={24} color={Colors.white} />
            <Text style={styles.openButtonText}>Ouvrir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Écran "Résultat"
  if (showResult && result) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.resultCard, result.correct ? styles.correctCard : styles.incorrectCard]}>
          <Ionicons 
            name={result.correct ? "checkmark-circle" : "close-circle"} 
            size={80} 
            color={result.correct ? Colors.accent : Colors.error} 
          />
          <Text style={styles.resultTitle}>
            {result.correct ? '🎉 Bravo !' : '❌ Pas tout à fait'}
          </Text>
          <Text style={styles.resultText}>
            {result.correct 
              ? 'Vous avez trouvé la bonne réponse !'
              : `La bonne réponse était : ${String.fromCharCode(65 + result.correctAnswer)}`}
          </Text>
          
          <View style={styles.xpCard}>
            <Text style={styles.xpText}>+{result.xpEarned} XP</Text>
            <Text style={styles.streakText}>🔥 Série : {result.newStreak} jours</Text>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>💡 Explication du MOF</Text>
          <Text style={styles.explanationText}>{result.explanation}</Text>
        </View>

        {result.badgesEarned && result.badgesEarned.length > 0 && (
          <View style={styles.newBadgesCard}>
            <Text style={styles.newBadgesTitle}>🎁 Nouveau badge débloqué !</Text>
            {result.badgesEarned.map((badgeId: string) => (
              <Text key={badgeId} style={styles.newBadgeText}>
                🏆 Badge obtenu !
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {
            setShowResult(false);
            setAlreadyAnswered(true);
            setTodayQuestion(null);
            loadQuizData();
          }}
        >
          <Text style={styles.doneButtonText}>Terminer</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Écran "Question"
  if (todayQuestion && !showResult) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionNumber}>Question du {new Date().toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.questionText}>{todayQuestion.question}</Text>
        </View>

        <View style={styles.answersContainer}>
          {todayQuestion.answers.map((answer: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.answerButton,
                selectedAnswer === index && styles.selectedAnswer,
              ]}
              onPress={() => handleSelectAnswer(index)}
              disabled={loading}
            >
              <View style={styles.answerLetter}>
                <Text style={styles.answerLetterText}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <Text style={styles.answerText}>{answer}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (selectedAnswer === null || loading) && styles.disabledButton]}
          onPress={handleSubmitAnswer}
          disabled={selectedAnswer === null || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
              <Text style={styles.submitButtonText}>Valider ma réponse</Text>
            </>
          )}
        </TouchableOpacity>

        {stats && (
          <View style={styles.miniStats}>
            <Text style={styles.miniStatText}>🔥 {stats.currentStreak} jours</Text>
            <Text style={styles.miniStatText}>⭐ {stats.totalXP} XP</Text>
            <Text style={styles.miniStatText}>✅ {stats.totalCorrect}/{stats.totalAnswered}</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.noQuestionText}>Pas de question disponible pour aujourd'hui 🤔</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  envelopeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  envelope: {
    marginBottom: 40,
  },
  envelopeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  envelopeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  openButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  questionCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questionNumber: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 28,
  },
  answersContainer: {
    gap: 12,
    marginBottom: 24,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedAnswer: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  answerLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
  },
  miniStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  resultCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
  },
  correctCard: {
    backgroundColor: Colors.accent + '20',
  },
  incorrectCard: {
    backgroundColor: Colors.error + '20',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  xpCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
  },
  xpText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  streakText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
  },
  explanationCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  newBadgesCard: {
    backgroundColor: Colors.accent + '20',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  newBadgesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  newBadgeText: {
    fontSize: 16,
    color: Colors.text,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  doneCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 24,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  doneText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    gap: 12,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  badgesContainer: {
    marginTop: 24,
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeContent: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  badgeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  noQuestionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: 40,
  },
});
