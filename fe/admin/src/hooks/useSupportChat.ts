import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api/chatApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { getAdminSocket } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import type { ChatConversation, ChatListData, ChatMessage } from '../types/chat';
import { createChatMessageId, mergeChatMessages } from '../utils/chat';

export function useSupportChat() {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.accessToken);
  const [status, setStatus] = useState<'OPEN' | 'CLOSED' | undefined>('OPEN');
  const [page, setPage] = useState(1);
  const [inbox, setInbox] = useState<ChatListData>({ conversations: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [olderSeq, setOlderSeq] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listError, setListError] = useState<string>();
  const [threadError, setThreadError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [connected, setConnected] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const selected = useRef<number | null>(null);
  const messageRows = useRef<ChatMessage[]>([]);
  const alive = useRef(true), listVersion = useRef(0), threadVersion = useRef(0);
  const pendingSend = useRef(new Map<number, { content: string; key: string }>());
  const acting = useRef(false), reading = useRef(false), paging = useRef(false);
  const historyInitialized = useRef(false), selectionEpoch = useRef(0);
  const select = useCallback((id: number | null) => {
    selected.current = id; threadVersion.current++;
    messageRows.current = [];
    selectionEpoch.current++; historyInitialized.current = false;
    setSelectedId(id); setConversation(null); setMessages([]); setOlderSeq(null);
    setThreadError(undefined); setActionError(undefined);
  }, []);
  useEffect(() => { alive.current = true; return () => { alive.current = false; listVersion.current++; threadVersion.current++; }; }, []);

  const refreshList = useCallback(async () => {
    const version = ++listVersion.current;
    setLoadingList(true);
    try {
      const data = await api.listConversations(page, status);
      if (!alive.current || version !== listVersion.current) return;
      if (page > 1 && data.conversations.length === 0) { setPage(page - 1); return; }
      setInbox(data); setListError(undefined);
    } catch (error) {
      if (alive.current && version === listVersion.current) setListError(getApiErrorMessage(error, 'Không thể tải hội thoại.'));
    } finally { if (alive.current && version === listVersion.current) setLoadingList(false); }
  }, [page, status]);
  const refreshThread = useCallback(async (initial = false) => {
    const id = selected.current;
    if (id === null) return;
    const version = ++threadVersion.current;
    if (initial) setLoadingThread(true);
    try {
      const [detail, history] = await Promise.all([api.getConversation(id), api.getMessages(id)]);
      if (!alive.current || selected.current !== id || version !== threadVersion.current) return;
      setConversation(detail);
      const merged = mergeChatMessages(initial ? [] : messageRows.current, history.messages);
      // More than one page may arrive while offline. Reset to the latest contiguous
      // page so its cursor can load the missing interval instead of hiding that gap.
      const gap = merged.some((item, index) => index > 0 && item.messageSeq > merged[index - 1].messageSeq + 1)
        && detail.lastMessageSeq >= (messageRows.current.at(-1)?.messageSeq ?? 0);
      messageRows.current = gap ? mergeChatMessages([], history.messages) : merged;
      setMessages(messageRows.current);
      if (initial || gap || !historyInitialized.current) setOlderSeq(history.pagination.nextBeforeSeq);
      historyInitialized.current = true;
      setThreadError(undefined);
    } catch (error) {
      if (alive.current && selected.current === id && version === threadVersion.current) setThreadError(getApiErrorMessage(error, 'Không thể tải lịch sử chat.'));
    } finally { if (alive.current && selected.current === id && version === threadVersion.current) setLoadingThread(false); }
  }, []);
  const refresh = useCallback(async () => { await Promise.all([refreshList(), refreshThread()]); }, [refreshList, refreshThread]);
  useEffect(() => { void refreshList(); }, [refreshList]);
  useEffect(() => { if (selectedId !== null) void refreshThread(true); }, [selectedId, refreshThread]);
  useEffect(() => {
    if (!token) return;
    const socket = getAdminSocket(token);
    setConnected(socket.connected);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => { clearTimeout(timer); timer = setTimeout(() => { void refresh(); }, 150); };
    const onConnect = () => { setConnected(true); sync(); };
    const onDisconnect = () => setConnected(false);
    const events = ['chat:message-created', 'chat:conversation-updated', 'chat:read', 'chat:conversation-closed'];
    for (const event of events) socket.on(event, sync);
    socket.on('connect', onConnect); socket.on('disconnect', onDisconnect); socket.on('connect_error', onDisconnect);
    const onFocus = () => { if (document.visibilityState !== 'hidden') sync(); };
    window.addEventListener('focus', onFocus); document.addEventListener('visibilitychange', onFocus);
    const poll = setInterval(onFocus, 30_000);
    return () => {
      clearTimeout(timer); clearInterval(poll);
      for (const event of events) socket.off(event, sync);
      socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('connect_error', onDisconnect);
      window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus);
      // Shared socket belongs to AdminLayout, not this page.
    };
  }, [token, refresh]);

  const loadOlder = async () => {
    const id = selected.current;
    if (id === null || olderSeq === null || paging.current) return;
    paging.current = true; setLoadingOlder(true); setActionError(undefined);
    const epoch = selectionEpoch.current;
    try {
      const history = await api.getMessages(id, olderSeq);
      if (alive.current && selected.current === id && epoch === selectionEpoch.current) {
        messageRows.current = mergeChatMessages(messageRows.current, history.messages);
        setMessages(messageRows.current); setOlderSeq(history.pagination.nextBeforeSeq);
      }
    } catch (error) { if (alive.current && selected.current === id) setActionError(getApiErrorMessage(error, 'Không thể tải tin cũ.')); }
    finally { paging.current = false; if (alive.current) setLoadingOlder(false); }
  };
  const action = async (operation: (id: number) => Promise<unknown>) => {
    const id = selected.current;
    if (id === null || acting.current) return;
    acting.current = true; setBusy(true); setActionError(undefined);
    try { await operation(id); await refresh(); }
    catch (error) { if (alive.current && selected.current === id) { setActionError(getApiErrorMessage(error, 'Không thể thực hiện thao tác.')); await refresh(); } }
    finally { acting.current = false; if (alive.current) setBusy(false); }
  };
  const send = async () => {
    const id = selected.current;
    if (id === null) return;
    const original = drafts[id] ?? '', content = original.trim();
    if (!content) return;
    let request = pendingSend.current.get(id);
    if (!request || request.content !== content) { request = { content, key: createChatMessageId() }; pendingSend.current.set(id, request); }
    const current = request;
    await action(async target => {
      const message = await api.sendMessage(target, current.key, current.content);
      pendingSend.current.delete(target);
      if (alive.current) {
        setDrafts(values => values[target] === original ? { ...values, [target]: '' } : values);
        if (selected.current === target) {
          messageRows.current = mergeChatMessages(messageRows.current, [message]);
          setMessages(messageRows.current);
        }
      }
    });
  };
  const markVisibleRead = useCallback(async () => {
    if (!conversation || selected.current !== conversation.id || conversation.assignedAdminId !== user?.id ||
      conversation.adminReadSeq >= conversation.lastMessageSeq || document.visibilityState === 'hidden' || reading.current) return;
    reading.current = true;
    const id = conversation.id;
    try { await api.markRead(id, conversation.lastMessageSeq); if (alive.current && selected.current === id) await refresh(); }
    catch (error) { if (alive.current && selected.current === id) setActionError(getApiErrorMessage(error, 'Không thể đánh dấu đã đọc.')); }
    finally { reading.current = false; }
  }, [conversation, user?.id, refresh]);
  const changeStatus = (value: 'OPEN' | 'CLOSED' | undefined) => { setStatus(value); setPage(1); };
  return { user, status, changeStatus, page, setPage, inbox, selectedId, select, conversation, messages,
    olderSeq, loadOlder, loadingList, loadingThread, loadingOlder, busy, listError, threadError, actionError,
    connected, refresh, claim: () => action(api.claimConversation), close: () => action(api.closeConversation), send,
    draft: selectedId === null ? '' : drafts[selectedId] ?? '',
    setDraft: (value: string) => { if (selectedId !== null) setDrafts(current => ({ ...current, [selectedId]: value })); },
    markVisibleRead,
  };
}
