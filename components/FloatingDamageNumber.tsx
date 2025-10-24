"use client"

import { useEffect, useState } from 'react';

interface FloatingDamageNumberProps {
  damage: number;
  isCritical?: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}

export default function FloatingDamageNumber({ 
  damage, 
  isCritical = false, 
  position = { x: 0, y: 0 },
  onComplete 
}: FloatingDamageNumberProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div 
      className={`damage-number ${isCritical ? 'text-orange-500' : 'text-red-600'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      -{damage}
      {isCritical && <span className="ml-1">!</span>}
    </div>
  );
}
