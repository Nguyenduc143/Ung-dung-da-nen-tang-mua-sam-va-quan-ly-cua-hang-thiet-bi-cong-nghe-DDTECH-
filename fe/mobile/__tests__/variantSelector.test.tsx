import { fireEvent, render } from '@testing-library/react-native';
import type { ProductVariant } from '@/types';
import { VariantSelector } from '@/screens/products/components/VariantSelector';
import { getVariantOption } from '@/utils/variantOptions';

const option: ProductVariant = {
  id: 1, productId: 331, sku: 'VARIANT-256', variantName: '12GB / 256GB',
  attributes: { storage: '256GB' }, price: 13990000, salePrice: null, stock: 3,
  soldCount: 0, imageUrl: null, sortOrder: 0, status: 'ACTIVE',
  createdAt: '2026-10-07', updatedAt: '2026-10-07',
};

test('selects the exact configuration and reflects the selected state', () => {
  const onSelect = jest.fn();
  const other = { ...option, id: 2, variantName: '12GB / 512GB', price: 15990000 };
  const screen = render(<VariantSelector variants={[option, other]} selectedId={1} onSelect={onSelect} />);
  expect(screen.getByRole('button', { selected: true })).toBeTruthy();
  fireEvent.press(screen.getByText('12GB / 512GB'));
  expect(onSelect).toHaveBeenCalledWith(other);
});

test('does not allow an unavailable configuration to be selected', () => {
  const onSelect = jest.fn();
  const screen = render(<VariantSelector variants={[{ ...option, stock: 0 }]} selectedId={null} onSelect={onSelect} />);
  expect(screen.getByRole('button', { disabled: true })).toBeTruthy();
  fireEvent.press(screen.getByText('12GB / 256GB'));
  expect(onSelect).not.toHaveBeenCalled();
});

test('does not invent configuration choices for a product without variants', () => {
  const screen = render(<VariantSelector variants={[]} selectedId={null} onSelect={jest.fn()} />);
  expect(screen.queryByText('Chọn phiên bản')).toBeNull();
  expect(screen.queryByText('Chọn cấu hình')).toBeNull();
});

const colored = (id: number, storage: string, color: string, stock = 3): ProductVariant => ({
  ...option, id, variantName: `${storage} / ${color}`, stock,
  attributes: { 'Màu sắc': color, 'Bộ nhớ trong': storage },
});

test('renders separate color and configuration groups without duplicate options', () => {
  const variants = [colored(1, '256GB', 'Đen'), colored(2, '256GB', 'Trắng'),
    colored(3, '512GB', 'Đen'), colored(4, '512GB', 'Trắng')];
  const onSelect = jest.fn();
  const screen = render(<VariantSelector variants={variants} selectedId={1} onSelect={onSelect} />);
  expect(screen.getByText('Chọn màu sắc')).toBeTruthy();
  expect(screen.getByText('Chọn cấu hình')).toBeTruthy();
  expect(screen.getAllByText('Đen')).toHaveLength(1);
  expect(screen.getAllByText('512GB')).toHaveLength(1);
  fireEvent.press(screen.getByLabelText('Chọn màu sắc: Trắng'));
  expect(onSelect).toHaveBeenLastCalledWith(variants[1]);
  screen.rerender(<VariantSelector variants={variants} selectedId={2} onSelect={onSelect} />);
  fireEvent.press(screen.getByLabelText('Chọn cấu hình: 512GB'));
  expect(onSelect).toHaveBeenLastCalledWith(variants[3]);
});

test('disables missing color/configuration combinations but permits changing color', () => {
  const variants = [colored(1, '256GB', 'Đen'), colored(2, '512GB', 'Trắng')];
  const onSelect = jest.fn();
  const screen = render(<VariantSelector variants={variants} selectedId={1} onSelect={onSelect} />);
  fireEvent.press(screen.getByLabelText('Chọn cấu hình: 512GB'));
  expect(onSelect).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Chọn màu sắc: Trắng'));
  expect(onSelect).toHaveBeenCalledWith(variants[1]);
});

test('does not select an out-of-stock color or configuration', () => {
  const variants = [colored(1, '256GB', 'Đen'), colored(2, '256GB', 'Trắng', 0)];
  const onSelect = jest.fn();
  const screen = render(<VariantSelector variants={variants} selectedId={1} onSelect={onSelect} />);
  fireEvent.press(screen.getByLabelText('Chọn màu sắc: Trắng'));
  expect(onSelect).not.toHaveBeenCalled();
});

test('color-only accessories do not show a made-up configuration group', () => {
  const black = { ...option, variantName: 'Đen', attributes: { color: 'black' } };
  const screen = render(<VariantSelector variants={[black]} selectedId={1} onSelect={jest.fn()} />);
  expect(screen.getByText('Chọn màu sắc')).toBeTruthy();
  expect(screen.queryByText('Chọn cấu hình')).toBeNull();
});

test('removes the color suffix without changing the real configuration', () => {
  expect(getVariantOption({ ...option, variantName: '64GB / 6000 MHz / Đen', attributes: { color: 'black' } }))
    .toMatchObject({ color: 'Đen', configuration: '64GB / 6000 MHz' });
  expect(getVariantOption({ ...option, variantName: '12GB 256GB / Xanh Sky Blue', attributes: { 'Màu sắc': 'Xanh Sky Blue' } }))
    .toMatchObject({ color: 'Xanh Sky Blue', configuration: '12GB 256GB' });
});
