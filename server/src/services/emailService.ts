import nodemailer from "nodemailer";
import { env } from "../config/env";
import { HttpError } from "../middleware/errorHandler";

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  if (!env.smtpHost || !env.smtpFrom) {
    throw new HttpError(503, "Email delivery is not configured on the server");
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser && env.smtpPassword ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
  });

  await transporter.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: "Verify your MyClaSSes account",
    text: `Your MyClaSSes verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your MyClaSSes verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>It expires in 10 minutes.</p>`,
  });
}

export async function sendTemporaryPassword(email: string, password: string): Promise<void> {
  if (!env.smtpHost || !env.smtpFrom) {
    throw new HttpError(503, "Email delivery is not configured on the server");
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser && env.smtpPassword ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
  });

  await transporter.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: "Your MyClaSSes temporary password",
    text: `Your temporary password is ${password}. Sign in with it and change your password immediately.`,
    html: `<p>Your temporary password is:</p><p style="font-size:18px;font-weight:bold">${password}</p><p>Sign in with it and change your password immediately.</p>`,
  });
}