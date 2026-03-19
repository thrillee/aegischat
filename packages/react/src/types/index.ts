// ============================================================================
// AegisChat React SDK - TypeScript Types
// ============================================================================

// ----------------------------------------------------------------------------
// User Types
// ----------------------------------------------------------------------------

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface UserSummary {
  id: string;
  display_name: string;
  avatar_url?: string;
  status: UserStatus;
}

export interface User extends UserSummary {
  external_id: string;
  email?: string;
  last_seen_at?: string;
  metadata: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// Channel Types
// ----------------------------------------------------------------------------

export type ChannelType = 'dm' | 'public' | 'private';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChannelMember {
  id: string;
  user_id: string;
  user: UserSummary;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface ChannelWithMembers extends Channel {
  members: ChannelMember[];
}

export interface MessageSummary {
  id: string;
  content: string;
  created_at: string;
  sender?: UserSummary;
}

export interface ChannelListItem {
  id: string;
  name: string;
  type: ChannelType;
  unread_count: number;
  last_message: MessageSummary | null;
  /** Only present for direct message channels */
  other_member?: UserSummary;
  metadata: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// Message Types
// ----------------------------------------------------------------------------

export type MessageType = 'text' | 'file' | 'system';

export interface FileAttachment {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  url: string;
}

export interface MessageReactions {
  [emoji: string]: string[]; // emoji -> user IDs
}

export interface MessageMetadata {
  edited?: boolean;
  edited_at?: string;
  reactions?: MessageReactions;
  mentions?: string[];
  files?: FileAttachment[];
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  parent_id?: string;
  metadata: MessageMetadata;
  created_at: string;
  updated_at: string;
  /** Client-side only: temporary ID for optimistic updates */
  tempId?: string;
  /** Client-side only: delivery status */
  status?: MessageStatus;
  /** Client-side only: error message for failed messages */
  errorMessage?: string;
  /** Client-side only: if message was deleted */
  deleted?: boolean;
}

export interface SendMessageParams {
  content: string;
  type?: MessageType;
  parent_id?: string;
  metadata?: Record<string, unknown>;
  file_ids?: string[];
}

export interface UpdateMessageParams {
  content?: string;
  metadata?: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// Typing Types
// ----------------------------------------------------------------------------

export interface TypingUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  startedAt: number;
}

export interface TypingEvent {
  channel_id: string;
  user: UserSummary;
}

// ----------------------------------------------------------------------------
// Reaction Types
// ----------------------------------------------------------------------------

export interface ReactionEvent {
  channel_id: string;
  message_id: string;
  emoji: string;
  user: UserSummary;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: UserSummary[];
  hasReacted: boolean;
}

// ----------------------------------------------------------------------------
// File Types
// ----------------------------------------------------------------------------

export interface UploadUrlRequest {
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface UploadUrlResponse {
  upload_url: string;
  file_id: string;
  expires_at: string;
}

export interface DownloadUrlResponse {
  url: string;
  expires_at: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error';
  error?: string;
}

// ----------------------------------------------------------------------------
// API Types
// ----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ----------------------------------------------------------------------------
// WebSocket Types
// ----------------------------------------------------------------------------

export type WebSocketEventType =
  | 'message.new'
  | 'message.updated'
  | 'message.deleted'
  | 'message.delivered'
  | 'message.read'
  | 'message.delivered.batch'
  | 'message.read.batch'
  | 'typing.start'
  | 'typing.stop'
  | 'reaction.added'
  | 'reaction.removed'
  | 'user.online'
  | 'user.offline'
  | 'channel.created'
  | 'channel.updated'
  | 'channel.deleted';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: unknown;
  timestamp?: string;
}

export interface WebSocketConfig {
  url: string;
  accessToken: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// ----------------------------------------------------------------------------
// Authentication Types
// ----------------------------------------------------------------------------

export interface ChatSession {
  user_id: string;
  comms_user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  websocket_url: string;
  api_url: string;
}

export interface ChatConnectParams {
  role: 'lawyer' | 'client';
  client_id?: string;
}

// ----------------------------------------------------------------------------
// Config Types
// ----------------------------------------------------------------------------

export interface AegisConfig {
  apiUrl: string;
  wsUrl: string;
  getAccessToken: () => Promise<string> | string;
  onUnauthorized?: () => void;
}

export interface CommsConfig extends AegisConfig {}

// ----------------------------------------------------------------------------
// Response Types
// ----------------------------------------------------------------------------

export interface MessagesResponse {
  messages: Message[];
  has_more: boolean;
  oldest_id?: string;
}

export interface ChannelsResponse {
  channels: ChannelListItem[];
}

export interface UsersResponse {
  users: UserSummary[];
}

// ----------------------------------------------------------------------------
// Hook Return Types
// ----------------------------------------------------------------------------

export interface UseChannelsReturn {
  channels: ChannelListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getOrCreateDM: (userId: string) => Promise<Channel>;
  markAsRead: (channelId: string) => Promise<void>;
}

export interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  sendMessage: (params: SendMessageParams) => Promise<void>;
  sendMessageWithFiles: (params: SendMessageParams, files: File[]) => Promise<void>;
  retryMessage: (tempId: string) => Promise<void>;
  deleteFailedMessage: (tempId: string) => void;
  loadMore: () => Promise<void>;
  uploadProgress: UploadProgress[];
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
}

export interface UseTypingIndicatorReturn {
  startTyping: () => void;
  stopTyping: () => void;
}

export interface UseTypingUsersReturn {
  typingUsers: TypingUser[];
}

export interface UseReactionsReturn {
  reactions: ReactionSummary[];
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  hasUserReacted: (emoji: string) => boolean;
  getReactionCount: (emoji: string) => number;
  getReactionsList: (emoji: string) => UserSummary[];
}

export interface UseFileUploadReturn {
  upload: (file: File) => Promise<FileAttachment | null>;
  uploadProgress: UploadProgress[];
}

export interface UseMentionsReturn {
  parseMentions: (content: string) => string[];
  highlightMentions: (content: string) => string;
  isUserMentioned: (content: string, userId: string) => boolean;
}
