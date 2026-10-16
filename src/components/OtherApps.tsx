import { AppsIcon } from './Icons'

interface AppItem {
  id: string
  name: string
  tagline: string
  description: string
  url: string
  badge?: string
  logo: string
  image: string
  article: {
    title: string
    paragraphs: string[]
    features: string[]
  }
}

export default function OtherApps() {
  const apps: AppItem[] = [
    {
      id: 'pos',
      name: 'Zaynah POS Manager',
      tagline: 'Retail Billing & Offline Sales System',
      description: 'Unified cloud-based Point of Sale platform engineered for Pakistani retail shops, multi-branch stores, and wholesale merchants.',
      url: 'https://zaynahspos.com',
      badge: 'ZaynahPOS.com',
      logo: '/zaynahs-logo.svg',
      image: '/zaynahspos.com.webp',
      article: {
        title: 'Core System Capabilities',
        paragraphs: [
          'Zaynah POS manages retail sales, barcode scanning, order receipts, and real-time inventory deductions across individual and multi-counter branches.',
          'Transactions update stock quantities instantaneously. Sales receipts can be dispatched directly to customer WhatsApp numbers or printed via 80mm/58mm thermal printers.'
        ],
        features: [
          'High-Speed Barcode Checkout & Thermal Receipt Printing',
          'Real-Time Multi-Warehouse Stock & Inventory Tracking',
          'Daily Sales Ledger, Audit Trails & Profit Analytics',
          'Unified Customer Directory with Purchase History Logs'
        ]
      }
    },
    {
      id: 'dispatch',
      name: 'Zaynah Courier Dispatcher',
      tagline: 'Multi-Tenant Logistics Engine & Courier Automation',
      description: 'Intelligent parcel booking system converting unstructured customer chat messages into verified PostEx courier dispatches in seconds.',
      url: 'https://dispatcher.zaynahspos.com/',
      badge: 'Active System',
      logo: '/apple-touch-icon.png?v=20261014',
      image: '/app-preview.webp',
      article: {
        title: 'Core System Capabilities',
        paragraphs: [
          'Courier Dispatcher utilizes LLM intelligence (Groq LLaMA, OpenAI, Gemini) to extract customer names, phone numbers, cities, and COD values from WhatsApp chats.',
          'Cleaned addresses are validated against PostEx operational delivery zones and booked in 1 click, eliminating manual portal entry errors and saving hours daily.'
        ],
        features: [
          'Multi-Engine AI Address Cleaning (Groq LLaMA, OpenAI, Gemini)',
          'Direct PostEx V3 Courier API Booking in 1 Click',
          'Thermal Airway Bill (CN) Printing & Operational City Resolution',
          'Activity Audit Logs & Multi-Tenant Organization Control'
        ]
      }
    }
  ]

  return (
    <div className="w-full bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <AppsIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
          <span>Ecosystem & Merchant Tools</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Connected POS and logistics tools for retail and e-commerce stores
        </p>
      </div>

      {/* Grid of Apps */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {apps.map(app => {
            const isCurrent = app.id === 'dispatch'
            return (
              <div 
                key={app.id} 
                className="group relative bg-slate-50/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-[#0f172a] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Header: Logo & Details */}
                  <div className="flex gap-4 items-start mb-4">
                    <img 
                      src={app.logo} 
                      alt={`${app.name} Logo`} 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-xs bg-white dark:bg-slate-950 p-1.5 border border-slate-200 dark:border-slate-800 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {app.name}
                        </h3>
                        {app.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                            isCurrent 
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mt-1">
                        {app.tagline}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {app.description}
                      </p>
                    </div>
                  </div>

                  {/* App Preview Image */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-xs">
                    <img 
                      src={app.image} 
                      alt={app.name} 
                      className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-300" 
                    />
                  </div>

                  {/* Detailed Feature Box */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800">
                    <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{app.article.title}</span>
                    </h4>
                    
                    {app.article.paragraphs.map((p, idx) => (
                      <p key={idx} className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {p}
                      </p>
                    ))}

                    <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Highlights:</h5>
                      <ul className="space-y-1.5">
                        {app.article.features.map((f, idx) => (
                          <li key={idx} className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {isCurrent ? 'Current Session' : 'Cloud Software'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {app.id === 'pos' && (
                      <a
                        href="https://demo.zaynahspos.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>Demo</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    )}
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Open {app.id === 'pos' ? 'ZaynahPOS' : 'Dispatcher'}</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
