import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '@/api/chat.api';
import { getApiErrorMessage } from '@/api/axiosClient';
import { subscribeRealtime } from '@/socket';
import type { ChatConversation, ChatMessage } from '@/types/chat';
import { chatContentLength, createChatMessageId, mergeChatMessages } from '@/utils/chat';

export function useCustomerChat() {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [olderSeq, setOlderSeq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true), [loadingOlder, setLoadingOlder] = useState(false), [sending, setSending] = useState(false);
  const [draft, setDraft] = useState(''), [error, setError] = useState<string | null>(null);
  const active = useRef(false), version = useRef(0), id = useRef<number | null>(null);
  const rows = useRef<ChatMessage[]>([]), historyLoaded = useRef(false);
  const starting = useRef(false), sendingRef = useRef(false), reading = useRef(false), paging = useRef(false);
  const pending = useRef<{ id: number; content: string; key: string } | null>(null);

  const refresh = useCallback(async () => {
    const target = id.current;
    if (!active.current || starting.current || target === null || AppState.currentState !== 'active') return;
    const current = ++version.current;
    try {
      const [detail, history] = await Promise.all([api.getChat(target), api.getChatMessages(target)]);
      if (!active.current || version.current !== current || id.current !== target) return;
      const merged = mergeChatMessages(rows.current, history.messages);
      const gap = merged.some((item, index) => index > 0 && merged[index - 1].messageSeq > item.messageSeq + 1)
        && detail.lastMessageSeq >= (rows.current[0]?.messageSeq ?? 0);
      rows.current = gap ? mergeChatMessages([], history.messages) : merged;
      setMessages(rows.current); setConversation(detail); setError(null);
      if (!historyLoaded.current || gap) setOlderSeq(history.pagination.nextBeforeSeq);
      historyLoaded.current = true;
    } catch (cause) { if (active.current && version.current === current) setError(getApiErrorMessage(cause, 'Không thể tải cuộc trò chuyện.')); }
    finally { if (active.current && version.current === current) setLoading(false); }
  }, []);
  const start = useCallback(async () => {
    if (starting.current) return;
    starting.current = true;
    const current = ++version.current;
    setLoading(true); setError(null);
    try {
      const detail = await api.openChat();
      const history = await api.getChatMessages(detail.id);
      if (!active.current || version.current !== current) return;
      id.current = detail.id; rows.current = mergeChatMessages([], history.messages);
      historyLoaded.current = true; pending.current = null;
      setConversation(detail); setMessages(rows.current); setOlderSeq(history.pagination.nextBeforeSeq);
    } catch (cause) { if (active.current && version.current === current) setError(getApiErrorMessage(cause, 'Chưa thể mở chat với cửa hàng.')); }
    finally { if (version.current === current) { starting.current = false; if (active.current) setLoading(false); } }
  }, []);
  useFocusEffect(useCallback(() => {
    active.current = true;
    setSending(sendingRef.current); setLoadingOlder(paging.current);
    if (id.current === null) void start(); else void refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (payload: { conversationId: number }) => {
      if (payload.conversationId !== id.current) return;
      clearTimeout(timer); timer = setTimeout(() => void refresh(), 150);
    };
    const cleanups = [subscribeRealtime('chat:message-created', schedule), subscribeRealtime('chat:read', schedule), subscribeRealtime('chat:conversation-updated', schedule), subscribeRealtime('chat:conversation-closed', schedule)];
    const app = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const poll = setInterval(() => void refresh(), 30_000);
    return () => { active.current = false; version.current++; starting.current = false; clearTimeout(timer); clearInterval(poll); app.remove(); cleanups.forEach(cleanup => cleanup()); };
  }, [start, refresh]));
  const loadOlder = async () => {
    const target = id.current;
    if (target === null || olderSeq === null || paging.current) return;
    paging.current = true; setLoadingOlder(true);
    try {
      const history = await api.getChatMessages(target, olderSeq);
      if (active.current && id.current === target) {
        rows.current = mergeChatMessages(rows.current, history.messages); setMessages(rows.current);
        setOlderSeq(history.pagination.nextBeforeSeq); setError(null);
      }
    } catch (cause) { if (active.current) setError(getApiErrorMessage(cause, 'Không thể tải tin nhắn cũ.')); }
    finally { paging.current = false; if (active.current) setLoadingOlder(false); }
  };
  const send = async () => {
    const target = id.current, original = draft, content = original.trim();
    if (target === null || conversation?.status !== 'OPEN' || !content || chatContentLength(content) > 4000 || sendingRef.current) return;
    if (!pending.current || pending.current.id !== target || pending.current.content !== content) pending.current = { id: target, content, key: createChatMessageId() };
    const request = pending.current;
    sendingRef.current = true; setSending(true); setError(null);
    try {
      const message = await api.sendChatMessage(target, request.key, request.content);
      pending.current = null;
      if (active.current && id.current === target) {
        rows.current = mergeChatMessages(rows.current, [message]); setMessages(rows.current);
        setDraft(value => value === original ? '' : value); await refresh();
      }
    } catch (cause) { if (active.current) setError(getApiErrorMessage(cause, 'Gửi chưa thành công. Hãy thử lại, nội dung vẫn được giữ.')); }
    finally { sendingRef.current = false; if (active.current) setSending(false); }
  };
  const markRead = useCallback(async () => {
    if (!active.current || AppState.currentState !== 'active' || !conversation || reading.current ||
      conversation.customerReadSeq >= conversation.lastMessageSeq) return;
    const target = conversation.id;
    reading.current = true;
    try {
      const result = await api.readChat(target, conversation.lastMessageSeq);
      if (active.current && id.current === target) setConversation(current => current && current.id === target ? {
        ...current, customerReadSeq: Math.max(current.customerReadSeq, result.customerReadSeq),
        unreadCount: current.lastMessageSeq <= result.lastMessageSeq ? result.unreadCount : current.unreadCount,
      } : current);
    } catch { /* Retry on the next refresh; never hide delivered messages. */ }
    finally { reading.current = false; }
  }, [conversation]);
  return { conversation, messages, olderSeq, loading, loadingOlder, sending, draft, setDraft, error,
    refresh, retry: () => id.current === null ? start() : refresh(), startNew: start, send, loadOlder, markRead };
}
