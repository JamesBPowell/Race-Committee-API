import HeroSection from "@/components/HeroSection";
import LiveNowSection from "@/components/LiveNowSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 selection:bg-cyan-500/30">

      {/* Modern Top Navigation Bar (Placeholder) */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mock Logo */}
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
            RK
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight drop-shadow-md">
            RaceKrewe
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-200">
          <a href="#" className="hover:text-cyan-400 transition-colors">Find Events</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">RC Resources</a>
          <button className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all backdrop-blur-md">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <HeroSection />

      {/* Live Action Section Below Fold */}
      <LiveNowSection />

      {/* Simple Footer Placeholder */}
      <footer className="bg-slate-950 py-12 text-center text-slate-500 text-sm border-t border-slate-900">
        <p>&copy; {new Date().getFullYear()} RaceKrewe. All rights reserved.</p>
        <p className="mt-2 text-slate-600">Built for the modern Race Committee.</p>
      </footer>

    </main>
  );
}
