import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Package,
  PackagePlus, PackageMinus, Shuffle, SlidersHorizontal, 
  Warehouse, MapPin, ChevronDown, LayoutGrid, LogOut
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { supabase } from '../lib/supabase'
import clsx from 'clsx'

export const Navbar = () => {
  const { pathname } = useLocation()
  const { user, profile } = useAuthStore()
  const { viewMode, setViewMode } = useUIStore()
  
  const [opsOpen, setOpsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  const opsRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (opsRef.current && !opsRef.current.contains(event.target as Node)) {
        setOpsOpen(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on route change
  useEffect(() => {
    setOpsOpen(false)
    setSettingsOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const isActive = (path: string, prefix = false) => {
    if (prefix) return pathname.startsWith(path)
    return pathname === path
  }

  return (
    <nav className="h-14 border-b border-[#2A2520] bg-[#1A1714] flex items-center justify-between px-6 sticky top-0 z-50 shadow-lg">
      {/* Left side: Brand + Nav Links */}
      <div className="flex items-center gap-8 h-full">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <Package className="w-7 h-7 text-[#B8860B] transition-transform group-hover:scale-110" />
          <span className="text-white font-black tracking-tighter text-xl uppercase transition-colors group-hover:text-[#D4A229]">GoodStock</span>
        </Link>
 
        {/* Links */}
        <div className="hidden md:flex items-center h-full gap-1 tracking-wide">
          <Link 
            to="/" 
            className={clsx(
              "flex items-center gap-2 px-3 h-full border-b-2 text-sm font-semibold transition-all",
              isActive('/') 
                ? "border-[#B8860B] text-white"
                : "border-transparent text-white/50 hover:text-white hover:border-white/20"
            )}
          >
            Dashboard
          </Link>
          
          <Link 
            to="/products" 
            className={clsx(
              "flex items-center gap-2 px-3 h-full border-b-2 text-sm font-semibold transition-all",
              isActive('/products') 
                ? "border-[#B8860B] text-white"
                : "border-transparent text-white/50 hover:text-white hover:border-white/20"
            )}
          >
            Products
          </Link>
 
          {/* Operations Dropdown */}
          <div className="relative h-full flex items-center" ref={opsRef}>
            <button 
              onClick={() => setOpsOpen(!opsOpen)}
              className={clsx(
                "flex items-center gap-1 px-3 h-full border-b-2 text-sm font-semibold transition-all outline-none",
                isActive('/operations', true) 
                  ? "border-[#B8860B] text-white"
                  : "border-transparent text-white/50 hover:text-white hover:border-white/20"
              )}
            >
              Operations
              <ChevronDown className={clsx("w-4 h-4 transition-transform", opsOpen && "rotate-180")} />
            </button>
 
            {opsOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#2A2520] border border-[#3A3530] rounded-lg shadow-2xl py-2 overflow-hidden">
                <Link to="/operations/receipts" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.06]">
                  <PackagePlus className="w-4 h-4 text-[#B8860B]" /> Receipts
                </Link>
                <Link to="/operations/deliveries" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.06]">
                  <PackageMinus className="w-4 h-4 text-[#B8860B]" /> Deliveries
                </Link>
                <Link to="/operations/transfers" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.06]">
                  <Shuffle className="w-4 h-4 text-[#B8860B]" /> Transfers
                </Link>
                <Link to="/operations/adjustments" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.06]">
                  <SlidersHorizontal className="w-4 h-4 text-[#B8860B]" /> Adjustments
                </Link>
              </div>
            )}
          </div>
 
          <Link 
            to="/move-history" 
            className={clsx(
              "flex items-center gap-2 px-3 h-full border-b-2 text-sm font-semibold transition-all",
              isActive('/move-history') 
                ? "border-[#B8860B] text-white"
                : "border-transparent text-white/50 hover:text-white hover:border-white/20"
            )}
          >
            Move History
          </Link>
 
          {/* Settings Dropdown */}
          <div className="relative h-full flex items-center" ref={settingsRef}>
            <button 
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={clsx(
                "flex items-center gap-1 px-3 h-full border-b-2 text-sm font-semibold transition-all outline-none",
                isActive('/settings', true) 
                  ? "border-[#B8860B] text-white"
                  : "border-transparent text-white/50 hover:text-white hover:border-white/20"
              )}
            >
              Settings
              <ChevronDown className={clsx("w-4 h-4 transition-transform", settingsOpen && "rotate-180")} />
            </button>
 
            {settingsOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#2A2520] border border-[#3A3530] rounded-lg shadow-2xl py-2 overflow-hidden">
                <Link to="/settings/warehouses" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.06]">
                  <Warehouse className="w-4 h-4 text-[#B8860B]" /> Warehouses
                </Link>
                <Link to="/settings/locations" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.06]">
                  <MapPin className="w-4 h-4 text-[#B8860B]" /> Locations
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
 
      {/* Right side: View Toggle + Profile */}
      <div className="flex items-center gap-4">
        {/* Toggle List/Kanban (Visible but conditionally disabled) */}
        {(() => {
          const isSupported = ['/products', '/operations/receipts', '/operations/deliveries', '/operations/transfers', '/operations/adjustments'].some(path => pathname.startsWith(path));
          const isKanban = viewMode === 'kanban';
          
          return (
            <button
              onClick={() => isSupported && setViewMode(isKanban ? 'list' : 'kanban')}
              disabled={!isSupported}
              className={clsx(
                "group relative w-12 h-12 rounded-lg border-2 transition-all duration-300 outline-none overflow-hidden flex items-center justify-center",
                !isSupported 
                  ? "bg-gray-800/20 border-gray-700 text-gray-600 cursor-not-allowed opacity-50"
                  : "bg-white border-brand-tan/20 hover:border-brand-tan/50 shadow-sm"
              )}
              title={!isSupported ? "View mode not available" : `Switch to ${isKanban ? 'List' : 'Kanban'} View`}
            >
              {/* Water Fill Effect */}
              {isSupported && (
                <div 
                  className={clsx(
                    "absolute inset-0 bg-brand-tan transition-transform duration-700 ease-in-out origin-bottom",
                    isKanban ? "translate-y-0" : "translate-y-full"
                  )}
                  style={{ zIndex: 0 }}
                />
              )}
              
              {/* Icon Container */}
              <div className="relative z-10 flex items-center justify-center transition-colors duration-300">
                <LayoutGrid 
                  className={clsx(
                    "w-6 h-6 transition-all duration-300",
                    !isSupported ? "text-gray-600" : isKanban ? "text-white" : "text-brand-tan"
                  )} 
                />
              </div>

              {/* Shine effect on hover */}
              {isSupported && !isKanban && (
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000" />
              )}
            </button>
          );
        })()}
 
        {/* Profile Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white hover:text-[#B8860B] transition-colors cursor-default">{profile?.login_id || 'User'}</p>
            <p className="text-[10px] font-medium text-white/50">{user?.email}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 text-[#B8860B] flex items-center justify-center font-bold text-sm border border-[#B8860B]/30 overflow-hidden shadow-inner">
            {profile?.login_id?.[0].toUpperCase() || user?.email?.[0].toUpperCase()}
          </div>
          <button 
            onClick={handleLogout} 
            className="text-white/40 hover:text-red-400 transition-colors p-1" 
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}
