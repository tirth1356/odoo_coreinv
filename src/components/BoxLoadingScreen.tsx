import { Package } from 'lucide-react'

export const BoxLoadingScreen = () => {
  const boxes = Array.from({ length: 9 })
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8 z-50"
      style={{
        background: 'linear-gradient(135deg, #1F1D1A 0%, #2A2520 50%, #1F1D1A 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 6s ease infinite',
      }}
    >
      {/* Subtle floating circles */}
      {[...Array(4)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${50 + i * 25}px`,
            height: `${50 + i * 25}px`,
            background: `radial-gradient(circle, rgba(184,134,11,${0.05 + i * 0.01}), transparent)`,
            left: `${15 + i * 20}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `float ${4 + i * 0.6}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}

      {/* Brand Icon */}
      <div className="w-16 h-16 rounded-xl bg-[#B8860B]/12 border border-[#B8860B]/20 flex items-center justify-center">
        <Package className="w-9 h-9 text-[#B8860B]" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {boxes.map((_, i) => (
          <div
            key={i}
            className="w-11 h-11 rounded-lg"
            style={{
              background: 'rgba(184, 134, 11, 0.08)',
              border: '1px solid rgba(184, 134, 11, 0.15)',
              animation: `pulse-ring 1.4s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Brand text */}
      <div className="flex flex-col items-center gap-2.5">
        <span className="text-[#F8F6F1] text-xl font-black tracking-tight uppercase">
          GoodStock
        </span>
        <span className="text-[#B8860B]/60 text-xs tracking-[0.25em] uppercase font-mono">
          Loading…
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-44 h-0.5 bg-white/[0.06] rounded-full overflow-hidden mt-1">
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #B8860B, #D4A229)',
            animation: 'progress-bar 2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}
