import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM_EMAIL = `"Smart Expense Approver" <${process.env.GMAIL_USER}>`;

export async function sendEmployeeDecisionEmail(
  toEmail: string,
  expense: { amount: number; category: string; decision: string; reasoning: string }
) {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Your expense was ${expense.decision}`,
      html: `
        <p>Your expense of <strong>$${expense.amount}</strong> (${expense.category}) has been <strong>${expense.decision}</strong>.</p>
        <p><strong>Reasoning:</strong> ${expense.reasoning}</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send employee decision email:", err);
  }
}

export async function sendManagerFlagEmail(
  toEmail: string,
  expense: { amount: number; category: string; reasoning: string; employeeName?: string }
) {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Expense flagged for your review`,
      html: `
        <p>An expense of <strong>$${expense.amount}</strong> (${expense.category}) has been flagged and needs your review.</p>
        <p><strong>Agent reasoning:</strong> ${expense.reasoning}</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send manager flag email:", err);
  }
}

export async function sendOverrideNotificationEmail(
  toEmail: string,
  expense: { amount: number; category: string; overrideDecision: string }
) {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Your expense was ${expense.overrideDecision} by a manager`,
      html: `
        <p>Your flagged expense of <strong>$${expense.amount}</strong> (${expense.category}) has been <strong>${expense.overrideDecision}</strong> by a manager.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send override notification email:", err);
  }
}