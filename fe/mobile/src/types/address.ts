export type AddressType = 'HOME' | 'OFFICE' | 'OTHER';

export interface Address {
  id: number;
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string | null;
  addressLine: string;
  addressType: AddressType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward?: string | null;
  addressLine: string;
  addressType: AddressType;
  isDefault: boolean;
}

export type UpdateAddressInput = Omit<CreateAddressInput, 'isDefault'>;
