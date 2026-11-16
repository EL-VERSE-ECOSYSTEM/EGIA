import nodemailer from "nodemailer";

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function emailShell(title: string, content: string, footer = 'EL Learners App · Official Notification') {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(title)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 12px"><tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #dbe3ee;border-radius:14px;overflow:hidden">
      <tr><td style="background:#102b4e;padding:22px 30px;color:#fff"><div style="font-size:20px;font-weight:700;letter-spacing:.2px">EL Learners</div><div style="font-size:12px;color:#cbd8e8;margin-top:4px">Empowering Academic Excellence</div></td></tr>
      <tr><td style="padding:30px">${content}</td></tr>
      <tr><td style="padding:17px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.5">${escapeHtml(footer)}<br>For assistance, contact your school administrator.</td></tr>
    </table><div style="color:#94a3b8;font-size:10px;padding:14px">This is an official account notification from EL Learners.</div>
  </td></tr></table></body></html>`
}

export function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Missing required email environment variables: GMAIL_USER and GMAIL_APP_PASSWORD must be set.");
  }

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });

  return cachedTransporter;
}

export async function sendOtpEmail(to: string, otp: string) {
  const user = process.env.GMAIL_USER;
  if (!user) {
    throw new Error("Missing required email environment variable: GMAIL_USER must be set.");
  }
  const html = emailShell('Email verification code', `<h1 style="font-size:22px;line-height:1.3;margin:0 0 14px;color:#102b4e">Verify your email address</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 18px;color:#334155">Use this one-time verification code to continue:</p>
    <div style="font-size:34px;font-weight:700;letter-spacing:9px;color:#102b4e;text-align:center;padding:17px;background:#eff6ff;border:1px solid #dbeafe;border-radius:8px;margin:0 0 18px">${escapeHtml(otp)}</div>
    <p style="font-size:13px;line-height:1.6;color:#475569;margin:0">This code expires in <strong>10 minutes</strong>. If you did not request it, you can safely ignore this message.</p>`);

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"EL Learners" <${user}>`,
    to,
    subject: `Your EL Learners code: ${otp}`,
    text: `Your EL Learners verification code is ${otp}. Expires in 10 minutes.`,
    html,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

function getPublicSiteUrl() {
  return (process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://goodnews-app-mu.vercel.app').replace(/\/$/, '')
}

function absoluteImageUrl(url: string | null | undefined, fallback: string) {
  const baseUrl = getPublicSiteUrl()
  try {
    const resolved = new URL(url || fallback, `${baseUrl}/`)
    if (resolved.protocol !== 'https:' && resolved.protocol !== 'http:') throw new Error('Unsupported logo URL protocol.')
    return resolved.toString()
  } catch {
    return new URL(fallback, `${baseUrl}/`).toString()
  }
}

export async function sendSchoolAccountEmail(params: {
  to: string
  name: string
  role: string
  schoolName: string
  schoolLogoUrl?: string | null
  accountIdentifier?: string | null
  temporaryPassword?: string
  approved?: boolean
}) {
  const sender = process.env.GMAIL_USER
  if (!sender) throw new Error('Missing required email environment variable: GMAIL_USER must be set.')

  const name = escapeHtml(params.name)
  const schoolName = escapeHtml(params.schoolName)
  const role = escapeHtml(params.role)
  const baseUrl = getPublicSiteUrl()
  const schoolLogo = absoluteImageUrl(params.schoolLogoUrl, '/logo.svg')
  const appLogo = absoluteImageUrl('/app-logo.png', '/logo.svg')
  const signInUrl = `${baseUrl}/sign-in`
  const credentialBlock = params.temporaryPassword
    ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px;margin:20px 0">
        <p style="margin:0 0 8px;color:#1e3a8a;font-size:13px;font-weight:700">Temporary password</p>
        <p style="margin:0;color:#0f172a;font-family:monospace;font-size:20px;font-weight:800;letter-spacing:1px">${escapeHtml(params.temporaryPassword)}</p>
        <p style="margin:10px 0 0;color:#475569;font-size:12px">You must choose a new password the first time you sign in.</p>
      </div>`
    : ''
  const identifier = params.accountIdentifier
    ? `<p style="margin:12px 0;color:#334155"><strong>Account ID:</strong> ${escapeHtml(params.accountIdentifier)}</p>`
    : ''
  const intro = params.approved
    ? `Your school registration for <strong>${schoolName}</strong> has been approved.`
    : `Your <strong>${role}</strong> account at <strong>${schoolName}</strong> is ready.`
  const html = emailShell(params.approved ? 'School registration approved' : 'Account details', `<div style="text-align:center;padding-bottom:20px;border-bottom:1px solid #e2e8f0;margin-bottom:22px">
      <img src="${schoolLogo}" alt="${schoolName} logo" width="64" height="64" style="object-fit:contain;vertical-align:middle;margin:0 10px">
      <img src="${appLogo}" alt="EL Learners App logo" width="128" style="object-fit:contain;vertical-align:middle;margin:0 10px">
    </div>
      <h1 style="font-size:22px;margin:0 0 14px;color:#0b2545">${params.approved ? 'School Registration Approved' : 'Your EL Learners Account'}</h1>
      <p style="font-size:15px;line-height:1.6">Hello ${name},</p>
      <p style="font-size:15px;line-height:1.6">${intro}</p>
      ${identifier}
      ${credentialBlock}
      <p style="margin:22px 0"><a href="${escapeHtml(signInUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700">Sign in to EL Learners</a></p>
      <p style="font-size:12px;line-height:1.6;color:#64748b">If you did not expect this message, contact your school administrator. Never share your password or verification codes.</p>
    `, `EL Learners App · ${schoolName}`)

  await getTransporter().sendMail({
    from: `"EL Learners App" <${sender}>`,
    to: params.to,
    subject: params.approved ? `${params.schoolName} registration approved` : `${params.schoolName} account details`,
    text: `${params.approved ? `Your school registration for ${params.schoolName} has been approved.` : `Your ${params.role} account at ${params.schoolName} is ready.`}${params.temporaryPassword ? ` Temporary password: ${params.temporaryPassword}. You must change it when you first sign in.` : ''}${params.accountIdentifier ? ` Account ID: ${params.accountIdentifier}.` : ''} Sign in at ${signInUrl}.`,
    html,
  })
}

export async function sendInstitutionTransferApprovalEmail(params: { to: string; name: string; schoolName: string; location: string }) {
  const sender = process.env.GMAIL_USER
  if (!sender) throw new Error('Missing required email environment variable: GMAIL_USER must be set.')
  const safe = { name: escapeHtml(params.name), schoolName: escapeHtml(params.schoolName), location: escapeHtml(params.location) }
  const signInUrl = `${getPublicSiteUrl()}/sign-in`
  await getTransporter().sendMail({
    from: `"EL Learners App" <${sender}>`, to: params.to,
    subject: `Institution transfer approved: ${params.schoolName}`,
    text: `Hello ${params.name}, your transfer to ${params.schoolName}, ${params.location}, has been approved. Your previous school records will be cleared within 30 seconds. Report cards remain available.`,
    html: emailShell('Institution transfer approved', `<h1 style="font-size:22px;color:#102b4e;margin:0 0 18px">Institution transfer approved</h1>
      <p style="font-size:15px;line-height:1.6">Hello ${safe.name},</p>
      <p style="font-size:15px;line-height:1.6">Your transfer to <strong>${safe.schoolName}</strong> in <strong>${safe.location}</strong> has been approved by the receiving institution.</p>
      <div style="margin:20px 0;padding:16px;background:#f8fafc;border-left:4px solid #0f766e"><strong>What happens next</strong><br><span style="font-size:14px;line-height:1.6;color:#475569">Your previous school records will be cleared within 30 seconds. Your report cards will remain available in your account.</span></div>
      <p style="margin:24px 0"><a href="${escapeHtml(signInUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:7px;font-weight:700">Sign in to EL Learners</a></p>
      <p style="font-size:12px;color:#64748b">If you did not expect this change, contact your school administrator promptly.</p>`, `EL Learners App · ${safe.schoolName}`),
  })
}
