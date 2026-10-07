import { useEffect } from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { useAuthStore } from '@/stores';
import { requireLogin, rootNavigationRef } from '@/navigation/authNavigation';
import { withAuthRequired } from '@/navigation/withAuthRequired';

jest.mock('@/components', () => ({
  EmptyState: require('@/components/EmptyState').EmptyState,
}));
jest.mock('@/stores', () => ({
  useAuthStore: Object.assign(jest.fn(), { getState: jest.fn() }),
}));
jest.mock('@react-navigation/native', () => ({
  createNavigationContainerRef: () => ({
    isReady: jest.fn(() => true),
    navigate: jest.fn(),
  }),
}));

let authenticated = false;

beforeEach(() => {
  jest.clearAllMocks();
  authenticated = false;
  (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => (
    selector({ isAuthenticated: authenticated })
  ));
  (useAuthStore.getState as jest.Mock).mockImplementation(() => ({
    isAuthenticated: authenticated,
  }));
});

test('guest purchase opens login and stops the private operation', () => {
  expect(requireLogin()).toBe(false);
  expect(rootNavigationRef.navigate).toHaveBeenCalledWith('Auth');
});

test('authenticated purchase proceeds without opening login', () => {
  authenticated = true;
  expect(requireLogin()).toBe(true);
  expect(rootNavigationRef.navigate).not.toHaveBeenCalled();
});

test('private screen mounts only after login and unmounts on logout', () => {
  const onMount = jest.fn();
  const onUnmount = jest.fn();
  function PrivateScreen({ title }: { title: string }) {
    useEffect(() => { onMount(); return onUnmount; }, []);
    return <Text>{title}</Text>;
  }
  const ProtectedScreen = withAuthRequired(PrivateScreen);
  const screen = render(<ProtectedScreen title="Private data" />);
  expect(screen.queryByText('Private data')).toBeNull();
  expect(onMount).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Đăng nhập'));
  expect(rootNavigationRef.navigate).toHaveBeenCalledWith('Auth');

  authenticated = true;
  screen.rerender(<ProtectedScreen title="Private data" />);
  expect(screen.getByText('Private data')).toBeTruthy();
  expect(onMount).toHaveBeenCalledTimes(1);

  authenticated = false;
  screen.rerender(<ProtectedScreen title="Private data" />);
  expect(screen.queryByText('Private data')).toBeNull();
  expect(onUnmount).toHaveBeenCalledTimes(1);
});
