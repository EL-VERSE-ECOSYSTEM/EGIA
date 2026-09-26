import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ContactForm } from '@/components/ContactForm'
import { RealtimeStats } from '@/components/realtime/RealtimeStats'
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
  Phone,
  Sparkles,
  Zap,
  BarChart3,
  Clock,
  Award,
  Lock,
  Smartphone,
  Layers,
  Search
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  let user: Record<string, unknown> | null = null
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data } = await supabase.auth.getUser()
    user = (data?.user as unknown as Record<string, unknown>) ?? null
  } catch (err) {
    console.error('Error fetching user on landing page:', err)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 p-2 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900 uppercase">EL LEARNERS <span className="text-amber-600">APP</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#about" className="text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors">About</Link>
            <Link href="#features" className="text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors">Features</Link>
            <Link href="#testimonials" className="text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors">Success</Link>
            <Link href="#faq" className="text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors">FAQ</Link>
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard-redirect">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 font-black shadow-lg">DASHBOARD</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-slate-600 font-black">LOGIN</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6 font-black shadow-lg shadow-amber-200">JOIN US</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-32 overflow-hidden bg-gradient-to-br from-amber-500/10 via-blue-500/10 to-purple-500/10">
          <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs sm:text-sm font-black mb-6 sm:mb-10 tracking-widest uppercase">
              <Trophy className="w-4 h-4" /> Academic Excellence in Nigeria
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 mb-6 sm:mb-8 leading-tight tracking-tighter">
              Inspiring <span className="text-amber-600">Greatness</span> In Every Student
            </h1>
            <p className="text-base sm:text-xl text-slate-600 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto font-medium">
              EL LEARNERS is where traditional values meet 21st-century innovation.
              Join a community committed to nurturing the total child.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white h-12 sm:h-16 px-6 sm:px-10 rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-amber-200 group transition-all">
                  START REGISTRATION <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white h-12 sm:h-16 px-6 sm:px-10 rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-slate-200 transition-all">
                  PORTAL LOGIN
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute top-1/2 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-amber-400/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-blue-400/5 rounded-full blur-[140px] translate-x-1/3 translate-y-1/3" />
        </section>

        {/* Gallery / Campus Spotlight */}
        <section className="py-12 bg-white border-b border-slate-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative h-64 rounded-3xl overflow-hidden shadow-lg group">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800"
                  alt="Students Studying"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-6 flex items-end">
                  <span className="text-white font-black text-lg tracking-tight">Interactive Learning Hub</span>
                </div>
              </div>
              <div className="relative h-64 rounded-3xl overflow-hidden shadow-lg group">
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800"
                  alt="Modern Classroom"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-6 flex items-end">
                  <span className="text-white font-black text-lg tracking-tight">State-of-the-Art Classrooms</span>
                </div>
              </div>
              <div className="relative h-64 rounded-3xl overflow-hidden shadow-lg group">
                <img
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800"
                  alt="School Campus"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-6 flex items-end">
                  <span className="text-white font-black text-lg tracking-tight">Modern Educational Environment</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us */}
        <section id="about" className="py-20 sm:py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="relative group">
                <div className="aspect-[4/3] sm:aspect-[3/4] bg-slate-900 rounded-3xl sm:rounded-[3rem] overflow-hidden shadow-2xl relative border-8 sm:border-[12px] border-slate-100 flex items-center justify-center p-8">
                   <img
                     src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1000"
                     alt="EL Learners School Facility"
                     className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent p-8 flex flex-col justify-end relative z-10">
                     <div className="text-left space-y-2">
                       <GraduationCap className="w-12 h-12 text-amber-500" />
                       <h3 className="text-2xl font-black text-white uppercase tracking-wider">EL LEARNERS CAMPUS</h3>
                       <p className="text-slate-200 text-sm font-bold max-w-xs">Empowering Educational Excellence across Nigeria</p>
                     </div>
                   </div>
                </div>
              </div>
              <div className="space-y-8 sm:space-y-10">
                <div className="inline-block px-6 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-[0.2em]">Our Platform</div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-tight">Committed to Academic Rigor</h2>
                <p className="text-slate-600 text-lg sm:text-xl leading-relaxed font-medium">
                  At EL LEARNERS, we don't just teach; we inspire. Our curriculum is designed to challenge students
                  intellectually while grounding them in moral discipline.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    "Global Standard",
                    "Moral Leadership",
                    "Tech-First Lab",
                    "Secure Campus"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="bg-amber-500 p-2.5 rounded-xl shadow-md shadow-amber-200">
                        <CheckCircle2 className="text-white w-5 h-5" />
                      </div>
                      <span className="font-black text-slate-800 text-base sm:text-lg tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="#contact" className="inline-block">
                  <Button variant="outline" className="h-12 sm:h-14 px-8 rounded-xl font-black text-slate-900 border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all">
                    GET IN TOUCH
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-28 sm:py-36 bg-[#F8FAFC] relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20 space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 text-amber-400 text-xs font-black uppercase tracking-[0.3em]">
                <Sparkles className="w-4 h-4 text-amber-400" /> Platform Superpowers
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight">
                All-in-One Smart Educational Infrastructure
              </h2>
              <p className="text-slate-600 text-lg sm:text-xl font-medium">
                Designed for modern schools, dedicated teachers, ambitious students, and engaged parents across Nigeria.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Smart CBT & Exams",
                  desc: "Anti-cheat timed examinations with instant automatic grading, item bank management, and subject performance breakdown.",
                  icon: Monitor,
                  color: "bg-blue-600 shadow-blue-200",
                  badge: "Realtime Grading"
                },
                {
                  title: "Parent Sync Portal",
                  desc: "Parents receive live updates on child attendance, CBT test scores, report cards, and fee receipts directly on their dashboard.",
                  icon: ShieldCheck,
                  color: "bg-emerald-600 shadow-emerald-200",
                  badge: "Live Notifications"
                },
                {
                  title: "Digital E-Library",
                  desc: "Comprehensive repository of approved syllabus textbooks, digital notes, video tutorials, and past exam questions.",
                  icon: BookOpen,
                  color: "bg-amber-600 shadow-amber-200",
                  badge: "Curriculum Aligned"
                },
                {
                  title: "Automated Report Cards",
                  desc: "Instant generation of Broadsheets and termly report cards with automated grade calculation and principal remarks.",
                  icon: BarChart3,
                  color: "bg-purple-600 shadow-purple-200",
                  badge: "One-Click Export"
                },
                {
                  title: "Smart Attendance Tracking",
                  desc: "Clock-in and clock-out for teachers and students with automatic SMS/email absence notifications to parents.",
                  icon: Clock,
                  color: "bg-rose-600 shadow-rose-200",
                  badge: "Geofenced & Vetted"
                },
                {
                  title: "Instant Korapay Billing",
                  desc: "PCI-DSS certified online tuition fee collection, auto-receipt generation, and real-time financial tracking for school admins.",
                  icon: Lock,
                  color: "bg-indigo-600 shadow-indigo-200",
                  badge: "Military-Grade Security"
                }
              ].map((f, i) => (
                <Card key={i} className="border border-slate-200/80 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-3xl bg-white group overflow-hidden">
                  <CardContent className="p-8 sm:p-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${f.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        <f.icon size={30} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{f.title}</h3>
                    <p className="text-slate-600 text-base leading-relaxed font-medium">{f.desc}</p>
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
        <section id="faq" className="py-40 bg-slate-950 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
               <div className="text-center mb-24 space-y-6">
                  <h2 className="text-6xl md:text-7xl font-black tracking-tighter">Everything You <span className="text-amber-500">Need to Know</span></h2>
                  <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Support & Admissions FAQ</p>
               </div>
               <Accordion type="single" collapsible className="space-y-6">
                  {[
                    {
                      q: "What are the requirements for admission?",
                      a: "Applicants are required to create a parent portal account, submit past academic records, and sit for a placement assessment in Mathematics and English."
                    },
                    {
                      q: "How secure is the online payment system?",
                      a: "We partner with Korapay, a PCI-DSS certified gateway, to ensure all transactions are encrypted and secured using military-grade protection."
                    },
                    {
                      q: "Is the CBT system mobile-friendly?",
                      a: "Absolutely. Our CBT platform is fully responsive, allowing students to take mock exams and quizzes on any modern smartphone or tablet."
                    },
                    {
                      q: "Can I communicate directly with teachers?",
                      a: "Yes. The Parent Portal includes an integrated messaging hub for direct, real-time communication with your child's subject and class teachers."
                    }
                  ].map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border-none bg-white/5 rounded-[2rem] px-10 border border-white/5 overflow-hidden">
                      <AccordionTrigger className="text-2xl font-black text-white hover:no-underline hover:text-amber-500 transition-colors py-10">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-400 text-xl font-medium pb-10 leading-relaxed border-t border-white/5 pt-6">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
               </Accordion>
            </div>
          </div>
        </section>

        {/* Real-time Performance Metrics Bar */}
        <RealtimeStats />

        {/* Contact Section */}
        <section id="contact" className="py-40 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
               <div className="space-y-16">
                  <div className="space-y-8">
                    <div className="inline-block px-8 py-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-[0.3em]">Contact & Support</div>
                    <h2 className="text-6xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter">Get in Touch with Support</h2>
                    <p className="text-slate-500 text-2xl font-medium">Our help and support team is available 24/7 to assist you.</p>
                  </div>
                  <div className="space-y-12">
                     <div className="flex gap-8 items-start group">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-emerald-100">
                           <Phone size={32} />
                        </div>
                        <div>
                           <p className="font-black text-2xl text-slate-900 mb-2">WhatsApp Connect for Help and Support</p>
                           <a
                             href="https://wa.me/2348061908715"
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-emerald-600 hover:underline text-xl sm:text-2xl font-black"
                           >
                             (234)-80-EL LEARN OR EMAIL - elcoderssoftwares12@gmail.com
                           </a>
                        </div>
                     </div>
                  </div>
               </div>
               <ContactForm />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-48 bg-amber-600 overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            <h2 className="text-7xl md:text-9xl font-black text-white mb-16 tracking-tighter leading-[0.85]">Join The Future of <span className="text-slate-900">Education</span></h2>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-amber-600 hover:bg-amber-50 h-28 px-20 rounded-[3rem] font-black text-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter">
                Register Your Child Now
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[140px]" />
          <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[160px]" />
        </section>
      </main>

      <Footer />
    </div>
  )
}
