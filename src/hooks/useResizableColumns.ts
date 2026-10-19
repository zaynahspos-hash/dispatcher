import { useState, useCallback, useRef, useEffect } from 'react'

export interface ColumnWidthConfig {
  [key: string]: number
}

interface UseResizableColumnsOptions {
  storageKey?: string
  defaultWidths: ColumnWidthConfig
  minWidths?: { [key: string]: number }
  onMeasureCol?: (colKey: string) => number
}

/**
 * Utility to calculate maximum character length in each column across table rows and header.
 */
export function measureMaxContentLengths<T>(
  headers: Record<string, string>,
  rows: T[],
  extractors: Partial<Record<string, (row: T) => string | number | undefined | null>>
): Record<string, number> {
  const result: Record<string, number> = {}

  for (const [colKey, headerTitle] of Object.entries(headers)) {
    let max = (headerTitle || '').length
    const extractor = extractors[colKey]

    if (extractor && rows.length > 0) {
      const sampleLimit = Math.min(rows.length, 300)
      for (let i = 0; i < sampleLimit; i++) {
        const val = extractor(rows[i])
        if (val !== undefined && val !== null) {
          const str = String(val).trim()
          if (str.length > max) {
            max = str.length
          }
        }
      }
    }
    result[colKey] = max
  }

  return result
}

/**
 * Event-based dispatchers so any toolbar button or action can trigger auto-fit or reset.
 */
export function triggerTableAutoFit(storageKey: string, lengths: Record<string, number>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`autofit_${storageKey}`, { detail: { lengths } }))
  }
}

export function triggerTableReset(storageKey: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`reset_${storageKey}`))
  }
}

