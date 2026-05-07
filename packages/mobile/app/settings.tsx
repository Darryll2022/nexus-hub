/**
 * Settings screen — API key configuration
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAgentChat } from '../hooks/useAgentChat';

export default function SettingsScreen() {
  const { apiKeys, setApiKeys } = useAgentChat();
  const [groq, setGroq] = useState(apiKeys.groq);
  const [openrouter, setOpenrouter] = useState(apiKeys.openrouter);
  const router = useRouter();

  const handleSave = () => {
    setApiKeys({ groq, openrouter });
    Alert.alert('Saved', 'API keys updated.');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Configure API Keys</Text>
        <Text style={styles.subtext}>
          Keys are stored locally on your device and never sent to any server other than Groq / OpenRouter.
        </Text>

        <Text style={styles.label}>Groq API Key</Text>
        <TextInput
          style={styles.input}
          value={groq}
          onChangeText={setGroq}
          placeholder="gsk_..."
          placeholderTextColor="#555"
          secureTextEntry
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          Get a free key at console.groq.com → powers Blocker Buster & Atlas
        </Text>

        <Text style={styles.label}>OpenRouter API Key</Text>
        <TextInput
          style={styles.input}
          value={openrouter}
          onChangeText={setOpenrouter}
          placeholder="sk-or-..."
          placeholderTextColor="#555"
          secureTextEntry
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          Get a free key at openrouter.ai/keys → powers Lyra & free models
        </Text>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Keys</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>About Nexus Hub</Text>
        <Text style={styles.subtext}>Version 1.0.0 · Phase 3 Mobile</Text>
        <Text style={styles.subtext}>
          Agents: Blocker Buster · Atlas · Lyra
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 24, gap: 12 },
  heading: { fontSize: 22, fontWeight: '700', color: '#e5e5e5', marginBottom: 4 },
  subtext: { fontSize: 13, color: '#666', lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#aaa', marginTop: 16 },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: 6,
  },
  hint: { fontSize: 12, color: '#555', marginTop: 4 },
  saveBtn: {
    backgroundColor: '#34D399',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
  divider: { height: 1, backgroundColor: '#1a1a1a', marginVertical: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e5e5e5' },
});
