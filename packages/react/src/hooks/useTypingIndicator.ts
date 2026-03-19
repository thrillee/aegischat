// ============================================================================
// AegisChat React SDK - useTypingIndicator Hook
// ============================================================================

import { useCallback, useState } from 'react';
import type { TypingUser } from '../types';

export interface UseTypingIndicatorOptions {
  channelId: string;
  ws?: WebSocket | null;
}

export interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  startTyping: () => void;
  stopTyping: () => void;
}

export function useTypingIndicator(_options: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const startTyping = useCallback(() => {}, []);
  const stopTyping = useCallback(() => {}, []);

  return { typingUsers, startTyping, stopTyping };
}

export default useTypingIndicator;
