import type { RealtimeItem } from '@openai/agents/realtime';
import type { ConversationMessage } from '@/features/voice-agent/model/voice-agent.atoms';

const isAssistMessage = (
  item: RealtimeItem,
): item is RealtimeItem & { status?: string } =>
  item.type === 'message' && item.role === 'assistant';

const extractTextFromItem = (item: RealtimeItem): string => {
  if (item.type !== 'message') {
    return '';
  }

  return item.content
    .map((content) => {
      if (content.type === 'input_text' || content.type === 'output_text') {
        return content.text;
      }

      if (
        (content.type === 'input_audio' || content.type === 'output_audio') &&
        content.transcript
      ) {
        return content.transcript;
      }

      return null;
    })
    .filter(Boolean)
    .join(' ')
    .trim();
};

export const mapRealtimeItemToMessage = (
  item: RealtimeItem,
): ConversationMessage | null => {
  if (item.type !== 'message') {
    return null;
  }

  const text = extractTextFromItem(item);

  if (!text && isAssistMessage(item)) {
    return {
      id: item.itemId,
      role: item.role,
      text,
      status:
        item.status === 'in_progress' ||
        item.status === 'completed' ||
        item.status === 'incomplete'
          ? item.status
          : 'completed',
    };
  }

  if (!text) {
    return null;
  }

  const status =
    isAssistMessage(item) &&
    (item.status === 'in_progress' ||
      item.status === 'completed' ||
      item.status === 'incomplete')
      ? item.status
      : 'completed';

  return {
    id: item.itemId,
    role: item.role,
    text,
    status,
  };
};

