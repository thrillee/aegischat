// ============================================================================
// AegisChat React SDK - useMentions Hook
// ============================================================================

export interface UseMentionsOptions {}

export interface UseMentionsReturn {
  parseMentions: (content: string) => string[];
  highlightMentions: (content: string) => string;
  isUserMentioned: (content: string, userId: string) => boolean;
}

export function useMentions(_options: UseMentionsOptions = {}): UseMentionsReturn {
  const parseMentions = (content: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]);
    }
    return mentions;
  };

  const highlightMentions = (content: string): string => {
    return content.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="mention">@$1</span>');
  };

  const isUserMentioned = (content: string, userId: string): boolean => {
    const mentions = parseMentions(content);
    return mentions.includes(userId);
  };

  return { parseMentions, highlightMentions, isUserMentioned };
}

export default useMentions;
