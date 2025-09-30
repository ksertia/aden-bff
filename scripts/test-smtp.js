// test-smtp.js
require('dotenv').config();
const emailService = require('../services/emailService');

async function testSMTP() {
  console.log('🧪 Test de configuration SMTP...\n');

  // 1. Test connexion SMTP
  console.log('1. Test de connexion SMTP...');
  const isConnected = await emailService.verifyConnection();
  
  if (!isConnected) {
    console.log('❌ Échec de la connexion SMTP');
    console.log('🔧 Vérifiez :');
    console.log('   - Vos identifiants SMTP dans .env');
    console.log('   - Le mot de passe d\'application Gmail');
    console.log('   - L\'authentification 2 facteurs activée');
    return;
  }

  console.log('✅ Connexion SMTP réussie\n');

  // 2. Test envoi d'email
  console.log('2. Test d\'envoi d\'email...');
  try {
    const testHtml = `
      <h1>Test SMTP Réussi!</h1>
      <p>Votre configuration Nodemailer fonctionne correctement.</p>
      <p>Date: ${new Date().toLocaleString()}</p>
    `;

    const result = await emailService.sendEmail(
      process.env.SMTP_USER, // Envoyer à vous-même pour tester
      'Test Configuration Nodemailer ✅',
      testHtml
    );

    console.log('✅ Email de test envoyé avec succès!');
    console.log(`📧 Message ID: ${result.messageId}`);
    
  } catch (error) {
    console.log('❌ Échec envoi email:', error.message);
  }
}

testSMTP();