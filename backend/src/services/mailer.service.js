import nodemailer from "nodemailer";

let testAccount = null;

async function getTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isGmail =
      process.env.SMTP_SERVICE?.toLowerCase() === "gmail" ||
      process.env.SMTP_HOST?.includes("gmail.com") ||
      process.env.SMTP_USER?.includes("@gmail.com");

    if (isGmail) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          // Strip any whitespaces from Google App Password
          pass: process.env.SMTP_PASS.replace(/\s+/g, ""),
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Free ethereal test SMTP for development
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

export async function sendEmail({ to, subject, html, text, attachments = [] }) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "pratik@fundsaudit.com";
  const fromName = process.env.SMTP_FROM_NAME || "Yash Earthing Solutions Pvt Ltd";
  const transporter = await getTransporter();

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    replyTo: fromEmail,
    subject,
    text: text || "Please find the commercial document attached.",
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl: previewUrl || null,
    sender: fromEmail,
  };
}
