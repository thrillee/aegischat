# AegisChat React SDK

Real-time chat and messaging SDK for React applications.

## Installation

```bash
npm install @aegischat/react
```

## Configuration

Create a `.npmrc` file in your project root:

```
@aegischat:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

You'll need a GitHub Personal Access Token with `read:packages` scope.

## Usage

### Lawyer Portal

```typescript
import { useChat } from '@aegischat/react';

function Chat() {
  const chat = useChat({
    config: {
      apiUrl: 'https://api.example.com',
      wsUrl: 'wss://ws.example.com',
      getAccessToken: async () => {
        // Your auth logic
        return authToken;
      },
    },
    role: 'lawyer',
  });

  return (
    <div>
      <ChannelList channels={chat.channels} onSelect={chat.selectChannel} />
      <MessageList messages={chat.messages} />
      <MessageInput onSend={chat.sendMessage} />
    </div>
  );
}
```

### Customer Portal

```typescript
const chat = useChat({
  config: {
    apiUrl: 'https://api.example.com',
    wsUrl: 'wss://ws.example.com',
    getAccessToken: async () => {
      return authToken;
    },
  },
  role: 'client',
  clientId: 'user-123', // Required for client role
});
```

## Features

- Real-time messaging via WebSocket
- Automatic reconnection
- Optimistic message updates
- Typing indicators
- File uploads
- Message reactions
- Unread count tracking
- Auto mark as read
- Channel sorting

## API

### useChat Options

| Option | Type | Description |
|--------|------|-------------|
| config | AegisConfig | API and WebSocket configuration |
| role | 'lawyer' \| 'client' | User role |
| clientId | string | Required for client role |
| autoConnect | boolean | Auto connect on mount (default: true) |
| onMessage | (message) => void | Callback for new messages |
| onTyping | (channelId, user) => void | Callback for typing events |
| onConnectionChange | (connected) => void | Connection status callback |

### useChat Return

| Property | Type | Description |
|----------|------|-------------|
| session | ChatSession \| null | Current chat session |
| isConnected | boolean | WebSocket connection status |
| channels | ChannelListItem[] | List of channels |
| messages | Message[] | Current channel messages |
| activeChannelId | string \| null | Selected channel ID |
| selectChannel | (channelId) => void | Select a channel |
| sendMessage | (content, options?) => Promise | Send a message |
| sendMessageWithFiles | (content, files, options?) => Promise | Send with files |
| uploadFile | (file) => Promise | Upload a file |
| startTyping | () => void | Send typing start |
| stopTyping | () => void | Send typing stop |
| markAsRead | (channelId) => Promise | Mark channel as read |

## License

MIT
