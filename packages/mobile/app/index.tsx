/**
 * Main screen — agent selector + chat area
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAgentChat } from '../hooks/useAgentChat';
import { Message } from '@nexus-hub/core';

const AGENT_COLORS: Record<string, string> = {
  'text-amber-400': '#F59E0B',
  'text-emerald-400': '#34D399',
  'text-blue-400': '#60A5FA',
  'text-violet-400': '#A78BFA',
  'text-yellow-400': '#FACC15',
  'text-cyan-400': '#22D3EE',
  'text-pink-400': '#F472B6',
};

export default function HomeScreen() {
  const {
    agents,
    activeAgent,
    activeId,
    setActiveId,
    sendMessage,
    clearHistory,
    isReady,
  } = useAgentChat();

  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const handleSend = async () => {
    const text = input.trim();
    if (!text || activeAgent.status === 'thinking') return;
    setInput('');
    await sendMessage(text);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#34D399" size="large" />
      </View>
    );
  }

  const agentColor = AGENT_COLORS[activeAgent.color] ?? '#34D399';

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.agentBubble]}>
        {!isUser && (
          <Text style={[styles.agentLabel, { color: agentColor }]}>{activeAgent.name}</Text>
        )}
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Agent selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.agentBar}
        contentContainerStyle={styles.agentBarContent}
      >
        {agents.map((agent) => {
          const color = AGENT_COLORS[agent.color] ?? '#34D399';
          const isActive = agent.id === activeId;
          return (
            <TouchableOpacity
              key={agent.id}
              onPress={() => setActiveId(agent.id)}
              style={[styles.agentChip, isActive && { borderColor: color, backgroundColor: color + '20' }]}
            >
              <Text style={[styles.agentChipText, { color: isActive ? color : '#888' }]}>
                {agent.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.agentChip}
        >
          <Text style={styles.agentChipText}>⚙️</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Agent info bar */}
      <View style={styles.agentInfoBar}>
        <View style={[styles.agentDot, { backgroundColor: agentColor }]} />
        <Text style={[styles.agentName, { color: agentColor }]}>{activeAgent.name}</Text>
        <Text style={styles.agentRole}> · {activeAgent.role}</Text>
        <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={activeAgent.history}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Thinking indicator */}
      {activeAgent.status === 'thinking' && (
        <View style={styles.thinkingBar}>
          <ActivityIndicator size="small" color={agentColor} />
          <Text style={[styles.thinkingText, { color: agentColor }]}>
            {activeAgent.name} is thinking...
          </Text>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${activeAgent.name}...`}
            placeholderTextColor="#555"
            multiline
            maxLength={4000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || activeAgent.status === 'thinking'}
            style={[styles.sendBtn, { backgroundColor: agentColor }]}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },

  agentBar: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  agentBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  agentChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  agentChipText: { fontSize: 13, fontWeight: '600', color: '#888' },

  agentInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  agentDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  agentName: { fontSize: 14, fontWeight: '700' },
  agentRole: { fontSize: 12, color: '#666', flex: 1 },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#1a1a1a' },
  clearBtnText: { fontSize: 12, color: '#666' },

  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  messageBubble: { maxWidth: '85%', borderRadius: 16, padding: 12 },
  agentBubble: { alignSelf: 'flex-start', backgroundColor: '#1a1a1a' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1e3a2f' },
  agentLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  messageText: { fontSize: 15, color: '#e5e5e5', lineHeight: 22 },
  userMessageText: { color: '#d1fae5' },
  timestamp: { fontSize: 10, color: '#555', marginTop: 6, textAlign: 'right' },

  thinkingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  thinkingText: { fontSize: 13 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#e5e5e5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { fontSize: 18, color: '#000', fontWeight: '700' },
});
