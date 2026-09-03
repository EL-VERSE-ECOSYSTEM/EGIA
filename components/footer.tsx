import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full py-10 bg-slate-950 text-white mt-auto border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-sm font-bold text-slate-400">
              &copy; {new Date().getFullYear()} EL LEARNERS. All rights reserved.
            </p>
            <Link href="/auth/signin" className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 hover:text-amber-400 transition-colors">
              Staff & Admin Portal
            </Link>
          </div>
          <div className="text-xs text-slate-500 font-mono text-center md:text-right leading-relaxed">
            built by <span className="text-amber-500 font-black">ELCODERS</span> by E.V.E <br />
            # EL LEARNERS - Complete School Management System (UPDATED)
          </div>
        </div>
      </div>
    </footer>
  )
}
