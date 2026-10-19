import Link from 'next/link'
import { ArrowLeft, Cookie, Shield, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Cookie Policy | EL LEARNERS',
  description: 'Official Cookie Usage and Data Preference Policy for EL LEARNERS platform services.',
}

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="space-y-4 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <Cookie className="w-4 h-4" />
            <span>COOKIE PRIVACY & PREFERENCES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Cookie Policy
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" /> 1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently, secure user sessions, and provide analytics data to site operators.
            </p>
          </section>

          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-400" /> 2. Cookies We Use
            </h2>
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <h3 className="font-bold text-white text-sm">Essential & Authentication Cookies</h3>
                <p className="text-slate-400">
                  Required for user authentication, session security, Supabase Auth tokens, and real-time dashboard subscriptions. These cannot be disabled.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <h3 className="font-bold text-white text-sm">Performance & Analytics Cookies</h3>
                <p className="text-slate-400">
                  Help us measure system latency, dashboard load times, and error rates to optimize real-time performance.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <h3 className="font-bold text-white text-sm">Functional Preferences</h3>
                <p className="text-slate-400">
                  Store dark mode preferences, daily warning dismissals, and FCM push notification permissions.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-base">Managing Cookie Preferences</h3>
            <p className="text-xs text-slate-400">
              You can adjust or revoke your cookie choices at any time using our Cookie Consent Banner or browser settings. Contact <a href="mailto:elversetechnologies@gmail.com" className="text-amber-400 hover:underline">elversetechnologies@gmail.com</a> for data privacy inquiries.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
