// routes/debiteurRoutes.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message');  // Importer le contrôleur debiteur.js

// Route pour récupérer les débiteurs
router.post('/message/:sitename', messageController.createMessage);

module.exports = router;