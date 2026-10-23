import nodemailer from "nodemailer";

export function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Missing required email environment variables: GMAIL_USER and GMAIL_APP_PASSWORD must be set.");
  }

  return nodemailer.createTransport({
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
