import React from 'react'
import { WhatsAppIcon } from '../Icons'
import { useWhatsAppCooldown } from '../../utils/whatsappAntiBanTimer'

export interface WhatsAppActionButtonProps {
  isSent: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  disabled?: boolean
  href?: string
  target?: string
  rel?: string
  variant?: 'squircle' | 'chip'
  label?: string
  title?: string
  className?: string
  altClickUnmark?: boolean
}

/**
 * Single Source of Truth (SSOT1) for WhatsApp Action Buttons across:
 * - History Desktop Table (HistoryTableRow)
 * - History Mobile Cards (HistoryMobileCard)
 * - Results Desktop Table (ResultsDesktopGrid)
 * - Results Mobile Cards (ResultsMobileCardList)
 *
 * Uses authentic WhatsApp brand colors (#25D366 / #128C7E).
 * Follows Rule 16 (Apple Modern Minimalist) & Rule DS7 (Uniform Action Squircles).
 */
export const WhatsAppActionButton: React.FC<WhatsAppActionButtonProps> = ({
  isSent,
  onClick,
  disabled = false,
  href,
  target = 'whatsapp_web',
  rel = 'noopener noreferrer',
  variant = 'squircle',
  label,
  title,
  className = ''
}) => {
  const isChip = variant === 'chip'
  const cooldown = useWhatsAppCooldown()

  const rawTitle = title || (
    disabled
      ? 'WhatsApp disabled for cancelled orders'
      : isSent
        ? 'WhatsApp Sent • Click to Re-send (Alt+Click to unmark)'
        : 'Send WhatsApp Notification (Pending)'
  )

  const resolvedTitle = cooldown.isCooling && !disabled
    ? `Anti-Ban Safe Delay: ${cooldown.formattedTime} remaining • ${rawTitle}`
    : rawTitle

  const resolvedLabel = label !== undefined
    ? label
    : (cooldown.isCooling && !disabled
        ? (cooldown.formattedTime || cooldown.formattedRemaining || 'Wait')
        : (isSent ? 'Sent' : 'WhatsApp'))

  // Authentic WhatsApp Brand Styling:
  // - Sent: Solid WhatsApp green (#25D366) with white icon and dark green teal status dot (#128C7E)
  // - Pending: Outline with soft WhatsApp green tint (#25D366/10) and green icon (#25D366)
  // - Disabled: Muted slate squircle
  let stateClasses = ''
  if (disabled) {
    stateClasses = 'border border-slate-200/60 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40 shadow-none pointer-events-none'
  } else if (isSent) {
    stateClasses = 'bg-[#25D366] hover:bg-[#20ba5a] text-white border border-[#25D366] shadow-sm shadow-[#25D366]/25 active:scale-95 cursor-pointer'
  } else {
    stateClasses = 'border border-[#25D366]/40 dark:border-[#25D366]/35 bg-[#25D366]/10 dark:bg-[#25D366]/5 text-[#25D366] dark:text-[#25D366] hover:bg-[#25D366]/20 hover:border-[#25D366]/60 shadow-2xs active:scale-95 cursor-pointer'
  }

  const baseClasses = isChip
    ? `h-8 px-2.5 rounded-xl font-bold flex items-center gap-1.5 text-xs transition relative shrink-0 ${stateClasses} ${className}`
    : `w-7.5 h-7.5 rounded-xl flex items-center justify-center transition relative shadow-2xs shrink-0 ${stateClasses} ${className}`

  const iconColor = isSent && !disabled ? 'text-white fill-current' : 'fill-current'

  const content = (
    <>
      <WhatsAppIcon size={14} className={iconColor} />
      {isChip && (
        <span className={cooldown.isCooling && !disabled ? 'font-mono tracking-tight text-amber-600 dark:text-amber-400 font-extrabold' : ''}>
          {resolvedLabel}
        </span>
      )}
      {isSent && !disabled && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#128C7E] border-2 border-white dark:border-slate-900 ring-1 ring-[#25D366]"
          aria-hidden="true"
        />
      )}
      {cooldown.isCooling && !disabled && (
        <>
          <span
            className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 opacity-75 animate-ping"
            aria-hidden="true"
          />
          <span
            className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 ring-1 ring-amber-400 shadow-2xs"
            aria-hidden="true"
          />
        </>
      )}
    </>
  )

  if (href && !disabled) {
    const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) onClick(e)
      if (e.defaultPrevented) return

      // If native desktop app protocol, let browser trigger the registered app
      if (href.startsWith('whatsapp://')) {
        return
      }

      // Re-use named 'whatsapp_web' tab/window so browser navigates the existing
      // WhatsApp Web session instead of spawning a new tab every click (which causes
      // "WhatsApp is open in another window. Click Use here to use WhatsApp in this window").
      e.preventDefault()
      const targetWindow = target || 'whatsapp_web'
      const win = window.open(href, targetWindow)
      if (win) {
        try { win.focus() } catch (_) {}
      }
    }

    return (
      <a
        href={href}
        target={target || 'whatsapp_web'}
        rel={rel}
        onClick={handleAnchorClick}
        className={baseClasses}
        title={resolvedTitle}
        aria-label={resolvedTitle}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      title={resolvedTitle}
      aria-label={resolvedTitle}
    >
      {content}
    </button>
  )
}
