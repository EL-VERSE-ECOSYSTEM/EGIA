import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  CheckCircle2,
  Users,
  BookOpen,
  ShieldCheck,
  Monitor,
  Trophy,
  ArrowRight,
  GraduationCap,
  MessageSquare,
  MapPin,
  Phone,
  Sparkles
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default async function LandingPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090D16]/85 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0F172A] rounded-[0.9rem] flex items-center justify-center">
                <img src="/logo.svg" alt="EL LEARNERS App" className="w-7 h-7 object-contain" />
              </div>
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900 uppercase">EL LEARNERS <span className="text-amber-600">ACADEMY</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-sm font-bold text-slate-300 hover:text-amber-400 transition-colors">About</Link>
            <Link href="#features" className="text-sm font-bold text-slate-300 hover:text-amber-400 transition-colors">Features</Link>
            <Link href="#testimonials" className="text-sm font-bold text-slate-300 hover:text-amber-400 transition-colors">Success</Link>
            <Link href="#faq" className="text-sm font-bold text-slate-300 hover:text-amber-400 transition-colors">FAQ</Link>
            {user ? (
              <Link href="/dashboard-redirect">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl px-6 font-black shadow-lg shadow-amber-500/20">DASHBOARD</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-slate-200 hover:text-white font-black hover:bg-white/10">LOGIN</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 rounded-xl px-6 font-black shadow-lg shadow-amber-500/25">JOIN US</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-36 overflow-hidden bg-gradient-to-b from-[#090D16] via-[#0F172A] to-[#0F172A]">
          <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black mb-10 tracking-widest uppercase shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> Multi-Tenant School Management Platform
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-8 leading-[0.92] tracking-tighter">
              Inspiring <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">Greatness</span> In Every Student
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 mb-14 leading-relaxed max-w-3xl mx-auto font-medium">
              EL LEARNERS is where traditional values meet 21st-century innovation.
              Join a community committed to nurturing the total child.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 h-16 sm:h-20 px-10 sm:px-14 rounded-[2rem] font-black text-lg sm:text-xl shadow-2xl shadow-amber-500/25 group transition-all hover:scale-105">
                  START REGISTRATION <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white h-16 sm:h-20 px-10 sm:px-14 rounded-[2rem] font-black text-lg sm:text-xl border border-white/10 backdrop-blur-md transition-all hover:scale-105">
                  PORTAL LOGIN
                </Button>
              </Link>
              <Link href="/admissions">
                <Button variant="outline" size="lg" className="h-16 sm:h-20 px-10 sm:px-14 rounded-[2rem] font-black text-lg sm:text-xl border-2 text-slate-200 border-amber-500/30 hover:bg-amber-500/10 transition-all hover:scale-105">
                  ADMISSIONS
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px] translate-x-1/3 translate-y-1/3 pointer-events-none" />
        </section>

        {/* Stats Bar */}
        <section className="py-20 bg-[#0B0F19] border-y border-white/5 relative z-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="space-y-3">
                <div className="text-6xl sm:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400 tracking-tighter">100%</div>
                <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Real-Time Sync</div>
              </div>
              <div className="space-y-3">
                <div className="text-6xl sm:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400 tracking-tighter">Instant</div>
                <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">CBT Grading & Proctoring</div>
              </div>
              <div className="space-y-3">
                <div className="text-6xl sm:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400 tracking-tighter">Multi-Tenant</div>
                <div className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">School Ecosystem</div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us */}
        <section id="about" className="py-32 bg-[#0F172A]">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="relative group">
                <div className="aspect-[4/3] bg-slate-800 rounded-[3rem] overflow-hidden shadow-2xl relative border-4 border-white/10">
                   <img
                     src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200"
                     alt="EL LEARNERS App Academy Classroom"
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-80" />
                </div>
                <div className="absolute -bottom-10 -right-8 bg-gradient-to-tr from-amber-600 to-orange-500 text-slate-950 p-10 rounded-[2.5rem] shadow-2xl max-w-sm hidden lg:block border-4 border-white/20">
                  <p className="font-black text-2xl italic leading-snug">"We nurture the total child for a brighter global future."</p>
                </div>
              </div>
              <div className="space-y-12">
                <div className="inline-block px-8 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-[0.3em]">Our Heritage</div>
                <h2 className="text-6xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter">Committed to Academic Rigor</h2>
                <p className="text-slate-500 text-2xl leading-relaxed font-medium">
                  At EL LEARNERS, we don't just teach; we inspire. Our curriculum is designed to challenge students
                  intellectually while grounding them in moral discipline.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {[
                    "Multi-Tenant Isolation",
                    "Moral Leadership",
                    "CBT Anti-Cheat System",
                    "Instant Fee Settlement"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="bg-amber-500/20 border border-amber-500/30 p-2.5 rounded-xl text-amber-400">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="font-black text-slate-200 text-lg tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 bg-[#090D16]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-24 space-y-4">
               <div className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 text-amber-400 text-xs font-black uppercase tracking-[0.4em]">Core Capabilities</div>
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter">Advanced Digital Infrastructure</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "CBT Examination",
                  desc: "Digital examination engine with automated timing, anti-cheat detection, and real-time result compilation.",
                  icon: Monitor,
                  color: "bg-blue-500/10 text-blue-400 border-blue-500/20"
                },
                {
                  title: "Digital E-Library",
                  desc: "Centralized repository for curriculum materials, downloadable notes, past questions, and academic resources.",
                  icon: BookOpen,
                  color: "bg-amber-500/10 text-amber-400 border-amber-500/20"
                },
                {
                  title: "Real-time Messaging",
                  desc: "Direct and group communications with active Supabase real-time sync across parents, teachers, and admins.",
                  icon: MessageSquare,
                  color: "bg-purple-500/10 text-purple-400 border-purple-500/20"
                },
                {
                  title: "Parent Ward Sync",
                  desc: "Live attendance monitoring, score reports, payment tracking, and automated push notification alerts.",
                  icon: ShieldCheck,
                  color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }
              ].map((f, i) => (
                <Card key={i} className="border border-white/10 shadow-2xl hover:border-amber-500/40 transition-all duration-500 rounded-[2.5rem] bg-[#0F172A] group">
                  <CardContent className="p-10 space-y-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${f.color} group-hover:scale-110 transition-transform duration-500`}>
                      <f.icon size={28} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{f.title}</h3>
                    <p className="text-slate-400 text-base leading-relaxed font-medium">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-40 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-32">
               <div className="space-y-6">
                  <div className="inline-block px-8 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-[0.3em]">Testimonials</div>
                  <h2 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter">Voices of Success</h2>
               </div>
               <p className="text-slate-500 text-xl font-medium max-w-md">Our results speak for themselves. Hear from those who experienced EL LEARNERS firsthand.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {[
                 {
                   name: "Mrs. Adebayo",
                   role: "Parent of 3 Students",
                   quote: "The transparency is refreshing. I get my children's CBT results before they even get home from school."
                 },
                 {
                   name: "Olawale John",
                   role: "Class of 2018",
                   quote: "The academic rigor at EL LEARNERS prepared me for the competitive world of STEM. I am forever grateful."
                 },
                 {
                   name: "Dr. Evans",
                   role: "International Alumni",
                   quote: "Truly a world-class academy. The digital library and expert tutors make it a center of excellence."
                 }
               ].map((t, i) => (
                 <Card key={i} className="border-none bg-slate-50/50 rounded-[3rem] p-14 relative group hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-slate-100">
                    <MessageSquare className="text-amber-500/10 absolute top-12 right-12 w-24 h-24" />
                    <CardContent className="p-0 space-y-10 relative z-10">
                       <p className="text-2xl text-slate-700 font-black italic leading-snug">"{t.quote}"</p>
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-amber-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-amber-200">
                            {t.name[0]}
                          </div>
                          <div>
                             <p className="font-black text-xl text-slate-900">{t.name}</p>
                             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{t.role}</p>
                          </div>
                       </div>
                    </CardContent>
                 </Card>
               ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-[#0B0F19]">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
               <div className="text-center mb-20 space-y-4">
                  <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter">Everything You <span className="text-amber-400">Need to Know</span></h2>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Support & Admissions FAQ</p>
               </div>
               <Accordion type="single" collapsible className="space-y-6">
                  {[
                    {
                      q: "How does school registration work on EL LEARNERS App?",
                      a: "School administrators can complete institutional onboarding in under 3 minutes, generating a custom school code to link teachers, pupils, and parents."
                    },
                    {
                      q: "Is fee payment processing instant and secure?",
                      a: "Yes. Integrated Korapay payment gateways process NGN transactions with instant automated ledger reconciliation and receipt generation."
                    },
                    {
                      q: "Can teachers conduct proctored CBT exams?",
                      a: "Teachers can upload or AI-generate CBT question sets, monitor live examinee viewports, and lock attempts upon anti-cheat trigger violations."
                    },
                    {
                      q: "Is real-time messaging enabled across portals?",
                      a: "Yes. All conversations utilize active Supabase Postgres realtime channel listeners for zero-latency direct and group dispatches."
                    }
                  ].map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border border-white/10 bg-[#0F172A] rounded-[2rem] px-8 overflow-hidden">
                      <AccordionTrigger className="text-xl font-black text-white hover:no-underline hover:text-amber-400 transition-colors py-8 text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-400 text-lg font-medium pb-8 leading-relaxed border-t border-white/5 pt-6">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
               </Accordion>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-36 bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-500 text-slate-950 overflow-hidden relative">
          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <h2 className="text-6xl md:text-8xl font-black mb-12 tracking-tighter leading-none">Join The Future of <span className="text-white">Education</span></h2>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-slate-950 text-white hover:bg-slate-900 h-20 px-16 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-tight">
                Register Your School / Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
