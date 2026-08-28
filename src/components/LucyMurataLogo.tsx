import React from 'react';

interface Props {
  className?: string;
  variant?: 'full' | 'compact' | 'monogram';
  textColor?: string;
}

export default function LucyMurataLogo({ 
  className = "h-14 w-auto", 
  variant = "full",
  textColor = "#1e293b"
}: Props) {
  if (variant === 'monogram') {
    return (
      <svg 
        viewBox="0 0 100 100" 
        className={className} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#C59B27" />
            <stop offset="100%" stopColor="#996515" />
          </linearGradient>
        </defs>
        {/* Monograma Geométrico Dra. Lucy */}
        <circle cx="50" cy="50" r="46" stroke="url(#goldGrad)" strokeWidth="2.5" fill="#FAF8F5" />
        <path 
          d="M32 68V36L50 52L68 36V68" 
          stroke="url(#goldGrad)" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path 
          d="M26 44C26 34 36 26 50 26C64 26 74 34 74 44" 
          stroke="url(#goldGrad)" 
          strokeWidth="2" 
          strokeDasharray="2 3"
        />
        <circle cx="50" cy="26" r="3.5" fill="url(#goldGrad)" />
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblema Monograma Dourado */}
      <svg 
        viewBox="0 0 120 120" 
        className="h-full w-auto shrink-0" 
        style={{ minWidth: '42px', minHeight: '42px' }}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lucyGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5C158" />
            <stop offset="50%" stopColor="#C59B27" />
            <stop offset="100%" stopColor="#8C5E14" />
          </linearGradient>
          <linearGradient id="crestGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B8860B" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#F3E5AB" />
          </linearGradient>
        </defs>
        
        {/* Pétalas / Asas Externas */}
        <path 
          d="M20 52C20 32 36 18 60 18C84 18 100 32 100 52C100 78 60 102 60 102C60 102 20 78 20 52Z" 
          stroke="url(#lucyGold)" 
          strokeWidth="3" 
          fill="#FFFDF9"
        />
        
        {/* Flor de Lótus / Dente Biológico / Monograma */}
        <path 
          d="M40 76C40 50 48 38 60 38C72 38 80 50 80 76" 
          stroke="url(#crestGold)" 
          strokeWidth="3.5" 
          strokeLinecap="round"
        />
        <path 
          d="M32 58C32 46 44 42 60 42C76 42 88 46 88 58" 
          stroke="url(#lucyGold)" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        
        {/* Gotícula / Centelha Superior */}
        <circle cx="60" cy="28" r="4" fill="url(#lucyGold)" />
      </svg>

      {/* Tipografia da Marca */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-1.5">
          <span 
            className="font-serif italic font-black tracking-tight"
            style={{ 
              color: '#8C5E14',
              fontSize: '1.45rem',
              lineHeight: '1.1',
              fontFamily: '"Playfair Display", "Georgia", "Baskerville", serif',
              textShadow: '0 1px 1px rgba(0,0,0,0.05)'
            }}
          >
            Lucy Murata
          </span>
        </div>
        <span 
          className="text-[9.5px] font-bold uppercase tracking-wider mt-0.5"
          style={{ color: '#0f172a' }}
        >
          Odontologia Biológica & Integrativa
        </span>
      </div>
    </div>
  );
}
