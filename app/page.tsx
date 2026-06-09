import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import { ArrowRight, BookOpen, CheckCircle, ShieldCheck, Zap, Star } from 'lucide-react'

export default async function LandingPage() {
  const session = await auth.getSession()
  const user = session?.user

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <header className="px-4 lg:px-12 h-20 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-amber-200">
            EG
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">EL GOODNEWS <span className="text-amber-600">Academy</span></span>
        </Link>
        <nav className="ml-auto hidden md:flex gap-8">
          <Link className="text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors" href="/about">About</Link>
          <Link className="text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors" href="/admissions">Admissions</Link>
          <Link className="text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors" href="/news">News</Link>
          <Link className="text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors" href="/contact">Contact</Link>
        </nav>
        <div className="ml-8 flex gap-3">
          {user ? (
            <Link href="/dashboard-redirect">
              <Button className="bg-amber-600 hover:bg-amber-700 rounded-full px-6 shadow-md shadow-amber-100 font-bold transition-all hover:scale-105 active:scale-95">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in"><Button variant="ghost" className="rounded-full px-6 font-bold text-slate-700">Log In</Button></Link>
              <Link href="/sign-up"><Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 font-bold shadow-lg shadow-slate-200 transition-all hover:scale-105 active:scale-95">Join Now</Button></Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-32 lg:pt-32 lg:pb-48 bg-white">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-xs font-bold tracking-widest uppercase border border-amber-100">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Excellence in Education Since 1998
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-slate-900 leading-[1.1]">
                  Nurturing the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">Leaders</span> of Tomorrow
                </h1>
                <p className="mx-auto max-w-[800px] text-lg sm:text-xl text-slate-600 leading-relaxed">
                  Experience a world-class foundation where technology meets tradition. We empower students with character, competence, and creativity to thrive in a digital world.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link href="/admissions">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-16 px-10 rounded-2xl shadow-xl shadow-amber-200 transition-all hover:-translate-y-1">
                    Apply for Admission <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="border-slate-200 text-slate-700 font-bold h-16 px-10 rounded-2xl bg-white/50 backdrop-blur hover:bg-slate-50 transition-all">
                    Explore our Curriculum
                  </Button>
                </Link>
              </div>

              <div className="pt-12 flex items-center gap-8 grayscale opacity-60">
                <div className="font-black text-2xl text-slate-400">JSS 1-3</div>
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <div className="font-black text-2xl text-slate-400">SSS 1-3</div>
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <div className="font-black text-2xl text-slate-400">WAEC/NECO</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-24 bg-slate-50 border-y border-slate-200">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl text-slate-900">Revolutionizing Learning</h2>
              <p className="text-slate-600 mt-4 max-w-[600px] mx-auto text-lg">We've integrated advanced technology into every aspect of our educational journey.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="group flex flex-col p-10 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg shadow-amber-100 group-hover:rotate-6 transition-transform">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">AI-Powered CBT</h3>
                <p className="text-slate-600 leading-relaxed">Our advanced Computer Based Testing system uses OCR and AI to provide instant results and personalized feedback.</p>
              </div>
              <div className="group flex flex-col p-10 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg shadow-purple-100 group-hover:rotate-6 transition-transform">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Digital Library</h3>
                <p className="text-slate-600 leading-relaxed">Students have 24/7 access to thousands of educational resources, interactive modules, and global e-books.</p>
              </div>
              <div className="group flex flex-col p-10 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg shadow-emerald-100 group-hover:rotate-6 transition-transform">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Parent Portal</h3>
                <p className="text-slate-600 leading-relaxed">Stay connected with your child's progress through real-time notifications on attendance, grades, and behavior.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-12 lg:p-20 rounded-[3rem] text-center text-white shadow-2xl shadow-orange-900/20">
              <h2 className="text-4xl font-black mb-6 md:text-5xl leading-tight">Ready to start the journey?</h2>
              <p className="text-amber-50 text-xl mb-12 max-w-2xl mx-auto opacity-90 font-medium">Join EL GOODNEWS International Academy and give your ward the competitive edge they deserve.</p>
              <div className="flex flex-wrap justify-center gap-6">
                <Link href="/sign-up">
                  <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800 h-16 px-12 rounded-2xl font-black text-lg transition-transform active:scale-95">
                    Register Student Now
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white/30 bg-white/10 backdrop-blur text-white hover:bg-white/20 h-16 px-12 rounded-2xl font-black text-lg transition-transform active:scale-95">
                    Speak with an Advisor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 bg-white border-t border-slate-200">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              EG
            </div>
            <span className="font-bold text-slate-900">© 2024 EL GOODNEWS Academy</span>
          </div>
          <div className="flex gap-8">
            <Link className="text-sm font-medium text-slate-500 hover:text-amber-600 transition-colors" href="/privacy">Privacy</Link>
            <Link className="text-sm font-medium text-slate-500 hover:text-amber-600 transition-colors" href="/terms">Terms</Link>
            <Link className="text-sm font-medium text-slate-500 hover:text-amber-600 transition-colors" href="/cookies">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
