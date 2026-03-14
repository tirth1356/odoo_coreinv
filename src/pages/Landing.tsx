import { Link } from 'react-router-dom'
import { ArrowRight, Package, Shield, Zap } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { TextShuffle } from '../components/ui/TextShuffle'

export const Landing = () => {
  return (
    <div className="min-h-screen bg-[#1A1714] text-[#F8F6F1] selection:bg-[#B8860B]/30 overflow-x-hidden">
      {/* Animated Background Layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 dots-pattern opacity-10 animate-[move-dots_20s_linear_infinite]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#B8860B]/10 blur-[120px] rounded-full animate-float " />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#B8860B]/5 blur-[150px] rounded-full animate-float" style={{ animationDelay: '-5s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-[1400px] mx-auto px-8 py-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#B8860B] rounded-xl flex items-center justify-center shadow-2xl shadow-[#B8860B]/20">
            <Package className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">GoodStock</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login">
            <Button variant="ghost" className="text-[#D9D3C7] hover:text-white hover:bg-white/5 text-lg px-6">
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-[#B8860B] text-white hover:bg-[#D4A229] shadow-2xl shadow-[#B8860B]/30 border-none px-8 h-12 text-lg rounded-xl">
              Create Account
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-8 pt-32 pb-48 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[#B8860B] text-xs font-bold uppercase tracking-[0.2em] mb-12 animate-fade-in">
          <Zap className="w-4 h-4" /> Next-Gen Inventory Management
        </div>
        <h1 className="text-6xl md:text-[8rem] font-black tracking-tighter mb-10 leading-[0.85] animate-fade-in-up">
          <TextShuffle text="PRECISION STORAGE." /><br />
          <span className="text-[#B8860B] italic">
            <TextShuffle text="UNSTOPPABLE" delay={300} />
          </span> FLOW.
        </h1>
        <p className="max-w-3xl mx-auto text-[#D9D3C7] text-xl md:text-2xl font-medium mb-16 animate-fade-in-up leading-relaxed opacity-85" style={{ animationDelay: '0.1s' }}>
          Experience the ultimate inventory ledger. Built for high-speed logistics and industrial scaling. Track, move, and scale with military precision.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Link to="/signup">
            <Button className="h-16 px-10 text-xl bg-[#B8860B] text-white hover:bg-[#D4A229] rounded-2xl shadow-[0_20px_40px_rgba(184,134,11,0.3)] border-none transition-all hover:scale-105 active:scale-95">
              Get Started <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" className="h-16 px-10 text-xl border-white/20 text-white hover:bg-white/10 rounded-2xl transition-all hover:border-white/40">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-[1400px] mx-auto px-8 py-40 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: <Package className="w-9 h-9" />,
              title: "Unified Inventory",
              desc: "Manage products across diverse warehouses—from FMCG to Heavy Electronics—all in one place with real-time sync."
            },
            {
              icon: <Zap className="w-9 h-9" />,
              title: "Instant Transfers",
              desc: "Move stock internally between racks or externally to customers with zero friction tracking and automated ledger updates."
            },
            {
              icon: <Shield className="w-9 h-9" />,
              title: "Verified Audits",
              desc: "Maintain a flawless stock ledger with automated history, secure manual adjustment trails, and production-ready security."
            }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.05] hover:border-[#B8860B]/40 transition-all duration-500 group">
              <div className="w-16 h-16 bg-[#B8860B]/10 rounded-[20px] flex items-center justify-center text-[#B8860B] mb-8 group-hover:bg-[#B8860B]/20 group-hover:scale-110 transition-all duration-500">
                {f.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight uppercase italic">{f.title}</h3>
              <p className="text-[#D9D3C7]/60 text-lg leading-relaxed font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 py-40 text-center">
        <h2 className="text-4xl md:text-5xl font-black mb-20 tracking-tighter uppercase italic">The Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          {[
            { step: "01", title: "Initialize Hubs", desc: "Define warehouses and categorize your unique industrial product SKUs." },
            { step: "02", title: "Track Logistics", desc: "Log receipts and deliveries to build a real-time, automated stock ledger." },
            { step: "03", title: "Optimize Scale", desc: "Leverage the dashboard to tune reorder points and distribution efficiency." }
          ].map((s, i) => (
            <div key={i} className="relative group">
              <span className="text-6xl font-black text-white/5 absolute -top-10 -left-4 group-hover:text-[#B8860B]/20 transition-colors uppercase italic select-none">{s.step}</span>
              <div className="relative pt-4">
                <h4 className="text-xl font-black mb-3 tracking-tight uppercase italic flex items-center gap-2">
                   {s.title}
                </h4>
                <p className="text-[#D9D3C7]/40 text-lg font-medium leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Simplified Footer / Bottom CTA */}
      <footer className="relative z-10 max-w-[1400px] mx-auto px-8 py-20 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#B8860B]/20 rounded-xl flex items-center justify-center">
            <Package className="text-[#B8860B] w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic opacity-50">GoodStock</span>
        </div>
        <div className="flex items-center gap-8 text-[#D9D3C7]/40 font-bold text-sm tracking-[0.2em] uppercase">
          <Link to="/login" className="hover:text-[#B8860B] transition-colors">Login</Link>
          <Link to="/signup" className="hover:text-[#B8860B] transition-colors">Sign Up</Link>
          <span className="opacity-20">|</span>
          <span>Security First</span>
        </div>
      </footer>
    </div>
  )
}
