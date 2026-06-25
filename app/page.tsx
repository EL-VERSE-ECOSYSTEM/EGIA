import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import {
  CheckCircle2,
  Users,
  BookOpen,
  ShieldCheck,
  Monitor,
  Trophy,
  ArrowRight,
  GraduationCap
} from 'lucide-react'

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
            <span className="font-black text-xl tracking-tight text-slate-900">EL GOODNEWS <span className="text-amber-600">ACADEMY</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">About</Link>
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">Features</Link>
            <Link href="#portals" className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">Portals</Link>
            {user ? (
              <Link href="/dashboard-redirect">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6">Dashboard</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-slate-600 font-bold">Sign In</Button>
                </Link>
                <Link href="/auth/signup/parent">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6">Join Us</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold mb-8 animate-bounce">
                <Trophy className="w-4 h-4" /> Leading the way in academic excellence
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
                Empowering <span className="text-amber-600">Excellence</span> in Every Student
              </h1>
              <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto">
                EL GOODNEWS INT'L ACADEMY provides a world-class learning environment,
                blending traditional values with cutting-edge technology for the 21st-century learner.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/signup/parent">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white h-16 px-10 rounded-2xl font-black text-lg shadow-xl shadow-amber-200 group">
                    Join Our Academy <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/admissions">
                  <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl font-bold border-2 text-slate-700">
                    Explore Admissions
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </section>

        {/* Stats Bar */}
        <section className="py-12 bg-slate-900 text-white relative z-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl font-black text-amber-500">15+</div>
                <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">Years Experience</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-black text-amber-500">50+</div>
                <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">Certified Teachers</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-black text-amber-500">1000+</div>
                <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">Success Stories</div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us */}
        <section id="about" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-2xl">
                   <div className="w-full h-full flex items-center justify-center text-slate-300">
                     <Users size={120} />
                   </div>
                </div>
                <div className="absolute -bottom-8 -right-8 bg-amber-600 text-white p-8 rounded-3xl shadow-xl max-w-xs hidden md:block">
                  <p className="font-bold italic">"We nurture the total child for a brighter future."</p>
                </div>
              </div>
              <div className="space-y-8">
                <div className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider">Our Foundation</div>
                <h2 className="text-4xl font-black text-slate-900 leading-tight">Committed to Integrity and Academic Rigor</h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Founded on the principles of discipline and excellence, EL GOODNEWS INT'L ACADEMY has consistently
                  produced leaders who excel in various fields. Our mission is to provide an inclusive learning
                  environment that fosters intellectual curiosity and moral uprightness.
                </p>
                <ul className="space-y-4">
                  {[
                    "Standardized Curriculum",
                    "Moral & Value-based Education",
                    "Global Competency Focus",
                    "Conducive Learning Environment"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 font-bold text-slate-700">
                      <CheckCircle2 className="text-amber-600" size={20} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-[#F8FAFC]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-black text-slate-900">Modern School Management</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                We leverage technology to simplify school operations and enhance the learning experience.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "CBT System",
                  desc: "Advanced Computer-Based Testing for objective and instant evaluation.",
                  icon: Monitor,
                  color: "bg-blue-50 text-blue-600"
                },
                {
                  title: "Digital Library",
                  desc: "Access to thousands of e-books and research materials anytime.",
                  icon: BookOpen,
                  color: "bg-amber-50 text-amber-600"
                },
                {
                  title: "Expert Tutors",
                  desc: "Guided by highly qualified educators committed to student success.",
                  icon: GraduationCap,
                  color: "bg-purple-50 text-purple-600"
                },
                {
                  title: "Child Monitoring",
                  desc: "Real-time updates for parents on student performance and attendance.",
                  icon: ShieldCheck,
                  color: "bg-emerald-50 text-emerald-600"
                }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all group">
                  <CardContent className="p-8 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform`}>
                      <feature.icon size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Role Portals */}
        <section id="portals" className="py-24 bg-white border-y">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-emerald-50 p-10 rounded-3xl border border-emerald-100 flex flex-col justify-between group hover:bg-emerald-600 transition-colors duration-500">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <Users size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-white transition-colors">Parent Portal</h3>
                  <p className="text-slate-600 group-hover:text-emerald-50 transition-colors">
                    Register and link your children to monitor their performance, pay fees, and communicate with teachers.
                  </p>
                </div>
                <Link href="/auth/signup/parent" className="mt-8">
                  <Button variant="ghost" className="p-0 text-emerald-600 font-black flex items-center group-hover:text-white transition-colors">
                    GET STARTED <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="bg-purple-50 p-10 rounded-3xl border border-purple-100 flex flex-col justify-between group hover:bg-purple-600 transition-colors duration-500">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                    <GraduationCap size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-white transition-colors">Teacher Join</h3>
                  <p className="text-slate-600 group-hover:text-purple-50 transition-colors">
                    Join our team of dedicated educators. Use your staff code to register and manage your classes.
                  </p>
                </div>
                <Link href="/auth/signup/teacher" className="mt-8">
                  <Button variant="ghost" className="p-0 text-purple-600 font-black flex items-center group-hover:text-white transition-colors">
                    JOIN STAFF <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="bg-orange-50 p-10 rounded-3xl border border-orange-100 flex flex-col justify-between group hover:bg-orange-600 transition-colors duration-500">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                    <Monitor size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-white transition-colors">Student Portal</h3>
                  <p className="text-slate-600 group-hover:text-orange-50 transition-colors">
                    Activate your student account with your admission number to take CBT exams and access materials.
                  </p>
                </div>
                <Link href="/auth/signup/student" className="mt-8">
                  <Button variant="ghost" className="p-0 text-orange-600 font-black flex items-center group-hover:text-white transition-colors">
                    ACCESS PORTAL <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-amber-600 overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Ready to secure a bright future?</h2>
            <p className="text-amber-50 text-xl mb-12 max-w-2xl mx-auto">
              Admissions are currently open for the 2024/2025 academic session.
              Be part of EL GOODNEWS ACADEMY family today.
            </p>
            <Link href="/auth/signup/parent">
              <Button size="lg" className="bg-white text-amber-600 hover:bg-amber-50 h-16 px-12 rounded-2xl font-black text-lg shadow-2xl">
                Register Your Child Now
              </Button>
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        </section>
      </main>

      <Footer />
    </div>
  )
}
