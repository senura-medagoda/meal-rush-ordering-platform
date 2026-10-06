import Image from 'next/image';

interface Props {
  src: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
}

export function ProductImage({ src, alt, priority = false, sizes }: Props) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          sizes={sizes ?? '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
      )}
    </div>
  );
}