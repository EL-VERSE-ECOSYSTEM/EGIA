import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { GraduationCap, ShieldCheck, ArrowLeft, FileText } from 'lucide-react'

export const metadata = {
  title: 'Terms & Conditions | EL LEARNERS APP',
  description: 'Terms of Service and Platform Terms & Conditions for EL LEARNERS APP multi-tenant school management software and CBT portal.',
}

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">Terms & Conditions</h1>
          <p className="text-xs sm:text-sm font-bold text-slate-400 max-w-xl mx-auto">
            Effective Date: January 1, 2026 • Last Updated: March 2026
          </p>
        </div>

        {/* Content Card */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden text-slate-300">
          <CardContent className="p-6 sm:p-12 space-y-6 text-sm leading-relaxed font-medium">
            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> 1. Acceptance of Terms
              </h2>
              <p>
                By accessing, registering for, or using EL LEARNERS APP ("Platform"), institutional administrators, teachers, parents, guardians, and students agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must refrain from using the Platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> 2. Institutional Registration & Account Approval
              </h2>
              <p>
                Institutional School Registration creates a pending onboarding application. Active administrator access is granted only upon:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-slate-400">
                <li>Successful subscription fee payment via Korapay checkout gateway.</li>
                <li>Upload and manual Super-Admin verification of valid proof of school address (e.g., recent electricity bill or government operating license).</li>
                <li>Formal review and approval by platform Super Administrators.</li>
              </ul>
              <p>
                Unverified or rejected applications shall not receive access to institutional management features.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> 3. Account Responsibilities & Security
              </h2>
              <p>
                Users are solely responsible for maintaining the confidentiality of their credentials (email addresses, staff codes, admission numbers, and passwords). Any activities occurring under a user account remain the user's responsibility. Password strength requirements (minimum 8 characters) must be adhered to at registration.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> 4. Computer-Based Testing (CBT) & Academic Conduct
              </h2>
              <p>
                Students participating in CBT examinations agree to uphold strict academic integrity. The Platform employs automated webcam proctoring, tab-switch monitoring, and cheating telemetry. Violations may result in test invalidation by course instructors or administrators.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> 5. Intellectual Property & Multi-Tenant Data Isolation
              </h2>
              <p>
                All software source code, interface designs, logos, and features remain the intellectual property of ELCODERS. Each institution retains full ownership of its proprietary student, grade, and administrative records, strictly isolated via multi-tenant school scope (`schoolId`).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> 6. Amendments & Contact Information
              </h2>
              <p>
                EL LEARNERS APP reserves the right to modify these terms at any time. Continued use of the Platform signifies acceptance of updated terms. For inquiries regarding these terms, contact support at <a href="mailto:elcoderssoftwares12@gmail.com" className="text-blue-400 underline">elcoderssoftwares12@gmail.com</a>.
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs font-bold text-slate-500">
          <p>© 2026 EL LEARNERS APP • Institutional Terms & Conditions</p>
        </div>
      </div>
    </div>
  )
}
