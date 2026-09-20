import { PictureOutlined } from '@ant-design/icons';
import { Empty, Image, type ImageProps } from 'antd';

interface ImagePreviewProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  emptyText?: string;
}

export function ImagePreview({ src, emptyText = 'Không có hình ảnh', ...props }: ImagePreviewProps) {
  if (!src) {
    return <Empty className="shared-image-empty" image={<PictureOutlined />} description={emptyText} />;
  }
  return <Image src={src} {...props} />;
}
