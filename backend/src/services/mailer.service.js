import nodemailer from "nodemailer";

let testAccount = null;

async function getTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Free ethereal test SMTP
  if (!testAccount) {
    try {
      testAccount = await nodemailer.createTestAccount();
    } catch (e) {
      console.warn("Could not create ethereal test account, using simulated delivery:", e.message);
    }
  }

  if (testAccount) {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Fallback direct json transport
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

export async function sendEmail({ to, subject, html, text }) {
  const fromEmail = "pratik.fundsaudit@gmail.com";
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"Yash Group ERP Commercial" <${fromEmail}>`,
    to,
    replyTo: fromEmail,
    subject,
    text: text || "Please find the commercial document attached.",
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl: previewUrl || null,
    sender: fromEmail,
  };
}
