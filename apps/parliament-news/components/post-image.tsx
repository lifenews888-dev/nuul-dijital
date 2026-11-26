import Image from "next/image";
import { imageDims, imageSizes, safeImageSrc, type ImageVariant } from "../lib/images";

type Props = {
  src: string | null | undefined;
  /**
   * ШААРДЛАГАТАЙ. Медиагийн caption байвал түүнийг, байхгүй бол мэдээний
   * гарчгийг дамжуулна — хоосон alt-тай мэдээний зураг нь дэлгэц уншигчид
   * мэдээлэлгүй.
   */
  alt: string;
  variant: ImageVariant;
  /** Зөвхөн нийтлэлийн гол зурагт. Жагсаалтын 12 зураг бүгд priority байвал
   *  мобайлын сүлжээг гацаана. */
  priority?: boolean;
  className?: string;
};

/**
 * `next/image`-ийн нимгэн бүрхүүл: WebP/AVIF, responsive srcset, lazy.
 *
 * Эх хаяг нь үйлчлэгдэх боломжгүй бол (зөвшөөрөөгүй host, хачин scheme)
 * `null` буцаана — дуудагч тэр үед хавтасны SVG-г зурна. Ингэснээр
 * эвдэрсэн зургийн дүрс хэзээ ч харагдахгүй.
 */
export function PostImage({ src, alt, variant, priority, className }: Props) {
  const safe = safeImageSrc(src);
  if (!safe) return null;

  const { width, height } = imageDims(variant);

  return (
    <Image
      src={safe}
      alt={alt}
      width={width}
      height={height}
      sizes={imageSizes(variant)}
      priority={priority}
      className={className}
    />
  );
}
