import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { API_URL } from '../constants/api';

export default function CreateGroupScreen() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const addMember = () => setMembers([...members, '']);

  const updateMember = (text: string, index: number) => {
    const updated = [...members];
    updated[index] = text;
    setMembers(updated);
  };

  const removeMember = (index: number) => {
    if (members.length <= 2) return Alert.alert('Minimum 2 members required');
    setMembers(members.filter((_, i) => i !== index));
  };

  const createGroup = async () => {
    const validMembers = members.map(m => m.trim()).filter(m => m.length > 0);
    if (!groupName.trim()) return Alert.alert('Please enter a group name');
    if (validMembers.length < 2) return Alert.alert('Add at least 2 members');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim(), members: validMembers }),
      });
      if (res.ok) {
        router.back();
      } else {
        Alert.alert('Error', 'Failed to create group');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.section}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Bali Trip, Friday Lunch"
            placeholderTextColor="#C4C0D8"
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Members</Text>
          {members.map((member, index) => (
            <View key={index} style={styles.memberRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Member ${index + 1}`}
                placeholderTextColor="#C4C0D8"
                value={member}
                onChangeText={(text) => updateMember(text, index)}
              />
              {members.length > 2 && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeMember(index)}
                >
                  <Text style={styles.removeTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addMemberBtn} onPress={addMember}>
            <Text style={styles.addMemberTxt}>＋  Add Member</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, loading && { opacity: 0.6 }]}
          onPress={createGroup}
          disabled={loading}
        >
          <Text style={styles.createTxt}>{loading ? 'Creating...' : 'Create Group'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EFFF' },
  content: { padding: 20, paddingBottom: 60 },

  section: { marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '700', color: '#6C63FF', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },

  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#2D2A4A',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: {
    width: 40, height: 44,
    backgroundColor: '#FFE8E8', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  removeTxt: { color: '#FF6B6B', fontSize: 14, fontWeight: '700' },

  addMemberBtn: {
    borderWidth: 2, borderColor: '#6C63FF', borderStyle: 'dashed',
    borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4,
  },
  addMemberTxt: { color: '#6C63FF', fontSize: 15, fontWeight: '600' },

  createBtn: {
    backgroundColor: '#6C63FF', borderRadius: 18,
    padding: 18, alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  createTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
