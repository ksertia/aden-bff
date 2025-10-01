const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// ======================= AUTHENTIFICATION =======================

// Inscription
router.post('/register', authController.register);

// Connexion
router.post('/login', authController.login);

// Réinitialisation du mot de passe (Reset Password via Strapi)
// POST /auth/reset-password
router.post('/reset-password', authController.resetPassword);

// ======================= EXEMPLES DE ROUTES PROTÉGÉES =======================
// Exemple route protégée accessible uniquement aux rôles Créancier et Cédant
router.get('/creances', authMiddleware, roleMiddleware(['Créancier', 'Cédant']), (req, res) => {
  res.json({ message: 'Accès aux créances autorisé', user: req.user });
});

module.exports = router;
