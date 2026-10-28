import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AppState, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChatUnreadCount } from '@/api/chat.api';
import { useAuthStore } from '@/stores';
import { subscribeRealtime } from '@/socket';
import { colors } from '@/theme';
import { chatButtonBottom, showChatButton } from '@/utils/chat';
import { requireLogin, rootNavigationRef } from './authNavigation';

export function FloatingChatButton({ routeName }: { routeName: string }) {
  const insets = useSafeAreaInsets();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const token = useAuthStore(state => state.accessToken);
  const [keyboard, setKeyboard] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  useEffect(() => {
    let active = true, version = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setUnread(0);
    if (!authenticated || !token) return;
    const load = async () => {
      if (AppState.currentState !== 'active') return;
      const current = ++version;
      try { const count = await getChatUnreadCount(); if (active && current === version) setUnread(count); } catch { /* Keep the last count until the next refresh. */ }
    };
    const schedule = () => { clearTimeout(timer); timer = setTimeout(() => void load(), 150); };
    void load();
    const cleanups = [subscribeRealtime('chat:message-created', schedule), subscribeRealtime('chat:read', schedule), subscribeRealtime('chat:conversation-closed', schedule), subscribeRealtime('chat:conversation-updated', schedule)];
    const app = AppState.addEventListener('change', state => { if (state === 'active') void load(); });
    const poll = setInterval(() => void load(), 30_000);
    return () => { active = false; clearTimeout(timer); clearInterval(poll); app.remove(); cleanups.forEach(cleanup => cleanup()); };
  }, [authenticated, token]);
  if (keyboard || !showChatButton(routeName)) return null;
  const open = () => {
    if (!rootNavigationRef.isReady()) return;
    rootNavigationRef.navigate('Customer', { screen: 'SupportChat' });
    if (!authenticated) requireLogin();
  };
  return <View pointerEvents="box-none" style={[styles.position, { bottom: chatButtonBottom(routeName, insets.bottom), right: Math.max(insets.right, 16) }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={unread > 0 ? `Chat với cửa hàng, ${unread} tin chưa đọc` : 'Chat với cửa hàng'} accessibilityHint="Mở trò chuyện với nhân viên chăm sóc khách hàng" hitSlop={8} onPress={open} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name="chatbubbles-outline" color={colors.textInverse} size={27} />
      <Text style={styles.label}>Hỗ trợ</Text>
      {unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text></View>}
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  position: { position: 'absolute', zIndex: 20 },
  button: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, boxShadow: '0px 4px 12px rgba(17,24,39,0.22)' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  label: { fontSize: 10, fontWeight: '600', color: colors.textInverse, marginTop: 2 },
  badge: { position: 'absolute', right: -2, top: -2, backgroundColor: colors.info, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface, paddingHorizontal: 3 },
  badgeText: { color: colors.textInverse, fontSize: 10, fontWeight: '700' },
});
