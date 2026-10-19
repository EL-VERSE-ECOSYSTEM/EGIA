import Link from 'next/link'
import { ArrowLeft, ShieldCheck, CreditCard, RefreshCw, HelpCircle } from 'lucide-react'

export const metadata = {
  title: 'Refund & Cancellation Policy | EL LEARNERS',
  description: 'Official Refund, Fee Reconciliation and Cancellation Policy for EL LEARNERS platform services and Korapay payment network.',
}

export default function RefundPolicyPage() {
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
            <ShieldCheck className="w-4 h-4" />
            <span>EL VERSE ECOSYSTEM COMPLIANCE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Refund & Cancellation Policy
          </h1>
          <p className="text-sm text-slate-400 font-medium">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" /> 1. Overview & General Policy
            </h2>
            <p>
              EL LEARNERS ("we", "our", "us"), operated under the EL VERSE ECOSYSTEM, is committed to full financial transparency. Payments made on our platform—including school registration fees, student 4-month renewal subscriptions, tuition, CBT assessments, and teacher requests—are processed securely via the Korapay Payment Network.
            </p>
          </section>

          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-400" /> 2. Subscription & Registration Fees
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>
                <strong>Bi-Monthly School Registration Fees (NGN 30,161.25):</strong> Non-refundable once activated. In the event of a double transaction or billing discrepancy caused by network delays during Korapay checkout, duplicate payments will be fully reconciled and refunded to the original account upon verification.
              </li>
              <li>
                <strong>Student 4-Month Renewal Fees (NGN 2,161.25):</strong> Cover 120 days of platform access, CBT exams, games, and educational materials. Refund requests submitted within 48 hours of payment before system usage may be approved following manual review.
              </li>
              <li>
                <strong>Korapay Processing Gateway Fees (NGN 161.25):</strong> Non-refundable third-party transaction fees imposed by payment processors.
              </li>
            </ul>
          </section>

          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" /> 3. Dispute Resolution & How to Request a Refund
            </h2>
            <p>
              To initiate a payment dispute or request fee reconciliation:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300">
              <li>Navigate to your dashboard support or disputes tab (or email <strong>elversetechnologies@gmail.com</strong>).</li>
              <li>Provide your transaction reference ID, payment date, and registered account email address.</li>
              <li>Our financial audit team will verify the payment against Korapay transaction logs within 3 business days.</li>
            </ol>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-base">Corporate Office & Official Support</h3>
            <p className="text-xs text-slate-400">
              EL VERSE ECOSYSTEM Technologies Limited<br />
              Email: <a href="mailto:elversetechnologies@gmail.com" className="text-amber-400 hover:underline">elversetechnologies@gmail.com</a><br />
              Phone: +234-814-000-0000<br />
              Address: Plot 12, Innovation Hub Drive, Victoria Island, Lagos, Nigeria
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
