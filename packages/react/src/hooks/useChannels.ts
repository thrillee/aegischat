// ============================================================================
// AegisChat React SDK - useChannels Hook
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { channelsApi } from '../services/api';
import type { ChannelListItem, Channel } from '../types';

export interface UseChannelsOptions {
  type?: 'direct' | 'public' | 'private';
  limit?: number;
  autoFetch?: boolean;
  onChannelCreated?: (channel: Channel) => void;
  onError?: (error: Error) => void;
}

export interface UseChannelsReturn {
  channels: ChannelListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getOrCreateDM: (userId: string) => Promise<Channel>;
  markAsRead: (channelId: string) => Promise<void>;
}

export function useChannels(options: UseChannelsOptions = {}): UseChannelsReturn {
  const { type, limit = 20, autoFetch = true, onChannelCreated, onError } = options;

  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchChannels = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await channelsApi.list({ type, limit }, signal);
      if (signal?.aborted) return;
      setChannels(response.data.channels);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const error = err instanceof Error ? err : new Error('Failed to fetch channels');
      setError(error);
      onError?.(error);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [type, limit, onError]);

  const refetch = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    await fetchChannels(controller.signal);
  }, [fetchChannels]);

  const getOrCreateDM = useCallback(async (userId: string): Promise<Channel> => {
    try {
      const response = await channelsApi.getOrCreateDM(userId);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      fetchChannels(controller.signal);
      onChannelCreated?.(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create DM');
      onError?.(error);
      throw error;
    }
  }, [fetchChannels, onChannelCreated, onError]);

  const markAsRead = useCallback(async (channelId: string): Promise<void> => {
    try {
      await channelsApi.markAsRead(channelId);
      setChannels((prev) => prev.map((ch) => ch.id === channelId ? { ...ch, unread_count: 0 } : ch));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to mark as read');
      onError?.(error);
      throw error;
    }
  }, [onError]);

  useEffect(() => {
    if (autoFetch) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      fetchChannels(controller.signal);
      return () => controller.abort();
    }
  }, [autoFetch, fetchChannels]);

  return { channels, isLoading, error, refetch, getOrCreateDM, markAsRead };
}

export default useChannels;
