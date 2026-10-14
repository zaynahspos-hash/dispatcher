import React from 'react'

interface GlobalLoadingOverlayProps {
  loading: boolean
  message: string
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({ loading, message }) => {
  if (!loading) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl px-6 sm:px-8 py-6 sm:py-7 text-center shadow-2xl max-w-sm w-full mx-4 transition-colors duration-200">
        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/60 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors duration-200">
          <svg className="animate-spin h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-slate-800 dark:text-gray-100 font-bold text-base mb-1">Please wait...</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  )
}
