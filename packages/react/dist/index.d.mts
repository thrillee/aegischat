type UserStatus = 'online' | 'offline' | 'away' | 'busy';
interface UserSummary {
    id: string;
    display_name: string;
    avatar_url?: string;
    status: UserStatus;
}
type ChannelType = 'dm' | 'public' | 'private';
interface Channel {
    id: string;
    name: string;
    type: ChannelType;
    description?: string;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
interface MessageSummary {
    id: string;
    content: string;
    created_at: string;
    sender?: UserSummary;
}
interface ChannelListItem {
    id: string;
    name: string;
    type: ChannelType;
    unread_count: number;
    last_message: MessageSummary | null;
    /** Only present for direct message channels */
    other_member?: UserSummary;
    metadata: Record<string, unknown>;
}
type MessageType = 'text' | 'file' | 'system';
interface FileAttachment {
    id: string;
    filename: string;
    mime_type: string;
    size: number;
    url: string;
}
interface MessageReactions {
    [emoji: string]: string[];
}
interface MessageMetadata {
    edited?: boolean;
    edited_at?: string;
    reactions?: MessageReactions;
    mentions?: string[];
    files?: FileAttachment[];
}
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
interface Message {
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
interface TypingUser {
    id: string;
    displayName: string;
    avatarUrl?: string;
    startedAt: number;
}
interface TypingEvent {
    channel_id: string;
    user: UserSummary;
}
interface ReactionEvent {
    channel_id: string;
    message_id: string;
    emoji: string;
    user: UserSummary;
}
interface ReactionSummary {
    emoji: string;
    count: number;
    users: UserSummary[];
    hasReacted: boolean;
}
interface UploadUrlResponse {
    upload_url: string;
    file_id: string;
    expires_at: string;
}
interface UploadProgress {
    fileId: string;
    fileName: string;
    progress: number;
    status: 'pending' | 'uploading' | 'confirming' | 'complete' | 'error';
    error?: string;
}
interface ApiResponse<T> {
    data: T;
    message?: string;
}
interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
}
interface PaginationParams {
    limit?: number;
    offset?: number;
}
interface PaginationMeta {
    total: number;
    limit: number;
    offset: number;
}
interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}
type WebSocketEventType = 'message.new' | 'message.updated' | 'message.deleted' | 'message.delivered' | 'message.read' | 'message.delivered.batch' | 'message.read.batch' | 'typing.start' | 'typing.stop' | 'reaction.added' | 'reaction.removed' | 'user.online' | 'user.offline' | 'channel.created' | 'channel.updated' | 'channel.deleted';
interface WebSocketMessage {
    type: WebSocketEventType;
    payload: unknown;
    timestamp?: string;
}
type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
interface ChatSession {
    user_id: string;
    comms_user_id: string;
    access_token: string;
    refresh_token: string;
    expires_at: number;
    websocket_url: string;
    api_url: string;
}
interface ChatConnectParams {
    role: 'lawyer' | 'client';
    client_id?: string;
}
interface AegisConfig {
    apiUrl: string;
    wsUrl: string;
    getAccessToken: () => Promise<string> | string;
    onUnauthorized?: () => void;
}
interface MessagesResponse {
    messages: Message[];
    has_more: boolean;
    oldest_id?: string;
}
interface ChannelsResponse {
    channels: ChannelListItem[];
}

interface UseChatOptions {
    config?: AegisConfig;
    role?: "lawyer" | "client";
    clientId?: string;
    initialSession?: ChatSession | null;
    autoConnect?: boolean;
    onMessage?: (message: Message) => void;
    onTyping?: (channelId: string, user: TypingUser) => void;
    onConnectionChange?: (connected: boolean) => void;
}
interface UseChatReturn {
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
    sendMessage: (content: string, options?: {
        type?: string;
        parent_id?: string;
        metadata?: Record<string, unknown>;
    }) => Promise<void>;
    sendMessageWithFiles: (content: string, files: File[], options?: {
        type?: string;
        parent_id?: string;
        metadata?: Record<string, unknown>;
    }) => Promise<void>;
    uploadFile: (file: File) => Promise<FileAttachment | null>;
    loadMoreMessages: () => Promise<void>;
    startTyping: () => void;
    stopTyping: () => void;
    refreshChannels: () => Promise<void>;
    createDMWithUser: (userId: string) => Promise<string | null>;
    retryMessage: (tempId: string) => Promise<void>;
    deleteFailedMessage: (tempId: string) => void;
    markAsRead: (channelId: string) => Promise<void>;
    setup: (options: UseChatOptions) => void;
}
declare function useChat(options?: Partial<UseChatOptions>): UseChatReturn;

