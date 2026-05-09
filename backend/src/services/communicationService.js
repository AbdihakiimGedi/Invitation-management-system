const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

/**
 * Creates and returns the Nodemailer transporter.
 * Returns null if email credentials are not configured.
 */
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || user === 'your_gmail@gmail.com' || !pass || pass === 'your_gmail_app_password_here') {
    return null; // Not configured
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user, pass },
  });
}

function singularizeTypeName(typeName) {
  const label = String(typeName || 'Guest').trim();
  return label.endsWith('s') ? label.slice(0, -1) : label;
}

/**
 * Generates the invitation e
 * mail HTML body.
 */
function buildEmailHTML({ fullName, eventName, groupName, qrTokens, qty, eventLocation, eventDate, eventTime, participantTypeName, portalCredential }) {
  const tokens = Array.isArray(qrTokens) ? qrTokens : (qrTokens ? [qrTokens] : []);
  const invitationLabel = singularizeTypeName(participantTypeName);

  const qrSectionsHtml = tokens.map((token, idx) => `
          <div class="qr-section">
            <p>Scan QR code ${qty > 1 ? `#${idx + 1}` : ''} at the entrance:</p>
            <img src="cid:qrcode_image_${idx}" alt="QR Code" width="200" height="200" />
            <div class="token-box">Token: ${token}</div>
          </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; text-align: center; padding: 30px 20px; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
        .header p { margin: 5px 0 0; opacity: 0.8; font-size: 14px; }
        .body { padding: 30px; text-align: center; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 10px; }
        .info-box { background: #f8f9ff; border: 1px solid #e0e4ff; border-radius: 8px; padding: 15px 20px; margin: 20px 0; text-align: left; }
        .info-box p { margin: 5px 0; color: #555; font-size: 14px; }
        .info-box strong { color: #1a1a2e; }
        .qr-section { margin: 25px 0; }
        .qr-section p { color: #666; font-size: 13px; margin-bottom: 10px; }
        .qr-section img { border: 4px solid #1a1a2e; border-radius: 8px; padding: 5px; }
        .token-box { background: #1a1a2e; color: #a0aec0; font-family: monospace; font-size: 11px; padding: 10px; border-radius: 6px; word-break: break-all; margin: 15px 0; }
        .footer { background: #f4f4f4; text-align: center; padding: 15px; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${invitationLabel} Invitation</h1>
          <p>${eventName}</p>
        </div>
        <div class="body">
          <p class="greeting">Hello ${fullName},</p>
          <p style="color:#555;">You are officially invited as ${invitationLabel}.</p>
          
          <div class="info-box">
            <p>📌 <strong>Event:</strong> ${eventName}</p>
            <p>📍 <strong>Location:</strong> ${eventLocation}</p>
            <p>📅 <strong>Date:</strong> ${eventDate}</p>
            <p>⏰ <strong>Time:</strong> ${eventTime}</p>
            <p>🪑 <strong>Seat Group:</strong> ${groupName}</p>
            ${qty > 1 ? `<p>🎟 <strong>Tickets:</strong> ${qty} individual entry QR codes below</p>` : ''}
            ${portalCredential ? `
              <p><strong>Portal Username:</strong> ${portalCredential.username}</p>
              <p><strong>Portal Password:</strong> ${portalCredential.password}</p>
            ` : ''}
          </div>

          ${qrSectionsHtml}
          
          <p style="color:#e74c3c; font-size:12px;"><strong> Do not share these QR codes — they are valid for one-time entry only.</strong></p>
        </div>
        <div class="footer">
          This is an automated message. Please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
  `;
}

const CommunicationService = {
  async sendNotification(to, subject, message) {
    if (!to) return false;

    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[MAIL-MOCK] Would notify ${to}: ${subject} - ${message}`);
      console.warn('[MAIL] Email not configured. Set EMAIL_USER and EMAIL_PASS in .env to send real emails.');
      return false;
    }

    try {
      const fromName = process.env.EMAIL_FROM_NAME || 'Developing Team Group 36';
      const fromEmail = process.env.EMAIL_USER;
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:30px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
            <h2 style="margin-top:0;color:#111827;">${subject}</h2>
            <p style="color:#374151;line-height:1.6;">${message}</p>
          </div>
        `
      });
      return true;
    } catch (err) {
      console.error(`[MAIL] Failed to send notification to ${to}:`, err.message);
      return false;
    }
  },

  /**
   * Sends a real invitation email with the QR code embedded.
   */
  async sendEmail(to, subject, data) {
    if (!to) return false;

    const transporter = createTransporter();
    const tokens = Array.isArray(data.qrTokens) ? data.qrTokens : (data.qrToken ? [data.qrToken] : []);

    if (!transporter) {
      // Fallback: log to console if email is not configured
      console.log(`[MAIL-MOCK] Would send to ${to}: ${subject} (Tickets: ${tokens.length})`);
      console.warn('[MAIL] Email not configured. Set EMAIL_USER and EMAIL_PASS in .env to send real emails.');
      return false;
    }

    try {
      const attachments = [];
      for (let i = 0; i < tokens.length; i++) {
        const qrImageBuffer = await QRCode.toBuffer(tokens[i], {
          errorCorrectionLevel: 'H',
          width: 300,
          margin: 2,
        });
        attachments.push({
          filename: `invitation-qr-${i + 1}.png`,
          content: qrImageBuffer,
          cid: `qrcode_image_${i}`,
        });
      }

      const fromName = process.env.EMAIL_FROM_NAME || 'Developing Team Group 36';
      const fromEmail = process.env.EMAIL_USER;

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html: buildEmailHTML({
          fullName: data.fullName || subject,
          eventName: data.eventName || 'Cremony Inviattion',
          groupName: data.groupName || 'General',
          qrTokens: tokens,
          qty: data.qty || 1,
          eventLocation: data.eventLocation || 'TBD',
          eventDate: data.eventDate || 'TBD',
          eventTime: data.eventTime || 'TBD',
          participantTypeName: data.participantTypeName,
          portalCredential: data.portalCredential,
        }),
        attachments,
      });

      console.log(`[MAIL] ✅ Email sent to ${to}: ${subject}`);
      return true;
    } catch (err) {
      console.error(`[MAIL]  Failed to send email to ${to}:`, err.message);
      return false;
    }
  },

  /**
   * WhatsApp sending via Twilio (if configured) or logs a message.
   * To enable: npm install twilio and set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env
   */
  async sendWhatsApp(phone, message, data) {
    if (!phone) return false;

    const twilioSid = process.env.TWILIO_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. 'whatsapp:+14155238886'
    
    const tokens = Array.isArray(data.qrTokens) ? data.qrTokens : (data.qrToken ? [data.qrToken] : []);

    if (!twilioSid || !twilioToken || !twilioFrom) {
      // Fallback: log to console
      console.log(`[WHATSAPP-MOCK] Would send to ${phone}:\n${message}\n(Tickets: ${tokens.length})`);
      return false;
    }

    try {
      const twilio = require('twilio')(twilioSid, twilioToken);
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      const tokensText = tokens.map((t, idx) => `Ticket ${idx+1}: ${t}`).join('\n');

      await twilio.messages.create({
        from: twilioFrom,
        to: `whatsapp:${formattedPhone}`,
        body: `${message}\n\n🎫 Your invitation tokens:\n${tokensText}`,
      });

      console.log(`[WHATSAPP] ✅ Message sent to ${phone}`);
      return true;
    } catch (err) {
      console.error(`[WHATSAPP] ❌ Failed to send WhatsApp to ${phone}:`, err.message);
      return false;
    }
  },
};

module.exports = CommunicationService;
