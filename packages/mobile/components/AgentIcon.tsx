/**
 * Renders the correct @expo/vector-icons icon for a given iconName.
 * Mirrors the web's lucide-react icon set where possible.
 */
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ICON_MAP: Record<string, string> = {
  Wrench: 'wrench',
  Terminal: 'console',
  BookOpen: 'book-open-variant',
  Bot: 'robot',
  Zap: 'lightning-bolt',
  Code: 'code-tags',
  Brain: 'brain',
  Star: 'star',
  Rocket: 'rocket',
  Shield: 'shield-check',
};

interface AgentIconProps {
  iconName: string;
  color: string;
  size?: number;
}

export const AgentIcon: React.FC<AgentIconProps> = ({ iconName, color, size = 20 }) => {
  const name = ICON_MAP[iconName] ?? 'robot';
  return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
};
