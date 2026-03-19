"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  channelsApi: () => channelsApi,
  chatApi: () => chatApi,
  configureApiClient: () => configureApiClient,
  filesApi: () => filesApi,
  messagesApi: () => messagesApi,
  reactionsApi: () => reactionsApi,
  useAutoRead: () => useAutoRead,
  useChannels: () => useChannels,
  useChat: () => useChat,
  useFileUpload: () => useFileUpload,
  useMentions: () => useMentions,
  useMessages: () => useMessages,
  useReactions: () => useReactions,
  useTypingIndicator: () => useTypingIndicator,
  usersApi: () => usersApi
});
module.exports = __toCommonJS(index_exports);

// src/hooks/useChat.ts
var import_react = require("react");

// src/services/api.ts
var baseUrl = "";
var getAccessToken = () => "";
var onUnauthorized;
function configureApiClient(config) {
  baseUrl = config.baseUrl;
  getAccessToken = config.getAccessToken;
  onUnauthorized = config.onUnauthorized;
}
async function fetchWithAuth(path, options = {}) {
  const token = await (typeof getAccessToken === "function" ? getAccessToken() : getAccessToken);
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
  if (response.status === 401) {
    onUnauthorized?.();
    throw new Error("Unauthorized");
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}
var chatApi = {
  /**
   * Connect to chat session
   */
  async connect(params, signal) {
    return fetchWithAuth("/api/v1/chat/connect", {
      method: "POST",
      body: JSON.stringify(params),
      signal
    });
  },
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken, signal) {
    return fetchWithAuth("/api/v1/chat/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal
    });
  }
};
var channelsApi = {
  /**
   * List channels
   */
  async list(options = {}, signal) {
    const params = new URLSearchParams();
    if (options.type) params.append("type", options.type);
    if (options.limit) params.append("limit", String(options.limit));
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchWithAuth(`/api/v1/channels${query}`, { signal });
  },
  /**
   * Get channel by ID
   */
  async get(channelId, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}`, { signal });
  },
  /**
   * Get or create DM channel
   */
  async getOrCreateDM(userId, signal) {
    return fetchWithAuth("/api/v1/channels/dm", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
      signal
    });
  },
  /**
   * Create channel
   */
  async create(data, signal) {
    return fetchWithAuth("/api/v1/channels", {
      method: "POST",
      body: JSON.stringify(data),
      signal
    });
  },
  /**
   * Mark channel as read
   */
  async markAsRead(channelId, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}/read`, {
      method: "POST",
      signal
    });
  },
  /**
   * Get channel members
   */
  async getMembers(channelId, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}/members`, { signal });
  },
  /**
   * Update channel
   */
  async update(channelId, data, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      signal
    });
  }
};
var messagesApi = {
  /**
   * List messages in a channel
   */
  async list(channelId, options = {}, signal) {
    const params = new URLSearchParams();
    if (options.limit) params.append("limit", String(options.limit));
    if (options.before) params.append("before", options.before);
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchWithAuth(`/api/v1/channels/${channelId}/messages${query}`, { signal });
  },
  /**
   * Send a message
   */
  async send(channelId, data, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
      signal
    });
  },
  /**
   * Update a message
   */
  async update(channelId, messageId, data, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      signal
    });
  },
  /**
   * Delete a message
   */
  async delete(channelId, messageId, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}/messages/${messageId}`, {
      method: "DELETE",
      signal
    });
  },
  /**
   * Mark messages as delivered
   */
  async markDelivered(channelId, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}/messages/delivered`, {
      method: "POST",
      signal
    });
  },
  /**
   * Mark messages as read
   */
  async markRead(channelId, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}/messages/read`, {
      method: "POST",
      signal
    });
  }
};
var reactionsApi = {
  /**
   * Add reaction to a message
   */
  async add(channelId, messageId, emoji, signal) {
    return fetchWithAuth(`/api/v1/channels/${channelId}/messages/${messageId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
      signal
    });
  },
  /**
   * Remove reaction from a message
   */
  async remove(channelId, messageId, emoji, signal) {
    return fetchWithAuth(
      `/api/v1/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      { method: "DELETE", signal }
    );
  }
};
var filesApi = {
  /**
   * Get upload URL
   */
  async getUploadUrl(data, signal) {
    return fetchWithAuth("/api/v1/files/upload-url", {
      method: "POST",
      body: JSON.stringify(data),
      signal
    });
  },
  /**
   * Confirm file upload
   */
  async confirm(fileId, signal) {
    return fetchWithAuth("/api/v1/files", {
      method: "POST",
      body: JSON.stringify({ file_id: fileId }),
      signal
    });
  },
  /**
   * Get download URL
   */
  async getDownloadUrl(fileId, signal) {
    return fetchWithAuth(`/api/v1/files/${fileId}/download`, { signal });
  }
};
var usersApi = {
  /**
   * Search users
   */
  async search(query, signal) {
    return fetchWithAuth(`/api/v1/users/search?q=${encodeURIComponent(query)}`, { signal });
  },
  /**
   * Get user by ID
   */
  async get(userId, signal) {
    return fetchWithAuth(`/api/v1/users/${userId}`, { signal });
  }
};

