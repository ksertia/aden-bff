const EmailService = require('./emailService');  // Assure-toi que l'importation est correcte

class CreationEmailService {
  // Envoyer email de création de compte avec mot de passe
  async sendWelcomeEmail(userEmail, username, password) {
    const subject = 'Votre compte a été créé';
    const htmlContent = `
      <h1>Bienvenue ${username} !</h1>
      <p>Votre compte a été créé avec succès.</p>
      <p><strong>Email :</strong> ${userEmail}</p>
      <p><strong>Mot de passe :</strong> ${password}</p>
      <p>Pour votre sécurité, nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
      <p>Merci de nous rejoindre !</p>
    `;

    try {
      // Appelle correctement la méthode sendEmail définie dans emailService.js
      const result = await EmailService.sendEmail(userEmail, subject, htmlContent);
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      return { success: false, error };
    }
  }
}

module.exports = new CreationEmailService();
