const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendNotificationEmail(userData, file) {
    const mailOptions = {
        from: process.env.MAIL_FROM,
        to: process.env.NOTIFY_TO,
        cc: process.env.NOTIFY_CC,
        bcc: process.env.NOTIFY_BCC,
        subject: `New KYC & Onboarding Submission: ${userData.firstName} ${userData.lastName}`,
        html: `
            <h3>New User Onboarding Received</h3>
            <ul>
                <li><b>Name:</b> ${userData.firstName} ${userData.lastName}</li>
                <li><b>Email:</b> ${userData.email}</li>
                <li><b>WhatsApp:</b> ${userData.whatsapp}</li>
                <li><b>Platform ID:</b> ${userData.platformId}</li>
                <li><b>Aadhar:</b> [SECURELY STORED]</li>
                <li><b>PAN:</b> [SECURELY STORED]</li>
                <li><b>Investment:</b> $${userData.amount} via ${userData.paymentMethod} (Txn: ${userData.transactionId})</li>
            </ul>
            <p>Please find the payment receipt attached.</p>
        `,
        attachments: [
            {
                filename: file.originalname,
                path: file.path
            }
        ]
    };
    await transporter.sendMail(mailOptions);
}

module.exports = { sendNotificationEmail };