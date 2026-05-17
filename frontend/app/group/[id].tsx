import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { API_URL } from '../../constants/api';
import { Expense, BalanceResponse } from '../../types';

type Tab = 'expenses' | 'balances';

export default function GroupScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<string[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [groupRes, expRes, balRes] = await Promise.all([
        fetch(`${API_URL}/groups/${id}`),
        fetch(`${API_URL}/expenses/${id}`),
        fetch(`${API_URL}/balances/${id}`),
      ]);
      const group = await groupRes.json();
      const exps = await expRes.json();
      const bals = await balRes.json();
      setMembers(group.members || []);
      setExpenses(exps.reverse());
      setBalances(bals);
    } catch {
      Alert.alert('Error', 'Could not load group data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, [id]));

  const deleteExpense = (expId: string, title: string) => {
    Alert.alert('Delete Expense', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await fetch(`${API_URL}/expenses/${expId}`, { method: 'DELETE' });
          fetchAll();
        }
      }
    ]);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.groupName}>{name}</Text>
        <Text style={styles.memberList}>{members.join(' · ')}</Text>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>RM {totalSpent.toFixed(2)}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'expenses' && styles.activeTab]}
          onPress={() => setTab('expenses')}
        >
          <Text style={[styles.tabText, tab === 'expenses' && styles.activeTabText]}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'balances' && styles.activeTab]}
          onPress={() => setTab('balances')}
        >
          <Text style={[styles.tabText, tab === 'balances' && styles.activeTabText]}>Balances</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 40 }} />
      ) : tab === 'expenses' ? (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🧾</Text>
              <Text style={styles.emptyText}>No expenses yet. Add one!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.expenseCard}
              onLongPress={() => deleteExpense(item.id, item.title)}
            >
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseTitle}>{item.title}</Text>
                <Text style={styles.expenseSub}>Paid by {item.paid_by}</Text>
                <Text style={styles.expenseSplit}>
                  Split: {item.split_between.join(', ')}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>RM {item.amount.toFixed(2)}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={balances?.settlements ?? []}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <Text style={styles.sectionTitle}>Who owes who</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>Everyone is settled up!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.settlementCard}>
              <View style={styles.settlementPerson}>
                <Text style={styles.settlementName}>{item.from}</Text>
                <Text style={styles.settlementArrow}>→</Text>
                <Text style={styles.settlementName}>{item.to}</Text>
              </View>
              <Text style={styles.settlementAmount}>RM {item.amount.toFixed(2)}</Text>
            </View>
          )}
        />
      )}

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => router.push({ pathname: '/scanner', params: { id, members: JSON.stringify(members) } })}
        >
          <Text style={styles.scanTxt}>📷 Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push({ pathname: '/add-expense', params: { id, members: JSON.stringify(members) } })}
        >
          <Text style={styles.addTxt}>＋  Add Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EFFF' },

  headerCard: {
    backgroundColor: '#6C63FF',
    padding: 24, paddingBottom: 28,
    alignItems: 'center',
  },
  groupName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  memberList: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase' },
  totalAmount: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 4 },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 4,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#6C63FF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9B97B2' },
  activeTabText: { color: '#fff' },

  list: { padding: 16, paddingBottom: 120 },

  expenseCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  expenseLeft: { flex: 1 },
  expenseTitle: { fontSize: 16, fontWeight: '700', color: '#2D2A4A' },
  expenseSub: { fontSize: 13, color: '#9B97B2', marginTop: 3 },
  expenseSplit: { fontSize: 12, color: '#C4C0D8', marginTop: 2 },
  expenseAmount: { fontSize: 17, fontWeight: '800', color: '#6C63FF' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6C63FF', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },

  settlementCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  settlementPerson: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settlementName: { fontSize: 15, fontWeight: '700', color: '#2D2A4A' },
  settlementArrow: { fontSize: 18, color: '#6C63FF' },
  settlementAmount: { fontSize: 17, fontWeight: '800', color: '#FF6B6B' },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#9B97B2' },

  bottomBar: {
    position: 'absolute', bottom: 28, left: 16, right: 16,
    flexDirection: 'row', gap: 12,
  },
  scanBtn: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, alignItems: 'center',
    flex: 0.4,
    borderWidth: 2, borderColor: '#6C63FF',
  },
  scanTxt: { color: '#6C63FF', fontSize: 15, fontWeight: '700' },
  addBtn: {
    backgroundColor: '#6C63FF', borderRadius: 16,
    padding: 16, alignItems: 'center', flex: 0.6,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  addTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
