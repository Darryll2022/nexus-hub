// Re-export from shared core — single source of truth
export * from '../../packages/core/src/types';

// Icon map type (web-only — uses lucide-react)
import type { LucideIcon } from 'lucide-react';
export type IconMap = Record<string, LucideIcon>;