interface UseAutoReadOptions {
    onMarkAsRead?: (channelId: string) => void;
}
interface UseAutoReadReturn {
    markAsRead: (channelId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    isFocused: boolean;
}
declare function useAutoRead(options?: UseAutoReadOptions): UseAutoReadReturn;

interface UseChannelsOptions {
    type?: 'direct' | 'public' | 'private';
    limit?: number;
    autoFetch?: boolean;
    onChannelCreated?: (channel: Channel) => void;
    onError?: (error: Error) => void;
}
interface UseChannelsReturn {
    channels: ChannelListItem[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    getOrCreateDM: (userId: string) => Promise<Channel>;
    markAsRead: (channelId: string) => Promise<void>;
}
declare function useChannels(options?: UseChannelsOptions): UseChannelsReturn;

interface UseMessagesOptions {
    channelId: string;
}
interface UseMessagesReturn {
    messages: Message[];
    isLoading: boolean;
    hasMore: boolean;
    sendMessage: (params: {
        content: string;
        type?: string;
        metadata?: Record<string, unknown>;
    }) => Promise<void>;
    loadMore: () => Promise<void>;
}
declare function useMessages(_options: UseMessagesOptions): UseMessagesReturn;

interface UseTypingIndicatorOptions {
    channelId: string;
    ws?: WebSocket | null;
}
interface UseTypingIndicatorReturn {
    typingUsers: TypingUser[];
    startTyping: () => void;
    stopTyping: () => void;
}
declare function useTypingIndicator(_options: UseTypingIndicatorOptions): UseTypingIndicatorReturn;

interface UseReactionsOptions {
    channelId: string;
    messageId: string;
}
interface UseReactionsReturn {
    reactions: ReactionSummary[];
    addReaction: (emoji: string) => Promise<void>;
    removeReaction: (emoji: string) => Promise<void>;
}
declare function useReactions(_options: UseReactionsOptions): UseReactionsReturn;

interface UseFileUploadOptions {
    channelId: string;
}
interface UseFileUploadReturn {
    uploadProgress: UploadProgress[];
    upload: (file: File) => Promise<FileAttachment | null>;
}
declare function useFileUpload(_options: UseFileUploadOptions): UseFileUploadReturn;

interface UseMentionsOptions {
}
interface UseMentionsReturn {
    parseMentions: (content: string) => string[];
    highlightMentions: (content: string) => string;
    isUserMentioned: (content: string, userId: string) => boolean;
}
declare function useMentions(_options?: UseMentionsOptions): UseMentionsReturn;

declare function configureApiClient(config: {
    baseUrl: string;
    getAccessToken: () => Promise<string> | string;
    onUnauthorized?: () => void;
}): void;
declare const chatApi: {
    /**
     * Connect to chat session
     */
    connect(params: ChatConnectParams, signal?: AbortSignal): Promise<ApiResponse<ChatSession>>;
    /**
     * Refresh access token
     */
    refreshToken(refreshToken: string, signal?: AbortSignal): Promise<ApiResponse<{
        access_token: string;
        expires_in: number;
    }>>;
};
declare const channelsApi: {
    /**
     * List channels
     */
    list(options?: {
        type?: string;
        limit?: number;
    }, signal?: AbortSignal): Promise<ApiResponse<{
        channels: ChannelListItem[];
    }>>;
    /**
     * Get channel by ID
     */
    get(channelId: string, signal?: AbortSignal): Promise<ApiResponse<Channel>>;
    /**
     * Get or create DM channel
     */
    getOrCreateDM(userId: string, signal?: AbortSignal): Promise<ApiResponse<Channel>>;
    /**
     * Create channel
     */
    create(data: {
        name: string;
        type?: string;
        description?: string;
        metadata?: Record<string, unknown>;
    }, signal?: AbortSignal): Promise<ApiResponse<Channel>>;
    /**
     * Mark channel as read
     */
    markAsRead(channelId: string, signal?: AbortSignal): Promise<ApiResponse<{
        unread_count: number;
    }>>;
    /**
     * Get channel members
     */
    getMembers(channelId: string, signal?: AbortSignal): Promise<ApiResponse<{
        members: UserSummary[];
    }>>;
    /**
     * Update channel
     */
    update(channelId: string, data: {
        name?: string;
        description?: string;
        metadata?: Record<string, unknown>;
    }, signal?: AbortSignal): Promise<ApiResponse<Channel>>;
};
declare const messagesApi: {
    /**
     * List messages in a channel
     */
    list(channelId: string, options?: {
        limit?: number;
        before?: string;
    }, signal?: AbortSignal): Promise<ApiResponse<MessagesResponse>>;
    /**
     * Send a message
     */
    send(channelId: string, data: {
        content: string;
        type?: string;
        parent_id?: string;
        metadata?: Record<string, unknown>;
        file_ids?: string[];
    }, signal?: AbortSignal): Promise<ApiResponse<Message>>;
    /**
     * Update a message
     */
    update(channelId: string, messageId: string, data: {
        content?: string;
        metadata?: Record<string, unknown>;
    }, signal?: AbortSignal): Promise<ApiResponse<Message>>;
    /**
     * Delete a message
     */
    delete(channelId: string, messageId: string, signal?: AbortSignal): Promise<ApiResponse<{
        success: boolean;
    }>>;
    /**
     * Mark messages as delivered
     */
    markDelivered(channelId: string, signal?: AbortSignal): Promise<ApiResponse<{
        success: boolean;
    }>>;
    /**
     * Mark messages as read
     */
    markRead(channelId: string, signal?: AbortSignal): Promise<ApiResponse<{
        success: boolean;
    }>>;
};
declare const reactionsApi: {
    /**
     * Add reaction to a message
     */
    add(channelId: string, messageId: string, emoji: string, signal?: AbortSignal): Promise<ApiResponse<{
        reactions: ReactionSummary[];
    }>>;
    /**
     * Remove reaction from a message
     */
    remove(channelId: string, messageId: string, emoji: string, signal?: AbortSignal): Promise<ApiResponse<{
        reactions: ReactionSummary[];
    }>>;
};
declare const filesApi: {
    /**
     * Get upload URL
     */
    getUploadUrl(data: {
        file_name: string;
        file_type: string;
        file_size: number;
    }, signal?: AbortSignal): Promise<ApiResponse<UploadUrlResponse>>;
    /**
     * Confirm file upload
     */
    confirm(fileId: string, signal?: AbortSignal): Promise<ApiResponse<{
        file: FileAttachment;
    }>>;
    /**
     * Get download URL
     */
    getDownloadUrl(fileId: string, signal?: AbortSignal): Promise<ApiResponse<{
        url: string;
        expires_at: string;
    }>>;
};
declare const usersApi: {
    /**
     * Search users
     */
    search(query: string, signal?: AbortSignal): Promise<ApiResponse<{
        users: UserSummary[];
    }>>;
    /**
     * Get user by ID
     */
    get(userId: string, signal?: AbortSignal): Promise<ApiResponse<UserSummary>>;
};

export { type AegisConfig, type ApiError, type ApiResponse, type Channel, type ChannelListItem, type ChannelType, type ChannelsResponse, type ChatConnectParams, type ChatSession, type FileAttachment, type Message, type MessageMetadata, type MessageStatus, type MessageSummary, type MessageType, type MessagesResponse, type PaginatedResponse, type PaginationMeta, type PaginationParams, type ReactionEvent, type ReactionSummary, type TypingEvent, type TypingUser, type UploadProgress, type UseAutoReadOptions, type UseAutoReadReturn, type UseChannelsOptions, type UseChannelsReturn, type UseChatOptions, type UseChatReturn, type UseFileUploadOptions, type UseMentionsOptions, type UseMessagesOptions, type UseMessagesReturn, type UseReactionsOptions, type UseTypingIndicatorOptions, type UserStatus, type UserSummary, type WebSocketMessage, type WebSocketStatus, channelsApi, chatApi, configureApiClient, filesApi, messagesApi, reactionsApi, useAutoRead, useChannels, useChat, useFileUpload, useMentions, useMessages, useReactions, useTypingIndicator, usersApi };
