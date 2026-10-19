export interface SharedPaginationProps {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (newPage: number) => void
  onPageSizeChange?: (newSize: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
  className?: string
}

export function SharedPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100, 200, 300],
  itemLabel = 'records',
  className = ''
}: SharedPaginationProps) {
  if (totalItems <= 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)

  const fromIndex = (safePage - 1) * pageSize + 1
  const toIndex = Math.min(safePage * pageSize, totalItems)

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== safePage) {
      onPageChange(page)
    }
  }

  // Generate page numbers with smart ellipsis windowing
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = [1]

    const start = Math.max(2, safePage - 1)
    const end = Math.min(totalPages - 1, safePage + 1)

    if (start > 2) {
      pages.push('ellipsis')
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages - 1) {
      pages.push('ellipsis')
    }

    pages.push(totalPages)
    return pages
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:px-4 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 shadow-xs ${className}`}
    >
      {/* Left: Entries Counter & Page Size Selector */}
      <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <strong className="font-mono text-slate-800 dark:text-slate-100">{fromIndex}</strong>
          {' '}&ndash;{' '}
          <strong className="font-mono text-slate-800 dark:text-slate-100">{toIndex}</strong>
          {' '}of{' '}
          <strong className="font-mono text-slate-900 dark:text-white">{totalItems}</strong>
          {' '}{itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden xs:inline text-[11px] font-medium">Rows:</span>
            <select
              value={pageSize}
              onChange={e => {
                const newSize = Number(e.target.value)
                onPageSizeChange(newSize)
                onPageChange(1) // Reset to first page on size change
              }}
              className="h-8 px-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer transition"
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Responsive Pagination Navigation Buttons — Apple iOS Styling */}
      <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page */}
        <button
          type="button"
          onClick={() => handlePageClick(1)}
          disabled={safePage <= 1}
          title="First Page"
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95 shadow-2xs"
        >
          &laquo;
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => handlePageClick(safePage - 1)}
          disabled={safePage <= 1}
          title="Previous Page"
          className="h-8 px-3 rounded-full flex items-center gap-1 text-xs font-medium transition border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95 shadow-2xs"
        >
          <span>&lsaquo;</span>
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1 mx-0.5">
          {getVisiblePages().map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-6 text-center text-xs text-slate-400 font-mono select-none"
                >
                  &hellip;
                </span>
              )
            }
            const isActive = page === safePage
            return (
              <button
                key={page}
                type="button"
                onClick={() => handlePageClick(page)}
                className={`h-8 min-w-[32px] px-2.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => handlePageClick(safePage + 1)}
          disabled={safePage >= totalPages}
          title="Next Page"
          className="h-8 px-3 rounded-full flex items-center gap-1 text-xs font-medium transition border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95 shadow-2xs"
        >
          <span className="hidden sm:inline">Next</span>
          <span>&rsaquo;</span>
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => handlePageClick(totalPages)}
          disabled={safePage >= totalPages}
          title="Last Page"
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95 shadow-2xs"
        >
          &raquo;
        </button>
      </div>
    </div>
  )
}
