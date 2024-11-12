import Image from 'next/image';

interface SpotifyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function SpotifyImage({ src, alt, width, height, className }: SpotifyImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
    />
  );
} 