// services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT   ,
      secure: false, // true pour le port 465, false pour les autres
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Pour éviter les erreurs de certificat
      }
    });
  }

  // Vérifier la connexion SMTP
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Serveur SMTP configuré avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur configuration SMTP:', error);
      return false;
    }
  }

  // Méthode générique pour envoyer des emails
  async sendEmail(to, subject, html) {
    const mailOptions = {
      from: {
        name: process.env.SMTP_FROM_NAME,
        address: process.env.SMTP_FROM_EMAIL
      },
      to: to,
      subject: subject,
      html: html
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé à: ${to}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();