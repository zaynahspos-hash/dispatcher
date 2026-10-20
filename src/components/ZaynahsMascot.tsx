import React, { useState, useEffect } from 'react'

export type MascotState = 'idle' | 'reading' | 'cleaning' | 'warning' | 'success' | 'review'

export interface ZaynahsMascotProps {
  state?: MascotState
  size?: number
  className?: string
  reviewCount?: number
  showCaption?: boolean
  captionText?: string
  interactive?: boolean
  onStateChange?: (newState: MascotState) => void
}

const CAPTIONS: Record<MascotState, { en: string; ur: string }> = {
  idle: {
    en: 'Zaynahs Ready',
    ur: 'Tayyar hai • Orders paste karein'
  },
  reading: {
    en: 'Scanning Text Rows...',
    ur: 'Zaynahs data scan kar raha hai...'
  },
  cleaning: {
    en: 'Neural AI Cleaning...',
    ur: 'AI parcel cleaning jari hai...'
  },
  warning: {
    en: 'Attention Needed',
    ur: 'Missing phone/address detect hui'
  },
  success: {
    en: 'All Clean & Verified!',
    ur: '100% clean parcel records! 🎉'
  },
  review: {
    en: 'Orders Need Review',
    ur: 'Orders check karna lazmi hai'
  }
}

