import { Link, useLocation } from 'react-router-dom'
import { 
  Package, LayoutDashboard, Boxes, 
  PackagePlus, PackageMinus, Shuffle, SlidersHorizontal, 
  History, Warehouse, MapPin, LogOut
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import clsx from 'clsx'

export const Sidebar = () => {
  const { pathname } = useLocation()
  const { user } = useAuthStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const isActive = (path: string) => pathname === path

  const NavItem = ({ to, icon: Icon, label, indent = false }: any) => (
    <Link
      to={to}
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm',
        indent && 'ml-6',
        isActive(to)
          ? 'bg-blue-600/10 text-blue-500 font-medium'
          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )

  return (
    <div className="w-64 h-screen bg-[#111827] flex flex-col fixed left-0 top-0 border-r border-gray-800 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
        <Package className="w-6 h-6 text-blue-500 mr-2" />
        <span className="text-white font-semibold tracking-wide">GoodStock</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        
        <div className="pt-4 pb-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Inventory</p>
          <NavItem to="/products" icon={Boxes} label="Products" />
        </div>

        <div className="pt-4 pb-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Operations</p>
          <NavItem to="/operations/receipts" icon={PackagePlus} label="Receipts" />
          <NavItem to="/operations/deliveries" icon={PackageMinus} label="Deliveries" />
          <NavItem to="/operations/transfers" icon={Shuffle} label="Transfers" />
          <NavItem to="/operations/adjustments" icon={SlidersHorizontal} label="Adjustments" />
        </div>

        <div className="pt-4 pb-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Reporting</p>
          <NavItem to="/move-history" icon={History} label="Move History" />
        </div>

        <div className="pt-4 pb-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Configuration</p>
          <NavItem to="/settings/warehouses" icon={Warehouse} label="Warehouses" />
          <NavItem to="/settings/locations" icon={MapPin} label="Locations" />
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-semibold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2 text-sm" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
