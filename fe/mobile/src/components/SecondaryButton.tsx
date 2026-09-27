import { ButtonBase, type AppButtonProps } from './ButtonBase';

export type SecondaryButtonProps = AppButtonProps;

export function SecondaryButton(props: SecondaryButtonProps) {
  return <ButtonBase {...props} variant="secondary" />;
}
