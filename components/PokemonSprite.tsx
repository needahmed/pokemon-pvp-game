"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PokemonSpriteProps {
  src: string;
  alt: string;
  size?: number;
  isActive?: boolean;
  isDamaged?: boolean;
  isCritical?: boolean;
  isFainted?: boolean;
  className?: string;
}

export default function PokemonSprite({
  src,
  alt,
  size = 96,
  isActive = true,
  isDamaged = false,
  isCritical = false,
  isFainted = false,
  className = '',
}: PokemonSpriteProps) {
  const [showDamage, setShowDamage] = useState(false);
  const [showCritical, setShowCritical] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isDamaged) {
      setShowDamage(true);
      const timer = setTimeout(() => setShowDamage(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isDamaged]);

  useEffect(() => {
    if (isCritical) {
      setShowCritical(true);
      const timer = setTimeout(() => setShowCritical(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isCritical]);

  const spriteClasses = [
    className,
    isActive && !isFainted ? 'pokemon-enter' : '',
    showDamage ? 'damage-shake' : '',
    showCritical ? 'critical-flash' : '',
    isFainted ? 'opacity-30 grayscale' : '',
    'transition-all duration-300',
  ].filter(Boolean).join(' ');

  return (
    <div className={`relative ${spriteClasses}`}>
      <Image
        src={imageError ? '/placeholder.svg' : src}
        alt={alt}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setImageError(true)}
        unoptimized
      />
      {isFainted && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl opacity-70">💀</span>
        </div>
      )}
    </div>
  );
}
