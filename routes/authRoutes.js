const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const router = express.Router();

// ======================= AUTHENTIFICATION PUBLIQUE =======================
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

// ======================= ROUTES PROTÉGÉES (AUTHENTIFICATION REQUISE) =======================

//  Changer le mot de passe (utilisateur connecté uniquement)
// POST /auth/change-password
// Body : { currentPassword, password, passwordConfirmation }
// Headers : Authorization: Bearer <token>
router.post('/change-password', authMiddleware, authController.changePassword);

//  Rechercher un utilisateur par email (admin ou utilisateurs autorisés)
// GET /auth/users/search/:email
//  IMPORTANT : Cette route doit être AVANT /users/:id pour éviter les conflits
router.get('/users/search/:email', authMiddleware, authController.getUserByEmail);

//  Mettre à jour les informations d'un utilisateur
// PUT /auth/users/:id
// Body : { firstname, lastname, nodeId, etc. }
// Headers : Authorization: Bearer <token>
// Note : L'utilisateur ne peut modifier que son propre profil, sauf s'il est admin
router.put('/users/:id', authMiddleware, authController.updateUser);

//  Récupérer les informations de l'utilisateur connecté
// GET /auth/me
router.get('/me', authMiddleware, authController.getMe);

// ======================= EXEMPLES DE ROUTES PROTÉGÉES PAR RÔLE =======================
// Exemple : accessible uniquement aux utilisateurs avec rôle 'Créancier' ou 'Cédant'
router.get('/creances', 
  authMiddleware, 
  roleMiddleware(['Créancier', 'Cédant']), 
  (req, res) => {
    res.json({ message: 'Accès aux créances autorisé', user: req.user });
  }
);

module.exports = router;
