/**
 * Agent Builder screen — create custom agents on mobile.
 * Mirrors the web AgentBuilderModal but as a full native screen.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FREE_MODELS } from '@nexus-hub/core';
import { useAgentChat } from '../hooks/useAgentChat';

const ICON_OPTIONS = [
  { name: 'Bot',      icon: 'robot',          color: '#A78BFA' },
  { name: 'Zap',      icon: 'lightning-bolt', color: '#FACC15' },
  { name: 'Code',     icon: 'code-tags',      color: '#22D3EE' },
  { name: 'Brain',    icon: 'brain',          color: '#F472B6' },
  { name: 'Star',     icon: 'star',           color: '#F59E0B' },
  { name: 'Rocket',   icon: 'rocket',         color: '#34D399' },
  { name: 'Shield',   icon: 'shield-check',   color: '#60A5FA' },
  { name: 'Wrench',   icon: 'wrench',         color: '#F59E0B' },
  { name: 'Terminal', icon: 'console',        color: '#34D399' },
  { name: 'BookOpen', icon: 'book-open-variant', color: '#60A5FA' },
];

export default function AgentBuilderScreen() {
  const { addAgent } = useAgentChat();
  const router = useRouter();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[4]); // Groq default
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!role.trim()) e.role = 'Role is required';
    if (!systemPrompt.trim()) e.systemPrompt = 'System prompt is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;

    addAgent({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      iconName: selectedIcon.name,
      color: `text-[${selectedIcon.color}]`,
      bgColor: `bg-[${selectedIcon.color}]/10`,
      model: selectedModel.id,
      provider: selectedModel.provider,
      systemPrompt: systemPrompt.trim(),
    });

    Alert.alert('Agent Created', `${name.trim()} is ready to chat!`, [
      { text: 'Open Chat', onPress: () => router.replace('/') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Create Agent</Text>
        <Text style={styles.subtext}>Build a custom AI agent tailored to your needs.</Text>

        {/* Name */}
        <Text style={styles.label}>Agent Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. SQL Sage"
          placeholderTextColor="#555"
          autoCapitalize="words"
        />
        {errors.name && <Text style={styles.error}>{errors.name}</Text>}

        {/* Role */}
        <Text style={styles.label}>Role / Tagline *</Text>
        <TextInput
          style={[styles.input, errors.role && styles.inputError]}
          value={role}
          onChangeText={setRole}
          placeholder="e.g. Database Expert"
          placeholderTextColor="#555"
          autoCapitalize="words"
        />
        {errors.role && <Text style={styles.error}>{errors.role}</Text>}

        {/* Icon picker */}
        <Text style={styles.label}>Icon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.iconRow}>
            {ICON_OPTIONS.map((opt) => {
              const active = selectedIcon.name === opt.name;
              return (
                <TouchableOpacity
                  key={opt.name}
                  onPress={() => setSelectedIcon(opt)}
                  style={[
                    styles.iconChip,
                    active && { borderColor: opt.color, backgroundColor: opt.color + '20' },
                  ]}
                >
                  <MaterialCommunityIcons name={opt.icon as any} size={22} color={opt.color} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Model picker */}
        <Text style={styles.label}>Model</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.iconRow}>
            {FREE_MODELS.map((m) => {
              const active = selectedModel.id === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedModel(m)}
                  style={[styles.modelChip, active && styles.modelChipActive]}
                >
                  <Text style={[styles.modelChipText, active && styles.modelChipTextActive]}>
                    {m.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* System prompt */}
        <Text style={styles.label}>System Prompt *</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.systemPrompt && styles.inputError]}
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          placeholder="You are a helpful assistant who..."
          placeholderTextColor="#555"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        {errors.systemPrompt && <Text style={styles.error}>{errors.systemPrompt}</Text>}

        {/* Preview */}
        {name.trim() && (
          <View style={[styles.preview, { borderColor: selectedIcon.color }]}>
            <MaterialCommunityIcons
              name={(ICON_OPTIONS.find(o => o.name === selectedIcon.name)?.icon ?? 'robot') as any}
              size={28}
              color={selectedIcon.color}
            />
            <View style={styles.previewText}>
              <Text style={[styles.previewName, { color: selectedIcon.color }]}>
                {name || 'Agent Name'}
              </Text>
              <Text style={styles.previewRole}>{role || 'Role'}</Text>
              <Text style={styles.previewModel}>{selectedModel.name}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createBtnText}>Create Agent</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 24, gap: 6 },
  heading: { fontSize: 22, fontWeight: '700', color: '#e5e5e5', marginBottom: 4 },
  subtext: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#aaa', marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  inputError: { borderColor: '#ef4444' },
  textArea: { minHeight: 120 },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  iconRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  modelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
  },
  modelChipActive: { borderColor: '#34D399', backgroundColor: '#34D39920' },
  modelChipText: { fontSize: 12, color: '#666' },
  modelChipTextActive: { color: '#34D399', fontWeight: '600' },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#1a1a1a',
    marginTop: 20,
  },
  previewText: { flex: 1 },
  previewName: { fontSize: 16, fontWeight: '700' },
  previewRole: { fontSize: 13, color: '#888', marginTop: 2 },
  previewModel: { fontSize: 11, color: '#555', marginTop: 2 },
  createBtn: {
    backgroundColor: '#34D399',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  createBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
});
