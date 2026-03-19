// ============================================================================
// AegisChat React SDK - API Service
// ============================================================================

import type {
  ApiResponse,
  ChatSession,
  ChatConnectParams,
  Channel,
  ChannelListItem,
  Message,
  MessagesResponse,
  UserSummary,
  ReactionSummary,
  FileAttachment,
  UploadUrlResponse,
} from "../types";

let baseUrl = "";
let getAccessToken: () => Promise<string> | string = () => "";
let onUnauthorized: (() => void) | undefined;

export function configureApiClient(config: {
  baseUrl: string;
  getAccessToken: () => Promise<string> | string;
  onUnauthorized?: () => void;
}): void {
  baseUrl = config.baseUrl;
  getAccessToken = config.getAccessToken;
  onUnauthorized = config.onUnauthorized;
}

async function fetchWithAuth<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await (typeof getAccessToken === "function"
    ? getAccessToken()
    : getAccessToken);

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
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

export const chatApi = {
  /**
   * Connect to chat session
   */
  async connect(
    params: ChatConnectParams,
    signal?: AbortSignal,
  ): Promise<ApiResponse<ChatSession>> {
    return fetchWithAuth("/chat/connect", {
      method: "POST",
      body: JSON.stringify(params),
      signal,
    });
  },

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ access_token: string; expires_in: number }>> {
    return fetchWithAuth("/chat/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal,
    });
  },
};

export const channelsApi = {
  /**
   * List channels
   */
  async list(
    options: { type?: string; limit?: number } = {},
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ channels: ChannelListItem[] }>> {
    const params = new URLSearchParams();
    if (options.type) params.append("type", options.type);
    if (options.limit) params.append("limit", String(options.limit));
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchWithAuth(`/channels${query}`, { signal });
  },

  /**
   * Get channel by ID
   */
  async get(
    channelId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<Channel>> {
    return fetchWithAuth(`/channels/${channelId}`, { signal });
  },

  /**
   * Get or create DM channel
   */
  async getOrCreateDM(
    userId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<Channel>> {
    return fetchWithAuth("/channels/dm", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
      signal,
    });
  },

  /**
   * Create channel
   */
  async create(
    data: {
      name: string;
      type?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
    signal?: AbortSignal,
  ): Promise<ApiResponse<Channel>> {
    return fetchWithAuth("/api/v1/channels", {
      method: "POST",
      body: JSON.stringify(data),
      signal,
    });
  },

  /**
   * Mark channel as read
   */
  async markAsRead(
    channelId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ unread_count: number }>> {
    return fetchWithAuth(`/api/v1/channels/${channelId}/read`, {
      method: "POST",
      signal,
    });
  },

  /**
   * Get channel members
   */
  async getMembers(
    channelId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ members: UserSummary[] }>> {
    return fetchWithAuth(`/channels/${channelId}/members`, { signal });
  },

  /**
   * Update channel
   */
  async update(
    channelId: string,
    data: {
      name?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
    signal?: AbortSignal,
  ): Promise<ApiResponse<Channel>> {
    return fetchWithAuth(`/api/v1/channels/${channelId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      signal,
    });
  },
};

export const messagesApi = {
  /**
   * List messages in a channel
   */
  async list(
    channelId: string,
    options: { limit?: number; before?: string } = {},
    signal?: AbortSignal,
  ): Promise<ApiResponse<MessagesResponse>> {
    const params = new URLSearchParams();
    if (options.limit) params.append("limit", String(options.limit));
    if (options.before) params.append("before", options.before);
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchWithAuth(`/channels/${channelId}/messages${query}`, {
      signal,
    });
  },

  /**
   * Send a message
   */
  async send(
    channelId: string,
    data: {
      content: string;
      type?: string;
      parent_id?: string;
      metadata?: Record<string, unknown>;
      file_ids?: string[];
    },
    signal?: AbortSignal,
  ): Promise<ApiResponse<Message>> {
    return fetchWithAuth(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
      signal,
    });
  },

  /**
   * Update a message
   */
  async update(
    channelId: string,
    messageId: string,
    data: { content?: string; metadata?: Record<string, unknown> },
    signal?: AbortSignal,
  ): Promise<ApiResponse<Message>> {
    return fetchWithAuth(`/channels/${channelId}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      signal,
    });
  },

  /**
   * Delete a message
   */
  async delete(
    channelId: string,
    messageId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ success: boolean }>> {
    return fetchWithAuth(`/channels/${channelId}/messages/${messageId}`, {
      method: "DELETE",
      signal,
    });
  },

  /**
   * Mark messages as delivered
   */
  async markDelivered(
    channelId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ success: boolean }>> {
    return fetchWithAuth(`/channels/${channelId}/messages/delivered`, {
      method: "POST",
      signal,
    });
  },

  /**
   * Mark messages as read
   */
  async markRead(
    channelId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ success: boolean }>> {
    return fetchWithAuth(`/channels/${channelId}/messages/read`, {
      method: "POST",
      signal,
    });
  },
};

export const reactionsApi = {
  /**
   * Add reaction to a message
   */
  async add(
    channelId: string,
    messageId: string,
    emoji: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ reactions: ReactionSummary[] }>> {
    return fetchWithAuth(
      `/channels/${channelId}/messages/${messageId}/reactions`,
      {
        method: "POST",
        body: JSON.stringify({ emoji }),
        signal,
      },
    );
  },

  /**
   * Remove reaction from a message
   */
  async remove(
    channelId: string,
    messageId: string,
    emoji: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ reactions: ReactionSummary[] }>> {
    return fetchWithAuth(
      `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      { method: "DELETE", signal },
    );
  },
};

export const filesApi = {
  /**
   * Get upload URL
   */
  async getUploadUrl(
    data: { file_name: string; file_type: string; file_size: number },
    signal?: AbortSignal,
  ): Promise<ApiResponse<UploadUrlResponse>> {
    return fetchWithAuth("/files/upload-url", {
      method: "POST",
      body: JSON.stringify(data),
      signal,
    });
  },

  /**
   * Confirm file upload
   */
  async confirm(
    fileId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ file: FileAttachment }>> {
    return fetchWithAuth("/files", {
      method: "POST",
      body: JSON.stringify({ file_id: fileId }),
      signal,
    });
  },

  /**
   * Get download URL
   */
  async getDownloadUrl(
    fileId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ url: string; expires_at: string }>> {
    return fetchWithAuth(`/files/${fileId}/download`, { signal });
  },
};

export const usersApi = {
  /**
   * Search users
   */
  async search(
    query: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<{ users: UserSummary[] }>> {
    return fetchWithAuth(`/users/search?q=${encodeURIComponent(query)}`, {
      signal,
    });
  },

  /**
   * Get user by ID
   */
  async get(
    userId: string,
    signal?: AbortSignal,
  ): Promise<ApiResponse<UserSummary>> {
    return fetchWithAuth(`/users/${userId}`, { signal });
  },
};

export default {
  chatApi,
  channelsApi,
  messagesApi,
  reactionsApi,
  filesApi,
  usersApi,
  configureApiClient,
};
