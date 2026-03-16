import nodemailer from "nodemailer";

type SendMailParams = {
  to: string | string[];
  subject: string;
  html: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = requiredEnv("ZOHO_SMTP_HOST");
  const port = Number(requiredEnv("ZOHO_SMTP_PORT"));
  const user = requiredEnv("ZOHO_SMTP_USER");
  const pass = requiredEnv("ZOHO_SMTP_PASS");

  if (!Number.isFinite(port)) {
    throw new Error("ZOHO_SMTP_PORT must be a valid number");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

export async function sendMail({ to, subject, html }: SendMailParams) {
  const from = process.env.ZOHO_SMTP_FROM || process.env.ZOHO_SMTP_USER;
  if (!from) {
    throw new Error("Missing required env var: ZOHO_SMTP_USER");
  }

  return getTransporter().sendMail({
    from: `"RestaurantSOS" <${from}>`,
    to,
    subject,
    html,
  });
}
