import {
  Crown,
  Building2,
  GraduationCap,
  Users,
  ShieldCheck,
} from 'lucide-react'

export type DemoRole = 'superadmin' | 'schooladmin' | 'primaryadmin' | 'viceprincipal' | 'hod' | 'teacher' | 'student' | 'parent'

export const DEMO_ROLES_DATA: Record<DemoRole, {
  title: string
  subtitle: string
  badge: string
  badgeColor: string
  iconName: string
  bannerImage: string
  summary: string
  stats: { label: string; value: string }[]
  keyFeatures: string[]
  workflows: { name: string; description: string; tag: string; step: string }[]
  loginLink: string
}> = {
  superadmin: {
    title: 'Super Admin Portal',
    subtitle: 'Global Platform Control & Multi-Tenant Oversight',
    badge: 'SUPER ADMIN CORE',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    iconName: 'Crown',
    bannerImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1000',
    summary: 'Central command for platform administrators to manage school tenants, approve registrations, verify document uploads, configure payment gateways, and monitor real-time global analytics.',
    stats: [
      { label: 'Active Schools', value: '100%' },
      { label: 'Realtime Sync', value: 'Instant' },
      { label: 'Gateway Fee', value: 'NGN 161.25' }
    ],
    keyFeatures: [
      'School Registration Verification & Proof of Address Audit',
      'Real-Time System Realtime Table Subscriptions & Audit Logs',
      'Global Payment Config & Paystack Gateway Ledger Audit',
      'AI-Powered Crawler Search & Sitemap Optimization (/llms.txt)'
    ],
    workflows: [
      { name: 'Approve School Registrations', description: 'Review proof of address documents, approve school accounts, and generate school registration codes.', tag: 'Onboarding', step: 'Step 1: Check document verification status, then click Approve School App.' },
      { name: 'Global Finance & Ledger', description: 'Track NGN 30,161.25 bi-monthly school renewal fees and Paystack gateway transactions.', tag: 'Finance', step: 'Step 2: Monitor real-time payment webhook logs and Paystack transactions.' },
      { name: 'Support Ticket Center', description: 'Receive direct WhatsApp and in-app support requests from school admins, teachers, and parents.', tag: 'Support', step: 'Step 3: Click One-Click Quick Reply or send custom responses in real-time.' }
    ],
    loginLink: '/auth/signin'
  },
  schooladmin: {
    title: 'School Admin Dashboard',
    subtitle: 'Comprehensive School Management & Operations',
    badge: 'SCHOOL ADMIN',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    iconName: 'Building2',
    bannerImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1000',
    summary: 'Empowers school principals and admins to manage student/staff rosters, automated fee structures with warning dates, teacher salary payment dates, broadsheets, and automatic timetable generation.',
    stats: [
      { label: 'Roster Capacity', value: 'Unlimited' },
      { label: 'Renewal Cycle', value: '60 Days' },
      { label: 'Auto Broadsheet', value: 'Enabled' }
    ],
    keyFeatures: [
      'Fee Structure Builder with Warning Date Parent Notifications',
      'Teacher Payroll & Salary Payment Date Disbursement Sync',
      'Automated Timetable Builder & Cross-School Conflict Checks',
      'Broadsheet Generation & Report Card Endorsement Workflows'
    ],
    workflows: [
      { name: 'Fee & Payment Management', description: 'Set termly fee items, review manual bank receipt uploads, and track Paystack payments.', tag: 'Finance', step: 'Step 1: Set fee warning dates to trigger parent warning banners.' },
      { name: 'Staff & Student Promotion', description: 'Promote students between classes (Primary 3 to SSS 3) and assign class teachers.', tag: 'Academics', step: 'Step 2: Select promotion criteria and run automated class promotions.' },
      { name: 'Bi-Monthly Renewal Lockout', description: 'View 60-day renewal status (NGN 30,161.25) with daily reminders 14 days prior to expiration.', tag: 'System', step: 'Step 3: Pay school renewal fee directly via Paystack.' }
    ],
    loginLink: '/auth/signin'
  },
  primaryadmin: {
    title: 'Primary Admin',
    subtitle: 'Principal and school owner',
    badge: 'SCHOOL LEADERSHIP',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    iconName: 'Building2',
    bannerImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1000',
    summary: 'The school owner manages one school, its leadership team, staff and families, academic operations, and school finances.',
    stats: [
      { label: 'School scope', value: 'Own school' },
      { label: 'Finance', value: 'Full access' },
      { label: 'Admin team', value: 'Manage' }
    ],
    keyFeatures: [
      'Manage school fees, payment reviews, and transaction history',
      'Add and manage Vice Principals, HODs, teachers, and other staff',
      'Register students, manage parent records, and oversee school operations',
      'Set student game and messaging hours and approve CBT assessments'
    ],
    workflows: [
      { name: 'School leadership', description: 'Add school administrators and assign their responsibilities.', tag: 'People', step: 'Administration remains scoped to this school.' },
      { name: 'School finances', description: 'Review fee schedules, payment activity, and transaction history.', tag: 'Finance', step: 'Only the Primary Admin manages school finances.' },
      { name: 'Academic operations', description: 'Approve CBT assessments, manage complaints, and coordinate staff.', tag: 'Academics', step: 'School changes are recorded and visible to authorized staff.' }
    ],
    loginLink: '/auth/signin'
  },
  viceprincipal: {
    title: 'Vice Principal',
    subtitle: 'School-wide academic and operational leadership',
    badge: 'SCHOOL LEADERSHIP',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    iconName: 'Building2',
    bannerImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000',
    summary: 'The Vice Principal manages academic and school operations for their school while financial records and transactions remain restricted to the Primary Admin.',
    stats: [
      { label: 'School scope', value: 'Own school' },
      { label: 'Finance', value: 'Restricted' },
      { label: 'Academics', value: 'Manage' }
    ],
    keyFeatures: [
      'Register students and coordinate school parents and staff',
      'Manage school schedules, learning controls, and communications',
      'Approve CBT assessments and exams and manage school complaints',
      'No access to fee payments, finance reports, or transaction history'
    ],
    workflows: [
      { name: 'Academic approvals', description: 'Review CBT assessments and examinations before release.', tag: 'Academics', step: 'Approval activity is scoped to the current school.' },
      { name: 'School operations', description: 'Coordinate students, families, staff, messages, and learning hours.', tag: 'Operations', step: 'School-wide actions remain within the assigned school.' },
      { name: 'Financial boundaries', description: 'Finance pages and transaction history are unavailable.', tag: 'Access', step: 'Financial authority stays with the Primary Admin.' }
    ],
    loginLink: '/auth/signin'
  },
  hod: {
    title: 'Head of Department',
    subtitle: 'Department leadership for Science, Arts, or Commercial',
    badge: 'DEPARTMENT LEADERSHIP',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    iconName: 'GraduationCap',
    bannerImage: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1000',
    summary: 'The HOD oversees teaching and academic activity within their assigned department. Finance, student discipline, and teacher promotion remain outside this role.',
    stats: [
      { label: 'Department', value: 'Assigned' },
      { label: 'Finance', value: 'Restricted' },
      { label: 'CBT approval', value: 'Department' }
    ],
    keyFeatures: [
      'Manage teachers and academic work in the assigned department',
      'Register students and coordinate parent and staff records for the school',
      'Review and approve department CBT assessments and exams',
      'No finance, transaction history, suspensions, expulsions, or teacher promotion'
    ],
    workflows: [
      { name: 'Department oversight', description: 'Review teaching activity and support teachers in the assigned department.', tag: 'Department', step: 'Science, Arts, and Commercial access is separated.' },
      { name: 'CBT review', description: 'Review department assessments and exams before approval.', tag: 'Academics', step: 'Approval is limited to the assigned department.' },
      { name: 'Restricted actions', description: 'Financial, disciplinary, and teacher promotion actions are unavailable.', tag: 'Access', step: 'Escalate those cases to the Principal or Vice Principal.' }
    ],
    loginLink: '/auth/signin'
  },
  teacher: {
    title: 'Teacher Workstation',
    subtitle: 'CBT Proctoring, Lesson Notes & Class Management',
    badge: 'TEACHER PORTAL',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    iconName: 'GraduationCap',
    bannerImage: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1000',
    summary: 'All-in-one hub for teachers to set timed CBT assessments, proctor exams with webcam/audio streams, upload digital lesson notes, mark daily attendance, and request airtime/data coupons.',
    stats: [
      { label: 'Proctor Streams', value: 'Dual A/V' },
      { label: 'Airtime Dispatch', value: 'Instant' },
      { label: 'Class Scope', value: 'Assigned' }
    ],
    keyFeatures: [
      'Timed CBT Assessment Creator with Audio/Video Proctoring',
      'Digital Lesson Notes Creator & Shared Library Templates',
      'Daily Attendance Marking & Automatic Disciplinary Tracking',
      'Airtime & Data Request Dispatches via DirectCoupon API'
    ],
    workflows: [
      { name: 'CBT Exam Proctoring', description: 'Monitor live CBT sessions, record student warnings, and review proctoring logs.', tag: 'Assessments', step: 'Step 1: Open Proctor Control to view live student feeds and log warnings.' },
      { name: 'Online Exam Prep Content', description: 'Upload SSS2/SSS3 WAEC, NECO & JAMB practice questions and video lessons.', tag: 'Exam Prep', step: 'Step 2: Select SSS2/SSS3 subject and upload questions or video URLs.' },
      { name: 'Report Card Grading', description: 'Enter subject marks, provide teacher remarks, and submit for admin endorsement.', tag: 'Grading', step: 'Step 3: Fill student scores and submit report card draft.' }
    ],
    loginLink: '/auth/signin'
  },
  student: {
    title: 'Student Experience',
    subtitle: 'CBT Assessments, Online Prep & Educational Games',
    badge: 'STUDENT PORTAL',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    iconName: 'Users',
    bannerImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000',
    summary: 'Engaging learning experience featuring timed CBT examinations, 3-week SSS2/SSS3 Online Exam Prep subscriptions, interactive Friday Inter-School League games (Chess, Scrabble, Monopoly), and reward badges.',
    stats: [
      { label: 'Prep Validity', value: '21 Days' },
      { label: 'League Games', value: 'Bi-Weekly' },
      { label: 'Subscription', value: 'NGN 3,161.25' }
    ],
    keyFeatures: [
      'Timed CBT Exam Room with Proctoring Guard & Instant Results',
      'SSS2/SSS3 WAEC/NECO/JAMB Prep with Access Code Subscriptions',
      'Bi-Weekly Friday Inter-School Games League & Grandmaster Validation',
      'Interactive E-Library, Video Lessons & Student Badges'
    ],
    workflows: [
      { name: 'Take CBT Assessments', description: 'Enter CBT access code, complete timed questions, and view score breakdown.', tag: 'Exams', step: 'Step 1: Enter exam access code, enable camera/mic, and start test.' },
      { name: 'Subscribe to Exam Prep', description: 'Access 3-week NGN 3,161.25 subscription for WAEC/NECO/JAMB prep lessons.', tag: 'Learning', step: 'Step 2: Complete NGN 3,161.25 Paystack payment to generate access code.' },
      { name: 'Play Educational Games', description: 'Participate in class-based difficulty league matches and earn reward gifts.', tag: 'Gamification', step: 'Step 3: Join Friday League matchmaking and submit verified moves.' }
    ],
    loginLink: '/auth/signin'
  },
  parent: {
    title: 'Parent Portal',
    subtitle: 'Live Child Monitoring & Seamless Online Payments',
    badge: 'PARENT PORTAL',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    iconName: 'ShieldCheck',
    bannerImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000',
    summary: 'Enables parents to track linked children (wards), pay tuition fees securely via Paystack or manual bank receipt uploads, view live attendance and CBT results, and enroll in Adult Education programs.',
    stats: [
      { label: 'Linked Wards', value: 'Multi-Child' },
      { label: 'Adult Night Ed', value: 'Weekly' },
      { label: 'Fee Gateway', value: 'Paystack' }
    ],
    keyFeatures: [
      'Multi-Child Ward Linking & Real-Time Performance Analytics',
      'Instant Fee Payment via Paystack Gateway (NGN 161.25 fee breakdown)',
      'Live Attendance & Disciplinary Push Notifications',
      'Adult Education Night & Evening Class Enrollment'
    ],
    workflows: [
      { name: 'Pay School Fees', description: 'View active fee structure items with warning dates and complete Paystack checkout.', tag: 'Payments', step: 'Step 1: Select child, review fee breakdown, and complete Paystack checkout.' },
      { name: 'View Child Report Cards', description: 'Download endorsed termly report cards and teacher feedback.', tag: 'Academic', step: 'Step 2: Access endorsed report cards and download PDF copy.' },
      { name: 'Direct Staff Messaging', description: 'Chat directly with class teachers and principal regarding child progress.', tag: 'Communication', step: 'Step 3: Send real-time chat messages to class teachers.' }
    ],
    loginLink: '/auth/signin'
  }
}
