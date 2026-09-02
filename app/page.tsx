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
  Phone
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 p-2 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900 uppercase">EL LEARNERS <span className="text-amber-600">ACADEMY</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors">About</Link>
            <Link href="#features" className="text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors">Features</Link>
            <Link href="#testimonials" className="text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors">Success</Link>
            <Link href="#faq" className="text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors">FAQ</Link>
            {user ? (
              <Link href="/dashboard-redirect">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 font-black shadow-lg">DASHBOARD</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
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
        <section className="relative pt-24 pb-32 overflow-hidden bg-white">
          <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-black mb-10 tracking-widest uppercase">
              <Trophy className="w-4 h-4" /> Academic Excellence in Nigeria
            </div>
            <h1 className="text-6xl md:text-9xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tighter">
              Inspiring <span className="text-amber-600">Greatness</span> In Every Student
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 mb-14 leading-relaxed max-w-3xl mx-auto font-medium">
              EL LEARNERS is where traditional values meet 21st-century innovation.
              Join a community committed to nurturing the total child.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white h-20 px-14 rounded-[2rem] font-black text-xl shadow-2xl shadow-amber-200 group transition-all hover:scale-105">
                  START REGISTRATION <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white h-20 px-14 rounded-[2rem] font-black text-xl shadow-2xl shadow-slate-200 transition-all hover:scale-105">
                  PORTAL LOGIN
                </Button>
              </Link>
              <Link href="/admissions">
                <Button variant="outline" size="lg" className="h-20 px-14 rounded-[2rem] font-black text-xl border-4 text-slate-800 border-slate-100 hover:bg-slate-50 transition-all hover:scale-105">
                  ADMISSIONS
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-amber-400/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[140px] translate-x-1/3 translate-y-1/3" />
        </section>

        {/* Stats Bar */}
        <section className="py-24 bg-slate-950 text-white relative z-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
              <div className="space-y-4">
                <div className="text-7xl font-black text-amber-500 tracking-tighter">4+</div>
                <div className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Years of History</div>
              </div>
              <div className="space-y-4">
                <div className="text-7xl font-black text-amber-500 tracking-tighter">A few</div>
                <div className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Ph.D Educators</div>
              </div>
              <div className="space-y-4">
                <div className="text-7xl font-black text-amber-500 tracking-tighter">100%</div>
                <div className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Exam Pass Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us */}
        <section id="about" className="py-40 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
              <div className="relative group">
                <div className="aspect-[3/4] bg-slate-100 rounded-[4rem] overflow-hidden shadow-2xl relative border-[16px] border-slate-50">
                   <img
                     src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200"
                     alt="EL LEARNERS Academy Classroom"
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-40" />
                </div>
                <div className="absolute -bottom-16 -right-16 bg-amber-600 text-white p-14 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(217,119,6,0.3)] max-w-sm hidden lg:block border-[12px] border-white">
                  <p className="font-black text-3xl italic leading-[1.2]">"We nurture the total child for a brighter global future."</p>
                </div>
              </div>
              <div className="space-y-12">
                <div className="inline-block px-8 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-[0.3em]">Our Heritage</div>
                <h2 className="text-6xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter">Committed to Academic Rigor</h2>
                <p className="text-slate-500 text-2xl leading-relaxed font-medium">
                  At EL LEARNERS, we don't just teach; we inspire. Our curriculum is designed to challenge students
                  intellectually while grounding them in moral discipline.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {[
                    "Global Standard",
                    "Moral Leadership",
                    "Tech-First Lab",
                    "Secure Campus"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-5">
                      <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-200">
                        <CheckCircle2 className="text-white" size={24} />
                      </div>
                      <span className="font-black text-slate-800 text-xl tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="h-16 px-10 rounded-2xl font-black text-slate-900 border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all">LEARN OUR HISTORY</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-40 bg-[#F8FAFC]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-32 space-y-6">
               <div className="inline-block px-8 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.4em]">Technology</div>
              <h2 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter">Advanced Infrastructure</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                {
                  title: "CBT Portal",
                  desc: "Digital examination system with anti-cheat and instant analytics.",
                  icon: Monitor,
                  color: "bg-blue-600"
                },
                {
                  title: "E-Library",
                  desc: "Global access to academic journals and digital textbooks.",
                  icon: BookOpen,
                  color: "bg-amber-600"
                },
                {
                  title: "Verified Staff",
                  desc: "All educators are internationally certified and vetted.",
                  icon: GraduationCap,
                  color: "bg-purple-600"
                },
                {
                  title: "Parent Sync",
                  desc: "Real-time performance tracking and fee management.",
                  icon: ShieldCheck,
                  color: "bg-emerald-600"
                }
              ].map((f, i) => (
                <Card key={i} className="border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:-translate-y-4 transition-all duration-700 rounded-[3rem] bg-white group">
                  <CardContent className="p-14 space-y-8">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${f.color} text-white shadow-2xl shadow-${f.color.split('-')[1]}-200 group-hover:scale-110 transition-transform duration-700`}>
                      <f.icon size={36} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{f.title}</h3>
                    <p className="text-slate-500 text-lg leading-relaxed font-medium">{f.desc}</p>
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

        {/* Contact Section */}
        <section id="contact" className="py-40 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
               <div className="space-y-16">
                  <div className="space-y-8">
                    <div className="inline-block px-8 py-2 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-[0.3em]">Contact Us</div>
                    <h2 className="text-6xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter">Get in Touch with Admissions</h2>
                    <p className="text-slate-500 text-2xl font-medium">Our team is available 24/7 to guide you through the enrollment process.</p>
                  </div>
                  <div className="space-y-12">
                     <div className="flex gap-8 items-start group">
                        <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-amber-100">
                           <MapPin size={32} />
                        </div>
                        <div>
                           <p className="font-black text-2xl text-slate-900 mb-2">Campus Location</p>
                           <p className="text-slate-500 text-xl font-medium">NO 20, Dr Emmanuella Ville, Orita Ara, Ogun State, Nigeria</p>
                        </div>
                     </div>
                     <div className="flex gap-8 items-start group">
                        <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-xl shadow-blue-100">
                           <Phone size={32} />
                        </div>
                        <div>
                           <p className="font-black text-2xl text-slate-900 mb-2">Direct Hotline</p>
                           <p className="text-slate-500 text-xl font-medium">+2348108854279</p>
                        </div>
                     </div>
                  </div>
               </div>
               <Card className="bg-slate-50 border-none rounded-[4rem] p-16 shadow-2xl shadow-slate-100">
                  <form className="space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">First Name</label>
                           <Input placeholder="Enter first name" className="h-16 rounded-[1.5rem] bg-white border-none shadow-sm px-8 font-black text-lg focus:ring-8 focus:ring-amber-600/10 transition-all placeholder:text-slate-300" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Last Name</label>
                           <Input placeholder="Enter last name" className="h-16 rounded-[1.5rem] bg-white border-none shadow-sm px-8 font-black text-lg focus:ring-8 focus:ring-amber-600/10 transition-all placeholder:text-slate-300" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Email Address</label>
                        <Input type="email" placeholder="email@example.com" className="h-16 rounded-[1.5rem] bg-white border-none shadow-sm px-8 font-black text-lg focus:ring-8 focus:ring-amber-600/10 transition-all placeholder:text-slate-300" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Message</label>
                        <Textarea placeholder="How can we help you?" rows={5} className="rounded-[2rem] bg-white border-none shadow-sm px-8 py-8 font-black text-lg focus:ring-8 focus:ring-amber-600/10 transition-all placeholder:text-slate-300" />
                     </div>
                     <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-20 rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-slate-200 uppercase tracking-[0.2em]">
                        Send Message
                     </Button>
                  </form>
               </Card>
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
