process.env.EXPO_PUBLIC_API_URL ??= 'http://127.0.0.1:5000/api';
process.env.EXPO_PUBLIC_SOCKET_URL ??= 'http://127.0.0.1:5000';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));
