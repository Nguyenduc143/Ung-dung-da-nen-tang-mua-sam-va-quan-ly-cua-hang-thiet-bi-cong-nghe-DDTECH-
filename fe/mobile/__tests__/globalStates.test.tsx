import { fireEvent, render } from '@testing-library/react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PriceDisplay } from '@/components/PriceDisplay';

describe('global states', () => {
  test('hiển thị preset giỏ hàng trống và action', () => {
    const onAction = jest.fn();
    const screen = render(<EmptyState actionLabel="Khám phá sản phẩm" onAction={onAction} preset="cart" />);

    screen.getByText('Giỏ hàng đang trống');
    fireEvent.press(screen.getByText('Khám phá sản phẩm'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['network', 'Không có kết nối mạng'],
    ['server', 'Máy chủ đang gặp sự cố'],
    ['auth', 'Phiên đăng nhập đã hết hạn'],
  ] as const)('hiển thị lỗi %s', (variant, title) => {
    expect(render(<ErrorState variant={variant} />).getByText(title)).toBeTruthy();
  });

  test('cho phép thử lại sau lỗi', () => {
    const onRetry = jest.fn();
    const screen = render(<ErrorState onRetry={onRetry} variant="network" />);

    fireEvent.press(screen.getByText('Thử lại'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('không hiển thị số 0 như một mức giá hợp lệ', () => {
    expect(render(<PriceDisplay price={0} />).getByText('Giá đang cập nhật')).toBeTruthy();
  });
});