export const ZaynahsMascot: React.FC<ZaynahsMascotProps> = ({
  state = 'idle',
  size = 120,
  className = '',
  reviewCount = 3,
  showCaption = false,
  captionText
}) => {
  const [blink, setBlink] = useState(false)

  // Natural blinking effect for idle/review states (every ~3.5s)
  useEffect(() => {
    if (state !== 'idle' && state !== 'review') return
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 140)
    }, 3600)
    return () => clearInterval(blinkInterval)
  }, [state])

  // Captions
  const activeCaption = captionText || `${CAPTIONS[state].en} • ${CAPTIONS[state].ur}`

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <div 
        className="relative flex items-center justify-center transition-transform duration-500 ease-out"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 160 160"
          width={size}
          height={size}
          className="overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Deep Indigo/Black parcel body gradient */}
            <linearGradient id="zBodyGrad" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Warning gradient */}
            <linearGradient id="zWarnGrad" x1="40" y1="20" x2="120" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>

            {/* Success gradient */}
            <linearGradient id="zSuccessGrad" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Tape strip gradient */}
            <linearGradient id="zTapeGrad" x1="55" y1="20" x2="105" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
            </linearGradient>

            {/* Teal orbit ring */}
            <linearGradient id="zTealRing" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>

            {/* Amber orbit ring */}
            <linearGradient id="zAmberRing" x1="160" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
            </linearGradient>

            {/* Glow filters */}
            <filter id="zTealGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="zSparkleGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ─────────────────────────────────────────────────────────────
              CLEANING ORBITAL RINGS (Active during 'cleaning')
             ───────────────────────────────────────────────────────────── */}
          {state === 'cleaning' && (
            <g className="zaynahs-orbits">
              {/* Teal Ring */}
              <ellipse
                cx="80"
                cy="80"
                rx="70"
                ry="26"
                stroke="url(#zTealRing)"
                strokeWidth="2.5"
                strokeDasharray="18 10 35 12"
                transform="rotate(-28 80 80)"
                className="animate-spin-slow origin-center"
                style={{ animationDuration: '2.4s' }}
              />
              {/* Amber Ring */}
              <ellipse
                cx="80"
                cy="80"
                rx="68"
                ry="24"
                stroke="url(#zAmberRing)"
                strokeWidth="2"
                strokeDasharray="25 15 10 12"
                transform="rotate(35 80 80)"
                className="animate-spin-reverse-slow origin-center"
                style={{ animationDuration: '3s' }}
              />
              {/* Floating Sparkle Micro-dot */}
              <circle cx="145" cy="72" r="3" fill="#14b8a6" filter="url(#zTealGlow)" className="animate-ping" style={{ animationDuration: '1.6s' }} />
            </g>
          )}

          {/* ─────────────────────────────────────────────────────────────
              MAIN MASCOT BODY (Morphing Rounded Parcel Box Blob)
             ───────────────────────────────────────────────────────────── */}
          <g className={`zaynahs-body-group zaynahs-state-${state} origin-center transition-all duration-500`}>
            
            {/* Soft Shadow underneath */}
            <ellipse
              cx="80"
              cy="138"
              rx={state === 'warning' ? '30' : '44'}
              ry="8"
              fill="rgba(0, 0, 0, 0.16)"
              className="dark:fill-black/40 transition-all duration-400"
            />

            {state === 'warning' ? (
              // WARNING STATE: Exclamation bar + dot
              <g className="zaynahs-warning-bounce">
                {/* Exclamation Bar */}
                <rect
                  x="67"
                  y="26"
                  width="26"
                  height="72"
                  rx="13"
                  fill="url(#zWarnGrad)"
                  className="shadow-lg"
                />
                {/* Exclamation Dot */}
                <circle
                  cx="80"
                  cy="116"
                  r="12"
                  fill="url(#zWarnGrad)"
                />
              </g>
            ) : (
              // REGULAR / CLEANING / READING / IDLE / SUCCESS BODY
              <g className="zaynahs-morph-wrapper">
                {/* Rounded Parcel Box Body: Softly squared squircle */}
                <path
                  d={
                    state === 'cleaning'
                      ? "M42 34 C30 45, 24 75, 26 98 C28 122, 50 134, 80 134 C110 134, 132 122, 134 98 C136 75, 130 45, 118 34 C104 22, 56 22, 42 34 Z"
                      : state === 'success'
                      ? "M38 42 C26 56, 26 90, 30 108 C36 128, 54 135, 80 135 C106 135, 124 128, 130 108 C134 90, 134 56, 122 42 C108 26, 52 26, 38 42 Z"
                      : "M36 40 C28 48, 26 84, 28 105 C30 126, 48 134, 80 134 C112 134, 130 126, 132 105 C134 84, 132 48, 124 40 C112 28, 48 28, 36 40 Z"
                  }
                  fill={state === 'success' ? 'url(#zSuccessGrad)' : 'url(#zBodyGrad)'}
                  stroke={state === 'success' ? '#34d399' : '#334155'}
                  strokeWidth="2"
                  className="transition-all duration-500 ease-out"
                />

                {/* Parcel Tape Strip Detail on top (Authentic Logistics Identity) */}
                <rect
                  x="64"
                  y="26"
                  width="32"
                  height="12"
                  rx="3"
                  fill="url(#zTapeGrad)"
                  stroke="#ca8a04"
                  strokeWidth="1"
                  strokeOpacity="0.5"
                  className="transition-opacity duration-300"
                />

                {/* Subtle parcel center crease line */}
                <line
                  x1="80"
                  y1="38"
                  x2="80"
                  y2="52"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  strokeOpacity="0.4"
                />
              </g>
            )}

            {/* ─────────────────────────────────────────────────────────────
                EYES (Pill-shaped, Expressive & Reactive)
               ───────────────────────────────────────────────────────────── */}
            {state !== 'warning' && (
              <g className={`zaynahs-eyes zaynahs-eyes-${state} transition-transform duration-300`}>
                {state === 'success' ? (
                  // Happy Curved Upward Eyes (Crescents)
                  <g stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" fill="none">
                    <path d="M52 82 Q61 72 70 82" />
                    <path d="M90 82 Q99 72 108 82" />
                  </g>
                ) : (
                  // Pill-shaped White Eyes
                  <g className={blink ? 'scale-y-[0.1] origin-[80px_80px] transition-transform duration-75' : 'transition-transform duration-200'}>
                    {/* Left Eye */}
                    <rect
                      x={state === 'reading' ? '54' : '54'}
                      y="70"
                      width="13"
                      height={blink ? '2' : '22'}
                      rx="6.5"
                      fill="#ffffff"
                      transform={state === 'reading' ? 'rotate(-6 60 80)' : 'rotate(-8 60 80)'}
                      className="transition-all duration-200"
                    />
                    {/* Right Eye */}
                    <rect
                      x={state === 'reading' ? '88' : '88'}
                      y="70"
                      width="13"
                      height={blink ? '2' : '22'}
                      rx="6.5"
                      fill="#ffffff"
                      transform={state === 'reading' ? 'rotate(-6 94 80)' : 'rotate(-8 94 80)'}
                      className="transition-all duration-200"
                    />
                  </g>
                )}
              </g>
            )}

            {/* ─────────────────────────────────────────────────────────────
                READING STATE: 3 Scanning Dots Beside Eyes
               ───────────────────────────────────────────────────────────── */}
            {state === 'reading' && (
              <g className="zaynahs-reading-dots">
                <circle cx="112" cy="74" r="3" fill="#14b8a6" className="animate-pulse" style={{ animationDelay: '0ms' }} />
                <circle cx="120" cy="74" r="3" fill="#14b8a6" className="animate-pulse" style={{ animationDelay: '200ms' }} />
                <circle cx="128" cy="74" r="3" fill="#14b8a6" className="animate-pulse" style={{ animationDelay: '400ms' }} />
              </g>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SUCCESS STATE: Golden Sparkle & Checkmark
               ───────────────────────────────────────────────────────────── */}
            {state === 'success' && (
              <g transform="translate(112, 32)" filter="url(#zSparkleGlow)">
                {/* 4-point sparkle star */}
                <path
                  d="M0 -8 Q2 -2 8 0 Q2 2 0 8 Q-2 2 -8 0 Q-2 -2 0 -8 Z"
                  fill="#fbbf24"
                  className="animate-spin-slow origin-center"
                  style={{ animationDuration: '4s' }}
                />
              </g>
            )}
          </g>

          {/* ─────────────────────────────────────────────────────────────
              REVIEW STATE: Top-Right Review Badge with Real Count
             ───────────────────────────────────────────────────────────── */}
          {state === 'review' && (
            <g transform="translate(116, 26)" className="animate-bounce" style={{ animationDuration: '1.8s' }}>
              {/* Badge Pulse Ring */}
              <circle cx="14" cy="14" r="14" fill="#f59e0b" fillOpacity="0.25" className="animate-ping" style={{ animationDuration: '2s' }} />
              {/* Badge Solid Squirle */}
              <rect
                x="0"
                y="0"
                width="28"
                height="28"
                rx="14"
                fill="#ea580c"
                stroke="#ffffff"
                strokeWidth="2.5"
                className="shadow-md"
              />
              {/* Count Text */}
              <text
                x="14"
                y="18.5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="13"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {reviewCount}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Optional Caption Text */}
      {showCaption && (
        <div className="mt-2 text-center max-w-[200px]">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
            {activeCaption}
          </p>
        </div>
      )}

      {/* 60fps Native Spring Animations Style Tag */}
      <style>{`
        @keyframes zaynahsBreathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.03) translateY(-3px); }
        }

        @keyframes zaynahsReadScan {
          0%, 100% { transform: translateX(-7px); }
          50% { transform: translateX(7px); }
        }

        @keyframes zaynahsCleanMorph {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(0.97, 1.04) rotate(-3deg); }
          50% { transform: scale(1.04, 0.96) rotate(3deg); }
          75% { transform: scale(0.98, 1.02) rotate(-1deg); }
        }

        @keyframes zaynahsHop {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-12px) scale(1.05, 0.95); }
          50% { transform: translateY(-16px) scale(0.95, 1.05); }
          75% { transform: translateY(2px) scale(1.04, 0.96); }
        }

        @keyframes zaynahsWarnWobble {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(1.1, 0.9) rotate(-8deg); }
          40% { transform: scale(0.95, 1.1) rotate(8deg); }
          60% { transform: scale(1.05, 0.95) rotate(-4deg); }
          80% { transform: scale(0.98, 1.02) rotate(2deg); }
        }

        .zaynahs-state-idle {
          animation: zaynahsBreathe 3.6s ease-in-out infinite;
        }

        .zaynahs-eyes-reading {
          animation: zaynahsReadScan 1.4s ease-in-out infinite;
        }

        .zaynahs-state-cleaning {
          animation: zaynahsCleanMorph 2.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }

        .zaynahs-warning-bounce {
          animation: zaynahsWarnWobble 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }

        .zaynahs-state-success {
          animation: zaynahsHop 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }

        .zaynahs-state-review {
          animation: zaynahsBreathe 3s ease-in-out infinite;
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinReverseSlow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-spin-slow {
          animation: spinSlow 3s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spinReverseSlow 3.8s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .zaynahs-state-idle,
          .zaynahs-eyes-reading,
          .zaynahs-state-cleaning,
          .zaynahs-warning-bounce,
          .zaynahs-state-success,
          .zaynahs-state-review,
          .animate-spin-slow,
          .animate-spin-reverse-slow {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default ZaynahsMascot
