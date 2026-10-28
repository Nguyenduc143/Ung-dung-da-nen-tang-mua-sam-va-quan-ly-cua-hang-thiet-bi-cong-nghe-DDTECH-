import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useCustomerChat } from '@/hooks/useCustomerChat';
import { useAuthStore } from '@/stores';
import { colors } from '@/theme';
import type { ChatMessage } from '@/types/chat';
import { chatContentLength } from '@/utils/chat';

export function SupportChatScreen() {
  const chat = useCustomerChat();
  const userId = useAuthStore(state => state.user?.id);
  const insets = useSafeAreaInsets(), header = useHeaderHeight();
  const list = useRef<FlatList<ChatMessage>>(null);
  const [atLatest, setAtLatest] = useState(true), [foreground, setForeground] = useState(AppState.currentState === 'active');
  const length = chatContentLength(chat.draft);
  const canSend = chat.conversation?.status === 'OPEN' && !chat.loading && !chat.sending && length > 0 && length <= 4000;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => { if (atLatest && foreground && !chat.loading) void chat.markRead(); }, [atLatest, foreground, chat.loading, chat.markRead]);
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={header}>
    <View style={styles.status}><Ionicons name="headset-outline" color={colors.primary} size={24} /><View style={styles.statusText}><Text style={styles.title}>DDTECH hỗ trợ bạn</Text><Text style={styles.secondary}>{chat.conversation?.status === 'CLOSED' ? 'Hội thoại đã kết thúc' : chat.conversation?.assignedAdminId ? 'Nhân viên chăm sóc khách hàng đang hỗ trợ bạn' : 'Gửi tin nhắn, cửa hàng sẽ phản hồi sớm nhất có thể.'}</Text></View></View>
    {chat.error && <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{chat.error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Thử lại tải chat" onPress={() => void chat.retry()}><Text style={styles.link}>Tải lại</Text></Pressable></View>}
    {chat.loading ? <View style={styles.empty}><ActivityIndicator color={colors.primary} /><Text style={styles.secondary}>Đang mở cuộc trò chuyện...</Text></View> : <FlatList
      ref={list} inverted data={chat.messages} keyExtractor={item => String(item.id)} contentContainerStyle={styles.messages}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      onScroll={event => setAtLatest(event.nativeEvent.contentOffset.y < 48)} scrollEventThrottle={100}
      ListEmptyComponent={<View style={styles.empty}><Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} /><Text style={styles.secondary}>{chat.error ? 'Chưa thể tải tin nhắn.' : 'Bạn cần tư vấn sản phẩm hay hỗ trợ đơn hàng?'} </Text></View>}
      ListFooterComponent={chat.olderSeq !== null ? <Pressable style={styles.older} accessibilityRole="button" disabled={chat.loadingOlder} onPress={() => void chat.loadOlder()}>{chat.loadingOlder ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.link}>Tải tin nhắn cũ hơn</Text>}</Pressable> : null}
      renderItem={({ item }) => {
        const mine = item.senderId === userId;
        return <View style={[styles.message, mine && styles.mine]}><View style={[styles.bubble, mine && styles.myBubble]}>
          {!mine && <Text style={styles.sender}>Nhân viên chăm sóc khách hàng</Text>}
          <Text selectable style={[styles.content, mine && styles.myText]}>{item.content}</Text>
          <Text style={[styles.time, mine && styles.myTime]}>{new Date(item.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}{mine ? ` · ${item.messageSeq <= (chat.conversation?.adminReadSeq ?? 0) ? 'Đã đọc' : 'Đã gửi'}` : ''}</Text>
        </View></View>;
      }}
    />}
    {!atLatest && <Pressable style={styles.older} accessibilityRole="button" onPress={() => { list.current?.scrollToOffset({ offset: 0, animated: true }); setAtLatest(true); }}><Text style={styles.link}>Về tin mới nhất ↓</Text></Pressable>}
    {chat.conversation?.status === 'CLOSED' ? <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}><Text style={styles.secondary}>Cửa hàng đã đóng hội thoại này. Lịch sử vẫn được lưu.</Text><Pressable style={styles.newChat} accessibilityRole="button" onPress={() => void chat.startNew()}><Text style={styles.myText}>Bắt đầu hội thoại mới</Text></Pressable></View> : <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.inputRow}><TextInput accessibilityLabel="Tin nhắn cho cửa hàng" style={styles.input} placeholder="Nhập tin nhắn..." placeholderTextColor={colors.textMuted} multiline value={chat.draft} onChangeText={chat.setDraft} editable={Boolean(chat.conversation) && !chat.loading && !chat.sending} />
        <Pressable accessibilityRole="button" accessibilityLabel="Gửi tin nhắn" disabled={!canSend} style={[styles.send, !canSend && styles.disabled]} onPress={() => { list.current?.scrollToOffset({ offset: 0, animated: true }); setAtLatest(true); void chat.send(); }}>{chat.sending ? <ActivityIndicator color={colors.textInverse} /> : <Ionicons name="send" color={colors.textInverse} size={20} />}</Pressable>
      </View><Text style={[styles.counter, length > 4000 && styles.errorText]}>{length}/4000 ký tự</Text>
    </View>}
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, status: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }, statusText: { flex: 1 },
  title: { fontWeight: '700', color: colors.textPrimary, marginBottom: 3 }, secondary: { fontSize: 12, color: colors.textSecondary },
  messages: { padding: 16, flexGrow: 1 }, empty: { flex: 1, minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  message: { flexDirection: 'row', marginBottom: 12 }, mine: { justifyContent: 'flex-end' }, bubble: { maxWidth: '85%', backgroundColor: colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border }, myBubble: { backgroundColor: colors.primary, borderColor: colors.primary },
  sender: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 4 }, content: { fontSize: 15, lineHeight: 22, color: colors.textPrimary }, myText: { color: colors.textInverse, fontWeight: '600' }, time: { fontSize: 10, color: colors.textMuted, marginTop: 6 }, myTime: { color: colors.textInverse },
  composer: { backgroundColor: colors.surface, padding: 12, borderTopWidth: 1, borderColor: colors.border, gap: 8 }, inputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' }, input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 16, backgroundColor: colors.surfaceMuted, paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontSize: 15, textAlignVertical: 'top' },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, disabled: { backgroundColor: colors.disabled }, counter: { fontSize: 10, color: colors.textMuted, textAlign: 'right' },
  older: { alignItems: 'center', padding: 12 }, link: { color: colors.primary, fontWeight: '600', fontSize: 12 }, error: { backgroundColor: colors.dangerSoft, padding: 12, gap: 6 }, errorText: { color: colors.danger, fontSize: 12 }, newChat: { borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', padding: 14 },
});
