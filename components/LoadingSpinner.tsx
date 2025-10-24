"use client"

import Image from "next/image"

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ message = "Loading...", size = 'medium' }: LoadingSpinnerProps) {
  const sizeMap = {
    small: 32,
    medium: 64,
    large: 96,
  };

  const imageSize = sizeMap[size];

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Image 
          src="/images/pokeball.jpg" 
          alt="Loading" 
          width={imageSize} 
          height={imageSize}
          className="pokeball-spin rounded-full"
          unoptimized
        />
      </div>
      {message && (
        <p className="font-pokemon text-gray-700 animate-pulse">{message}</p>
      )}
    </div>
  );
}
