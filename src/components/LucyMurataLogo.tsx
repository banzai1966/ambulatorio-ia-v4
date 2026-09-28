import React from 'react';
import { DEFAULT_CLINIC_LOGO_URL } from '../constants/clinicProfiles';

interface Props {
  className?: string;
  variant?: 'full' | 'compact' | 'monogram';
  textColor?: string;
}

export default function LucyMurataLogo({ 
  className = "h-14 w-auto", 
  variant = "full" 
}: Props) {
  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <img 
        src={DEFAULT_CLINIC_LOGO_URL} 
        alt="Logo Oficial" 
        referrerPolicy="no-referrer"
        className={`max-h-full max-w-full object-contain ${variant === 'monogram' ? 'p-1' : ''}`}
      />
    </div>
  );
}
