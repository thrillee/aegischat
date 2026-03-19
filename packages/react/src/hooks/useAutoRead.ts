// ============================================================================
// AegisChat React SDK - useAutoRead Hook
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { channelsApi } from '../services/api';

const SESSION_STORAGE_KEY = '@aegischat/activeChannel';

export interface UseAutoReadOptions {
  onMarkAsRead?: (channelId: string) => void;
}

export interface UseAutoReadReturn {
  markAsRead: (channelId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isFocused: boolean;
}

export function useAutoRead(options: UseAutoReadOptions = {}): UseAutoReadReturn {
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setIsFocused(typeof document !== 'undefined' && document.hasFocus());

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const activeChannelId = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (activeChannelId) {
          markAsRead(activeChannelId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const markAsRead = useCallback(async (channelId: string) => {
    if (!isFocused) return;
    try {
      await channelsApi.markAsRead(channelId);
      options.onMarkAsRead?.(channelId);
    } catch (error) {
      console.error('[AegisChat] useAutoRead: Failed to mark as read:', error);
    }
  }, [isFocused, options.onMarkAsRead]);

  const markAllAsRead = useCallback(async () => {
    if (!isFocused) return;
    try {
      const response = await channelsApi.list({});
      const channels = response.data.channels || [];
      await Promise.all(
        channels.filter((ch) => ch.unread_count > 0).map((ch) => channelsApi.markAsRead(ch.id))
      );
    } catch (error) {
      console.error('[AegisChat] useAutoRead: Failed to mark all as read:', error);
    }
  }, [isFocused]);

  return { markAsRead, markAllAsRead, isFocused };
}

export default useAutoRead;
