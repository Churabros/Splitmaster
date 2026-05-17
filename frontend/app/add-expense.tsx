import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { API_URL } from '../constants/api';

export default function AddExpenseScreen() {
  const { id, members: membersParam, prefillTitle, prefillAmount } =
    useLocalSearchParams<{ id: string; members: string; prefillTitle?: string; prefillAmount?: string }>();

  const router = useRouter();
  const members: string[] = JSON.parse(membersParam || '[]');

  const [title, setTitle] = useState(prefillTitle || '');
  const [amount, setAmount] = useState(prefillAmount || '');
  const [paidBy, setPaidBy] = useState(members[0] || '');
  const [splitBetween, setSplitBetween] = useState<string[]>(members);
  const [loading, setLoading] = useState(false);

  const toggleMember = (member: string) => {
    setSplitBetween(prev =>
      prev.includes(member)
        ? prev.filter(m => m !== member)
        : [...prev, member]
    );
  };

  const submit = async () => {
    if (!title.trim()) return Alert.alert('Enter an expense title');
    if (!amount || isNaN(parseFloat(amount))) return Alert.alert('Enter a valid amount');
    if (splitBetween.length === 0) return Alert.alert('Select at least one person to split with');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: id,
          title: title.trim(),
          amount: parseFloat(amount),
          paid_by: paidBy,
          split_between: splitBetween,
        }),
      });

      if (res.ok) {
        router.back();
      } else {
        Alert.alert('Error', 'Failed to save expense');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const perPerson = splitBetween.length > 0 && amount
    ? (parseFloat(amount) / splitBetween.length).toFixed(2)
    : '0.00';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>What was it for?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Dinner, Taxi, Groceries"
            placeholderTextColor="#C4C0D8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount (RM)</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0.00"
            placeholderTextColor="#C4C0D8"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Paid By */}
        <View style={styles.section}>
          <Text style={styles.label}>Paid by</Text>
          <View style={styles.chipRow}>
            {members.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, paidBy === m && styles.chipActive]}
                onPress={() => setPaidBy(m)}
              >
                <Text style={[styles.chipText, paidBy === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Split Between */}
        <View style={styles.section}>
          <Text style={styles.label}>Split between</Text>
          <View style={styles.chipRow}>
            {members.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, splitBetween.includes(m) && styles.chipActive]}
                onPress={() => toggleMember(m)}
              >
                <Text style={[styles.chipText, splitBetween.includes(m) && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Smart Split Preview */}
        {amount !== '' && splitBetween.length > 0 && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Each person pays</Text>
            <Text style={styles.previewAmount}>RM {perPerson}</Text>
            <Text style={styles.previewSub}>
              RM {parseFloat(amount || '0').toFixed(2)} ÷ {splitBetween.length} people
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.submitTxt}>{loading ? 'Saving...' : 'Save Expense'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EFFF' },
  content: { padding: 20, paddingBottom: 60 },

  section: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: '#6C63FF', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },

  input: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, fontSize: 16, color: '#2D2A4A',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  amountInput: { fontSize: 28, fontWeight: '700', color: '#6C63FF', textAlign: 'center', padding: 20 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: '#fff', borderRadius: 50,
    borderWidth: 2, borderColor: '#E8E6FF',
  },
  chipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#9B97B2' },
  chipTextActive: { color: '#fff' },

  previewCard: {
    backgroundColor: '#6C63FF', borderRadius: 18,
    padding: 20, alignItems: 'center', marginBottom: 24,
  },
  previewLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  previewAmount: { fontSize: 36, fontWeight: '800', color: '#fff' },
  previewSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  submitBtn: {
    backgroundColor: '#6C63FF', borderRadius: 18,
    padding: 18, alignItems: 'center',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  submitTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