// src/hooks/useChat.ts
var TYPING_TIMEOUT = 3e3;
var RECONNECT_INTERVAL = 3e3;
var MAX_RECONNECT_ATTEMPTS = 5;
var MAX_RECONNECT_DELAY = 3e4;
var PING_INTERVAL = 3e4;
var SESSION_STORAGE_KEY = "@aegischat/activeChannel";
function useChat(options) {
  const { config, role, clientId, autoConnect = true, onMessage, onTyping, onConnectionChange } = options;
  const [session, setSession] = (0, import_react.useState)(null);
  const [isConnected, setIsConnected] = (0, import_react.useState)(false);
  const [isConnecting, setIsConnecting] = (0, import_react.useState)(false);
  const [activeChannelId, setActiveChannelIdState] = (0, import_react.useState)(null);
  const [channels, setChannels] = (0, import_react.useState)([]);
  const [messages, setMessages] = (0, import_react.useState)([]);
  const [typingUsers, setTypingUsers] = (0, import_react.useState)({});
  const [isLoadingChannels, setIsLoadingChannels] = (0, import_react.useState)(false);
  const [isLoadingMessages, setIsLoadingMessages] = (0, import_react.useState)(false);
  const [hasMoreMessages, setHasMoreMessages] = (0, import_react.useState)(true);
  const [uploadProgress, setUploadProgress] = (0, import_react.useState)([]);
  const wsRef = (0, import_react.useRef)(null);
  const reconnectAttempts = (0, import_react.useRef)(0);
  const reconnectTimeout = (0, import_react.useRef)(null);
  const pingInterval = (0, import_react.useRef)(null);
  const typingTimeout = (0, import_react.useRef)(null);
  const isManualDisconnect = (0, import_react.useRef)(false);
  const oldestMessageId = (0, import_react.useRef)(null);
  const activeChannelIdRef = (0, import_react.useRef)(null);
  const configRef = (0, import_react.useRef)(config);
  const sessionRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    configRef.current = config;
  }, [config]);
  (0, import_react.useEffect)(() => {
    activeChannelIdRef.current = activeChannelId;
  }, [activeChannelId]);
  (0, import_react.useEffect)(() => {
    sessionRef.current = session;
  }, [session]);
  const getActiveChannelId = (0, import_react.useCallback)(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  }, []);
  const setActiveChannelId = (0, import_react.useCallback)((id) => {
    setActiveChannelIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, id);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);
  const fetchFromComms = (0, import_react.useCallback)(async (path, fetchOptions = {}) => {
    const currentSession = sessionRef.current;
    if (!currentSession) {
      throw new Error("Chat session not initialized");
    }
    const response = await fetch(`${currentSession.api_url}${path}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentSession.access_token}`,
        ...fetchOptions.headers
      }
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  }, []);
  const clearTimers = (0, import_react.useCallback)(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
  }, []);
  const handleWebSocketMessage = (0, import_react.useCallback)((data) => {
    const currentActiveChannelId = activeChannelIdRef.current;
    console.log("[AegisChat] WebSocket message received:", data.type, data);
    switch (data.type) {
      case "message.new": {
        const newMessage = data.payload;
        if (newMessage.channel_id === currentActiveChannelId) {
          setMessages((prev) => {
            const existingIndex = prev.findIndex(
              (m) => m.tempId && m.content === newMessage.content && m.status === "sending"
            );
            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = { ...newMessage, status: "sent" };
              return updated;
            }
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, { ...newMessage, status: "delivered" }];
          });
          onMessage?.(newMessage);
        }
        setChannels((prev) => {
          const updated = prev.map(
            (ch) => ch.id === newMessage.channel_id ? {
              ...ch,
              last_message: {
                id: newMessage.id,
                content: newMessage.content,
                created_at: newMessage.created_at,
                sender: { id: newMessage.sender_id, display_name: "Unknown", status: "online" }
              },
              unread_count: ch.id === currentActiveChannelId ? 0 : ch.unread_count + 1
            } : ch
          );
          return updated.sort((a, b) => {
            const timeA = a.last_message?.created_at || "";
            const timeB = b.last_message?.created_at || "";
            return timeB.localeCompare(timeA);
          });
        });
        break;
      }
      case "message.updated": {
        const updatedMessage = data.payload;
        setMessages((prev) => prev.map((m) => m.id === updatedMessage.id ? updatedMessage : m));
        break;
      }
      case "message.deleted": {
        const { message_id } = data.payload;
        setMessages((prev) => prev.map((m) => m.id === message_id ? { ...m, deleted: true } : m));
        break;
      }
      case "message.delivered":
      case "message.read": {
        const { message_id, channel_id, status } = data.payload;
        if (channel_id === currentActiveChannelId) {
          setMessages(
            (prev) => prev.map((m) => m.id === message_id ? { ...m, status: status || "delivered" } : m)
          );
        }
        break;
      }
      case "message.delivered.batch":
      case "message.read.batch": {
        const { channel_id } = data.payload;
        if (channel_id === currentActiveChannelId) {
          setMessages(
            (prev) => prev.map((m) => m.status === "sent" || m.status === "delivered" ? { ...m, status: data.type === "message.delivered.batch" ? "delivered" : "read" } : m)
          );
        }
        break;
      }
      case "typing.start": {
        const { channel_id, user } = data.payload;
        const typingUser = {
          id: user.id,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          startedAt: Date.now()
        };
        setTypingUsers((prev) => ({
          ...prev,
          [channel_id]: [...(prev[channel_id] || []).filter((u) => u.id !== user.id), typingUser]
        }));
        onTyping?.(channel_id, typingUser);
        break;
      }
      case "typing.stop": {
        const { channel_id, user_id } = data.payload;
        setTypingUsers((prev) => ({
          ...prev,
          [channel_id]: (prev[channel_id] || []).filter((u) => u.id !== user_id)
        }));
        break;
      }
      case "pong":
        break;
      default:
        console.log("[AegisChat] Unhandled message type:", data.type);
    }
  }, [onMessage, onTyping]);
  const connectWebSocket = (0, import_react.useCallback)(() => {
    const currentSession = sessionRef.current;
    if (!currentSession?.websocket_url || !currentSession?.access_token) {
      console.warn("[AegisChat] Cannot connect WebSocket - missing session or token");
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[AegisChat] WebSocket already open, skipping connection");
      return;
    }
    setIsConnecting(true);
    isManualDisconnect.current = false;
    const wsUrl = `${currentSession.websocket_url}?token=${currentSession.access_token}`;
    console.log("[AegisChat] Creating WebSocket connection to:", wsUrl);
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log("[AegisChat] WebSocket connected");
      setIsConnected(true);
      reconnectAttempts.current = 0;
      onConnectionChange?.(true);
      pingInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, PING_INTERVAL);
      if (activeChannelIdRef.current) {
        ws.send(JSON.stringify({ type: "channel.join", payload: { channel_id: activeChannelIdRef.current } }));
      }
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("[AegisChat] Failed to parse WebSocket message:", error);
      }
    };
    ws.onclose = () => {
      console.log("[AegisChat] WebSocket disconnected");
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
      console.error("[AegisChat] WebSocket error:", error);
    };
    wsRef.current = ws;
  }, [clearTimers, handleWebSocketMessage, onConnectionChange]);
  const connect = (0, import_react.useCallback)(async () => {
    console.log("[AegisChat] connect() called");
    if (sessionRef.current) {
      console.log("[AegisChat] Session exists, calling connectWebSocket directly");
      connectWebSocket();
      return;
    }
    try {
      setIsConnecting(true);
      console.log("[AegisChat] Fetching chat session...");
      const result = await chatApi.connect({ role, client_id: clientId });
      console.log("[AegisChat] Chat session received:", result);
      setSession(result.data);
      setIsConnecting(false);
    } catch (error) {
      console.error("[AegisChat] Failed to get chat session:", error);
      setIsConnecting(false);
      throw error;
    }
  }, [role, clientId, connectWebSocket]);
  const disconnect = (0, import_react.useCallback)(() => {
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
  const refreshChannels = (0, import_react.useCallback)(async () => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;
    setIsLoadingChannels(true);
    try {
      const response = await channelsApi.list({});
      setChannels(response.data.channels || []);
    } catch (error) {
      console.error("[AegisChat] Failed to fetch channels:", error);
    } finally {
      setIsLoadingChannels(false);
    }
  }, []);
  const selectChannel = (0, import_react.useCallback)(async (channelId) => {
    const currentActiveChannelId = activeChannelIdRef.current;
    setActiveChannelId(channelId);
    setMessages([]);
    setHasMoreMessages(true);
    oldestMessageId.current = null;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (currentActiveChannelId) {
        wsRef.current.send(JSON.stringify({ type: "channel.leave", payload: { channel_id: currentActiveChannelId } }));
      }
      wsRef.current.send(JSON.stringify({ type: "channel.join", payload: { channel_id: channelId } }));
    }
    setIsLoadingMessages(true);
    try {
      const response = await fetchFromComms(`/channels/${channelId}/messages?limit=50`);
      setMessages(response.messages || []);
      setHasMoreMessages(response.has_more);
      if (response.oldest_id) {
        oldestMessageId.current = response.oldest_id;
      }
      await markAsRead(channelId);
      setChannels((prev) => prev.map((ch) => ch.id === channelId ? { ...ch, unread_count: 0 } : ch));
    } catch (error) {
      console.error("[AegisChat] Failed to load messages:", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [setActiveChannelId, fetchFromComms]);
  const markAsRead = (0, import_react.useCallback)(async (channelId) => {
    try {
      await fetchFromComms(`/channels/${channelId}/read`, { method: "POST" });
    } catch (error) {
      console.error("[AegisChat] Failed to mark as read:", error);
    }
  }, [fetchFromComms]);
  const loadMoreMessages = (0, import_react.useCallback)(async () => {
    if (!activeChannelId || !hasMoreMessages || isLoadingMessages) return;
    setIsLoadingMessages(true);
    try {
      const params = oldestMessageId.current ? `?before=${oldestMessageId.current}&limit=50` : "?limit=50";
      const response = await fetchFromComms(`/channels/${activeChannelId}/messages${params}`);
      setMessages((prev) => [...response.messages || [], ...prev]);
      setHasMoreMessages(response.has_more);
      if (response.oldest_id) {
        oldestMessageId.current = response.oldest_id;
      }
    } catch (error) {
      console.error("[AegisChat] Failed to load more messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeChannelId, hasMoreMessages, isLoadingMessages, fetchFromComms]);
  const sendMessage = (0, import_react.useCallback)(async (content, msgOptions = {}) => {
    const currentActiveChannelId = activeChannelIdRef.current;
    const currentSession = sessionRef.current;
    if (!currentActiveChannelId || !content.trim() || !currentSession) return;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const trimmedContent = content.trim();
    const optimisticMessage = {
      id: tempId,
      tempId,
      channel_id: currentActiveChannelId,
      sender_id: currentSession.comms_user_id,
      content: trimmedContent,
      type: msgOptions.type || "text",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      status: "sending",
      metadata: msgOptions.metadata || {}
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    setChannels((prev) => {
      const updated = prev.map(
        (ch) => ch.id === currentActiveChannelId ? {
          ...ch,
          last_message: {
            id: tempId,
            content: trimmedContent,
            created_at: now,
            sender: { id: currentSession.comms_user_id, display_name: "You", status: "online" }
          }
        } : ch
      );
      return updated.sort((a, b) => {
        const timeA = a.last_message?.created_at || "";
        const timeB = b.last_message?.created_at || "";
        return timeB.localeCompare(timeA);
      });
    });
    try {
      await fetchFromComms(`/channels/${currentActiveChannelId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: trimmedContent, type: msgOptions.type || "text", parent_id: msgOptions.parent_id, metadata: msgOptions.metadata })
      });
    } catch (error) {
      console.error("[AegisChat] Failed to send message:", error);
      setMessages(
        (prev) => prev.map(
          (m) => m.tempId === tempId ? { ...m, status: "failed", errorMessage: error instanceof Error ? error.message : "Failed to send" } : m
        )
      );
      throw error;
    }
  }, [fetchFromComms]);
  const uploadFile = (0, import_react.useCallback)(async (file) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return null;
    const fileId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setUploadProgress((prev) => [...prev, { fileId, fileName: file.name, progress: 0, status: "pending" }]);
    try {
      setUploadProgress((prev) => prev.map((p) => p.fileId === fileId ? { ...p, status: "uploading", progress: 10 } : p));
      const uploadUrlResponse = await fetchFromComms("/files/upload-url", {
        method: "POST",
        body: JSON.stringify({ file_name: file.name, file_type: file.type || "application/octet-stream", file_size: file.size })
      });
      setUploadProgress((prev) => prev.map((p) => p.fileId === fileId ? { ...p, fileId: uploadUrlResponse.file_id, progress: 30 } : p));
      const uploadResponse = await fetch(uploadUrlResponse.upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" }
      });
      if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      setUploadProgress((prev) => prev.map((p) => p.fileId === uploadUrlResponse.file_id ? { ...p, status: "confirming", progress: 70 } : p));
      const confirmResponse = await fetchFromComms("/files", {
        method: "POST",
        body: JSON.stringify({ file_id: uploadUrlResponse.file_id })
      });
      setUploadProgress((prev) => prev.map((p) => p.fileId === uploadUrlResponse.file_id ? { ...p, status: "complete", progress: 100 } : p));
      setTimeout(() => setUploadProgress((prev) => prev.filter((p) => p.fileId !== uploadUrlResponse.file_id)), 2e3);
      return confirmResponse.file;
    } catch (error) {
      console.error("[AegisChat] Failed to upload file:", error);
      setUploadProgress((prev) => prev.map((p) => p.fileId === fileId ? { ...p, status: "error", error: error instanceof Error ? error.message : "Upload failed" } : p));
      setTimeout(() => setUploadProgress((prev) => prev.filter((p) => p.fileId !== fileId)), 5e3);
      return null;
    }
  }, [fetchFromComms]);
  const sendMessageWithFiles = (0, import_react.useCallback)(async (content, files, msgOptions = {}) => {
    const currentActiveChannelId = activeChannelIdRef.current;
    const currentSession = sessionRef.current;
    if (!currentActiveChannelId || !content.trim() && files.length === 0 || !currentSession) return;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const trimmedContent = content.trim();
    const optimisticMessage = {
      id: tempId,
      tempId,
      channel_id: currentActiveChannelId,
      sender_id: currentSession.comms_user_id,
      content: trimmedContent || `Uploading ${files.length} file(s)...`,
      type: "file",
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      status: "sending",
      metadata: { ...msgOptions.metadata, files: files.map((f) => ({ id: `temp-${f.name}`, filename: f.name, mime_type: f.type, size: f.size, url: "" })) }
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const attachment = await uploadFile(file);
        if (attachment) uploadedFiles.push(attachment);
      }
      const messageType = uploadedFiles.length > 0 && !trimmedContent ? "file" : "text";
      await fetchFromComms(`/channels/${currentActiveChannelId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: trimmedContent || (uploadedFiles.length > 0 ? `Shared ${uploadedFiles.length} file(s)` : ""),
          type: msgOptions.type || messageType,
          parent_id: msgOptions.parent_id,
          metadata: { ...msgOptions.metadata, files: uploadedFiles },
          file_ids: uploadedFiles.map((f) => f.id)
        })
      });
    } catch (error) {
      console.error("[AegisChat] Failed to send message with files:", error);
      setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "failed", errorMessage: error instanceof Error ? error.message : "Failed to send" } : m));
      throw error;
    }
  }, [fetchFromComms, uploadFile]);
  const stopTyping = (0, import_react.useCallback)(() => {
    const currentActiveChannelId = activeChannelIdRef.current;
    if (!currentActiveChannelId || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "typing.stop", payload: { channel_id: currentActiveChannelId } }));
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  }, []);
  const startTyping = (0, import_react.useCallback)(() => {
    const currentActiveChannelId = activeChannelIdRef.current;
    if (!currentActiveChannelId || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "typing.start", payload: { channel_id: currentActiveChannelId } }));
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, TYPING_TIMEOUT);
  }, [stopTyping]);
  const createDMWithUser = (0, import_react.useCallback)(async (userId) => {
    try {
      const channel = await fetchFromComms("/channels/dm", {
        method: "POST",
        body: JSON.stringify({ user_id: userId })
      });
      await refreshChannels();
      return channel.id;
    } catch (error) {
      console.error("[AegisChat] Failed to create DM:", error);
      return null;
    }
  }, [fetchFromComms, refreshChannels]);
  const retryMessage = (0, import_react.useCallback)(async (tempId) => {
    const failedMessage = messages.find((m) => m.tempId === tempId && m.status === "failed");
    const currentActiveChannelId = activeChannelIdRef.current;
    if (!failedMessage || !currentActiveChannelId) return;
    setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "sending", errorMessage: void 0 } : m));
    try {
      await fetchFromComms(`/channels/${currentActiveChannelId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: failedMessage.content, type: failedMessage.type, metadata: failedMessage.metadata })
      });
    } catch (error) {
      console.error("[AegisChat] Failed to retry message:", error);
      setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "failed", errorMessage: error instanceof Error ? error.message : "Failed to send" } : m));
    }
  }, [messages, fetchFromComms]);
  const deleteFailedMessage = (0, import_react.useCallback)((tempId) => {
    setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
  }, []);
  (0, import_react.useEffect)(() => {
    connect();
  }, []);
  (0, import_react.useEffect)(() => {
    if (session && !isConnected && !isConnecting && autoConnect) {
      connectWebSocket();
    }
  }, [session, isConnected, isConnecting, autoConnect, connectWebSocket]);
  (0, import_react.useEffect)(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("[AegisChat] Failed to parse WebSocket message:", error);
        }
      };
    }
  }, [handleWebSocketMessage]);
  (0, import_react.useEffect)(() => {
    if (isConnected && channels.length === 0) {
      refreshChannels();
    }
  }, [isConnected, channels.length, refreshChannels]);
  (0, import_react.useEffect)(() => {
    const storedActiveChannel = getActiveChannelId();
    if (storedActiveChannel && !activeChannelId) {
      selectChannel(storedActiveChannel);
    }
  }, [getActiveChannelId, activeChannelId, selectChannel]);
  (0, import_react.useEffect)(() => {
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
    markAsRead
  };
}

// src/hooks/useAutoRead.ts
var import_react2 = require("react");
var SESSION_STORAGE_KEY2 = "@aegischat/activeChannel";
function useAutoRead(options = {}) {
  const [isFocused, setIsFocused] = (0, import_react2.useState)(false);
  (0, import_react2.useEffect)(() => {
    setIsFocused(typeof document !== "undefined" && document.hasFocus());
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);
  (0, import_react2.useEffect)(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const activeChannelId = sessionStorage.getItem(SESSION_STORAGE_KEY2);
        if (activeChannelId) {
          markAsRead(activeChannelId);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  const markAsRead = (0, import_react2.useCallback)(async (channelId) => {
    if (!isFocused) return;
    try {
      await channelsApi.markAsRead(channelId);
      options.onMarkAsRead?.(channelId);
    } catch (error) {
      console.error("[AegisChat] useAutoRead: Failed to mark as read:", error);
    }
  }, [isFocused, options.onMarkAsRead]);
  const markAllAsRead = (0, import_react2.useCallback)(async () => {
    if (!isFocused) return;
    try {
      const response = await channelsApi.list({});
      const channels = response.data.channels || [];
      await Promise.all(
        channels.filter((ch) => ch.unread_count > 0).map((ch) => channelsApi.markAsRead(ch.id))
      );
    } catch (error) {
      console.error("[AegisChat] useAutoRead: Failed to mark all as read:", error);
    }
  }, [isFocused]);
  return { markAsRead, markAllAsRead, isFocused };
}

// src/hooks/useChannels.ts
var import_react3 = require("react");
function useChannels(options = {}) {
  const { type, limit = 20, autoFetch = true, onChannelCreated, onError } = options;
  const [channels, setChannels] = (0, import_react3.useState)([]);
  const [isLoading, setIsLoading] = (0, import_react3.useState)(false);
  const [error, setError] = (0, import_react3.useState)(null);
  const abortControllerRef = (0, import_react3.useRef)(null);
  const fetchChannels = (0, import_react3.useCallback)(async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await channelsApi.list({ type, limit }, signal);
      if (signal?.aborted) return;
      setChannels(response.data.channels);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const error2 = err instanceof Error ? err : new Error("Failed to fetch channels");
      setError(error2);
      onError?.(error2);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [type, limit, onError]);
  const refetch = (0, import_react3.useCallback)(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    await fetchChannels(controller.signal);
  }, [fetchChannels]);
  const getOrCreateDM = (0, import_react3.useCallback)(async (userId) => {
    try {
      const response = await channelsApi.getOrCreateDM(userId);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      fetchChannels(controller.signal);
      onChannelCreated?.(response.data);
      return response.data;
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Failed to create DM");
      onError?.(error2);
      throw error2;
    }
  }, [fetchChannels, onChannelCreated, onError]);
  const markAsRead = (0, import_react3.useCallback)(async (channelId) => {
    try {
      await channelsApi.markAsRead(channelId);
      setChannels((prev) => prev.map((ch) => ch.id === channelId ? { ...ch, unread_count: 0 } : ch));
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Failed to mark as read");
      onError?.(error2);
      throw error2;
    }
  }, [onError]);
  (0, import_react3.useEffect)(() => {
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

// src/hooks/useMessages.ts
var import_react4 = require("react");
function useMessages(_options) {
  const [messages, setMessages] = (0, import_react4.useState)([]);
  const [isLoading, setIsLoading] = (0, import_react4.useState)(false);
  const [hasMore, setHasMore] = (0, import_react4.useState)(true);
  const sendMessage = (0, import_react4.useCallback)(async (params) => {
  }, []);
  const loadMore = (0, import_react4.useCallback)(async () => {
  }, []);
  return { messages, isLoading, hasMore, sendMessage, loadMore };
}

// src/hooks/useTypingIndicator.ts
var import_react5 = require("react");
function useTypingIndicator(_options) {
  const [typingUsers, setTypingUsers] = (0, import_react5.useState)([]);
  const startTyping = (0, import_react5.useCallback)(() => {
  }, []);
  const stopTyping = (0, import_react5.useCallback)(() => {
  }, []);
  return { typingUsers, startTyping, stopTyping };
}

// src/hooks/useReactions.ts
var import_react6 = require("react");
function useReactions(_options) {
  const [reactions, setReactions] = (0, import_react6.useState)([]);
  const addReaction = async (_emoji) => {
  };
  const removeReaction = async (_emoji) => {
  };
  return { reactions, addReaction, removeReaction };
}

// src/hooks/useFileUpload.ts
var import_react7 = require("react");
function useFileUpload(_options) {
  const [uploadProgress, setUploadProgress] = (0, import_react7.useState)([]);
  const upload = async (_file) => null;
  return { uploadProgress, upload };
}

// src/hooks/useMentions.ts
function useMentions(_options = {}) {
  const parseMentions = (content) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]);
    }
    return mentions;
  };
  const highlightMentions = (content) => {
    return content.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="mention">@$1</span>');
  };
  const isUserMentioned = (content, userId) => {
    const mentions = parseMentions(content);
    return mentions.includes(userId);
  };
  return { parseMentions, highlightMentions, isUserMentioned };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  channelsApi,
  chatApi,
  configureApiClient,
  filesApi,
  messagesApi,
  reactionsApi,
  useAutoRead,
  useChannels,
  useChat,
  useFileUpload,
  useMentions,
  useMessages,
  useReactions,
  useTypingIndicator,
  usersApi
});
//# sourceMappingURL=index.js.map