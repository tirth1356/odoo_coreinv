import { Search, Bell, Filter } from 'lucide-react'

export const Topbar = () => {
  return (
    <div className="h-16 border-b border-brand-stone bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 max-w-xl flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-tan" />
          <input
            type="text"
            placeholder="Search SKUs or products..."
            className="w-full pl-10 pr-4 py-2 border border-brand-stone rounded-md focus:outline-none focus:ring-2 focus:ring-brand-tan bg-brand-cream/30 text-brand-brown placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-brand-brown bg-white border border-brand-stone rounded-md hover:bg-brand-cream transition-colors">
          <Filter className="w-4 h-4 text-brand-tan" />
          All Warehouses
        </button>
        
        <button className="relative p-2 text-brand-tan hover:text-brand-brown rounded-full hover:bg-brand-cream transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
      </div>
    </div>
  )
}
