// ============================================================================
// AegisChat React SDK - useAutoRead Hook
// ============================================================================

import { useCallback, useEffect, useRef } from 'react';
import { channelsApi } from '../services/api';

const SESSION_STORAGE_KEY = '@aegischat/activeChannel';

export interface UseAutoReadOptions {
  onMarkAsRead?: (channelId: string) => void;
}

export interface UseAutoReadReturn {
  markAsRead: (channelId: string, skipFocusCheck?: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  /** Returns current focus state - use this getter to avoid stale closures */
  getIsFocused: () => boolean;
  /** @deprecated Use getIsFocused() instead to avoid stale closures in callbacks */
  isFocused: boolean;
}

export function useAutoRead(options: UseAutoReadOptions = {}): UseAutoReadReturn {
  const isFocusedRef = useRef(typeof document !== 'undefined' && document.hasFocus());
  const onMarkAsReadRef = useRef(options.onMarkAsRead);

  // Keep the callback ref updated
  useEffect(() => {
    onMarkAsReadRef.current = options.onMarkAsRead;
  }, [options.onMarkAsRead]);

  useEffect(() => {
    const handleFocus = () => { isFocusedRef.current = true; };
    const handleBlur = () => { isFocusedRef.current = false; };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const getIsFocused = useCallback(() => {
    return isFocusedRef.current;
  }, []);

  /**
   * Mark a channel as read
   * @param channelId - The channel ID to mark as read
   * @param skipFocusCheck - If true, bypass the focus check (use when user explicitly selects a channel)
   */
  const markAsRead = useCallback(async (channelId: string, skipFocusCheck = false) => {
    if (!skipFocusCheck && !isFocusedRef.current) return;
    try {
      await channelsApi.markAsRead(channelId);
      onMarkAsReadRef.current?.(channelId);
    } catch (error) {
      console.error('[AegisChat] useAutoRead: Failed to mark as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!isFocusedRef.current) return;
    try {
      const response = await channelsApi.list({});
      const channels = response.channels || [];
      await Promise.all(
        channels.filter((ch) => ch.unread_count > 0).map((ch) => channelsApi.markAsRead(ch.id))
      );
    } catch (error) {
      console.error('[AegisChat] useAutoRead: Failed to mark all as read:', error);
    }
  }, []);

  // Auto mark as read when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const activeChannelId = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (activeChannelId) {
          // Skip focus check when tab becomes visible - user is clearly looking at it
          markAsRead(activeChannelId, true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [markAsRead]);

  return { 
    markAsRead, 
    markAllAsRead, 
    getIsFocused,
    // Keep for backwards compatibility but warn it is deprecated
    isFocused: isFocusedRef.current 
  };
}

export default useAutoRead;
