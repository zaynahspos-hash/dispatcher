import { useState, useCallback, useRef } from 'react'

export interface ColumnWidthConfig {
  [key: string]: number
}

interface UseResizableColumnsOptions {
  storageKey?: string
  defaultWidths: ColumnWidthConfig
  minWidths?: { [key: string]: number }
}

export function useResizableColumns({
  storageKey,
  defaultWidths,
  minWidths = {}
}: UseResizableColumnsOptions) {
  const [widths, setWidths] = useState<ColumnWidthConfig>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          return { ...defaultWidths, ...JSON.parse(saved) }
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
    (colKey: string, startX: number) => {
      setActiveCol(colKey)
      const startWidth = widthsRef.current[colKey] || defaultWidths[colKey] || 100
      const minW = minWidths[colKey] || 40

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

  const getResizerProps = useCallback(
    (colKey: string) => {
      return {
        onMouseDown: (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          handleStartResize(colKey, e.clientX)
        },
        onTouchStart: (e: React.TouchEvent) => {
          e.stopPropagation()
          if (e.touches && e.touches[0]) {
            handleStartResize(colKey, e.touches[0].clientX)
          }
        },
        onDoubleClick: (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          handleReset(colKey)
        },
        className: `absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center select-none z-20 group/resizer hover:bg-emerald-500/20 active:bg-emerald-500/40 transition-colors ${
          activeCol === colKey ? 'bg-emerald-500/40 ring-1 ring-emerald-500' : ''
        }`,
        title: 'Drag left/right to resize column • Double-click to reset to default'
      }
    },
    [handleStartResize, handleReset, activeCol]
  )

  return {
    widths,
    activeCol,
    getResizerProps,
    resetColumn: handleReset,
    setWidth: (colKey: string, width: number) => {
      setWidths(prev => {
        const updated = { ...prev, [colKey]: width }
        saveWidths(updated)
        return updated
      })
    }
  }
}
