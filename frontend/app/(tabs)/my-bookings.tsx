import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { userAPI } from '../../services/api';

export default function MyBookings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'workshops' | 'courses'>('all');
  const [stats, setStats] = useState({ total: 0, workshops: 0, courses: 0 });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await userAPI.getUserBookings();
      setBookings(response.data.bookings);
      setStats({
        total: response.data.total,
        workshops: response.data.workshops,
        courses: response.data.courses,
      });
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getFilteredBookings = () => {
    if (filter === 'all') return bookings;
    return bookings.filter(b => b.type === (filter === 'workshops' ? 'workshop' : 'course'));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isUpcoming = (booking: any) => {
    if (booking.type === 'course') return true; // Formations en ligne toujours accessibles
    if (!booking.date) return false;
    return new Date(booking.date) >= new Date();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes réservations</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </View>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes réservations</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={Colors.accent} />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="location" size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{stats.workshops}</Text>
            <Text style={styles.statLabel}>Ateliers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="school" size={24} color={Colors.success} />
            <Text style={styles.statNumber}>{stats.courses}</Text>
            <Text style={styles.statLabel}>Formations</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'workshops' && styles.filterButtonActive]}
            onPress={() => setFilter('workshops')}
          >
            <Text style={[styles.filterText, filter === 'workshops' && styles.filterTextActive]}>
              Ateliers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'courses' && styles.filterButtonActive]}
            onPress={() => setFilter('courses')}
          >
            <Text style={[styles.filterText, filter === 'courses' && styles.filterTextActive]}>
              Formations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={80} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune réservation</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Vous n\'avez pas encore de réservation'
                : filter === 'workshops'
                ? 'Vous n\'avez pas d\'atelier réservé'
                : 'Vous n\'avez pas de formation'}
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <TouchableOpacity key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={[
                  styles.bookingTypeBadge,
                  booking.type === 'workshop' ? styles.workshopBadge : styles.courseBadge
                ]}>
                  <Ionicons
                    name={booking.type === 'workshop' ? 'location' : 'school'}
                    size={16}
                    color={Colors.dark}
                  />
                  <Text style={styles.bookingTypeText}>
                    {booking.type === 'workshop' ? 'Atelier' : 'Formation'}
                  </Text>
                </View>
                {isUpcoming(booking) && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {booking.type === 'course' ? 'En ligne' : 'À venir'}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.bookingTitle}>{booking.title}</Text>

              {booking.type === 'workshop' ? (
                <>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>{formatDate(booking.date)}</Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>{booking.timeSlotDisplay}</Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>
                      {booking.participants} participant{booking.participants > 1 ? 's' : ''}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>{booking.duration}</Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Ionicons name="bar-chart-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>{booking.level}</Text>
                  </View>
                </>
              )}

              <View style={styles.bookingFooter}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Payé :</Text>
                  <Text style={styles.priceAmount}>{booking.totalAmount}€</Text>
                </View>
                <View style={[
                  styles.paymentStatusBadge,
                  booking.paymentStatus === 'paid' && styles.paidBadge
                ]}>
                  <Ionicons
                    name={booking.paymentStatus === 'paid' ? 'checkmark-circle' : 'time'}
                    size={14}
                    color={booking.paymentStatus === 'paid' ? Colors.success : Colors.textSecondary}
                  />
                  <Text style={[
                    styles.paymentStatusText,
                    booking.paymentStatus === 'paid' && styles.paidText
                  ]}>
                    {booking.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.dark,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  workshopBadge: {
    backgroundColor: Colors.primary,
  },
  courseBadge: {
    backgroundColor: Colors.success,
  },
  bookingTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.accent + '20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bookingDetailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary + '20',
  },
  paidBadge: {
    backgroundColor: Colors.success + '20',
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  paidText: {
    color: Colors.success,
  },
});
