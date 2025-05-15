require('dotenv').config();
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const configs = require('./config');

const SHEET_ID = process.env.SHEET_ID;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

let senderIndex = 0;
const MAX_PER_EMAIL = 50;

async function getSheetData() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A2:L',
  });
  return res.data.values || [];
}

async function markAsSent(rowNumber) {
  const date = new Date().toISOString();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Sheet1!L${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[date]],
    },
  });
}

async function sendEmail(transporter, to, subject, body) {
  await transporter.sendMail({
    from: `"Shuruwaat" <${transporter.options.auth.user}>`,
    to,
    subject,
    text: body,
  });
}

async function main() {
  const rows = await getSheetData();
  if (rows.length === 0) {
    console.log('No emails to send.');
    return;
  }

  let sentCount = [0, 0]; // For two senders

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = row[0];
    const name = row[1];
    const lastName = row[2];
    const emailOffering = row[9];
    const subject = row[10];
    const sentStatus = row[11];

    if (!email || email.trim() === '') {
      console.log('Empty email, stopping.');
      break;
    }
    if (sentStatus && sentStatus.trim() !== '') {
      continue; // Already sent
    }

    // Rotate sender
    if (sentCount[senderIndex] >= MAX_PER_EMAIL) {
      senderIndex = (senderIndex + 1) % configs.length;
      if (sentCount[senderIndex] >= MAX_PER_EMAIL) {
        console.log('Daily send limit reached for all emails.');
        break;
      }
    }

    const senderConfig = configs[senderIndex];
    const transporter = nodemailer.createTransport({
      host: senderConfig.host,
      port: senderConfig.port,
      secure: senderConfig.secure,
      auth: senderConfig.auth,
    });

    const body = `Hi ${name} ${lastName},\n\n${emailOffering}\n\nBest regards,\nShuruwaat`;

    try {
      await sendEmail(transporter, email, subject, body);
      await markAsSent(i + 2);
      console.log(`Email sent to ${email} from ${senderConfig.email}`);

      sentCount[senderIndex]++;
      senderIndex = (senderIndex + 1) % configs.length;

      // Random delay between 30-90 seconds
      const delay = Math.floor(Math.random() * (90 - 30 + 1) + 30) * 1000;
      await new Promise(r => setTimeout(r, delay));
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error);
    }
  }
}

main().catch(console.error)
