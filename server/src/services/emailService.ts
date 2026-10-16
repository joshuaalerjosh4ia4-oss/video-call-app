import nodemailer from "nodemailer";
import { env } from "../config/env";
import { HttpError } from "../middleware/errorHandler";

async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  if (!env.smtpUser || !env.smtpPassword || !env.smtpFrom) {
    throw new HttpError(503, "Gmail SMTP is not configured. Set SMTP_USER and SMTP_PASSWORD on the server.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: env.smtpUser, pass: env.smtpPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    text,
    html,
  });
}

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  await sendEmail(
    email,
    "Verify your MyClaSSes account",
    `Your MyClaSSes verification code is ${code}. It expires in 10 minutes.`,
    `<p>Your MyClaSSes verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>It expires in 10 minutes.</p>`
  );
}

export async function sendTemporaryPassword(email: string, password: string): Promise<void> {
  await sendEmail(
    email,
    "Your MyClaSSes temporary password",
    `Your temporary password is ${password}. Sign in with it and change your password immediately.`,
    `<p>Your temporary password is:</p><p style="font-size:18px;font-weight:bold">${password}</p><p>Sign in with it and change your password immediately.</p>`
  );
}
