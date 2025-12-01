import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface Zone {
  id: string;
  name: string;
  type: string;
  area: number;
  plantsCount: number;
  color: string;
}

export default function Zones() {
  const [zones, setZones] = useState<Zone[]>([
    {
      id: '1',
      name: 'Potager',
      type: 'vegetable',
      area: 25,
      plantsCount: 12,
      color: Colors.primary,
    },
    {
      id: '2',
      name: 'Jardin d\'ornement',
      type: 'ornamental',
      area: 40,
      plantsCount: 8,
      color: '#FF6B9D',
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    type: 'vegetable',
    area: '',
  });

  const zoneTypes = [
    { id: 'vegetable', label: 'Potager', icon: 'leaf', color: Colors.primary },
    { id: 'ornamental', label: 'Ornement', icon: 'flower', color: '#FF6B9D' },
    { id: 'orchard', label: 'Verger', icon: 'nutrition', color: '#FFA500' },
    { id: 'herb', label: 'Aromates', icon: 'sparkles', color: '#9C27B0' },
  ];

  const handleAddZone = () => {
    if (!newZone.name || !newZone.area) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const selectedType = zoneTypes.find(t => t.id === newZone.type);
    const zone: Zone = {
      id: Date.now().toString(),
      name: newZone.name,
      type: newZone.type,
      area: parseInt(newZone.area),
      plantsCount: 0,
      color: selectedType?.color || Colors.primary,
    };

    setZones([...zones, zone]);
    setNewZone({ name: '', type: 'vegetable', area: '' });
    setModalVisible(false);
    Alert.alert('Succès', 'Zone ajoutée avec succès !');
  };

  const handleDeleteZone = (zoneId: string) => {
    Alert.alert(
      'Supprimer la zone',
      'Êtes-vous sûr de vouloir supprimer cette zone ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => setZones(zones.filter(z => z.id !== zoneId)),
        },
      ]
    );
  };

  const getZoneIcon = (type: string) => {
    const zoneType = zoneTypes.find(t => t.id === type);
    return zoneType?.icon || 'leaf';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {zones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={80} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune zone</Text>
            <Text style={styles.emptyText}>
              Organisez votre jardin en créant des zones
            </Text>
          </View>
        ) : (
          <View style={styles.zonesGrid}>
            {zones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={styles.zoneCard}
                onLongPress={() => handleDeleteZone(zone.id)}
              >
                <View style={[styles.zoneHeader, { backgroundColor: zone.color + '20' }]}>
                  <View style={[styles.zoneIcon, { backgroundColor: zone.color }]}>
                    <Ionicons name={getZoneIcon(zone.type) as any} size={32} color={Colors.white} />
                  </View>
                  <Text style={styles.zonePlantsCount}>{zone.plantsCount} plantes</Text>
                </View>
                <View style={styles.zoneContent}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <View style={styles.zoneInfo}>
                    <Ionicons name="resize" size={16} color={Colors.textSecondary} />
                    <Text style={styles.zoneInfoText}>{zone.area} m²</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistiques</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{zones.length}</Text>
              <Text style={styles.statLabel}>Zones</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {zones.reduce((sum, z) => sum + z.area, 0)} m²
              </Text>
              <Text style={styles.statLabel}>Surface totale</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {zones.reduce((sum, z) => sum + z.plantsCount, 0)}
              </Text>
              <Text style={styles.statLabel}>Plantes</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle zone</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de la zone</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Potager, Verger..."
                placeholderTextColor={Colors.textSecondary}
                value={newZone.name}
                onChangeText={(text) => setNewZone({ ...newZone, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type de zone</Text>
              <View style={styles.typeGrid}>
                {zoneTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeCard,
                      newZone.type === type.id && { borderColor: type.color, borderWidth: 2 },
                    ]}
                    onPress={() => setNewZone({ ...newZone, type: type.id })}
                  >
                    <Ionicons name={type.icon as any} size={24} color={type.color} />
                    <Text style={styles.typeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Surface (m²)</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                value={newZone.area}
                onChangeText={(text) => setNewZone({ ...newZone, area: text })}
              />
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddZone}>
              <Text style={styles.addButtonText}>Créer la zone</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  zonesGrid: {
    padding: 16,
    gap: 16,
  },
  zoneCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  zoneIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zonePlantsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  zoneContent: {
    padding: 16,
  },
  zoneName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoneInfoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
});
