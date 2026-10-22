import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '../Icons'

export interface ScrollableChipsBarProps {
  children: React.ReactNode
  /** Additional classes for outer relative wrapper */
  className?: string
  /** Additional classes for scrollable inner element */
  containerClassName?: string
  /** Custom scroll step in pixels (defaults to 65% of visible container width) */
  scrollAmount?: number
  /** Whether to render subtle gradient fade masks behind navigation arrows */
  fadeGradient?: boolean
  /** Custom gradient color stops (e.g., for grey tab containers) */
  fadeColorClass?: {
    left?: string
    right?: string
  } | string
  /** Optional container element ID */
  id?: string
  /** Optional accessible label for the scroll area */
  ariaLabel?: string
}

/**
 * ScrollableChipsBar (SSOT1 Shared Component)
 * Rule DS14: Dynamic overflow-aware horizontal scroll container with left/right navigation arrows.
 * Arrows strictly only appear if content overflows the container (`scrollWidth > clientWidth`).
 * When all chips fit on screen (desktop or wide viewports), 0 arrows are rendered.
 */
export const ScrollableChipsBar: React.FC<ScrollableChipsBarProps> = ({
  children,
  className = '',
  containerClassName = 'flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5 scroll-smooth touch-pan-x',
  scrollAmount,
  fadeGradient = true,
  fadeColorClass,
  id,
  ariaLabel = 'Scrollable filter options'
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Resolve left & right gradient stops
  const leftFadeClass = typeof fadeColorClass === 'object'
    ? fadeColorClass.left ?? 'from-white via-white/95 to-transparent dark:from-[#0c121e] dark:via-[#0c121e]/95'
    : fadeColorClass ?? 'from-white via-white/95 to-transparent dark:from-[#0c121e] dark:via-[#0c121e]/95'

  const rightFadeClass = typeof fadeColorClass === 'object'
    ? fadeColorClass.right ?? 'from-white via-white/95 to-transparent dark:from-[#0c121e] dark:via-[#0c121e]/95'
    : fadeColorClass ?? 'from-white via-white/95 to-transparent dark:from-[#0c121e] dark:via-[#0c121e]/95'

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const { scrollLeft, scrollWidth, clientWidth } = el
    const maxScroll = scrollWidth - clientWidth
    const tolerance = 4 // Sub-pixel rounding tolerance

    const hasOverflow = scrollWidth > clientWidth + tolerance
    const leftAllowed = hasOverflow && scrollLeft > tolerance
    const rightAllowed = hasOverflow && maxScroll - scrollLeft > tolerance

    setCanScrollLeft(leftAllowed)
    setCanScrollRight(rightAllowed)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    // Check immediately and in next frame for accurate paint metrics
    updateScrollState()
    const rafId = requestAnimationFrame(updateScrollState)

    // Passive scroll listener
    el.addEventListener('scroll', updateScrollState, { passive: true })

    // ResizeObserver on the container and children to respond to window/content resize
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollState()
      })
      resizeObserver.observe(el)
      Array.from(el.children).forEach(child => resizeObserver?.observe(child))
    }

    // MutationObserver to detect DOM children changes (e.g. chip additions/removals)
    let mutationObserver: MutationObserver | null = null
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        updateScrollState()
      })
      mutationObserver.observe(el, { childList: true, subtree: true, characterData: true })
    }

    window.addEventListener('resize', updateScrollState)

    return () => {
      cancelAnimationFrame(rafId)
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [updateScrollState, children])

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return

    const step = scrollAmount ?? Math.max(160, Math.floor(el.clientWidth * 0.65))
    el.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth'
    })
  }

  return (
    <div className={`relative flex items-center w-full min-w-0 max-w-full group ${className}`}>
      {/* Left Navigation Arrow (Desktop mouse only, hidden on mobile for native iOS swipe) */}
      {canScrollLeft && (
        <div
          className={`hidden sm:flex absolute left-0 top-0 bottom-0 z-10 items-center pr-4 pl-0.5 pointer-events-none transition-opacity duration-200 ${
            fadeGradient ? `bg-gradient-to-r ${leftFadeClass}` : ''
          }`}
        >
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            className="pointer-events-auto h-7 w-7 rounded-full flex items-center justify-center bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <ChevronLeftIcon size={14} className="stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Scrollable Content Container */}
      <div
        ref={scrollRef}
        id={id}
        aria-label={ariaLabel}
        className={`w-full min-w-0 flex-1 ${containerClassName}`}
      >
        {children}
      </div>

      {/* Right Navigation Arrow (Desktop mouse only, hidden on mobile for native iOS swipe) */}
      {canScrollRight && (
        <div
          className={`hidden sm:flex absolute right-0 top-0 bottom-0 z-10 items-center pl-4 pr-0.5 pointer-events-none transition-opacity duration-200 ${
            fadeGradient ? `bg-gradient-to-l ${rightFadeClass}` : ''
          }`}
        >
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
            className="pointer-events-auto h-7 w-7 rounded-full flex items-center justify-center bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <ChevronRightIcon size={14} className="stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  )
}