export function useResizableColumns({
  storageKey,
  defaultWidths,
  minWidths = {},
  onMeasureCol
}: UseResizableColumnsOptions) {
  const [widths, setWidths] = useState<ColumnWidthConfig>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          const merged = { ...defaultWidths, ...parsed }
          // Ensure all columns exist and respect minimum width boundaries
          Object.keys(defaultWidths).forEach(k => {
            if (!merged[k] || merged[k] <= 0) {
              merged[k] = defaultWidths[k]
            }
          })
          Object.keys(minWidths).forEach(k => {
            if (minWidths[k] && merged[k] < minWidths[k]) {
              merged[k] = minWidths[k]
            }
          })
          return merged
        }
      } catch {
        // Fallback to defaults
      }
    }
    return defaultWidths
  })

  const [activeCol, setActiveCol] = useState<string | null>(null)
  const widthsRef = useRef(widths)
  widthsRef.current = widths

  const saveWidths = useCallback(
    (newWidths: ColumnWidthConfig) => {
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newWidths))
        } catch {
          // ignore
        }
      }
    },
    [storageKey]
  )

  const handleStartResize = useCallback(
    (colKey: string, startX: number, initialVisualWidth?: number) => {
      setActiveCol(colKey)
      const startWidth = initialVisualWidth !== undefined ? Math.round(initialVisualWidth) : (widthsRef.current[colKey] || defaultWidths[colKey] || 100)
      const minW = minWidths[colKey] !== undefined ? minWidths[colKey] : 24

      const onPointerMove = (clientX: number) => {
        const delta = clientX - startX
        const newWidth = Math.max(minW, startWidth + delta)
        setWidths(prev => {
          const updated = { ...prev, [colKey]: newWidth }
          widthsRef.current = updated
          return updated
        })
      }

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault()
        onPointerMove(e.clientX)
      }

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches && e.touches[0]) {
          onPointerMove(e.touches[0].clientX)
        }
      }

      const handleEnd = () => {
        setActiveCol(null)
        saveWidths(widthsRef.current)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleEnd)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleTouchMove, { passive: true })
      document.addEventListener('touchend', handleEnd)
    },
    [defaultWidths, minWidths, saveWidths]
  )

  const handleReset = useCallback(
    (colKey: string) => {
      const def = defaultWidths[colKey]
      if (def) {
        setWidths(prev => {
          const updated = { ...prev, [colKey]: def }
          saveWidths(updated)
          return updated
        })
      }
    },
    [defaultWidths, saveWidths]
  )

  const resetAll = useCallback(() => {
    setWidths(defaultWidths)
    saveWidths(defaultWidths)
  }, [defaultWidths, saveWidths])

  const autoFitColumn = useCallback(
    (colKey: string, maxLen?: number, extraPadding = 30) => {
      const len = maxLen !== undefined ? maxLen : (onMeasureCol ? onMeasureCol(colKey) : 12)
      const calculated = Math.ceil(len * 9.2) + extraPadding
      const minW = minWidths[colKey] !== undefined ? minWidths[colKey] : 32
      const updatedWidth = Math.max(minW, Math.min(540, calculated))

      setWidths(prev => {
        const updated = { ...prev, [colKey]: updatedWidth }
        saveWidths(updated)
        return updated
      })
    },
    [minWidths, onMeasureCol, saveWidths]
  )

  const autoFitAll = useCallback(
    (lengths: Record<string, number>, extraPadding = 36) => {
      setWidths(prev => {
        const next: ColumnWidthConfig = { ...prev }
        for (const [colKey, maxLen] of Object.entries(lengths)) {
          // Generous character scaling (9.5px per character + 36px cell padding/resizer buffer)
          const calculated = Math.ceil(maxLen * 9.5) + extraPadding
          const baseMinW = minWidths[colKey] !== undefined ? minWidths[colKey] : 32

          // Column-specific minimum auto-fit floor to guarantee all icons, buttons, and select dropdowns fit
          const autoFitFloor =
            colKey === 'customer' ? 145 :
            colKey === 'phone' ? 125 :
            colKey === 'city' ? 120 :
            colKey === 'address' ? 240 :
            colKey === 'orderType' ? 155 :
            colKey === 'statusTracking' ? 185 :
            colKey === 'actions' || colKey === 'action' ? 115 :
            colKey === 'refId' ? 115 :
            colKey === 'cod' ? 100 :
            colKey === 'detail' || colKey === 'note' ? 160 :
            colKey === 'weight' ? 75 :
            colKey === 'copies' ? 75 : baseMinW

          // Safe upper bounds per column so full text is displayed without artificial truncation
          const maxAllowed = 
            colKey === 'address' ? 520 :
            colKey === 'customer' ? 320 :
            colKey === 'detail' || colKey === 'note' ? 420 :
            colKey === 'refId' ? 180 :
            colKey === 'statusTracking' ? 240 :
            colKey === 'city' ? 190 :
            colKey === 'phone' ? 150 :
            colKey === 'orderType' ? 180 :
            colKey === 'cod' ? 140 : 220

          const targetWidth = Math.max(autoFitFloor, calculated)
          next[colKey] = Math.max(baseMinW, Math.min(maxAllowed, targetWidth))
        }
        saveWidths(next)
        return next
      })
    },
    [minWidths, saveWidths]
  )

  // Listen for external trigger events (from toolbar KPI buttons)
  useEffect(() => {
    if (!storageKey) return

    const handleAutoFitEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ lengths?: Record<string, number> }>
      if (customEvent.detail?.lengths) {
        autoFitAll(customEvent.detail.lengths)
      }
    }

    const handleResetEvent = () => {
      resetAll()
    }

    window.addEventListener(`autofit_${storageKey}`, handleAutoFitEvent)
    window.addEventListener(`reset_${storageKey}`, handleResetEvent)

    return () => {
      window.removeEventListener(`autofit_${storageKey}`, handleAutoFitEvent)
      window.removeEventListener(`reset_${storageKey}`, handleResetEvent)
    }
  }, [storageKey, autoFitAll, resetAll])

  const getResizerProps = useCallback(
    (colKey: string) => {
      return {
        onMouseDown: (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          const th = (e.currentTarget as HTMLElement).closest('th')
          const domWidth = th ? th.getBoundingClientRect().width : undefined
          handleStartResize(colKey, e.clientX, domWidth)
        },
        onTouchStart: (e: React.TouchEvent) => {
          e.stopPropagation()
          if (e.touches && e.touches[0]) {
            const th = (e.currentTarget as HTMLElement).closest('th')
            const domWidth = th ? th.getBoundingClientRect().width : undefined
            handleStartResize(colKey, e.touches[0].clientX, domWidth)
          }
        },
        onDoubleClick: (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          if (e.altKey) {
            handleReset(colKey)
          } else if (onMeasureCol) {
            autoFitColumn(colKey)
          } else {
            handleReset(colKey)
          }
        },
        className: `absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center select-none z-20 group/resizer hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors ${
          activeCol === colKey ? 'bg-emerald-500/40 ring-1 ring-emerald-500' : ''
        }`,
        title: 'Drag left/right to resize • Double-click to auto-fit content • Alt+Double-click to reset'
      }
    },
    [handleStartResize, handleReset, activeCol, onMeasureCol, autoFitColumn]
  )

  return {
    widths,
    activeCol,
    getResizerProps,
    resetColumn: handleReset,
    resetAll,
    autoFitColumn,
    autoFitAll,
    setWidth: (colKey: string, width: number) => {
      setWidths(prev => {
        const updated = { ...prev, [colKey]: width }
        saveWidths(updated)
        return updated
      })
    }
  }
}
