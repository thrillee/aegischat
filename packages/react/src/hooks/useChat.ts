// ============================================================================
// AegisChat React SDK - useChat Hook
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi, channelsApi, messagesApi, filesApi } from '../services/api';
import type {
  AegisConfig,
  ChatSession,
  ChannelListItem,
  Message,
  MessagesResponse,
  TypingUser,
  UserSummary,
  FileAttachment,
  UploadProgress,
  MessageSummary,
} from '../types';

const TYPING_TIMEOUT = 3000;
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_RECONNECT_DELAY = 30000;
const PING_INTERVAL = 30000;
const SESSION_STORAGE_KEY = '@aegischat/activeChannel';

export interface UseChatOptions {
  config: AegisConfig;
  role: 'lawyer' | 'client';
  clientId?: string;
  autoConnect?: boolean;
  onMessage?: (message: Message) => void;
  onTyping?: (channelId: string, user: TypingUser) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseChatReturn {
  session: ChatSession | null;
  isConnected: boolean;
  isConnecting: boolean;
  channels: ChannelListItem[];
  messages: Message[];
  activeChannelId: string | null;
  typingUsers: TypingUser[];
  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  uploadProgress: UploadProgress[];
  connect: () => Promise<void>;
  disconnect: () => void;
  selectChannel: (channelId: string) => void;
  sendMessage: (content: string, options?: { type?: string; parent_id?: string; metadata?: Record<string, unknown> }) => Promise<void>;
  sendMessageWithFiles: (content: string, files: File[], options?: { type?: string; parent_id?: string; metadata?: Record<string, unknown> }) => Promise<void>;
  uploadFile: (file: File) => Promise<FileAttachment | null>;
  loadMoreMessages: () => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  refreshChannels: () => Promise<void>;
  createDMWithUser: (userId: string) => Promise<string | null>;
  retryMessage: (tempId: string) => Promise<void>;
  deleteFailedMessage: (tempId: string) => void;
  markAsRead: (channelId: string) => Promise<void>;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { config, role, clientId, autoConnect = true, onMessage, onTyping, onConnectionChange } = options;

  const [session, setSession] = useState<ChatSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeChannelId, setActiveChannelIdState] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser[]>>({});
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManualDisconnect = useRef(false);
  const oldestMessageId = useRef<string | null>(null);
  const activeChannelIdRef = useRef<string | null>(null);
  const configRef = useRef(config);
  const sessionRef = useRef<ChatSession | null>(null);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    activeChannelIdRef.current = activeChannelId;
  }, [activeChannelId]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const getActiveChannelId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  }, []);

  const setActiveChannelId = useCallback((id: string | null) => {
    setActiveChannelIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, id);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  const fetchFromComms = useCallback(async <T>(path: string, fetchOptions: RequestInit = {}): Promise<T> => {
    const currentSession = sessionRef.current;
    if (!currentSession) {
      throw new Error('Chat session not initialized');
    }

    const response = await fetch(`${currentSession.api_url}${path}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentSession.access_token}`,
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }, []);

  const clearTimers = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
  }, []);

  const handleWebSocketMessage = useCallback((data: { type: string; payload: unknown }) => {
    const currentActiveChannelId = activeChannelIdRef.current;
    console.log('[AegisChat] WebSocket message received:', data.type, data);

    switch (data.type) {
      case 'message.new': {
        const newMessage = data.payload as Message;
        if (newMessage.channel_id === currentActiveChannelId) {
          setMessages((prev) => {
            const existingIndex = prev.findIndex(
              (m) => m.tempId && m.content === newMessage.content && m.status === 'sending'
            );
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = { ...newMessage, status: 'sent' };
              return updated;
            }
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, { ...newMessage, status: 'delivered' }];
          });
          onMessage?.(newMessage);
        }
        setChannels((prev) => {
          const updated = prev.map((ch) =>
            ch.id === newMessage.channel_id
              ? {
                  ...ch,
                  last_message: {
                    id: newMessage.id,
                    content: newMessage.content,
                    created_at: newMessage.created_at,
                    sender: { id: newMessage.sender_id, display_name: 'Unknown', status: 'online' as const },
                  } as MessageSummary,
                  unread_count: ch.id === currentActiveChannelId ? 0 : ch.unread_count + 1,
                }
              : ch
          );
          return updated.sort((a, b) => {
            const timeA = a.last_message?.created_at || '';
            const timeB = b.last_message?.created_at || '';
            return timeB.localeCompare(timeA);
          });
        });
        break;
      }
      case 'message.updated': {
        const updatedMessage = data.payload as Message;
        setMessages((prev) => prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)));
        break;
      }
      case 'message.deleted': {
        const { message_id } = data.payload as { message_id: string };
        setMessages((prev) => prev.map((m) => (m.id === message_id ? { ...m, deleted: true } : m)));
        break;
      }
      case 'message.delivered':
      case 'message.read': {
        const { message_id, channel_id, status } = data.payload as { message_id: string; channel_id: string; status: string };
        if (channel_id === currentActiveChannelId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === message_id ? { ...m, status: (status as Message['status']) || 'delivered' } : m))
          );
        }
        break;
      }
      case 'message.delivered.batch':
      case 'message.read.batch': {
        const { channel_id } = data.payload as { channel_id: string };
        if (channel_id === currentActiveChannelId) {
          setMessages((prev) =>
            prev.map((m) => (m.status === 'sent' || m.status === 'delivered' ? { ...m, status: data.type === 'message.delivered.batch' ? 'delivered' : 'read' } : m))
          );
        }
        break;
      }
      case 'typing.start': {
        const { channel_id, user } = data.payload as { channel_id: string; user: UserSummary };
        const typingUser: TypingUser = {
          id: user.id,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          startedAt: Date.now(),
        };
        setTypingUsers((prev) => ({
          ...prev,
          [channel_id]: [...(prev[channel_id] || []).filter((u) => u.id !== user.id), typingUser],
        }));
        onTyping?.(channel_id, typingUser);
        break;
      }
      case 'typing.stop': {
        const { channel_id, user_id } = data.payload as { channel_id: string; user_id: string };
        setTypingUsers((prev) => ({
          ...prev,
          [channel_id]: (prev[channel_id] || []).filter((u) => u.id !== user_id),
        }));
        break;
      }
      case 'pong':
        break;
      default:
        console.log('[AegisChat] Unhandled message type:', data.type);
    }
  }, [onMessage, onTyping]);

  const connectWebSocket = useCallback(() => {
    const currentSession = sessionRef.current;
    if (!currentSession?.websocket_url || !currentSession?.access_token) {
      console.warn('[AegisChat] Cannot connect WebSocket - missing session or token');
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[AegisChat] WebSocket already open, skipping connection');
      return;
    }

    setIsConnecting(true);
    isManualDisconnect.current = false;

    const wsUrl = `${currentSession.websocket_url}?token=${currentSession.access_token}`;
    console.log('[AegisChat] Creating WebSocket connection to:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[AegisChat] WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      onConnectionChange?.(true);

      pingInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL);

      if (activeChannelIdRef.current) {
        ws.send(JSON.stringify({ type: 'channel.join', payload: { channel_id: activeChannelIdRef.current } }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('[AegisChat] Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[AegisChat] WebSocket disconnected');
      setIsConnected(false);
      clearTimers();
      onConnectionChange?.(false);

      if (!isManualDisconnect.current && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts.current), MAX_RECONNECT_DELAY);
        console.log(`[AegisChat] Reconnecting in ${delay}ms...`);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current++;
          connectWebSocket();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('[AegisChat] WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [clearTimers, handleWebSocketMessage, onConnectionChange]);

  const connect = useCallback(async () => {
    console.log('[AegisChat] connect() called');
    if (sessionRef.current) {
      console.log('[AegisChat] Session exists, calling connectWebSocket directly');
      connectWebSocket();
      return;
    }

    try {
      setIsConnecting(true);
      console.log('[AegisChat] Fetching chat session...');
      const result = await chatApi.connect({ role, client_id: clientId });
      console.log('[AegisChat] Chat session received:', result);
      setSession(result.data);
      setIsConnecting(false);
    } catch (error) {
      console.error('[AegisChat] Failed to get chat session:', error);
      setIsConnecting(false);
      throw error;
    }
  }, [role, clientId, connectWebSocket]);

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    clearTimers();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setSession(null);
    setChannels([]);
    setMessages([]);
  }, [clearTimers]);

  const refreshChannels = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    setIsLoadingChannels(true);
    try {
      const response = await channelsApi.list({});
      setChannels(response.data.channels || []);
    } catch (error) {
      console.error('[AegisChat] Failed to fetch channels:', error);
    } finally {
      setIsLoadingChannels(false);
    }
  }, []);

  const selectChannel = useCallback(async (channelId: string) => {
    const currentActiveChannelId = activeChannelIdRef.current;
    setActiveChannelId(channelId);
    setMessages([]);
    setHasMoreMessages(true);
    oldestMessageId.current = null;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (currentActiveChannelId) {
        wsRef.current.send(JSON.stringify({ type: 'channel.leave', payload: { channel_id: currentActiveChannelId } }));
      }
      wsRef.current.send(JSON.stringify({ type: 'channel.join', payload: { channel_id: channelId } }));
    }

    setIsLoadingMessages(true);
    try {
      const response = await fetchFromComms<MessagesResponse>(`/channels/${channelId}/messages?limit=50`);
      setMessages(response.messages || []);
      setHasMoreMessages(response.has_more);
      if (response.oldest_id) {
        oldestMessageId.current = response.oldest_id;
      }

      await markAsRead(channelId);

      setChannels((prev) => prev.map((ch) => (ch.id === channelId ? { ...ch, unread_count: 0 } : ch)));
    } catch (error) {
      console.error('[AegisChat] Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [setActiveChannelId, fetchFromComms]);

  const markAsRead = useCallback(async (channelId: string) => {
    try {
      await fetchFromComms(`/channels/${channelId}/read`, { method: 'POST' });
    } catch (error) {
      console.error('[AegisChat] Failed to mark as read:', error);
    }
  }, [fetchFromComms]);

  const loadMoreMessages = useCallback(async () => {
    if (!activeChannelId || !hasMoreMessages || isLoadingMessages) return;

    setIsLoadingMessages(true);
    try {
      const params = oldestMessageId.current ? `?before=${oldestMessageId.current}&limit=50` : '?limit=50';
      const response = await fetchFromComms<MessagesResponse>(`/channels/${activeChannelId}/messages${params}`);
      setMessages((prev) => [...(response.messages || []), ...prev]);
      setHasMoreMessages(response.has_more);
      if (response.oldest_id) {
        oldestMessageId.current = response.oldest_id;
      }
    } catch (error) {
      console.error('[AegisChat] Failed to load more messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeChannelId, hasMoreMessages, isLoadingMessages, fetchFromComms]);

  const sendMessage = useCallback(async (
    content: string,
    msgOptions: { type?: string; parent_id?: string; metadata?: Record<string, unknown> } = {}
  ) => {
    const currentActiveChannelId = activeChannelIdRef.current;
    const currentSession = sessionRef.current;
    if (!currentActiveChannelId || !content.trim() || !currentSession) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const trimmedContent = content.trim();

    const optimisticMessage: Message = {
      id: tempId,
      tempId,
      channel_id: currentActiveChannelId,
      sender_id: currentSession.comms_user_id,
      content: trimmedContent,
      type: (msgOptions.type as Message['type']) || 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'sending',
      metadata: msgOptions.metadata || {},
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const now = new Date().toISOString();
    setChannels((prev) => {
      const updated = prev.map((ch) =>
        ch.id === currentActiveChannelId
          ? {
              ...ch,
              last_message: {
                id: tempId,
                content: trimmedContent,
                created_at: now,
                sender: { id: currentSession.comms_user_id, display_name: 'You', status: 'online' as const },
              },
            }
          : ch
      );
      return updated.sort((a, b) => {
        const timeA = a.last_message?.created_at || '';
        const timeB = b.last_message?.created_at || '';
        return timeB.localeCompare(timeA);
      });
    });

    try {
      await fetchFromComms<Message>(`/channels/${currentActiveChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: trimmedContent, type: msgOptions.type || 'text', parent_id: msgOptions.parent_id, metadata: msgOptions.metadata }),
      });
    } catch (error) {
      console.error('[AegisChat] Failed to send message:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId ? { ...m, status: 'failed', errorMessage: error instanceof Error ? error.message : 'Failed to send' } : m
        )
      );
      throw error;
    }
  }, [fetchFromComms]);

  const uploadFile = useCallback(async (file: File): Promise<FileAttachment | null> => {
    const currentSession = sessionRef.current;
    if (!currentSession) return null;

    const fileId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setUploadProgress((prev) => [...prev, { fileId, fileName: file.name, progress: 0, status: 'pending' }]);

    try {
      setUploadProgress((prev) => prev.map((p) => p.fileId === fileId ? { ...p, status: 'uploading', progress: 10 } : p));

      const uploadUrlResponse = await fetchFromComms<{ upload_url: string; file_id: string; expires_at: string }>('/files/upload-url', {
        method: 'POST',
        body: JSON.stringify({ file_name: file.name, file_type: file.type || 'application/octet-stream', file_size: file.size }),
      });

      setUploadProgress((prev) => prev.map((p) => p.fileId === fileId ? { ...p, fileId: uploadUrlResponse.file_id, progress: 30 } : p));

      const uploadResponse = await fetch(uploadUrlResponse.upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.statusText}`);

      setUploadProgress((prev) => prev.map((p) => p.fileId === uploadUrlResponse.file_id ? { ...p, status: 'confirming', progress: 70 } : p));

      const confirmResponse = await fetchFromComms<{ file: FileAttachment }>('/files', {
        method: 'POST',
        body: JSON.stringify({ file_id: uploadUrlResponse.file_id }),
      });

      setUploadProgress((prev) => prev.map((p) => p.fileId === uploadUrlResponse.file_id ? { ...p, status: 'complete', progress: 100 } : p));
      setTimeout(() => setUploadProgress((prev) => prev.filter((p) => p.fileId !== uploadUrlResponse.file_id)), 2000);

      return confirmResponse.file;
    } catch (error) {
      console.error('[AegisChat] Failed to upload file:', error);
      setUploadProgress((prev) => prev.map((p) => p.fileId === fileId ? { ...p, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' } : p));
      setTimeout(() => setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId)), 5000);
      return null;
    }
  }, [fetchFromComms]);

  const sendMessageWithFiles = useCallback(async (
    content: string,
    files: File[],
    msgOptions: { type?: string; parent_id?: string; metadata?: Record<string, unknown> } = {}
  ) => {
    const currentActiveChannelId = activeChannelIdRef.current;
    const currentSession = sessionRef.current;
    if (!currentActiveChannelId || (!content.trim() && files.length === 0) || !currentSession) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const trimmedContent = content.trim();

    const optimisticMessage: Message = {
      id: tempId,
      tempId,
      channel_id: currentActiveChannelId,
      sender_id: currentSession.comms_user_id,
      content: trimmedContent || `Uploading ${files.length} file(s)...`,
      type: 'file',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'sending',
      metadata: { ...msgOptions.metadata, files: files.map((f) => ({ id: `temp-${f.name}`, filename: f.name, mime_type: f.type, size: f.size, url: '' })) },
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const uploadedFiles: FileAttachment[] = [];
      for (const file of files) {
        const attachment = await uploadFile(file);
        if (attachment) uploadedFiles.push(attachment);
      }

      const messageType = uploadedFiles.length > 0 && !trimmedContent ? 'file' : 'text';

      await fetchFromComms<Message>(`/channels/${currentActiveChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: trimmedContent || (uploadedFiles.length > 0 ? `Shared ${uploadedFiles.length} file(s)` : ''),
          type: msgOptions.type || messageType,
          parent_id: msgOptions.parent_id,
          metadata: { ...msgOptions.metadata, files: uploadedFiles },
          file_ids: uploadedFiles.map((f) => f.id),
        }),
      });
    } catch (error) {
      console.error('[AegisChat] Failed to send message with files:', error);
      setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: 'failed', errorMessage: error instanceof Error ? error.message : 'Failed to send' } : m));
      throw error;
    }
  }, [fetchFromComms, uploadFile]);

  const stopTyping = useCallback(() => {
    const currentActiveChannelId = activeChannelIdRef.current;
    if (!currentActiveChannelId || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'typing.stop', payload: { channel_id: currentActiveChannelId } }));
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  }, []);

  const startTyping = useCallback(() => {
    const currentActiveChannelId = activeChannelIdRef.current;
    if (!currentActiveChannelId || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'typing.start', payload: { channel_id: currentActiveChannelId } }));
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, TYPING_TIMEOUT);
  }, [stopTyping]);

  const createDMWithUser = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const channel = await fetchFromComms<{ id: string }>('/channels/dm', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      await refreshChannels();
      return channel.id;
    } catch (error) {
      console.error('[AegisChat] Failed to create DM:', error);
      return null;
    }
  }, [fetchFromComms, refreshChannels]);

  const retryMessage = useCallback(async (tempId: string) => {
    const failedMessage = messages.find((m) => m.tempId === tempId && m.status === 'failed');
    const currentActiveChannelId = activeChannelIdRef.current;
    if (!failedMessage || !currentActiveChannelId) return;

    setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: 'sending', errorMessage: undefined } : m));

    try {
      await fetchFromComms<Message>(`/channels/${currentActiveChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: failedMessage.content, type: failedMessage.type, metadata: failedMessage.metadata }),
      });
    } catch (error) {
      console.error('[AegisChat] Failed to retry message:', error);
      setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: 'failed', errorMessage: error instanceof Error ? error.message : 'Failed to send' } : m));
    }
  }, [messages, fetchFromComms]);

  const deleteFailedMessage = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
  }, []);

  // Effects
  useEffect(() => {
    connect();
  }, []);

  useEffect(() => {
    if (session && !isConnected && !isConnecting && autoConnect) {
      connectWebSocket();
    }
  }, [session, isConnected, isConnecting, autoConnect, connectWebSocket]);

  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('[AegisChat] Failed to parse WebSocket message:', error);
        }
      };
    }
  }, [handleWebSocketMessage]);

  useEffect(() => {
    if (isConnected && channels.length === 0) {
      refreshChannels();
    }
  }, [isConnected, channels.length, refreshChannels]);

  useEffect(() => {
    const storedActiveChannel = getActiveChannelId();
    if (storedActiveChannel && !activeChannelId) {
      selectChannel(storedActiveChannel);
    }
  }, [getActiveChannelId, activeChannelId, selectChannel]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (wsRef.current) {
        isManualDisconnect.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [clearTimers]);

  return {
    session,
    isConnected,
    isConnecting,
    channels,
    messages,
    activeChannelId,
    typingUsers: activeChannelId ? typingUsers[activeChannelId] || [] : [],
    isLoadingChannels,
    isLoadingMessages,
    hasMoreMessages,
    uploadProgress,
    connect,
    disconnect,
    selectChannel,
    sendMessage,
    sendMessageWithFiles,
    uploadFile,
    loadMoreMessages,
    startTyping,
    stopTyping,
    refreshChannels,
    createDMWithUser,
    retryMessage,
    deleteFailedMessage,
    markAsRead,
  };
}

export default useChat;
