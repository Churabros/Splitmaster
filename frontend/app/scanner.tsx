import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../constants/api';
import { ReceiptItem } from '../types';

export default function ScannerScreen() {
  const { id, members } = useLocalSearchParams<{ id: string; members: string }>();
  const router = useRouter();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState('');

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return Alert.alert('Permission needed', 'Please allow access in your phone settings');
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setItems([]);
      setTotal(null);
      setError('');
      scanReceipt(asset.base64 || '');
    }
  };

  const scanReceipt = async (base64: string) => {
    setScanning(true);
    try {
      const res = await fetch(`${API_URL}/scan-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64 }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      setError('Could not connect to server. Make sure backend is running.');
    } finally {
      setScanning(false);
    }
  };

  const useTotal = () => {
    if (!total) return;
    router.push({
      pathname: '/add-expense',
      params: {
        id,
        members,
        prefillTitle: 'Receipt',
        prefillAmount: total.toFixed(2),
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.intro}>
        Take a photo of your receipt and AI will read it for you automatically 🤖
      </Text>

      {/* Pick Image Buttons */}
      <View style={styles.pickRow}>
        <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(true)}>
          <Text style={styles.pickEmoji}>📷</Text>
          <Text style={styles.pickTxt}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(false)}>
          <Text style={styles.pickEmoji}>🖼️</Text>
          <Text style={styles.pickTxt}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview */}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      )}

      {/* Scanning Indicator */}
      {scanning && (
        <View style={styles.scanningCard}>
          <ActivityIndicator color="#6C63FF" size="large" />
          <Text style={styles.scanningText}>AI is reading your receipt...</Text>
        </View>
      )}

      {/* Error */}
      {error !== '' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️  {error}</Text>
        </View>
      )}

      {/* Results */}
      {items.length > 0 && (
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>📋  Items Detected</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>RM {item.price.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>RM {total?.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.useBtn} onPress={useTotal}>
            <Text style={styles.useTxt}>Use this total →  Add Expense</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EFFF' },
  content: { padding: 20, paddingBottom: 60 },

  intro: { fontSize: 15, color: '#9B97B2', textAlign: 'center', marginBottom: 24, lineHeight: 22 },

  pickRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  pickBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 18,
    padding: 24, alignItems: 'center',
    borderWidth: 2, borderColor: '#E8E6FF',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  pickEmoji: { fontSize: 36, marginBottom: 8 },
  pickTxt: { fontSize: 15, fontWeight: '700', color: '#6C63FF' },

  preview: {
    width: '100%', height: 220, borderRadius: 18,
    marginBottom: 20, backgroundColor: '#fff',
  },

  scanningCard: {
    backgroundColor: '#fff', borderRadius: 18,
    padding: 28, alignItems: 'center', gap: 14, marginBottom: 20,
  },
  scanningText: { fontSize: 15, color: '#6C63FF', fontWeight: '600' },

  errorCard: {
    backgroundColor: '#FFE8E8', borderRadius: 14,
    padding: 16, marginBottom: 20,
  },
  errorText: { color: '#FF6B6B', fontSize: 14, lineHeight: 20 },

  resultsCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  resultsTitle: { fontSize: 16, fontWeight: '700', color: '#2D2A4A', marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemName: { fontSize: 14, color: '#2D2A4A', flex: 1, paddingRight: 8 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#6C63FF' },
  divider: { height: 1, backgroundColor: '#F0EFFF', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#2D2A4A' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#6C63FF' },

  useBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 16,
  },
  useTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
