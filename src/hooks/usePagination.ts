import { useState, useMemo, useEffect } from 'react'

export interface UsePaginationOptions<T> {
  items: T[]
  initialPageSize?: number
  storageKey?: string
}

export function usePagination<T>({
  items,
  initialPageSize = 25,
  storageKey
}: UsePaginationOptions<T>) {
  const [pageSize, setPageSize] = useState<number>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`pagination_size_${storageKey}`)
      if (saved) {
        if (saved === 'all' || saved === '-1') return -1
        const num = Number(saved)
        if (!isNaN(num) && (num > 0 || num === -1)) return num
      }
    }
    return initialPageSize
  })

  const [currentPage, setCurrentPage] = useState<number>(1)

  const totalItems = items.length
  // When pageSize is -1 (meaning "All"), all items are on 1 page
  const effectivePageSize = pageSize === -1 ? Math.max(1, totalItems) : pageSize
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize))

  // If items change (e.g., search filter reduces totalItems) and currentPage is out of bounds, reset safely
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    if (storageKey) {
      localStorage.setItem(`pagination_size_${storageKey}`, String(newSize))
    }
  }

  const paginatedItems = useMemo(() => {
    if (pageSize === -1) {
      return items
    }
    const start = (currentPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, currentPage, pageSize])

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    totalItems,
    paginatedItems
  }
}
