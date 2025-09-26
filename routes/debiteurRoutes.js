// routes/debiteurRoutes.js
const express = require('express');
const router = express.Router();
const debiteurController = require('../controllers/debiteur');  // Importer le contrôleur debiteur.js

// Route pour récupérer les débiteurs
router.get('/debiteurs/:sitename', debiteurController.getDebiteurs);

module.exports = router;
