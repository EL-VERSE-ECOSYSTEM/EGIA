import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full py-12 bg-slate-950 text-white mt-auto border-t border-slate-800">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800 text-xs text-slate-400">
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white tracking-wider uppercase">EL LEARNERS</h3>
            <p className="leading-relaxed">
              All-in-one Smart School Management System & CBT Exam Portal powered by EL VERSE ECOSYSTEM.
            </p>
            <p className="text-[11px]">
              Plot 12, Innovation Hub Drive, Victoria Island, Lagos, Nigeria
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black text-amber-400 tracking-widest uppercase">Legal & Compliance</h3>
            <ul className="space-y-2 font-medium">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
              </li>
              <li>
                <Link href="/data-deletion" className="hover:text-white transition-colors">Data Deletion Request</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black text-amber-400 tracking-widest uppercase">Portals & Login</h3>
            <ul className="space-y-2 font-medium">
              <li>
                <Link href="/auth/signin" className="hover:text-amber-400 transition-colors">Staff & Admin Portal</Link>
              </li>
              <li>
                <Link href="/school-registration" className="hover:text-amber-400 transition-colors">Register a New School</Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-amber-400 transition-colors">Student & Parent Onboarding</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black text-amber-400 tracking-widest uppercase">Support Contact</h3>
            <p className="leading-relaxed">
              Email: <a href="mailto:elversetechnologies@gmail.com" className="text-amber-400 font-bold hover:underline">elversetechnologies@gmail.com</a>
            </p>
            <p className="leading-relaxed">
              Phone: <span className="text-white font-bold">+234-814-000-0000</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p className="font-bold text-slate-500">
            &copy; {new Date().getFullYear()} EL LEARNERS | EL VERSE ECOSYSTEM. All rights reserved.
          </p>
          <div className="text-slate-400 font-medium text-center md:text-right">
            Crafted with 💖 by{' '}
            <a
              href="https://x.com/EVE_Connect1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit EL CODERS Twitter profile"
              className="text-amber-400 font-black hover:underline"
            >
              EL CODERS BY EL VERSE ECOSYSTEM
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
