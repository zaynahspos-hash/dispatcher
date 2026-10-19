import React, { useState } from 'react'
import { CustomerEntry, UserProfile } from './types'
import { SharedPagination } from '../common/SharedPagination'
import { usePagination } from '../../hooks/usePagination'
import { WhatsAppIcon } from '../Icons'

interface AdminCustomerDirectoryTabProps {
  customers: CustomerEntry[]
  users: UserProfile[]
}

export const AdminCustomerDirectoryTab: React.FC<AdminCustomerDirectoryTabProps> = ({
  customers,
  users
}) => {
  const [filterCustomer, setFilterCustomer] = useState('')
  const [filterMerchant, setFilterMerchant] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Filter customers by search term, merchant, and date range
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = !filterCustomer ||
      (c.name || '').toLowerCase().includes(filterCustomer.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(filterCustomer.toLowerCase()) ||
      (c.user?.email || '').toLowerCase().includes(filterCustomer.toLowerCase())

    const matchesMerchant = filterMerchant === 'all' || c.user_id === filterMerchant

    let matchesDate = true
    const effectiveDate = c.updated_at || c.created_at
    if (startDate) {
      const sDate = new Date(startDate)
      sDate.setHours(0, 0, 0, 0)
      const cDate = new Date(effectiveDate)
      if (cDate < sDate) matchesDate = false
    }
    if (endDate) {
      const eDate = new Date(endDate)
      eDate.setHours(23, 59, 59, 999)
      const cDate = new Date(effectiveDate)
      if (cDate > eDate) matchesDate = false
    }

    return matchesSearch && matchesMerchant && matchesDate
  })

  // DB-Optimized Shared Pagination
  const {
    currentPage, setCurrentPage, pageSize, setPageSize,
    totalItems, paginatedItems: paginatedCustomers
  } = usePagination({ items: filteredCustomers, initialPageSize: 25, storageKey: 'admin_customers' })

  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return
    const headers = ['Customer Name', 'Customer Phone', 'WhatsApp Link', 'Date Added']
    const rows = filteredCustomers.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"https://wa.me/${c.phone.replace(/\D/g,'').replace(/^0/, '92')}"`,
      new Date(c.created_at).toLocaleString()
    ])
    
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_directory_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden w-full max-w-full min-w-0">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Customer Database ({filteredCustomers.length})</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Globally unique customers across all registered merchant stores</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredCustomers.length === 0}
          className="h-9 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0c121e] space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={filterCustomer}
            onChange={e => setFilterCustomer(e.target.value)}
            placeholder="Search by customer name or phone number..."
            className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 absolute left-3 top-2.5">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Merchant and Date Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Merchant Store</label>
            <select
              value={filterMerchant}
              onChange={e => setFilterMerchant(e.target.value)}
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">All Merchants</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full h-9 border border-slate-200 dark:border-slate-800 rounded-lg px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-900 font-medium text-slate-800 dark:text-slate-200"
            />
          </div>

          {(filterMerchant !== 'all' || startDate || endDate || filterCustomer) && (
            <button
              onClick={() => {
                setFilterMerchant('all')
                setStartDate('')
                setEndDate('')
                setFilterCustomer('')
              }}
              className="h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-lg text-xs transition active:scale-95 cursor-pointer shrink-0 flex items-center justify-center gap-1"
            >
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card List View (< sm) */}
      <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No customers found in database.
          </div>
        ) : (
          paginatedCustomers.map(c => {
            const rawPhone = (c.phone || '').replace(/\D/g, '')
            const waPhone = rawPhone.startsWith('0') ? '92' + rawPhone.slice(1) : rawPhone
            return (
              <div key={c.id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {c.name || 'Unnamed Customer'}
                    </p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {c.phone}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1.5 shadow-2xs shrink-0 active:scale-95 cursor-pointer"
                  >
                    <WhatsAppIcon size={14} className="fill-current text-[#25D366]" />
                    <span>WhatsApp</span>
                  </a>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Added: {new Date(c.created_at).toLocaleDateString()}</span>
                  {c.user?.email && (
                    <span className="truncate max-w-[150px] font-medium text-slate-500 dark:text-slate-400">
                      {c.user.email}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <colgroup><col className="w-1/3" /><col className="w-1/4" /><col className="w-1/4" /><col className="w-20" /></colgroup>
          <thead>
            <tr className="bg-slate-50 dark:bg-[#070b12] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <th className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">Customer Name</th>
              <th className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">Phone Number</th>
              <th className="px-4 py-3 border-r border-slate-100 dark:border-slate-800">Date Added</th>
              <th className="px-4 py-3 text-center">WhatsApp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-medium">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-400">No customers found in database.</td>
              </tr>
            ) : (
              paginatedCustomers.map(c => {
                const rawPhone = (c.phone || '').replace(/\D/g, '')
                const waPhone = rawPhone.startsWith('0') ? '92' + rawPhone.slice(1) : rawPhone
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={`https://wa.me/${waPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-7.5 h-7.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-800/80 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition shadow-2xs cursor-pointer active:scale-95"
                        title={`Chat with ${c.name} on WhatsApp`}
                      >
                        <WhatsAppIcon size={14} className="fill-current text-[#25D366]" />
                      </a>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Shared Unified Pagination */}
      <SharedPagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50, 100, 200, 300]}
        itemLabel="customers"
        className="mt-4"
      />
    </div>
  )
}
