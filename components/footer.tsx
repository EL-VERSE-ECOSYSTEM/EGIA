import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full py-6 bg-slate-900 text-white mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">
            &copy; {new Date().getFullYear()} EL GOODNEWS INT'L ACADEMY. All rights reserved.
          </div>
          <div className="text-xs text-slate-400 font-mono text-center md:text-right">
            built by <span className="text-amber-500 font-bold">ELCODERS</span> by E.V.E # EL GOODNEWS INT'L ACADEMY - Complete School Management System (UPDATED)
          </div>
        </div>
      </div>
    </footer>
  )
}
