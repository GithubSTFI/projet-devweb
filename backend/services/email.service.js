const nodemailer = require('nodemailer');

// Configuration du transporteur SMTP optimisée pour Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Génère un template HTML premium
 */
const getPremiumTemplate = (title, content, buttonText = null, buttonUrl = null) => {
    const buttonHtml = buttonText && buttonUrl ? `
        <div style="margin: 30px 0; text-align: center;">
            <a href="${buttonUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-family: 'Inter', sans-serif; display: inline-block; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);">
                ${buttonText}
            </a>
        </div>
    ` : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #1e293b;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">TaskFlow Manager</h1>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">${title}</h2>
                <div style="line-height: 1.6; color: #475569; font-size: 16px;">
                    ${content}
                </div>
                ${buttonHtml}
            </div>
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
                © 2024 TaskFlow Manager. Tous droits réservés.
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Envoie un email de manière asynchrone
 */
const sendEmail = async (to, subject, text, html) => {
    console.log(`[EMAIL] Tentative d'envoi vers : ${to}...`);
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"TaskFlow Manager" <siewefortune87@gmail.com>',
            to,
            subject,
            text,
            html
        });
        console.log('✅ [EMAIL] Succès ! ID:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ [EMAIL] Erreur critique :', error.message);
        return null;
    }
};

module.exports = { sendEmail, getPremiumTemplate };
