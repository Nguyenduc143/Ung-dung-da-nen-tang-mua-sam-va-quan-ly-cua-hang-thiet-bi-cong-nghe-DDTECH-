import { ButtonBase, type AppButtonProps } from './ButtonBase';

export type PrimaryButtonProps = AppButtonProps;

export function PrimaryButton(props: PrimaryButtonProps) {
  return <ButtonBase {...props} variant="primary" />;
}
