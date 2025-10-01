const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// ======================= AUTHENTIFICATION =======================

// Inscription d'un utilisateur via Strapi
// POST /auth/register
router.post('/register', authController.register);

// Connexion utilisateur
// POST /auth/login
router.post('/login', authController.login);

// Demande de réinitialisation de mot de passe (envoie email Strapi)
// POST /auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// Réinitialisation du mot de passe via Strapi
// POST /auth/reset-password
// Body attendu : { code, password, passwordConfirmation }
router.post('/reset-password', authController.resetPassword);

// ======================= EXEMPLES DE ROUTES PROTÉGÉES =======================
// Exemple : accessible uniquement aux utilisateurs avec rôle 'Créancier' ou 'Cédant'
router.get('/creances', authMiddleware, roleMiddleware(['Créancier', 'Cédant']), (req, res) => {
  res.json({ message: 'Accès aux créances autorisé', user: req.user });
});

module.exports = router;
