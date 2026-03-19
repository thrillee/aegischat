// ============================================================================
// AegisChat React SDK - Main Entry Point
// ============================================================================

export { useChat } from './hooks/useChat';
export type { UseChatOptions, UseChatReturn } from './hooks/useChat';

export { useAutoRead } from './hooks/useAutoRead';
export type { UseAutoReadOptions, UseAutoReadReturn } from './hooks/useAutoRead';

export { useChannels } from './hooks/useChannels';
export type { UseChannelsOptions, UseChannelsReturn } from './hooks/useChannels';

export { useMessages } from './hooks/useMessages';
export type { UseMessagesOptions, UseMessagesReturn } from './hooks/useMessages';

export { useTypingIndicator } from './hooks/useTypingIndicator';
export type { UseTypingIndicatorOptions } from './hooks/useTypingIndicator';

export { useReactions } from './hooks/useReactions';
export type { UseReactionsOptions } from './hooks/useReactions';

export { useFileUpload } from './hooks/useFileUpload';
export type { UseFileUploadOptions } from './hooks/useFileUpload';

export { useMentions } from './hooks/useMentions';
export type { UseMentionsOptions } from './hooks/useMentions';

export {
  chatApi,
  channelsApi,
  messagesApi,
  reactionsApi,
  filesApi,
  usersApi,
  configureApiClient,
} from './services/api';

export type {
  AegisConfig,
  ChatSession,
  ChatConnectParams,
  UserSummary,
  UserStatus,
  Channel,
  ChannelListItem,
  ChannelType,
  Message,
  MessageSummary,
  MessageType,
  MessageStatus,
  MessageMetadata,
  FileAttachment,
  TypingUser,
  TypingEvent,
  ReactionSummary,
  ReactionEvent,
  UploadProgress,
  WebSocketMessage,
  WebSocketStatus,
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  MessagesResponse,
  ChannelsResponse,
} from './types';
