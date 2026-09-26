import nodemailer from "nodemailer";
import { env } from "../config/env";
import { HttpError } from "../middleware/errorHandler";

async function sendEmail(to: string, subject: string, text: string, html: string): Promise<void> {
  if (env.resendApiKey) {
    if (!env.resendFrom) {
      throw new HttpError(503, "RESEND_FROM is not configured on the server");
    }

    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: env.resendFrom, to: [to], subject, text, html }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new HttpError(502, "Email provider timed out or could not be reached");
    }

    if (!response.ok) {
      console.error("Resend email request failed with status", response.status);
      throw new HttpError(502, "Email provider could not send the message");
    }
    return;
  }

  if (!env.smtpHost || !env.smtpFrom) {
    throw new HttpError(503, "Email delivery is not configured on the server");
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser && env.smtpPassword ? { user: env.smtpUser, pass: env.smtpPassword } : undefined,
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