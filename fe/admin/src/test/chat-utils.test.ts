import { describe, expect, it } from 'vitest';
import { chatContentLength, createChatMessageId, mergeChatMessages } from '../utils/chat';
import type { ChatMessage } from '../types/chat';
describe('chat utilities', () => {
  it('deduplicates messages and orders by sequence', () => {
    const make = (id: number) => ({ id, messageSeq: id }) as ChatMessage;
    expect(mergeChatMessages([make(2), make(1)], [make(2), make(3)]).map(m => m.id)).toEqual([1, 2, 3]);
  });
  it('counts emoji the same way as the backend Unicode limit', () => {
    expect(chatContentLength('  👋a  ')).toBe(2);
  });
  it('creates valid distinct retry keys', () => {
    const id = createChatMessageId(); expect(id).toMatch(/^[A-Za-z0-9_-]{1,64}$/); expect(createChatMessageId()).not.toBe(id);
  });
});
