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
  Sparkles,
  Building2
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-rose-500 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/20">
              EL
            </div>
            <span className="font-black text-xl tracking-tight text-white uppercase">
              EL <span className="text-rose-400">LEARN APP</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-sm font-bold text-slate-300 hover:text-rose-400 transition-colors">About</Link>
            <Link href="#features" className="text-sm font-bold text-slate-300 hover:text-rose-400 transition-colors">Features</Link>
            <Link href="#testimonials" className="text-sm font-bold text-slate-300 hover:text-rose-400 transition-colors">Success</Link>
            <Link href="#faq" className="text-sm font-bold text-slate-300 hover:text-rose-400 transition-colors">FAQ</Link>
            {user ? (
              <Link href="/dashboard-redirect">
                <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white rounded-xl px-6 font-black shadow-lg shadow-rose-500/20">DASHBOARD</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-slate-300 hover:text-white font-black">LOGIN</Button>
                </Link>
                <Link href="/school-registration">
                  <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white rounded-xl px-6 font-black shadow-lg shadow-rose-500/20">REGISTER SCHOOL</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden bg-slate-950">
          <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-black mb-10 tracking-widest uppercase">
              <Sparkles className="w-4 h-4" /> Multi-Tenant Educational Portal
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[0.95] tracking-tighter">
              Empowering Schools, Inspiring <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">Learners</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-400 mb-12 leading-relaxed max-w-3xl mx-auto font-medium">
              EL LEARN App provides a unified, real-time platform for school onboarding, CBT assessments, proctored exams, parent monitoring, and adult education.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/school-registration">
                <Button size="lg" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white h-16 px-10 rounded-2xl font-black text-lg shadow-2xl shadow-rose-500/25 group transition-all">
                  <span>Register School (NGN 30,000)</span> <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white h-16 px-10 rounded-2xl font-black text-lg shadow-xl transition-all">
                  User Sign Up
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[140px] translate-x-1/3 translate-y-1/3 pointer-events-none" />
        </section>

        {/* Stats Bar */}
        <section className="py-20 bg-slate-900 border-y border-slate-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
              <div className="space-y-2">
                <div className="text-5xl font-black text-rose-400 tracking-tighter">Primary 3 to SSS3</div>
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Registered Class Levels</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-black text-indigo-400 tracking-tighter">NGN 30,000</div>
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">School Subscription</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-black text-purple-400 tracking-tighter">Real-Time</div>
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Supabase Database Sync</div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-black text-emerald-400 tracking-tighter">100%</div>
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">CBT Proctor Security</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 bg-slate-950">
          <div className="container mx-auto px-4">
            <div className="text-center mb-24 space-y-4">
              <div className="inline-block px-6 py-2 rounded-full bg-slate-900 border border-slate-800 text-rose-400 text-xs font-black uppercase tracking-widest">
                Platform Capabilities
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">Built for Institutional Excellence</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "School Onboarding",
                  desc: "Register your institution with Primary 3 to SSS3 classes, set parent access, and receive a unique 5-digit school registration code.",
                  icon: Building2,
                  color: "border-indigo-500/30 text-indigo-400"
                },
                {
                  title: "CBT & Exam Security",
                  desc: "CBT assessments and Weekend Assignments scoped by school and class, with Exam access codes upon School Admin approval.",
                  icon: Monitor,
                  color: "border-rose-500/30 text-rose-400"
                },
                {
                  title: "Adult Education",
                  desc: "Parents can enroll for Adult Education courses with flexible schedules and integrated weekly fee tracking.",
                  icon: BookOpen,
                  color: "border-purple-500/30 text-purple-400"
                },
                {
                  title: "Super Admin Control",
                  desc: "Full administrative governance to manage users, approve CBT exams, verify subscriptions, and broadcast notifications.",
                  icon: ShieldCheck,
                  color: "border-emerald-500/30 text-emerald-400"
                }
              ].map((f, i) => (
                <Card key={i} className="border border-slate-800 bg-slate-900/80 rounded-3xl p-8 space-y-6 hover:border-slate-700 transition duration-300">
                  <CardContent className="p-0 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl border ${f.color} flex items-center justify-center bg-slate-950`}>
                      <f.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{f.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
