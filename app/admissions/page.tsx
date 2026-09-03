import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Footer } from '@/components/footer'
import { CheckCircle2, ArrowRight, GraduationCap, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react'

export default function AdmissionsPage() {
  const steps = [
    { title: "Online Registration", desc: "Create a parent account and fill out the initial interest form." },
    { title: "Placement Test", desc: "Your child will sit for an assessment in Math and English." },
    { title: "Interview", desc: "A brief session with the academic board for both parent and child." },
    { title: "Official Enrollment", desc: "Payment of fees and generation of admission number." }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-amber-600 p-2 rounded-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900 uppercase">EL LEARNERS App <span className="text-amber-600">ACADEMY</span></span>
          </Link>
          <Link href="/auth/signup/parent">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6 font-black shadow-lg shadow-amber-200">APPLY NOW</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-24 bg-white relative overflow-hidden text-center px-4">
           <div className="max-w-4xl mx-auto space-y-8 relative z-10">
              <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter">Admissions <span className="text-amber-600">Open</span></h1>
              <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                Join our 2026/2027 academic session. We are currently accepting applications for JSS1 through SSS3.
              </p>
           </div>
           <div className="absolute top-0 left-0 w-96 h-96 bg-amber-400/5 rounded-full blur-[100px]" />
        </section>

        <section className="py-32 container mx-auto px-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                 <h2 className="text-5xl font-black text-slate-900 tracking-tight">The Enrollment Process</h2>
                 <div className="space-y-8">
                    {steps.map((step, i) => (
                      <div key={i} className="flex gap-8 group">
                         <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 font-black text-2xl shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
                           {i + 1}
                         </div>
                         <div>
                            <h3 className="font-black text-2xl text-slate-900 mb-2">{step.title}</h3>
                            <p className="text-slate-500 text-lg font-medium leading-relaxed">{step.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              <Card className="bg-slate-900 text-white border-none rounded-[3rem] p-16 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={200} />
                 </div>
                 <div className="relative z-10 space-y-10 text-center">
                    <h2 className="text-4xl font-black">Ready to Start?</h2>
                    <p className="text-slate-400 text-xl font-medium">Create your parent portal account today to begin the application.</p>
                    <Link href="/auth/signup/parent" className="block">
                      <Button size="lg" className="w-full h-20 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-3xl text-xl shadow-2xl shadow-amber-900/50">
                        GET STARTED <ArrowRight className="ml-2" />
                      </Button>
                    </Link>
                    <div className="pt-10 border-t border-white/10 grid grid-cols-2 gap-8">
                       <div className="text-center">
                          <p className="font-black text-amber-500 text-3xl">Aug 15</p>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Deadline</p>
                       </div>
                       <div className="text-center">
                          <p className="font-black text-amber-500 text-3xl">Sept 2</p>
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Resumption</p>
                       </div>
                    </div>
                 </div>
              </Card>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
