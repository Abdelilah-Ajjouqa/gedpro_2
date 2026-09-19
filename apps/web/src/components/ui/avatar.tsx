'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

type AvatarProps = {
  src?: string;
  firstName: string;
  lastName: string;
  size: number;
  className?: string;
  priority?: boolean;
};

function Avatar({ src, firstName, lastName, size, className, priority = false }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const fullName = `${firstName} ${lastName}`;
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const showImage = Boolean(src) && !hasError;

  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-[11px] font-bold tracking-wide text-secondary-foreground ring-1 ring-border/70',
        className,
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={showImage ? `${fullName} profile photo` : `${fullName} initials`}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          priority={priority}
          className="size-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

export { Avatar };
