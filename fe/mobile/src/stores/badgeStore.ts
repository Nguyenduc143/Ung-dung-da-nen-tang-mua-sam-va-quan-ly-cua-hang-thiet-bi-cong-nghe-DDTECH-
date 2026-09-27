import { create } from 'zustand';

export interface BadgeState {
  cartItemCount: number;
  unreadNotificationCount: number;
  setCartItemCount: (count: number) => void;
  setUnreadNotificationCount: (count: number) => void;
  resetBadges: () => void;
}

const normalizeCount = (count: number): number => (
  Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0
);

export const useBadgeStore = create<BadgeState>((set) => ({
  cartItemCount: 0,
  unreadNotificationCount: 0,
  setCartItemCount: (count) => set({ cartItemCount: normalizeCount(count) }),
  setUnreadNotificationCount: (count) => set({ unreadNotificationCount: normalizeCount(count) }),
  resetBadges: () => set({ cartItemCount: 0, unreadNotificationCount: 0 }),
}));
