import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { API_URL } from '../constants/api';
import { Group } from '../types';

export default function HomeScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_URL}/groups`);
      const data = await res.json();
      setGroups(data.reverse()); // newest first
    } catch {
      Alert.alert('Connection Error', 'Make sure your backend is running and your IP is correct in constants/api.ts');
    } finally {
      setLoading(false);
    }
  };

  // Refresh every time user comes back to this screen
  useFocusEffect(useCallback(() => { fetchGroups(); }, []));

  const deleteGroup = (id: string, name: string) => {
    Alert.alert('Delete Group', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await fetch(`${API_URL}/groups/${id}`, { method: 'DELETE' });
          fetchGroups();
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 60 }} />
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💸</Text>
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptyText}>Create a group to start splitting expenses with friends</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/group/[id]', params: { id: item.id, name: item.name } })}
              onLongPress={() => deleteGroup(item.id, item.name)}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardEmoji}>👥</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSub}>
                  {item.members.join(', ')}
                </Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-group')}>
        <Text style={styles.fabText}>＋  New Group</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EFFF' },
  list: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  cardIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '700', color: '#2D2A4A' },
  cardSub: { fontSize: 13, color: '#9B97B2', marginTop: 3 },
  cardArrow: { fontSize: 28, color: '#6C63FF' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 72, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#2D2A4A', marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#9B97B2', textAlign: 'center', lineHeight: 22 },

  fab: {
    position: 'absolute', bottom: 36, left: 24, right: 24,
    backgroundColor: '#6C63FF', borderRadius: 18,
    padding: 18, alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  fabText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});
