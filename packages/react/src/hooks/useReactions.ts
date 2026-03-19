// ============================================================================
// AegisChat React SDK - useReactions Hook
// ============================================================================

import { useState } from 'react';
import type { ReactionSummary } from '../types';

export interface UseReactionsOptions {
  channelId: string;
  messageId: string;
}

export interface UseReactionsReturn {
  reactions: ReactionSummary[];
  addReaction: (emoji: string) => Promise<void>;
  removeReaction: (emoji: string) => Promise<void>;
}

export function useReactions(_options: UseReactionsOptions): UseReactionsReturn {
  const [reactions, setReactions] = useState<ReactionSummary[]>([]);

  const addReaction = async (_emoji: string) => {};
  const removeReaction = async (_emoji: string) => {};

  return { reactions, addReaction, removeReaction };
}

export default useReactions;
