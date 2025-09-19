const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// Inscription et login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Exemple route protégée
router.get('/creances', authMiddleware, roleMiddleware(['Créancier', 'Cédant']), (req, res) => {
  res.json({ message: 'Accès aux créances autorisé', user: req.user });
});

module.exports = router;
