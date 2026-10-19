import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, ShieldCheck, ArrowLeft, Lock } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | EL LEARNERS APP',
  description: 'Privacy Policy and Data Protection Policy for EL LEARNERS APP multi-tenant school management software and student portal.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-8 py-12 relative overflow-hidden font-sans">
      <div className="max-w-4xl w-full space-y-8 relative z-10">
        {/* Navigation back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <Lock className="w-4 h-4" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 max-w-xl mx-auto">
            Effective Date: January 1, 2026 • Last Updated: March 2026
          </p>
        </div>

        {/* Content Card */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden text-slate-300">
          <CardContent className="p-6 sm:p-12 space-y-6 text-sm leading-relaxed font-medium">
            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> 1. Information We Collect
              </h2>
              <p>
                To deliver smart school administration, CBT examinations, report card generation, and parent monitoring, EL LEARNERS APP collects:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-400">
                <li><strong>Identity Data:</strong> First name, middle name, last name, date of birth, gender, passport photograph, and role profiles.</li>
                <li><strong>Contact Data:</strong> Email address, phone number, and physical school location address. Note: Applicant contact details provided during school registration are treated as unverified contact fields and not used as primary identity proof.</li>
                <li><strong>Academic & Assessment Data:</strong> Admission numbers, staff codes, subject enrollments, CBT exam responses, automated test scores, and attendance records.</li>
                <li><strong>Proctoring Telemetry:</strong> Live webcam snapshots and tab-switch alert logs during active CBT examinations (for academic anti-cheating verification).</li>
                <li><strong>Institutional Documents:</strong> Proof of school address (electricity bills, operating licenses) uploaded for Super-Admin verification.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> 2. How We Use Information
              </h2>
              <p>
                Collected data is processed strictly for legitimate educational and administrative purposes:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-400">
                <li>Provisioning multi-role accounts (Super Admin, School Admin, Teacher, Student, Parent).</li>
                <li>Executing real-time CBT examinations, automated grade calculation, and report card compilation.</li>
                <li>Enabling parent-teacher communication, attendance alerts, and fee invoice payments via Korapay.</li>
                <li>Ensuring institutional document verification and manual Super-Admin approval prior to granting admin roles.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> 3. Data Protection & Tenant Isolation
              </h2>
              <p>
                We enforce strict security controls:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-400">
                <li><strong>Tenant Scope Enforcement:</strong> All database queries and server actions strictly filter by immutable `schoolId` to guarantee 100% cross-tenant data isolation.</li>
                <li><strong>Constant-Time Security:</strong> Webhooks and API secret tokens are verified using `crypto.timingSafeEqual` to prevent timing attacks.</li>
                <li><strong>Storage Protection:</strong> Institutional verification documents are stored securely in protected storage buckets accessible only to verified school admins and super admins.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> 4. Third-Party Services
              </h2>
              <p>
                We partner with trusted service providers strictly necessary for platform operation:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-400">
                <li><strong>Supabase:</strong> Encrypted PostgreSQL database, authentication, and real-time engine.</li>
                <li><strong>Korapay:</strong> PCI-DSS compliant payment gateway processing school fee and registration payments.</li>
                <li><strong>Vercel Analytics:</strong> Privacy-preserving website usage analytics.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> 5. Data Rights & Contact
              </h2>
              <p>
                Users and institutional administrators have the right to inspect, update, or request deletion of their records subject to institutional compliance retention requirements. You can submit a data erasure request anytime at <Link href="/data-deletion" className="text-emerald-400 font-bold hover:underline">Data Deletion Request</Link>. For data privacy inquiries, contact our Privacy Officer at <a href="mailto:elversetechnologies@gmail.com" className="text-emerald-400 underline">elversetechnologies@gmail.com</a> or phone +234-814-000-0000.
              </p>
              <div className="pt-2 text-xs flex flex-wrap gap-4 text-slate-400 font-semibold border-t border-slate-800">
                <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
                <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
                <Link href="/data-deletion" className="hover:text-white transition-colors">Data Deletion</Link>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs font-bold text-slate-500">
          <p>© 2026 EL LEARNERS APP • Privacy & Data Protection Policy</p>
        </div>
      </div>
    </div>
  )
}
