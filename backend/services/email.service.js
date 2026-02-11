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

module.exports = { sendEmail };
