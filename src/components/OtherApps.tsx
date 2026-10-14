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
      description: 'Zaynah POS Retail business ko lead karne wala smart Point-of-Sale software hai jo shopkeepers, brands aur wholesale dealers ko digitalize karta hai.',
      url: 'https://zaynahspos.com',
      badge: 'ZaynahPOS.com',
      // Swapped URLs: logo is the cart icon with bolt, image is the retail tablet store preview
      logo: 'https://vnoxmoqnyqaqnlsnwbus.supabase.co/storage/v1/object/public/product-images/zaynahspos.com.webp',
      image: 'https://vnoxmoqnyqaqnlsnwbus.supabase.co/storage/v1/object/public/product-images/zaynahspos.com%20(1).webp',
      article: {
        title: 'Zaynah POS Kya Hai aur Yeh Kyun Zaroori Hai?',
        paragraphs: [
          'Zaynah POS retail businesses ke liye ek comprehensive cloud-based Point of Sale solution hai. Yeh software shop ki daily billing, sales records, aur offline orders tracking ko automatic aur hassle-free banata hai.',
          'Har sale ke sath stock levels automatically update hote hain aur digital receipts directly print ya WhatsApp share ki ja sakti hain. Is POS system ka main goal retail stores ko fast checkout aur automatic reports faraham karna hai.'
        ],
        features: [
          '⚡ Super-Fast Checkout & Thermal Receipt Printing',
          '📦 Real-time Auto Stock & Inventory Deduction',
          '📊 Daily Sales Reports & Profit-Loss Trackers',
          '👥 Customer Directory with Purchase History Logs'
        ]
      }
    },
    {
      id: 'dispatch',
      name: 'Zaynah Courier Dispatcher v1',
      tagline: 'WhatsApp AI Booking & PostEx Courier Integrator',
      description: 'Customer chats ko automatic order bookings main convert karne wala super-fast software. AI and courier integration ek hi platform par.',
      url: 'https://dispatcher.zaynahspos.com/',
      badge: 'Active System',
      logo: 'https://vnoxmoqnyqaqnlsnwbus.supabase.co/storage/v1/object/public/product-images/zaynahs%20dispatcher%20logo.webp',
      image: 'https://vnoxmoqnyqaqnlsnwbus.supabase.co/storage/v1/object/public/product-images/app-preview.webp',
      article: {
        title: 'Zaynah Courier Dispatcher Kaise Kaam Karta Hai?',
        paragraphs: [
          'Zaynah Courier Dispatcher modern AI (Llama, Gemini, Claude) models ka use kar ke WhatsApp se customer addresses aur parcel info extract karta hai.',
          'Address auto-clean hotay hi yeh direct PostEx Courier database main bulk bookings create kar deta hai. manual typing aur manual booking processes ko khatam kar ke yeh bookings ko 90% tak fast karta hai.'
        ],
        features: [
          '🤖 Multi-engine AI Chat Parsing (Llama, Gemini, Claude)',
          '🚚 Direct PostEx Courier Booking in just 1 Click',
          '🏷️ Bulk Label Printing & Operational Cities Verification',
          '📈 Activity Logs & Admin Configuration panel'
        ]
      }
    }
  ]

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
          <AppsIcon size={20} className="text-blue-600 dark:text-blue-400" />
          <span>Our Business Ecosystem</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Explore and manage connected merchant tools</p>
      </div>

      {/* Grid of Apps */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {apps.map(app => {
            const isCurrent = app.id === 'dispatch'
            return (
              <div 
                key={app.id} 
                className="group relative bg-slate-50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-slate-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/40 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* App Store Style Header: Logo on Left/Top, Details on Right/Bottom */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left mb-4">
                    <img 
                      src={app.logo} 
                      alt={`${app.name} Logo`} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-sm bg-white dark:bg-gray-950 p-1 border border-slate-200 dark:border-gray-700 flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-1.5 sm:gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-snug break-words">
                          {app.name}
                        </h3>
                        {app.badge && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${
                            isCurrent 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40' 
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                          }`}>
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-extrabold mt-1 break-words">
                        {app.tagline}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-450 mt-1.5">
                        {app.description}
                      </p>
                    </div>
                  </div>

                  {/* App Preview Image Mockup (Screenshot style) */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-5 border border-slate-200 dark:border-gray-700 shadow-sm bg-gray-100 dark:bg-gray-900">
                    <img 
                      src={app.image} 
                      alt={app.name} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>

                  {/* Detailed Article Section */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-gray-900 border border-slate-150 dark:border-gray-800">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center justify-center sm:justify-start gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                      <span>{app.article.title}</span>
                    </h4>
                    
                    {app.article.paragraphs.map((p, idx) => (
                      <p key={idx} className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                        {p}
                      </p>
                    ))}

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-800/50">
                      <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 text-center sm:text-left">Key Features:</h5>
                      <ul className="space-y-1.5">
                        {app.article.features.map((f, idx) => (
                          <li key={idx} className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center sm:justify-start">
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-slate-150 dark:border-gray-850 flex flex-col sm:flex-row gap-3.5 items-center justify-between text-center sm:text-left">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
                    {isCurrent ? 'Active Application' : 'Website Address'}
                  </span>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3">
                    {isCurrent && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 border-r border-slate-200 dark:border-gray-800 pr-3 flex-shrink-0">
                        Current App
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    )}
                    {app.id === 'pos' && (
                      <a
                        href="https://demo.zaynahspos.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer flex-shrink-0 border border-blue-200 dark:border-blue-800/40"
                      >
                        <span>Try Demo</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    )}
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <span>Open {app.id === 'pos' ? 'zaynahspos.com' : 'dispatcher.zaynahspos.com'}</span>
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
