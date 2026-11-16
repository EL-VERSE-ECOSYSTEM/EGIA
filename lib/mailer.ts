import nodemailer from "nodemailer";

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

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
  const html = `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;background:#f5f7fb;padding:24px">
    <div style="background:#0b2545;color:#fff;padding:20px;border-radius:12px 12px 0 0;text-align:center">
      <h2 style="margin:0">EL Learners</h2>
      <p style="margin:6px 0 0;opacity:.85;font-size:13px">Empowering Academic Excellence</p>
    </div>
    <div style="background:#fff;padding:28px;border-radius:0 0 12px 12px">
      <p style="margin:0 0 8px;color:#333;font-size:15px">Your verification code:</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0b2545;text-align:center;padding:18px 0;background:#eef2f9;border-radius:8px;margin:12px 0">
        ${otp}
      </div>
      <p style="color:#555;font-size:13px;margin:12px 0 0">
        This code expires in <strong>10 minutes</strong>. If you didn't request it, ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
      <p style="color:#888;font-size:11px;text-align:center;margin:0">
        © EL Learners — goodnews-app-mu.vercel.app
      </p>
    </div>
  </div>`;

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
  const signInUrl = `${baseUrl}/auth/signin`
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
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:24px auto;background:#f1f5f9;padding:24px;color:#0f172a">
    <div style="background:#fff;border-radius:18px;padding:20px;text-align:center;border:1px solid #e2e8f0">
      <img src="${schoolLogo}" alt="${schoolName} logo" width="72" height="72" style="object-fit:contain;vertical-align:middle;margin:0 12px">
      <img src="${appLogo}" alt="EL Learners App logo" width="150" style="object-fit:contain;vertical-align:middle;margin:0 12px">
    </div>
    <div style="background:#fff;border-radius:18px;padding:28px;margin-top:16px;border:1px solid #e2e8f0">
      <h1 style="font-size:22px;margin:0 0 14px;color:#0b2545">${params.approved ? 'School Registration Approved' : 'Your EL Learners Account'}</h1>
      <p style="font-size:15px;line-height:1.6">Hello ${name},</p>
      <p style="font-size:15px;line-height:1.6">${intro}</p>
      ${identifier}
      ${credentialBlock}
      <p style="margin:22px 0"><a href="${escapeHtml(signInUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px;font-weight:700">Sign in to EL Learners</a></p>
      <p style="font-size:12px;line-height:1.6;color:#64748b">If you did not expect this message, contact your school administrator. Never share your password or verification codes.</p>
    </div>
    <p style="font-size:11px;text-align:center;color:#64748b;margin:16px 0">EL Learners App · ${schoolName}</p>
  </div>`

  await getTransporter().sendMail({
    from: `"EL Learners App" <${sender}>`,
    to: params.to,
    subject: params.approved ? `${params.schoolName} registration approved` : `${params.schoolName} account details`,
    text: `${params.approved ? `Your school registration for ${params.schoolName} has been approved.` : `Your ${params.role} account at ${params.schoolName} is ready.`}${params.temporaryPassword ? ` Temporary password: ${params.temporaryPassword}. You must change it when you first sign in.` : ''}${params.accountIdentifier ? ` Account ID: ${params.accountIdentifier}.` : ''} Sign in at ${signInUrl}.`,
    html,
  })
}
