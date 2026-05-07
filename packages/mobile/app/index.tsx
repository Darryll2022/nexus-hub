/**
 * Main screen — agent selector + chat area
 * Phase 3.1: vector icons, markdown rendering, agent builder nav
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Message } from '@nexus-hub/core';
import { useAgentChat } from '../hooks/useAgentChat';
import { AgentIcon } from '../components/AgentIcon';
import { MarkdownMessage } from '../components/MarkdownMessage';

const AGENT_COLORS: Record<string, string> = {
  'text-amber-400': '#F59E0B',
  'text-emerald-400': '#34D399',
  'text-blue-400': '#60A5FA',
  'text-violet-400': '#A78BFA',
  'text-yellow-400': '#FACC15',
  'text-cyan-400': '#22D3EE',
  'text-pink-400': '#F472B6',
};

const resolveColor = (colorClass: string): string => {
  // Handle Tailwind JIT arbitrary colors from agent builder e.g. text-[#A78BFA]
  const match = colorClass.match(/\[(.+?)\]/);
  if (match) return match[1];
  return AGENT_COLORS[colorClass] ?? '#34D399';
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

  const agentColor = resolveColor(activeAgent.color);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.agentBubble]}>
        {!isUser && (
          <View style={styles.agentLabelRow}>
            <AgentIcon iconName={activeAgent.iconName} color={agentColor} size={13} />
            <Text style={[styles.agentLabel, { color: agentColor }]}>{activeAgent.name}</Text>
          </View>
        )}
        {isUser ? (
          <Text style={styles.userMessageText}>{item.text}</Text>
        ) : (
          <MarkdownMessage content={item.text} accentColor={agentColor} />
        )}
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
          const color = resolveColor(agent.color);
          const isActive = agent.id === activeId;
          return (
            <TouchableOpacity
              key={agent.id}
              onPress={() => setActiveId(agent.id)}
              style={[styles.agentChip, isActive && { borderColor: color, backgroundColor: color + '20' }]}
            >
              <AgentIcon iconName={agent.iconName} color={isActive ? color : '#666'} size={14} />
              <Text style={[styles.agentChipText, { color: isActive ? color : '#666' }]}>
                {agent.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* New agent button */}
        <TouchableOpacity
          onPress={() => router.push('/agent-builder')}
          style={[styles.agentChip, styles.newAgentChip]}
        >
          <MaterialCommunityIcons name="plus" size={14} color="#666" />
          <Text style={styles.agentChipText}>New</Text>
        </TouchableOpacity>

        {/* Settings button */}
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.agentChip}
        >
          <MaterialCommunityIcons name="cog-outline" size={14} color="#666" />
        </TouchableOpacity>
      </ScrollView>

      {/* Agent info bar */}
      <View style={styles.agentInfoBar}>
        <View style={[styles.agentDot, { backgroundColor: agentColor }]} />
        <AgentIcon iconName={activeAgent.iconName} color={agentColor} size={15} />
        <Text style={[styles.agentName, { color: agentColor }]}> {activeAgent.name}</Text>
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
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || activeAgent.status === 'thinking'}
            style={[
              styles.sendBtn,
              { backgroundColor: !input.trim() || activeAgent.status === 'thinking' ? '#2a2a2a' : agentColor },
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-up"
              size={20}
              color={!input.trim() ? '#555' : '#000'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f' },

  agentBar: { maxHeight: 60, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  agentBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  agentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  newAgentChip: { borderStyle: 'dashed' },
  agentChipText: { fontSize: 12, fontWeight: '600', color: '#666' },

  agentInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  agentDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  agentName: { fontSize: 14, fontWeight: '700' },
  agentRole: { fontSize: 12, color: '#555', flex: 1 },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#1a1a1a' },
  clearBtnText: { fontSize: 12, color: '#555' },

  messageList: { paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  messageBubble: { maxWidth: '88%', borderRadius: 16, padding: 12 },
  agentBubble: { alignSelf: 'flex-start', backgroundColor: '#1a1a1a' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1e3a2f' },
  agentLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  agentLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  userMessageText: { fontSize: 15, color: '#d1fae5', lineHeight: 22 },
  timestamp: { fontSize: 10, color: '#444', marginTop: 6, textAlign: 'right' },

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
});
