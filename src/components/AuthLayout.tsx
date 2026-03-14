import { Outlet } from 'react-router-dom'
import { Package } from 'lucide-react'

export const AuthLayout = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1F1D1A 0%, #2A2520 30%, #1F1D1A 60%, #332E28 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 10s ease infinite',
      }}
    >
      {/* Moving Dots Background */}
      <div 
        className="absolute inset-[-100px] dots-pattern opacity-[0.07] pointer-events-none" 
        style={{ animation: 'move-dots 12s linear infinite' }} 
      />

      {/* Floating decorative orbs */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${40 + i * 25}px`,
            height: `${40 + i * 25}px`,
            background: `radial-gradient(circle, rgba(184,134,11,${0.06 + i * 0.015}), transparent)`,
            left: `${5 + i * 15}%`,
            top: `${10 + (i % 4) * 22}%`,
            animation: `float ${4 + i * 0.7}s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}

      {/* Card container */}
      <div
        className="max-w-md w-full space-y-8 relative z-10"
        style={{ animation: 'fadeInUp 0.8s ease-out both' }}
      >
        {/* Brand header */}
        <div className="flex flex-col items-center" style={{ animation: 'fadeInUp 0.8s ease-out 0.15s both' }}>
          <div className="w-16 h-16 rounded-xl bg-[#B8860B]/15 border border-[#B8860B]/25 flex items-center justify-center mb-5">
            <Package className="w-9 h-9 text-[#B8860B]" />
          </div>

          <h2 className="text-center text-3xl font-black tracking-tight uppercase animate-shimmer" style={{ WebkitTextFillColor: 'transparent' }}>
            GoodStock
          </h2>
          <p
            className="mt-1.5 text-center text-xs font-semibold text-[#B8860B]/70 uppercase tracking-[0.2em]"
            style={{ animation: 'fadeIn 1s ease-out 0.6s both' }}
          >
            Inventory Management
          </p>
        </div>

        {/* Form outlet */}
        <div style={{ animation: 'fadeInUp 0.8s ease-out 0.4s both' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
