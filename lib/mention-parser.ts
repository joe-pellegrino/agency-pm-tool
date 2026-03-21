/**
 * Mention format: @[Name](userId)
 * Pattern: @\[([^\]]+)\]\(([^)]+)\)
 */

export interface ParsedMention {
  name: string;
  userId: string;
}

export function parseMentions(text: string): ParsedMention[] {
  const pattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: ParsedMention[] = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    mentions.push({
      name: match[1],
      userId: match[2],
    });
  }

  return mentions;
}

export function extractMentionedUserIds(text: string): string[] {
  return [...new Set(parseMentions(text).map(m => m.userId))];
}

/**
 * Render mentions as styled spans with the given color
 */
export function renderMentionedText(text: string): (string | { type: 'mention'; name: string; userId: string })[] {
  const parts: (string | { type: 'mention'; name: string; userId: string })[] = [];
  const pattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add mention
    parts.push({
      type: 'mention',
      name: match[1],
      userId: match[2],
    });
    lastIndex = pattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
